# Blanco Studio Admin Cockpit - Setup Firebase

## 🔥 Configurazione Firebase

### 1. Crea il file `.env.local`

Copia il file `.env.local.example` in `.env.local`:

```bash
cp .env.local.example .env.local
```

### 2. Ottieni le credenziali Firebase

1. Vai alla [Firebase Console](https://console.firebase.google.com/)
2. Seleziona il tuo progetto esistente
3. Vai in **Impostazioni Progetto** (icona ingranaggio)
4. Nella sezione **Le tue app**, trova la Web App
5. Copia le credenziali di configurazione

### 3. Popola `.env.local`

Inserisci le credenziali nel file `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyC...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456:web:abc123
```

### 4. Configura Firebase Authentication

1. Nella Firebase Console, vai su **Authentication**
2. Clicca su **Inizia**
3. Abilita **Email/Password** come metodo di accesso
4. Crea un utente admin per testare:
   - Email: `admin@example.com`
   - Password: (scegli una password sicura)

### 5. Configura Firestore Database

1. Vai su **Firestore Database**
2. Clicca su **Crea database**
3. Scegli modalità **Produzione** o **Test**
4. Seleziona una location geografica

### 6. Struttura Firestore

Crea la seguente struttura nel database:

```
users/
  {userId}/
    id: string (Firebase UID)
    email: string
    firstName: string
    lastName: string
    role: "ADMIN" | "CLIENT"
    client_id: string (opzionale, solo per CLIENT)
    ghl_contact_id: string (opzionale)
    phone: string
    createdAt: timestamp
    updatedAt: timestamp
```

### 7. Aggiungi il primo utente ADMIN

Nella collezione `users`, crea un documento con l'UID dell'utente creato:

```json
{
  "id": "firebase_uid_here",
  "email": "admin@example.com",
  "firstName": "Admin",
  "lastName": "User",
  "role": "ADMIN",
  "phone": "",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

### 8. Avvia l'applicazione

```bash
npm run dev
```

Accedi con le credenziali admin create.