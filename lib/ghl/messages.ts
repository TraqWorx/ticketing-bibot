/**
 * GHL Message Templates
 * 
 * Centralizza tutti i messaggi inviati via WhatsApp/SMS tramite Go High Level
 * Permette di customizzare facilmente i messaggi in un unico posto
 * 
 * NOTA: Questi messaggi sono inviati direttamente via API.
 * Per automazioni complesse (reminder, follow-up), usa i workflow GHL.
 */

// ============================================================
// TIPI PER I PARAMETRI DEI MESSAGGI
// ============================================================

interface ClientTicketMessageParams {
  creatorName: string;
  title: string;
  taskGid: string;
}

interface AdminTicketMessageParams {
  creatorName: string;
  creatorPhone: string;
  title: string;
  priority: string;
  description: string;
  taskGid: string;
}

interface ClientReplyNotificationParams {
  clientName: string;
  ticketTitle: string;
  ticketId: string;
}

interface AdminReplyNotificationParams {
  clientName: string;
  ticketId: string;
}

// ============================================================
// MESSAGGI CREAZIONE TICKET
// ============================================================

/**
 * Messaggio al cliente quando viene creato un nuovo ticket
 */
export function getClientTicketCreatedMessage(params: ClientTicketMessageParams): string {
  const { creatorName, title, taskGid } = params;

  return `✅ Ticket creato con successo!\n\nCiao ${creatorName},\n\nIl tuo ticket "${title}" è stato creato e assegnato al nostro team.\n\n📋 ID Ticket: ${taskGid}\n\nTi contatteremo presto per aggiornarti.`;
}

/**
 * Messaggio all'admin quando viene creato un nuovo ticket
 */
export function getAdminTicketCreatedMessage(params: AdminTicketMessageParams): string {
  const { creatorName, creatorPhone, title, priority, description, taskGid } = params;

  return `🔔 NUOVO TICKET CREATO\n\n👤 Cliente: ${creatorName}\n📱 Telefono: ${creatorPhone}\n📌 Titolo: ${title}\n⚡ Priorità: ${priority.toUpperCase()}\n📝 Descrizione: ${description}\n\n📋 ID Ticket: ${taskGid}`;
}

// ============================================================
// MESSAGGI RISPOSTA TICKET
// ============================================================

/**
 * Messaggio al cliente quando l'admin risponde al ticket
 * Inviato quando arriva risposta da Asana
 */
export function getClientNewReplyMessage(params: ClientReplyNotificationParams): string {
  const { clientName, ticketTitle, ticketId } = params;

  return `💬 Nuova risposta al tuo ticket!\n\nCiao ${clientName},\n\nHai ricevuto una risposta al ticket "${ticketTitle}".\n\n📋 ID: ${ticketId}\n\nAccedi alla dashboard per visualizzare la risposta.`;
}

/**
 * Messaggio all'admin quando il cliente risponde al ticket
 */
export function getAdminClientRepliedMessage(params: AdminReplyNotificationParams): string {
  const { clientName, ticketId } = params;

  return `💬 NUOVA RISPOSTA CLIENTE\n\n👤 Cliente: ${clientName}\n📋 Ticket: ${ticketId}\n\nIl cliente ha risposto al ticket. Verifica su Asana.`;
}

// ============================================================
// MESSAGGI STATO TICKET
// ============================================================

/**
 * Messaggio al cliente quando il ticket viene chiuso
 */
export function getClientTicketClosedMessage(params: { clientName: string; ticketTitle: string; ticketId: string }): string {
  const { clientName, ticketTitle, ticketId } = params;

  return `✅ Ticket risolto!\n\nCiao ${clientName},\n\nIl tuo ticket "${ticketTitle}" è stato chiuso.\n\n📋 ID: ${ticketId}\n\nGrazie per averci contattato! Se hai bisogno di ulteriore assistenza, apri un nuovo ticket.`;
}
