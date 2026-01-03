/**
 * API ENDPOINT: /api/asana/update-task
 *
 * Aggiorna un task su Asana
 *
 * Method: PUT
 * Body: { taskGid: string, updates: { completed?: boolean, name?: string, notes?: string } }
 *
 * Returns: { success, data }
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { updateAsanaTask } from '@/lib/asana/asanaService';
import { withAuth } from '@/lib/auth-middleware';

export default withAuth(async (req: NextApiRequest, res: NextApiResponse) => {
    // Solo PUT
    if (req.method !== 'PUT') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const { taskGid, updates } = req.body;

        // Validazione input
        if (!taskGid || typeof taskGid !== 'string') {
            return res.status(400).json({ message: 'Task GID non valido' });
        }

        if (!updates || typeof updates !== 'object') {
            return res.status(400).json({ message: 'Updates non validi' });
        }

        // Aggiorna task su Asana
        const result = await updateAsanaTask(taskGid, updates);

        // Risposta successo
        return res.status(200).json({
            success: true,
            data: result
        });

    } catch (error: any) {
        console.error('Errore API update-task:', error);

        // Axios error verso Asana
        if (error.response) {
            return res.status(error.response.status).json({
                success: false,
                message: error.response.data?.errors?.[0]?.message
                    ?? 'Errore Asana',
            });
        }

        // Errore applicativo
        return res.status(400).json({
            success: false,
            message: error.message ?? 'Errore aggiornamento task',
        });
    }

});