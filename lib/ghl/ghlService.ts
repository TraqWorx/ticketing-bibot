/**
 * SERVICE: Go High Level API Integration
 * 
 * Servizio per integrazioni con Go High Level API
 * 
 * Features:
 * - Invio messaggi WhatsApp/SMS
 * - Gestione contatti
 * - Invio webhook eventi per automazioni
 * - Sincronizzazione dati
 * 
 * Pattern: Service layer per API esterne
 * 
 * IMPORTANTE: Le automazioni (reminder 24h/48h, escalation, follow-up)
 * sono gestite INTERAMENTE da GHL tramite workflow.
 * Questo servizio si limita a inviare eventi.
 */

import {
    GHLEventType,
    GHLTicketCreatedPayload,
    GHLTicketRepliedPayload,
    GHLTicketClosedPayload,
    GHLTicketReopenedPayload,
    MessageAuthor,
} from '@/types/ticket';

interface SendMessageParams {
    contactId: string;
    message: string;
    phoneNumber?: string;
}

/**
 * Invia un messaggio tramite Go High Level
 */
export async function sendMessage(params: SendMessageParams): Promise<any> {
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

    try {
        const axios = require('axios');

        // Endpoint GHL ufficiale per inviare messaggi
        // Documentazione: https://marketplace.gohighlevel.com/docs/ghl/conversations/send-a-new-message
        const url = `${process.env.GHL_API_BASE_URL}/conversations/messages`;

        const body = {
            type: 'SMS',
            contactId: contactId,
            message: message,
        };

        const response = await axios.post(url, body, {
            headers: {
                'Authorization': `Bearer ${process.env.GHL_API_ACCESS_TOKEN}`,
                'Content-Type': 'application/json',
                'Version': '2021-04-15',
            },
        });

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

/**
 * Cerca un contatto su Go High Level per email
 */
export async function searchGHLContact(email: string): Promise<any> {
    if (!process.env.GHL_API_BASE_URL) {
        throw new Error('GHL_API_BASE_URL non configurato nel .env');
    }
    if (!process.env.GHL_API_ACCESS_TOKEN) {
        throw new Error('GHL_API_ACCESS_TOKEN non configurato nel .env');
    }
    if (!process.env.GHL_LOCATION_ID) {
        throw new Error('GHL_LOCATION_ID non configurato nel .env - necessario per accedere ai contatti');
    }
    if (!email) {
        throw new Error('Email è obbligatoria per la ricerca');
    }

    try {
        const axios = require('axios');
        const url = `${process.env.GHL_API_BASE_URL}/contacts`;

        const response = await axios.get(url, {
            headers: {
                'Authorization': `Bearer ${process.env.GHL_API_ACCESS_TOKEN}`,
                'Version': '2021-04-15',
            },
            params: {
                locationId: process.env.GHL_LOCATION_ID,
                query: email,
            },
        });

        const contacts = response.data?.contacts || [];
        const match = contacts.find((c: any) =>
            c.email?.toLowerCase() === email.toLowerCase()
        );

        return match || null;
    } catch (error: any) {
        if (error.response) {
            console.error('[searchGHLContact] Errore API GHL:', {
                status: error.response.status,
                statusText: error.response.statusText,
                data: error.response.data,
            });

            if (error.response.status === 403) {
                throw new Error('Accesso negato a Go High Level. Verifica GHL_LOCATION_ID e i permessi del token.');
            }
        }
        console.error('[searchGHLContact] Errore:', error.message);
        throw new Error(`Errore ricerca contatto GHL: ${error.response?.data?.message || error.message}`);
    }
}

/**
 * Crea un nuovo contatto su Go High Level
 */
export async function createGHLContact(data: {
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
}): Promise<any> {
    if (!process.env.GHL_API_BASE_URL) {
        throw new Error('GHL_API_BASE_URL non configurato nel .env');
    }
    if (!process.env.GHL_API_ACCESS_TOKEN) {
        throw new Error('GHL_API_ACCESS_TOKEN non configurato nel .env');
    }
    if (!process.env.GHL_LOCATION_ID) {
        throw new Error('GHL_LOCATION_ID non configurato nel .env - necessario per creare contatti');
    }
    if (!data.email || !data.firstName || !data.lastName) {
        throw new Error('Email, nome e cognome sono obbligatori');
    }

    try {
        const axios = require('axios');
        const url = `${process.env.GHL_API_BASE_URL}/contacts`;

        const body = {
            locationId: process.env.GHL_LOCATION_ID,
            email: data.email,
            firstName: data.firstName,
            lastName: data.lastName,
            phone: data.phone || '',
            source: 'admin-cockpit',
        };

        const response = await axios.post(url, body, {
            headers: {
                'Authorization': `Bearer ${process.env.GHL_API_ACCESS_TOKEN}`,
                'Content-Type': 'application/json',
                'Version': '2021-04-15',
            },
        });

        return response.data.contact;
    } catch (error: any) {
        if (error.response) {
            console.error('[createGHLContact] Errore API GHL:', {
                status: error.response.status,
                data: error.response.data,
            });

            // Se GHL trova un duplicato (telefono o email), usa il contatto esistente
            if (error.response.status === 400 && error.response.data?.meta?.contactId) {
                const matchingField = error.response.data.meta.matchingField;
                const contactName = error.response.data.meta.contactName;
                const contactId = error.response.data.meta.contactId;

                // Ritorna il contatto esistente
                return {
                    id: contactId,
                    firstName: data.firstName,
                    lastName: data.lastName,
                    email: data.email,
                    phone: data.phone,
                    existingContact: true,
                    matchingField: matchingField,
                    contactName: contactName,
                };
            }

            if (error.response.status === 403) {
                throw new Error('Accesso negato a Go High Level. Verifica GHL_LOCATION_ID e i permessi del token.');
            }
        }
        console.error('[createGHLContact] Errore creazione contatto:', error.message);
        throw error;
    }
}

// ============================================================
// WEBHOOK FUNCTIONS - Invio eventi a GHL per automazioni
// Ogni evento ha il proprio webhook URL per workflow separati
// ============================================================

/**
 * Invia un evento webhook a un URL specifico
 * Ogni evento può avere il proprio webhook per workflow separati in GHL
 */
async function sendWebhookToUrl(webhookUrl: string, payload: Record<string, any>): Promise<boolean> {
    if (!webhookUrl) {
        console.warn('[GHL Webhook] URL webhook non configurato per evento:', payload.event);
        return false;
    }

    try {
        const axios = require('axios');

        await axios.post(webhookUrl, payload, {
            headers: {
                'Content-Type': 'application/json',
            },
            timeout: 10000, // 10 secondi timeout
        });

        return true;
    } catch (error: any) {
        console.error('[GHL Webhook] Errore invio evento:', {
            event: payload.event,
            url: webhookUrl,
            error: error.message,
            status: error.response?.status,
        });
        // Non lanciamo errore - webhook fallito non deve bloccare il flusso principale
        return false;
    }
}

/**
 * Invia evento: Nuovo ticket creato
 * 
 * Webhook URL: GHL_WEBHOOK_TICKET_CREATED
 * 
 * GHL Workflow può:
 * - Notificare admin via email/SMS/WhatsApp
 * - Avviare workflow di reminder (24h/48h)
 * - Tracking analytics
 */
export async function sendTicketCreatedEvent(params: {
    clientId: string;
    ghlContactId: string;
    ticketId: string;
    title: string;
    priority: string;
    clientName: string;
    clientPhone: string;
}): Promise<boolean> {
    const sendClientMsgWebhookUrl = process.env.GHL_WEBHOOK_TICKET_CREATED_SEND_CLIENT_MSG;
    const sendAdminMsgWebhookUrl = process.env.GHL_WEBHOOK_TICKET_CREATED_SEND_ADMIN_MSG;

    const payload: GHLTicketCreatedPayload = {
        event: 'ticket_created',
        timestamp: new Date().toISOString(),
        data: {
            clientId: params.clientId,
            ghlContactId: params.ghlContactId,
            ticketId: params.ticketId,
            title: params.title,
            priority: params.priority,
            clientName: params.clientName,
            clientPhone: params.clientPhone,
            openedAt: new Date().toISOString(),
        },
    };

    sendWebhookToUrl(sendClientMsgWebhookUrl || '', payload);
    sendWebhookToUrl(sendAdminMsgWebhookUrl || '', payload);

    return true;
}

/**
 * Invia evento: Cliente ha risposto al ticket
 * 
 * Webhook URL: GHL_WEBHOOK_CLIENT_REPLIED
 * 
 * GHL Workflow può:
 * - Notificare admin che c'è una nuova risposta
 * - Resettare timer reminder
 * - Aggiornare stato contatto
 */
export async function sendTicketRepliedByClientEvent(params: {
    clientId: string;
    ghlContactId: string;
    ticketId: string;
    clientName?: string;
    clientPhone?: string;
    clientEmail?: string;
    priority?: string;
}): Promise<boolean> {
    const webhookUrl = process.env.GHL_WEBHOOK_CLIENT_REPLIED;

    const payload: GHLTicketRepliedPayload = {
        event: 'ticket_replied_by_client',
        timestamp: new Date().toISOString(),
        data: {
            clientId: params.clientId,
            ghlContactId: params.ghlContactId,
            ticketId: params.ticketId,
            repliedAt: new Date().toISOString(),
            repliedBy: 'client',
            clientName: params.clientName,
            clientPhone: params.clientPhone,
            clientEmail: params.clientEmail,
            priority: params.priority,
        },
    };

    return sendWebhookToUrl(webhookUrl || '', payload);
}

/**
 * Invia evento: Admin ha risposto al ticket
 * 
 * Webhook URL: GHL_WEBHOOK_ADMIN_REPLIED
 * 
 * GHL Workflow può:
 * - Notificare cliente via WhatsApp/SMS/email
 * - Avviare workflow follow-up
 * - Aggiornare stato contatto
 */
export async function sendTicketRepliedByAdminEvent(params: {
    clientId: string;
    ghlContactId: string;
    ticketId: string;
}): Promise<boolean> {
    const webhookUrl = process.env.GHL_WEBHOOK_ADMIN_REPLIED;

    const payload: GHLTicketRepliedPayload = {
        event: 'ticket_replied_by_admin',
        timestamp: new Date().toISOString(),
        data: {
            clientId: params.clientId,
            ghlContactId: params.ghlContactId,
            ticketId: params.ticketId,
            repliedAt: new Date().toISOString(),
            repliedBy: 'admin',
        },
    };

    return sendWebhookToUrl(webhookUrl || '', payload);
}

/**
 * Invia evento: Ticket chiuso
 * 
 * Webhook URL: GHL_WEBHOOK_TICKET_CLOSED
 * 
 * GHL Workflow può:
 * - Inviare survey di soddisfazione
 * - Chiudere workflow attivi
 * - Aggiornare analytics
 */
export async function sendTicketClosedEvent(params: {
    clientId: string;
    ghlContactId?: string;
    ticketId: string;
}): Promise<boolean> {
    const webhookUrl = process.env.GHL_WEBHOOK_TICKET_CLOSED;

    const payload: GHLTicketClosedPayload = {
        event: 'ticket_closed',
        timestamp: new Date().toISOString(),
        data: {
            clientId: params.clientId,
            ghlContactId: params.ghlContactId,
            ticketId: params.ticketId,
            closedAt: new Date().toISOString(),
        },
    };

    return sendWebhookToUrl(webhookUrl || '', payload);
}

/**
 * Invia evento ticket riaperto a GHL
 */
export async function sendTicketReopenedEvent(params: {
    clientId: string;
    ghlContactId: string;
    ticketId: string;
    reopenedBy: 'admin' | 'client';
}): Promise<boolean> {
    const webhookUrl = process.env.GHL_WEBHOOK_TICKET_RE_OPENED;

    const payload: GHLTicketReopenedPayload = {
        event: 'ticket_reopened',
        timestamp: new Date().toISOString(),
        data: {
            clientId: params.clientId,
            ghlContactId: params.ghlContactId,
            ticketId: params.ticketId,
            reopenedAt: new Date().toISOString(),
            reopenedBy: params.reopenedBy,
        },
    };

    return sendWebhookToUrl(webhookUrl || '', payload);
}
