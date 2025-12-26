/**
 * API ENDPOINT: /api/webhooks/asana
 * 
 * Webhook receiver per eventi Asana
 * 
 * Gestisce:
 * - Task creato (da admin su Asana) → crea ticket su Firestore e notifica cliente
 * - Nuovi commenti (stories) su task → notifica cliente
 * - Cambio stato task (completato) → chiude ticket e notifica cliente
 * - Cambio stato task (riaperto) → riapre ticket e notifica cliente
 * - Cambio nome task → aggiorna titolo in Firestore
 * - Story "marked_complete" → chiude ticket (più affidabile)
 * - Story "marked_incomplete" → riapre ticket
 * 
 * FLUSSO quando admin crea ticket su Asana:
 * 1. Asana invia webhook con task/added
 * 2. Backend recupera custom field task_creator_id dal task
 * 3. Recupera dati cliente da Firestore usando task_creator_id
 * 4. Crea ticket su Firestore con dati cliente
 * 5. Invia webhook evento a GHL per workflow nuovo ticket
 * 
 * FLUSSO quando admin risponde su Asana:
 * 1. Asana invia webhook con story/comment
 * 2. Backend recupera client_id dal custom field del task
 * 3. Aggiorna Firestore: last_message_by = "admin", waiting_for = "client"
 * 4. Invia notifica WhatsApp al cliente via GHL
 * 5. Invia webhook evento a GHL per automazioni
 * 
 * FLUSSO quando cambia nome task:
 * 1. Asana invia webhook con task/name changed
 * 2. Backend aggiorna il campo title su Firestore
 * 
 * FLUSSO quando task viene completato:
 * 1. Asana invia webhook con story/marked_complete (metodo principale)
 * 2. OPPURE Asana invia webhook con task/completed changed (metodo alternativo)
 * 3. Backend chiude il ticket su Firestore (status = 'closed')
 * 4. Invia webhook evento a GHL per workflow chiusura ticket
 * 
 * FLUSSO quando task viene riaperto:
 * 1. Asana invia webhook con story/marked_incomplete
 * 2. Backend riapre il ticket su Firestore (status = 'open', waiting_for = 'client')
 * 3. Invia webhook evento a GHL per workflow riapertura ticket
 * 
 * NOTA: Asana richiede handshake iniziale con X-Hook-Secret
 * 
 * TEST: POST /api/webhooks/asana/test con payload di esempio
 */

import { sendTicketClosedEvent, sendTicketReopenedEvent, sendTicketRepliedByAdminEvent, sendTicketCreatedEvent } from '@/lib/ghl/ghlService';
import { closeTicket, getTicket, reopenTicket, updateTicketOnReply, updateTicket, createTicket, getUserById } from '@/lib/ticket/ticketService';
import { getStory, getTaskDetail } from '@/lib/asana/asanaService';
import { NextApiRequest, NextApiResponse } from 'next';

// Disabilita body parser per ricevere raw body
export const config = {
  api: {
    bodyParser: true,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Gestione handshake Asana (prima chiamata per verificare webhook)
  const hookSecret = req.headers['x-hook-secret'];
  if (hookSecret) {
    res.setHeader('X-Hook-Secret', hookSecret);
    return res.status(200).end();
  }

  // Solo POST per eventi
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { events } = req.body;

    if (!events || !Array.isArray(events)) {
      return res.status(400).json({ message: 'Invalid webhook payload' });
    }

    for (const event of events) {
      await processAsanaEvent(event);
    }

    return res.status(200).json({ success: true, processed: events.length });
  } catch (error: any) {
    console.error('[Asana Webhook] Errore:', error);
    return res.status(500).json({ message: error.message });
  }
}

/**
 * Processa un singolo evento Asana
 */
async function processAsanaEvent(event: any): Promise<void> {
  const { action, resource, parent, change } = event;

  // Evento: Task creato (da admin su Asana)
  if (resource?.resource_type === 'task' && action === 'added') {
    await handleTaskCreated(event);
    return;
  }

  // Evento: Custom fields del task modificati (per catturare quando viene settato task_creator_id)
  if (resource?.resource_type === 'task' && action === 'changed' && event.change?.field === 'custom_fields') {
    await handleTaskCustomFieldsChanged(event);
    return;
  }

  // Evento: Story di completamento task (più affidabile)
  if (resource?.resource_type === 'story' && action === 'added' && resource?.resource_subtype === 'marked_complete') {
    await handleTaskMarkedComplete(event);
    return;
  }

  // Evento: Story di riapertura task
  if (resource?.resource_type === 'story' && action === 'added' && resource?.resource_subtype === 'marked_incomplete') {
    await handleTaskMarkedIncomplete(event);
    return;
  }

  // Evento: Nuovo commento su task (escludi i sottotipi speciali)
  if (resource?.resource_type === 'story' && action === 'added' && resource?.resource_subtype === 'comment_added') {
    await handleNewStory(event);
    return;
  }

  // Evento: Nome task modificato
  if (resource?.resource_type === 'task' && action === 'changed' && event.change?.field === 'name') {
    await handleTaskNameChanged(event);
    return;
  }

  // Evento non gestito
}

/**
 * Gestisce un nuovo commento (story) su un task
 * Se il commento è dell'admin, notifica il cliente
 */
async function handleNewStory(event: any): Promise<void> {
  const { resource, parent } = event;
  const storyGid = resource?.gid;
  const taskGid = parent?.gid;

  if (!taskGid) {
    return;
  }

  // Verifica se il commento è di tipo "comment" (non system)
  // e se è stato creato da qualcuno diverso dal cliente
  const storyType = resource?.resource_subtype;
  if (storyType !== 'comment_added') {
    return;
  }

  try {
    // Recupera ticket da Firestore
    const ticket = await getTicket(taskGid);
    if (!ticket) {
      return;
    }

    // Recupera i dettagli della story per controllare se è una risposta del cliente
    const storyDetails = await getStory(storyGid);
    const storyText = storyDetails?.data?.text || '';

    // Se il testo inizia con il marcatore invisibile, è una risposta del cliente creata dal sistema, ignora
    const marker = '\u200B'; // Zero-width space
    if (storyText.startsWith(marker)) {
      return;
    }
    
    // È una risposta manuale dell'admin su Asana
    await updateTicketOnReply({
      ticketId: taskGid,
      repliedBy: 'admin',
    });

    // Invia notifica al cliente via GHL
    if (ticket.ghlContactId) {
      // Invia webhook evento a GHL
      await sendTicketRepliedByAdminEvent({
        clientId: ticket.clientId,
        ghlContactId: ticket.ghlContactId,
        ticketId: taskGid,
      });
    }
  } catch (error: any) {
    console.error('[Asana Webhook] Errore gestione story:', error.message);
  }
}

/**
 * Gestisce cambio nome task
 */
async function handleTaskNameChanged(event: any): Promise<void> {
  const { resource } = event;
  const taskGid = resource?.gid;

  if (!taskGid) {
    return;
  }

  try {
    // Recupera il task aggiornato da Asana per ottenere il nuovo nome
    const taskResponse = await getTaskDetail(taskGid);
    const newName = taskResponse?.data?.name;

    if (!newName) {
      return;
    }

    // Recupera ticket da Firestore per verificare che esista
    const ticket = await getTicket(taskGid);

    if (!ticket) {
      return;
    }

    // Aggiorna il titolo del ticket su Firestore
    await updateTicket(taskGid, { title: newName });
  } catch (error: any) {
    console.error('[Asana Webhook] Errore aggiornamento nome task:', error.message, error.stack);
  }
}

/**
 * Gestisce completamento task
 */
async function handleTaskChanged(event: any): Promise<void> {
  const { resource, change } = event;
  const taskGid = resource?.gid;

  if (!taskGid) {
    return;
  }

  // Gestisci solo eventi di cambio del campo 'completed'
  if (change?.field !== 'completed' || change?.action !== 'changed') {
    return;
  }

  try {
    // Recupera il task da Asana per verificare lo stato attuale
    const taskResponse = await getTaskDetail(taskGid);
    const isCompleted = taskResponse?.data?.completed;

    if (!isCompleted) {
      return;
    }

    // Recupera ticket da Firestore
    const ticket = await getTicket(taskGid);

    if (!ticket) {
      return;
    }

    // Verifica se il ticket non è già chiuso
    if (ticket.status === 'closed') {
      return;
    }

    // Chiudi il ticket su Firestore
    await closeTicket(taskGid);

    // Invia notifica a GHL
    if (ticket.ghlContactId) {
      const ghlResult = await sendTicketClosedEvent({
        clientId: ticket.clientId,
        ghlContactId: ticket.ghlContactId,
        ticketId: taskGid,
      });
    }
  } catch (error: any) {
    console.error('[Asana Webhook] Errore chiusura ticket:', error.message, error.stack);
  }
}

/**
 * Gestisce story di completamento task (più affidabile del change event)
 */
async function handleTaskMarkedComplete(event: any): Promise<void> {
  const { resource, parent } = event;
  const taskGid = parent?.gid;

  if (!taskGid) {
    return;
  }

  try {
    // Recupera ticket da Firestore
    const ticket = await getTicket(taskGid);

    if (!ticket) {
      return;
    }

    // Verifica se il ticket non è già chiuso
    if (ticket.status === 'closed') {
      return;
    }

    // Chiudi il ticket su Firestore
    await closeTicket(taskGid);

    // Invia notifica a GHL
    if (ticket.ghlContactId) {
      const ghlResult = await sendTicketClosedEvent({
        clientId: ticket.clientId,
        ghlContactId: ticket.ghlContactId,
        ticketId: taskGid,
      });
    }

  } catch (error: any) {
    console.error('[Asana Webhook] Errore riapertura ticket da story:', error.message, error.stack);
  }
}
/**
 * Gestisce story di riapertura task (contrassegnato come incompleto)
 */
async function handleTaskMarkedIncomplete(event: any): Promise<void> {
  const { resource, parent } = event;
  const taskGid = parent?.gid;

  if (!taskGid) {
    return;
  }

  try {
    // Recupera ticket da Firestore
    const ticket = await getTicket(taskGid);

    if (!ticket) {
      return;
    }

    // Verifica se il ticket è già aperto
    if (ticket.status === 'open') {
      return;
    }

    // Riapri il ticket su Firestore (riaperto dall'admin)
    await reopenTicket(taskGid, 'admin');

    // Invia notifica a GHL
    if (ticket.ghlContactId) {
      const ghlResult = await sendTicketReopenedEvent({
        clientId: ticket.clientId,
        ghlContactId: ticket.ghlContactId,
        ticketId: taskGid,
        reopenedBy: 'admin',
      });
    }

  } catch (error: any) {
    console.error('[Asana Webhook] Errore riapertura ticket da story:', error.message, error.stack);
  }
}

/**
 * Gestisce creazione task (da admin su Asana)
 */
async function handleTaskCreated(event: any): Promise<void> {
  const { resource } = event;
  const taskGid = resource?.gid;

  if (!taskGid) {
    return;
  }

  try {
    // Recupera i dettagli del task da Asana per ottenere custom fields
    const taskResponse = await getTaskDetail(taskGid);
    const taskData = taskResponse?.data;

    if (!taskData) {
      return;
    }

    // Trova il custom field task_creator_id
    const taskCreatorField = taskData.custom_fields?.find(
      (field: any) => field.gid === process.env.ASANA_TASK_CREATOR_ID_CUSTOM_FIELD
    );

    const taskCreatorId = taskCreatorField?.text_value || taskCreatorField?.enum_value?.gid;

    if (!taskCreatorId) {
      return;
    }

    // Recupera i dati del cliente da Firestore
    const client = await getUserById(taskCreatorId);

    if (!client) {
      return;
    }

    // Trova altri custom fields per priorità, nome, telefono
    const priorityField = taskData.custom_fields?.find(
      (field: any) => field.gid === process.env.ASANA_TASK_PRIORITY_CUSTOM_FIELD
    );
    const creatorNameField = taskData.custom_fields?.find(
      (field: any) => field.gid === process.env.ASANA_TASK_CREATOR_NAME_CUSTOM_FIELD
    );
    const creatorPhoneField = taskData.custom_fields?.find(
      (field: any) => field.gid === process.env.ASANA_TASK_CREATOR_PHONE_CUSTOM_FIELD
    );

    // Determina priorità
    let priority: 'low' | 'medium' | 'high' = 'medium'; // default
    if (priorityField?.enum_value?.gid === process.env.ASANA_PRIORITY_LOW_OPTION_GID) {
      priority = 'low';
    } else if (priorityField?.enum_value?.gid === process.env.ASANA_PRIORITY_HIGH_OPTION_GID) {
      priority = 'high';
    }

    const clientName = creatorNameField?.text_value || `${client.firstName} ${client.lastName}`;
    const clientPhone = creatorPhoneField?.text_value || client.phone;
    const clientEmail = client.email;

    // Verifica se il ticket esiste già (per evitare duplicati)
    const existingTicket = await getTicket(taskGid);
    if (existingTicket) {
      return;
    }

    // Crea il ticket su Firestore
    const ticket = await createTicket({
      ticketId: taskGid,
      clientId: taskCreatorId,
      ghlContactId: client.ghl_contact_id,
      title: taskData.name,
      priority,
      clientName,
      clientPhone,
      clientEmail,
    });

    // Invia notifica a GHL
    if (client.ghl_contact_id) {
      const ghlResult = await sendTicketCreatedEvent({
        clientId: taskCreatorId,
        ghlContactId: client.ghl_contact_id,
        ticketId: taskGid,
        title: taskData.name,
        priority,
        clientName,
        clientPhone,
      });
    }

  } catch (error: any) {
    console.error('[Asana Webhook] Errore creazione ticket da task:', error.message, error.stack);
  }
}

/**
 * Gestisce modifica custom fields del task (per catturare quando viene settato task_creator_id)
 */
async function handleTaskCustomFieldsChanged(event: any): Promise<void> {
  const { resource } = event;
  const taskGid = resource?.gid;

  if (!taskGid) {
    return;
  }

  try {
    // Recupera i dettagli del task da Asana per ottenere i custom fields aggiornati
    const taskResponse = await getTaskDetail(taskGid);
    const taskData = taskResponse?.data;

    if (!taskData) {
      return;
    }

    // Trova il custom field task_creator_id
    const taskCreatorField = taskData.custom_fields?.find(
      (field: any) => field.gid === process.env.ASANA_TASK_CREATOR_ID_CUSTOM_FIELD
    );

    const taskCreatorId = taskCreatorField?.text_value || taskCreatorField?.enum_value?.gid;

    if (!taskCreatorId) {
      return;
    }

    // Verifica se il ticket esiste già (per evitare duplicati)
    const existingTicket = await getTicket(taskGid);
    if (existingTicket) {
      return;
    }

    // Recupera i dati del cliente da Firestore
    const client = await getUserById(taskCreatorId);

    if (!client) {
      return;
    }

    // Trova altri custom fields per priorità, nome, telefono
    const priorityField = taskData.custom_fields?.find(
      (field: any) => field.gid === process.env.ASANA_TASK_PRIORITY_CUSTOM_FIELD
    );
    const creatorNameField = taskData.custom_fields?.find(
      (field: any) => field.gid === process.env.ASANA_TASK_CREATOR_NAME_CUSTOM_FIELD
    );
    const creatorPhoneField = taskData.custom_fields?.find(
      (field: any) => field.gid === process.env.ASANA_TASK_CREATOR_PHONE_CUSTOM_FIELD
    );

    // Determina priorità
    let priority: 'low' | 'medium' | 'high' = 'medium'; // default
    if (priorityField?.enum_value?.gid === process.env.ASANA_PRIORITY_LOW_OPTION_GID) {
      priority = 'low';
    } else if (priorityField?.enum_value?.gid === process.env.ASANA_PRIORITY_HIGH_OPTION_GID) {
      priority = 'high';
    }

    const clientName = creatorNameField?.text_value || `${client.firstName} ${client.lastName}`;
    const clientPhone = creatorPhoneField?.text_value || client.phone;
    const clientEmail = client.email;

    // Crea il ticket su Firestore
    const ticket = await createTicket({
      ticketId: taskGid,
      clientId: taskCreatorId,
      ghlContactId: client.ghl_contact_id,
      title: taskData.name,
      priority,
      clientName,
      clientPhone,
      clientEmail,
    });

    // Invia notifica a GHL
    if (client.ghl_contact_id) {
      const ghlResult = await sendTicketCreatedEvent({
        clientId: taskCreatorId,
        ghlContactId: client.ghl_contact_id,
        ticketId: taskGid,
        title: taskData.name,
        priority,
        clientName,
        clientPhone,
      });
    }

  } catch (error: any) {
    console.error('[Asana Webhook] Errore creazione ticket da custom fields changed:', error.message, error.stack);
  }
}