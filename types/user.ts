/**
 * TYPES: User Entity
 * 
 * Modello dati utente per sistema multi-tenant
 * 
 * Campi:
 * - client_id: ID interno generato
 * - ghl_contact_id: ID GoHighLevel per sincronizzazione
 * - Firebase UID per autenticazione
 * - Role per autorizzazione
 */

import { UserRole } from './roles';

// Re-export UserRole for convenience
export { UserRole } from './roles';

export interface User {
  id: string; // Firebase UID
  client_id: string; // ID interno generato (CLT-XXXXX)
  ghl_contact_id: string; // GoHighLevel Contact ID
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserInput {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  ghl_contact_id: string;
}
