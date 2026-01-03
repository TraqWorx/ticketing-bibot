/**
 * TYPES: User Roles
 * 
 * Sistema multi-ruolo per dashboard
 * 
 * Architettura:
 * - ADMIN: Gestisce utenti, configurazioni
 * - CLIENT: Accede a ticketing e servizi
 * 
 * Ruolo salvato su Firebase (custom claims o campo user)
 */

export enum UserRole {
  ADMIN = 'ADMIN',
  CLIENT = 'CLIENT'
}
