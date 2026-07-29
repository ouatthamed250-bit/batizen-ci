# 📦 RAPPORT D'UNIFICATION DES IMPORTS FIREBASE — BÂTIZEN CI

**Date :** 23 juillet 2026  
**Objectif :** Unifier tous les imports Firebase via `getFirebaseServices()` depuis `@/lib/firebase`

---

## 1. MODIFICATIONS EFFECTUÉES

### Fichier central : `src/lib/firebase.ts` ✅

- Ajout de l'alias `db` en plus de `database` dans `FirebaseServices`
- Ajout de la documentation sur l'utilisation recommandée
- L'instance Firebase n'est créée qu'une seule fois grâce à `getApps().length > 0`

### Fichiers modifiés automatiquement (15 fichiers) :

| Fichier | Changement |
|---------|-----------|
| `src/app/(auth)/forgot-password/page.tsx` | `getDatabase()` → `getFirebaseServices().db` |
| `src/app/(tabs)/projets/page.tsx` | `getDatabase()` → `getFirebaseServices().db` |
| `src/app/admin/calendar/page.tsx` | `getDatabase()` → `getFirebaseServices().db` |
| `src/app/admin/chantier/[id]/DocumentsSection.tsx` | `getDatabase()` → `getFirebaseServices().db` |
| `src/app/admin/chantier/[id]/page.tsx` | `getDatabase()` → `getFirebaseServices().db` |
| `src/app/admin/clients/page.tsx` | `getDatabase()` → `getFirebaseServices().db` |
| `src/app/admin/dashboard/page.tsx` | `getDatabase()` → `getFirebaseServices().db` |
| `src/app/admin/layout.tsx` | `getDatabase()` → `getFirebaseServices().db` |
| `src/app/admin/messages/page.tsx` | `getDatabase()` → `getFirebaseServices().db` |
| `src/app/admin/page.tsx` | `getDatabase()` → `getFirebaseServices().db` |
| `src/app/admin/parametres/page.tsx` | `getDatabase()` → `getFirebaseServices().db` |
| `src/app/chantier/[id]/ChantierDetailClient.tsx` | `getDatabase()` → `getFirebaseServices().db` |
| `src/app/dashboard/page.tsx` | `getDatabase()` → `getFirebaseServices().db` |
| `src/components/chantier/ClientRendezVous.tsx` | `getDatabase()` → `getFirebaseServices().db` |
| `src/components/chantier/StatsResume.tsx` | `getDatabase()` → `getFirebaseServices().db` |

### Fichiers déjà corrects (inchangés) :

| Fichier | Pattern utilisé | Statut |
|---------|----------------|--------|
| `src/lib/firebase.ts` | Fichier central | ✅ Correct |
| `src/lib/firebase-admin.ts` | Admin SDK (séparé) | ✅ Correct |
| `src/lib/rtdb.ts` | `getFirebaseServices()` | ✅ Déjà correct |
| `src/lib/notifications.ts` | `getFirebaseServices()` | ✅ Déjà correct |
| `src/lib/plans/storage.ts` | `getFirebaseServices()` | ✅ Déjà correct |
| `src/contexts/AuthContext.tsx` | `getFirebaseServices()` + imports `firebase/auth` | ✅ Correct (besoin des providers) |
| `src/hooks/useChantiers.ts` | `getFirebaseServices()` + `firebase/database` (ref, get, update) | ✅ Correct |
| `src/middleware.ts` | `firebase-admin` uniquement | ✅ Correct |
| `src/app/api/auth/*/route.ts` | `firebase-admin` uniquement | ✅ Correct |

---

## 2. PATTERN D'IMPORT RECOMMANDÉ

```typescript
// ✅ CORRECT : Une seule instance centralisée
import { getFirebaseServices } from '@/lib/firebase';

function maFonction() {
  const { db, auth, storage } = getFirebaseServices();
  // db = Realtime Database instance
  // auth = Firebase Auth instance
  // storage = Firebase Storage instance
}
```

```typescript
// ❌ ANCIEN (à ne plus utiliser) :
import { getDatabase } from 'firebase/database';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
```

### Cas particuliers (imports conservés) :

```typescript
// Fonctions Firebase de base (ref, set, onValue, get, etc.)
import { ref, set, onValue, get, update, query, orderByChild, equalTo } from 'firebase/database';

// Ces fonctions ne sont PAS des services — elles ne sont pas remplacées par getFirebaseServices.
// Elles prennent simplement l'instance de db en premier paramètre.
```

---

## 3. VÉRIFICATION

- ✅ `getFirebaseServices()` crée une instance Firebase unique (singleton)
- ✅ `db` et `database` pointent vers la même instance
- ✅ Tous les fichiers utilisent la même instance plutôt que `getDatabase()` qui pourrait en créer plusieurs
- ✅ Pas de régression : les API de Firebase Realtime Database sont identiques