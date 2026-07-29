# RÈGLES DE CONDUITE CLINE — BÂTIZEN CI

## 🚫 INTERDIT (modification = crash potentiel)
- src/middleware.ts
- src/lib/firebase.ts, firebase-admin.ts, rtdb.ts, security.ts, notifications.ts
- database.rules.json
- capacitor.config.ts
- next.config.ts
- src/app/api/* (routes API)
- src/contexts/*
- src/hooks/*

## ⚠️ ZONE ORANGE (modification autorisée avec validation humaine)
- src/app/dashboard/page.tsx
- src/app/chantier/[id]/ChantierDetailClient.tsx
- src/services/*
- src/lib/documents-templates.ts, generateContractPDF.ts, generateReceiptPDF.ts

## ✅ ZONE VERTE (libre)
- src/components/ui/*
- src/utils/*
- src/data/*
- src/components/ErrorBoundary.tsx, LazySection.tsx

## 📋 CONVENTIONS
- Max 250 lignes par fichier. Au-delà = extraction obligatoire.
- Tailwind v4 uniquement. Pas de tailwind.config.js.
- Firebase RTDB est la source de vérité. PAS de Drizzle/PostgreSQL en production.
- Tout import de Three.js ou composant lourd doit passer par next/dynamic avec ssr:false.
- Tout composant avec état Firebase doit avoir un ErrorBoundary parent.
- TypeScript strict : aucun `any` non justifié.