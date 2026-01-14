/**
 * TYPES: Ticket System
 * 
 * Tipi per il sistema di ticketing
 * Modello dati Firestore per tracking stato ticket
 */

/**
 * Chi ha inviato l'ultimo messaggio
 */
export type MessageAuthor = 'client' | 'admin';

/**
 * Chi è in attesa di risposta
 */
export type WaitingFor = 'client' | 'admin' | null;

/**
 * Stato del ticket
 */
export enum TicketStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
}

/**
 * Priorità del ticket
 */
export enum TicketPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

/**
 * Modello Ticket su Firestore
 * Questi campi NON sostituiscono Asana ma servono per:
 * - badge UI
 * - logica di attesa risposta
 * - trigger eventi GHL
 */
export interface FirestoreTicket {
  /** ID del ticket (asana_gid) */
  ticketId: string;

  /** ID del cliente (Firebase UID) */
  clientId: string;

  /** ID contatto GHL per notifiche */
  ghlContactId?: string;

  /** Stato del ticket */
  status: TicketStatus;


  /** Chi è in attesa di risposta */
  waitingFor: WaitingFor;

  /** Timestamp ultima attività */
  lastActivityAt: FirebaseFirestore.Timestamp | Date;

  /** Timestamp creazione */
  createdAt: FirebaseFirestore.Timestamp | Date;

  /** Titolo del ticket (cache da Asana) */
  title?: string;

  /** Priorità del ticket */
  priority?: 'high' | 'medium' | 'low';

  /** Nome del cliente (cache) */
  clientName?: string;

  /** Telefono del cliente (cache) */
  clientPhone?: string;

  /** Email del cliente (cache) */
  clientEmail?: string;
}

/**
 * Payload per creazione ticket
 */
export interface CreateTicketPayload {
  ticketId: string;
  clientId: string;
  ghlContactId?: string;
  title: string;
  priority: 'high' | 'medium' | 'low';
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
}

/**
 * Payload per risposta ticket
 */
export interface TicketReplyPayload {
  ticketId: string;
  repliedBy: MessageAuthor;
}

/**
 * Eventi GHL supportati
 */
export type GHLEventType =
  | 'ticket_created'
  | 'ticket_replied_by_client'
  | 'ticket_replied_by_admin'
  | 'ticket_completed'
  | 'ticket_reopened';

/**
 * Payload base per webhook GHL
 */
export interface GHLWebhookPayload {
  event: GHLEventType;
  timestamp: string;
  data: Record<string, any>;
}

/**
 * Payload per evento ticket_created
 */
export interface GHLTicketCreatedPayload extends GHLWebhookPayload {
  event: 'ticket_created';
  data: {
    clientId: string;
    ghlContactId: string;
    ticketId: string;
    ticketUrl?: string;
    title: string;
    priority: string;
    firstName: string;
    lastName: string;
    clientPhone: string;
    openedAt: string;
  };
}

/**
 * Payload per evento ticket_replied
 */
export interface GHLTicketRepliedPayload extends GHLWebhookPayload {
  event: 'ticket_replied_by_client' | 'ticket_replied_by_admin';
  data: {
    clientId: string;
    ghlContactId: string;
    ticketId: string;
    ticketTitle?: string;
    ticketUrl?: string;
    repliedAt: string;
    repliedBy: MessageAuthor;
    clientName?: string;
    clientPhone?: string;
    clientEmail?: string;
    priority?: string;
  };
}

/**
 * Payload per evento ticket_completed
 */
export interface GHLTicketCompletedPayload extends GHLWebhookPayload {
  event: 'ticket_completed';
  data: {
    clientId: string;
    ghlContactId?: string;
    ticketId: string;
    ticketUrl?: string;
    completedAt: string;
  };
}

/**
 * Payload per evento ticket_reopened
 */
export interface GHLTicketReopenedPayload extends GHLWebhookPayload {
  event: 'ticket_reopened';
  data: {
    clientId: string;
    ghlContactId: string;
    ticketId: string;
    ticketUrl?: string;
    reopenedAt: string;
    reopenedBy: 'admin' | 'client';
  };
}
