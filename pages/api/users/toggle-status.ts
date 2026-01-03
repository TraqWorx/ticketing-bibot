/**
 * API ROUTE: Toggle User Status
 * 
 * POST /api/users/toggle-status
 * 
 * Disabilita o abilita un utente CLIENT
 * 
 * Sicurezza: Solo ADMIN autenticati
 */

import { NextApiResponse } from 'next';
import { withAdminAuth, AuthenticatedRequest } from '@/lib/auth-middleware';
import { adminAuth, adminDb } from '@/config/firebase-admin';

interface ToggleStatusBody {
  userId: string;
  isActive: boolean;
}

async function handler(
  req: AuthenticatedRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, isActive } = req.body as ToggleStatusBody;

    if (!userId || typeof isActive !== 'boolean') {
      return res.status(400).json({ error: 'Parametri non validi' });
    }

    // Aggiorna Firebase Auth (disabilita account)
    await adminAuth.updateUser(userId, {
      disabled: !isActive,
    });

    // Aggiorna Firestore
    await adminDb.collection('users').doc(userId).update({
      isActive,
      updatedAt: new Date().toISOString(),
    });

    return res.status(200).json({
      success: true,
      message: isActive ? 'Utente abilitato' : 'Utente disabilitato',
    });
  } catch (error) {
    console.error('Error toggling user status:', error);
    return res.status(500).json({ error: 'Errore durante l\'operazione' });
  }
}

export default withAdminAuth(handler);
