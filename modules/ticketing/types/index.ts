/**
 * MODULE: Ticketing System
 * 
 * Tipi TypeScript per il modulo Ticketing
 * Definisce le interfacce base per ticket, stati e priorità
 */

import { TicketStatus, TicketPriority } from '../../../types/ticket';

export { TicketStatus, TicketPriority } from '../../../types/ticket';

export interface Assignee {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface Comment {
  id: string;
  author: {
    name: string;
    avatar?: string;
  };
  content: string;
  createdAt: Date;
  isSystemMessage?: boolean;
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  assignee?: Assignee;
  tags?: string[];
  dueDate?: Date;
  commentsCount?: number;
  attachmentsCount?: number;
  comments?: Comment[];
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
  lastActivityAt?: Date;
  waitingFor?: 'client' | 'admin';
  section?: 'open' | 'inProgress' | 'completed';
  lastMessageBy?: 'admin' | 'client';

  // Firebase
  clientId?: string;
  clientName?: string;
  clientPhone?: string;
  ghlContactId?: string;
  ticketId?: string;
}
