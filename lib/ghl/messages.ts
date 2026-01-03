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
// IMPLEMENTAZIONI DELLE FUNZIONI
// ============================================================

export function getAdminClientRepliedMessage(params: AdminReplyNotificationParams): string {
  return `Il cliente ${params.clientName} ha risposto al ticket ${params.ticketId}`;
}