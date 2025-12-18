/**
 * API Route: Delete User (Hard Delete)
 * 
 * Elimina definitivamente un cliente da:
 * - Firebase Authentication
 * - Firestore users collection
 * 
 * ATTENZIONE: Operazione irreversibile
 */

import { NextApiResponse } from 'next';
import { withAdminAuth, AuthenticatedRequest } from '@/lib/auth-middleware';
import { adminAuth, adminDb } from '@/config/firebase-admin';

async function handler(
  req: AuthenticatedRequest,
  res: NextApiResponse,
  user: { uid: string; email: string; role?: string }
) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'userId è obbligatorio' });
  }

  try {
    // 1. Verifica che l'utente da eliminare esista e sia CLIENT
    const userDoc = await adminDb.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'Utente non trovato' });
    }

    const userData = userDoc.data();
    
    if (userData?.role !== 'CLIENT') {
      return res.status(403).json({ error: 'È possibile eliminare solo utenti CLIENT' });
    }

    // 2. Elimina da Firebase Authentication
    try {
      await adminAuth.deleteUser(userId);
    } catch (authError: any) {
      // Se l'utente non esiste in Auth, continua comunque (cleanup Firestore)
      if (authError.code !== 'auth/user-not-found') {
        throw authError;
      }
    }

    // 3. Elimina da Firestore
    await adminDb.collection('users').doc(userId).delete();

    // TODO: 4. Elimina dati correlati se necessario
    // - Tickets dell'utente
    // - Log/audit trail
    // - File storage

    return res.status(200).json({
      success: true,
      message: 'Cliente eliminato con successo',
    });
  } catch (error: any) {
    console.error('Error deleting user:', error);
    return res.status(500).json({
      error: 'Errore durante l\'eliminazione del cliente',
    });
  }
}

export default withAdminAuth(handler);
