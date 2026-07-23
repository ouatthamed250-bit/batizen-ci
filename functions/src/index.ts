import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

/**
 * Cloud Function appelable :
 * setAdminRole(uid: string) => { success: boolean }
 *
 * 🔒 Seul un utilisateur déjà admin peut appeler cette fonction.
 * Elle attribue le custom claim { role: 'admin' } à l'UID cible
 * et met à jour la Realtime Database (users/{uid}/role).
 *
 * Usage côté client :
 *   import { getFunctions, httpsCallable } from 'firebase/functions';
 *   const setAdminRole = httpsCallable(getFunctions(), 'setAdminRole');
 *   await setAdminRole({ uid: 'abc123...' });
 */
export const setAdminRole = functions.https.onCall(async (data, context) => {
  // 1. Vérifier que l'appelant est authentifié
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Vous devez être connecté pour effectuer cette action.'
    );
  }

  // 2. Vérifier que l'appelant a le rôle admin
  if (context.auth.token.role !== 'admin') {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Seul un administrateur peut attribuer le rôle admin.'
    );
  }

  const { uid } = data;

  if (!uid || typeof uid !== 'string') {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Le paramètre "uid" est requis et doit être une chaîne de caractères.'
    );
  }

  try {
    // 3. Vérifier que l'utilisateur cible existe
    const userRecord = await admin.auth().getUser(uid);
    console.log(`👤 Utilisateur trouvé : ${userRecord.email || uid}`);

    // 4. Attribuer le custom claim
    await admin.auth().setCustomUserClaims(uid, { role: 'admin' });
    console.log(`✅ Custom claim { role: 'admin' } attribué à ${uid}`);

    // 5. Synchroniser avec la Realtime Database
    const db = admin.database();
    await db.ref(`users/${uid}/role`).set('admin');
    console.log(`✅ Rôle "admin" enregistré dans Realtime Database`);

    return { success: true, uid };
  } catch (error: any) {
    console.error('❌ Erreur setAdminRole:', error.message);
    throw new functions.https.HttpsError(
      'internal',
      `Erreur lors de l'attribution du rôle : ${error.message}`
    );
  }
});

/**
 * Cloud Function utile pour initialiser le 1er admin à partir du frontend.
 * Souvent nécessaire quand la base est vide.
 * 
 * Protégée par un code secret temporaire (ADMIN_SECRET_CODE) défini dans
 * les variables d'environnement Firebase (firebase functions:config:set).
 */
export const bootstrapFirstAdmin = functions.https.onCall(async (data, context) => {
  const { uid, secretCode } = data;
  const expectedCode = functions.config().admin?.bootstrap_secret;

  if (!expectedCode || secretCode !== expectedCode) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Code secret invalide.'
    );
  }

  if (!uid || typeof uid !== 'string') {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'UID requis.'
    );
  }

  try {
    await admin.auth().setCustomUserClaims(uid, { role: 'admin' });

    const db = admin.database();
    await db.ref(`users/${uid}/role`).set('admin');

    console.log(`✅ Premier admin bootstrapé : ${uid}`);
    return { success: true };
  } catch (error: any) {
    throw new functions.https.HttpsError('internal', error.message);
  }
});