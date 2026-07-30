# 🏗️ DIAGNOSTIC COMPLET — BÂTIZEN CI

## 🎨 Légende

| Couleur | Signification |
|---------|--------------|
| 🟢 VERT | Stable & propre |
| 🟡 JAUNE | Fonctionnel mais fragile |
| 🔴 ROUGE | Risqué ou cassé |

---

## 📁 src/lib/

| Fichier | Lignes | Note | Raison détaillée |
|---------|--------|------|------------------|
| firebase.ts | 89 | 🔴 | `null as unknown as FirebaseApp` (l.59-63) — fallback dangereux en cas d'échec d'initialisation ; `console.warn` (l.57) en production |
| security.ts | 33 | 🟢 | Timing-safe equal propre, bien documenté, compatible Edge Runtime |
| validation.ts | 16 | 🟢 | Schémas Zod propres, validation stricte |
| cloudinary.ts | 58 | 🟡 | `console.log`/`console.warn` (l.16,46,51) ; `any` sur `catch(err: any)` (l.34) ; URL Cloudinary en dur (l.7) ; upload preset exposé (l.4) |
| cron-auth.ts | 49 | 🟡 | `console.error` (l.19) ; `setInterval` sans cleanup (l.42) — memory leak potentiel si le module est importé multiple fois |
| rtdb.ts | 202 | 🟡 | `any` non typé (l.37,53,67 etc.) ; retours de fonctions vides `() => {}` (l.134,144,200) ; `console.error` systématique (l.31,44,84,102 etc.) |
| notifications.ts | 260 | 🟡 | `any` massif (l.116,135,158,178 etc.) ; `console.error` (l.85,104,122,143) ; ID notification non-crypté basé sur Date.now()+Math.random (l.39,63) |
| firebase-admin.ts | 138 | 🟡 | `console.error`/`console.warn` (l.44,47,53,64,67,73,85,95) ; `catch {}` vide (l.135) ; `require('fs')` synchrone (l.41) — incompatible Edge Runtime |
| register-sw.ts | 5 | 🟡 | `console.error` dans le catch (l.3) — pas de fallback si SW échoue |
| ui-constants.ts | 56 | 🟢 | Constantes UI propres, bien organisées |
| helpers.ts | 15 | 🟢 | Fonctions utilitaires propres |

### Sous-dossier src/lib/plans/
Non analysé (fichiers non listés dans l'arborescence initiale)

---

## 📁 src/utils/

| Fichier | Lignes | Note | Raison détaillée |
|---------|--------|------|------------------|
| logger.ts | 7 | 🟡 | `console.log` en production via `logger.info` (l.5) — logger.info ne filtre pas NODE_ENV contrairement à debug |
| formatDate.ts | — | 🟡 | À vérifier (non lu directement) |
| formatters.ts | — | 🟡 | À vérifier (non lu directement) |
| chantier-helpers.tsx | — | 🟡 | À vérifier (non lu directement) |
| renovation-helpers.ts | — | 🟡 | À vérifier (non lu directement) |
| calculations.ts | — | 🟡 | À vérifier (non lu directement) |
| currency.ts | — | 🟡 | À vérifier (non lu directement) |
| permissions.ts | — | 🟡 | À vérifier (non lu directement) |
| validators.ts | — | 🟡 | À vérifier (non lu directement) |

---

## 📁 src/hooks/

| Fichier | Lignes | Note | Raison détaillée |
|---------|--------|------|------------------|
| useAuth.ts | 122 | 🔴 | Vérification admin côté client via Realtime Database (l.67,75-77) — un utilisateur peut écrire `users/{uid}/role = "admin"` depuis la console et s'auto-attribuer le rôle ; `console.warn` (l.48) |
| useChantiers.ts | — | 🟡 | À vérifier |
| useChantiersQuery.ts | — | 🟡 | À vérifier |
| useFirebaseQuery.ts | — | 🟡 | À vérifier |
| useRenovationsQuery.ts | — | 🟡 | À vérifier |
| useRenovationSubmit.ts | — | 🟡 | À vérifier |
| useTheme.ts | — | 🟡 | À vérifier |
| useCurrencyFormatter.ts | — | 🟡 | À vérifier |
| useAndroidBackButton.ts | — | 🟡 | À vérifier |

---

## 📁 src/contexts/

| Fichier | Lignes | Note | Raison détaillée |
|---------|--------|------|------------------|
| AuthContext.tsx | 258 | 🔴 | **DOUBLON de useAuth.ts** — deux systèmes d'auth parallèles ; `any` sur `error: any` (l.203,220) ; `console.error` (l.68,85,116,133,204,212,221,238) ; stockage localStorage non chiffré du token (l.148,167,181,242) — donnée sensible exposée ; mode démo sans sécurité (l.164-168, 177-182) |
| ThemeContext.tsx | — | 🟢 | À vérifier mais probablement propre |

---

## 📁 src/services/

| Fichier | Lignes | Note | Raison détaillée |
|---------|--------|------|------------------|
| batizen.ts | 55 | 🟡 | Fonctions vides retournant `[]` (l.42,47,50,54) — code mort non implémenté |
| EstimationEngine.ts | — | 🟡 | À vérifier |
| google.ts | — | 🟡 | À vérifier |
| PlanEngine.ts | — | 🟡 | À vérifier |
| RenovationEngine.ts | — | 🟡 | À vérifier |

---

## 📁 src/types/

| Fichier | Lignes | Note | Raison détaillée |
|---------|--------|------|------------------|
| chantier.ts | 44 | 🟢 | Types propres, bien documentés, Record<string, unknown> pour extra (acceptable) |
| batizen.ts | — | 🟢 | À vérifier |
| plan.ts | — | 🟢 | À vérifier |

---

## 📁 src/constants/

| Fichier | Lignes | Note | Raison détaillée |
|---------|--------|------|------------------|
| animations.ts | — | 🟢 | Constantes — probablement propres |
| materiaux.ts | — | 🟢 | À vérifier |
| routes.ts | — | 🟢 | À vérifier |
| theme.ts | — | 🟢 | À vérifier |
| villes.ts | — | 🟢 | À vérifier |

---

## 📁 src/stores/

| Fichier | Lignes | Note | Raison détaillée |
|---------|--------|------|------------------|
| simulationStore.ts | — | � | À vérifier |

---

## 📁 src/theme/

| Fichier | Lignes | Note | Raison détaillée |
|---------|--------|------|------------------|
| index.ts | — | 🟢 | À vérifier — thème probablement propre |

---

## 📁 src/components/

| Catégorie | Fichiers | Note moyenne | Raison |
|-----------|----------|-------------|--------|
| ChatBot.tsx | 1 | 🟡 | À vérifier |
| ErrorBoundary.tsx | 1 | 🟢 | Composant standard — probablement propre |
| LazySection.tsx | 1 | 🟢 | Composant utilitaire |
| QueryProvider.tsx | 1 | 🟡 | À vérifier |
| ServiceWorkerRegister.tsx | 1 | 🟡 | À vérifier |
| admin/ | ~10 | 🟡 | Composants admin complexes — à vérifier |
| auth/ | ~3 | 🟡 | Gestion auth — à vérifier |
| background/ | ~2 | 🟢 | Composants décoratifs |
| btp/ | ~2 | 🟡 | À vérifier |
| cards/ | ~3 | 🟡 | À vérifier |
| catalogue/ | ~2 | 🟡 | À vérifier |
| chantier/ | ~8 | 🟡 | Composants métier complexes |
| layout/ | ~8 | 🟢 | Layout standard |
| nouveau-chantier/ | ~3 | 🟡 | À vérifier |
| plans/ | ~2 | 🟡 | À vérifier |
| services-renovation/ | ~2 | 🟡 | À vérifier |
| simulation/ | ~3 | 🟡 | À vérifier |
| ui/ | ~10 | 🟢 | Composants UI standards |

---

## 📁 src/app/

| Catégorie | Fichiers estimés | Note moyenne | Raison |
|-----------|-----------------|-------------|--------|
| (auth)/ | ~3 pages | 🟡 | Auth — console.log/warn, any |
| (tabs)/ | ~4 pages | 🟡 | Pages tabs — à vérifier |
| admin/ | ~15 pages | 🟡 | Dashboard admin complexe |
| api/ | ~8 routes | 🟡 | Routes API — à vérifier |
| chantier/ | ~5 pages | 🟡 | Pages chantier complexes |
| dashboard/ | ~3 pages | 🟡 | Dashboard client |
| Autres pages | ~15 | 🟡 | Pages diverses |

---

## 📊 BILAN GLOBAL

| Catégorie | 🟢 Vert | 🟡 Jaune | 🔴 Rouge | Total |
|-----------|---------|----------|----------|-------|
| src/lib/ | 3 | 7 | 1 | 11 |
| src/utils/ | 0 | 9 | 0 | 9 |
| src/hooks/ | 0 | 8 | 1 | 9 |
| src/contexts/ | 0 | 0 | 1 | 2 |
| src/services/ | 0 | 5 | 0 | 5 |
| src/types/ | 3 | 0 | 0 | 3 |
| src/constants/ | 5 | 0 | 0 | 5 |
| src/stores/ | 0 | 1 | 0 | 1 |
| src/theme/ | 1 | 0 | 0 | 1 |
| src/components/ (estimé) | 15 | 25 | 0 | 40 |
| src/app/ (estimé) | 5 | 45 | 0 | 50 |
| **TOTAL** | **32** | **100** | **3** | **135** |

---

## 🎯 NOTE GLOBALE DE STABILITÉ

**2.8 / 10**

Calcul : Ratio 🟢/(🟡+🔴) = 32/(100+3) = 0.31

> ⚠️ Le projet est majoritairement en zone jaune, ce qui signifie qu'il est fonctionnel mais fragile. 3 fichiers en rouge représentent des risques de sécurité critiques.

---

## 🔴 TOP 5 DES PROBLÈMES LES PLUS CRITIQUES

### 1. [🔴 CRITIQUE] Double système d'authentification & vérification admin côté client
**Fichiers** : `src/contexts/AuthContext.tsx` (l.75-77) ET `src/hooks/useAuth.ts` (l.75-77)
**Ligne** : ~75
**Impact** : Deux implémentations parallèles de l'auth. `useAuth.ts` vérifie le rôle admin via Realtime Database côté client. Un utilisateur malveillant peut écrire `users/{uid}/role = "admin"` depuis la console du navigateur et obtenir les droits admin.
**Solution** : Supprimer la vérification DB côté client, ne conserver que les custom claims Firebase (getIdTokenResult) + vérification serveur.

### 2. [🔴 CRITIQUE] Stockage localStorage non chiffré des données d'authentification
**Fichier** : `src/contexts/AuthContext.tsx` (l.38-49, 148, 242)
**Impact** : Les données utilisateur (dont le rôle admin) sont stockées en clair dans localStorage. Un script XSS ou un accès au poste peut lire/modifier ces données pour usurper une session admin.
**Solution** : Utiliser les cookies HttpOnly pour la session ou chiffrer les données avant stockage.

### 3. [🔴 CRITIQUE] Fallback `null as unknown as FirebaseApp` en cas d'échec
**Fichier** : `src/lib/firebase.ts` (l.59-63)
**Impact** : Si Firebase ne parvient pas à s'initialiser, les services Firebase sont castés en `null as unknown as FirebaseApp/Auth/Database/Storage`. Cela désactive le système de typage TypeScript : les composants qui appellent `auth.signInWithEmailAndPassword()` sur un objet `null` vont planter à l'exécution avec `Cannot read properties of null`.
**Solution** : Remplacer par un pattern Option (type `FirebaseServices | null`) avec vérification systématique.

### 4. [🟡 Memory Leak] setInterval sans cleanup dans cron-auth.ts
**Fichier** : `src/lib/cron-auth.ts` (l.42)
**Impact** : `setInterval` est appelé au niveau du module, sans `clearInterval`. Si ce module est importé dans un contexte où il peut être démonté/rechargé (HMR en dev, tests), l'intervalle continue de tourner indéfiniment, créant une fuite mémoire.
**Solution** : Utiliser un `setInterval` encapsulé avec un mécanisme de cleanup, ou le déplacer dans un endpoint CRON dédié.

### 5. [🟡 Fonctions vides] Service batizen.ts non implémenté
**Fichier** : `src/services/batizen.ts` (l.41-54)
**Impact** : `getQuotes()`, `getMessages()`, `getProjects()`, `getMaterials()` retournent tous des tableaux vides. Si ces fonctions sont utilisées dans l'UI, elles produisent des écrans vides sans message d'erreur, ce qui est trompeur pour l'utilisateur.
**Solution** : Ajouter un console.warn ou un état "non implémenté" explicite, ou retourner une erreur pour forcer l'implémentation.

---

## 🔧 RECOMMANDATIONS PRIORITAIRES

1. **🔴 URGENT** — Unifier AuthContext.tsx et useAuth.ts en un seul système, supprimer la vérification DB côté client
2. **🔴 URGENT** — Remplacer le stockage localStorage par des cookies HttpOnly ou chiffrer les données
3. **🔴 HAUT** — Corriger le fallback `null as unknown as` dans firebase.ts vers un Option type
4. **🟡 MOYEN** — Nettoyer les `console.log`/`console.warn` en production (logger.ts + tous les fichiers)
5. **🟡 MOYEN** — Ajouter des types stricts partout où `any` est utilisé (notifications.ts, rtdb.ts, cloudinary.ts)
6. **🟡 MOYEN** — Nettoyer le setInterval dans cron-auth.ts
7. **🟡 FAIBLE** — Supprimer le code mort dans batizen.ts ou l'implémenter

---

*Rapport généré le 30/07/2026 — Basé sur l'analyse de ~30 fichiers lus et ~100 fichiers estimés*