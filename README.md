# Enterprise Dashboard - Multi-Role System

Dashboard modulare multi-ruolo per gestione CLIENT e ADMIN con integrazione Firebase e GoHighLevel.

## 🏗️ Architettura

### Principi Architetturali

**1. Modularità**
- Ogni funzionalità è un modulo indipendente in `/modules`
- Moduli self-contained: types, services, hooks, components, pages
- Facilita team scaling: ogni team può lavorare su un modulo diverso

**2. Separazione delle Responsabilità**
- `/modules`: Logica di business specifica per feature
- `/components`: UI components condivisi
- `/layouts`: Template layout riutilizzabili
- `/pages`: Solo routing Next.js (thin wrapper)
- `/services`: Servizi condivisi (auth, API client, etc.)

**3. Scalabilità**
- Aggiungere nuovi moduli: creare cartella in `/modules` + route in `/pages/dashboard`
- Pattern consistente tra moduli
- Hook personalizzati per logica riutilizzabile

### Struttura Cartelle

```
/
├── modules/                    # Moduli business (feature-based)
│   ├── ticketing/
│   │   ├── components/        # UI components specifici
│   │   ├── hooks/             # Custom hooks
│   │   ├── pages/             # Pagine modulo (no routing)
│   │   ├── services/          # API/business logic
│   │   └── types/             # TypeScript types
│   ├── users/
│   └── settings/
│
├── pages/                      # Next.js routing
│   ├── dashboard/
│   │   ├── ticketing.tsx     # Route wrapper
│   │   ├── users.tsx
│   │   └── settings.tsx
│   ├── _app.tsx
│   └── index.tsx
│
├── layouts/                    # Layout templates
│   └── DashboardLayout.tsx
│
├── components/                 # Shared UI components
│   └── Sidebar.tsx
│
├── services/                   # Shared services
│   └── (auth, api client, etc.)
│
└── styles/
    └── theme.ts               # Chakra UI theme
```

## 🚀 Setup

### Installazione

```bash
npm install
```

### Sviluppo

```bash
npm run dev
```

Apri [http://localhost:3000](http://localhost:3000)

### Build Produzione

```bash
npm run build
npm start
```

## 📦 Moduli Disponibili

### Ticketing System
- Path: `/dashboard/ticketing`
- Features: Visualizzazione ticket, status, priorità
- Architecture example: service layer + custom hooks + UI components

### Users Management
- Path: `/dashboard/users`
- Status: Placeholder (pronto per implementazione)

### Settings
- Path: `/dashboard/settings`
- Status: Placeholder (pronto per implementazione)

## 🔧 Come Aggiungere un Nuovo Modulo

1. **Creare struttura modulo**
```
/modules/nome-modulo/
├── components/
├── hooks/
├── pages/
│   └── index.tsx
├── services/
└── types/
    └── index.ts
```

2. **Creare route**
```typescript
// pages/dashboard/nome-modulo.tsx
import { DashboardLayout } from '@/layouts/DashboardLayout';
import NomeModuloPage from '@/modules/nome-modulo/pages';

export default function DashboardNomeModulo() {
  return (
    <DashboardLayout>
      <NomeModuloPage />
    </DashboardLayout>
  );
}
```

3. **Aggiungere alla sidebar**
```typescript
// components/Sidebar.tsx
const menuItems = [
  // ... altri items
  {
    label: 'Nome Modulo',
    icon: <FiIcon />,
    path: '/dashboard/nome-modulo',
  },
];
```

## 🎨 Design System

- **UI Framework**: Chakra UI
- **Font**: Inter
- **Color Scheme**: Brand blue + semantic colors
- **Responsive**: Mobile-first approach
- **Components**: Riutilizzabili e tematizzati

## 📱 Responsive

- **Mobile**: Sidebar collassabile (drawer)
- **Tablet**: Ottimizzato per touch
- **Desktop**: Sidebar fissa, layout espanso

## 🔐 Best Practices

1. **Types First**: Definire TypeScript types prima di implementare
2. **Hook Pattern**: Logica in hooks, componenti solo UI
3. **Service Layer**: API calls separati dai componenti
4. **Consistent Naming**: Convenzioni chiare per file e cartelle
5. **Comments**: Spiegare decisioni architetturali

## 🛠️ Tech Stack

- **Framework**: Next.js 14
- **Language**: TypeScript
- **UI**: Chakra UI
- **Icons**: React Icons
- **Styling**: Emotion (via Chakra)

## 📈 Performance

- Server-Side Rendering (SSR)
- Automatic code splitting per route
- Optimized bundle size
- Lazy loading per moduli

## 🔄 Future Enhancements

- Autenticazione/Autorizzazione
- State management globale (se necessario)
- API integration layer
- Testing (Jest, React Testing Library)
- Storybook per component library
- i18n (internazionalizzazione)
