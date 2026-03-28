import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest, AuthIdentity } from '@/lib/auth-middleware';
import { adminDb } from '@/config/firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { searchGHLContact, createGHLContact, updateGHLContact, upsertGHLContact } from '@/lib/ghl/ghlService';
import { UserDelegate } from '@/types/user';
async function handler(req: AuthenticatedRequest, res: NextApiResponse, auth: AuthIdentity) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { delegates } = req.body as { delegates: UserDelegate[] };
    // auth can be a user or a service. Only users can update their delegates.
    if (auth.type !== 'user') return res.status(403).json({ error: 'Accesso negato' });
    const userId = auth.uid;

    let delegatesWithGhlId: UserDelegate[] = [];
    for (const delegate of delegates) {
      if (!delegate.email && !delegate.phone) continue;
      let delegateGhlId = '';

      try {
        // Usa l'endpoint upsert che crea o aggiorna secondo la configurazione della Location
        const upserted = await upsertGHLContact({
          email: delegate.email,
          firstName: delegate.firstName,
          lastName: delegate.lastName,
          phone: delegate.phone,
        });

        if (upserted?.id) delegateGhlId = upserted.id;
        else if (upserted?.contact?.id) delegateGhlId = upserted.contact.id;
      } catch (e: any) {
        console.warn('upsertGHLContact fallita per delegate:', delegate.email || delegate.phone, e?.response?.data || e?.message || e);
        // Tentativo di fallback: se abbiamo email, proviamo a cercare e aggiornare
        try {
          if (delegate.email) {
            const found = await searchGHLContact(delegate.email);
            if (found?.id) {
              try {
                await updateGHLContact(found.id, {
                  email: delegate.email,
                  firstName: delegate.firstName,
                  lastName: delegate.lastName,
                  phone: delegate.phone,
                });
                delegateGhlId = found.id;
              } catch (err) {
                console.warn('updateGHLContact fallback fallita:', err);
              }
            }
          }
        } catch (err) {
          // ignore
        }
      }

      delegatesWithGhlId.push({ ...delegate, ghl_contact_id: delegateGhlId });
    }

    await adminDb.collection('users').doc(userId).update({ delegates: delegatesWithGhlId });
    return res.status(200).json({ success: true, delegates: delegatesWithGhlId });
  } catch (error) {
    console.error('Errore update delegates:', error);
    return res.status(500).json({ error: 'Errore aggiornamento delegati' });
  }
}

export default withAuth(handler);
