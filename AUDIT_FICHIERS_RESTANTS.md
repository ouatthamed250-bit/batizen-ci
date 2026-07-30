# 📋 AUDIT DES FICHIERS RESTANTS — BÂTIZEN CI

## Fichiers déjà audités (35 fichiers, ne pas ré-auditer)

- `src/hooks/useAuth.ts`, `useChantiers.ts`, `useTheme.ts`, `useChantiersQuery.ts`, `useFirebaseQuery.ts`, `useRenovationsQuery.ts`, `useRenovationSubmit.ts`, `useCurrencyFormatter.ts`, `useAndroidBackButton.ts`
- `src/contexts/AuthContext.tsx`, `ThemeContext.tsx`
- `src/lib/firebase.ts`, `firebase-admin.ts`, `security.ts`, `validation.ts`, `cloudinary.ts`, `cron-auth.ts`, `rtdb.ts`, `notifications.ts`, `logger.ts`, `register-sw.ts`, `helpers.ts`, `ui-constants.ts`
- `src/services/PlanEngine.ts`, `EstimationEngine.ts`, `batizen.ts`
- `src/components/ChatBot.tsx`, `PlanGenerator3D.tsx`, `PlanGenerator2D.tsx`, `PlanPreview2D.tsx`, `LayoutWrapper.tsx`, `PremiumBackground.tsx`, `PremiumHeader.tsx`, `ErrorBoundary.tsx`, `LazySection.tsx`, `QueryProvider.tsx`, `ServiceWorkerRegister.tsx`
- `src/app/page.tsx`, `simulation/page.tsx`, `plan-rapide/page.tsx`, `dashboard/page.tsx`, `login/page.tsx`, `register/page.tsx`, `layout.tsx`
- `src/proxy.ts`
- `src/types/chantier.ts`, `batizen.ts`, `plan.ts`
- `src/stores/simulationStore.ts`

---

## Fichiers restants à auditer (~100 fichiers)

### Groupe A : Composants UI (src/components/ui/) — 17 fichiers

| Fichier | Lignes | Problèmes potentiels |
|---------|--------|---------------------|
| `ActionBtn.tsx` | ~20 | Faible risque — composant simple |
| `AnnonceTicker.tsx` | ~30 | Faible risque — ticker d'annonces |
| `BackButton.tsx` | ~15 | Faible risque — bouton retour |
| `Badge.tsx` | ~15 | Faible risque — badge |
| `EmptyState.tsx` | ~30 | ✅ Déjà audité via le review |
| `GenerateContractButton.tsx` | ~40 | `any` potentiel, `console.error` possible |
| `GenerateReceiptButton.tsx` | ~40 | `any` potentiel, `console.error` possible |
| `GoogleIcon.tsx` | ~10 | Faible risque — SVG Google |
| `LockedTab.tsx` | ~20 | Faible risque — onglet verrouillé |
| `MateriauSelector.tsx` | ~60 | `any` potentiel (sélection de matériaux) |
| `NotificationBell.tsx` | ~40 | `any` possible |
| `PremiumButton.tsx` | ~30 | Faible risque — bouton stylisé |
| `PremiumCard.tsx` | ~25 | Faible risque — carte stylisée |
| `PremiumInput.tsx` | ~25 | Faible risque — input stylisé |
| `ProgressBar.tsx` | ~20 | Faible risque — barre de progression |
| `SignaturePad.tsx` | ~50 | `any` potentiel (canvas, events) |
| `PlanPreview2D.tsx` | 44 | ✅ Déjà audité |

### Groupe B : Layout (src/components/layout/) — 6 fichiers

| Fichier | Lignes | Problèmes potentiels |
|---------|--------|---------------------|
| `BottomNav.tsx` | ~120 | ✅ Vérifié (text-white protégé dark:) |
| `FeaturePage.tsx` | ~60 | Faible risque |
| `PageBackground.tsx` | ~40 | Faible risque |
| `ScreenWrapper.tsx` | ~30 | Faible risque |
| `Sidebar.tsx` | ~230 | `any` possible, console.log possible |
| `ThemeToggle.tsx` | ~20 | Faible risque |
| `WhatsAppButton.tsx` | ~20 | Faible risque |

### Groupe C : Pages admin (src/app/admin/) — 12 fichiers

| Fichier | Lignes | Problèmes potentiels |
|---------|--------|---------------------|
| `page.tsx` (admin/) | ~100 | Dashboard admin — `any`, console |
| `layout.tsx` (admin/) | ~30 | Layout admin avec Sidebar |
| `AdminLayoutClient.tsx` | ~20 | Client wrapper |
| `dashboard/page.tsx` (admin/) | ~150 | Stats admin — `any` potentiel |
| `chantiers/nouveau/page.tsx` | ~200 | Formulaire création — `any` |
| `chantiers/assigner/page.tsx` | ~100 | Assignation — `any` |
| `chantier/[id]/page.tsx` | ~200 | Détail chantier — `any` |
| `clients/page.tsx` | ~100 | Liste clients — `any` |
| `messages/page.tsx` | ~100 | Messagerie admin — `any` |
| `annonces/page.tsx` | ~100 | Annonces — `any` |
| `parametres/page.tsx` | ~100 | Paramètres — `any` |
| `calendar/page.tsx` | ~100 | Calendrier — `any` |
| `renovations/page.tsx` | ~100 | Rénovations admin — `any` |
| `renovation/[uid]/[demandeId]/page.tsx` | ~100 | Détail rénovation — `any` |

### Groupe D : Pages chantier client (src/app/chantier/[id]/) — 13 fichiers

| Fichier | Lignes | Problèmes potentiels |
|---------|--------|---------------------|
| `page.tsx` | ~50 | Page chantier client |
| `ChantierDetailClient.tsx` | ~150 | Détail avec Tabs — `any` |
| `sections/ChantierTabs.tsx` | ~150 | Navigation tabs — `any` |
| `sections/ChantierHeader.tsx` | ~80 | En-tête — `any` |
| `sections/ChantierResume.tsx` | ~100 | Résumé — `any` |
| `sections/ChantierAvancement.tsx` | ~150 | Avancement — `any` |
| `sections/ChantierPlanning.tsx` | ~100 | Planning — `any` |
| `sections/ChantierRendezVous.tsx` | ~100 | Rendez-vous — `any` |
| `sections/ChantierPhotos.tsx` | ~100 | Photos — `any` |
| `sections/ChantierAlbum.tsx` | ~100 | Album — `any` |
| `sections/ChantierPaiementsSection.tsx` | ~100 | Paiements — `any` |
| `sections/ChantierMessagerie.tsx` | ~100 | Messagerie — `any` |
| `sections/ChantierDocuments.tsx` | ~100 | Documents — `any` |
| `sections/ChantierNotes.tsx` | ~50 | Notes — `any` |
| `sections/ChantierRapports.tsx` | ~50 | Rapports — `any` |
| `sections/ChantierLightbox.tsx` | ~30 | Lightbox — `any` |
| `sections/ChantierPasseport.tsx` | ~30 | Passeport — `any` |

### Groupe E : Pages tabs et autres pages — 15 fichiers

| Fichier | Lignes | Problèmes potentiels |
|---------|--------|---------------------|
| `(tabs)/projets/page.tsx` | ~100 | Projets client — `any` |
| `(tabs)/devis/page.tsx` | ~100 | Devis — `any` |
| `(tabs)/profil/page.tsx` | ~200 | Profil — `any` |
| `(tabs)/messages/page.tsx` | 64 | ✅ Vérifié (utilise `getMessages`) |
| `a-propos/page.tsx` | ~50 | Page statique |
| `faq/page.tsx` | ~50 | Page FAQ |
| `confidentialite/page.tsx` | ~50 | Mentions légales |
| `conditions/page.tsx` | ~50 | CGV |
| `support/page.tsx` | ~100 | Support — `any` possible |
| `notifications/page.tsx` | ~100 | Notifications — `any` possible |
| `parametres/page.tsx` | ~100 | Paramètres — `any` possible |
| `historique/page.tsx` | ~50 | Historique — `any` possible |
| `scanner/page.tsx` | ~100 | Scanner — `any` |
| `recherche/page.tsx` | ~100 | Recherche — `any` |
| `paiement/page.tsx` | ~100 | Paiement — `any` |

### Groupe F : Composants métier — 18 fichiers

| Fichier | Lignes | Problèmes potentiels |
|---------|--------|---------------------|
| `admin/ChantierMessaging.tsx` | ~150 | `any`, console log |
| `admin/AlbumChantierAdmin.tsx` | ~100 | `any` |
| `admin/GestionEquipeHierarchique.tsx` | ~200 | `any`, logique complexe |
| `auth/AdminSecretModal.tsx` | ~100 | Modal admin — `any` |
| `btp/SuperCalculateur.tsx` | ~300 | **Prioritaire** — `any`, console.log |
| `btp/BtpBackground.tsx` | ~40 | Fond BTP — faible risque |
| `btp/BtpDustParticles.tsx` | ~60 | Particules — `any` possible |
| `btp/BtpLoader.tsx` | ~30 | Loader — faible risque |
| `btp/BtpPageBackground.tsx` | ~40 | Fond page — faible risque |
| `btp/WeatherWidget.tsx` | ~80 | Météo — `any` possible |
| `chantier/AvancementParEtapes.tsx` | ~150 | `any` |
| `chantier/AlbumChantier.tsx` | ~100 | `any` |
| `chantier/ClientRendezVous.tsx` | ~100 | `any` |
| `chantier/EquipeHierarchiqueClient.tsx` | ~100 | `any` |
| `chantier/EstimateurChantier.tsx` | ~200 | `any` — **Prioritaire** |
| `chantier/StatsResume.tsx` | ~100 | `any` |
| `catalogue/CarteMateriau.tsx` | ~80 | `any` |
| `catalogue/PanierCatalogue.tsx` | ~100 | `any` |
| `nouveau-chantier/NouveauChantierFormulaire.tsx` | ~300 | **Prioritaire** — `any`, logique complexe |
| `nouveau-chantier/NouveauChantierHero.tsx` | ~50 | Faible risque |
| `nouveau-chantier/NouveauChantierTimeline.tsx` | ~80 | `any` |

---

## 🔴 Top 10 des fichiers les plus risqués (non audités)

| # | Fichier | Raison |
|---|---------|--------|
| 1 | `btp/SuperCalculateur.tsx` | Logique BTP complexe, ~300 lignes, `any` probable |
| 2 | `chantier/EstimateurChantier.tsx` | Estimation chantier, ~200 lignes |
| 3 | `nouveau-chantier/NouveauChantierFormulaire.tsx` | Formulaire complexe, ~300 lignes |
| 4 | `admin/dashboard/page.tsx` | Dashboard admin, ~150 lignes |
| 5 | `dashboard/sections/DashboardChantiersList.tsx` | Liste chantiers, `any` |
| 6 | `dashboard/sections/DashboardHeader.tsx` | Header dashboard |
| 7 | `admin/GestionEquipeHierarchique.tsx` | Logique hiérarchique, ~200 lignes |
| 8 | `(tabs)/profil/page.tsx` | Profil, ~200 lignes |
| 9 | `chantier/[id]/ChantierDetailClient.tsx` | Détail chantier, ~150 lignes |
| 10 | `lib/plan-templates.ts` | Templates SVG — pourrait avoir des patterns `any` |

---

## Résumé

| Catégorie | Fichiers | Non audités | Risque |
|-----------|----------|-------------|--------|
| Composants UI | 17 | 16 | 🟢 Faible |
| Layout | 7 | 2 | 🟢 Faible |
| Pages admin | 14 | 14 | 🟡 Moyen |
| Pages chantier | 17 | 17 | 🟡 Moyen |
| Pages tabs/autres | 15 | 14 | 🟡 Moyen |
| Composants métier | 21 | 21 | 🔴 Élevé |
| **Total** | **~100** | **~85** | |

*Rapport généré le 30/07/2026 — Audit rapide sans lecture approfondie des fichiers*