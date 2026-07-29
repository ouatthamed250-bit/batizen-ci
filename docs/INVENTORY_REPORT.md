# 📋 RAPPORT D'INVENTAIRE COMPLET — BÂTIZEN CI

**Date :** 23 juillet 2026  
**Projet :** Next.js Bâtizen CI  
**Portée :** Structure des dossiers, fichiers, configurations critiques

---

## 1. STRUCTURE DES DOSSIERS

### 📁 `app/(auth)/` → LOGIN, REGISTER, FORGOT-PASSWORD

| Fichier | Statut | Emplacement | Note |
|---------|--------|-------------|------|
| `login/page.tsx` | ✅ Présent | `src/app/(auth)/login/page.tsx` | ✅ Correct |
| `register/page.tsx` | ✅ Présent | `src/app/(auth)/register/page.tsx` | ✅ Correct |
| `forgot-password/page.tsx` | ❌ **MANQUANT** | — | Route `/forgot-password` non créée |

### 📁 `app/(dashboard)/` → DASHBOARD

| Fichier | Statut | Emplacement | Note |
|---------|--------|-------------|------|
| `page.tsx` | ❌ **MANQUANT** | — | Route `/dashboard` **n'existe pas** comme page autonome côté client |
| `chantiers/` | ❌ **MANQUANT** | — | Pas de dossier `chantiers/` dans `(dashboard)` |
| `clients/` | ❌ **MANQUANT** | — | Idem |
| `documents/` | ❌ **MANQUANT** | — | Idem |
| `messages/` | ❌ **MANQUANT** | — | Idem |
| `rapports/` | ❌ **MANQUANT** | — | Idem |
| `rendezvous/` | ❌ **MANQUANT** | — | Idem |
| `paiements/` | ❌ **MANQUANT** | — | Idem |
| `profil/` | ❌ **MANQUANT** | — | Idem |
| `admin/` | ❌ **MANQUANT** | — | L'admin est géré via `app/admin/` (route distincte) |

### 📁 `app/admin/` → ROUTES ADMIN

| Fichier | Statut | Emplacement | Note |
|---------|--------|-------------|------|
| `page.tsx` | ✅ Présent | `src/app/admin/page.tsx` | ✅ |
| `dashboard/page.tsx` | ✅ Présent | `src/app/admin/dashboard/page.tsx` | ✅ |
| `layout.tsx` | ✅ Présent | `src/app/admin/layout.tsx` | ✅ |
| `chantier/[id]/page.tsx` | ✅ Présent | `src/app/admin/chantier/[id]/page.tsx` | ✅ |
| `chantier/[id]/DocumentsSection.tsx` | ✅ Présent | `src/app/admin/chantier/[id]/DocumentsSection.tsx` | ✅ |
| `chantier/[id]/PaiementsSection.tsx` | ✅ Présent | `src/app/admin/chantier/[id]/PaiementsSection.tsx` | ✅ |
| `clients/page.tsx` | ✅ Présent | `src/app/admin/clients/page.tsx` | ✅ |
| `messages/page.tsx` | ✅ Présent | `src/app/admin/messages/page.tsx` | ✅ |
| `calendar/page.tsx` | ✅ Présent | `src/app/admin/calendar/page.tsx` | ✅ |
| `parametres/page.tsx` | ✅ Présent | `src/app/admin/parametres/page.tsx` | ✅ |
| `rapports/` | ❌ **MANQUANT** | — | Pas de route `/admin/rapports` |
| `paiements/` | ❌ **MANQUANT** | — | Pas de route `/admin/paiements` |

### 📁 `app/api/` → ROUTES API

| Fichier | Statut | Emplacement | Note |
|---------|--------|-------------|------|
| `auth/logout/route.ts` | ✅ Présent | `src/app/api/auth/logout/route.ts` | ✅ |
| `auth/session/route.ts` | ✅ Présent | `src/app/api/auth/session/route.ts` | ✅ |
| `chat/route.ts` | ✅ Présent | `src/app/api/chat/route.ts` | ✅ |
| `auth/login/route.ts` | ❌ **MANQUANT** | — | Pas d'API login serveur |
| `auth/register/route.ts` | ❌ **MANQUANT** | — | Pas d'API register serveur |
| `cron/rappel-rdv/route.ts` | ✅ Présent | `src/app/api/cron/rappel-rdv/route.ts` | ✅ |
| `cron/cleanup-medias/route.ts` | ✅ Présent | `src/app/api/cron/cleanup-medias/route.ts` | ✅ |

### 📁 `components/ui/` → SHADCN / UI COMPONENTS

| Fichier | Statut | Emplacement | Note |
|---------|--------|-------------|------|
| `BackButton.tsx` | ✅ Présent | `src/components/ui/BackButton.tsx` | ✅ Correct |
| `Badge.tsx` | ✅ Présent | `src/components/ui/Badge.tsx` | ✅ Correct |
| `BreakingNewsTicker.tsx` | ✅ Présent | `src/components/ui/BreakingNewsTicker.tsx` | ✅ Correct |
| `FallbackBackground.tsx` | ✅ Présent | `src/components/ui/FallbackBackground.tsx` | ⚠️ Devrait être dans `components/background/` |
| `GenerateContractButton.tsx` | ✅ Présent | `src/components/ui/GenerateContractButton.tsx` | ✅ Correct |
| `GenerateReceiptButton.tsx` | ✅ Présent | `src/components/ui/GenerateReceiptButton.tsx` | ✅ Correct |
| `GoogleIcon.tsx` | ✅ Présent | `src/components/ui/GoogleIcon.tsx` | ✅ Correct |
| `InfoTicker.tsx` | ✅ Présent | `src/components/ui/InfoTicker.tsx` | ✅ Correct |
| `MateriauSelector.tsx` | ✅ Présent | `src/components/ui/MateriauSelector.tsx` | ✅ Correct |
| `NotificationBell.tsx` | ✅ Présent | `src/components/ui/NotificationBell.tsx` | ✅ Correct |
| `PlanPreview2D.tsx` | ✅ Présent | `src/components/ui/PlanPreview2D.tsx` | ✅ Correct |
| `PremiumButton.tsx` | ✅ Présent | `src/components/ui/PremiumButton.tsx` | ✅ Correct |
| `PremiumCard.tsx` | ✅ Présent | `src/components/ui/PremiumCard.tsx` | ✅ Correct |
| `PremiumInput.tsx` | ✅ Présent | `src/components/ui/PremiumInput.tsx` | ✅ Correct |
| `ProgressBar.tsx` | ✅ Présent | `src/components/ui/ProgressBar.tsx` | ✅ Correct |
| `SignaturePad.tsx` | ✅ Présent | `src/components/ui/SignaturePad.tsx` | ✅ Correct |
| `ThemeToggle.tsx` | ✅ Présent | `src/components/ui/ThemeToggle.tsx` | ⚠️ Devrait être dans `components/layout/` |

### 📁 `components/layout/` → LAYOUT COMPONENTS

| Fichier | Statut | Emplacement | Note |
|---------|--------|-------------|------|
| `AndroidBackHandler.tsx` | ✅ Présent | `src/components/layout/AndroidBackHandler.tsx` | ✅ Correct |
| `AuthScreen.tsx` | ✅ Présent | `src/components/layout/AuthScreen.tsx` | ✅ Correct |
| `BottomNav.tsx` | ✅ Présent | `src/components/layout/BottomNav.tsx` | ✅ Correct |
| `FeaturePage.tsx` | ✅ Présent | `src/components/layout/FeaturePage.tsx` | ✅ Correct |
| `LayoutWrapper.tsx` | ✅ Présent | `src/components/layout/LayoutWrapper.tsx` | ✅ Correct |
| `PageBackground.tsx` | ✅ Présent | `src/components/layout/PageBackground.tsx` | ⚠️ Devrait être dans `components/background/` |
| `PremiumBackground.tsx` | ✅ Présent | `src/components/layout/PremiumBackground.tsx` | ⚠️ Devrait être dans `components/background/` |
| `PremiumHeader.tsx` | ✅ Présent | `src/components/layout/PremiumHeader.tsx` | ✅ Correct |
| `ScreenWrapper.tsx` | ✅ Présent | `src/components/layout/ScreenWrapper.tsx` | ✅ Correct |
| `Sidebar.tsx` | ✅ Présent | `src/components/layout/Sidebar.tsx` | ✅ Correct |
| `WhatsAppButton.tsx` | ✅ Présent | `src/components/layout/WhatsAppButton.tsx` | ✅ Correct |

### 📁 `components/background/` → BACKGROUND COMPONENTS

| Fichier | Statut | Emplacement | Note |
|---------|--------|-------------|------|
| *Aucun fichier* | ❌ **DOSSIER MANQUANT** | — | Les 3 fichiers d'arrière-plan existent mais sont éparpillés ailleurs |

### 📁 `components/forms/` → FORM COMPONENTS

| Fichier | Statut | Emplacement | Note |
|---------|--------|-------------|------|
| *Aucun fichier* | ❌ **DOSSIER MANQUANT** | — | Pas de dossier `components/forms/` |
| `ChantierForm.tsx` | ❌ **MANQUANT** | — | |
| `ClientForm.tsx` | ❌ **MANQUANT** | — | |

### 📁 `components/dashboard/` → DASHBOARD COMPONENTS

| Fichier | Statut | Emplacement | Note |
|---------|--------|-------------|------|
| *Aucun fichier* | ❌ **DOSSIER MANQUANT** | — | |
| `StatsCards.tsx` | ❌ **MANQUANT** | — | |
| `RecentChantiers.tsx` | ❌ **MANQUANT** | — | |
| `ChartRevenue.tsx` | ❌ **MANQUANT** | — | |
| `AlertCard.tsx` | ❌ **MANQUANT** | — | |

### 📁 `hooks/` → CUSTOM HOOKS

| Fichier | Statut | Emplacement | Note |
|---------|--------|-------------|------|
| `useAndroidBackButton.ts` | ✅ Présent | `src/hooks/useAndroidBackButton.ts` | ✅ |
| `useCurrencyFormatter.ts` | ✅ Présent | `src/hooks/useCurrencyFormatter.ts` | ✅ |
| `useRenovationSubmit.ts` | ✅ Présent | `src/hooks/useRenovationSubmit.ts` | ✅ |
| `useTheme.ts` | ✅ Présent | `src/hooks/useTheme.ts` | ✅ |
| `useAuth.ts` | ❌ **MANQUANT** | — | Pas de hook `useAuth` dédié |
| `useChantiers.ts` | ❌ **MANQUANT** | — | |
| `useRealtime.ts` | ❌ **MANQUANT** | — | |
| `useNotifications.ts` | ❌ **MANQUANT** | — | |
| `useAdmin.ts` | ❌ **MANQUANT** | — | |

### 📁 `lib/` → LIBRARIES / UTILITIES

| Fichier | Statut | Emplacement | Note |
|---------|--------|-------------|------|
| `cloudinary.ts` | ✅ Présent | `src/lib/cloudinary.ts` | ✅ |
| `documents-templates.ts` | ✅ Présent | `src/lib/documents-templates.ts` | ✅ |
| `firebase-admin.ts` | ✅ Présent | `src/lib/firebase-admin.ts` | ✅ |
| `firebase.ts` | ✅ Présent | `src/lib/firebase.ts` | ✅ |
| `generateContractPDF.ts` | ✅ Présent | `src/lib/generateContractPDF.ts` | ✅ |
| `generateReceiptPDF.ts` | ✅ Présent | `src/lib/generateReceiptPDF.ts` | ✅ |
| `helpers.ts` | ✅ Présent | `src/lib/helpers.ts` | ✅ |
| `notifications.ts` | ✅ Présent | `src/lib/notifications.ts` | ✅ |
| `prix-btp.ts` | ✅ Présent | `src/lib/prix-btp.ts` | ✅ |
| `rtdb.ts` | ✅ Présent | `src/lib/rtdb.ts` | ✅ |
| `security.ts` | ✅ Présent | `src/lib/security.ts` | ✅ |
| `ui-constants.ts` | ✅ Présent | `src/lib/ui-constants.ts` | ✅ |
| `utils.ts` | ❌ **MANQUANT** | — | |
| `constants.ts` | ❌ **MANQUANT** | — | (Utiliser `src/constants/` à la place) |
| `validators.ts` | ❌ **MANQUANT** | — | (Utiliser `src/utils/validators.ts`) |
| `plans/storage.ts` | ✅ Présent | `src/lib/plans/storage.ts` | ✅ |

### 📁 `types/` → TYPE DEFINITIONS

| Fichier | Statut | Emplacement | Note |
|---------|--------|-------------|------|
| `chantier.ts` | ✅ Présent | `src/types/chantier.ts` | ✅ |
| `batizen.ts` | ✅ Présent | `src/types/batizen.ts` | ✅ |
| `plan.ts` | ✅ Présent | `src/types/plan.ts` | ✅ |
| `index.ts` | ❌ **MANQUANT** | — | |
| `user.ts` | ❌ **MANQUANT** | — | |
| `document.ts` | ❌ **MANQUANT** | — | |

### 📁 `services/` → SERVICE LAYER

| Fichier | Statut | Emplacement | Note |
|---------|--------|-------------|------|
| `batizen.ts` | ✅ Présent | `src/services/batizen.ts` | ✅ |
| `EstimationEngine.ts` | ✅ Présent | `src/services/EstimationEngine.ts` | ✅ |
| `google.ts` | ✅ Présent | `src/services/google.ts` | ✅ |
| `PlanEngine.ts` | ✅ Présent | `src/services/PlanEngine.ts` | ✅ |
| `RenovationEngine.ts` | ✅ Présent | `src/services/RenovationEngine.ts` | ✅ |
| `auth.service.ts` | ❌ **MANQUANT** | — | |
| `chantier.service.ts` | ❌ **MANQUANT** | — | |
| `client.service.ts` | ❌ **MANQUANT** | — | |
| `document.service.ts` | ❌ **MANQUANT** | — | |
| `notification.service.ts` | ❌ **MANQUANT** | — | |
| `storage.service.ts` | ❌ **MANQUANT** | — | |

### 📁 `context/` vs `contexts/` → CONTEXT PROVIDERS

| Fichier | Statut | Emplacement | Note |
|---------|--------|-------------|------|
| `AuthContext.tsx` | ✅ Présent | `src/contexts/AuthContext.tsx` | ⚠️ **Au mauvais endroit** : le dossier s'appelle `contexts/` au lieu de `context/` |
| `ThemeContext.tsx` | ✅ Présent | `src/contexts/ThemeContext.tsx` | ⚠️ **Idem** |
| `NotificationContext.tsx` | ❌ **MANQUANT** | — | |

### 📁 `store/` → STATE MANAGEMENT (ZUSTAND)

| Fichier | Statut | Emplacement | Note |
|---------|--------|-------------|------|
| *Aucun fichier* | ❌ **DOSSIER MANQUANT** | — | |
| `auth.store.ts` | ❌ **MANQUANT** | — | |
| `chantier.store.ts` | ❌ **MANQUANT** | — | |
| `ui.store.ts` | ❌ **MANQUANT** | — | |
| `simulationStore.ts` | ✅ Présent | `src/stores/simulationStore.ts` | ✅ (dans `stores/` au lieu de `store/`) |

### 📁 `public/images/` → IMAGES

| Fichier | Statut | Emplacement | Note |
|---------|--------|-------------|------|
| `batizen-robot.svg` | ✅ Présent | `public/images/batizen-robot.svg` | ✅ |
| `villa-bg.jpg` | ❌ **MANQUANT** | — | |
| `hero-bg.jpg` | ❌ **MANQUANT** | — | |
| `logo.svg` | ❌ **MANQUANT** | — | |
| `placeholder.svg` | ❌ **MANQUANT** | — | |

### 📁 `firebase/` → FIREBASE CONFIG

| Fichier | Statut | Emplacement | Note |
|---------|--------|-------------|------|
| `database.rules.json` | ⚠️ Déplacé | `database.rules.json` (racine) | ⚠️ Devrait être dans `firebase/database.rules.json` |
| `storage.rules` | ❌ **MANQUANT** | — | |
| `functions/index.ts` | ⚠️ Déplacé | `functions/src/index.ts` | ⚠️ Devrait être dans `firebase/functions/index.ts` |

### 📁 `__tests__/` → TESTS

| Fichier | Statut | Emplacement | Note |
|---------|--------|-------------|------|
| *Aucun fichier* | ❌ **DOSSIER MANQUANT** | — | Aucun test unitaire dans le projet |

---

## 2. RÉPONSES AUX QUESTIONS CRITIQUES

### 🔹 Q1 : Chemin EXACT du formulaire "Nouveau Chantier"

**Route :** `/nouveau-chantier`  
**Fichier :** `src/app/nouveau-chantier/page.tsx`
- Composant principale : `NouveauChantierContent`
- Formulaire en **8 étapes** (steps 1 à 8) avec des sous-composants `Step1` à `Step8` dans le même fichier
- Utilise Firebase Realtime Database directement (pas de service layer)
- Soumission vers `ref(database, \`chantiers/${chantierId}\`)`

### 🔹 Q2 : Chemin EXACT du composant qui affiche les chantiers dans le dashboard

**Deux vues différentes :**
1. **Dashboard Admin** : `src/app/admin/dashboard/page.tsx` → affiche TOUS les chantiers
2. **Projets Client (terminés)** : `src/app/(tabs)/projets/page.tsx` (route `/projets`) → affiche UNIQUEMENT les chantiers terminés de l'utilisateur connecté

**⚠️ Pas de dashboard client centralisé** (route `/dashboard` manquante)

### 🔹 Q3 : Où est défini le rôle admin ?

Le rôle admin est défini via **Firebase Custom Claims** : `{ role: 'admin' }`

Deux mécanismes :
1. **Script one-shot** : `scripts/set-admin-role.js` → exécution locale `node scripts/set-admin-role.js <uid>`
2. **Cloud Function** : `functions/src/index.ts` → fonction `setAdminRole()` (appelable depuis le frontend)

### 🔹 Q4 : Y a-t-il une Cloud Function pour setAdminRole ?

**✅ OUI** — Dans `functions/src/index.ts` :
- `exports.setAdminRole` (ligne 19) — Appelable uniquement par un admin existant
- `exports.bootstrapFirstAdmin` (ligne 76) — Pour créer le premier admin via un code secret

### 🔹 Q5 : Comment un client est-il lié à un admin ?

**Structure actuelle :**
- Chaque chantier a un champ `userId` (UID du client propriétaire)
- **Il n'y a PAS de champ `adminId`** pour lier un client à un admin spécifique
- Les admins voient **tous les chantiers** (accès total non filtré)
- Dans `AuthContext.tsx` (ligne 82-83) : lecture de `users/${firebaseUser.uid}` → stocke `role: "client"` à la création

**⚠️ Aucune notion d'affectation admin-client :** tout admin voit tous les chantiers et tous les clients.

### 🔹 Q6 : Le middleware protège-t-il les routes admin ?

**✅ OUI** — `src/middleware.ts` :
- Matcher : `/admin/:path*`
- Vérifie le cookie `__session` via `verifySessionCookie()` dans `src/lib/firebase-admin.ts`
- `verifySessionCookie` décode le cookie et vérifie `decodedClaims.role === 'admin'`
- Runtime Node.js (pas Edge) requis pour Firebase Admin SDK
- Redirige vers `/login?redirect=admin` si non admin

**Note :** Le middleware utilise `runtime: 'nodejs'` ce qui est **correct** car `firebase-admin` nécessite Node.js.

---

## 3. BUGS IDENTIFIÉS

### 🔴 BUG #1 — `firebase-admin.ts` : Fallback invalide (CRITIQUE) — ✅ **CORRIGÉ**

**Fichier :** `src/lib/firebase-admin.ts`

**Correction appliquée :** ✅
- Suppression du cast `as any` dangereux
- Utilisation de `applicationDefault()` (importé depuis `firebase-admin/app`) en fallback au lieu de `cert()` avec des données incomplètes
- Ajout d'une validation des champs requis (`private_key`, `client_email`, `project_id`)
- Erreur explicite si ni `FIREBASE_SERVICE_ACCOUNT_KEY` ni `GOOGLE_APPLICATION_CREDENTIALS` ne sont configurés
- Message d'erreur détaillé avec instructions pour générer une clé de service

**Statut :** 🔧 Corrigé le 23 juillet 2026

### 🔴 BUG #2 — Pas d'API login/register côté serveur — ✅ **CORRIGÉ**

**Routes créées :**
- ✅ `src/app/api/auth/login/route.ts` — POST, crée un session cookie HttpOnly depuis un idToken
- ✅ `src/app/api/auth/register/route.ts` — POST, crée un utilisateur via Admin SDK (support du rôle admin)
- ✅ `src/app/api/auth/me/route.ts` — GET, vérifie le cookie et retourne les infos utilisateur
- ✅ `src/app/api/auth/logout/route.ts` — POST (existait déjà, mis à jour sameSite: 'strict')

**Détails des corrections :**
- `login/route.ts` : durée du cookie paramétrable via `SESSION_EXPIRY_MS` (5 jours par défaut), vérification de l'idToken, création du cookie HttpOnly avec `sameSite: 'strict'`
- `register/route.ts` : validation des champs, création via `adminAuth.createUser()`, attribution du custom claim `{ role: 'admin' }` si demandé
- `me/route.ts` : lecture du cookie `__session`, vérification via `verifySessionCookie(checkRevoked: true)`, nettoyage du cookie invalide en 401
- `logout/route.ts` : `sameSite` passé de `'lax'` à `'strict'` pour cohérence

**Statut :** 🔧 Corrigé le 23 juillet 2026

### 🔴 BUG #3 — `database.rules.json` à la racine

**Fichier :** `database.rules.json` (racine du projet)

**Problème :** Firebase déploie les règles de base de données à partir d'un chemin spécifique dans `firebase.json`. Le fichier à la racine n'est pas utilisé par le déploiement Firebase.

### 🔴 BUG #4 — `public/images/` : Images manquantes

**Fichiers manquants :**
- `villa-bg.jpg`
- `hero-bg.jpg`
- `logo.svg`
- `placeholder.svg`

**Problème :** Si ces images sont référencées dans le code (globals.css, layouts), elles généreront des **erreurs 404** et des **images cassées**.

### 🔴 BUG #5 — Aucun système de tests

**Problème :** Zéro fichier de test — ni unitaires (Jest/Vitest), ni d'intégration, ni E2E. Le projet n'a pas de couverture de test.

### 🔴 BUG #6 — Contexte : dossier `contexts/` au lieu de `context/`

**Fichiers :** `src/contexts/AuthContext.tsx`, `src/contexts/ThemeContext.tsx`

**Problème :** Le dossier s'appelle `contexts/` (avec 's') alors que la structure attendue est `context/` (sans 's'). Cela n'est pas un bug bloquant si les imports sont cohérents, mais s'écarte de la convention.

### 🔴 BUG #7 — Pas de NotificationContext

**Fichier manquant :** `context/NotificationContext.tsx` ou `contexts/NotificationContext.tsx`

**Problème :** Les notifications Firebase sont gérées via `src/lib/notifications.ts` mais il n'y a pas de **contexte React** pour les notifications. Aucun provider n'écoute les changements en temps réel des notifications.

### 🔴 BUG #8 — Incohérence dans `firebase-admin.ts` — `cert()` vs `applicationDefault()` — ✅ **CORRIGÉ**

**Fichier :** `src/lib/firebase-admin.ts`

**Correction appliquée :** ✅
- Utilisation de `applicationDefault()` pour le cas `GOOGLE_APPLICATION_CREDENTIALS`
- Import propre de `applicationDefault` depuis `firebase-admin/app`
- Séparation claire en deux options distinctes avec validation

**Statut :** 🔧 Corrigé le 23 juillet 2026

---

## 4. FICHIERS MAL PLACÉS (À DÉPLACER)

| Fichier | Position actuelle | Position attendue | Impact |
|---------|-------------------|-------------------|--------|
| `database.rules.json` | Racine du projet | `firebase/database.rules.json` | Déploiement Firebase cassé |
| `ThemeToggle.tsx` | `components/ui/ThemeToggle.tsx` | `components/layout/ThemeToggle.tsx` | Imports à mettre à jour |
| `FallbackBackground.tsx` | `components/ui/FallbackBackground.tsx` | `components/background/FallbackBackground.tsx` | Imports à mettre à jour |
| `PageBackground.tsx` | `components/layout/PageBackground.tsx` | `components/background/PageBackground.tsx` | Imports à mettre à jour |
| `PremiumBackground.tsx` | `components/layout/PremiumBackground.tsx` | `components/background/PremiumBackground.tsx` | Imports à mettre à jour |

---

## 5. SYNTHÈSE

### ✅ Ce qui existe et est bien placé
- Toute la structure `app/admin/` (dashboard, clients, chantiers messages, calendrier, paramètres)
- Les composants `layout/` (Sidebar, BottomNav, LayoutWrapper, PremiumHeader, etc.)
- Les composants `ui/` (PremiumButton, PremiumCard, Badge, etc.)
- Firebase Client SDK (`lib/firebase.ts`)
- Middleware de protection des routes admin (`middleware.ts`)
- Cloud Functions (`functions/src/index.ts`)
- Script admin (`scripts/set-admin-role.js`)
- Types chantier (`types/chantier.ts`)
- Utilitaires (`utils/`, `constants/`, `theme/`)

### ⚠️ Ce qui existe mais est mal placé
- `database.rules.json` à la racine → devrait être dans `firebase/`
- `ThemeToggle.tsx` dans `ui/` → devrait être dans `layout/`
- `PremiumBackground`, `PageBackground`, `FallbackBackground` → devraient être dans `background/`
- `contexts/` → dénommé `contexts/` au lieu de `context/`

### ❌ Ce qui manque
- Route `/forgot-password`
- Route `/dashboard` (client)
- Dossier `components/forms/`
- Dossier `components/dashboard/`
- Dossier `components/background/`
- Dossier `store/` (Zustand stores)
- Dossier `services/` (services auth, chantier, client, document, notification, storage)
- Dossier `firebase/` (pour database.rules.json, storage.rules, functions)
- Dossier `__tests__/`
- Images : `villa-bg.jpg`, `hero-bg.jpg`, `logo.svg`, `placeholder.svg`
- Hooks : `useAuth`, `useChantiers`, `useRealtime`, `useNotifications`, `useAdmin`
- Types : `index.ts`, `user.ts`, `document.ts`
- API routes : `auth/login`, `auth/register`
- Fichiers lib : `utils.ts`, `constants.ts`, `validators.ts` (existent sous d'autres noms)
- `NotificationContext.tsx`

---

*Fin du rapport — Généré le 23 juillet 2026*