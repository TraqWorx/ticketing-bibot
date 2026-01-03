/**
 * API: Manage Custom Links
 * 
 * POST /api/custom-links/manage
 * 
 * Gestisce operazioni CRUD sui custom link:
 * - add: Aggiungi nuovo link
 * - update: Modifica link esistente
 * - delete: Elimina link
 * - reorder: Riordina link
 * - set: Imposta tutti i link (per bulk update)
 * 
 * Auth: Richiede autenticazione
 * Permessi: Solo ADMIN può gestire link di qualsiasi utente
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { CustomLinksService } from '@/services/customLinks.service';
import { adminAuth } from '@/config/firebase-admin';
import { CreateCustomLinkInput, UpdateCustomLinkInput, CustomLink } from '@/types/customLink';

interface ManageRequest {
  action: 'add' | 'update' | 'delete' | 'reorder' | 'set';
  userId: string;
  data?: CreateCustomLinkInput | UpdateCustomLinkInput | string | string[] | CustomLink[];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Solo POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verifica token
    const token = req.headers.authorization?.split('Bearer ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Token mancante' });
    }

    const decodedToken = await adminAuth.verifyIdToken(token);

    // Solo ADMIN può gestire i link
    if (decodedToken.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Non autorizzato' });
    }

    const { action, userId, data } = req.body as ManageRequest;

    if (!userId) {
      return res.status(400).json({ error: 'userId è richiesto' });
    }

    switch (action) {
      case 'add':
        if (!data || typeof data !== 'object' || !('label' in data) || !('url' in data)) {
          return res.status(400).json({ error: 'Dati non validi per add' });
        }
        const newLink = await CustomLinksService.addCustomLink(userId, data as CreateCustomLinkInput);
        return res.status(200).json({ link: newLink });

      case 'update':
        if (!data || typeof data !== 'object' || !('id' in data)) {
          return res.status(400).json({ error: 'Dati non validi per update' });
        }
        await CustomLinksService.updateCustomLink(userId, data as UpdateCustomLinkInput);
        return res.status(200).json({ success: true });

      case 'delete':
        if (!data || typeof data !== 'string') {
          return res.status(400).json({ error: 'Link ID è richiesto per delete' });
        }
        await CustomLinksService.deleteCustomLink(userId, data);
        return res.status(200).json({ success: true });

      case 'reorder':
        if (!data || !Array.isArray(data)) {
          return res.status(400).json({ error: 'Array di ID è richiesto per reorder' });
        }
        await CustomLinksService.reorderCustomLinks(userId, data as string[]);
        return res.status(200).json({ success: true });

      case 'set':
        if (!data || !Array.isArray(data)) {
          return res.status(400).json({ error: 'Array di link è richiesto per set' });
        }
        await CustomLinksService.setUserCustomLinks(userId, data as CustomLink[]);
        return res.status(200).json({ success: true });

      default:
        return res.status(400).json({ error: 'Azione non valida' });
    }
  } catch (error: any) {
    console.error('Error managing custom links:', error);
    return res.status(500).json({ error: error.message || 'Errore del server' });
  }
}
