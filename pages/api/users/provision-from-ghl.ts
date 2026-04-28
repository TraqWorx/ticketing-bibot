/**
 * API ROUTE: Provision Cockpit User from GHL Contact
 *
 * POST /api/users/provision-from-ghl
 *
 * Idempotent endpoint called by a GHL workflow after a customer purchase.
 * Given a GHL contact (already existing in GHL), creates a corresponding
 * cockpit user in Firebase Auth + Firestore and fires the welcome workflow
 * (password setup link via WhatsApp/email).
 *
 * Auth: Service-only via X-API-Key header (validates against GHL_API_ACCESS_TOKEN).
 *
 * Body:
 *   {
 *     "ghlContactId": "abc123",      // optional but recommended
 *     "email": "client@example.com", // REQUIRED
 *     "firstName": "Mario",
 *     "lastName": "Rossi",
 *     "phone": "+39...",
 *     "company": "Acme SRL"          // optional
 *   }
 *
 * Behavior:
 *   - If email already maps to an existing Firebase user → return 200 (idempotent),
 *     update Firestore profile with latest GHL data. Do NOT re-send welcome.
 *   - Otherwise → create Firebase user, set role=CLIENT custom claim,
 *     write Firestore doc, send PASSWORD_RESET webhook.
 */

import { NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '@/lib/auth-middleware';
import { adminAuth, adminDb } from '@/config/firebase-admin';
import { UserRole } from '@/types';
import { searchGHLContact, sendPasswordResetEvent } from '@/lib/ghl/ghlService';

interface ProvisionBody {
  ghlContactId?: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  company?: string;
}

async function sendPasswordResetWebhook(userData: {
  id: string;
  ghl_contact_id: string;
  email: string;
  firstName: string;
  lastName: string;
}): Promise<void> {
  const firebaseResetLink = await adminAuth.generatePasswordResetLink(userData.email, {
    url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password`,
  });

  const url = new URL(firebaseResetLink);
  const oobCode = url.searchParams.get('oobCode');
  if (!oobCode) throw new Error('Impossibile estrarre il codice OOB');

  const customResetLink = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?oobCode=${oobCode}`;

  await adminDb.collection('passwordResetTokens').doc(oobCode).set({
    email: userData.email,
    firstName: userData.firstName,
    lastName: userData.lastName,
    clientId: userData.id,
    ghlContactId: userData.ghl_contact_id,
    oobCode,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  });

  await sendPasswordResetEvent({
    clientId: userData.id,
    ghlContactId: userData.ghl_contact_id,
    email: userData.email,
    firstName: userData.firstName,
    lastName: userData.lastName,
    resetLink: customResetLink,
  });
}

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (req.auth?.type !== 'service') {
    return res.status(403).json({ error: 'Service auth required' });
  }

  const { ghlContactId: providedGhlId, email, firstName = '', lastName = '', phone = '', company = '' } =
    (req.body || {}) as ProvisionBody;

  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Email è obbligatoria' });
  }

  const normalizedEmail = email.trim().toLowerCase();

  try {
    let ghlContactId = providedGhlId || '';
    if (!ghlContactId) {
      const ghlContact = await searchGHLContact(normalizedEmail);
      if (ghlContact) ghlContactId = ghlContact.id;
    }

    let existing;
    try {
      existing = await adminAuth.getUserByEmail(normalizedEmail);
    } catch (err: any) {
      if (err.code !== 'auth/user-not-found') throw err;
    }

    if (existing) {
      const docRef = adminDb.collection('users').doc(existing.uid);
      const snap = await docRef.get();
      const updates: Record<string, any> = {
        updatedAt: new Date().toISOString(),
        ...(ghlContactId ? { ghl_contact_id: ghlContactId } : {}),
        ...(firstName ? { firstName } : {}),
        ...(lastName ? { lastName } : {}),
        ...(phone ? { phone } : {}),
        ...(company ? { company } : {}),
      };
      await docRef.set(updates, { merge: true });

      return res.status(200).json({
        success: true,
        action: 'already_provisioned',
        message: 'Utente già esistente. Profilo aggiornato.',
        userId: existing.uid,
      });
    }

    const userRecord = await adminAuth.createUser({
      email: normalizedEmail,
      displayName: `${firstName} ${lastName}`.trim() || normalizedEmail,
      emailVerified: false,
    });

    await adminAuth.setCustomUserClaims(userRecord.uid, { role: UserRole.CLIENT });

    const userData = {
      id: userRecord.uid,
      ghl_contact_id: ghlContactId,
      email: normalizedEmail,
      firstName,
      lastName,
      phone,
      company,
      role: UserRole.CLIENT,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      delegates: [],
    };

    await adminDb.collection('users').doc(userRecord.uid).set(userData);

    try {
      await sendPasswordResetWebhook(userData);
    } catch (welcomeErr: any) {
      console.error('[provision-from-ghl] Welcome webhook failed (user still created):', welcomeErr);
    }

    return res.status(201).json({
      success: true,
      action: 'provisioned',
      message: 'Cliente creato. Welcome message inviato.',
      userId: userRecord.uid,
    });
  } catch (error: any) {
    console.error('[provision-from-ghl] Error:', error);
    if (error.code === 'auth/email-already-exists') {
      return res.status(409).json({ error: 'Email già registrata' });
    }
    if (error.code === 'auth/invalid-email') {
      return res.status(400).json({ error: 'Email non valida' });
    }
    return res.status(500).json({ error: 'Errore durante il provisioning' });
  }
}

export default withAuth(handler);
