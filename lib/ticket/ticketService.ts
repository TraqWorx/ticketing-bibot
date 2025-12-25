/**
 * SERVICE: Ticket Management
 * 
 * Gestione stato ticket su Firestore
 * 
 * Responsabilità:
 * - CRUD ticket su Firestore
 * - Aggiornamento stato waiting_for
 * - Tracking last_message_by
 * 
 * Pattern: Service layer per Firestore
 * NON gestisce automazioni - solo persistenza stato
 */

import { adminDb } from '@/config/firebase-admin';
import { 
  FirestoreTicket, 
  CreateTicketPayload, 
  TicketReplyPayload,
  MessageAuthor,
  WaitingFor,
  TicketStatus 
} from '@/types/ticket';
import { FieldValue } from 'firebase-admin/firestore';

const TICKETS_COLLECTION = 'tickets';

/**
 * Crea un nuovo ticket su Firestore
 * Chiamato dopo la creazione del task su Asana
 */
export async function createTicket(payload: CreateTicketPayload): Promise<FirestoreTicket> {
  const { ticketId, clientId, ghlContactId, title, priority, clientName, clientPhone, clientEmail } = payload;

  const now = FieldValue.serverTimestamp();
  
  const ticketData: Omit<FirestoreTicket, 'lastActivityAt' | 'createdAt'> & { 
    lastActivityAt: FirebaseFirestore.FieldValue;
    createdAt: FirebaseFirestore.FieldValue;
  } = {
    ticketId,
    clientId,
    ghlContactId,
    status: TicketStatus.OPEN,
    waitingFor: 'admin',     // Admin deve rispondere
    lastActivityAt: now,
    createdAt: now,
    title,
    priority,
    clientName,
    clientPhone,
    clientEmail,
  };

  await adminDb
    .collection(TICKETS_COLLECTION)
    .doc(ticketId)
    .set(ticketData);

  // Ritorna i dati con timestamp simulato per la risposta
  return {
    ...ticketData,
    lastActivityAt: new Date(),
    createdAt: new Date(),
  } as FirestoreTicket;
}

/**
 * Aggiorna lo stato del ticket quando qualcuno risponde
 */
export async function updateTicketOnReply(payload: TicketReplyPayload): Promise<void> {
  const { ticketId, repliedBy } = payload;

  // Determina chi deve rispondere ora
  const waitingFor: WaitingFor = repliedBy === 'client' ? 'admin' : 'client';

  await adminDb
    .collection(TICKETS_COLLECTION)
    .doc(ticketId)
    .update({
      waitingFor: waitingFor,
      lastActivityAt: FieldValue.serverTimestamp(),
    });
}

/**
 * Recupera un ticket da Firestore
 */
export async function getTicket(ticketId: string): Promise<FirestoreTicket | null> {
  const doc = await adminDb
    .collection(TICKETS_COLLECTION)
    .doc(ticketId)
    .get();

  if (!doc.exists) {
    return null;
  }

  return doc.data() as FirestoreTicket;
}

/**
 * Recupera tutti i ticket di un cliente
 */
export async function getClientTickets(clientId: string): Promise<FirestoreTicket[]> {
  const snapshot = await adminDb
    .collection(TICKETS_COLLECTION)
    .where('clientId', '==', clientId)
    .orderBy('lastActivityAt', 'desc')
    .get();

  return snapshot.docs.map(doc => doc.data() as FirestoreTicket);
}

/**
 * Recupera ticket in attesa di risposta da un ruolo specifico
 */
export async function getTicketsWaitingFor(waitingFor: WaitingFor): Promise<FirestoreTicket[]> {
  const snapshot = await adminDb
    .collection(TICKETS_COLLECTION)
    .where('waitingFor', '==', waitingFor)
    .where('status', '==', 'open')
    .orderBy('lastActivityAt', 'desc')
    .get();

  return snapshot.docs.map(doc => doc.data() as FirestoreTicket);
}

/**
 * Chiude un ticket
 */
export async function closeTicket(ticketId: string): Promise<void> {
  await adminDb
    .collection(TICKETS_COLLECTION)
    .doc(ticketId)
    .update({
      status: 'closed' as TicketStatus,
      waitingFor: null,
      lastActivityAt: FieldValue.serverTimestamp(),
    });
}

/**
 * Riapre un ticket
 */
export async function reopenTicket(ticketId: string, reopenedBy: MessageAuthor): Promise<void> {
  const waitingFor: WaitingFor = reopenedBy === 'client' ? 'admin' : 'client';
  
  await adminDb
    .collection(TICKETS_COLLECTION)
    .doc(ticketId)
    .update({
      status: 'open' as TicketStatus,
      waitingFor: waitingFor,
      lastActivityAt: FieldValue.serverTimestamp(),
    });
}

/**
 * Verifica se un ticket esiste su Firestore
 */
export async function ticketExists(ticketId: string): Promise<boolean> {
  const doc = await adminDb
    .collection(TICKETS_COLLECTION)
    .doc(ticketId)
    .get();

  return doc.exists;
}

/**
 * Aggiorna campi generici di un ticket
 */
export async function updateTicket(
  ticketId: string, 
  updates: Partial<FirestoreTicket>
): Promise<void> {
  await adminDb
    .collection(TICKETS_COLLECTION)
    .doc(ticketId)
    .update({
      ...updates,
      lastActivityAt: FieldValue.serverTimestamp(),
    });
}

/**
 * Recupera un utente da Firestore per ID
 */
export async function getUserById(userId: string): Promise<any> {
  const userDoc = await adminDb.collection('users').doc(userId).get();
  if (!userDoc.exists) {
    return null;
  }
  return {
    id: userDoc.id,
    ...userDoc.data(),
  };
}
