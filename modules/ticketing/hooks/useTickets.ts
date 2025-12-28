/**
 * MODULE: Ticketing System
 * 
 * Custom Hook per gestione stato Ticketing
 * Pattern: Separazione logica/UI - Hook gestisce stato, componenti solo rendering
 */

import { useState, useEffect } from 'react';
import { Ticket, TicketStatus } from '../types';
import { useAuth } from '@/contexts/AuthContext';
import axios from '@/utils/axios';

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

      // Chiamata API unificata per recuperare tutti i ticket dell'utente
      const response = await axios.get(`/api/tickets/user-tickets?userId=${user.id}`);
      const mappedTickets: Ticket[] = response.data.data || [];

      setTickets(mappedTickets);
    } catch (err: any) {
      // Non loggare errori 401 - vengono gestiti dalla modale globale di sessione scaduta
      if (err?.response?.status !== 401) {
        console.error('Errore caricamento ticket:', err);
      }
      setError('Errore nel caricamento dei ticket');
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, [user?.id]);

  // Evita di ricaricare tutti i ticket dopo la creazione
  const addTicket = (ticket: Ticket) => {
    setTickets((prev) => [ticket, ...prev]);
  };

  const setPage = (section: 'open' | 'inProgress' | 'completed', page: number) => {
    setPagination(prev => ({
      ...prev,
      [section]: { currentPage: page },
    }));
  };

  const getTotalPages = (section: 'open' | 'inProgress' | 'completed', filteredCount: number) => {
    return Math.ceil(filteredCount / ITEMS_PER_PAGE);
  };

  useEffect(() => {
    if (tickets.length > 0) {
    }
  }, [tickets]);

  return { 
    tickets, 
    loading, 
    error, 
    refetch: loadTickets, 
    addTicket,
    pagination,
    setPage,
    getTotalPages,
    itemsPerPage: ITEMS_PER_PAGE,
  };
};

// Helper function per formattare la data di scadenza
export const formatDueDate = (dueDate?: Date): { text: string; colorScheme: string } => {
  if (!dueDate) {
    return {
      text: 'Data consegna da definire',
      colorScheme: 'gray'
    };
  }

  const now = new Date();
  const due = new Date(dueDate);
  const diffTime = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // Formatta la data
  const formattedDate = due.toLocaleDateString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  if (diffDays < 0) {
    return {
      text: `Consegnato il ${formattedDate}`,
      colorScheme: 'gray'
    };
  } else if (diffDays === 0) {
    return {
      text: `Consegna oggi (${formattedDate})`,
      colorScheme: 'gray'
    };
  } else if (diffDays === 1) {
    return {
      text: `Consegna domani (${formattedDate})`,
      colorScheme: 'gray'
    };
  } else if (diffDays <= 7) {
    return {
      text: `Consegna tra ${diffDays} giorni (${formattedDate})`,
      colorScheme: 'gray'
    };
  } else {
    return {
      text: `Consegna il ${formattedDate}`,
      colorScheme: 'gray'
    };
  }
};
