import { useAuth } from '@/contexts/AuthContext';
import { FirestoreTicket } from '@/types/ticket';
import { useEffect, useState } from 'react';
import { Ticket, TicketStatus } from '../types';
import { TicketPriority } from '../../../types/ticket';

interface PaginationState {
  open: { currentPage: number };
  inProgress: { currentPage: number };
  completed: { currentPage: number };
}

export const useTickets = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationState>({
    open: { currentPage: 1 },
    inProgress: { currentPage: 1 },
    completed: { currentPage: 1 },
  });
  const ITEMS_PER_PAGE = 8;

  const loadTickets = async (resetPagination: boolean = true) => {
    if (!user?.id) {
      setTickets([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      if (resetPagination) {
        setPagination({
          open: { currentPage: 1 },
          inProgress: { currentPage: 1 },
          completed: { currentPage: 1 },
        });
      }
      // Recupera i ticket da Firestore tramite API custom
      const axios = require('axios');
      const response = await axios.get(`/api/ticket/client-tickets?clientId=${user.id}`);
      const firestoreTickets: FirestoreTicket[] = response.data.data || [];
      // Mappa FirestoreTicket su Ticket UI
      const mappedTickets: Ticket[] = firestoreTickets.map((t) => {
        // Determina la sezione in base allo status
        let section: 'open' | 'inProgress' | 'completed' = 'open';
        if (t.status === TicketStatus.IN_PROGRESS) section = 'inProgress';
        else if (t.status === TicketStatus.RESOLVED || t.status === TicketStatus.CLOSED) section = 'completed';

        return {
          id: t.ticketId,
          title: t.title || '',
          description: '',
          status: t.status,
          priority: t.priority && Object.values(TicketPriority).includes(t.priority.toUpperCase() as TicketPriority)
            ? (t.priority.toUpperCase() as TicketPriority)
            : TicketPriority.LOW,
          createdAt: t.createdAt instanceof Date ? t.createdAt : t.createdAt.toDate(),
          updatedAt: t.lastActivityAt instanceof Date ? t.lastActivityAt : t.lastActivityAt.toDate(),
          tags: [],
          commentsCount: 0,
          attachmentsCount: 0,
          section,
        };
      });
      // Ordina per priorità e data
      const priorityOrder: Record<string, number> = {
        urgent: 0,
        high: 1,
        medium: 2,
        low: 3,
      };
      mappedTickets.sort((a, b) => {
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return b.createdAt.getTime() - a.createdAt.getTime();
      });
      setTickets(mappedTickets);
    } catch (err) {
      console.error('Errore caricamento ticket:', err);
      setError('Errore nel caricamento dei ticket');
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, [user?.id]);

  const addTicket = (ticket: Ticket) => {
    setTickets(prev => [ticket, ...prev]);
  };

  const setPage = (section: 'open' | 'inProgress' | 'completed', page: number) => {
    setPagination(prev => ({
      ...prev,
      [section]: { currentPage: page },
    }));
  };

  return {
    tickets,
    loading,
    error,
    pagination,
    setPage,
    addTicket,
    reload: loadTickets,
  };
};
