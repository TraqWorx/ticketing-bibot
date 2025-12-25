/**
 * API ENDPOINT: /api/webhooks/asana/test
 *
 * Endpoint di test per verificare il funzionamento del webhook Asana
 * Simula un evento di nuovo commento
 */

import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Payload di esempio per testare un nuovo commento
    const testEvent = {
      events: [
        {
          action: 'added',
          resource: {
            resource_type: 'story',
            resource_subtype: 'comment_added',
            gid: 'test_story_gid'
          },
          parent: {
            resource_type: 'task',
            gid: req.body.taskGid || '1201234567890123' // Usa taskGid dal body o default
          }
        }
      ]
    };

    console.log('[Asana Webhook Test] Simulating webhook call with payload:', testEvent);

    // Simula chiamata al webhook principale
    const axios = require('axios');
    const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/webhooks/asana`, testEvent, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Test webhook call completed',
      response: response.data
    });

  } catch (error: any) {
    console.error('[Asana Webhook Test] Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message,
      details: error.response?.data
    });
  }
}