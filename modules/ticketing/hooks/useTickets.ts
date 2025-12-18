/**
 * MODULE: Ticketing System
 * 
 * Custom Hook per gestione stato Ticketing
 * Pattern: Separazione logica/UI - Hook gestisce stato, componenti solo rendering
 */

import { useState, useEffect } from 'react';
import { Ticket } from '../types';
import { ticketingService } from '../services/ticketing.service';

export const useTickets = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTickets = async () => {
      try {
        setLoading(true);
        const data = await ticketingService.getAllTickets();
        setTickets(data);
      } catch (err) {
        setError('Errore nel caricamento dei ticket');
      } finally {
        setLoading(false);
      }
    };

    loadTickets();
  }, []);

  return { tickets, loading, error };
};
