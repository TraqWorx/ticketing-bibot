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
        assignee: 'Mario Rossi',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '2',
        title: 'Richiesta nuova feature',
        description: 'Aggiungere export Excel',
        status: TicketStatus.IN_PROGRESS,
        priority: TicketPriority.MEDIUM,
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
