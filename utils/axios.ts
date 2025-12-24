import axios from 'axios';
import { triggerSessionExpiredModal } from '@/components/SessionExpiredModal';
import { auth } from '@/config/firebase';
import { getIdToken } from 'firebase/auth';

// Interceptor di richiesta - aggiunge automaticamente il token Firebase
axios.interceptors.request.use(async (config) => {
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
  
  return config;
});

// Interceptor globale per gestire errori 401
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Mostra la modale di sessione scaduta
      triggerSessionExpiredModal();
      // Non propagare l'errore - viene gestito dalla modale globale
      return new Promise(() => {}); // Promise che non si risolve mai, bloccando la propagazione
    }
    return Promise.reject(error);
  }
);

export default axios;
