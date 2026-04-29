/**
 * API ENDPOINT: /api/tickets/reopen
 *
 * Riapre un ticket: sposta il task Asana nella sezione "Aperti" e rimuove
 * la spunta "completed". L'evento viene poi propagato a Firestore + GHL
 * dal webhook Asana → /api/webhooks/asana.
 *
 * Method: POST
 * Body: { taskGid: string }
 */

import { NextApiResponse } from 'next';
import { moveAsanaTaskToSection, updateAsanaTask } from '@/lib/asana/asanaService';
import { withAuth, AuthenticatedRequest } from '@/lib/auth-middleware';

export default withAuth(async (req: AuthenticatedRequest, res: NextApiResponse) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const { taskGid } = (req.body || {}) as { taskGid?: string };
    if (!taskGid || typeof taskGid !== 'string') {
        return res.status(400).json({ message: 'Task GID non valido' });
    }

    const sectionGid = process.env.ASANA_SECTION_OPEN_GID;
    if (!sectionGid) {
        return res.status(500).json({ message: 'ASANA_SECTION_OPEN_GID non configurato' });
    }

    try {
        await moveAsanaTaskToSection(taskGid, sectionGid);
        await updateAsanaTask(taskGid, { completed: false });
        return res.status(200).json({ success: true });
    } catch (error: any) {
        console.error('[tickets/reopen] errore:', error.message);
        if (error.response) {
            return res.status(error.response.status).json({
                success: false,
                message: error.response.data?.errors?.[0]?.message ?? 'Errore Asana',
            });
        }
        return res.status(500).json({
            success: false,
            message: error.message ?? 'Errore riapertura ticket',
        });
    }
});
