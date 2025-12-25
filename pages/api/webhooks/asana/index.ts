/**
 * API ENDPOINT: /api/webhooks/asana
 * 
 * Webhook receiver per eventi Asana
 * 
 * Gestisce:
 * - Nuovi commenti (stories) su task → notifica cliente
 * - Cambio stato task (completato) → chiude ticket e notifica cliente
 * - Cambio stato task (riaperto) → riapre ticket e notifica cliente
 * - Cambio nome task → aggiorna titolo in Firestore
 * - Story "marked_complete" → chiude ticket (più affidabile)
 * - Story "marked_incomplete" → riapre ticket
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

import { sendTicketClosedEvent, sendTicketReopenedEvent, sendTicketRepliedByAdminEvent } from '@/lib/ghl/ghlService';
import { closeTicket, getTicket, reopenTicket, updateTicketOnReply, updateTicket } from '@/lib/ticket/ticketService';
import { getStory, getTaskDetail } from '@/lib/asana/asanaService';
import { NextApiRequest, NextApiResponse } from 'next';

// Disabilita body parser per ricevere raw body
export const config = {
  api: {
    bodyParser: true,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('[Asana Webhook] Handler called:', {
    method: req.method,
    headers: req.headers,
    body: req.body
  });

  // Gestione handshake Asana (prima chiamata per verificare webhook)
  const hookSecret = req.headers['x-hook-secret'];
  if (hookSecret) {
    console.log('[Asana Webhook] Handshake received, responding with X-Hook-Secret');
    res.setHeader('X-Hook-Secret', hookSecret);
    return res.status(200).end();
  }

  // Solo POST per eventi
  if (req.method !== 'POST') {
    console.log('[Asana Webhook] Method not allowed:', req.method);
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { events } = req.body;

    console.log('[Asana Webhook] Received webhook payload:', {
      events_count: events?.length,
      events: events
    });

    if (!events || !Array.isArray(events)) {
      return res.status(400).json({ message: 'Invalid webhook payload' });
    }

    for (const event of events) {
      console.log('[Asana Webhook] Processing event:', event);
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

  console.log('[Asana Webhook] Processing event details:', {
    action,
    resource_type: resource?.resource_type,
    resource_subtype: resource?.resource_subtype,
    change_field: change?.field,
    change_action: change?.action,
    resource_gid: resource?.gid,
    parent_gid: parent?.gid,
    full_event: JSON.stringify(event, null, 2)
  });

  // Evento: Story di completamento task (più affidabile)
  if (resource?.resource_type === 'story' && action === 'added' && resource?.resource_subtype === 'marked_complete') {
    console.log('[Asana Webhook] Handling task marked complete story event');
    await handleTaskMarkedComplete(event);
    return;
  }

  // Evento: Story di riapertura task
  if (resource?.resource_type === 'story' && action === 'added' && resource?.resource_subtype === 'marked_incomplete') {
    console.log('[Asana Webhook] Handling task marked incomplete story event');
    await handleTaskMarkedIncomplete(event);
    return;
  }

  // Evento: Nuovo commento su task (escludi i sottotipi speciali)
  if (resource?.resource_type === 'story' && action === 'added' && resource?.resource_subtype === 'comment_added') {
    console.log('[Asana Webhook] Handling new story event');
    await handleNewStory(event);
    return;
  }

  // Evento: Nome task modificato
  if (resource?.resource_type === 'task' && action === 'changed' && event.change?.field === 'name') {
    console.log('[Asana Webhook] Handling task name changed event');
    await handleTaskNameChanged(event);
    return;
  }

  // Evento non gestito
  console.log('[Asana Webhook] Event not handled:', {
    action,
    resource_type: resource?.resource_type,
    change_field: change?.field
  });
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

  console.log('[Asana Webhook] Handling task name changed:', {
    taskGid,
    full_change: event.change
  });

  if (!taskGid) {
    console.log('[Asana Webhook] Missing taskGid, skipping');
    return;
  }

  try {
    // Recupera il task aggiornato da Asana per ottenere il nuovo nome
    console.log('[Asana Webhook] Fetching updated task from Asana');
    const taskResponse = await getTaskDetail(taskGid);
    const newName = taskResponse?.data?.name;

    console.log('[Asana Webhook] Retrieved task from Asana:', {
      taskGid,
      newName,
      full_response: taskResponse
    });

    if (!newName) {
      console.log('[Asana Webhook] No name found in Asana task, skipping');
      return;
    }

    // Recupera ticket da Firestore per verificare che esista
    const ticket = await getTicket(taskGid);
    console.log('[Asana Webhook] Retrieved ticket from Firestore:', ticket ? 'FOUND' : 'NOT FOUND', ticket?.title);

    if (!ticket) {
      console.log('[Asana Webhook] Ticket not found in Firestore, skipping update');
      return;
    }

    // Aggiorna il titolo del ticket su Firestore
    await updateTicket(taskGid, { title: newName });
    console.log('[Asana Webhook] Successfully updated ticket title in Firestore:', { taskGid, oldTitle: ticket.title, newTitle: newName });
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

  console.log('[Asana Webhook] Handling task completion:', {
    taskGid,
    change_field: change?.field,
    change_action: change?.action,
    full_change: change
  });

  if (!taskGid) {
    console.log('[Asana Webhook] Missing taskGid, skipping');
    return;
  }

  // Gestisci solo eventi di cambio del campo 'completed'
  if (change?.field !== 'completed' || change?.action !== 'changed') {
    console.log('[Asana Webhook] Not a completion change event, skipping');
    return;
  }

  try {
    // Recupera il task da Asana per verificare lo stato attuale
    console.log('[Asana Webhook] Fetching task from Asana to check completion status');
    const taskResponse = await getTaskDetail(taskGid);
    const isCompleted = taskResponse?.data?.completed;

    console.log('[Asana Webhook] Task completion status from Asana:', {
      taskGid,
      isCompleted,
      full_response: taskResponse
    });

    if (!isCompleted) {
      console.log('[Asana Webhook] Task is not completed according to Asana, skipping');
      return;
    }

    // Recupera ticket da Firestore
    const ticket = await getTicket(taskGid);
    console.log('[Asana Webhook] Retrieved ticket from Firestore:', ticket ? 'FOUND' : 'NOT FOUND', ticket?.status);

    if (!ticket) {
      console.log('[Asana Webhook] Ticket not found in Firestore, skipping');
      return;
    }

    // Verifica se il ticket non è già chiuso
    if (ticket.status === 'closed') {
      console.log('[Asana Webhook] Ticket already closed, skipping');
      return;
    }

    // Chiudi il ticket su Firestore
    await closeTicket(taskGid);
    console.log('[Asana Webhook] Successfully closed ticket in Firestore:', taskGid);

    // Invia notifica a GHL
    if (ticket.ghlContactId) {
      const ghlResult = await sendTicketClosedEvent({
        clientId: ticket.clientId,
        ghlContactId: ticket.ghlContactId,
        ticketId: taskGid,
      });
      console.log('[Asana Webhook] Sent ticket closed event to GHL:', ghlResult ? 'SUCCESS' : 'FAILED');
    } else {
      console.log('[Asana Webhook] Skipping GHL notification - no ghlContactId for ticket');
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

  console.log('[Asana Webhook] Handling task marked complete story:', {
    storyGid: resource?.gid,
    taskGid,
    story_subtype: resource?.resource_subtype
  });

  if (!taskGid) {
    console.log('[Asana Webhook] Missing taskGid from parent, skipping');
    return;
  }

  try {
    // Recupera ticket da Firestore
    const ticket = await getTicket(taskGid);
    console.log('[Asana Webhook] Retrieved ticket from Firestore:', ticket ? 'FOUND' : 'NOT FOUND', ticket?.status);

    if (!ticket) {
      console.log('[Asana Webhook] Ticket not found in Firestore, skipping');
      return;
    }

    // Verifica se il ticket non è già chiuso
    if (ticket.status === 'closed') {
      console.log('[Asana Webhook] Ticket already closed, skipping');
      return;
    }

    // Chiudi il ticket su Firestore
    await closeTicket(taskGid);
    console.log('[Asana Webhook] Successfully closed ticket in Firestore:', taskGid);

    // Invia notifica a GHL
    if (ticket.ghlContactId) {
      const ghlResult = await sendTicketClosedEvent({
        clientId: ticket.clientId,
        ghlContactId: ticket.ghlContactId,
        ticketId: taskGid,
      });
      console.log('[Asana Webhook] Sent ticket closed event to GHL:', ghlResult ? 'SUCCESS' : 'FAILED');
    } else {
      console.log('[Asana Webhook] Skipping GHL notification - no ghlContactId for ticket');
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

  console.log('[Asana Webhook] Handling task marked incomplete story:', {
    storyGid: resource?.gid,
    taskGid,
    story_subtype: resource?.resource_subtype
  });

  if (!taskGid) {
    console.log('[Asana Webhook] Missing taskGid from parent, skipping');
    return;
  }

  try {
    // Recupera ticket da Firestore
    const ticket = await getTicket(taskGid);
    console.log('[Asana Webhook] Retrieved ticket from Firestore:', ticket ? 'FOUND' : 'NOT FOUND', ticket?.status);

    if (!ticket) {
      console.log('[Asana Webhook] Ticket not found in Firestore, skipping');
      return;
    }

    // Verifica se il ticket è già aperto
    if (ticket.status === 'open') {
      console.log('[Asana Webhook] Ticket already open, skipping');
      return;
    }

    // Riapri il ticket su Firestore (riaperto dall'admin)
    await reopenTicket(taskGid, 'admin');
    console.log('[Asana Webhook] Successfully reopened ticket in Firestore:', taskGid);

    // Invia notifica a GHL
    if (ticket.ghlContactId) {
      const ghlResult = await sendTicketReopenedEvent({
        clientId: ticket.clientId,
        ghlContactId: ticket.ghlContactId,
        ticketId: taskGid,
        reopenedBy: 'admin',
      });
      console.log('[Asana Webhook] Sent ticket reopened event to GHL:', ghlResult ? 'SUCCESS' : 'FAILED');
    } else {
      console.log('[Asana Webhook] Skipping GHL notification - no ghlContactId for ticket');
    }

  } catch (error: any) {
    console.error('[Asana Webhook] Errore riapertura ticket da story:', error.message, error.stack);
  }
}