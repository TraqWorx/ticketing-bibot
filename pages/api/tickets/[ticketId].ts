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
    
    // Restituisci sempre 200, anche se il ticket non esiste
    // Questo evita che axios sul frontend lanci eccezioni
    if (!ticket) {
      return res.status(200).json({ 
        exists: false, 
        ticket: null,
        message: 'Ticket non trovato su Firestore' 
      });
    }
    
    return res.status(200).json({ 
      exists: true, 
      ticket,
      ...ticket 
    });
  } catch (error: any) {
    console.error('[API] Errore recupero dettaglio ticket:', error);
    return res.status(500).json({ message: 'Errore interno', error: error.message });
  }
});
