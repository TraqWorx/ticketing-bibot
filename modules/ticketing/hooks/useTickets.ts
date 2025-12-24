/**
 * MODULE: Ticketing System
 * 
 * Custom Hook per gestione stato Ticketing
 * Pattern: Separazione logica/UI - Hook gestisce stato, componenti solo rendering
 */

import { useState, useEffect } from 'react';
import { Ticket, TicketStatus } from '../types';
import { useAuth } from '@/contexts/AuthContext';
import { AsanaTaskListItem } from '@/types';
import { TicketPriority } from '../../../types/ticket';
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

      // Chiamata API per recuperare tutti i task Asana dell'utente
      const response = await axios.get(`/api/asana/user-tasks?userId=${user.id}`);
      
      // Recupera i dati aggiuntivi da Firestore per tutti i ticket
      const firestoreResponse = await axios.get(`/api/firestore/tickets?userId=${user.id}`);
      const firestoreTickets: Record<string, any> = firestoreResponse.data || {};

      // Mappa i task Asana al formato Ticket locale, arricchendo con i dati di Firestore
      const asanaTasks: AsanaTaskListItem[] = response.data.data || [];
      const mappedTickets: Ticket[] = asanaTasks.map((task) => {
        const sectionName = task.memberships?.[0]?.section?.name?.toLowerCase() || '';
        let status = TicketStatus.OPEN;
        if (sectionName.includes('lavorazione') || sectionName.includes('in progress')) {
          status = TicketStatus.IN_PROGRESS;
        } else if (sectionName.includes('completati') || sectionName.includes('completed') || sectionName.includes('done')) {
          status = TicketStatus.RESOLVED;
        }

        // Dati da Firestore
        const firestoreData = firestoreTickets[task.gid] || {};

        // Conversione sicura della priorità Firestore in enum
        let priority: TicketPriority = TicketPriority.MEDIUM;
        if (firestoreData.priority) {
          const p = firestoreData.priority.toString().toLowerCase();
          if (p === 'low') priority = TicketPriority.LOW;
          else if (p === 'medium') priority = TicketPriority.MEDIUM;
          else if (p === 'high') priority = TicketPriority.HIGH;
          else if (p === 'urgent') priority = TicketPriority.URGENT;
        } else {
          // fallback mapping da Asana
          const priorityCustomField = (task as any).custom_fields?.find(
            (cf: any) => cf.name?.toLowerCase() === 'task_priority'
          );
          let priorityValue = (
            priorityCustomField?.display_value || 
            priorityCustomField?.enum_value?.name || 
            'media'
          ).toString().trim().toLowerCase();
          if (["alta", "high", "urgente", "urgent"].includes(priorityValue)) {
            priority = TicketPriority.URGENT;
          } else if (["media", "medium"].includes(priorityValue)) {
            priority = TicketPriority.MEDIUM;
          } else if (["bassa", "low"].includes(priorityValue)) {
            priority = TicketPriority.LOW;
          }
        }

        return {
          id: task.gid,
          title: firestoreData.title || task.name,
          description: '',
          status, // Usa sempre lo status calcolato da Asana
          priority,
          createdAt: firestoreData.createdAt ? new Date(firestoreData.createdAt) : new Date(),
          updatedAt: firestoreData.lastActivityAt ? new Date(firestoreData.lastActivityAt) : new Date(),
          dueDate: task.due_on ? new Date(task.due_on) : undefined,
          tags: [],
          commentsCount: 0,
          attachmentsCount: 0,
          clientId: firestoreData.clientId,
          clientName: firestoreData.clientName,
          clientPhone: firestoreData.clientPhone,
          ghlContactId: firestoreData.ghlContactId,
          waitingFor: firestoreData.waitingFor,
        };
      });


      // Ordina i ticket solo per data di creazione (più recenti prima)
      mappedTickets.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

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
      text: 'Data di consegna non ancora definita',
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
