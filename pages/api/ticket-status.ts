import type { NextApiResponse } from 'next';
import { withAuth } from '@/lib/auth-middleware';
import { getTicket } from '@/lib/ticket/ticketService';

// API: /api/ticket-status?ticketId=xxx
export default withAuth(async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { ticketId } = req.query;
  if (!ticketId || typeof ticketId !== 'string') {
    return res.status(400).json({ message: 'ticketId obbligatorio' });
  }

  try {
    const ticket = await getTicket(ticketId);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket non trovato' });
    }
    // Restituisci solo lo stato (status) del ticket
    return res.status(200).json({ status: ticket.status });
  } catch (error: any) {
    console.error('[API] Errore recupero stato ticket:', error);
    return res.status(500).json({ message: 'Errore interno', error: error.message });
  }
});
