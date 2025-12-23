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
import { searchGHLContact, createGHLContact } from '@/lib/ghl/ghlService';

interface CreateUserBody {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
}

// Invia email tramite Firebase Auth (sistema integrato)
async function sendPasswordSetupEmail(email: string): Promise<void> {
  // Firebase invia automaticamente email quando usi il client SDK
  // Per inviare da server, usiamo fetch per chiamare il REST API di Firebase
  
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  
  if (!apiKey) {
    console.error('FIREBASE_API_KEY not configured');
    return;
  }

  try {
    const axios = require('axios');
    await axios.post(
      `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${apiKey}`,
      {
        requestType: 'PASSWORD_RESET',
        email: email,
      }
    );

  } catch (error) {
    console.error('Error sending password reset email:', error);
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
    const { email, firstName, lastName, phone } = req.body as CreateUserBody;

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
      role: UserRole.CLIENT,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await adminDb.collection('users').doc(userRecord.uid).set(userData);

    // 5. Invia email automatica Firebase per impostare password
    // Firebase invierà email con template configurato nella console
    await sendPasswordSetupEmail(email);

    // TODO: 6. Trigger onboarding GoHighLevel
    // await triggerGhlOnboarding(userData);

    // Messaggio di successo personalizzato
    let message = 'Cliente creato. Email inviata per impostare la password.';
    if (ghlContact.existingContact) {
      message = `Cliente creato con contatto Go High Level esistente. Email inviata per impostare la password.`;
    }

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
