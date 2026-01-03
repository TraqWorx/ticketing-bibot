/**
 * API ENDPOINT: /api/asana/task-stories
 * 
 * Recupera i commenti (stories) di un task Asana
 * 
 * Method: GET
 * Query: { taskGid }
 * 
 * Returns: { success, data: stories[] }
 */

import { getTaskStories } from '@/lib/asana/asanaService';
import { withAuth } from '@/lib/auth-middleware';
import { NextApiRequest, NextApiResponse } from 'next';

export default withAuth(async (req: NextApiRequest, res: NextApiResponse) => {
  // Solo GET
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { taskGid } = req.query;

    // Validazione
    if (!taskGid || typeof taskGid !== 'string') {
      return res.status(400).json({ message: 'Task GID è obbligatorio' });
    }

    // Recupera commenti da Asana
    const result = await getTaskStories(taskGid);

    return res.status(200).json({
      success: true,
      data: result.data || [],
    });
  } catch (error: any) {
    console.error('Errore API task-stories:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Errore durante il recupero dei commenti',
    });
  }
});