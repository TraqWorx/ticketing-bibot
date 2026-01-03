/**
 * MODULE: Users Management
 * 
 * Tipi TypeScript per il modulo Users
 */

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  GUEST = 'guest'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: Date;
}
