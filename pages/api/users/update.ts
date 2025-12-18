/**
 * API ROUTE: Update User
 * 
 * PUT /api/users/update
 * 
 * Aggiorna dati utente CLIENT (solo campi modificabili)
 * 
 * Sicurezza: Solo ADMIN autenticati
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { withAdminAuth } from '@/lib/auth-middleware';
import { adminDb } from '@/config/firebase-admin';
import { UserRole } from '@/types/user';

interface UpdateUserRequest {
  userId: string;
  firstName: string;
  lastName: string;
  phone: string;
  ghl_contact_id: string;
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, firstName, lastName, phone, ghl_contact_id } = req.body as UpdateUserRequest;

    // Validazione input
    if (!userId || !firstName || !lastName || !phone || !ghl_contact_id) {
      return res.status(400).json({ error: 'Tutti i campi sono obbligatori' });
    }

    // Verifica che l'utente esista e sia CLIENT
    const userDoc = await adminDb.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'Utente non trovato' });
    }

    const userData = userDoc.data();
    if (userData?.role !== UserRole.CLIENT) {
      return res.status(403).json({ error: 'Puoi modificare solo utenti CLIENT' });
    }

    // Aggiorna solo i campi modificabili
    await adminDb.collection('users').doc(userId).update({
      firstName,
      lastName,
      phone,
      ghl_contact_id,
      updatedAt: new Date(),
    });

    // Recupera utente aggiornato
    const updatedUserDoc = await adminDb.collection('users').doc(userId).get();
    const updatedUser = { id: updatedUserDoc.id, ...updatedUserDoc.data() };

    return res.status(200).json({
      success: true,
      message: 'Cliente aggiornato con successo',
      user: updatedUser,
    });
  } catch (error: any) {
    console.error('Error updating user:', error);
    return res.status(500).json({ error: 'Errore durante l\'aggiornamento del cliente' });
  }
};

export default withAdminAuth(handler);
