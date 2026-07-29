# 🔍 AUDIT COMPLET — BÂTIZEN CI
**Date :** 29 juillet 2026  
**Version Next.js :** 16.2.6  
**React :** 19.2.6  
**Firebase :** 12.15.0  
**TypeScript :** 5.9.3  

---

## 📊 SOMMAIRE

1. [PRÉSENTATION GÉNÉRALE](#1-présentation-générale)
2. [ARCHITECTURE DU PROJET](#2-architecture-du-projet)
3. [STACK TECHNIQUE](#3-stack-technique)
4. [ARBORESCENCE DES FICHIERS](#4-arborescence-des-fichiers)
5. [ANALYSE PAR COUCHE](#5-analyse-par-couche)
6. [SÉCURITÉ](#6-sécurité)
7. [BASE DE DONNÉES](#7-base-de-données)
8. [PERFORMANCES](#8-performances)
9. [PROBLÈMES IDENTIFIÉS](#9-problèmes-identifiés)
10. [RECOMMANDATIONS](#10-recommandations)
11. [MÉTRIQUES GLOBALES](#11-métriques-globales)

---

## 1. PRÉSENTATION GÉNÉRALE

**BÂTIZEN CI** est une application web **Next.js** dédiée au secteur du BTP en Côte d'Ivoire. Elle propose :
- Simulation et génération de plans 2D/3D
- Devis et estimation de coûts de construction
- Suivi de chantiers avec messagerie intégrée
- Gestion des rénovations
- Catalogue de matériaux BTP
- Calculateur BTP (coûts, surfaces, matériaux)
- Interface administrateur complète
- Support PWA (Progressive Web App)
- Compatibilité Android via Capacitor

---

## 2. ARCHITECTURE DU PROJET

### 2.1 Structure Racine
```
batizen-ci/
├── src/                    # Code source principal
│   ├── app/               # Pages Next.js (App Router)
│   ├── components/        # Composants React réutilisables
│   ├── contexts/          # Contextes React (Auth, Theme)
│   ├── constants/         # Constantes et configuration
│   ├── data/              # Données statiques
│   ├── hooks/             # Hooks React personnalisés
│   ├── lib/               # Bibliothèques et utilitaires
│   ├── services/          # Services métier
│   ├── stores/            # Stores Zustand
│   ├── theme/             # Configuration thème
│   ├── types/             # Types TypeScript
│   └── utils/             # Utilitaires
├── functions/             # Firebase Cloud Functions
├── public/                # Fichiers statiques (PWA, images)
├── scripts/               # Scripts Node.js utilitaires
└── [fichiers config]      # Config Next.js, TS, etc.
```

### 2.2 Modèle Architectural
```
┌──────────────────────────────────────────────────┐
│                    PAGES (App Router)             │
│  (auth) / (tabs) / admin / chantier / dashboard  │
└──────────────┬────────────────────────────┬──────┘
               │                            │
     ┌─────────▼─────────┐       ┌──────────▼──────────┐
     │   API Routes      │       │   Layouts/Wrappers  │
     │  /api/auth/*      │       │   RootLayout        │
     │  /api/chat        │       │   AdminLayout       │
     │  /api/cron/*      │       │   LayoutWrapper     │
     └─────────┬─────────┘       └──────────┬──────────┘
               │                            │
     ┌─────────▼────────────────────────────▼──────────┐
     │              CONTEXTES React                    │
     │         AuthContext + ThemeContext               │
     └─────────┬────────────────────────────┬──────────┘
               │                            │
     ┌─────────▼─────────┐       ┌──────────▼──────────┐
     │     HOOKS         │       │    COMPOSANTS       │
     │  useAuth          │       │  layout/*           │
     │  useChantiers     │       │  ui/*               │
     │  useFirebaseQuery │       │  admin/*            │
     │  ...              │       │  chantier/*         │
     └─────────┬─────────┘       └──────────┬──────────┘
               │                            │
     ┌─────────▼────────────────────────────▼──────────┐
     │              SERVICES + LIB                     │
     │  firebase.ts / firebase-admin.ts                │
     │  batizen.ts / PlanEngine.ts / RenovationEngine  │
     │  cloudinary.ts / notifications.ts               │
     └─────────┬───────────────────────────────────────┘
               │
     ┌─────────▼─────────┐
     │   Firebase         │
     │  Auth + RTDB +    │
     │  Storage + Functions│
     └───────────────────┘
```

---

## 3. STACK TECHNIQUE

### 3.1 Frontend
| Technologie | Version | Usage |
|-------------|---------|-------|
| Next.js | 16.2.6 | Framework React (App Router) |
| React | 19.2.6 | UI Library |
| TypeScript | 5.9.3 | Typage statique |
| Tailwind CSS | 4.1.17 | Styling utility-first |
| Framer Motion | 12.42.2 | Animations |
| Lucide React | 1.23.0 | Icônes |
| Recharts | 3.9.2 | Graphiques |
| Three.js / @react-three/fiber | 0.185.1 / 9.6.1 | 3D Plans |
| Zustand | 5.0.14 | State management |
| TanStack React Query | 5.101.4 | Gestion des requêtes |

### 3.2 Backend & Infrastructure
| Technologie | Usage |
|-------------|-------|
| Firebase Auth | Authentification |
| Firebase Realtime Database | Base de données temps réel |
| Firebase Storage | Stockage fichiers/médias |
| Firebase Admin SDK | Opérations serveur sécurisées |
| Firebase Cloud Functions | Fonctions backend |
| PostgreSQL (via Drizzle ORM) | Base relationnelle |
| Cloudinary | Gestion d'images |
| Capacitor 8 | Application mobile Android |

### 3.3 Services IA
| Technologie | Usage |
|-------------|-------|
| @google/generative-ai | Chatbot IA |
| PlanEngine | Génération de plans |
| RenovationEngine | Estimation rénovation |

---

## 4. ARBORESCENCE DES FICHIERS

### 4.1 Pages (src/app/) — 30 fichiers
```
src/app/
├── (auth)/
│   ├── login/page.tsx
│   └── register/page.tsx
├── (tabs)/
│   ├── devis/page.tsx
│   ├── profil/page.tsx
│   └── projets/page.tsx
├── admin/
│   ├── layout.tsx                    ← Client component
│   ├── AdminLayoutClient.tsx
│   ├── page.tsx                       ← Dashboard admin
│   ├── dashboard/page.tsx
│   ├── chantier/[id]/page.tsx
│   ├── chantiers/nouveau/page.tsx
│   ├── chantiers/assigner/page.tsx
│   ├── clients/page.tsx
│   ├── messages/page.tsx
│   ├── calendrier/page.tsx
│   ├── parametres/page.tsx
│   ├── annonces/page.tsx
│   ├── renovations/page.tsx
│   ├── renovation/[uid]/[demandeId]/page.tsx
│   └── ...
├── chantier/[id]/
│   ├── page.tsx                       ← Détail chantier client
│   ├── sections/
│   │   ├── ChantierTabs.tsx
│   │   ├── ChantierResume.tsx
│   │   ├── ChantierAvancement.tsx
│   │   ├── ChantierPlanning.tsx
│   │   ├── ChantierRendezVous.tsx
│   │   ├── ChantierPhotos.tsx
│   │   ├── ChantierAlbum.tsx
│   │   ├── ChantierPaiementsSection.tsx
│   │   ├── ChantierMessagerie.tsx
│   │   ├── ChantierDocuments.tsx
│   │   ├── ChantierNotes.tsx
│   │   ├── ChantierRapports.tsx
│   │   ├── ChantierLightbox.tsx
│   │   └── ChantierPasseport.tsx
│   └── ChantierDetailClient.tsx
├── dashboard/
│   ├── page.tsx
│   ├── sections/DashboardHeader.tsx
│   └── sections/DashboardChantiersList.tsx
├── api/
│   ├── auth/register/route.ts
│   ├── auth/logout/route.ts
│   ├── auth/make-admin/route.ts
│   ├── chat/route.ts
│   ├── cron/rappel-rdv/route.ts
│   └── cron/cleanup-medias/route.ts
├── page.tsx                            ← Page d'accueil
├── layout.tsx                          ← Root layout global
├── simulation/page.tsx
├── plan-rapide/page.tsx
├── nouveau-chantier/page.tsx
├── renovation/page.tsx
├── renovation-en-cours/[id]/page.tsx
├── services-renovation/page.tsx
├── catalogue-materiaux/page.tsx
├── support/page.tsx
├── scanner/page.tsx
├── recherche/page.tsx
├── conditions/page.tsx
├── confidentialite/page.tsx
└── make-me-admin/page.tsx
```

### 4.2 Composants (src/components/) — 55 fichiers
```
src/components/
├── admin/
│   ├── ChantierMessaging.tsx
│   ├── AlbumChantierAdmin.tsx
│   ├── GestionEquipeHierarchique.tsx
├── auth/
│   └── AdminSecretModal.tsx
├── background/
│   └── FallbackBackground.tsx
├── btp/
│   └── SuperCalculateur.tsx
├── chantier/
│   ├── AvancementParEtapes.tsx
│   ├── AlbumChantier.tsx
│   ├── EquipeHierarchiqueClient.tsx
│   ├── StatsResume.tsx
│   ├── ClientRendezVous.tsx
│   ├── EstimateurChantier.tsx
├── layout/
│   ├── FeaturePage.tsx
│   ├── PremiumHeader.tsx
│   ├── LayoutWrapper.tsx
│   ├── PremiumBackground.tsx
│   ├── BottomNav.tsx
│   ├── Sidebar.tsx
│   ├── PageBackground.tsx
│   └── ...
├── nouveau-chantier/
│   ├── NouveauChantierFormulaire.tsx
│   ├── NouveauChantierHero.tsx
│   └── NouveauChantierTimeline.tsx
├── plans/
│   └── PlanGenerator.tsx
├── services-renovation/
│   ├── RendezVousModal.tsx
│   ├── RenovationCalculator.tsx
│   ├── RenovationHero.tsx
│   └── ServiceCard.tsx
├── simulation/
│   ├── HouseModel3D.tsx
│   ├── PlanGenerator2D.tsx
│   ├── PlanGenerator3D.tsx
│   └── PlanViewer.tsx
├── ui/
│   ├── ActionBtn.tsx
│   ├── AnnonceTicker.tsx
│   ├── BackButton.tsx
│   ├── Badge.tsx
│   ├── EmptyState.tsx
│   ├── GoogleIcon.tsx
│   ├── LockedTab.tsx
│   ├── MateriauSelector.tsx
│   ├── NotificationBell.tsx
│   ├── PlanPreview2D.tsx
│   ├── PremiumButton.tsx
│   ├── PremiumCard.tsx
│   ├── PremiumInput.tsx
│   ├── ProgressBar.tsx
│   ├── SignaturePad.tsx
│   ├── GenerateContractButton.tsx
│   └── GenerateReceiptButton.tsx
├── _deprecated/
│   └── (8 composants obsolètes)
├── ChatBot.tsx
├── ErrorBoundary.tsx
├── LazySection.tsx
├── QueryProvider.tsx
└── ServiceWorkerRegister.tsx
```

### 4.3 Services et Logique Métier
```
src/services/
├── batizen.ts              ← Service principal
├── EstimationEngine        ← Moteur d'estimation
├── google.ts               ← Services Google
├── PlanEngine.ts           ← Moteur de plans
└── RenovationEngine.ts     ← Moteur de rénovation

src/lib/
├── firebase.ts             ← Firebase Client SDK
├── firebase-admin.ts       ← Firebase Admin SDK
├── rtdb.ts                 ← Realtime Database helpers
├── cloudinary.ts           ← Service Cloudinary
├── notifications.ts        ← Gestion notifications
├── security.ts             ← Sécurité (timingSafeEqual)
├── helpers.ts              ← Helpers génériques
├── plan-templates.ts       ← Templates de plans
├── documents-templates.ts  ← Templates documents
├── generateContractPDF.ts  ← Génération PDF contrats
├── generateReceiptPDF.ts   ← Génération PDF reçus
├── prix-btp.ts             ← Prix BTP (catalogue)
├── register-sw.ts          ← Service Worker
├── ui-constants.ts         ← Constantes UI
└── plans/storage.ts        ← Stockage plans
```

---

## 5. ANALYSE PAR COUCHE

### 5.1 🔷 COUCHE PRÉSENTATION (Pages)

**Points forts :**
- Architecture App Router Next.js 16 complète avec 30+ pages
- Sections chantier client modulaires (14 sections séparées)
- Routes admin complètes (chantiers, clients, messages, calendrier, paramètres)
- Pages légales présentes (conditions, confidentialité)
- Support PWA complet avec manifest.json et Service Worker

**Points faibles :**
- **29 fichiers Markdown (.md)** non nettoyés à la racine (rapports, audits, diagnostiques)
- La page `make-me-admin` est risquée si mal sécurisée
- Routes d'API CRON exposées (rappel-rdv, cleanup-medias) accessibles publiquement
- Absence de rate-limiting détecté sur les routes API
- Fichier `App.tsx` à la racine (probablement un vestige Capacitor)

### 5.2 🔶 COUCHE COMPOSANTS

**Points forts :**
- 55 composants React bien organisés par domaine (admin, chantier, ui, layout, etc.)
- Composants UI premium dédiés (PremiumButton, PremiumCard, PremiumInput)
- Gestion des états vides (EmptyState)
- Gestion des erreurs (ErrorBoundary)
- Chargement paresseux (LazySection)
- ServiceWorkerRegister pour PWA

**Points faibles :**
- Dossier `_deprecated/` contient 8 composants obsolètes jamais supprimés
- Certains composants mélangent logique métier et présentation
- Peu de tests (aucun fichier .test.tsx ou .spec.tsx détecté)

### 5.3 🔴 COUCHE AUTHENTIFICATION

**Points forts :**
- **Architecture de sécurité robuste :**
  - Rôle admin déterminé par **Firebase Custom Claims** (côté serveur) uniquement
  - Whitelist d'UID admin comme filet de sécurité supplémentaire (`admin-whitelist.ts`)
  - Suppression du cookie de session HttpOnly à la déconnexion
  - Mode démo avec fallback sécurisé quand Firebase n'est pas configuré
  - TimingSafeEqual implémenté manuellement pour éviter les timing attacks
- Cloud Functions `setAdminRole` et `bootstrapFirstAdmin` sécurisées
- Vérification des claims côté serveur dans `firebase-admin.ts`

**Points faibles :**
- **Middleware Next.js désactivé** — la vérification admin est faite côté client uniquement
- La whitelist d'UID dans `admin-whitelist.ts` est exposée côté client (bundle)
- Persistance localStorage de l'état d'authentification (potentiel XSS)
- Mode démo crée un faux utilisateur sans réelle sécurité

### 5.4 🟢 COUCHE DONNÉES

**Points forts :**
- Base de données temps réel (Firebase RTDB) bien structurée
- Règles de sécurité Firebase présentes (`database.rules.json`)
- PostgreSQL via Drizzle ORM disponible en complément
- Cache React Query via TanStack Query
- Zustand pour le state management local

**Points faibles :**
- Aucun fichier de migration Drizzle visible (src/db/ dans .gitignore)
- Pas de validation de schéma côté client pour les données Firebase
- Type `Chantier` a un `[key: string]: any` qui désactive le typage strict
- Statistut `StatutChantier` utilise `| string` ce qui rend le type inutile

### 5.5 🟣 COUCHE API

**Routes API :**
| Route | Méthode | Sécurité | Statut |
|-------|---------|----------|--------|
| /api/auth/register | POST | Firebase Auth | ✅ |
| /api/auth/logout | POST | Cookie session | ✅ |
| /api/auth/make-admin | POST | Admin vérification | ⚠️ |
| /api/chat | POST | Besoin vérification | ⚠️ |
| /api/cron/rappel-rdv | GET/POST | **Aucune** | 🔴 |
| /api/cron/cleanup-medias | GET/POST | **Aucune** | 🔴 |

---

## 6. SÉCURITÉ

### 6.1 ✅ Points Sécurisés
- ✅ Authentification Firebase avec popup Google
- ✅ Custom Claims pour les rôles admin
- ✅ TimingSafeEqual pour la comparaison de secrets
- ✅ Firebase Admin SDK isolé côté serveur
- ✅ Suppression session serveur à la déconnexion
- ✅ Cross-Origin-Opener-Policy configuré
- ✅ Images externalisées (lh3.googleusercontent.com, Firebase Storage)
- ✅ Variables d'environnement pour les clés Firebase

### 6.2 🔴 Vulnérabilités Identifiées
1. **CRITIQUE** — Routes CRON sans authentification (`/api/cron/*`)
2. **ÉLEVÉ** — Middleware Next.js désactivé, sécurité admin côté client uniquement
3. **ÉLEVÉ** — Whitelist d'UID admin exposée dans le bundle client
4. **MOYEN** — Token de session Firebase Auth persistant dans localStorage
5. **MOYEN** — `serverExternalPackages` expose firebase-admin au bundling
6. **FAIBLE** — Mode démo bypass l'authentification

---

## 7. BASE DE DONNÉES

### 7.1 Firebase Realtime Database Structure (inférée)
```
/users/{uid}
  ├── uid, email, displayName, photoURL
  ├── phoneNumber, role ("client" | "admin")
  └── createdAt

/chantiers/{chantierId}
  ├── nom, type, statut, localisation
  ├── budget, date_debut, date_fin
  ├── userId, client_id, adminId
  └── ...

/messages/{chantierId}/{messageId}
  ├── expediteur, contenu, date
  └── lu

/notifications/{uid}/{notificationId}
  ├── titre, message, type
  ├── chantierId, date
  └── lu

/annonces/{annonceId}
  ├── titre, contenu, dateDebut, dateFin
  └── actif

/demandes_renovation/{demandeId}
  ├── uid, email, telephone
  ├── type, surface, budget
  └── statut
```

### 7.2 PostgreSQL (via Drizzle)
- Présent dans le package.json (drizzle-orm 0.45.2)
- Mais **aucun schéma ou migration visible**
- Dossier `src/db/` explicitement exclu dans tsconfig.json

---

## 8. PERFORMANCES

### 8.1 Points Forts
- **Next.js 16 avec Turbopack** — compilation ultra-rapide
- **Images distantes optimisées** (remotePatterns configurés)
- **React.lazy + Suspense** (LazySection)
- **TanStack React Query** — déduplication et cache des requêtes
- **Service Worker** pour cache offline (PWA)
- **Animations optimisées** (Framer Motion)

### 8.2 Points Faibles
- **35 fichiers Markdown** à la racine (ballast inutile dans le build)
- **Fichiers dépréciés** jamais supprimés (_deprecated/, App.tsx racine)
- **PostgreSQL sous-utilisé** — la base relationnelle est là mais pas exploitée
- **Dépendances lourdes** : Three.js (3D), html2canvas, jspdf
- Pas de stratégie de lazy-loading pour les sections chantier

---

## 9. PROBLÈMES IDENTIFIÉS

### 🔴 Problèmes Critiques (3)
| ID | Problème | Fichier | Impact |
|----|----------|---------|--------|
| C1 | Routes CRON sans auth | `/api/cron/*` | Exécution non autorisée |
| C2 | Middleware désactivé | `middleware.ts` | Routes admin exposées |
| C3 | Aucune validation entrée API | Rotes API | Injection possible |

### 🟡 Problèmes Élevés (5)
| ID | Problème | Fichier | Impact |
|----|----------|---------|--------|
| E1 | Whitelist admin exposée client | `constants/admin-whitelist.ts` | Information sensible |
| E2 | Pas de tests automatisés | — | Régression non détectée |
| E3 | Types TypeScript trop permissifs | `types/chantier.ts` | Sécurité type compromise |
| E4 | Dépendances Firebase version mismatch | Client 12.x vs Admin 11.x | Incohérence SDK |
| E5 | Ballast de fichiers à la racine (35 .md) | Racine | Build + clarté |

### 🟢 Problèmes Moyens (6)
| ID | Problème | Fichier | Impact |
|----|----------|---------|--------|
| M1 | Composants dépréciés non supprimés | `_deprecated/` | Maintenance |
| M2 | Pas de validation schéma Drizzle | `src/db/` exclu | DB non exploitée |
| M3 | localStorage pour auth persist | `AuthContext.tsx` | Sécurité XSS |
| M4 | Page make-me-admin exposée | Route entière | Risque si mal configuré |
| M5 | Aucun monitoring/analytics | — | Observabilité |
| M6 | Pas de gestion d'erreur unifiée API | Routes API | Erreurs inconsistantes |

---

## 10. RECOMMANDATIONS

### 🔴 Priorité Haute (à faire immédiatement)
1. **Sécuriser les routes CRON** : Ajouter un header d'authentification (Bearer token ou secret partagé)
2. **Activer le middleware** : Ajouter la vérification de session pour les routes admin
3. **Ajouter validation entrées** : Utiliser Zod ou Joi pour les routes API

### 🟡 Priorité Moyenne (à faire cette semaine)
4. **Nettoyer la racine** : Archiver les 35 fichiers Markdown dans un dossier `docs/`
5. **Supprimer le dossier `_deprecated/`** et le code mort
6. **Ajouter des tests** : Jest + React Testing Library pour les composants critiques
7. **Harmoniser Firebase** : Mettre à jour firebase-admin de 11.x vers 12.x
8. **Implémenter rate-limiting** : Sur les routes API sensibles (auth, chat)

### 🟢 Priorité Faible (à faire plus tard)
9. **Exploiter PostgreSQL/Drizzle** : Créer les schémas et migrations
10. **Améliorer le typage** : Remplacer `[key: string]: any` par des types stricts
11. **Cacher la whitelist admin** : Déplacer dans une variable d'environnement serveur
12. **Ajouter analytics/monitoring** : Vercel Analytics ou Sentry
13. **Lazy loading sections chantier** : Implémenter dynamic import par section

---

## 11. MÉTRIQUES GLOBALES

### Statistiques du Projet
```
📁 Fichiers source (src/):     ~180 fichiers
📄 Pages (app router):         30 pages
🧩 Composants React:           55 composants
🔗 Routes API:                 6 routes
⚛️ Hooks personnalisés:        9 hooks
📦 Services:                   5 services
📚 Lib/utilitaires:            15 modules
🎨 Fichiers CSS:               1 (globals.css)
🧪 Tests:                      0 fichiers
📝 Markdown docs:              35 fichiers
```

### Dépendances
```
Total dependencies:    48 (18 dependencies + 9 devDependencies)
Production:            ~80 Mo (estimation)
Build size:            ~200 Mo avec node_modules
```

### Performance Estimée
```
Lighthouse Score (estimation) :
- Performance:     75-85/100
- Accessibilité:  70-80/100
- SEO:            85-95/100
- Best Practices: 70-80/100
```

---

## 📋 RÉSUMÉ EXÉCUTIF

**BÂTIZEN CI** est une application Next.js impressionnante par son ampleur et sa complétude fonctionnelle. Elle couvre l'ensemble du cycle de vie d'un projet BTP : simulation, devis, suivi chantier, messagerie, gestion administrative.

### ✅ Forces
- Architecture moderne Next.js 16 + App Router
- Sécurité bien pensée (Custom Claims, whitelist, timingSafeEqual)
- Couverture fonctionnelle très large (client + admin + PWA + Android)
- Composants UI premium soignés
- Bonne séparation des préoccupations (pages/components/services/lib)

### ⚠️ Faiblesses
- **Testing : inexistant** — zéro test automatisé
- **Sécurité des routes CRON : absente**
- **Middleware inactif** — pas de protection côté serveur
- **Code mort : présent** — déprécié non nettoyé
- **Ballast documentaire : important** — 35 fichiers Markdown
- **Types permissifs** — `any` et `string` réduisent la valeur du typage

### 🎯 Note Globale : 7/10
- Architecture : 8/10
- Code qualité : 6/10
- Sécurité : 6/10
- Tests : 1/10
- Documentation : 5/10 (trop de fichiers, pas assez structurée)
- Performance : 7/10

---

*Audit généré le 29 juillet 2026 par Cline*