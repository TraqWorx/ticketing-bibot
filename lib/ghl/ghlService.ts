/**
 * SERVICE: Go High Level API Integration
 * 
 * Servizio per integrazioni con Go High Level API
 * 
 * Features:
 * - Invio messaggi WhatsApp
 * - Gestione contatti
 * - Sincronizzazione dati
 * 
 * Pattern: Service layer per API esterne
 */

interface SendWhatsAppMessageParams {
  contactId: string;
  message: string;
  phoneNumber?: string;
}

/**
 * Invia un messaggio WhatsApp tramite Go High Level
 */
export async function sendWhatsAppMessage(params: SendWhatsAppMessageParams): Promise<any> {
    const {
        contactId,
        message,
    } = params;

    if (!process.env.GHL_API_BASE_URL) {
        throw new Error('GHL_API_BASE_URL non configurato nel .env');
    }
    if (!process.env.GHL_API_ACCESS_TOKEN) {
        throw new Error('GHL_API_ACCESS_TOKEN non configurato nel .env');
    }
    if (!contactId) {
        throw new Error('contactId è obbligatorio');
    }
    if (!message || typeof message !== 'string' || !message.trim()) {
        throw new Error('Il messaggio è obbligatorio');
    }

    console.log('[sendWhatsAppMessage] Invio messaggio:', { contactId, messageLength: message.length });

    try {
        const axios = require('axios');
        
        // Endpoint GHL ufficiale per inviare messaggi
        // Documentazione: https://marketplace.gohighlevel.com/docs/ghl/conversations/send-a-new-message
        const url = `${process.env.GHL_API_BASE_URL}/conversations/messages`;
        
        const body = {
            type: 'WhatsApp',
            contactId: contactId,
            message: message,
            status: 'pending',
        };

        console.log('[sendWhatsAppMessage] URL:', url);
        console.log('[sendWhatsAppMessage] Body:', JSON.stringify(body));

        const response = await axios.post(url, body, {
            headers: {
                'Authorization': `Bearer ${process.env.GHL_API_ACCESS_TOKEN}`,
                'Content-Type': 'application/json',
                'Version': '2021-04-15',
            },
        });

        console.log('[sendWhatsAppMessage] Messaggio inviato con successo');
        console.log('[sendWhatsAppMessage] Response status:', response.status);
        console.log('[sendWhatsAppMessage] Response data:', JSON.stringify(response.data, null, 2));
        return response.data;
    } catch (error: any) {
        // Gestisci errori axios
        if (error.response) {
            console.error('[sendWhatsAppMessage] Errore risposta status:', error.response.status);
            console.error('[sendWhatsAppMessage] Errore risposta data:', error.response.data);
            const errorMessage = error.response.data?.error?.message || 
                               error.response.data?.message ||
                               `Errore invio messaggio: ${error.response.status} ${error.response.statusText}`;
            throw new Error(errorMessage);
        }
        
        console.error('[sendWhatsAppMessage] Errore invio messaggio:', {
            error: error.message,
            contactId,
        });
        throw new Error(error.message || 'Errore durante l\'invio del messaggio');
    }
}

/**
 * Recupera informazioni di un contatto da Go High Level
 */
export async function getGHLContact(contactId: string): Promise<any> {
    if (!process.env.GHL_API_BASE_URL) {
        throw new Error('GHL_API_BASE_URL non configurato nel .env');
    }
    if (!process.env.GHL_API_ACCESS_TOKEN) {
        throw new Error('GHL_API_ACCESS_TOKEN non configurato nel .env');
    }
    if (!contactId) {
        throw new Error('contactId è obbligatorio');
    }

    try {
        const axios = require('axios');
        const response = await axios.get(
            `${process.env.GHL_API_BASE_URL}/contacts/${contactId}`,
            {
                headers: {
                    'Authorization': `Bearer ${process.env.GHL_API_ACCESS_TOKEN}`,
                },
            }
        );

        return response.data;
    } catch (error: any) {
        console.error('Errore recupero contatto GHL:', error);
        throw new Error(error.message || 'Errore durante il recupero del contatto GHL');
    }
}
