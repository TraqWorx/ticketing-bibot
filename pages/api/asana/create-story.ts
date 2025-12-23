/**
 * API ENDPOINT: /api/asana/create-story
 * 
 * Crea un nuovo commento su un task Asana con allegati
 * 
 * Method: POST
 * Body: FormData { taskGid, text, attachments[] }
 * 
 * Returns: { success, data: story, attachmentsCount, attachmentErrors }
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { IncomingForm, File } from 'formidable';
import { createTaskStory, uploadAsanaAttachment } from '@/lib/asana/asanaService';
import fs from 'fs/promises';

// Disabilita body parser di Next.js per gestire multipart/form-data
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Solo POST
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Parse multipart/form-data con formidable
    const form = new IncomingForm({
      multiples: true,
      keepExtensions: true,
    });

    const { fields, files } = await new Promise<{ fields: any; files: any }>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve({ fields, files });
      });
    });

    // Estrai dati dal form
    const taskGid = Array.isArray(fields.taskGid) ? fields.taskGid[0] : fields.taskGid;
    const text = Array.isArray(fields.text) ? fields.text[0] : fields.text;

    // Validazione
    if (!taskGid || typeof taskGid !== 'string') {
      return res.status(400).json({ message: 'Task GID è obbligatorio' });
    }

    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ message: 'Il testo del commento è obbligatorio' });
    }

    // STEP 1: Crea commento su Asana
    const result = await createTaskStory(taskGid, text);

    let attachmentsUploaded = 0;
    let totalAttachments = 0;

    // STEP 2: Upload allegati se presenti
    if (files.attachments) {
      const attachmentFiles = Array.isArray(files.attachments) 
        ? files.attachments 
        : [files.attachments];

      totalAttachments = attachmentFiles.length;

      for (const file of attachmentFiles) {
        try {
          // Leggi file da temp path
          const fileBuffer = await fs.readFile(file.filepath);

          // Upload su Asana
          await uploadAsanaAttachment(
            taskGid, 
            fileBuffer, 
            file.originalFilename || 'attachment',
            file.mimetype || undefined
          );
          
          attachmentsUploaded++;

          // Elimina file temporaneo
          await fs.unlink(file.filepath).catch(() => {});
        } catch (uploadError: any) {
          console.error(`[create-story] Errore upload allegato ${file.originalFilename}:`, uploadError.message);
          // Continua con gli altri file anche se uno fallisce
        }
      }
    }

    return res.status(200).json({
      success: true,
      data: result.data,
      attachmentsCount: attachmentsUploaded,
      attachmentErrors: totalAttachments - attachmentsUploaded,
      message: attachmentsUploaded > 0 
        ? `Commento aggiunto con ${attachmentsUploaded} allegato/i`
        : 'Commento aggiunto con successo',
    });
  } catch (error: any) {
    console.error('Errore API create-story:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Errore durante la creazione del commento',
    });
  }
}
