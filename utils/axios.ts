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
