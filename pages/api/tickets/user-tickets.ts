/**
 * API ENDPOINT: /api/tickets/user-tickets
 *
 * Recupera tutti i ticket di un utente specifico, combinando dati da Asana e Firestore
 *
 * Method: GET
 * Query: userId (Firebase UID dell'utente)
 *
 * Returns: Oggetto con array di ticket arricchiti
 */

import { getUserTasks } from '@/lib/asana/asanaService';
import { withAuth } from '@/lib/auth-middleware';
import { TicketPriority, TicketStatus } from '@/modules/ticketing/types';
import { applicationDefault, getApp, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { NextApiRequest, NextApiResponse } from 'next';

// Inizializza Firebase Admin SDK
if (!getApps().length) {
  initializeApp({
    credential: applicationDefault(),
  });
} else {
  getApp();
}

const db = getFirestore();

export default withAuth(async (req: NextApiRequest, res: NextApiResponse) => {
  // Solo GET
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { userId } = req.query;

    // Validazione input
    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ message: 'User ID non valido' });
    }

    // 1. Recupera task da Asana
    const asanaResponse = await getUserTasks(userId);
    const asanaTasks = asanaResponse.data || [];

    // 2. Recupera dati aggiuntivi da Firestore
    const firestoreSnapshot = await db
      .collection('tickets')
      .where('clientId', '==', userId)
      .get();

    const firestoreTickets: Record<string, any> = {};
    if (!firestoreSnapshot.empty) {
      firestoreSnapshot.forEach((doc) => {
        const data = doc.data();
        firestoreTickets[doc.id] = {
          priority: data.priority || 'medium',
          waitingFor: data.waitingFor || null,
          clientId: data.clientId || null,
          clientName: data.clientName || null,
          clientPhone: data.clientPhone || null,
          ghlContactId: data.ghlContactId || null,
          createdAt: data.createdAt || null,
          lastActivityAt: data.lastActivityAt || null,
          status: data.status || null,
          title: data.title || null,
        };
      });
    }

    // 3. Combina i dati come nel hook useTickets
    const mappedTickets = asanaTasks.map((task: any) => {
      const sectionName = task.memberships?.[0]?.section?.name?.toLowerCase() || '';
      let status = TicketStatus.OPEN;
      if (sectionName.includes('lavorazione') || sectionName.includes('in progress')) {
        status = TicketStatus.IN_PROGRESS;
      } else if (sectionName.includes('completati') || sectionName.includes('completed') || sectionName.includes('done')) {
        status = TicketStatus.COMPLETED;
      }

      // Dati da Firestore
      const firestoreData = firestoreTickets[task.gid] || {};

      // Conversione sicura della priorità Firestore in enum
      let priority: TicketPriority = TicketPriority.MEDIUM;
      if (firestoreData.priority) {
        const p = firestoreData.priority.toString().toLowerCase();
        if (p === 'low') priority = TicketPriority.LOW;
        else if (p === 'medium') priority = TicketPriority.MEDIUM;
        else if (p === 'high') priority = TicketPriority.HIGH;
        else if (p === 'urgent') priority = TicketPriority.URGENT;
      } else {
        // fallback mapping da Asana
        const priorityCustomField = (task as any).custom_fields?.find(
          (cf: any) => cf.name?.toLowerCase() === 'task_priority'
        );
        let priorityValue = (
          priorityCustomField?.display_value ||
          priorityCustomField?.enum_value?.name ||
          'media'
        ).toString().trim().toLowerCase();
        if (["alta", "high", "urgente", "urgent"].includes(priorityValue)) {
          priority = TicketPriority.URGENT;
        } else if (["media", "medium"].includes(priorityValue)) {
          priority = TicketPriority.MEDIUM;
        } else if (["bassa", "low"].includes(priorityValue)) {
          priority = TicketPriority.LOW;
        }
      }

      return {
        id: task.gid,
        title: firestoreData.title || task.name,
        description: '',
        status, // Usa sempre lo status calcolato da Asana
        priority,
        createdAt: firestoreData.createdAt ? new Date(firestoreData.createdAt) : new Date(),
        updatedAt: firestoreData.lastActivityAt ? new Date(firestoreData.lastActivityAt) : new Date(),
        dueDate: task.due_on ? new Date(task.due_on) : undefined,
        tags: [],
        commentsCount: 0,
        attachmentsCount: 0,
        clientId: firestoreData.clientId,
        clientName: firestoreData.clientName,
        clientPhone: firestoreData.clientPhone,
        ghlContactId: firestoreData.ghlContactId,
        waitingFor: firestoreData.waitingFor,
      };
    });

    // Ordina i ticket solo per data di creazione (più recenti prima)
    mappedTickets.sort((a: any, b: any) => b.createdAt.getTime() - a.createdAt.getTime());

    // Risposta successo
    return res.status(200).json({
      success: true,
      data: mappedTickets,
    });

  } catch (error: any) {
    console.error('Errore API user-tickets:', error);

    return res.status(500).json({
      success: false,
      message: error.message || 'Errore durante il recupero dei ticket',
    });
  }
});