/**
 * MIDDLEWARE: Auth Verification
 * 
 * Verifica token Firebase nelle API Routes
 * Fallback a Firestore se custom claims non esistono (utenti pre-migrazione)
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth, adminDb } from '@/config/firebase-admin';

export interface AuthenticatedRequest extends NextApiRequest {
  user?: {
    uid: string;
    email: string;
    role?: string;
  };
}

export async function verifyAuth(req: AuthenticatedRequest): Promise<{ uid: string; email: string; role?: string } | null> {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return null;
    }

    const decodedToken = await adminAuth.verifyIdToken(token);
    
    let role = decodedToken.role;
    
    // FALLBACK: Se custom claim non esiste, controlla Firestore
    // (utenti creati prima della migrazione backend)
    if (!role) {
      const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
      if (userDoc.exists) {
        role = userDoc.data()?.role;
        
        // Imposta custom claim per future richieste
        if (role) {
          await adminAuth.setCustomUserClaims(decodedToken.uid, { role });
        }
      }
    }
    
    return {
      uid: decodedToken.uid,
      email: decodedToken.email || '',
      role,
    };
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

export function withAuth(
  handler: (req: AuthenticatedRequest, res: NextApiResponse, user: { uid: string; email: string; role?: string }) => Promise<void>
) {
  return async (req: AuthenticatedRequest, res: NextApiResponse) => {
    const user = await verifyAuth(req);

    if (!user) {
      return res.status(401).json({ error: 'Non autorizzato' });
    }

    req.user = user;
    return handler(req, res, user);
  };
}

export function withAdminAuth(
  handler: (req: AuthenticatedRequest, res: NextApiResponse, user: { uid: string; email: string; role?: string }) => Promise<void>
) {
  return async (req: AuthenticatedRequest, res: NextApiResponse) => {
    const user = await verifyAuth(req);

    if (!user) {
      return res.status(401).json({ error: 'Non autorizzato' });
    }

    // Verifica ruolo ADMIN
    if (user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Accesso negato. Solo admin.' });
    }

    req.user = user;
    return handler(req, res, user);
  };
}
