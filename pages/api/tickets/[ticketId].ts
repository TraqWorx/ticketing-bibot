import { withAuth } from '@/lib/auth-middleware';
import { getTicket } from '@/lib/ticket/ticketService';
import { NextApiRequest, NextApiResponse } from 'next';

export default withAuth(async (req: NextApiRequest, res: NextApiResponse) => {
  const {
    query: { ticketId },
    method,
  } = req;

  if (method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  if (!ticketId || typeof ticketId !== 'string') {
    return res.status(400).json({ message: 'ticketId obbligatorio' });
  }

  try {
    const ticket = await getTicket(ticketId);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket non trovato' });
    }
    return res.status(200).json(ticket);
  } catch (error: any) {
    console.error('[API] Errore recupero dettaglio ticket:', error);
    return res.status(500).json({ message: 'Errore interno', error: error.message });
  }
});
