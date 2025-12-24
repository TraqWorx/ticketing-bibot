/**
 * API ENDPOINT: /api/asana/create-story
 * 
 * Crea un nuovo commento su un task Asana con allegati
 * 
 * FLUSSO:
 * 1. Crea commento su Asana
 * 2. Upload allegati
 * 3. Aggiorna stato ticket su Firestore
 * 4. Invia messaggio notifica all'admin
 * 5. Invia webhook evento a GHL per automazioni
 * 
 * Method: POST
 * Body: FormData { taskGid, text, attachments[] }
 * 
 * Returns: { success, data: story, attachmentsCount, attachmentErrors }
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { IncomingForm, File } from 'formidable';
import { createTaskStory, uploadAsanaAttachment } from '@/lib/asana/asanaService';
import { getAdminClientRepliedMessage } from '@/lib/ghl/messages';
import { updateTicketOnReply, getTicket } from '@/lib/ticket/ticketService';
import { sendTicketRepliedByClientEvent } from '@/lib/ghl/ghlService';
import fs from 'fs/promises';
import { transcribeAudioWithWhisper } from '@/lib/openaiWhisper';

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


    // STEP 1+2: Se c'è un vocale, trascrivi e allega
    let attachmentsUploaded = 0;
    let totalAttachments = 0;
    const audioSummaries: string[] = [];

    if (files.attachments) {
      const attachmentFiles = Array.isArray(files.attachments)
        ? files.attachments
        : [files.attachments];
      totalAttachments = attachmentFiles.length;
      for (const file of attachmentFiles) {
        try {
          const fileBuffer = await fs.readFile(file.filepath);
          let summary = '';
          let uploaded = null;
          // Upload su Asana
          uploaded = await uploadAsanaAttachment(
            taskGid,
            fileBuffer,
            file.originalFilename || 'attachment',
            file.mimetype || undefined
          );
          attachmentsUploaded++;
          // Se è audio, trascrivi e aggiungi summary (sempre, anche se transcript fallisce)
          if (file.mimetype && file.mimetype.startsWith('audio')) {
            let transcript = '';
            try {
              transcript = await transcribeAudioWithWhisper(fileBuffer, file.originalFilename || 'audio.wav');
            } catch (err) {
              transcript = '';
              console.error('[Whisper error]', err);
            }
            if (transcript && transcript.trim()) {
              summary = `🎤 Nota vocale: ${file.originalFilename || 'audio'}\nTrascrizione:\n${transcript}`;
            } else {
              summary = `🎤 Nota vocale: ${file.originalFilename || 'audio'}`;
            }
            audioSummaries.push(summary);
          }
          await fs.unlink(file.filepath).catch(() => {});
        } catch (uploadError: any) {
          console.error(`[create-story] Errore upload allegato ${file.originalFilename}:`, uploadError.message);
        }
      }
    }

    // STEP 1: Crea commento su Asana
    let commentText = text;
    if (audioSummaries.length > 0) {
      commentText = audioSummaries.join('\n\n');
    }
    const result = await createTaskStory(taskGid, commentText);

    // STEP 3: Aggiorna stato ticket su Firestore (client ha risposto)
    let firestoreUpdated = false;
    let ticket = null;
    try {
      ticket = await getTicket(taskGid);
      if (ticket) {
        await updateTicketOnReply({
          ticketId: taskGid,
          repliedBy: 'client',
        });
        firestoreUpdated = true;
      }
    } catch (firestoreError: any) {
      console.error('[create-story] Errore aggiornamento Firestore:', firestoreError.message);
    }

    // STEP 4: Invia webhook evento a GHL per automazioni
    let webhookSent = false;
    if (ticket?.ghlContactId) {
      webhookSent = await sendTicketRepliedByClientEvent({
        clientId: ticket.clientId,
        ghlContactId: ticket.ghlContactId,
        ticketId: taskGid,
      });
    }

    return res.status(200).json({
      success: true,
      data: result.data,
      attachmentsCount: attachmentsUploaded,
      attachmentErrors: totalAttachments - attachmentsUploaded,
      firestoreUpdated,
      webhookSent,
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
