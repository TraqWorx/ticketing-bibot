/**
 * SERVICE: User Management
 * 
 * Wrapper per chiamate API backend sicure
 * 
 * Architettura:
 * Frontend → Service Layer → API Routes → Firebase Admin SDK → Firestore/Auth
 * 
 * Features:
 * - ✅ Creazione utente CLIENT con password sicura (backend)
 * - ✅ Custom claims per ruoli (Firebase Admin SDK)
 * - ✅ Lista utenti con query privilegiate
 * - ✅ Toggle stato utente (Auth + Firestore)
 * 
 * Sicurezza:
 * - Token Firebase ID verificato lato server
 * - Operazioni admin solo via Firebase Admin SDK
 * - Password mai esposte al frontend
 * - API keys protette server-side
 */

import { User, CreateUserInput } from '@/types/user';
import { auth } from '@/config/firebase';

/**
 * Helper: Get Firebase ID Token per autenticazione API
 */
async function getAuthToken(): Promise<string | null> {
  const currentUser = auth.currentUser;
  if (!currentUser) return null;
  return await currentUser.getIdToken();
}

/**
 * Crea nuovo utente CLIENT (via API backend)
 * Invia automaticamente email per impostare password
 */
export const createClientUser = async (input: CreateUserInput): Promise<{ user: User; message: string }> => {
  try {
    const token = await getAuthToken();
    
    if (!token) {
      throw new Error('Autenticazione richiesta');
    }

    const response = await fetch('/api/users/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(input),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Errore durante la creazione del cliente');
    }

    return {
      user: data.user,
      message: data.message,
    };
  } catch (error: any) {
    console.error('Error creating user:', error);
    throw new Error(error.message || 'Errore durante la creazione del cliente');
  }
};

/**
 * Recupera lista utenti CLIENT con paginazione e filtri (via API backend)
 */
export const getClientUsers = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<{
  users: User[];
  total: number;
  page: number;
  totalPages: number;
  limit: number;
}> => {
  try {
    const token = await getAuthToken();
    
    if (!token) {
      throw new Error('Autenticazione richiesta');
    }

    // Costruisci query string
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);

    const response = await fetch(`/api/users/list?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Errore durante il recupero dei clienti');
    }

    // Converti le date da stringhe a oggetti Date
    const users = data.users.map((user: any) => ({
      ...user,
      createdAt: new Date(user.createdAt),
      updatedAt: new Date(user.updatedAt),
    }));

    return {
      users,
      total: data.total,
      page: data.page,
      totalPages: data.totalPages,
      limit: data.limit,
    };
  } catch (error: any) {
    console.error('Error getting client users:', error);
    throw new Error(error.message || 'Errore durante il recupero dei clienti');
  }
};

/**
 * Aggiorna dati utente CLIENT (via API backend)
 */
export const updateUser = async (userId: string, data: { firstName: string; lastName: string; phone: string; ghl_contact_id: string }): Promise<User> => {
  try {
    const token = await getAuthToken();
    
    if (!token) {
      throw new Error('Autenticazione richiesta');
    }

    const response = await fetch('/api/users/update', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ userId, ...data }),
    });

    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(responseData.error || 'Errore durante l\'aggiornamento del cliente');
    }

    return {
      ...responseData.user,
      createdAt: new Date(responseData.user.createdAt),
      updatedAt: new Date(responseData.user.updatedAt),
    };
  } catch (error: any) {
    console.error('Error updating user:', error);
    throw new Error(error.message || 'Errore durante l\'aggiornamento del cliente');
  }
};

/**
 * Elimina utente definitivamente (via API backend)
 * ATTENZIONE: Operazione irreversibile
 */
export const deleteUser = async (userId: string): Promise<void> => {
  try {
    const token = await getAuthToken();
    
    if (!token) {
      throw new Error('Autenticazione richiesta');
    }

    const response = await fetch('/api/users/delete', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ userId }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Errore durante l\'eliminazione del cliente');
    }
  } catch (error: any) {
    console.error('Error deleting user:', error);
    throw new Error(error.message || 'Errore durante l\'eliminazione del cliente');
  }
};
