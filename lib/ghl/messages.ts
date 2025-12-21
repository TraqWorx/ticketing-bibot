/**
 * GHL Message Templates
 * 
 * Centralizza tutti i messaggi inviati via WhatsApp tramite Go High Level
 * Permette di customizzare facilmente i messaggi in un unico posto
 */

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
