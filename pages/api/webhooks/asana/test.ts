/**
 * API ENDPOINT: /api/webhooks/asana/test
 *
 * Endpoint di test per verificare il funzionamento del webhook Asana
 * Simula eventi: nuovo commento, cambio nome task, task completato
 */

import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { eventType, taskGid, newName } = req.body;

    let testEvent: any;

    switch (eventType) {
      case 'comment':
        testEvent = {
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
                gid: taskGid || '1201234567890123'
              }
            }
          ]
        };
        break;

      case 'name_change':
        testEvent = {
          events: [
            {
              action: 'changed',
              resource: {
                resource_type: 'task',
                gid: taskGid || '1201234567890123'
              },
              change: {
                field: 'name',
                new_value: newName || 'Nuovo titolo del ticket'
              }
            }
          ]
        };
        break;

      case 'complete':
        testEvent = {
          events: [
            {
              action: 'changed',
              resource: {
                resource_type: 'task',
                gid: taskGid || '1201234567890123'
              },
              change: {
                field: 'completed',
                new_value: true
              }
            }
          ]
        };
        break;

      default:
        testEvent = {
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
                gid: taskGid || '1201234567890123'
              }
            }
          ]
        };
    }

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
      message: `Test webhook call completed for ${eventType || 'comment'}`,
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