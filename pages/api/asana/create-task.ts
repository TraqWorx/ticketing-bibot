/**
 * API ENDPOINT: /api/asana/create-task
 * 
 * Crea un nuovo task su Asana per un ticket cliente con allegati
 * 
 * FLUSSO:
 * 1. Crea task su Asana
 * 2. Upload allegati
 * 3. Salva ticket su Firestore (tracking stato)
 * 4. Invia messaggi WhatsApp via GHL
 * 5. Invia webhook evento a GHL per automazioni
 * 
 * Method: POST
 * Body: FormData { title, description, creatorId, creatorName, creatorPhone, ghlContactId, attachments[] }
 * 
 * Returns: { success, taskGid, taskUrl, attachmentsCount, whatsappErrors }
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { IncomingForm, File } from 'formidable';
import { createAsanaTask, uploadAsanaAttachment } from '@/lib/asana/asanaService';
import { sendMessage, sendTicketCreatedEvent } from '@/lib/ghl/ghlService';
import { getClientTicketCreatedMessage, getAdminTicketCreatedMessage } from '@/lib/ghl/messages';
import { createTicket } from '@/lib/ticket/ticketService';
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
    const title = Array.isArray(fields.title) ? fields.title[0] : fields.title;
    const description = Array.isArray(fields.description) ? fields.description[0] : fields.description;
    const priority = (Array.isArray(fields.priority) ? fields.priority[0] : fields.priority) as 'high' | 'medium' | 'low' || 'medium';
    const creatorId = Array.isArray(fields.creatorId) ? fields.creatorId[0] : fields.creatorId;
    const creatorName = Array.isArray(fields.creatorName) ? fields.creatorName[0] : fields.creatorName;
    const creatorPhone = Array.isArray(fields.creatorPhone) ? fields.creatorPhone[0] : fields.creatorPhone;
    const creatorEmail = Array.isArray(fields.creatorEmail) ? fields.creatorEmail[0] : fields.creatorEmail;
    const ghlContactId = Array.isArray(fields.ghlContactId) ? fields.ghlContactId[0] : fields.ghlContactId;

    // Validazione input
    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ message: 'Il titolo è obbligatorio' });
    }

    if (!description || typeof description !== 'string' || !description.trim()) {
      return res.status(400).json({ message: 'La descrizione è obbligatoria' });
    }

    if (!creatorId || typeof creatorId !== 'string') {
      return res.status(400).json({ message: 'Creator ID non valido' });
    }

    if (!creatorName || typeof creatorName !== 'string') {
      return res.status(400).json({ message: 'Creator Name non valido' });
    }

    if (!creatorPhone || typeof creatorPhone !== 'string') {
      return res.status(400).json({ message: 'Creator Phone non valido' });
    }

    // Crea task su Asana (STEP 1)
    const taskResult = await createAsanaTask({
      name: title,
      notes: description,
      priority,
      creatorId,
      creatorName,
      creatorPhone,
    });

    // STEP 2: Estrai il task_gid dalla risposta
    const taskGid = taskResult.data.gid;

    let attachmentsUploaded = 0;
    let totalAttachments = 0;

    // STEP 3: Upload allegati se presenti (ciascuno con chiamata separata)
    if (files.attachments) {
      const attachmentFiles = Array.isArray(files.attachments)
        ? files.attachments
        : [files.attachments];

      totalAttachments = attachmentFiles.length;

      for (const file of attachmentFiles) {
        try {
          // Leggi file da temp path
          const fileBuffer = await fs.readFile(file.filepath);

          // Upload su Asana con chiamata POST separata
          await uploadAsanaAttachment(
            taskGid,
            fileBuffer,
            file.originalFilename || 'attachment',
            file.mimetype || undefined
          );

          attachmentsUploaded++;

          // Elimina file temporaneo
          await fs.unlink(file.filepath).catch(() => { });
        } catch (uploadError: any) {
          console.error(`[create-task] Errore upload allegato ${file.originalFilename}:`, uploadError.message);
          // Continua con gli altri file anche se uno fallisce
        }
      }
    }

    // STEP 4: Salva ticket su Firestore per tracking stato
    let firestoreTicketCreated = false;
    try {
      await createTicket({
        ticketId: taskGid,
        clientId: creatorId,
        ghlContactId: ghlContactId || undefined,
        title,
        priority,
        clientName: creatorName,
        clientPhone: creatorPhone,
        clientEmail: creatorEmail || undefined,
      });
      firestoreTicketCreated = true;

    } catch (firestoreError: any) {
      console.error('[create-task] Errore salvataggio Firestore:', firestoreError.message);
      // Non blocchiamo il flusso - il ticket è già creato su Asana
    }

    // STEP 5: Invia webhook evento a GHL per automazioni
    let webhookSent = false;
    if (ghlContactId) {
      webhookSent = await sendTicketCreatedEvent({
        clientId: creatorId,
        ghlContactId,
        ticketId: taskGid,
        title,
        priority,
        clientName: creatorName,
        clientPhone: creatorPhone,
      });
    }

    // Risposta successo
    return res.status(201).json({
      success: true,
      taskGid: taskResult.data.gid,
      taskUrl: taskResult.data.permalink_url,
      attachmentsCount: attachmentsUploaded,
      attachmentErrors: totalAttachments - attachmentsUploaded,
      firestoreTicketCreated,
      webhookSent,
      message: `Task creato con successo`,
    });

  } catch (error: any) {
    console.error('Errore API create-task:', error);

    return res.status(500).json({
      success: false,
      message: error.message || 'Errore durante la creazione del task',
    });
  }
}
