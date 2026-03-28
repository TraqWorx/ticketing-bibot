import axios from 'axios';
import { triggerSessionExpiredModal } from '@/components/SessionExpiredModal';
import { auth } from '@/config/firebase';
import { getIdToken } from 'firebase/auth';

// Utility: genera correlation id compatibile con browser/Node
const generateCorrelationId = () => {
  try {
    if (typeof crypto !== 'undefined' && typeof (crypto as any).randomUUID === 'function') {
      return (crypto as any).randomUUID();
    }
  } catch (e) {
    // ignore
  }
  return `cid-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,10)}`;
};

const maskAuthHeader = (headers: any) => {
  if (!headers) return headers;
  const copy = { ...headers };
  if (copy.Authorization) copy.Authorization = 'REDACTED';
  if (copy.authorization) copy.authorization = 'REDACTED';
  return copy;
};

// Controlla se i log HTTP devono essere abilitati
const isHttpLogsEnabled = () => {
  try {
    return process.env.ENABLE_HTTP_LOGS === 'true';
  } catch (e) {
    return false;
  }
};

// Interceptor di richiesta - aggiunge automaticamente il token Firebase
axios.interceptors.request.use(async (config) => {
  // attach timing metadata
  (config as any).metadata = { startTime: new Date() };

  // generate or forward correlation id
  const existingCid = config.headers?.['X-Correlation-Id'] || config.headers?.['x-correlation-id'];
  const correlationId = existingCid || generateCorrelationId();
  config.headers = config.headers || {};
  config.headers['X-Correlation-Id'] = correlationId;

  try {
    // Ottieni l'utente corrente
    const user = auth.currentUser;
    
    if (user) {
      // Ottieni il token ID
      const token = await getIdToken(user);
      
      // Aggiungi il token all'header Authorization
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (error) {
    console.warn('Errore nell\'ottenere il token Firebase:', error);
  }

  // Log request (without Authorization header value) solo se abilitati
  if (isHttpLogsEnabled()) {
    try {
      //const safeHeaders = maskAuthHeader(config.headers);
      
      const payload = {
        type: 'api:request',
        correlationId,
        method: config.method,
        url: config.url,
        // headers: safeHeaders,
        data: config.data,
        ts: new Date().toISOString(),
      };
      // stampa una singola riga JSON per facile parsing
      console.log(JSON.stringify(payload));
    } catch (e) {
      // ignore logging errors
    }
  }

  return config;
});

// Interceptor globale per gestire errori 401
axios.interceptors.response.use(
  (response) => {
    if (isHttpLogsEnabled()) {
      try {
        const metadata = (response.config as any)?.metadata;
        const start = metadata?.startTime ? new Date(metadata.startTime).getTime() : Date.now();
        const duration = Date.now() - start;
        const correlationId = response.config?.headers?.['X-Correlation-Id'] || response.headers?.['x-correlation-id'] || null;

        // const safeReqHeaders = maskAuthHeader(response.config?.headers);

        const payload = {
          type: 'api:response',
          correlationId,
          method: response.config?.method,
          url: response.config?.url,
          status: response.status,
          duration,
          // responseHeaders: response.headers,
          data: response.data,
          ts: new Date().toISOString(),
        };
        console.log(JSON.stringify(payload));
      } catch (e) {
        // ignore
      }
    }
    return response;
  },
  (error) => {
    if (isHttpLogsEnabled()) {
      try {
        const config = error.config || {};
        const metadata = (config as any)?.metadata;
        const start = metadata?.startTime ? new Date(metadata.startTime).getTime() : Date.now();
        const duration = Date.now() - start;
        const correlationId = config?.headers?.['X-Correlation-Id'] || error.response?.headers?.['x-correlation-id'] || null;

        const safeReqHeaders = maskAuthHeader(config?.headers);

        const payload = {
          type: 'api:error',
          correlationId,
          method: config?.method,
          url: config?.url,
          status: error.response?.status,
          duration,
          requestHeaders: safeReqHeaders,
          responseHeaders: error.response?.headers,
          message: error.message,
          data: error.response?.data,
          ts: new Date().toISOString(),
        };
        console.error(JSON.stringify(payload));
      } catch (e) {
        // ignore
      }
    }

    if (error.response?.status === 401) {
      triggerSessionExpiredModal();

      // Risolvi la promise con un valore controllato
      return Promise.resolve(null);
    }

    return Promise.reject({
      status: error.response?.status,
      message:
        error.response?.data?.message ||
        'Errore server',
    });
  }
);


export default axios;
