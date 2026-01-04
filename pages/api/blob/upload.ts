/**
 * API ENDPOINT: /api/blob/upload
 * 
 * Genera token per upload client-side su Vercel Blob Storage
 * Utilizzato per bypassare il limite di 4.5MB delle function Vercel
 * 
 * FLUSSO:
 * 1. Riceve nome file dal frontend
 * 2. Genera un token di upload temporaneo
 * 3. Il client usa questo token per caricare direttamente
 * 
 * Method: POST
 * Body: { filename: string }
 * 
 * Returns: { url: string, token: string }
 */

import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const body = req.body as HandleUploadBody;

    const jsonResponse = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (pathname) => {
        // Validazione opzionale: puoi controllare auth, limiti, etc
        return {
          allowedContentTypes: [
            'image/*',
            'video/*',
            'audio/*',
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain',
          ],
          tokenPayload: JSON.stringify({
            uploadedAt: new Date().toISOString(),
          }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // Callback opzionale dopo upload completato
        console.log('[Blob Upload] File caricato:', blob.url);
      },
    });

    return res.status(200).json(jsonResponse);

  } catch (error: any) {
    console.error('Errore generazione token blob:', error);
    return res.status(500).json({
      message: error.message || 'Errore durante la generazione del token',
    });
  }
}

