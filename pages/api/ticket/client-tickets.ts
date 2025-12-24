import { NextApiRequest, NextApiResponse } from 'next';
import { getClientTickets } from '@/lib/ticket/ticketService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  const { clientId } = req.query;
  if (!clientId || typeof clientId !== 'string') {
    return res.status(400).json({ message: 'clientId obbligatorio' });
  }
  try {
    const tickets = await getClientTickets(clientId);
    res.status(200).json({ success: true, data: tickets });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}
