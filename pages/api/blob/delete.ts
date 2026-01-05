/**
 * API ENDPOINT: /api/blob/delete
 * 
 * Elimina file da Vercel Blob Storage
 * 
 * Method: POST
 * Body: { urls: string[] }
 * 
 * Returns: { success, deleted }
 */

import { del } from '@vercel/blob';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { urls } = req.body;

    if (!urls || !Array.isArray(urls)) {
      return res.status(400).json({ message: 'URLs array è obbligatorio' });
    }

    // Elimina tutti i file
    await del(urls);

    return res.status(200).json({
      success: true,
      deleted: urls.length,
    });

  } catch (error: any) {
    console.error('Errore eliminazione blob:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Errore durante l\'eliminazione dei file',
    });
  }
}
