# Implémentation de la fonctionnalité "Annonces"

**Date :** 24/07/2026
**Build :** ✅ 44 pages, 0 erreur

## Fichiers créés

### 1. `src/components/ui/AnnonceTicker.tsx` (nouveau)
- Client Component (`"use client"`)
- Lit les annonces depuis `/annonces` dans la Realtime Database
- Filtre les annonces actives avec vérification des dates (début/fin)
- Style : fond vert semi-transparent (`bg-green-500/10`), bordure verte, texte vert
- Animation bande défilante (`animate-marquee-annonce`)
- S'affiche uniquement si des annonces actives existent (ne prend pas de place sinon)
- Type `Annonce` exporté : `{ id, titre, contenu, dateDebut, dateFin, active, createdAt }`

### 2. `src/app/admin/annonces/page.tsx` (nouveau)
- Page admin protégée par le layout admin
- Formulaire d'ajout : titre, contenu, date début/fin, checkbox active
- Liste des annonces existantes (triées par date de création décroissante)
- Boutons : activer/désactiver, supprimer
- Style cohérent avec le reste de l'admin (fond sombre, orangé #FF7A00)

## Fichiers modifiés

### 3. `src/app/admin/AdminLayoutClient.tsx`
- Ajout du lien "Annonces" (icône Megaphone) dans la sidebar admin :
  ```tsx
  { key: "annonces", label: "Annonces", icon: Megaphone, href: "/admin/annonces" },
  ```

### 4. `src/components/layout/LayoutWrapper.tsx`
- Import de `AnnonceTicker` (réservé pour affichage futur sur autres pages que dashboard)

### 5. `src/app/dashboard/page.tsx`
- Import de `AnnonceTicker`
- Ajout du composant après la bande promo existante (les deux s'affichent)
- La bande promo orange reste inchangée

## Règles Firebase

Les règles `database.rules.json` ont déjà été mises à jour dans le commit `820f8c9` :
```json
"annonces": {
  ".read": true,
  ".write": "auth != null && auth.token.role == 'admin'"
}
```

## Utilisation

1. **Admin** : Menu latéral → "Annonces" → Ajouter une annonce (titre, contenu, dates)
2. **Client** : Dashboard → bande défilante verte avec les annonces actives