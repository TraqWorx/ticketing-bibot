/**
 * MODULE: Ticketing System
 * 
 * Servizi API per il modulo Ticketing
 * Pattern: Separazione tra logica di business e UI components
 * Facilitates: Mock data ora, API reali in futuro senza toccare i componenti
 */

import { Ticket, TicketStatus, TicketPriority } from '../types';

// Mock data per esempio - in produzione sarebbe un'API call
export const ticketingService = {
  getAllTickets: async (): Promise<Ticket[]> => {
    // Simula API call
    return [
      {
        id: '1',
        title: 'Bug nella dashboard',
        description: 'La sidebar non si chiude correttamente',
        status: TicketStatus.OPEN,
        priority: TicketPriority.HIGH,
        assignee: {
          id: 'user1',
          name: 'Mario Rossi',
          email: 'mario.rossi@example.com',
          avatar: undefined
        },
        tags: ['bug', 'urgent'],
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        commentsCount: 3,
        attachmentsCount: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '2',
        title: 'Richiesta nuova feature',
        description: 'Aggiungere export Excel',
        status: TicketStatus.IN_PROGRESS,
        priority: TicketPriority.MEDIUM,
        assignee: {
          id: 'user2',
          name: 'Luca Bianchi',
          email: 'luca.bianchi@example.com',
        },
        tags: ['feature', 'enhancement'],
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        commentsCount: 5,
        attachmentsCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
  },

  getTicketById: async (id: string): Promise<Ticket | null> => {
    const tickets = await ticketingService.getAllTickets();
    return tickets.find(t => t.id === id) || null;
  },
};
