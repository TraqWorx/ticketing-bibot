# CLAUDE.md — Bibot Cockpit

> Onboarding for AI agents working on this deployment. Not a README.
> Last updated: 2026-04-28.

---

## WHAT — Context

### Project identity
- **Name**: Bibot Cockpit (deployment of `blanco-studio-admin-cockpit`)
- **Production URL**: https://support.bibotcrm.it
- **Vercel default URL**: https://ticketing-bibot.vercel.app
- **Repo**: `TraqWorx/ticketing-bibot` (forked from `TraqWorx/ticketing`, originally `maiorano17/blanco-studio-admin-cockpit`)
- **Local working dir**: `/Users/dan/Desktop/blanco-studio-admin-cockpit`
- **Two git remotes**:
  - `origin` → `TraqWorx/ticketing` (canonical/upstream — read-only for Bibot work)
  - `bibot` → `TraqWorx/ticketing-bibot` (Bibot deployment — push here)

### Purpose
Customer-support cockpit. Italian agency UX. Two roles: ADMIN (Bibot team) and CLIENT (Bibot's customers). Clients open support tickets; admins reply via Asana; GHL fans out WhatsApp/SMS/email notifications.

### Tech stack
See `package.json` for exact versions. Key choices:
- **Next.js 16** (Pages Router — NOT App Router)
- **React 19**, **TypeScript 5.7**
- **Chakra UI v3** (uses `createSystem`, NOT old `extendTheme`)
- **Firebase Auth + Firestore** (client SDK + Admin SDK)
- **Asana REST API** (workspace-scoped Bearer token)
- **GoHighLevel** (outbound webhooks for notifications, inbound API for contact CRUD)
- **Vercel Blob** (transient file storage)
- **OpenAI Whisper** (`whisper-1`, language `it`)

### Repository map
- `pages/` — Next.js routes (Pages Router). API routes under `pages/api/`.
- `pages/clienti/` — client-facing routes (CLIENT role)
- `pages/admin/`, `pages/dashboard/` — admin-facing routes (ADMIN role)
- `modules/` — feature modules (ticketing, users, settings)
- `lib/asana/`, `lib/ghl/`, `lib/ticket/`, `lib/openaiWhisper.ts` — integration services
- `components/` — shared UI (sidebars, headers, modals)
- `layouts/` — `AdminLayout` / `ClientLayout` / `DashboardLayout`
- `contexts/AuthContext.tsx` — Firebase auth state + Firestore user snapshot listener
- `config/firebase.ts` (client) + `config/firebase-admin.ts` (server)
- `lib/auth-middleware.ts` — `withAuth` / `withAdminAuth` for API routes
- `types/` — shared TypeScript types

---

## WHY — Architecture decisions

### The 3-system data split
This is the load-bearing architectural choice. Don't fight it.

| Store | Owns | Why |
|---|---|---|
| **Asana** | Ticket content (title, description, comments, attachments, status-via-section) | Bibot's support team already lives in Asana — they reply there, drag tasks between sections |
| **Firestore** | User profiles, roles, delegates, ticket *metadata* (`waitingFor`, priority cache, GHL contact IDs) | Auth and fast UI rendering; thin shadow of Asana |
| **GHL** | Contacts (mirror of Firestore users) + notification workflows | Bibot already runs WhatsApp/SMS/email through GHL; cockpit only emits events |
| **Vercel Blob** | Transient file uploads | Bridges client → Asana attachments; files deleted after Asana upload |

**Rule**: never write ticket content to Firestore. Never read ticket content from Firestore. Asana is the source of truth for content.

### Auth model
- Two flows handled by `lib/auth-middleware.ts`:
  - User: `Authorization: Bearer <Firebase ID token>` → verified via `adminAuth.verifyIdToken()`
  - Service: `X-API-Key: <token>` → only GHL is whitelisted (the same token as `GHL_API_ACCESS_TOKEN`)
- Roles stored as Firebase **custom claims** (`role: 'ADMIN' | 'CLIENT'`)
- Self-healing: if claim is missing, middleware reads from Firestore and back-fills the claim

### Firestore security rules
- All client writes denied (`allow write: if false`). Everything goes through Admin SDK in API routes.
- Rules live in Firebase Console → Firestore → Rules tab (NOT in repo)
- Collections: `users`, `tickets`, `userCustomLinks`, `passwordResetTokens`

### Asana ↔ Firestore sync
- One direction: Asana webhook → API route updates Firestore + fires GHL events
- Webhook handshake: Asana sends `X-Hook-Secret`, code echoes it back (`pages/api/webhooks/asana/index.ts:72-76`)
- **No HMAC signature verification** beyond handshake — trust-on-first-use
- Client comments are tagged with a **zero-width space** (`​`) prefix so the webhook can distinguish them from admin comments (`lib/asana/asanaService.ts:369`, check at `:211`). Don't strip this character.

### Asana section names — magic strings
Status is derived from Asana section names via `.includes()` (case-insensitive). Required substrings:
- `lavorazione` → `in_progress`
- `completati` (or `completed` / `done`) → `completed`
- Anything else → `open`

Renaming Asana sections breaks the kanban. See `pages/api/tickets/user-tickets.ts:75-82` and `modules/ticketing/pages/detail.tsx:309-317`.

### GHL fan-out
When a ticket event fires, the code loops through `[primary_contact, ...delegates]` and POSTs to BOTH the "client message" and "admin message" webhooks per contact. So 1 ticket with 2 delegates = 6 webhook POSTs for `ticket_created`. GHL workflows handle delivery.

---

## HOW — Workflows & commands

### Local dev
```bash
npm install
npm run dev          # Next.js dev server on :3000
npm run build        # Production build (validates the whole codebase)
npm run lint         # ESLint
```

### Env vars
- Local: `.env.local` (gitignored — contains all secrets)
- Production: in Vercel — `vercel env ls` to inspect, `vercel env pull` to mirror locally
- Full env var list: see `.env.local` for the canonical set
- One typo to NOT fix: `OPEN_AI_API_KEY` (with underscore, not `OPENAI_API_KEY`)

### Deploy
```bash
vercel deploy --prod        # Bibot scope (we're linked via .vercel/project.json)
vercel ls                   # List recent deployments
vercel logs <url>           # Tail logs from a deployment
vercel env ls production    # List production env vars
```

The local repo is linked to `bibot/ticketing-bibot` via `.vercel/`. Don't `vercel link` to a different account.

### Git workflow
- Pull upstream updates: `git pull origin main`
- Push Bibot-specific changes: `git push bibot main`
- Don't push Bibot config to `origin` (it's the canonical upstream for other deployments)

### Commit format
Follow existing convention (see `git log`): `feat: short description` / `fix: short description`. Italian-language descriptions are common.

---

## Bibot-specific service IDs

> Sensitive secrets live in `.env.local` and Vercel env vars only. This section is non-secret IDs.

### Firebase
- Project ID: `bibot-ticketing`
- Auth domain: `bibot-ticketing.firebaseapp.com`
- Storage bucket: `bibot-ticketing.firebasestorage.app`
- Service account email: `firebase-adminsdk-fbsvc@bibot-ticketing.iam.gserviceaccount.com`

### GHL (GoHighLevel)
- Subaccount: Bibot
- Location ID: `A9OQOsWw1io1F7vu8t5n`
- Plan: $497 SaaS (covers workflows + Private Integrations)
- API base: `https://services.leadconnectorhq.com`
- API token format: `pit-*` (Private Integration Token)
- Required scopes: `contacts.readonly`, `contacts.write`

### Asana
- Status: **NOT YET CONFIGURED** (pending workspace creation)
- Required: workspace + project on Starter plan or higher (custom fields needed)
- Section names must contain `lavorazione` and `completati` substrings
- Custom fields needed: `task_creator_id` (text), `task_creator_name` (text), `task_creator_phone` (text), `priority` (single-select: low/medium/high)

### DNS
- Domain: `bibotcrm.it` registered at GoDaddy
- Authoritative NS: `ns81.domaincontrol.com` / `ns82.domaincontrol.com`
- **Wildcard CNAME `* → cname.msgsndr.com.` exists at the root** — do NOT delete (used by other GHL subdomains)
- `support.bibotcrm.it` has specific A record `76.76.21.21` overriding the wildcard

### Vercel
- Team / scope: `bibot`
- Project: `ticketing-bibot`
- Blob store: `bibot-attachments` (region LHR1, public access)
- Domain status: `support.bibotcrm.it` aliased + SSL via Let's Encrypt

---

## GHL workflow → env var mapping

| Env var | Bibot workflow name |
|---|---|
| `GHL_WEBHOOK_TICKET_CREATED_SEND_CLIENT_MSG` | `(Ticket creato da Cliente/Admin) Invio notifica Cliente` |
| `GHL_WEBHOOK_TICKET_CREATED_SEND_ADMIN_MSG` | `(Ticket creato da Cliente) Invio notifica Admin` |
| `GHL_WEBHOOK_CLIENT_REPLIED` | `Cliente ha risposto ad un ticket` |
| `GHL_WEBHOOK_ADMIN_REPLIED` | `Admin ha risposto un ticket` |
| `GHL_WEBHOOK_CLIENT_FOLLOWUP_AFTER_ADMIN_RESPONSE` | `(Admin ha risposto ad un ticket) Followup cliente 24/48/72h + warning admin dopo 96h` |
| `GHL_WEBHOOK_TICKET_COMPLETED` | `(Ticket Completato) Invio notifica cliente` |
| `GHL_WEBHOOK_TICKET_RE_OPENED_SEND_CLIENT_MSG` | `(Ticket riaperto - Non Completato) Invio notifica cliente` |
| `GHL_WEBHOOK_TICKET_RE_OPENED_SEND_ADMIN_MSG` | `(Ticket riaperto - Non Completato) Invio notifica Admin` |
| `GHL_WEBHOOK_PASSWORD_FORGOT` | `(Recupero password Cliente) Invio notifica cliente` |
| `GHL_WEBHOOK_PASSWORD_RESET` | `(Nuovo cliente creato) Creazione account` |

---

## Pending work

1. **Asana setup** — workspace + project + custom fields + tech-user PAT + 11 env vars (see `lib/asana/asanaService.ts:62-86` for required env vars)
2. **First admin user** — manual: Firebase Console → Auth → add user; Firestore → `users/{uid}` doc with `role: 'ADMIN'`
3. **Asana webhook registration** — POST to `https://app.asana.com/api/1.0/webhooks` with `target=https://support.bibotcrm.it/api/webhooks/asana` and `resource=<workspace_gid>`
4. **Branding rebrand** — page title still says `Blanco Studio` (`pages/_document.tsx`). Code-level change.
5. **Rotate exposed credentials** — Firebase service-account JSON, OpenAI key, GHL Private Integration token (all passed through Claude conversation transcripts)

---

## Quirks & footguns

- **`OPEN_AI_API_KEY`** has a typo (underscore between OPEN and AI). Don't fix it without also editing `lib/openaiWhisper.ts:6`.
- **Wildcard DNS CNAME** at `*.bibotcrm.it` → don't delete; many GHL subdomains depend on it.
- **Zero-width space** prefix on client-posted Asana comments (`​`) — fragile but load-bearing for distinguishing client vs admin replies in the webhook.
- **No webhook signature verification** — Asana webhook trusts any caller after the initial handshake. If Bibot needs stricter security, add HMAC validation.
- **Firebase private key in env vars** — must use literal `\n` characters in Vercel UI (not real newlines). Code converts at runtime (`config/firebase-admin.ts:24`).
- **`reactStrictMode: false`** in `next.config.js` — likely workaround for some bug in the original codebase.
- **Vercel Blob is transient** — files are deleted right after being forwarded to Asana. Don't rely on Blob for permanent storage.
- **No rate limiting** on any API route. If Bibot's load grows, this is a gap.
- **Firestore writes are admin-only** — the security rules deny all client writes. All mutations go through API routes.
- **Asana custom-field GIDs are workspace-scoped** — env var values won't work across different Asana workspaces.

---

## Where to look for things

- **Conversation transcripts** with deployment context: `/Users/dan/.claude/projects/-Users-dan-Desktop-blanco-studio-admin-cockpit/`
- **Local secrets**: `.env.local` (gitignored)
- **Production secrets**: `vercel env ls` (output is encrypted in CLI; use `vercel env pull /tmp/x` to inspect values, then delete)
- **Firebase data**: Firebase Console → Firestore Database
- **GHL data**: GHL UI → Bibot subaccount → Contacts / Workflows
- **Asana tasks**: Asana UI (once workspace exists)
- **Original setup docs** in repo: `APP_SETUP.md`, `FIREBASE_SETUP.md`, `README.md`
