import { NextApiRequest, NextApiResponse } from 'next';
import { adminDb } from '@/config/firebase-admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const { oobCode } = req.query;

    if (!oobCode || typeof oobCode !== 'string') {
        return res.status(400).json({ message: 'oobCode è obbligatorio' });
    }

    try {
        const tokenDoc = await adminDb.collection('passwordResetTokens').doc(oobCode).get();

        if (!tokenDoc.exists) {
            return res.status(404).json({ message: 'Token non trovato' });
        }

        const tokenData = tokenDoc.data();

        // Check if token is expired
        if (tokenData?.expiresAt && tokenData.expiresAt.toDate() < new Date()) {
            // Clean up expired token
            await adminDb.collection('passwordResetTokens').doc(oobCode).delete();
            return res.status(404).json({ message: 'Token scaduto' });
        }

        // Return user data without sensitive information
        res.status(200).json({
            email: tokenData?.email,
            firstName: tokenData?.firstName,
            lastName: tokenData?.lastName,
            clientId: tokenData?.clientId,
            ghlContactId: tokenData?.ghlContactId,
        });

    } catch (error: any) {
        console.error('Get reset token API error:', error);
        res.status(500).json({ message: 'Errore durante il recupero del token' });
    }
}