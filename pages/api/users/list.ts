/**
 * API ROUTE: List Client Users
 * 
 * GET /api/users/list
 * 
 * Recupera lista utenti CLIENT
 * 
 * Sicurezza: Solo ADMIN autenticati
 */

import { NextApiResponse } from 'next';
import { withAdminAuth, AuthenticatedRequest } from '@/lib/auth-middleware';
import { adminDb } from '@/config/firebase-admin';
import { UserRole } from '@/types/user';

async function handler(
  req: AuthenticatedRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const usersRef = adminDb.collection('users');
    const snapshot = await usersRef.where('role', '==', UserRole.CLIENT).get();

    const users: any[] = [];
    snapshot.forEach((doc) => {
      users.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    // Ordina per data creazione (più recente prima)
    users.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA;
    });

    return res.status(200).json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({ error: 'Errore durante il caricamento degli utenti' });
  }
}

export default withAdminAuth(handler);
