/**
 * API ENDPOINT: /api/asana/user-tasks
 * 
 * Recupera tutti i task di un utente specifico dal progetto Asana
 * 
 * Method: GET
 * Query: userId (Firebase UID dell'utente)
 * 
 * Returns: AsanaTaskListResponse
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { getUserTasks } from '@/lib/asana/asanaService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Solo GET
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { userId } = req.query;

    // Validazione input
    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ message: 'User ID non valido' });
    }

    console.log('[user-tasks] Richiesta con:', { userId });

    // Recupera task da Asana
    const result = await getUserTasks(userId);

    console.log('[user-tasks] Risultato ricevuto:', { count: result?.data?.length || 0 });
    
    // Log del primo task per vedere i campi disponibili
    if (result?.data && result.data.length > 0) {
      console.log('[user-tasks] Primo task completo:', JSON.stringify(result.data[0], null, 2));
    }

    // Risposta successo
    return res.status(200).json(result);

  } catch (error: any) {
    console.error('Errore API user-tasks:', error);
    
    return res.status(500).json({
      success: false,
      message: error.message || 'Errore durante il recupero dei task',
    });
  }
}
