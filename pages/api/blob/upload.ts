/**
 * API ENDPOINT: /api/blob/upload
 * 
 * Upload di file su Vercel Blob Storage (temporaneo)
 * Utilizzato per bypassare il limite di 4.5MB delle function Vercel
 * 
 * FLUSSO:
 * 1. Riceve file dal frontend
 * 2. Carica su Vercel Blob Storage
 * 3. Restituisce URL del file
 * 
 * Method: POST
 * Body: FormData { file }
 * 
 * Returns: { success, url, pathname }
 */

import { put } from '@vercel/blob';
import { NextApiRequest, NextApiResponse } from 'next';
import { IncomingForm } from 'formidable';
import fs from 'fs/promises';

// Disabilita body parser per gestire multipart/form-data
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Parse multipart/form-data
    const form = new IncomingForm({
      multiples: false,
      keepExtensions: true,
      maxFileSize: 50 * 1024 * 1024, // 50MB per file
    });

    const { files } = await new Promise<{ files: any }>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve({ files });
      });
    });

    // Formidable può restituire un array o un singolo file
    let file = files.file;
    if (Array.isArray(file)) {
      file = file[0];
    }

    if (!file) {
      return res.status(400).json({ message: 'Nessun file caricato' });
    }

    // Compatibilità con diverse versioni di formidable
    const filePath = file.filepath || file.path;
    if (!filePath) {
      return res.status(400).json({ message: 'File path non valido' });
    }

    // Leggi il file
    const fileStream = await fs.readFile(filePath);
    
    // Carica su Vercel Blob Storage
    const blob = await put(file.originalFilename || file.name || 'attachment', fileStream, {
      access: 'public',
      addRandomSuffix: true,
      contentType: file.mimetype || file.type || 'application/octet-stream',
    });

    // Elimina file temporaneo locale
    await fs.unlink(filePath).catch(() => {});

    return res.status(200).json({
      success: true,
      url: blob.url,
      pathname: blob.pathname,
    });

  } catch (error: any) {
    console.error('Errore upload blob:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Errore durante l\'upload del file',
    });
  }
}
