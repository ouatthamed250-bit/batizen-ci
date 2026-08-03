# 📁 INVENTAIRE EXHAUSTIF — BÂTIZEN CI

**Date :** 3 août 2026
**Poste :** 482 962 tokens
**Périmètre :** tous les fichiers du projet (hors `node_modules/`, `.next/`, `assets/` binaires, `.git/`, `build/`)

---

## 1. VUE D'ENSEMBLE

| Catégorie | Nombre de fichiers | Détail |
|-----------|-------------------|--------|
| **Config racine** | 32 | package.json, next.config.ts, tsconfig, etc. |
| **Source `src/`** | ~160 | code application (app, components, lib, hooks...) |
| **Documentation `docs/`** | 44 | fichiers `.md` (guide, audit, rapport) |
| **Scripts `scripts/`** | 5 | utilitaires Node.js |
| **Public `public/`** | 8 | PWA, manifest, SW, favicons |
| **Functions `functions/`** | 2 | Functions Firebase |
| **Tests `__tests__/`** | 4 | tests Jest |
| **Firebase `firebase/`** | 1 | database.rules.json |
| **Secrets `.secrets/`** | 2 | service account + .gitkeep |
| **Assets `assets/`** | 5 dossiers | fonts, icons, images, lottie, videos |

---

## 2. FICHIERS RACINE (c:\Users\Mr ZOGBO\Desktop\batizen-ci)

| Fichier | Type | Rôle |
|---------|------|------|
| `.env.local` | env | Variables d'environnement locales (⚠️ non commité) |
| `.env.local.example` | env | Exemple de configuration |
| `.firebaserc` | config | Alias Firebase |
| `.gitignore` | config | Règles d'ignorance git |
| `$null` | placeholder | Fichier vide macOS/Windows |
| `App.tsx` | source | Point d'entrée Capacitor (mobile) |
| `AUDIT_ADMIN.md` | doc | Audit module admin |
| `AUDIT_COMPLET_2026.md` | doc | Audit complet 2026 |
| `AUDIT_EXHAUSTIF.md` | doc | Audit exhaustif |
| `AUDIT_FICHIERS_RESTANTS.md` | doc | Audit fichiers restants |
| `AUDIT_PLANS_3D.md` | doc | Audit plans 3D |
| `AUDIT_VARIABLES_ENV.md` | doc | **Audit variables d'environnement** |
| `build_out.txt` / `build_result.txt` | log | Logs de build |
| `capacitor.config.ts` | config | Configuration Capacitor (APK) |
| `database.rules.json` | config | Règles Firebase RTDB |
| `DIAGNOSTIC_FIREBASE_CONNEXION.md` | doc | Diagnostic connexion Firebase |
| `DIAGNOSTIC_TOUS_LES_FICHIERS.md` | doc | Diagnostic tous fichiers |
| `eslint.config.mjs` | config | ESLint |
| `firebase.json` | config | Config Firebase (database rules) |
| `google-services.json` | config | Config Firebase Android (⚠️ sensible) |
| `jest.config.ts` | config | Jest |
| `jest.setup.ts` | config | Setup Jest |
| `next-env.d.ts` | types | Déclarations Next.js |
| `next.config.ts` | config | Next.js |
| `package-lock.json` | lock | Verrouillage npm |
| `package.json` | manifest | Dépendances npm |
| `postcss.config.mjs` | config | PostCSS |
| `README.md` | doc | Documentation projet |
| `skills-lock.json` | config | Verrouillage skills |
| `tsconfig.json` | config | TypeScript |
| `tsconfig.tsbuildinfo` | cache | Cache compilation TS |
| `vercel.json` | config | Déploiement Vercel (crons) |

---

## 3. SOURCE `src/` — STRUCTURE

### 3.1 `src/app/` — Application Next.js (pages + routes)

**Pages publiques :**
| Fichier | Route |
|---------|-------|
| `app/page.tsx` | `/` |
| `app/globals.css` | Styles globaux |
| `app/layout.tsx` | Layout racine |
| `app/(auth)/login/page.tsx` | `/login` |
| `app/(auth)/register/page.tsx` | `/register` |
| `app/(auth)/forgot-password/page.tsx` | `/forgot-password` |
| `app/(tabs)/devis/page.tsx` | `/devis` |
| `app/(tabs)/messages/page.tsx` | `/messages` |
| `app/(tabs)/profil/page.tsx` | `/profil` |
| `app/(tabs)/projets/page.tsx` | `/projets` |
| `app/a-propos/page.tsx` | `/a-propos` |
| `app/assistant-chat/page.tsx` | `/assistant-chat` |
| `app/catalogue-materiaux/page.tsx` | `/catalogue-materiaux` |
| `app/chantier-en-cours/page.tsx` | `/chantier-en-cours` |
| `app/conditions/page.tsx` | `/conditions` |
| `app/confidentialite/page.tsx` | `/confidentialite` |
| `app/dashboard/page.tsx` | `/dashboard` |
| `app/faq/page.tsx` | `/faq` |
| `app/historique/page.tsx` | `/historique` |
| `app/make-me-admin/page.tsx` | `/make-me-admin` |
| `app/notifications/page.tsx` | `/notifications` |
| `app/nouveau-chantier/page.tsx` | `/nouveau-chantier` |
| `app/paiement/page.tsx` | `/paiement` |
| `app/parametres/page.tsx` | `/parametres` |
| `app/plan-rapide/page.tsx` | `/plan-rapide` |
| `app/recherche/page.tsx` | `/recherche` |
| `app/renovation/page.tsx` | `/renovation` |
| `app/scanner/page.tsx` | `/scanner` |
| `app/services-google/page.tsx` | `/services-google` |
| `app/services-renovation/page.tsx` | `/services-renovation` |
| `app/simulation/page.tsx` | `/simulation` |
| `app/support/page.tsx` | `/support` |

**Pages dynamiques :**
| Fichier | Route |
|---------|-------|
| `app/chantier/[id]/page.tsx` | `/chantier/[id]` |
| `app/chantier/[id]/ChantierDetailClient.tsx` | composant client |
| `app/chantier/[id]/sections/ChantierAlbum.tsx` | album |
| `app/chantier/[id]/sections/ChantierAvancement.tsx` | avancement |
| `app/chantier/[id]/sections/ChantierDocuments.tsx` | documents |
| `app/chantier/[id]/sections/ChantierHeader.tsx` | header |
| `app/chantier/[id]/sections/ChantierLightbox.tsx` | lightbox |
| `app/chantier/[id]/sections/ChantierMessagerie.tsx` | messagerie |
| `app/chantier/[id]/sections/ChantierNotes.tsx` | notes |
| `app/chantier/[id]/sections/ChantierPaiementsSection.tsx` | paiements |
| `app/chantier/[id]/sections/ChantierPasseport.tsx` | passeport |
| `app/chantier/[id]/sections/ChantierPhotos.tsx` | photos |
| `app/chantier/[id]/sections/ChantierPlanning.tsx` | planning |
| `app/chantier/[id]/sections/ChantierRapports.tsx` | rapports |
| `app/chantier/[id]/sections/ChantierRendezVous.tsx` | rendez-vous |
| `app/chantier/[id]/sections/ChantierResume.tsx` | résumé |
| `app/chantier/[id]/sections/ChantierTabs.tsx` | onglets |
| `app/renovation-en-cours/[id]/page.tsx` | `/renovation-en-cours/[id]` |

**Pages admin :**
| Fichier | Route |
|---------|-------|
| `app/admin/layout.tsx` | Layout admin |
| `app/admin/page.tsx` | `/admin` |
| `app/admin/AdminLayoutClient.tsx` | Layout client |
| `app/admin/annonces/page.tsx` | `/admin/annonces` |
| `app/admin/calendar/page.tsx` | `/admin/calendar` |
| `app/admin/chantier/[id]/page.tsx` | `/admin/chantier/[id]` |
| `app/admin/chantier/[id]/DocumentsSection.tsx` | documents |
| `app/admin/chantier/[id]/PaiementsSection.tsx` | paiements |
| `app/admin/chantiers/assigner/page.tsx` | assignateur |
| `app/admin/chantiers/nouveau/page.tsx` | nouveau chantier |
| `app/admin/clients/page.tsx` | `/admin/clients` |
| `app/admin/dashboard/page.tsx` | `/admin/dashboard` |
| `app/admin/messages/page.tsx` | `/admin/messages` |
| `app/admin/parametres/page.tsx` | `/admin/parametres` |
| `app/admin/renovation/[uid]/[demandeId]/page.tsx` | rénovation détail |
| `app/admin/renovations/page.tsx` | `/admin/renovations` |

**API routes (`src/app/api/`) :**
| Fichier | Méthode(s) |
|---------|-----------|
| `api/auth/check-admin/route.ts` | GET + POST |
| `api/auth/logout/route.ts` | POST |
| `api/auth/make-admin/route.ts` | POST |
| `api/auth/register/route.ts` | POST |
| `api/chat/route.ts` | POST |
| `api/cron/cleanup-medias/route.ts` | POST |
| `api/cron/rappel-rdv/route.ts` | POST |

**Dashboard sections :**
| Fichier |
|---------|
| `app/dashboard/sections/DashboardChantiersList.tsx` |
| `app/dashboard/sections/DashboardHeader.tsx` |

---

### 3.2 `src/components/` — Composants

**Composants racine :**
- `ChatBot.tsx`, `ErrorBoundary.tsx`, `LazySection.tsx`, `QueryProvider.tsx`, `ServiceWorkerRegister.tsx`

**admin/ :**
- `AlbumChantierAdmin.tsx`, `ChantierMessaging.tsx`, `GestionEquipeHierarchique.tsx`

**auth/ :**
- `AdminSecretModal.tsx` (corrigé — faille de sécurité résolue)

**background/ :**
- `FallbackBackground.tsx`

**btp/ (BTP design) :**
- `BtpBackground.tsx`, `BtpDustParticles.tsx`, `BtpLoader.tsx`, `BtpPageBackground.tsx`, `SuperCalculateur.tsx`, `WeatherWidget.tsx`

**catalogue/ :**
- `CarteMateriau.tsx`, `PanierCatalogue.tsx`

**chantier/ :**
- `AlbumChantier.tsx`, `AvancementParEtapes.tsx`, `ClientRendezVous.tsx`, `EquipeHierarchiqueClient.tsx`, `EstimateurChantier.tsx`, `StatsResume.tsx`

**layout/ :**
- `BottomNav.tsx`, `FeaturePage.tsx`, `LayoutWrapper.tsx`, `PageBackground.tsx`, `PremiumBackground.tsx`, `PremiumHeader.tsx`, `ScreenWrapper.tsx`, `Sidebar.tsx`, `ThemeToggle.tsx`, `WhatsAppButton.tsx`

**nouveau-chantier/ :**
- `NouveauChantierFormulaire.tsx`, `NouveauChantierHero.tsx`, `NouveauChantierTimeline.tsx`

**plans/ :**
- `PlanGenerator.tsx`

**services-renovation/ :**
- `RendezVousModal.tsx`, `RenovationCalculator.tsx`, `RenovationHero.tsx`, `ServiceCard.tsx`

**simulation/ :**
- `HouseModel3D.tsx`, `PlanGenerator2D.tsx`, `PlanGenerator3D.tsx`, `PlanViewer.tsx`

**ui/ :**
- `ActionBtn.tsx`, `AnnonceTicker.tsx`, `BackButton.tsx`, `Badge.tsx`, `EmptyState.tsx`, `GenerateContractButton.tsx`, `GenerateReceiptButton.tsx`, `GoogleIcon.tsx`, `LockedTab.tsx`, `MateriauSelector.tsx`, `NotificationBell.tsx`, `PlanPreview2D.tsx`, `PremiumButton.tsx`, `PremiumCard.tsx`, `PremiumInput.tsx`, `ProgressBar.tsx`, `SignaturePad.tsx`

**_deprecated/ (obsolète, à nettoyer) :**
- `AndroidBackHandler.tsx`, `AuthScreen.tsx`, `BreakingNewsTicker.tsx`, `InfoTicker.tsx`, `PageBackground.background.tsx`, `PremiumBackground.background.tsx`, `ProjectCard.tsx`, `QuoteCard.tsx`, `RenovationCalculator.app.tsx`, `ThemeToggle.ui.tsx`

---

### 3.3 `src/constants/`
- `animations.ts`, `materiaux.ts`, `routes.ts`, `theme.ts`, `villes.ts`

### 3.4 `src/contexts/`
- `AuthContext.tsx`, `ThemeContext.tsx`

### 3.5 `src/data/`
- `chantiers.ts`, `faq.json`, `materiaux.ts`, `photos-chantier.ts`, `plans.json`, `services.ts`, `tarifs.json`
- `_deprecated/materiaux.json`, `_deprecated/villes.json`

### 3.6 `src/hooks/`
- `useAndroidBackButton.ts`, `useAuth.ts`, `useChantiers.ts`, `useChantiersQuery.ts`, `useCurrencyFormatter.ts`, `useFirebaseQuery.ts`, `useRenovationsQuery.ts`, `useRenovationSubmit.ts`, `useTheme.ts`

### 3.7 `src/lib/`
- `cloudinary.ts`, `cron-auth.ts`, `documents-templates.ts`, `firebase-admin.ts`, `firebase.ts`, `generateContractPDF.ts`, `generateReceiptPDF.ts`, `helpers.ts`, `notifications.ts`, `plan-templates.ts`, `prix-btp.ts`, `register-sw.ts`, `rtdb.ts`, `security.ts`, `ui-constants.ts`, `validation.ts`
- `plans/storage.ts`

### 3.8 `src/services/`
- `batizen.ts`, `EstimationEngine.ts`, `google.ts`, `PlanEngine.ts`, `RenovationEngine.ts`

### 3.9 `src/stores/`
- `simulationStore.ts`

### 3.10 `src/theme/`
- `index.ts`

### 3.11 `src/types/`
- `batizen.ts`, `chantier.ts`, `plan.ts`

### 3.12 `src/utils/`
- `calculations.ts`, `chantier-helpers.tsx`, `currency.ts`, `formatDate.ts`, `formatters.ts`, `logger.ts`, `permissions.ts`, `renovation-helpers.ts`, `validators.ts`

---

## 4. `scripts/` — Scripts Node.js

| Fichier | Rôle |
|---------|------|
| `set-admin-role.js` | Définir le rôle admin |
| `migrate-service-account.js` | Migration service account |
| `fix-imports.js` | Fixer les imports |
| `fix-all-imports.js` | Fixer tous les imports |
| `unify-firebase-imports.js` | Unifier les imports Firebase |

---

## 5. `public/` — PWA et assets statiques

| Fichier | Rôle |
|---------|------|
| `favicon.png` / `favicon.svg` | Favicons |
| `icon-192x192.png` / `icon-512x512.png` | Icônes PWA |
| `manifest.json` / `manifest.webmanifest` | Manifest PWA |
| `sw.js` | Service Worker |
| `assets/` / `images/` | Dossiers assets |

---

## 6. `__tests__/` — Tests Jest

| Fichier | Teste |
|---------|-------|
| `api/check-admin.test.ts` | Route check-admin |
| `lib/validation.test.ts` | Schémas de validation |
| `services/PlanEngine.test.ts` | Moteur de plans |
| `services/EstimationEngine.test.ts` | Moteur d'estimation |

---

## 7. `functions/` — Cloud Functions

| Fichier | Rôle |
|---------|------|
| `package.json` | Dépendances Functions |
| `src/index.ts` | Code Functions |

---

## 8. `docs/` — Documentation (44 fichiers)

`ANNONCES_ADDED`, `APK_GENERATION`, `AUDIT_COMPLET`, `AUDIT_FIX`, `BATIZEN_ANIMATION_SYSTEM`, `BATIZEN_COMPONENT_RULES`, `BATIZEN_DESIGN_BIBLE`, `BATIZEN_DEVELOPMENT_RULES`, `BATIZEN_FOLDER_RULES`, `BATIZEN_ICON_GUIDE`, `BATIZEN_IMAGE_GUIDE`, `BATIZEN_LOGO_RULES`, `BATIZEN_MASTER_PROMPT`, `BATIZEN_PERFORMANCE`, `BATIZEN_SCREEN_RULES`, `BATIZEN_UI_REVIEW`, `BATIZEN_UI_SYSTEM`, `BILAN`, `CLA`, `CLEANUP_REPORT`, `CORRECTION_COULEURS`, `CORRECTIONS_3_PROBLEMES`, `CORRECTIONS_APPLIQUEES`, `DIAGNOSTIC`, `DIAGNOSTIC_ADMIN`, `DIAGNOSTIC_COMPLET`, `DIAGNOSTIC_ELEMENTS_MANQUANTS`, `DIAGNOSTIC_FIREBASE`, `FINAL_AUDIT`, `FIREBASE_CORRECTED`, `GUIDE_DE_CODE_BATIZEN`, `IMPORT_FIX`, `INVENTAIRE_UPLOADS_COMPLET`, `INVENTORY_REPORT`, `RAPPORT_FINAL`, `RAPPORT_MOBILE_FIRST`, `RAPPORT_PROFOND`, `REORG_REPORT`, `RESTORE_DESIGN`, `RESTORE_HOMEPAGE`, `todo-apk`, `UNIFIED_IMPORTS` (tous `.md`)

---

## 9. Fichiers sensibles / ignorés git

| Fichier | Statut git | Risque |
|---------|-----------|--------|
| `.env.local` | Ignoré | Système — contient secrets (MAKE_ME_ADMIN_SECRET, GEMINI_API_KEY, CRON_SECRET) |
| `.secrets/` | Ignoré (sauf .gitkeep) | Firefox service account JSON |
| `google-services.json` | ⚠️ À vérifier | Config Firebase Android |
| `.firebaserc` | Non suivi | Alias Firebase |

---

## 10. Notes importantes issues du travail effectué

1. **Sécurité admin corrigée** : `AdminSecretModal.tsx` ne contient plus le secret en dur `batizen2022` ; il appelle désormais `POST /api/auth/make-admin`.
2. **Conflit ESM/CJS résolu** : `overrides: { "jose": "^4.15.9" }` dans `package.json` pour garantir `jose@4.15.9` compatible CJS+ESM.
3. **npx tsc --noEmit** : **passe sans erreur** (l'installation a été réparée après plusieurs timeouts).
4. **Routes API** : retournent du JSON (200/503), jamais de HTML.
5. **Dépôts** : commits poussés sur `origin/main` (jusqu'au `382ea8e`).