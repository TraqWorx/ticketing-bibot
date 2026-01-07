/**
 * API ROUTE: Create Client User
 * 
 * POST /api/users/create
 * 
 * Crea nuovo utente CLIENT con Firebase Admin SDK
 * 
 * Sicurezza: Solo ADMIN autenticati
 */

import { NextApiResponse } from 'next';
import { withAdminAuth, AuthenticatedRequest } from '@/lib/auth-middleware';
import { adminAuth, adminDb } from '@/config/firebase-admin';
import { UserRole } from '@/types';
import { searchGHLContact, createGHLContact, sendPasswordResetEvent } from '@/lib/ghl/ghlService';

interface CreateUserBody {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  company: string;
}

// Genera link di reset password e invia webhook a GHL per email custom
async function sendPasswordResetWebhook(userData: {
  id: string;
  ghl_contact_id: string;
  email: string;
  firstName: string;
  lastName: string;
}): Promise<void> {
  try {
    // Genera link di reset password di Firebase per ottenere il codice OOB
    const firebaseResetLink = await adminAuth.generatePasswordResetLink(userData.email, {
      url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password`,
    });

    // Estrai il codice OOB dal link di Firebase
    const url = new URL(firebaseResetLink);
    const oobCode = url.searchParams.get('oobCode');

    if (!oobCode) {
      throw new Error('Impossibile estrarre il codice OOB dal link di Firebase');
    }

    // Crea link personalizzato che punta alla nostra pagina
    const customResetLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?oobCode=${oobCode}`;

    // Invia webhook a GHL per gestire l'invio dell'email custom
    await sendPasswordResetEvent({
      clientId: userData.id,
      ghlContactId: userData.ghl_contact_id,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      resetLink: customResetLink,
    });

  } catch (error) {
    console.error('Error sending password reset webhook:', error);
    throw error;
  }
}

async function handler(
  req: AuthenticatedRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, firstName, lastName, phone, company } = req.body as CreateUserBody;

    // Validazione input
    if (!email || !firstName || !lastName) {
      return res.status(400).json({ error: 'Campi obbligatori mancanti' });
    }

    // 0. Cerca o crea contatto su Go High Level
    let ghlContactId = '';

    // Cerca contatto esistente solo per email
    let ghlContact = await searchGHLContact(email);

    if (ghlContact) {
      // Contatto trovato, usa il suo ID
      ghlContactId = ghlContact.id;
    } else {
      // Contatto non trovato, creane uno nuovo
      ghlContact = await createGHLContact({
        email,
        firstName,
        lastName,
        phone,
      });
      ghlContactId = ghlContact.id;
    }

    // 1. Crea utente in Firebase Auth (SENZA password)
    // La password verrà impostata dall'utente tramite link reset
    const userRecord = await adminAuth.createUser({
      email,
      displayName: `${firstName} ${lastName}`,
      emailVerified: false,
    });

    // 2. Set custom claims per ruolo
    await adminAuth.setCustomUserClaims(userRecord.uid, { role: UserRole.CLIENT });

    // 3. Salva dati in Firestore
    const userData = {
      id: userRecord.uid,
      ghl_contact_id: ghlContactId,
      email,
      firstName,
      lastName,
      phone: phone || '',
      company: company || '',
      role: UserRole.CLIENT,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await adminDb.collection('users').doc(userRecord.uid).set(userData);

    // 5. Genera link reset password e invia webhook a GHL per email custom
    await sendPasswordResetWebhook(userData);

    // Messaggio di successo personalizzato
    let message = 'Cliente creato. Email e messaggio WhatsApp inviati per impostare la password.';

    return res.status(201).json({
      success: true,
      user: userData,
      message: message,
    });
  } catch (error: any) {
    console.error('Error creating user:', error);

    // Gestione errori Go High Level
    if (error.message && error.message.includes('Go High Level')) {
      return res.status(400).json({
        error: error.message
      });
    }

    // Gestione errori Firebase specifici
    if (error.code === 'auth/email-already-exists') {
      return res.status(400).json({ error: 'Email già registrata' });
    } else if (error.code === 'auth/invalid-email') {
      return res.status(400).json({ error: 'Email non valida' });
    } else if (error.code === 'auth/invalid-password') {
      return res.status(400).json({ error: 'Password non valida' });
    }

    return res.status(500).json({ error: 'Errore durante la creazione del cliente' });
  }
}

export default withAdminAuth(handler);
