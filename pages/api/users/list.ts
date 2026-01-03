/**
 * API ROUTE: List Client Users
 * 
 * GET /api/users/list?page=1&limit=10&search=mario
 * 
 * Recupera lista utenti CLIENT con paginazione e filtri
 * 
 * Query params:
 * - page: numero pagina (default: 1)
 * - limit: items per pagina (default: 10)
 * - search: cerca in firstName, lastName, email, client_id
 * 
 * Response:
 * - users: array utenti
 * - total: totale utenti (con filtri applicati)
 * - page: pagina corrente
 * - totalPages: totale pagine
 * - limit: items per pagina
 * 
 * Sicurezza: Solo ADMIN autenticati
 */

import { NextApiResponse } from 'next';
import { withAdminAuth, AuthenticatedRequest } from '@/lib/auth-middleware';
import { adminDb } from '@/config/firebase-admin';
import { UserRole } from '@/types';

async function handler(
  req: AuthenticatedRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parsing query params
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string || '').toLowerCase().trim();

    // Recupera tutti gli utenti CLIENT (Firestore non supporta full-text search nativo)
    const usersRef = adminDb.collection('users');
    const snapshot = await usersRef.where('role', '==', UserRole.CLIENT).get();

    let users: any[] = [];
    snapshot.forEach((doc) => {
      users.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    // Filtro search lato server
    if (search) {
      // Controlla se il search ha un filtro specifico (es: "name:mario" o "email:test@")
      let filterField: string | null = null;
      let searchValue = search;
      
      if (search.includes(':')) {
        const [field, value] = search.split(':');
        if (['name', 'email'].includes(field) && value) {
          filterField = field;
          searchValue = value.toLowerCase();
        }
      }
      
      users = users.filter(user => {
        const firstName = (user.firstName || '').toLowerCase();
        const lastName = (user.lastName || '').toLowerCase();
        const fullName = `${firstName} ${lastName}`;
        const email = (user.email || '').toLowerCase();
        const clientId = (user.client_id || '').toLowerCase();
        
        // Filtro specifico per campo
        if (filterField === 'name') {
          return firstName.includes(searchValue) ||
                 lastName.includes(searchValue) ||
                 fullName.includes(searchValue);
        }
        
        if (filterField === 'email') {
          return email.includes(searchValue);
        }
        
        // Filtro su tutti i campi (default)
        return firstName.includes(searchValue) ||
               lastName.includes(searchValue) ||
               fullName.includes(searchValue) ||
               email.includes(searchValue) ||
               clientId.includes(searchValue);
      });
    }

    // Ordina per data creazione (più recente prima)
    users.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA;
    });

    // Calcola paginazione
    const total = users.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedUsers = users.slice(startIndex, endIndex);

    return res.status(200).json({
      users: paginatedUsers,
      total,
      page,
      totalPages,
      limit,
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({ error: 'Errore durante il caricamento degli utenti' });
  }
}

export default withAdminAuth(handler);
