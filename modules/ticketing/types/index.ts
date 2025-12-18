/**
 * MODULE: Ticketing System
 * 
 * Tipi TypeScript per il modulo Ticketing
 * Definisce le interfacce base per ticket, stati e priorità
 */

export enum TicketStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  CLOSED = 'closed'
}

export enum TicketPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  assignee?: string;
  createdAt: Date;
  updatedAt: Date;
}
