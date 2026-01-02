/**
 * MIDDLEWARE: Auth Verification
 * 
 * Supporta due meccanismi di autenticazione:
 * 1. Firebase Auth (utenti loggati) → Bearer token
 * 2. API Key (servizi esterni) → X-API-Key header
 * 
 * Verifica token Firebase nelle API Routes
 * Fallback a Firestore se custom claims non esistono (utenti pre-migrazione)
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth, adminDb } from '@/config/firebase-admin';

export interface ServiceIdentity {
  type: 'service';
  name: string;
  description: string;
}

export interface UserIdentity {
  type: 'user';
  uid: string;
  email: string;
  role?: string;
}

export type AuthIdentity = UserIdentity | ServiceIdentity;

export interface AuthenticatedRequest extends NextApiRequest {
  user?: UserIdentity;
  service?: ServiceIdentity;
  auth?: AuthIdentity;
}

export function withAuth(
  handler: (req: AuthenticatedRequest, res: NextApiResponse, auth: AuthIdentity) => Promise<void>
) {
  return async (req: AuthenticatedRequest, res: NextApiResponse) => {
    const auth = await verifyAuth(req);

    if (!auth) {
      return res.status(401).json({ error: 'Non autorizzato' });
    }

    // Popola req.user o req.service in base al tipo
    if (auth.type === 'user') {
      req.user = auth;
    } else {
      req.service = auth;
    }
    req.auth = auth;

    return handler(req, res, auth);
  };
}

export function withAdminAuth(
  handler: (req: AuthenticatedRequest, res: NextApiResponse, user: UserIdentity) => Promise<void>
) {
  return async (req: AuthenticatedRequest, res: NextApiResponse) => {
    const auth = await verifyAuth(req);

    if (!auth) {
      return res.status(401).json({ error: 'Non autorizzato' });
    }

    // Solo utenti possono essere admin (non servizi)
    if (auth.type !== 'user') {
      return res.status(403).json({ error: 'Accesso negato. Solo utenti admin.' });
    }

    // Verifica ruolo ADMIN
    if (auth.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Accesso negato. Solo admin.' });
    }

    req.user = auth;
    req.auth = auth;
    return handler(req, res, auth);
  };
}

/**
 * Verifica autenticazione da Firebase (utenti) o API Key (servizi esterni)
 */
async function verifyAuth(req: AuthenticatedRequest): Promise<AuthIdentity | null> {
  // 1. Controlla prima se è una chiamata da servizio esterno (API Key)
  const apiKey = req.headers['x-api-key'] as string;
  
  if (apiKey) {
    const service = verifyApiKey(apiKey);
    if (service) {
      return service;
    }
    // API Key presente ma non valida → return null (401)
    return null;
  }

  // 2. Se non c'è API Key, controlla Firebase token
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
      type: 'user',
      uid: decodedToken.uid,
      email: decodedToken.email || '',
      role,
    };
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

/**
 * Valida API Key per servizi esterni
 * API Keys configurate in .env
 */
function verifyApiKey(apiKey: string): ServiceIdentity | null {
  // Mappa delle API keys valide (abilitate con X-API-Key)
  const validApiKeys: Record<string, ServiceIdentity> = {
    [process.env.GHL_API_ACCESS_TOKEN || '']: {
      type: 'service',
      name: 'ghl',
      description: 'Go High Level Service (Access Token)',
    },
    // Aggiungi altre API keys qui se necessario
    // [process.env.OTHER_SERVICE_API_KEY || '']: { ... },
  };

  const service = validApiKeys[apiKey];
  
  if (service) {
    return service;
  }

  console.warn(`[Auth] API Key non valida: ${apiKey.substring(0, 10)}...`);
  return null;
}

/**
 * USAGE EXAMPLES:
 * 
 * 1. API protetta per utenti E servizi esterni:
 * 
 * export default withAuth(async (req, res, auth) => {
 *   if (auth.type === 'user') {
 *     // Logica per utente autenticato
 *     const userId = auth.uid;
 *   } else if (auth.type === 'service') {
 *     // Logica per servizio esterno
 *     const serviceName = auth.name;
 *   }
 * });
 * 
 * 2. API protetta solo per utenti admin:
 * 
 * export default withAdminAuth(async (req, res, user) => {
 *   // user è sempre di tipo UserIdentity con role === 'ADMIN'
 * });
 * 
 * 3. Chiamate da Go High Level:
 * 
 * fetch('/api/endpoint', {
 *   headers: {
 *     'X-API-Key': 'ghl_xxx_your_api_key'
 *   }
 * });
 * 
 * 4. Chiamate da frontend (utenti):
 * 
 * fetch('/api/endpoint', {
 *   headers: {
 *     'Authorization': 'Bearer firebase_id_token'
 *   }
 * });
 */