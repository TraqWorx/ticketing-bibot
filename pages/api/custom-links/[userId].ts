/**
 * API: Get Custom Links by User ID
 * 
 * GET /api/custom-links/[userId]
 * 
 * Ottiene tutti i custom link di un utente specifico
 * 
 * Auth: Richiede autenticazione
 * Permessi: Solo ADMIN può recuperare link di qualsiasi utente,
 *           CLIENT può recuperare solo i propri link
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { CustomLinksService } from '@/services/customLinks.service';
import { adminAuth } from '@/config/firebase-admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Solo GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verifica token
    const token = req.headers.authorization?.split('Bearer ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Token mancante' });
    }

    const decodedToken = await adminAuth.verifyIdToken(token);
    const { userId } = req.query;

    // Verifica permessi: CLIENT può vedere solo i propri link
    if (decodedToken.role !== 'ADMIN' && decodedToken.uid !== userId) {
      return res.status(403).json({ error: 'Non autorizzato' });
    }

    const links = await CustomLinksService.getUserCustomLinks(userId as string);

    return res.status(200).json({ links });
  } catch (error: any) {
    console.error('Error getting custom links:', error);
    return res.status(500).json({ error: error.message || 'Errore del server' });
  }
}
