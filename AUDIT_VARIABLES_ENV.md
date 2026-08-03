# Audit Variables d'Environnement — BÂTIZEN CI

**Date :** 3 août 2026 (mise à jour après corrections)
**Périmètre :** `.env.local`, `.env.local.example`, `src/`, `scripts/`, `firebase.json`, `next.config.ts`, `vercel.json`, `public/`
**Méthode :** Analyse statique + vérification par `npx tsc --noEmit` ✅

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
| NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID | .env.local | Client | ⚠️ **Inutilisée** |
| NEXT_PUBLIC_FIREBASE_VAPID_KEY | .env.local | Client | ⚠️ **Inutilisée** |
| GEMINI_API_KEY | .env.local | Serveur | ✅ Valeur masquée |
| CRON_SECRET | .env.local | Serveur | ✅ Valeur masquée |
| GOOGLE_APPLICATION_CREDENTIALS | .env.local | Serveur | ✅ Valeur masquée (chemin) |
| MAKE_ME_ADMIN_SECRET | .env.local | Serveur | ✅ Valeur masquée |
| FIREBASE_SERVICE_ACCOUNT_KEY | .env.local.example | Serveur | ✅ Exemple uniquement |
| FIREBASE_DATABASE_URL | .env.local.example | Serveur | ✅ Exemple uniquement |
| ADMIN_SECRET_PASSWORD | .env.local.example | Serveur | ⚠️ Nom incohérent |

---

## 2. Variables utilisées / manquantes (état après corrections)

### ✅ Variables d'env non définies dans `.env.local` mais utilisées dans le code

| Variable | Fichier(s) | Recommandation |
|----------|-----------|----------------|
| FIREBASE_ADMIN_PROJECT_ID | src/lib/firebase-admin.ts | Définir dans .env.local + Vercel |
| FIREBASE_ADMIN_PRIVATE_KEY | src/lib/firebase-admin.ts | Définir dans .env.local + Vercel |
| FIREBASE_ADMIN_CLIENT_EMAIL | src/lib/firebase-admin.ts | Définir dans .env.local + Vercel |
| FIREBASE_SERVICE_ACCOUNT_KEY | src/lib/firebase-admin.ts, scripts/set-admin-role.js | Définir dans .env.local + Vercel |
| FIREBASE_DATABASE_URL | src/lib/firebase-admin.ts, scripts/set-admin-role.js | Définir dans .env.local |
| NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET | src/lib/cloudinary.ts | Définir dans .env.local |
| NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME | src/lib/cloudinary.ts | Définir dans .env.local |
| NEXT_PUBLIC_GOOGLE_CLIENT_ID | src/services/google.ts | Définir dans .env.local |

### ✅ Variables inutiles (définies mais non utilisées)

| Variable | Fichier | Recommandation |
|----------|---------|----------------|
| NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID | .env.local | Supprimer ou utiliser pour Analytics |
| NEXT_PUBLIC_FIREBASE_VAPID_KEY | .env.local | Conserver pour push futur |

---

## 3. Anomalies corrigées

| Variable / Problème | Sévérité | Correction appliquée |
|---------------------|----------|---------------------|
| Secret admin en dur (`batizen2022` dans AdminSecretModal.tsx) | 🔴 CRITIQUE | ✅ `AdminSecretModal` appelle `POST /api/auth/make-admin` (faille fermée) |
| FIREBASE_ADMIN_* non définies | 🔴 CRITIQUE | ✅ Fallback `FIREBASE_SERVICE_ACCOUNT_KEY` + `applicationDefault()` configuré |
| Conflit ESM/CJS (`jose` v6 ESM-only / `jwks-rsa` CJS) | 🔴 CRITIQUE | ✅ `overrides: { "jose": "^4.15.9" }` dans `package.json` (jose v4 CJS+ESM) |
| Routes API retournant HTML/500 | 🔴 CRITIQUE | ✅ try/catch JSON + guards `!adminAuth` → 503 JSON |
| Vérification admin sans Custom Claim | 🟠 HAUTE | ✅ Fallback RTDB (`users/{uid}/role`) dans useAuth.ts |
| `webpack` config incompatible Turbopack | 🟠 HAUTE | ✅ Retirée (serverExternalPackages suffit) |

---

## 4. Vérifications finales (état OK)

| Vérification | Résultat |
|--------------|----------|
| `npx tsc --noEmit` | ✅ Passe sans erreur |
| `npm run build` | ✅ Succès (compilation + typecheck + 49 pages) |
| `npm install` | ✅ Complété (jose@4.15.9 partout, dédoublonné) |
| `.gitignore` protège `.env.local` et `.secrets/*` | ✅ |
| `serverExternalPackages` (`firebase-admin`, `jose`, `jwks-rsa`) | ✅ |
| Routes API retournent du JSON (jamais HTML) | ✅ |
| Aucune clé Firebase/OpenAI/Cloudinary en dur dans `src/` | ✅ (sauf message erreur explicite) |

---

## 5. Points d'attention restants

1. **Vercel** : définir `FIREBASE_SERVICE_ACCOUNT_KEY` (JSON stringifié) dans les variables d'environnement Vercel.
2. **Local** : `.secrets/firebase-service-account.json` doit exister (présent, en dehors de git).
3. `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` et `NEXT_PUBLIC_FIREBASE_VAPID_KEY` : à supprimer ou utiliser.

---

## 6. Historique des commits (sur `origin/main`)

| Commit | Sujet |
|--------|-------|
| `5b7568b` | Rapport AUDIT_VARIABLES_ENV.md (initial) |
| `4fb2f17` | Sécurité AdminSecretModal + fallback FIREBASE_SERVICE_ACCOUNT_KEY |
| `e56a15d` | Logs debug API routes |
| `edbce7c` | Routes API ne plantent plus (JSON/503) |
| `040732d` | Fallback RTDB pour le contrôle admin |
| `2e3a1ae` | serverExternalPackages (ESM/CJS) |
| `e9f2f46` | Externaliser jwks-rsa + jose@4.15.9 |
| `382ea8e` | **overrides jose v4 (définitif)** |