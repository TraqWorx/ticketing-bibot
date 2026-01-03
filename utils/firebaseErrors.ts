/**
 * UTILS: Firebase Error Messages
 * 
 * Mappa errori Firebase a messaggi user-friendly in italiano
 */

export const getFirebaseErrorMessage = (errorCode: string): string => {
  const errorMessages: Record<string, string> = {
    // Auth errors
    'auth/invalid-credential': 'Email o password non corretti',
    'auth/user-not-found': 'Utente non trovato',
    'auth/wrong-password': 'Password errata',
    'auth/email-already-in-use': 'Email già registrata',
    'auth/weak-password': 'Password troppo debole (minimo 6 caratteri)',
    'auth/invalid-email': 'Email non valida',
    'auth/user-disabled': 'Account disabilitato',
    'auth/too-many-requests': 'Troppi tentativi. Riprova più tardi',
    'auth/network-request-failed': 'Errore di connessione. Verifica la tua rete',
    'auth/invalid-api-key': 'Configurazione Firebase non valida',
    'auth/app-deleted': 'Errore di configurazione Firebase',
    'auth/requires-recent-login': 'Rieffettua il login per continuare',
    
    // Firestore errors
    'permission-denied': 'Non hai i permessi per questa operazione',
    'unavailable': 'Servizio temporaneamente non disponibile',
    'not-found': 'Risorsa non trovata',
    'already-exists': 'La risorsa esiste già',
    'resource-exhausted': 'Quota superata',
    'failed-precondition': 'Operazione non consentita',
    'aborted': 'Operazione annullata',
    'out-of-range': 'Valore fuori range',
    'unimplemented': 'Operazione non implementata',
    'internal': 'Errore interno del server',
    'data-loss': 'Perdita di dati',
    'unauthenticated': 'Autenticazione richiesta',
  };

  return errorMessages[errorCode] || 'Si è verificato un errore. Riprova';
};
