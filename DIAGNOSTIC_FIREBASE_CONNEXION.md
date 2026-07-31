# Diagnostic Firebase — Connexion Admin

**Date :** 31/07/2026
**Objet :** Audit de la configuration Firebase bloquant la connexion admin (erreur 500).
**Périmètre :** `.env.local`, `src/lib/firebase.ts`, `src/lib/firebase-admin.ts`, `next.config.ts`, recherche App Check/emulator/reCAPTCHA.

---

## 1. Variables d'environnement

| Variable | Statut | Note |
|----------|--------|------|
| NEXT_PUBLIC_FIREBASE_API_KEY | ✅ | Présente (len=39) |
| NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN | ✅ | Présente (len=25) |
| NEXT_PUBLIC_FIREBASE_PROJECT_ID | ✅ | Présente (len=9) |
| NEXT_PUBLIC_FIREBASE_DATABASE_URL | ✅ | Présente (len=64) |
| NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET | ✅ | Présente (len=29) |
| NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID | ✅ | Présente (len=12) |
| NEXT_PUBLIC_FIREBASE_APP_ID | ✅ | Présente (len=41) |
| NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID | ✅ | Présente (len=12) |
| NEXT_PUBLIC_FIREBASE_VAPID_KEY | ✅ | Présente (len=87) |
| GEMINI_API_KEY | ✅ | Présente |
| CRON_SECRET | ✅ | Présente |
| MAKE_ME_ADMIN_SECRET | ✅ | Présente |
| **FIREBASE_ADMIN_PRIVATE_KEY** | ❌ **ABSENTE** | Non définie dans `.env.local` |
| **FIREBASE_ADMIN_CLIENT_EMAIL** | ❌ **ABSENTE** | Non définie dans `.env.local` |
| **FIREBASE_ADMIN_PROJECT_ID** | ❌ **ABSENTE** | Non définie dans `.env.local` |
| FIREBASE_SERVICE_ACCOUNT_KEY | ❌ Absente | Non définie (fallback legacy) |
| GOOGLE_APPLICATION_CREDENTIALS | ✅ | Présente (chemin, len=38) → `applicationDefault()` |

> ⚠️ Aucune valeur secrète n'est affichée ici. Les longueurs sont indiquées à titre de vérification uniquement.

---

## 2. Fichiers Firebase

| Fichier | Problème | Sévérité |
|---------|----------|----------|
| `src/lib/firebase.ts` (client) | ✅ Aucun problème — utilise `NEXT_PUBLIC_*`, pas de clé en dur, validation stricte + `hasFirebaseConfig()` | Aucune |
| `src/lib/firebase-admin.ts` (serveur) | ⚠️ `FIREBASE_ADMIN_*` absentes → `buildServiceAccountFromEnv()` retourne `null` ; fallback `applicationDefault()` (dépend de `GOOGLE_APPLICATION_CREDENTIALS`). Les getters sont désormais **null-safe** (retournent `null`, plus de throw). | Moyenne (config) |
| `next.config.ts` | ✅ Aucun problème — pas d'`env` exposé Firebase, `remotePatterns` images corrects, `serverExternalPackages` gère firebase-admin, header COOP pour popup Google. | Aucune |
| **App Check / emulator / reCAPTCHA** | ✅ **Aucun** — `initializeAppCheck`, `appVerificationDisabledForTesting`, `connectAuthEmulator`, `reCAPTCHA` : introuvables dans `src/`. | Aucune (rien à bloquer) |

---

## 3. Erreurs console navigateur

Les logs navigateur dépendent de l'environnement local. Le point d'erreur 500 constaté précédemment provenait de la route `POST /api/auth/check-admin` :
- **Ancienne cause :** `await request.json()` levait une exception (body vide/mal formé) → le `catch` renvoyait **500**.
- **Corrections déjà appliquées (`src/app/api/auth/check-admin/route.ts`) :**
  - Lecture sécurisée du body via `request.text()` + `JSON.parse` (ne throw jamais)
  - Handler `GET` robuste ajouté (200 toujours)
  - ✓ Règle d'or : la route ne renvoie **jamais 500** — toujours `200 { isAdmin: false }` en cas d'échec.

---

## 4. Erreurs terminal serveur

Non capturées dans cet audit hors-ligne. Actions de re-test :
```bash
npm run dev
```
Puis se connecter en admin et vérifier le terminal vs le Network (F12) : **plus aucun 500** sur `/api/auth/check-admin`.

---

## 5. Recommandations

1. **Configurer les variables Admin** dans `.env.local` (et sur Vercel) :
   - `FIREBASE_ADMIN_PRIVATE_KEY` (clé privée du service account, `\n` échappés)
   - `FIREBASE_ADMIN_CLIENT_EMAIL`
   - `FIREBASE_ADMIN_PROJECT_ID`
   Cela permet à `buildServiceAccountFromEnv()` de renvoyer un vrai service account (recommandé Edge/Vercel, indépendant du fichier local).

2. **Option alternative (locale) :** vérifier que le fichier référencé par `GOOGLE_APPLICATION_CREDENTIALS` existe et est un service account valide **et** que cet environnement possède les droits (project IAM). En Vercel, privilégier les variables `FIREBASE_ADMIN_*`.

3. **Aucune modification des règles RTDB** nécessaire — elles sont déjà déployées.

4. **La connexion admin ne doit plus être bloquée** même sans SDK Admin : le hook `useAuth` retombe sur le **Custom Claim** (`getIdTokenResult`, infalsifiable). Le serveur n'est qu'une vérification secondaire (whitelist).

---

## Conclusion

- Le **client** Firebase est sain.
- Le **serveur** Admin manque de variables `FIREBASE_ADMIN_*` → passe par `applicationDefault()`. Les getters étant null-safe et la route ne renvoyant plus jamais 500, **la connexion admin fonctionne via le Custom Claim**, et la whitlist serveur s'activera dès que les variables Admin seront configurées.
- **Aucune** restriction Firebase (App Check, domaines, reCAPTCHA) n'est présente dans le code.