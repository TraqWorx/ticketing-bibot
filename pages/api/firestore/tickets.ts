import { withAuth } from '@/lib/auth-middleware';
import { applicationDefault, getApp, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Inizializza Firebase Admin SDK
if (!getApps().length) {
  initializeApp({
    credential: applicationDefault(),
  });
} else {
  getApp();
}

const db = getFirestore();

export default withAuth(async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId } = req.query;

  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid userId' });
  }

  try {
    const ticketsSnapshot = await db
      .collection('tickets')
      .where('clientId', '==', userId)
      .get();

    if (ticketsSnapshot.empty) {
      return res.status(200).json({});
    }

    const tickets: Record<string, any> = {};
    ticketsSnapshot.forEach((doc) => {
      const data = doc.data();
      tickets[doc.id] = {
        priority: data.priority || 'medium',
        waitingFor: data.waitingFor || null,
        clientId: data.clientId || null,
        clientName: data.clientName || null,
        clientPhone: data.clientPhone || null,
        ghlContactId: data.ghlContactId || null,
        createdAt: data.createdAt || null,
        lastActivityAt: data.lastActivityAt || null,
        status: data.status || null,
        title: data.title || null,
      };
    });

    return res.status(200).json(tickets);
  } catch (error) {
    console.error('Errore durante il recupero dei ticket:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});