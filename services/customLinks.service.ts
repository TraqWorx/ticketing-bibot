/**
 * SERVICE: Custom Links Service
 * 
 * Gestione CRUD dei custom link degli utenti
 * 
 * Collezione Firebase: userCustomLinks
 * Struttura: { userId: string, links: CustomLink[] }
 */

import { adminDb } from '@/config/firebase-admin';
import { CustomLink, UserCustomLinks, CreateCustomLinkInput, UpdateCustomLinkInput } from '@/types/customLink';

const COLLECTION_NAME = 'userCustomLinks';

export class CustomLinksService {
  /**
   * Ottieni tutti i custom link di un utente
   */
  static async getUserCustomLinks(userId: string): Promise<CustomLink[]> {
    try {
      const docRef = adminDb.collection(COLLECTION_NAME).doc(userId);
      const doc = await docRef.get();

      if (!doc.exists) {
        return [];
      }

      const data = doc.data() as UserCustomLinks;
      return data.links || [];
    } catch (error) {
      console.error('Error fetching custom links:', error);
      throw new Error('Impossibile recuperare i custom link');
    }
  }

  /**
   * Salva/aggiorna i custom link di un utente
   */
  static async setUserCustomLinks(userId: string, links: CustomLink[]): Promise<void> {
    try {
      const docRef = adminDb.collection(COLLECTION_NAME).doc(userId);
      
      await docRef.set({
        userId,
        links,
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error('Error saving custom links:', error);
      throw new Error('Impossibile salvare i custom link');
    }
  }

  /**
   * Aggiungi un nuovo custom link
   */
  static async addCustomLink(userId: string, input: CreateCustomLinkInput): Promise<CustomLink> {
    try {
      const currentLinks = await this.getUserCustomLinks(userId);
      
      const newLink: CustomLink = {
        id: `link_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        label: input.label,
        url: input.url,
        icon: input.icon,
        order: currentLinks.length,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedLinks = [...currentLinks, newLink];
      await this.setUserCustomLinks(userId, updatedLinks);

      return newLink;
    } catch (error) {
      console.error('Error adding custom link:', error);
      throw new Error('Impossibile aggiungere il custom link');
    }
  }

  /**
   * Aggiorna un custom link esistente
   */
  static async updateCustomLink(userId: string, input: UpdateCustomLinkInput): Promise<void> {
    try {
      const currentLinks = await this.getUserCustomLinks(userId);
      
      const updatedLinks = currentLinks.map(link => {
        if (link.id === input.id) {
          return {
            ...link,
            label: input.label ?? link.label,
            url: input.url ?? link.url,
            icon: input.icon ?? link.icon,
            updatedAt: new Date(),
          };
        }
        return link;
      });

      await this.setUserCustomLinks(userId, updatedLinks);
    } catch (error) {
      console.error('Error updating custom link:', error);
      throw new Error('Impossibile aggiornare il custom link');
    }
  }

  /**
   * Elimina un custom link
   */
  static async deleteCustomLink(userId: string, linkId: string): Promise<void> {
    try {
      const currentLinks = await this.getUserCustomLinks(userId);
      const updatedLinks = currentLinks.filter(link => link.id !== linkId);

      await this.setUserCustomLinks(userId, updatedLinks);
    } catch (error) {
      console.error('Error deleting custom link:', error);
      throw new Error('Impossibile eliminare il custom link');
    }
  }

  /**
   * Riordina i custom link
   */
  static async reorderCustomLinks(userId: string, orderedIds: string[]): Promise<void> {
    try {
      const currentLinks = await this.getUserCustomLinks(userId);
      
      const reorderedLinks = orderedIds
        .map((id, index) => {
          const link = currentLinks.find(l => l.id === id);
          if (link) {
            return { ...link, order: index };
          }
          return null;
        })
        .filter(Boolean) as CustomLink[];

      await this.setUserCustomLinks(userId, reorderedLinks);
    } catch (error) {
      console.error('Error reordering custom links:', error);
      throw new Error('Impossibile riordinare i custom link');
    }
  }
}
