/**
 * CONFIG: Firebase Admin SDK
 * 
 * Configurazione backend Firebase per operazioni privilegiate
 * 
 * Features:
 * - Creazione utenti con custom claims
 * - Gestione utenti lato server
 * - Operazioni privilegiate Firestore
 * 
 * IMPORTANTE: Usa solo in API Routes (server-side)
 */

import * as admin from 'firebase-admin';

// Inizializza Firebase Admin solo se non già inizializzato
if (!admin.apps.length) {
  try {
    // Inizializza con credenziali da variabili ambiente
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
      databaseURL: `https://${process.env.FIREBASE_ADMIN_PROJECT_ID}.firebaseio.com`,
    });
    
    console.log('✅ Firebase Admin initialized');
  } catch (error) {
    console.error('❌ Firebase Admin initialization error:', error);
  }
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();

export default admin;
