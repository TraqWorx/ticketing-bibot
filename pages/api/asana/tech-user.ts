/**
 * API ENDPOINT: /api/asana/tech-user
 *
 * Ottiene le informazioni dell'utente Asana corrente (account tecnico)
 *
 * Method: GET
 * Returns: { gid: string; name: string; email: string }
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { getCurrentAsanaUser } from '@/lib/asana/asanaService';
import { withAuth } from '@/lib/auth-middleware';

export default withAuth(async (req: NextApiRequest, res: NextApiResponse) => {
  // Solo GET
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const user = await getCurrentAsanaUser();

    if (!user) {
      return res.status(500).json({ message: 'Impossibile ottenere l\'utente Asana corrente' });
    }

    return res.status(200).json(user);
  } catch (error: any) {
    console.error('Errore API current-user:', error);
    return res.status(500).json({
      message: error.message || 'Errore durante il recupero dell\'utente corrente',
    });
  }
});