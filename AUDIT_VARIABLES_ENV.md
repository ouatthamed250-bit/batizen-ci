# Audit Variables d'Environnement — BÂTIZEN CI

**Date :** 8 janvier 2026
**Périmètre :** `.env.local`, `.env.local.example`, `src/`, `scripts/`, `firebase.json`, `next.config.ts`, `vercel.json`, `public/`
**Méthode :** Analyse statique des fichiers de configuration et recherche exhaustive de `process.env.*`, de valeurs en dur et de conflits de placement client/serveur.

---

## 1. Variables définies

| Variable | Fichier | Type | Statut |
|----------|---------|------|--------|
| NEXT_PUBLIC_FIREBASE_API_KEY | .env.local | Client | ✅ Valeur masquée |
| NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN | .env.local | Client | ✅ Valeur masquée |
| NEXT_PUBLIC_FIREBASE_DATABASE_URL | .env.local | Client | ✅ Valeur masquée |
| NEXT_PUBLIC_FIREBASE_PROJECT_ID | .env.local | Client | ✅ Valeur masquée |
| NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET | .env.local | Client | ✅ Valeur masquée |
| NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID | .env.local | Client | ✅ Valeur masquée |
| NEXT_PUBLIC_FIREBASE_APP_ID | .env.local | Client | ✅ Valeur masquée |
| NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID | .env.local | Client | ✅ Valeur masquée — ⚠️ **INUTILISÉE** |
| NEXT_PUBLIC_FIREBASE_VAPID_KEY | .env.local | Client | ✅ Valeur masquée — ⚠️ **INUTILISÉE** |
| GEMINI_API_KEY | .env.local | Serveur | ✅ Valeur masquée |
| CRON_SECRET | .env.local | Serveur | ✅ Valeur masquée |
| GOOGLE_APPLICATION_CREDENTIALS | .env.local | Serveur | ✅ Valeur masquée (chemin) |
| MAKE_ME_ADMIN_SECRET | .env.local | Serveur | ✅ Valeur masquée |
| FIREBASE_SERVICE_ACCOUNT_KEY | .env.local.example | Serveur | ✅ Exemple uniquement |
| FIREBASE_DATABASE_URL | .env.local.example | Serveur | ✅ Exemple uniquement |
| ADMIN_SECRET_PASSWORD | .env.local.example | Serveur | ⚠️ Nom incohérent avec le code (`MAKE_ME_ADMIN_SECRET`) |

> **Note :** Aucun fichier `.env` séparé n'existe. `.env.local` est la seule source de configuration. `firebase.json` ne contient que les règles de base de données (aucune donnée sensible).

---

## 2. Variables utilisées dans le code

| Variable | Fichier(s) | Usage |
|----------|------------|-------|
| NEXT_PUBLIC_FIREBASE_API_KEY | src/lib/firebase.ts, src/services/google.ts | Client — config Firebase + statut Google |
| NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN | src/lib/firebase.ts | Client — config Firebase |
| NEXT_PUBLIC_FIREBASE_DATABASE_URL | src/lib/firebase.ts, src/lib/firebase-admin.ts, src/services/google.ts, scripts/set-admin-role.js | Client + Serveur — config Firebase |
| NEXT_PUBLIC_FIREBASE_PROJECT_ID | src/lib/firebase.ts | Client — config Firebase |
| NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET | src/lib/firebase.ts, src/services/google.ts | Client — config Firebase |
| NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID | src/lib/firebase.ts | Client — config Firebase |
| NEXT_PUBLIC_FIREBASE_APP_ID | src/lib/firebase.ts | Client — config Firebase |
| NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET | src/lib/cloudinary.ts | Client — upload Cloudinary |
| NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME | src/lib/cloudinary.ts | Client — upload Cloudinary |
| NEXT_PUBLIC_GOOGLE_CLIENT_ID | src/services/google.ts | Client — statut connexion Google |
| GEMINI_API_KEY | src/app/api/chat/route.ts | Serveur — IA Gemini |
| CRON_SECRET | src/lib/cron-auth.ts | Serveur — sécurisation routes CRON |
| MAKE_ME_ADMIN_SECRET | src/app/api/auth/make-admin/route.ts | Serveur — vérification accès admin |
| FIREBASE_ADMIN_PROJECT_ID | src/lib/firebase-admin.ts | Serveur — service account |
| FIREBASE_ADMIN_PRIVATE_KEY | src/lib/firebase-admin.ts | Serveur — service account |
| FIREBASE_ADMIN_CLIENT_EMAIL | src/lib/firebase-admin.ts | Serveur — service account |
| FIREBASE_SERVICE_ACCOUNT_KEY | src/lib/firebase-admin.ts, scripts/set-admin-role.js | Serveur — fallback service account (JSON stringifié) |
| FIREBASE_DATABASE_URL | src/lib/firebase-admin.ts, scripts/set-admin-role.js | Serveur — URL base de données |
| GOOGLE_APPLICATION_CREDENTIALS | scripts/set-admin-role.js | Serveur — chemin fichier service account |
| NODE_ENV | src/app/api/auth/logout/route.ts, src/utils/logger.ts | Standard — mode environnement |

---

## 3. Anomalies trouvées

| Variable | Problème | Sévérité | Action recommandée |
|----------|----------|----------|-------------------|
| `MAKE_ME_ADMIN_SECRET` | **Conflit avec un secret en dur** : `AdminSecretModal.tsx` utilise `ADMIN_SECRET_CODE = "batizen2022"` codé en dur côté client au lieu d'utiliser `MAKE_ME_ADMIN_SECRET` (via la route API). La valeur du `.env.local` (`Warie6262#`) n'est jamais utilisée par ce composant. | 🔴 **CRITIQUE** | Modifier `AdminSecretModal.tsx` pour appeler `POST /api/auth/make-admin` avec le mot de passe saisi, au lieu de le comparer localement. Supprimer la constante en dur. |
| `FIREBASE_ADMIN_PROJECT_ID` | Utilisée dans le code mais **non définie** dans `.env.local` | 🔴 **CRITIQUE** | Définir la variable dans `.env.local` (et sur Vercel) |
| `FIREBASE_ADMIN_PRIVATE_KEY` | Utilisée dans le code mais **non définie** dans `.env.local` | 🔴 **CRITIQUE** | Définir la variable dans `.env.local` (et sur Vercel) |
| `FIREBASE_ADMIN_CLIENT_EMAIL` | Utilisée dans le code mais **non définie** dans `.env.local` | 🔴 **CRITIQUE** | Définir la variable dans `.env.local` (et sur Vercel) |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | Utilisée (fallback) dans le code mais **non définie** dans `.env.local` | 🟠 **HAUTE** | La ou définir dans `.env.local` (JSON stringifié) — nécessaire en production Vercel |
| `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` | Utilisée dans le code mais **non définie** dans `.env.local` | 🟠 **HAUTE** | Définir la variable dans `.env.local`. Sans elle, `uploadToCloudinary()` lance une erreur. |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Utilisée dans le code mais **non définie** dans `.env.local` | 🟠 **HAUTE** | Définir la variable dans `.env.local`. Sans elle, `uploadToCloudinary()` lance une erreur. |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Utilisée dans le code (statut Google Auth) mais **non définie** dans `.env.local` | 🟡 **MOYENNE** | Définir la variable dans `.env.local` ou supprimer la condition dans `src/services/google.ts` |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | **Définie mais non utilisée** dans le code | 🟡 **BASSE** | Supprimer la variable de `.env.local` ou l'utiliser (Analytics Firebase) |
| `NEXT_PUBLIC_FIREBASE_VAPID_KEY` | **Définie mais non utilisée** dans le code (pas de Firebase Messaging implémenté) | 🟡 **BASSE** | Conserver pour une future intégration push, ou supprimer |
| `GOOGLE_APPLICATION_CREDENTIALS` | **Définie** mais utilisée uniquement dans `scripts/set-admin-role.js`, pas dans le code applicatif. `src/lib/firebase-admin.ts` n'utilise que les variables `FIREBASE_ADMIN_*` ou `FIREBASE_SERVICE_ACCOUNT_KEY`. | 🟡 **MOYENNE** | Éviter la confusion : soit documenter que c'est pour le script seulement, soit faire lire ce fichier à `firebase-admin.ts` en dev |
| `ADMIN_SECRET_PASSWORD` (.env.local.example) | Nom incohérent avec le code qui utilise `MAKE_ME_ADMIN_SECRET` | 🟡 **BASSE** | Renommer dans `.env.local.example` pour être aligné |

---

## 4. Variables manquantes

| Variable | Où elle devrait être définie | Pourquoi |
|----------|------------------------------|----------|
| FIREBASE_ADMIN_PROJECT_ID | .env.local + Vercel | Requis par `src/lib/firebase-admin.ts` (priorité 1 de l'init Admin) |
| FIREBASE_ADMIN_PRIVATE_KEY | .env.local + Vercel | Requis par `src/lib/firebase-admin.ts` (clé privée du service account) |
| FIREBASE_ADMIN_CLIENT_EMAIL | .env.local + Vercel | Requis par `src/lib/firebase-admin.ts` (email du service account) |
| FIREBASE_SERVICE_ACCOUNT_KEY | .env.local + Vercel | Fallback JSON stringifié dans `src/lib/firebase-admin.ts` et requis par `scripts/set-admin-role.js` |
| FIREBASE_DATABASE_URL | .env.local + Vercel | Utilisé par `src/lib/firebase-admin.ts` (fallback sur `NEXT_PUBLIC_FIREBASE_DATABASE_URL` actuellement) |
| NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET | .env.local | Requis par `src/lib/cloudinary.ts` (upload d'images) |
| NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME | .env.local | Requis par `src/lib/cloudinary.ts` (upload d'images) |
| NEXT_PUBLIC_GOOGLE_CLIENT_ID | .env.local | Requis pour le statut "Connexion Google" dans `src/services/google.ts` |

---

## 5. Variables en dur dans le code (⚠️ SÉCURITÉ)

| Fichier | Valeur trouvée | Risque |
|---------|----------------|--------|
| `src/components/auth/AdminSecretModal.tsx:9` | `ADMIN_SECRET_CODE = "batizen2022"` | 🔴 **CRITIQUE** — Secret d'accès admin codé en dur dans le bundle côté client. Visible par n'importe qui via les DevTools. De plus, ce composant écrit directement `role = "admin"` dans la Realtime Database, ce qui contourne le flux de sécurité serveur (`MAKE_ME_ADMIN_SECRET`). |

**Autres vérifications OK :**
- ✅ Aucune clé API Firebase (`AIzaSy...`) écrite en dur dans `src/`
- ✅ Aucune URL Cloudinary (`cloudinary://`) ni preset en dur
- ✅ Aucune clé `sk-...` (OpenAI/Gemini) en dur
- ✅ Aucune clé privée (`-----BEGIN PRIVATE KEY-----`) en dur
- ✅ `next.config.ts` : aucune variable exposée via `env: {}`
- ✅ `serverExternalPackages` gère bien `firebase-admin`, `jose`, `jwks-rsa`
- ✅ `.gitignore` : `.env.local` et `.secrets/*` correctement ignorés
- ✅ `.secrets/firebase-service-account.json` est dans `.secrets/` (ignoré par git)

---

## 6. Recommandations prioritaires

1. **🔴 URGENT — `AdminSecretModal.tsx`** : remplacer le code secret en dur `batizen2022` par un appel à `POST /api/auth/make-admin` en envoyant le mot de passe saisi. Le serveur comparera avec `MAKE_ME_ADMIN_SECRET` et définira le rôle via Firebase Admin.
2. **🔴 URGENT — Firebase Admin** : définir `FIREBASE_ADMIN_PROJECT_ID`, `FIREBASE_ADMIN_PRIVATE_KEY`, `FIREBASE_ADMIN_CLIENT_EMAIL` (ou `FIREBASE_SERVICE_ACCOUNT_KEY`) dans `.env.local` et dans les variables d'environnement Vercel.
3. **🟠 HAUTE — Cloudinary** : définir `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` et `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` sinon les uploads échouent.
4. **🟡 MOYENNE** : documenter ou unifier l'usage de `GOOGLE_APPLICATION_CREDENTIALS` (script uniquement).
5. **🟡 BASSE** : supprimer `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` (inutilisée) ou l'utiliser pour Analytics.