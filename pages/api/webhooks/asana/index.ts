/**
 * API ENDPOINT: /api/webhooks/asana
 * 
 * Webhook receiver per eventi Asana
 * 
 * Gestisce:
 * - Nuovi commenti (stories) su task → notifica cliente
 * - Cambio stato task (completato) → notifica cliente
 * 
 * FLUSSO quando admin risponde su Asana:
 * 1. Asana invia webhook con story/comment
 * 2. Backend recupera client_id dal custom field del task
 * 3. Aggiorna Firestore: last_message_by = "admin", waiting_for = "client"
 * 4. Invia notifica WhatsApp al cliente via GHL
 * 5. Invia webhook evento a GHL per automazioni
 * 
 * NOTA: Asana richiede handshake iniziale con X-Hook-Secret
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { sendTicketRepliedByAdminEvent, sendTicketClosedEvent } from '@/lib/ghl/ghlService';
import { getClientNewReplyMessage, getClientTicketClosedMessage } from '@/lib/ghl/messages';
import { updateTicketOnReply, getTicket, closeTicket } from '@/lib/ticket/ticketService';

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
  const { action, resource, parent } = event;

  // Evento: Nuovo commento su task
  if (resource?.resource_type === 'story' && action === 'added') {
    await handleNewStory(event);
  }

  // Evento: Task completato
  if (resource?.resource_type === 'task' && action === 'changed') {
    await handleTaskChanged(event);
  }
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

    // Se il commento è stato aggiunto dal cliente (via webapp), ignora
    // Lo determiniamo controllando se waiting_for è già "admin"
    // In teoria dovremmo verificare l'autore del commento su Asana
    // Ma per semplicità assumiamo che se arriva da webhook è dell'admin
    
    // Aggiorna Firestore
    await updateTicketOnReply({
      ticketId: taskGid,
      repliedBy: 'admin',
    });

    // Invia notifica al cliente via GHL
    if (ticket.ghlContactId) {
      try {
        const clientMessage = getClientNewReplyMessage({
          clientName: ticket.clientName || 'Cliente',
          ticketTitle: ticket.title || 'Ticket',
          ticketId: taskGid,
        });

        // Notifica utente gestita da GHL workflow
      } catch (msgError: any) {
        console.error('[Asana Webhook] Errore invio messaggio cliente:', msgError.message);
      }

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
 * Gestisce cambio stato task (es. completato)
 */
async function handleTaskChanged(event: any): Promise<void> {
  const { resource, change } = event;
  const taskGid = resource?.gid;

  // Verifica se il cambio riguarda lo stato completed
  if (!change?.field || change.field !== 'completed') {
    return;
  }

  const isCompleted = change?.new_value === true;
  if (!isCompleted) {
    return; // Ignora se il task viene riaperto
  }


  try {
    // Recupera ticket da Firestore
    const ticket = await getTicket(taskGid);
    if (!ticket) {
      return;
    }

    // Chiudi ticket su Firestore
    await closeTicket(taskGid);

    // Invia notifica al cliente
    if (ticket.ghlContactId) {
      try {
        const closedMessage = getClientTicketClosedMessage({
          clientName: ticket.clientName || 'Cliente',
          ticketTitle: ticket.title || 'Ticket',
          ticketId: taskGid,
        });

        // Notifica chiusura gestita da GHL workflow
      } catch (msgError: any) {
        console.error('[Asana Webhook] Errore invio messaggio chiusura:', msgError.message);
      }

      // Invia webhook evento a GHL
      await sendTicketClosedEvent({
        clientId: ticket.clientId,
        ghlContactId: ticket.ghlContactId,
        ticketId: taskGid,
      });
    }
  } catch (error: any) {
    console.error('[Asana Webhook] Errore gestione task changed:', error.message);
  }
}
