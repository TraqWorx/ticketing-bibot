/**
 * SERVICE: Asana API Integration
 * 
 * Servizio per integrazioni con Asana API
 * 
 * Features:
 * - Creazione task
 * - Gestione custom fields
 * - Autenticazione tramite token
 * 
 * Pattern: Service layer per API esterne
 */

interface CreateTaskParams {
    name: string;
    notes: string;
    creatorId: string;
    creatorName: string;
    creatorPhone: string;
    priority?: 'high' | 'medium' | 'low';
    projectGid?: string;
    customFieldGid?: string;
    customFieldNameGid?: string;
    customFieldPhoneGid?: string;
    customFieldPriorityGid?: string;
    priorityLowGid?: string;
    priorityMediumGid?: string;
    priorityHighGid?: string;
}

interface AsanaTaskResponse {
    data: {
        gid: string;
        name: string;
        created_at: string;
        modified_at: string;
        permalink_url: string;
    };
}

/**
 * Crea un nuovo task su Asana
 */
export async function createAsanaTask(params: CreateTaskParams): Promise<AsanaTaskResponse> {
    const {
        name,
        notes,
        creatorId,
        creatorName,
        creatorPhone,
        priority = 'medium',
        projectGid = process.env.ASANA_PROJECT_GID,
        customFieldGid = process.env.ASANA_TASK_CREATOR_ID_CUSTOM_FIELD,
        customFieldNameGid = process.env.ASANA_TASK_CREATOR_NAME_CUSTOM_FIELD,
        customFieldPhoneGid = process.env.ASANA_TASK_CREATOR_PHONE_CUSTOM_FIELD,
        customFieldPriorityGid = process.env.ASANA_TASK_PRIORITY_CUSTOM_FIELD,
        priorityLowGid = process.env.ASANA_PRIORITY_LOW_OPTION_GID,
        priorityMediumGid = process.env.ASANA_PRIORITY_MEDIUM_OPTION_GID,
        priorityHighGid = process.env.ASANA_PRIORITY_HIGH_OPTION_GID,
    } = params;

    // Validazione variabili d'ambiente
    if (!process.env.ASANA_API_BASE_URL) {
        throw new Error('ASANA_API_BASE_URL non configurato nel .env');
    }
    if (!process.env.ASANA_ACCESS_TOKEN) {
        throw new Error('ASANA_ACCESS_TOKEN non configurato nel .env');
    }
    if (!projectGid) {
        throw new Error('ASANA_PROJECT_GID non configurato nel .env');
    }
    if (!customFieldGid) {
        throw new Error('ASANA_TASK_CREATOR_ID_CUSTOM_FIELD non configurato nel .env');
    }
    if (!customFieldNameGid) {
        throw new Error('ASANA_TASK_CREATOR_NAME_CUSTOM_FIELD non configurato nel .env');
    }
    if (!customFieldPhoneGid) {
        throw new Error('ASANA_TASK_CREATOR_PHONE_CUSTOM_FIELD non configurato nel .env');
    }
    if (!customFieldPriorityGid) {
        throw new Error('ASANA_TASK_PRIORITY_CUSTOM_FIELD non configurato nel .env');
    }
    if (!priorityLowGid || !priorityMediumGid || !priorityHighGid) {
        throw new Error('GID opzioni priorità non configurati nel .env (ASANA_PRIORITY_LOW/MEDIUM/HIGH_OPTION_GID)');
    }

    // Mappa priority al GID dell'opzione corrispondente
    const priorityGidMap: Record<string, string> = {
        low: priorityLowGid,
        medium: priorityMediumGid,
        high: priorityHighGid,
    };
    const priorityOptionGid = priorityGidMap[priority] || priorityMediumGid;

    // Costruisci body richiesta
    const body = {
        data: {
            name,
            notes,
            projects: [projectGid],
            custom_fields: {
                [customFieldPriorityGid]: priorityOptionGid,
                [customFieldNameGid]: creatorName,
                [customFieldPhoneGid]: creatorPhone,
                [customFieldGid]: creatorId
            },
        },
    };

    try {
        const axios = require('axios');
        const response = await axios.post(
            `${process.env.ASANA_API_BASE_URL}/tasks`,
            body,
            {
                headers: {
                    'Authorization': `Bearer ${process.env.ASANA_ACCESS_TOKEN}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        return response.data;
    } catch (error: any) {
        console.error('Errore chiamata API Asana:', error);
        const errorMessage = error.response?.data?.errors?.[0]?.message ||
                           error.message ||
                           'Errore durante la creazione del task su Asana';
        throw new Error(errorMessage);
    }
}

/**
 * Verifica connessione con Asana API
 */
export async function testAsanaConnection(): Promise<boolean> {
    if (!process.env.ASANA_API_BASE_URL || !process.env.ASANA_ACCESS_TOKEN) {
        return false;
    }

    try {
        const axios = require('axios');
        await axios.get(`${process.env.ASANA_API_BASE_URL}/users/me`, {
            headers: {
                'Authorization': `Bearer ${process.env.ASANA_ACCESS_TOKEN}`,
            },
        });
        return true;
    } catch (error) {
        console.error('Errore test connessione Asana:', error);
        return false;
    }
}

/**
 * Ottiene le informazioni dell'utente corrente (account tecnico)
 */
export async function getCurrentAsanaUser(): Promise<{ gid: string; name: string; email: string } | null> {
    if (!process.env.ASANA_API_BASE_URL || !process.env.ASANA_ACCESS_TOKEN) {
        return null;
    }

    try {
        const axios = require('axios');
        const response = await axios.get(`${process.env.ASANA_API_BASE_URL}/users/me`, {
            headers: {
                'Authorization': `Bearer ${process.env.ASANA_ACCESS_TOKEN}`,
            },
        });

        const user = response.data.data;
        return {
            gid: user.gid,
            name: user.name,
            email: user.email,
        };
    } catch (error) {
        console.error('Errore recupero utente Asana corrente:', error);
        return null;
    }
}

/**
 * Uploada un allegato su Asana e lo associa a un task
 * 
 * IMPORTANTE: Gli allegati devono essere caricati DOPO la creazione del task.
 * Ogni allegato richiede una chiamata HTTP separata a POST /tasks/{task_gid}/attachments
 * 
 * @param taskGid - GID del task Asana già creato
 * @param fileBuffer - Buffer del file da caricare
 * @param fileName - Nome originale del file
 * @param mimeType - MIME type del file (opzionale)
 * @returns Promise con gid e nome dell'allegato caricato
 */
export async function uploadAsanaAttachment(
    taskGid: string,
    fileBuffer: Buffer,
    fileName: string,
    mimeType?: string
): Promise<{ gid: string; name: string }> {
    if (!process.env.ASANA_API_BASE_URL) {
        throw new Error('ASANA_API_BASE_URL non configurato nel .env');
    }
    if (!process.env.ASANA_ACCESS_TOKEN) {
        throw new Error('ASANA_ACCESS_TOKEN non configurato nel .env');
    }

    try {
        // STEP 1: Usa axios per gestire correttamente multipart/form-data
        // axios gestisce nativamente FormData meglio di fetch
        const axios = require('axios');
        const FormData = require('form-data');
        
        // STEP 2: Crea FormData e aggiungi il file
        const formData = new FormData();
        formData.append('file', fileBuffer, {
            filename: fileName,
            contentType: mimeType || 'application/octet-stream',
        });

        const url = `${process.env.ASANA_API_BASE_URL}/tasks/${taskGid}/attachments`;

        // STEP 3: Invia con axios
        // axios gestisce automaticamente gli headers corretti per FormData
        const response = await axios.post(url, formData, {
            headers: {
                'Authorization': `Bearer ${process.env.ASANA_ACCESS_TOKEN}`,
                ...formData.getHeaders(), // Include boundary automaticamente
            },
            maxBodyLength: Infinity, // Permette file di grandi dimensioni
            maxContentLength: Infinity,
        });
        
        return {
            gid: response.data.data.gid,
            name: response.data.data.name,
        };
    } catch (error: any) {
        // Gestisci errori axios
        if (error.response) {
            console.error('[uploadAsanaAttachment] Errore risposta:', error.response.data);
            const errorMessage = error.response.data?.errors?.[0]?.message || 
                               `Errore upload allegato: ${error.response.status} ${error.response.statusText}`;
            throw new Error(errorMessage);
        }
        
        console.error('[uploadAsanaAttachment] Errore upload allegato:', {
            error: error.message,
            taskGid,
            fileName
        });
        throw new Error(error.message || 'Errore durante l\'upload dell\'allegato');
    }
}

/**
 * Recupera tutti i task di un utente specifico dal progetto
 */
export async function getUserTasks(userId: string): Promise<any> {
    if (!process.env.ASANA_API_BASE_URL) {
        throw new Error('ASANA_API_BASE_URL non configurato nel .env');
    }
    if (!process.env.ASANA_ACCESS_TOKEN) {
        throw new Error('ASANA_ACCESS_TOKEN non configurato nel .env');
    }
    if (!process.env.ASANA_WORKSPACE_GID) {
        throw new Error('ASANA_WORKSPACE_GID non configurato nel .env');
    }
    if (!process.env.ASANA_PROJECT_GID) {
        throw new Error('ASANA_PROJECT_GID non configurato nel .env');
    }
    if (!process.env.ASANA_TASK_CREATOR_ID_CUSTOM_FIELD) {
        throw new Error('ASANA_TASK_CREATOR_ID_CUSTOM_FIELD non configurato nel .env');
    }

    try {
        const customFieldId = process.env.ASANA_TASK_CREATOR_ID_CUSTOM_FIELD;
        const projectId = process.env.ASANA_PROJECT_GID;
        const workspaceId = process.env.ASANA_WORKSPACE_GID;

        const url = `${process.env.ASANA_API_BASE_URL}/workspaces/${workspaceId}/tasks/search?projects.any=${projectId}&custom_fields.${customFieldId}.value=${userId}&opt_fields=gid,name,completed,memberships.section.name,custom_fields,due_on`;

        const axios = require('axios');
        const response = await axios.get(url, {
            headers: {
                'Authorization': `Bearer ${process.env.ASANA_ACCESS_TOKEN}`,
            },
        });

        return response.data;
    } catch (error: any) {
        console.error('Errore recupero task utente:', error);
        throw new Error(error.message || 'Errore durante il recupero dei task');
    }
}

/**
 * Recupera il dettaglio di un singolo task
 */
export async function getTaskDetail(taskGid: string): Promise<any> {
    if (!process.env.ASANA_API_BASE_URL) {
        throw new Error('ASANA_API_BASE_URL non configurato nel .env');
    }
    if (!process.env.ASANA_ACCESS_TOKEN) {
        throw new Error('ASANA_ACCESS_TOKEN non configurato nel .env');
    }

    try {
        const axios = require('axios');
        const response = await axios.get(
            `${process.env.ASANA_API_BASE_URL}/tasks/${taskGid}?opt_fields=gid,name,notes,completed,created_at,modified_at,permalink_url,attachments.name,attachments.download_url,attachments.gid,attachments.view_url,due_on,custom_fields`,
            {
                headers: {
                    'Authorization': `Bearer ${process.env.ASANA_ACCESS_TOKEN}`,
                },
            }
        );

        return response.data;
    } catch (error: any) {
        console.error('Errore recupero dettaglio task:', error);
        throw new Error(error.message || 'Errore durante il recupero del dettaglio task');
    }
}

/**
 * Recupera i commenti (stories) di un task
 */
export async function getTaskStories(taskGid: string): Promise<any> {
    if (!process.env.ASANA_API_BASE_URL) {
        throw new Error('ASANA_API_BASE_URL non configurato nel .env');
    }
    if (!process.env.ASANA_ACCESS_TOKEN) {
        throw new Error('ASANA_ACCESS_TOKEN non configurato nel .env');
    }

    try {
        const axios = require('axios');
        const response = await axios.get(
            `${process.env.ASANA_API_BASE_URL}/tasks/${taskGid}/stories?opt_fields=gid,text,type,created_at,created_by.name,created_by.gid`,
            {
                headers: {
                    'Authorization': `Bearer ${process.env.ASANA_ACCESS_TOKEN}`,
                },
            }
        );

        return response.data;
    } catch (error: any) {
        console.error('Errore recupero commenti task:', error);
        throw new Error(error.message || 'Errore durante il recupero dei commenti');
    }
}

/**
 * Crea un nuovo commento su un task
 */
export async function createTaskStory(taskGid: string, text: string, isClientReply: boolean = false): Promise<any> {
    if (!process.env.ASANA_API_BASE_URL) {
        throw new Error('ASANA_API_BASE_URL non configurato nel .env');
    }
    if (!process.env.ASANA_ACCESS_TOKEN) {
        throw new Error('ASANA_ACCESS_TOKEN non configurato nel .env');
    }

    try {
        // Se è una risposta del cliente, aggiungi un marcatore invisibile
        const marker = '\u200B'; // Zero-width space
        const finalText = isClientReply ? `${marker}${text}` : text;

        const body = {
            data: {
                text: finalText,
            },
        };

        const axios = require('axios');
        const url = `${process.env.ASANA_API_BASE_URL}/tasks/${taskGid}/stories`;
                
        const response = await axios.post(url, body, {
            headers: {
                'Authorization': `Bearer ${process.env.ASANA_ACCESS_TOKEN}`,
                'Content-Type': 'application/json',
            },
        });

        return response.data;
    } catch (error: any) {
        console.error('[createTaskStory] ❌ Errore creazione commento:', {
            message: error.message,
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            taskGid,
            textLength: text?.length,
        });
        throw new Error(error.response?.data?.errors?.[0]?.message || error.message || 'Errore durante la creazione del commento');
    }
}

/**
 * Recupera i dettagli di una story (commento) da Asana
 */
export async function getStory(storyGid: string): Promise<any> {
    if (!process.env.ASANA_API_BASE_URL) {
        throw new Error('ASANA_API_BASE_URL non configurato nel .env');
    }
    if (!process.env.ASANA_ACCESS_TOKEN) {
        throw new Error('ASANA_ACCESS_TOKEN non configurato nel .env');
    }

    try {
        const axios = require('axios');
        const response = await axios.get(
            `${process.env.ASANA_API_BASE_URL}/stories/${storyGid}`,
            {
                headers: {
                    'Authorization': `Bearer ${process.env.ASANA_ACCESS_TOKEN}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        return response.data;
    } catch (error: any) {
        console.error('Errore recupero story:', error);
        throw new Error(error.message || 'Errore durante il recupero della story');
    }
}

/**
 * Aggiorna un task su Asana
 */
export async function updateAsanaTask(taskGid: string, updates: { completed?: boolean; name?: string; notes?: string }): Promise<any> {
    if (!process.env.ASANA_API_BASE_URL) {
        throw new Error('ASANA_API_BASE_URL non configurato nel .env');
    }
    if (!process.env.ASANA_ACCESS_TOKEN) {
        throw new Error('ASANA_ACCESS_TOKEN non configurato nel .env');
    }

    try {
        const axios = require('axios');
        const response = await axios.put(
            `${process.env.ASANA_API_BASE_URL}/tasks/${taskGid}`,
            { data: updates },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.ASANA_ACCESS_TOKEN}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        return response.data;
    } catch (error: any) {
        console.error('Errore aggiornamento task:', error);
        throw new Error(error.message || 'Errore durante l\'aggiornamento del task');
    }
}
