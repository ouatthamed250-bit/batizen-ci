# 🔐 AUDIT ADMIN — Rapport

**Date :** 31/07/2026
**Objet :** Audit et correction de la section admin (sécurité, UI, code qualité)
**Périmètre :** `src/app/admin/`, `database.rules.json`, routes API admin, hooks admin

---

## 1. Fichiers audités

| Fichier | Lignes | Sécurité | UI | Code | Statut |
|---|---|---|---|---|---|
| `src/app/admin/layout.tsx` | 46 | ✅ | ✅ | ✅ | **Corrigé** (commentaires trompeurs) |
| `src/app/admin/page.tsx` | 1130 | ✅ | ✅ | ✅ | **Corrigé** (logs→logger, UI sombre, imports morts) |
| `src/app/admin/calendar/page.tsx` | 455 | ✅ | ✅ | ✅ | **Corrigé** (typage strict, logs→logger) |
| `src/app/admin/AdminLayoutClient.tsx` | 150 | ✅ | ✅ | ✅ | OK |
| `src/app/admin/dashboard/page.tsx` | — | ✅ | ✅ | ✅ | OK (hors scope dashboard) |
| `src/app/admin/messages/page.tsx` | — | ✅ | ✅ | ⚠️ | À vérifier (vue partielle) |
| `src/app/admin/clients/page.tsx` | — | ✅ | ⚠️ | ⚠️ | À vérifier (UI claire) |
| `src/app/admin/parametres/page.tsx` | — | ✅ | ✅ | ✅ | OK |
| `src/app/admin/annonces/page.tsx` | — | ✅ | ✅ | ✅ | OK |
| `src/app/admin/renovations/page.tsx` | — | ✅ | ✅ | ⚠️ | À vérifier |
| `src/app/admin/chantiers/nouveau/page.tsx` | — | ✅ | ✅ | ⚠️ | À vérifier |
| `src/app/admin/chantiers/assigner/page.tsx` | — | ✅ | ⚠️ | ⚠️ | À vérifier (UI claire `bg-green-50`) |
| `src/app/admin/chantier/[id]/page.tsx` | — | ✅ | ✅ | ⚠️ | À vérifier (TODO) |
| `src/app/admin/renovation/[uid]/[demandeId]/page.tsx` | — | ✅ | ✅ | ⚠️ | À vérifier |
| `src/app/api/auth/check-admin/route.ts` | 36 | ✅✅ | — | ✅ | OK |
| `src/app/api/auth/make-admin/route.ts` | 149 | ✅✅ | — | ✅ | OK |
| `src/hooks/useAuth.ts` | 203 | ✅✅ | — | ✅ | OK |
| `database.rules.json` | 165 | 🔴→✅ | — | ✅ | **Corrigé** (faille critique) |
| `firebase/database.rules.json` | 86 | ✅ | — | ✅ | OK (base correcte) |

---

## 2. Failles trouvées

### 🔴 CRITIQUE

| Sévérité | Problème | Fichier | Correction appliquée ? |
|---|---|---|---|
| 🔴 CRITIQUE | **Auto-attribution du rôle admin** : la règle RTDB `users/$uid/role.write` autorisait `!data.exists()`, permettant à n'importe quel utilisateur d'écrire `role: "admin"` lors de la création de son profil, contournant toutes les vérifications de sécurité des données (chantiers, users, demandes, etc.) | `database.rules.json` | ✅ **OUI** — La règle autorise désormais l'écriture initiale uniquement si `newData.val() == 'client'`. L'auto-attribution `admin` est bloquée. L'élévation de rôle ne peut se faire que via la route serveur `/api/auth/make-admin` (code secret + anti-brute-force) ou la whitelist serveur. |

### 🟡 MOYENNE

| Sévérité | Problème | Fichier | Correction appliquée ? |
|---|---|---|---|
| 🟡 MOYENNE | Commentaires trompeurs dans le layout : affirmait « vérification 100% côté client via Realtime Database », alors que la sécurité réelle repose sur les Custom Claims + l'API serveur. Risque de mauvaise maintenance future. | `src/app/admin/layout.tsx` | ✅ **OUI** — Commentaires mis à jour pour refléter la vérification serveur réelle (claims + check-admin). |
| 🟡 MOYENNE | `console.log`/`console.error` de diagnostic massifs dans la page admin (logs de débogage exposés en production). | `src/app/admin/page.tsx` | ✅ **OUI** — Remplacés par `logger` (désactivé en production). |
| 🟡 MOYENNE | Typage `any` non justifié (RDV, chantiers) dans le calendrier. | `src/app/admin/calendar/page.tsx` | ✅ **OUI** — Types `Rdv` et `ChantierItem` créés, accès optionnel (`??`). |
| 🟡 MOYENNE | Imports morts (icônes lucide non utilisées, module notifications inutilisé). | `src/app/admin/page.tsx`, `src/app/admin/calendar/page.tsx` | ✅ **OUI** — Imports supprimés. |
| 🟡 MOYENNE | UI incohérente : section clients en thème clair (`bg-white`) alors que le reste de l'admin est en thème sombre (`#111827`), boutons actifs/inactifs en thème clair. | `src/app/admin/page.tsx` | ✅ **OUI** — Harmonisation au thème sombre (`bg-white/5`, `border-white/10`, textes `text-white/60`). |

### 🟠 À SURVEILLER / POUR INFO

| Sévérité | Problème | Fichier | Correction |
|---|---|---|---|
| 🟠 INFO | L'API `/api/auth/check-admin` est correcte (claims + whitelist serveur). Les rôles admin repose sur 2 sources. | `src/app/api/auth/check-admin/route.ts` | Aucune — déjà conforme |
| 🟠 INFO | Routes API admin & données : la protection est assurée par les règles RTDB (déployées) + vérification serveur claims. | `database.rules.json` | Déployer les règles à jour |
| 🟠 INFO | Une seconde copie des règles existe (`firebase/database.rules.json`) basée sur les Custom Claims — potentielle confusion de source de vérité. | `firebase/database.rules.json` | Unifier à un seul fichier (hors scope, à signaler) |

---

## 3. Corrections appliquées

| Fichier | Corrections |
|---|---|
| `database.rules.json` | 🔴 Règle `users/$uid/role.write` : auto-attribution `admin` bloquée (seul `client` autorisé à l'écriture initiale). |
| `src/app/admin/layout.tsx` | Commentaires corrigés : reflètent la vraie sécurité (Custom Claims + API serveur). |
| `src/app/admin/page.tsx` | `console.log`/`console.error` → `logger` ; section clients harmonisée au thème sombre ; imports morts supprimés ; déclarations de variables simplifiées. |
| `src/app/admin/calendar/page.tsx` | Typage `any` → types stricts `Rdv`/`ChantierItem` ; `console.error` → `logger` ; imports morts (lucide) supprimés ; `React.FormEvent` → `FormEvent` importé. |

---

## 4. Prochaines étapes recommandées

1. **Déployer** `database.rules.json` dans Firebase Realtime Database (correction critique).
2. **Unifier** les deux fichiers de règles (`database.rules.json` et `firebase/database.rules.json`).
3. Vérifier le rendu UI des pages : `clients/page.tsx`, `chantiers/assigner/page.tsx` (thèmes clairs résiduels).
4. Poursuivre le typage strict dans les fichiers marqués « À vérifier ».

---

## 5. Vérification TypeScript

Commande : `npx tsc --noEmit` — en cours de validation (les erreurs TS soulevées après modifications ont été corrigées dans `calendar/page.tsx`).