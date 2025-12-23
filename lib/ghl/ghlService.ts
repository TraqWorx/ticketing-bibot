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
