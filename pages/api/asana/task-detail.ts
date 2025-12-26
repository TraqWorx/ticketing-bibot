/**
 * API ENDPOINT: /api/asana/task-detail
 * 
 * Recupera il dettaglio completo di un task Asana
 * 
 * Method: GET
 * Query: taskGid (GID del task Asana)
 * 
 * Returns: AsanaTaskDetailResponse
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { getTaskDetail } from '@/lib/asana/asanaService';
import { withAuth } from '@/lib/auth-middleware';

export default withAuth(async (req: NextApiRequest, res: NextApiResponse) => {
  // Solo GET
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { taskGid } = req.query;

    // Validazione input
    if (!taskGid || typeof taskGid !== 'string') {
      return res.status(400).json({ message: 'Task GID non valido' });
    }

    // Recupera dettaglio task da Asana
    const result = await getTaskDetail(taskGid);

    // Risposta successo
    return res.status(200).json(result);

  } catch (error: any) {
    console.error('Errore API task-detail:', error);
    
    return res.status(500).json({
      success: false,
      message: error.message || 'Errore durante il recupero del dettaglio task',
    });
  }
});
