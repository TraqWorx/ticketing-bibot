/**
 * SERVICE: N8N Webhook Integration
 * 
 * Servizio per integrazioni con N8N per automazioni avanzate
 * 
 * Features:
 * - Invio eventi a webhook N8N per automazioni
 * - Gestione solleciti automatici (24h, 48h, 72h)
 * - Trigger workflow N8N
 * 
 * Pattern: Service layer per webhook esterni
 */

import axios from 'axios';

/**
 * Payload per evento messaggio inviato
 */
interface MessageSentPayload {
  clientId: string;
  ghlContactId: string;
  ticketId: string;
  clientName?: string;
  clientPhone?: string;
  clientEmail?: string;
  priority?: string;
  timestamp: string;
}

/**
 * Invia evento a N8N quando un cliente risponde a un ticket
 * Questo triggera l'automazione per i solleciti a 24h, 48h, 72h
 * 
 * @param payload Dati del ticket e cliente
 * @returns true se inviato con successo, false altrimenti
 */
export async function triggerN8NClientResponseFollowup(payload: Omit<MessageSentPayload, 'timestamp'>): Promise<boolean> {
  try {
    // Verifica configurazione
    if (!process.env.N8N_WEBHOOK_TICKET_CLIENT_RESPONSE_FOLLOWUP) {
      console.warn('[N8N] N8N_WEBHOOK_TICKET_CLIENT_RESPONSE_FOLLOWUP non configurato nel .env - skip invio');
      return false;
    }

    // Aggiungi timestamp
    const fullPayload: MessageSentPayload = {
      ...payload,
      timestamp: new Date().toISOString(),
    };

    const response = await axios.post(process.env.N8N_WEBHOOK_TICKET_CLIENT_RESPONSE_FOLLOWUP, fullPayload, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 5000, // 5 secondi timeout
    });

    if (response.status === 200 || response.status === 201) {
      return true;
    } else {
      console.warn('[N8N] Risposta inattesa:', response.status);
      return false;
    }
  } catch (error: any) {
    // Non bloccare il flusso principale in caso di errore N8N
    console.error('[N8N] Errore invio webhook:', error.message);
    if (error.response) {
      console.error('[N8N] Dettagli errore:', {
        status: error.response.status,
        data: error.response.data,
      });
    }
    return false;
  }
}
