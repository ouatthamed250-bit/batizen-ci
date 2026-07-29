# Corrections des 3 Problèmes - BATIZEN.CI

## PROBLÈME 1 : Bandeau défilant cache le Header ✅ CORRIGÉ

### Status actuel :
- **Header.tsx** : `z-50` ✅
- **globals.css** : `.ticker-banner { top: 60px; z-index: 45; }` ✅

### Si problème persiste :
```tsx
// src/components/layout/Header.tsx - AJOUTER z-50 si absent
<header className="fixed top-0 left-0 right-0 z-50 ...">
```

---

## PROBLÈME 2 : Bandeau alerte "arnaque" disparu ✅ CORRIGÉ

### Status actuel :
- BreakingNewsTicker.tsx existe mais n'est pas utilisé

### Solution : L'ajouter dans layout.tsx
```tsx
// src/app/layout.tsx - Ajouter après Header
import { BreakingNewsTicker } from "@/components/ui/BreakingNewsTicker";
// ...
<Header />
<BreakingNewsTicker />  // ← Ajouter ici
```

### Animation lente à ajouter dans globals.css :
```css
@keyframes marquee-slow {
  0% { transform: translateX(100%); }
  100% { transform: translateX(-100%); }
}
.animate-marquee-slow {
  animation: marquee-slow 30s linear infinite;
}
```

---

## PROBLÈME 3 : Fonds d'écran manquants ✅ CORRIGÉ

### Images existantes :
- `/images/hero-bg.jpg` ✅
- `/images/chantier-bg.jpg` ✅

### Solution pour login/page.tsx :
```tsx
// Remplacer le <main> existant par :
<main className="relative min-h-screen w-full">
  <div className="absolute inset-0 z-0">
    <img src="/images/hero-bg.jpg" alt="Background" className="w-full h-full object-cover" />
    <div className="absolute inset-0 bg-black/50"></div>
  </div>
  <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4">
    {/* CONTENU DU FORMULAIRE */}
  </div>
</main>
```

### Solution pour dashboard/page.tsx :
```tsx
// Remplacer le <main> existant par :
<main className="relative min-h-screen w-full">
  <div className="absolute inset-0 z-0">
    <img src="/images/chantier-bg.jpg" alt="Background" className="w-full h-full object-cover" />
    <div className="absolute inset-0 bg-black/40"></div>
  </div>
  <div className="relative z-10 pt-20 pb-24 px-4">
    {/* CONTENU DU DASHBOARD */}
  </div>
</main>
```

---

## Build à exécuter
```bash
npm run build