/**
 * MODULE: Ticketing System
 * 
 * Custom Hook per gestione stato Ticketing
 * Pattern: Separazione logica/UI - Hook gestisce stato, componenti solo rendering
 */

import { useState, useEffect } from 'react';
import { Ticket, TicketStatus, TicketPriority } from '../types';
import { useAuth } from '@/contexts/AuthContext';
import { AsanaTaskListItem } from '@/types';

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
      const axios = require('axios');
      const response = await axios.get(`/api/asana/user-tasks?userId=${user.id}`);
      
      // Mappa i task Asana al formato Ticket locale
      const asanaTasks: AsanaTaskListItem[] = response.data.data || [];
      const mappedTickets: Ticket[] = asanaTasks.map((task) => {
        // Determina lo status dalla sezione Asana
        const sectionName = task.memberships?.[0]?.section?.name?.toLowerCase() || '';
        let status = TicketStatus.OPEN;
        
        if (sectionName.includes('lavorazione') || sectionName.includes('in progress')) {
          status = TicketStatus.IN_PROGRESS;
        } else if (sectionName.includes('completati') || sectionName.includes('completed') || sectionName.includes('done')) {
          status = TicketStatus.RESOLVED;
        }
        
        // Mappa priorità da custom field Asana (dropdown/enum)
        const priorityCustomField = (task as any).custom_fields?.find(
          (cf: any) => cf.name === 'task_priority'
        );
        // Per i custom field enum, usa display_value o enum_value.name
        const priorityValue = (
          priorityCustomField?.display_value || 
          priorityCustomField?.enum_value?.name || 
          'Media'
        ).toLowerCase();
        
        const priorityMap: Record<string, TicketPriority> = {
          alta: TicketPriority.URGENT,
          high: TicketPriority.URGENT,
          media: TicketPriority.MEDIUM,
          medium: TicketPriority.MEDIUM,
          bassa: TicketPriority.LOW,
          low: TicketPriority.LOW,
        };
        const priority = priorityMap[priorityValue] || TicketPriority.MEDIUM;
        
        return {
          id: task.gid,
          title: task.name,
          description: '', // Verrà caricato nel dettaglio
          status,
          priority,
          createdAt: new Date(),
          updatedAt: new Date(),
          tags: [],
          commentsCount: 0,
          attachmentsCount: 0,
        };
      });

      // Ordina i ticket: prima per priorità (alta -> bassa), poi per data (più recenti)
      const priorityOrder: Record<string, number> = {
        urgent: 0,
        high: 0,
        medium: 1,
        low: 2,
      };
      
      mappedTickets.sort((a, b) => {
        // Prima ordina per priorità
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (priorityDiff !== 0) return priorityDiff;
        
        // Se la priorità è la stessa, ordina per data (più recenti prima)
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

  const getTotalPages = (section: 'open' | 'inProgress' | 'completed', filteredCount: number) => {
    return Math.ceil(filteredCount / ITEMS_PER_PAGE);
  };

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
