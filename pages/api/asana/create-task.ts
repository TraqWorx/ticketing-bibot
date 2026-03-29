/**
 * API ENDPOINT: /api/asana/create-task
 * 
 * Crea un nuovo task su Asana per un ticket cliente con allegati
 * 
 * FLUSSO:
 * 1. Riceve URL dei file da Vercel Blob Storage
 * 2. Crea task su Asana
 * 3. Scarica file dai Blob URL e carica su Asana
 * 4. Elimina file da Blob Storage
 * 5. Salva ticket su Firestore (tracking stato)
 * 6. Invia messaggi WhatsApp via GHL
 * 7. Invia webhook evento a GHL per automazioni
 * 
 * Method: POST
 * Body: JSON { title, description, creatorId, creatorName, creatorPhone, ghlContactId, attachmentUrls[] }
 * 
 * Returns: { success, taskGid, taskUrl, attachmentsCount, whatsappErrors }
 */

import { createAsanaTask, uploadAsanaAttachment } from '@/lib/asana/asanaService';
import { withAuth } from '@/lib/auth-middleware';
import { sendTicketCreatedEvent } from '@/lib/ghl/ghlService';
import { createTicket, getUserById } from '@/lib/ticket/ticketService';
import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { del } from '@vercel/blob';

export default withAuth(async (req: NextApiRequest, res: NextApiResponse) => {
  // Solo POST
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const {
      title,
      description,
      priority = 'medium',
      creatorId,
      creatorName,
      creatorPhone,
      creatorEmail,
      ghlContactId,
      attachmentUrls = [],
    } = req.body;

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
      priority: priority as 'high' | 'medium' | 'low',
      creatorId,
      creatorName,
      creatorPhone,
    });

    // STEP 2: Estrai il task_gid dalla risposta
    const taskGid = taskResult.data.gid;

    let attachmentsUploaded = 0;
    let totalAttachments = attachmentUrls.length;
    const blobUrlsToDelete: string[] = [];

    // STEP 3: Scarica file da Blob Storage e carica su Asana
    if (attachmentUrls && attachmentUrls.length > 0) {
      for (const blobUrl of attachmentUrls) {
        try {
          // Scarica file da Vercel Blob
          const fileResponse = await axios.get(blobUrl, {
            responseType: 'arraybuffer',
          });

          const fileBuffer = Buffer.from(fileResponse.data);
          
          // Estrai nome file dall'URL
          const urlParts = blobUrl.split('/');
          const filename = urlParts[urlParts.length - 1];
          
          // Determina content-type
          const contentType = fileResponse.headers['content-type'] || 'application/octet-stream';

          // Upload su Asana
          await uploadAsanaAttachment(
            taskGid,
            fileBuffer,
            filename,
            contentType
          );

          attachmentsUploaded++;
          blobUrlsToDelete.push(blobUrl);

        } catch (uploadError: any) {
          console.error(`[create-task] Errore upload allegato da ${blobUrl}:`, uploadError.message);
          console.error('[create-task] Stack trace:', uploadError.stack);
          if (uploadError.response) {
            console.error('[create-task] Response status:', uploadError.response.status);
            console.error('[create-task] Response data:', uploadError.response.data);
          }
          // Continua con gli altri file anche se uno fallisce
          blobUrlsToDelete.push(blobUrl); // Elimina comunque il blob
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

    // STEP 5: Elimina file da Blob Storage DOPO aver completato tutte le operazioni
    if (blobUrlsToDelete.length > 0) {
      try {
        await del(blobUrlsToDelete);
      } catch (deleteError: any) {
        console.error('[create-task] Errore eliminazione blob:', deleteError.message);
        // Non blocchiamo il flusso
      }
    }

    // STEP 6: Invia webhook evento a GHL per automazioni
    let webhookSent = false;
    if (ghlContactId) {
      const [firstName, ...lastNameParts] = creatorName.split(' ');
      const lastName = lastNameParts.join(' ');

      // Recupera delegati dall'utente in Firestore (se presenti)
      let delegates = [];
      try {
        const client = await getUserById(creatorId);
        delegates = client?.delegates || [];
      } catch (err) {
        console.warn('[create-task] Impossibile recuperare delegati utente:', err);
      }

      webhookSent = await sendTicketCreatedEvent({
        clientId: creatorId,
        ghlContactId,
        ticketId: taskGid,
        title,
        priority: priority as 'high' | 'medium' | 'low',
        firstName,
        lastName,
        clientPhone: creatorPhone,
        delegates,
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
});