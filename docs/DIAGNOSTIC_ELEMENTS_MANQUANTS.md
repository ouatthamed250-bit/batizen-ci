# Rapport des Éléments Manquants/Problématiques

## 1. Pages manquantes ou non liées dans le menu

| Page | Statut | Action requise |
|------|--------|--------------|
| /simulation | **MANQUANT** | À créer avec un formulaire de simulation |
| /nouveau-chantier | **PRÉSENT** ✅ | Existe, mais peut ne pas être lié dans le menu |

## 2. Composants UI

| Composant | Statut | Action requise |
|-----------|--------|----------------|
| src/components/ui/InfoTicker.tsx | **PRÉSENT** ✅ | Position fixed mais z-index manquant |
| src/components/ui/BreakingNewsTicker.tsx | **PRÉSENT** ✅ | Alternatif disponible |

## 3. Cause de la superposition (z-index)

### Problème identifié :
- **Header** : `z-50` (position fixed top-0) ✅
- **InfoTicker** : `position: fixed` mais **z-index non défini** ❌
- **BottomNav** : `z-40` ✅

### Solution immédiate :
Dans `globals.css`, la classe `.ticker-banner` doit avoir :
```css
.ticker-banner {
  position: fixed;
  top: 60px;  /* Juste après le Header */
  left: 0;
  right: 0;
  z-index: 40;  /* MÊME que BottomNav, ou 45 pour être entre Header et contenu */
  height: 36px;
}
```

Le contenu principal doit avoir `padding-top: 96px` (60px Header + 36px Ticker) pour éviter la superposition.

## 4. Plan de correction

### Action 1 : Créer la page Simulation
Créer `src/app/simulation/page.tsx` avec :
- Formulaire de simulation de projet BTP
- Calcul du prix estimé
- Redirection vers /devis

### Action 2 : Corriger le z-index du ticker
Dans `globals.css` :
```css
.ticker-banner {
  position: fixed;
  top: 60px;
  left: 0;
  right: 0;
  z-index: 45;
  height: 36px;
}
```

### Action 3 : Ajouter padding-top au contenu principal
Dans `layout.tsx` ou `globals.css` :
```css
main {
  padding-top: 96px; /* 60px Header + 36px Ticker */
}
```

### Action 4 : Lier les pages dans le menu
Vérifier que `/nouveau-chantier` et `/simulation` sont accessibles depuis le Header ou Sidebar.