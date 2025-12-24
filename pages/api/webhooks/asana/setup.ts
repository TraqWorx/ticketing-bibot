/**
 * API ENDPOINT: /api/webhooks/asana/setup
 * 
 * Registra il webhook su Asana per ricevere notifiche
 * 
 * IMPORTANTE: Chiamare questo endpoint UNA VOLTA per attivare il webhook
 * 
 * Method: POST
 * Body: { projectGid?: string } (opzionale, usa ASANA_PROJECT_GID se non specificato)
 * 
 * Prerequisiti:
 * - ASANA_ACCESS_TOKEN configurato
 * - ASANA_PROJECT_GID configurato (o passato nel body)
 * - ASANA_WEBHOOK_TARGET_URL configurato (URL pubblico di /api/webhooks/asana)
 * 
 * Asana invierà webhook per:
 * - stories (commenti) → notifica cliente quando admin risponde
 * - tasks (changed) → notifica cliente quando ticket completato
 */

import { NextApiResponse } from 'next';
import { withAuth } from '@/lib/auth-middleware';

export default withAuth(async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const projectGid = req.body?.projectGid || process.env.ASANA_PROJECT_GID;
  const targetUrl = process.env.ASANA_WEBHOOK_TARGET_URL;

  if (!process.env.ASANA_ACCESS_TOKEN) {
    return res.status(400).json({ message: 'ASANA_ACCESS_TOKEN non configurato' });
  }
  if (!projectGid) {
    return res.status(400).json({ message: 'ASANA_PROJECT_GID non configurato' });
  }
  if (!targetUrl) {
    return res.status(400).json({ 
      message: 'ASANA_WEBHOOK_TARGET_URL non configurato. Deve essere l\'URL pubblico di /api/webhooks/asana' 
    });
  }

  try {
    const axios = require('axios');

    // Registra webhook su Asana
    const response = await axios.post(
      `${process.env.ASANA_API_BASE_URL}/webhooks`,
      {
        data: {
          resource: projectGid,
          target: targetUrl,
          filters: [
            {
              resource_type: 'story',
              action: 'added',
            },
            {
              resource_type: 'task',
              action: 'changed',
              fields: ['completed'],
            },
          ],
        },
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.ASANA_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return res.status(201).json({
      success: true,
      message: 'Webhook Asana registrato con successo',
      webhook: response.data.data,
    });
  } catch (error: any) {
    console.error('[Asana Webhook Setup] Errore:', error.response?.data || error.message);

    // Gestisci errore specifico se webhook già esiste
    if (error.response?.status === 403) {
      return res.status(403).json({
        success: false,
        message: 'Permessi insufficienti. Verifica che il token abbia accesso al progetto.',
        error: error.response?.data,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Errore durante la registrazione del webhook',
      error: error.response?.data || error.message,
    });
  }
});
