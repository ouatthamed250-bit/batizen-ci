# Diagnostic des Accès Administrateur — BÂTIZEN CI

**Date :** 24/07/2026  
**Projet :** batizen-ci (Next.js 16.2.6, Firebase, Vercel)

---

## 1. FICHIERS D'ACCÈS ADMIN

### 1.1 `src/app/make-me-admin/page.tsx`
**Statut : ❌ FICHIER INTROUVABLE**

Le fichier `src/app/make-me-admin/page.tsx` n'existe pas dans le projet. Aucune route `/make-me-admin` n'est exposée.

---

### 1.2 `src/components/auth/AdminSecretModal.tsx`
**Type :** Client Component (`"use client"`)

**Imports (lignes 1-13) :**
```tsx
import { useState } from "react";
import { X, Lock } from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";
import { getFirebaseServices } from "@/lib/firebase";
```

**Fonctionnement :**
- Props : `isOpen: boolean`, `onClose: () => void`
- Vérifie que l'utilisateur est connecté (`useAuthContext`)
- Récupère l'idToken Firebase via `auth.currentUser.getIdToken()`
- Appelle `POST /api/auth/session` avec `{ idToken, password }`
- Si succès → redirection vers `/admin/dashboard`
- Si échec → affiche l'erreur dans le modal

---

### 1.3 `src/middleware.ts` (complet)
**Type :** Middleware Next.js (fichier déprécié au profit de "proxy")

```ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (path.startsWith('/admin')) {
    const sessionCookie = request.cookies.get('__session')?.value;
    if (!sessionCookie) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('redirect', 'admin');
      const response = NextResponse.redirect(url);
      response.cookies.set('__session', '', { path: '/', maxAge: 0 });
      return response;
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
```

**Analyse :**
- ✅ N'importe PAS `firebase-admin` (pas de conflit ESM)
- ✅ Vérifie uniquement la présence du cookie `__session`
- ❌ Pas de `runtime: 'nodejs'` (non nécessaire car n'utilise pas firebase-admin)
- ✅ Passe la main au Server Component `admin/layout.tsx` pour la vraie vérification

---

### 1.4 `src/hooks/useAuth.ts` (complet)
**Type :** Client Component Hook (`"use client"`)

```ts
import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { ref, get } from 'firebase/database';
import { getFirebaseServices } from '@/lib/firebase';
import { logger } from '@/utils/logger';
```

**Fonctionnement :**
- Hook React qui écoute `onAuthStateChanged` Firebase Auth côté client
- Vérifie le rôle admin via **2 sources** :
  1. **Custom claim** (`getIdTokenResult().claims.role === 'admin'`) — prioritaire
  2. **Fallback DB** (`users/{uid}/role` dans Realtime Database) — si pas de custom claim
- Retourne `{ user, loading, isAdmin }`

---

## 2. ROUTES API AUTH

### 2.1 `src/app/api/auth/session/route.ts`
| Propriété | Valeur |
|-----------|--------|
| HTTP | `POST` |
| Runtime | ✅ `export const runtime = 'nodejs'` |
| Try/catch global | ✅ Oui |
| Parsing JSON safe | ✅ Oui (bloc try/catch) |
| Handler GET non supporté | ✅ Retourne 405 |

---

### 2.2 `src/app/api/auth/me/route.ts`
| Propriété | Valeur |
|-----------|--------|
| HTTP | `GET` |
| Runtime | ✅ `export const runtime = 'nodejs'` |
| Try/catch global | ✅ Oui |
| Cookie nettoyé si invalide | ✅ Oui |
| Handler POST non supporté | ✅ Retourne 405 |

---

### 2.3 `src/app/api/auth/login/route.ts`
**Statut : ❌ FICHIER INTROUVABLE**

Pas de route API pour le login. La connexion se fait côté client via Firebase Auth SDK directement (dans `useAuthContext` / `AuthContext.tsx`).

---

### 2.4 `src/app/api/auth/logout/route.ts`
| Propriété | Valeur |
|-----------|--------|
| HTTP | `POST` |
| Runtime | ✅ `export const runtime = 'nodejs'` |
| Try/catch global | ✅ **Ajouté lors de la correction** |
| Révocation tokens | ✅ Oui (`revokeRefreshTokens`) |
| Nettoyage cookie | ✅ Oui |

---

### 2.5 `src/app/api/auth/register/route.ts`
| Propriété | Valeur |
|-----------|--------|
| HTTP | `POST` |
| Runtime | ✅ `export const runtime = 'nodejs'` |
| Try/catch global | ✅ Oui |
| Parsing JSON safe | ✅ Oui (bloc try/catch) |
| Handler GET non supporté | ✅ Retourne 405 |

---

## 3. FIREBASE CONFIG

### 3.1 `src/lib/firebase.ts` (20 premières lignes)
```ts
import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";
import { getDatabase, type Database } from "firebase/database";
import { getStorage, type FirebaseStorage } from "firebase/storage";
// ➡️ Initialisation centralisée avec getFirebaseServices()
// ➡️ Utilise NEXT_PUBLIC_FIREBASE_* pour le SDK client
```

### 3.2 `src/lib/firebase-admin.ts` (20 premières lignes)
```ts
import { initializeApp, getApps, cert, applicationDefault, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getDatabase } from 'firebase-admin/database';
// ➡️ Utilise FIREBASE_SERVICE_ACCOUNT_KEY (variable d'environnement privée)
// ➡️ Fallback GOOGLE_APPLICATION_CREDENTIALS
// ➡️ Exporte : firebaseAdmin, adminAuth, adminDb, verifySessionCookie()
```

---

## 4. RÈGLES FIREBASE (`database.rules.json`)

```json
{
  "rules": {
    ".read": false,
    ".write": false,
    "users": {
      "$uid": {
        ".read": "auth != null && (auth.uid === $uid || auth.token.role === 'admin')",
        ".write": "auth != null && (auth.uid === $uid || auth.token.role === 'admin')",
        "role": {
          ".write": "auth != null && auth.token.role === 'admin'",
          ".validate": "auth.token.role === 'admin' || (data.exists() && newData.val() === data.val())"
        }
      }
    },
    "chantiers": { /* ... règles par chantier avec userId/client_id */ },
    "rendezvous": { /* ... */ },
    "notifications": { /* admin + $uid */ },
    "rapports": { /* admin + propriétaire chantier */ },
    "paiements": { /* admin + propriétaire chantier */ },
    "messages": { /* admin + propriétaire chantier */ }
  }
}
```

**Analyse :**
- ✅ `role` des utilisateurs est protégé (écriture admin seulement)
- ✅ Toutes les collections sont verrouillées par `auth != null`
- ✅ Les clients ne voient que leurs propres données
- ✅ Les admins ont accès à toutes les données via `auth.token.role === 'admin'`
- ✅ `.indexOn` défini sur les champs clés (users/role, chantiers/userId, etc.)

---

## 5. PAGE D'ACCUEIL

### `src/app/page.tsx` (fichier complet, 70 lignes)

**Type :** Client Component (`"use client"`)

**Imports :**
```tsx
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { PageBackground } from "@/components/layout/PageBackground";
import { useAuthContext } from "@/contexts/AuthContext";
```

**Fonctionnement :**
- Splash screen statique avec logo animé
- Après 2.5s :
  - Si authentifié → redirige vers `/dashboard`
  - Si non authentifié → redirige vers `/login`
- Aucune météo, aucun bouton, aucun partenaire — c'est juste un splash

---

## 6. TEST DE BUILD

Le dernier build (`npm run build`) a réussi avec :
```
✓ Compiled successfully in 48s
✓ Finished TypeScript in 52s ...
✓ Generating static pages using 3 workers (42/42) in 5.3s
```

**Routes générées (42) :**
- `/` (statique)
- `/dashboard` (statique)
- `/login`, `/register` (statiques)
- `/admin/*` (7 routes dynamiques)
- `/api/auth/*` (4 routes dynamiques)
- 26 autres pages statiques

**✅ Aucune erreur.**

---

## 7. VARIABLES D'ENVIRONNEMENT

### Définies dans `.env.local` :
| Variable | Type | Usage |
|----------|------|-------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Public | SDK client Firebase |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Public | SDK client Firebase |
| `NEXT_PUBLIC_FIREBASE_DATABASE_URL` | Public | SDK client Firebase |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Public | SDK client Firebase |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Public | SDK client Firebase |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Public | SDK client Firebase |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Public | SDK client Firebase |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | Public | SDK client Firebase |
| `GEMINI_API_KEY` | Privée | API Chat Gemini |
| `CRON_SECRET` | Privée | Routes CRON sécurisées |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | Privée | **Firebase Admin SDK** (contient la clé privée complète en JSON) |

### Manquantes (vérifier si nécessaire) :
| Variable | Statut | Recommandation |
|----------|--------|---------------|
| `ADMIN_SECRET_PASSWORD` | ❌ Non définie dans `.env.local` | **NÉCESSAIRE** pour la route `POST /api/auth/session` (sinon erreur 500) |
| `FIREBASE_DATABASE_URL` | ❌ Non définie (fallback via `NEXT_PUBLIC_*` OK) | Optionnelle |
| `GOOGLE_APPLICATION_CREDENTIALS` | ❌ Non définie | Optionnelle (si `FIREBASE_SERVICE_ACCOUNT_KEY` est présente) |

---

## RÉSUMÉ DES PROBLÈMES IDENTIFIÉS

| # | Problème | Fichier | Severité | Correction |
|---|----------|---------|----------|------------|
| 1 | `ADMIN_SECRET_PASSWORD` manquant dans `.env.local` | — | 🔴 Bloquant | Ajouter `ADMIN_SECRET_PASSWORD=xxx` dans `.env.local` ET dans les variables d'environnement Vercel |
| 2 | Route `/make-me-admin` inexistante | — | 🟡 Info | Aucun effet, les admins sont créés via `scripts/set-admin-role.js` |
| 3 | Middleware déprécié | `src/middleware.ts` | 🟡 Warning | Next.js 16 recommande "proxy" à la place (non bloquant) |
| 4 | Aucune route API login | — | 🟢 OK | Le login est géré côté client via Firebase Auth SDK |

## ARCHITECTURE DE SÉCURITÉ ADMIN (résumé)

```
                    ┌──────────────────────────┐
                    │   Navigateur Client       │
                    │                           │
                    │  AdminSecretModal.tsx     │
                    │   → 5 taps sur logo       │
                    │   → POST /api/auth/session│
                    │   → recoit cookie __session│
                    └────────┬─────────────────┘
                             │ cookie HttpOnly
                             ▼
┌──────────────────────────────────────────────┐
│           Middleware (edge)                   │
│   Vérifie PRÉSENCE du cookie __session        │
│   Pas d'appel à firebase-admin ici            │
└──────────────────┬───────────────────────────┘
                   │ cookie présent
                   ▼
┌──────────────────────────────────────────────┐
│  admin/layout.tsx (Server Component, Node.js) │
│   Vérifie VALIDITÉ du cookie via              │
│   verifySessionCookie()                       │
│   → custom claim role === 'admin'             │
│   → fallback DB users/{uid}/role              │
└──────────────────┬───────────────────────────┘
                   │ admin validé
                   ▼
┌──────────────────────────────────────────────┐
│  AdminLayoutClient.tsx (Client Component)     │
│   Sidebar + navigation admin                 │
└──────────────────────────────────────────────┘
```

**⚠️ Rappel :** Le bug `ERR_REQUIRE_ESM` (firebase-admin + jose) ne se produit qu'en environnement serverless Vercel. Vérifier après déploiement que les routes `/admin/*` fonctionnent.