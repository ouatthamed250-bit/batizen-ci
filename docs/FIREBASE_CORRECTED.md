# Firebase Realtime Database - Corrections Appliquées

## Modifications apportées à src/contexts/AuthContext.tsx

### 1. Imports ajoutés
```tsx
import { ref, set } from "firebase/database";
```

### 2. Fonction register() - Écriture dans Realtime Database
```tsx
const register = useCallback(async (email: string, password: string, name: string) => {
  // ... création utilisateur ...
  
  const { auth, database } = getFirebaseServices();
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName: name });
  
  // ✅ NOUVEAU : Écriture dans Realtime Database
  await set(ref(database, `users/${cred.user.uid}`), {
    uid: cred.user.uid,
    email: cred.user.email,
    displayName: name,
    role: "client",
    createdAt: Date.now(),
  });
}, []);
```

### 3. Fonction loginWithGoogle() - Écriture dans Realtime Database
```tsx
const loginWithGoogle = useCallback(async () => {
  // ... connexion Google ...
  
  const { auth, googleProvider, database } = getFirebaseServices();
  const result = await signInWithPopup(auth, googleProvider);
  
  // ✅ NOUVEAU : Écriture dans Realtime Database avec merge
  await set(ref(database, `users/${result.user.uid}`), {
    uid: result.user.uid,
    email: result.user.email,
    displayName: result.user.displayName || "Utilisateur Google",
    photoURL: result.user.photoURL || null,
    role: "client",
    createdAt: Date.now(),
  });
}, []);
```

## ✅ Résultat
- Les utilisateurs seront maintenant enregistrés dans Realtime Database après inscription/connexion Google
- Les données : uid, email, displayName, photoURL, role, createdAt

## Actions à faire dans Firebase Console
1. **Authentication > Settings > Authorized domains** :
   - Ajouter `localhost`
   - Ajouter votre URL Vercel

2. **Realtime Database > Rules** :
   - Autoriser temporairement : `{ ".read": true, ".write": true }`
   - Ou configurer des règles de sécurité appropriées

3. **Test** :
   ```bash
   npm run dev
   # Créer un compte et vérifier Firebase Console > Realtime Database