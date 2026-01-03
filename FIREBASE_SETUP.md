# Blanco Studio Admin Cockpit - Setup Completo

## 🔥 Configurazione Firebase

### 1. Crea il file `.env`

Il progetto usa il file `.env` per le configurazioni (non `.env.local`).

### 2. Ottieni le credenziali Firebase

1. Vai alla [Firebase Console](https://console.firebase.google.com/)
2. Seleziona il tuo progetto esistente
3. Vai in **Impostazioni Progetto** (icona ingranaggio)
4. Nella sezione **Le tue app**, trova la Web App
5. Copia le credenziali di configurazione

### 3. Configura Firebase nel file `.env`

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyC...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456:web:abc123

# Firebase Admin (per server-side operations)
FIREBASE_ADMIN_PROJECT_ID=your-project-id
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
```

### 4. Configura Firebase Authentication

1. Nella Firebase Console, vai su **Authentication**
2. Clicca su **Inizia**
3. Abilita **Email/Password** come metodo di accesso
4. Crea un utente admin per testare

### 5. Configura Firestore Database

1. Vai su **Firestore Database**
2. Clicca su **Crea database**
3. Scegli modalità **Produzione** o **Test**
4. Seleziona una location geografica

### 6. Struttura Firestore

#### Collezione `users/`
```json
{
  "id": "firebase_uid",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "ADMIN" | "CLIENT",
  "client_id": "optional_client_id",
  "ghl_contact_id": "optional_ghl_id",
  "phone": "+1234567890",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

#### Collezione `tickets/`
```json
{
  "ticketId": "asana_task_gid",
  "clientId": "firebase_user_id",
  "ghlContactId": "optional_ghl_contact_id",
  "status": "open" | "completed",
  "waitingFor": "admin" | "client" | null,
  "title": "task_title_from_asana",
  "priority": "high" | "medium" | "low",
  "clientName": "client_name",
  "clientPhone": "client_phone",
  "clientEmail": "client_email",
  "lastActivityAt": "timestamp",
  "createdAt": "timestamp"
}
```

### 7. Avvia l'applicazione

```bash
npm install
npm run dev
```

Accedi con le credenziali admin create.