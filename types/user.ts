/**
 * TYPES: User Entity
 * 
 * Modello dati utente per sistema multi-tenant
 * 
 * Campi:
 * - id: Firebase UID (identificativo univoco)
 * - ghl_contact_id: ID GoHighLevel per sincronizzazione
 * - role: Ruolo per autorizzazione
 */

import { UserRole } from './roles';

// Re-export UserRole for convenience
export { UserRole } from './roles';

export interface User {
  id: string; // Firebase UID
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
}
