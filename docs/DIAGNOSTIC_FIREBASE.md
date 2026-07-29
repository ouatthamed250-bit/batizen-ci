# Diagnostic Firebase BATIZEN.CI
Date : 14/07/2026

## 1. Configuration Firebase ✅
- **Fichier** : `src/lib/firebase.ts` existant
- **Variables d'environnement** : COMPLÈTES ✅
  - NEXT_PUBLIC_FIREBASE_API_KEY : ✅
  - NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN : ✅
  - NEXT_PUBLIC_FIREBASE_DATABASE_URL : ✅
  - NEXT_PUBLIC_FIREBASE_PROJECT_ID : ✅
  - NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET : ✅
  - NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID : ✅
  - NEXT_PUBLIC_FIREBASE_APP_ID : ✅

- **Initialisation** : CORRECTE ✅
  - `initializeApp(firebaseConfig)`
  - `getAuth(app)`
  - `getDatabase(app)`
  - `getStorage(app)`
  - `GoogleAuthProvider` configuré

## 2. Code d'inscription ✅
- **Fichier** : `src/app/(auth)/register/page.tsx`
- **register()** : Existant dans AuthContext ✅
- **loginWithGoogle()** : Existant dans AuthContext ✅
- **Gestion des erreurs** : Présente (try/catch) ✅
- **Écriture dans Realtime Database** : **MANQUANTE** ❌
  - L'inscription crée l'utilisateur dans Firebase Auth
  - Mais ne l'écrit PAS dans Realtime Database

## 3. Problèmes identifiés

### ❌ PROBLÈME CRITIQUE : Écriture dans Realtime Database
Le code **n'écrit pas** les données utilisateur dans Realtime Database après inscription.

### ❌ PROBLÈME POTENTIEL : Domaines autorisés
Vérifier dans Firebase Console :
- `localhost` doit être autorisé
- `batizen-ci-dz83.vercel.app` doit être autorisé

### ❌ PROBLÈME : Mode démo actif
Le code a un "mode démo" qui s'active si Firebase config est manquante.

## 4. Actions de correction à effectuer

### Action 1 : Vérifier les domaines Firebase
1. Firebase Console > Authentication > Settings > Authorized domains
2. Ajouter : `localhost` et `batizen-ci.vercel.app`

### Action 2 : Ajouter l'écriture dans Realtime Database
Dans `AuthContext.tsx`, après `createUserWithEmailAndPassword` :

```tsx
const register = useCallback(async (email: string, password: string, name: string) => {
  if (!hasFirebaseConfig()) {
    // Mode démo
    return;
  }

  const { auth, database } = getFirebaseServices();
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName: name });
  
  // ÉCRIRE DANS REALTIME DATABASE
  await set(ref(database, `users/${cred.user.uid}`), {
    uid: cred.user.uid,
    email: cred.user.email,
    displayName: name,
    createdAt: Date.now(),
  });
}, []);
```

### Action 3 : Tester avec le .env.local
- Vérifier que le fichier .env.local est chargé par Next.js
- Tester en local avec `npm run dev`

## 5. Test à effectuer
```bash
npm run dev
# Ouvrir http://localhost:3000
# Créer un compte et vérifier la console Firebase