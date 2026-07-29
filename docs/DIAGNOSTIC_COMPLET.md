# Rapport de Diagnostic BATIZEN.CI
Date : 14/07/2026

## 1. Pages manquantes ou inaccessibles
- **src/app/simulation/page.tsx** ✅ EXISTE (créée)
- **src/app/renovation/page.tsx** ✅ EXISTE
- **src/app/nouveau-chantier/page.tsx** ✅ EXISTE

**Problème** : Les pages existent mais NE SONT PAS LIÉES dans le BottomNav ni dans le Header.

---

## 2. Problèmes de navigation

### BottomNav ❌ MANQUANT DU LAYOUT
- **Problème CRITIQUE** : `<BottomNav />` n'est **PAS importé** dans `src/app/layout.tsx`
- Le composant existe (`src/components/layout/BottomNav.tsx`) mais n'est jamais rendu
- Items actuels : Accueil, Projets, Messages, Profil - MANQUE Simulation, Nouveau Chantier, Rénovation

### Header
- Logo et hamburger : OK
- Menu manque : Simulation, Nouveau Chantier

### Sidebar - Routes CASSÉES ❌
```tsx
// ROUTES INCORRECTES :
{ href: "/(chantier-en-cours)/chantier-en-cours" }  // Devrait être "/chantier-en-cours"
{ href: "/(tabs)/messages" }                       // Devrait être "/messages"  
{ href: "/(tabs)/devis" }                          // Devrait être "/devis"
{ href: "/(recu)/recu" }                            // Route inexistante
{ href: "/(chantier-en-cours)/chantier-en-cours" }   // Dupliqué
```

---

## 3. Problème de déconnexion

- **AuthContext.tsx** ✅ La fonction `logout()` existe et est exportée
- **Problème** : Le bouton de déconnexion dans Header a une route vers `/profil` - pas de logique logout visible

---

## 4. Problème de bouton retour

- **AndroidBackHandler.tsx** ✅ Existe et est importé dans layout
- **BackButton.tsx** ✅ Existe mais n'est **PAS utilisé** dans les pages
- Le hook `useAndroidBackButton` est présent

---

## 5. Recommandations de correction (priorité)

### 🔴 Critique (à faire IMMÉDIATEMENT)
1. **Ajouter `<BottomNav />` dans src/app/layout.tsx** - Sans ça, pas de navigation mobile
2. **Corriger les routes du Sidebar** :
   - `/(chantier-en-cours)/chantier-en-cours` → `/chantier-en-cours`
   - `/(tabs)/messages` → `/messages`
   - `/(tabs)/devis` → `/devis`
   - Supprimer `/(recu)/recu` (route inexistante)

### 🟠 Important
3. Ajouter Simulation et Nouveau Chantier dans BottomNav
4. Vérifier que le bouton logout dans Profil/appelle bien `logout()`
5. Ajouter BackButton dans les pages concernées

### 🟡 Amélioration
6. Tester le fonctionnement complet du menu sur mobile