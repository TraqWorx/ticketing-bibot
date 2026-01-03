/**
 * CONFIG: Firebase Configuration
 * 
 * Configurazione Firebase per Authentication e Firestore
 * 
 * Setup:
 * 1. Crea file .env.local con le tue credenziali Firebase
 * 2. Abilita Authentication (Email/Password) nella console Firebase
 * 3. Crea database Firestore
 * 4. Configura custom claims per ruoli (ADMIN/CLIENT)
 */

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
};

// Validate configuration
const isConfigValid = Object.values(firebaseConfig).every(val => val && val !== '');

if (!isConfigValid && typeof window !== 'undefined') {
  console.warn('⚠️ Firebase configuration incomplete. Set environment variables in .env.local');
}

// Initialize Firebase
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} else {
  app = getApps()[0];
  auth = getAuth(app);
  db = getFirestore(app);
}

// Firestore Collections
export const COLLECTIONS = {
  USERS: 'users',
  TICKETS: 'tickets',
} as const;

export { app, auth, db };
