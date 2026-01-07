/**
 * API ENDPOINT: /api/asana/create-story
 * 
 * Crea un nuovo commento su un task Asana con allegati
 * 
 * FLUSSO:
 * 1. Riceve URL dei file da Vercel Blob Storage
 * 2. Scarica file da Blob e carica su Asana
 * 3. Crea commento su Asana
 * 4. Elimina file da Blob Storage
 * 5. Aggiorna stato ticket su Firestore
 * 6. Invia messaggio notifica all'admin
 * 7. Invia webhook evento a GHL per automazioni
 * 
 * Method: POST
 * Body: JSON { taskGid, text, attachmentUrls[] }
 * 
 * Returns: { success, data: story, attachmentsCount, attachmentErrors }
 */

import { createTaskStory, uploadAsanaAttachment } from '@/lib/asana/asanaService';
import { withAuth } from '@/lib/auth-middleware';
import { sendTicketRepliedByClientEvent } from '@/lib/ghl/ghlService';
import { transcribeAudioWithWhisper } from '@/lib/openaiWhisper';
import { getTicket, updateTicketOnReply } from '@/lib/ticket/ticketService';
import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { del } from '@vercel/blob';

const skipPhrases = [
  'Sottotitoli creati dalla comunità Amara.org',
  // Aggiungi qui altre frasi da skippare in futuro
];

export default withAuth(async (req: NextApiRequest, res: NextApiResponse) => {
  // Solo POST
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const {
      taskGid,
      text,
      attachmentUrls = [],
      audioFile, // Nuovo campo per audio in base64
    } = req.body;

    // Validazione
    if (!taskGid || typeof taskGid !== 'string') {
      return res.status(400).json({ message: 'Task GID è obbligatorio' });
    }

    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ message: 'Il testo del commento è obbligatorio' });
    }

    // STEP 1+2: Scarica file da Blob Storage e carica su Asana
    let attachmentsUploaded = 0;
    let totalAttachments = attachmentUrls.length + (audioFile ? 1 : 0);
    const audioSummaries: string[] = [];
    const attachmentNames: string[] = [];
    const blobUrlsToDelete: string[] = [];

    // Gestisci audioFile se presente (caricamento diretto)
    if (audioFile && audioFile.buffer && audioFile.filename) {
      try {
        const fileBuffer = Buffer.from(audioFile.buffer, 'base64');
        const contentType = audioFile.mimetype || 'audio/webm';
        const filename = audioFile.filename;

        attachmentNames.push(filename);

        // Upload su Asana
        await uploadAsanaAttachment(
          taskGid,
          fileBuffer,
          filename,
          contentType
        );

        attachmentsUploaded++;

        // Trascrivi l'audio
        let transcript = '';
        try {
          transcript = await transcribeAudioWithWhisper(fileBuffer, filename);
        } catch (err) {
          transcript = '';
          console.error('[Whisper error]', err);
        }

        // Controlla se la trascrizione contiene una frase da skippare
        const shouldSkipTranscript = skipPhrases.some(phrase =>
          transcript && transcript.toLowerCase().includes(phrase.toLowerCase())
        );

        if (transcript && transcript.trim() && !shouldSkipTranscript) {
          audioSummaries.push(`🎤 Nota vocale: ${filename}\nTrascrizione:\n${transcript}`);
        } else {
          audioSummaries.push(`🎤 Nota vocale: ${filename}`);
        }

      } catch (uploadError: any) {
        console.error(`[create-story] ========== ERRORE UPLOAD AUDIO ==========`);
        console.error(`[create-story] Filename: ${audioFile.filename}`);
        console.error(`[create-story] Errore:`, uploadError.message || 'Nessun messaggio');
        console.error(`[create-story] ========================================`);
      }
    }

    if (attachmentUrls && attachmentUrls.length > 0) {
      for (const blobUrl of attachmentUrls) {
        try {
          // Scarica file da Vercel Blob
          const fileResponse = await axios.get(blobUrl, {
            responseType: 'arraybuffer',
            timeout: 30000, // 30 secondi timeout
          });

          const fileBuffer = Buffer.from(fileResponse.data);

          // Estrai nome file dall'URL
          const urlParts = blobUrl.split('/');
          const filename = urlParts[urlParts.length - 1];

          // Determina content-type
          const contentType = fileResponse.headers['content-type'] || 'application/octet-stream';

          attachmentNames.push(filename);

          // Upload su Asana
          await uploadAsanaAttachment(
            taskGid,
            fileBuffer,
            filename,
            contentType
          );

          attachmentsUploaded++;
          blobUrlsToDelete.push(blobUrl);

          // Se è audio, trascrivi
          if (contentType && contentType.startsWith('audio')) {
            let transcript = '';
            try {
              transcript = await transcribeAudioWithWhisper(fileBuffer, filename);
            } catch (err) {
              transcript = '';
              console.error('[Whisper error]', err);
            }


            // Controlla se la trascrizione contiene una frase da skippare
            const shouldSkipTranscript = skipPhrases.some(phrase =>
              transcript && transcript.toLowerCase().includes(phrase.toLowerCase())
            );

            if (transcript && transcript.trim() && !shouldSkipTranscript) {
              audioSummaries.push(`🎤 Nota vocale: ${filename}\nTrascrizione:\n${transcript}`);
            } else {
              audioSummaries.push(`🎤 Nota vocale: ${filename}`);
            }
          }

        } catch (uploadError: any) {
          console.error(`[create-story] ========== ERRORE UPLOAD ALLEGATO ==========`);
          console.error(`[create-story] URL Blob: ${blobUrl}`);
          console.error(`[create-story] Errore tipo:`, typeof uploadError);
          console.error(`[create-story] Errore messaggio:`, uploadError.message || 'Nessun messaggio');
          console.error(`[create-story] Errore completo:`, JSON.stringify(uploadError, null, 2));

          if (uploadError.response) {
            console.error('[create-story] HTTP Response status:', uploadError.response.status);
            console.error('[create-story] HTTP Response headers:', uploadError.response.headers);
            console.error('[create-story] HTTP Response data:', uploadError.response.data);
          }

          if (uploadError.code) {
            console.error('[create-story] Error code:', uploadError.code);
          }

          console.error('[create-story] Stack trace:', uploadError.stack);
          console.error(`[create-story] ========================================`);

          blobUrlsToDelete.push(blobUrl); // Elimina comunque il blob
        }
      }
    }

    // STEP 3: Crea commento su Asana
    let commentText = text;
    if (audioSummaries.length > 0) {
      commentText = audioSummaries.join('\n\n');
    }

    // Aggiungi l'elenco degli allegati al messaggio se presenti
    // Ma non se si tratta solo di note vocali (il nome è già nel testo)
    const hasNonAudioAttachments = attachmentNames.length > audioSummaries.length;
    if (hasNonAudioAttachments) {
      commentText += '\n\n📎 Allegati:\n' + attachmentNames.map(name => `• ${name}`).join('\n');
    }

    // Commento creato per risposta del cliente
    const result = await createTaskStory(taskGid, commentText, true);

    // STEP 4: Elimina file da Blob Storage DOPO aver creato la storia
    if (blobUrlsToDelete.length > 0) {
      try {
        await del(blobUrlsToDelete);
      } catch (deleteError: any) {
        console.error('[create-story] Errore eliminazione blob:', deleteError.message);
        // Non blocchiamo il flusso
      }
    }

    // STEP 5: Aggiorna stato ticket su Firestore (client ha risposto)
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
        clientName: ticket.clientName,
        clientPhone: ticket.clientPhone,
        clientEmail: ticket.clientEmail,
        priority: ticket.priority,
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
        ? `Commento e allegati aggiunti`
        : 'Commento aggiunto con successo',
    });
  } catch (error: any) {
    console.error('Errore API create-story:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Errore durante la creazione del commento',
    });
  }
});