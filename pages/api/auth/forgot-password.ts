import { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth, adminDb } from '@/config/firebase-admin';
import { sendPasswordForgotEvent } from '@/lib/ghl/ghlService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: 'Email è obbligatoria' });
    }

    try {
        // First check if user exists in our database by querying email field
        const userQuery = await adminDb.collection('users').where('email', '==', email).limit(1).get();

        if (userQuery.empty) {
            return res.status(404).json({ message: 'Utente non trovato. Contatta un amministratore per registrarti.' });
        }

        const userDoc = userQuery.docs[0];
        const userData = userDoc.data();
        const { firstName, lastName, id: clientId, ghl_contact_id: ghlContactId } = userData;
        // Now generate reset link - this will verify user exists in Firebase Auth
        const firebaseResetLink = await adminAuth.generatePasswordResetLink(email, {
            url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password`,
        });

        // Extract oobCode from Firebase link and create our custom reset link
        const url = new URL(firebaseResetLink);
        const oobCode = url.searchParams.get('oobCode');
        const resetLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?oobCode=${oobCode}`;

        // Send to GHL
        await sendPasswordForgotEvent({
            clientId,
            ghlContactId,
            email,
            firstName,
            lastName,
            resetLink,
        });

        res.status(200).json({ message: 'Email di reset inviata con successo' });

    } catch (error: any) {
        console.error('Forgot password API error:', error);

        // Check if user doesn't exist
        if (error.code === 'auth/user-not-found' || error.message?.includes('no user record')) {
            return res.status(404).json({ message: 'Utente non trovato. Contatta un amministratore per registrarti.' });
        }

        res.status(500).json({ message: 'Errore durante l\'invio dell\'email di reset' });
    }
}