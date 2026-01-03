# Blanco Studio Admin Cockpit - Setup Rapido

## 🚀 Configurazione in 3 Passi

### 1. 🔥 Configurazione Firebase

1. **Crea progetto Firebase** su [Firebase Console](https://console.firebase.google.com/)
2. **Abilita Authentication** con Email/Password
3. **Crea Firestore Database**
4. **Configura il file `.env`** con le credenziali:

### 2. 📋 Configurazione Asana

1. **Ottieni Access Token** da Asana Developer Console
2. **Aggiorna il file `.env`**:

3. **Configura Webhook Asana** (tramite API):
   - I webhook Asana si gestiscono esclusivamente tramite API REST
   - **Endpoint**: `POST https://app.asana.com/api/1.0/webhooks`
   - **Headers**: `Authorization: Bearer YOUR_ASANA_ACCESS_TOKEN`

   **Payload per creare webhook**:
   ```json
   {
     "data": {
       "resource": "YOUR_WORKSPACE_GID",
       "target": "https://your-domain.com/api/webhooks/asana",
     }
   }
   ```

   **IMPORTANTE**:
   - `resource`: Usa il **Workspace GID** (non Project GID)
   - `target`: URL pubblico del tuo webhook endpoint

   **Gestione webhook esistenti**:
   - **Lista**: `GET https://app.asana.com/api/1.0/webhooks`
   - **Cancella**: `DELETE https://app.asana.com/api/1.0/webhooks/{webhook_gid}`


### 3. 💬 Configurazione GoHighLevel (GHL)

1. **Ottieni API Token** da GHL Settings → API Keys
2. **Aggiorna il file `.env`**:


## ▶️ Avvio Applicazione

```bash
# Installa dipendenze
npm install

# Avvia in sviluppo
npm run dev

# Build per produzione
npm run build
npm start
```

## 📚 Documentazione Dettagliata

- [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) - Setup Firebase completo
- [README.md](./README.md) - Documentazione generale</content>
<parameter name="filePath">c:\Users\39320\git\Blanco Studio\blanco-studio-admin-cockpit\APP_SETUP.md