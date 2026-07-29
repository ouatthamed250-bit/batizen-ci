# Inventaire des Uploads d'Images et Accès Promo/Annonce/Partenaire

**Date :** 24/07/2026  
**Projet :** batizen-ci (Next.js 16.2.6, Firebase, Cloudinary)

---

## 1. SERVICE D'UPLOAD

| Question | Réponse |
|----------|---------|
| Quel service ? | **Cloudinary** (pas Firebase Storage) |
| Clé Cloudinary | `f4iwk8g6` (hardcodée dans `src/lib/cloudinary.ts`) |
| Upload preset | `batizen_upload` (hardcodé) |
| URL API | `https://api.cloudinary.com/v1_1/f4iwk8g6/auto/upload` |
| Firebase Storage | Initialisé dans `src/lib/firebase.ts` mais **jamais utilisé pour les uploads** |

### Fichier : `src/lib/cloudinary.ts`
```typescript
export const uploadToCloudinary = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', 'batizen_upload');
  const response = await fetch(
    'https://api.cloudinary.com/v1_1/f4iwk8g6/auto/upload',
    { method: 'POST', body: formData }
  );
  if (!response.ok) throw new Error("Erreur lors de l'upload du fichier sur Cloudinary");
  const data = await response.json();
  return data.secure_url;
};
```

---

## 2. COMPOSANTS QUI UPLOADENT DES FICHIERS

| Composant | Fichier | Type de fichier | Service |
|-----------|---------|----------------|---------|
| Page admin (Promotions) | `src/app/admin/page.tsx` | Images promo | Cloudinary |
| Page admin (Partenaires) | `src/app/admin/page.tsx` | Photos partenaires | Cloudinary |
| Page admin (Ouvriers) | `src/app/admin/page.tsx` | Photos ouvriers | Cloudinary |
| Détail chantier admin | `src/app/admin/chantier/[id]/page.tsx` | Photos vidéos rapports | Cloudinary |
| Documents admin | `src/app/admin/chantier/[id]/DocumentsSection.tsx` | Devis, factures, plans | Cloudinary |
| Album chantier admin | `src/components/admin/AlbumChantierAdmin.tsx` | Médias album | Cloudinary |
| Équipe hiérarchique | `src/components/admin/GestionEquipeHierarchique.tsx` | Photos membres | Cloudinary |
| Détail chantier client | `src/app/chantier/[id]/ChantierDetailClient.tsx` | Messages vocaux, PJ, preuves | Cloudinary |

### Aucune route API d'upload dédiée
Tous les uploads sont faits **côté client** directement vers Cloudinary. Aucun fichier `src/app/api/upload/*` n'existe.

---

## 3. RÈGLES FIREBASE

### Realtime Database (`database.rules.json`)
Les sections `promotions`, `partenaires`, `ouvriers`, `materiaux` **n'ont pas de règles explicites** dans `database.rules.json`. Elles héritent donc de la règle racine :

```json
{
  "rules": {
    ".read": false,
    ".write": false,
    // ... sections individuelles seulement pour users, chantiers, etc.
  }
}
```

**Conséquence :** les clients ne peuvent PAS lire `partenaires` ni `promotions` dans la DB (permission refusée).

### Firebase Storage (`storage.rules`)
**Aucun fichier `storage.rules` trouvé** à la racine du projet. Firebase Storage n'est pas utilisé pour les uploads (Cloudinary est utilisé à la place).

---

## 4. ACCÈS CLIENT AUX PROMOS/ANNONCES/PARTENAIRES

### Ce que lit le client (dashboard)

Dans `src/app/dashboard/page.tsx` (lignes ~202-217) :
```typescript
const partenairesRef = dbRef(db, 'partenaires');
const unsubPartenaires = onValue(partenairesRef, (snapshot) => {
  const data = snapshot.val();
  if (data) {
    const partenairesActifs = Object.entries(data)
      .filter(([_, p]) => p.actif === true)
      .map(([id, p]) => ({ id, ...p }));
    setPartenaires(partenairesActifs);
  }
});
```

**⚠️ Problème :** Cette lecture est **bloquée** par les règles actuelles de la DB car `partenaires` n'a pas de règle `.read` autorisée pour les clients.

### Ce que le client NE lit PAS
- `promotions` : **Aucune lecture côté client** trouvée. L'admin peut gérer les promotions, mais elles ne sont pas affichées aux clients.
- `annonces` : **Aucune référence** à cette table dans tout le code source (ni lecture, ni écriture).

---

## 5. VARIABLES D'ENVIRONNEMENT

### Dans `.env.local` :
| Variable | Présente ? | Usage |
|----------|-----------|-------|
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | ✅ Oui | SDK Firebase (mais jamais utilisé) |
| Cloudinary API Key | ❌ **Absente** | La clé `f4iwk8g6` est hardcodée dans `cloudinary.ts` |

### Dans `.env.local.example` :
Aucune variable Cloudinary n'est listée dans l'exemple.

---

## 6. PROBLÈMES IDENTIFIÉS

| # | Problème | Cause | Solution |
|---|----------|-------|----------|
| 🔴 1 | **Les clients ne peuvent pas lire `partenaires`** (dashboard vide) | Pas de règle `.read` pour `partenaires` dans `database.rules.json` | Ajouter une règle : `"partenaires": { ".read": "auth != null", ... }` |
| 🟡 2 | **Les promotions ne sont pas visibles par les clients** | `promotions` n'a pas de règle `.read` ET le dashboard client ne les lit pas | 1. Ajouter règle `.read` dans la DB 2. Ajouter une section Promotions dans le dashboard client |
| 🟡 3 | **Les annonces n'existent pas** | Aucune référence à `annonces` dans le code | Fonctionnalité non implémentée |
| 🟢 4 | **Upload Cloudinary fonctionnel** | Utilisé dans 8 composants différents | Aucun changement nécessaire |
| 🟢 5 | **Pas de dépendance à Firebase Storage** | Cloudinary seul est utilisé | Aucun changement nécessaire |
| 🟡 6 | **Clé Cloudinary hardcodée** | `f4iwk8g6` dans `cloudinary.ts` (pas de variable d'env) | À déplacer dans `.env.local` si on veut pouvoir changer de compte |

---

## 7. FICHIERS ANALYSÉS

| Fichier | Lignes | Rôle |
|---------|--------|------|
| `src/lib/cloudinary.ts` | 23 | Fonction d'upload vers Cloudinary |
| `src/lib/firebase.ts` | 81 | Init Firebase (storage exporté mais pas utilisé pour upload) |
| `src/app/admin/page.tsx` | 1132 | Upload promo/partenaire/ouvrier |
| `src/app/admin/parametres/page.tsx` | 191 | Changement mot de passe (pas d'upload) |
| `src/app/admin/chantier/[id]/page.tsx` | ~500 | Upload médias rapports |
| `src/app/admin/chantier/[id]/DocumentsSection.tsx` | ~200 | Upload documents |
| `src/components/admin/AlbumChantierAdmin.tsx` | ~150 | Upload album |
| `src/components/admin/GestionEquipeHierarchique.tsx` | ~250 | Upload photo équipe |
| `src/app/dashboard/page.tsx` | ~420 | Lit partenaires (bloqué par règles) |
| `src/app/chantier/[id]/ChantierDetailClient.tsx` | ~500 | Upload messages/preuves |
| `database.rules.json` | 86 | Règles RTDB (manque promos/partenaires) |
| `.env.local` | 42 | Variables d'env (pas de clé Cloudinary) |
| `.env.local.example` | - | Exemple (pas de clé Cloudinary) |

---

## 8. RÈGLES RTDB À AJOUTER

Pour que les clients puissent voir les partenaires et promotions, ajouter dans `database.rules.json` :

```json
"promotions": {
  ".read": "auth != null",
  ".write": "auth != null && auth.token.role == 'admin'",
  ".indexOn": ["active"],
  "$promotionId": {
    ".read": "auth != null",
    ".write": "auth != null && auth.token.role == 'admin'"
  }
},

"partenaires": {
  ".read": "auth != null",
  ".write": "auth != null && auth.token.role == 'admin'",
  ".indexOn": ["actif"],
  "$partenaireId": {
    ".read": "auth != null",
    ".write": "auth != null && auth.token.role == 'admin'"
  }
},

"ouvriers": {
  ".read": "auth != null",
  ".write": "auth != null && auth.token.role == 'admin'",
  ".indexOn": ["actif", "specialite"],
  "$ouvrierId": {
    ".read": "auth != null",
    ".write": "auth != null && auth.token.role == 'admin'"
  }
},

"materiaux": {
  ".read": "auth != null",
  ".write": "auth != null && auth.token.role == 'admin'",
  "$materiauId": {
    ".read": "auth != null",
    ".write": "auth != null && auth.token.role == 'admin'"
  }
}