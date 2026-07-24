/**
 * Script one-shot pour attribuer un rôle admin via custom claims Firebase.
 *
 * Usage :
 *   1. Assurez-vous que .env.local est bien rempli (notamment FIREBASE_SERVICE_ACCOUNT_KEY)
 *   2. node scripts/set-admin-role.js <UID>
 *
 * Exemple :
 *   node scripts/set-admin-role.js abc123...
 *
 * Ce script utilise la même logique d'initialisation que src/lib/firebase-admin.ts,
 * via firebase-admin et dotenv pour charger les variables d'environnement.
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env.local') });

const admin = require('firebase-admin');

// --- Initialisation Firebase Admin (identique à src/lib/firebase-admin.ts) ---

function initFirebaseAdmin() {
  if (admin.apps.length > 0) return admin.apps[0];

  const databaseURL = process.env.FIREBASE_DATABASE_URL || process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL;
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (serviceAccountKey) {
    const serviceAccount = JSON.parse(serviceAccountKey);
    return admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL,
    });
  }

  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      databaseURL,
    });
  }

  throw new Error(
    '❌ Firebase Admin SDK : configuration manquante.\n' +
    'Configurez FIREBASE_SERVICE_ACCOUNT_KEY dans .env.local ' +
    '(JSON stringifié de la clé de service Firebase).'
  );
}

// --- Fonction principale ---

async function setAdminRole(uid) {
  if (!uid) {
    console.error('❌ Usage: node scripts/set-admin-role.js <UID>');
    console.error('   Ex:  node scripts/set-admin-role.js abc123def456...');
    process.exit(1);
  }

  try {
    // 1. Initialiser Firebase Admin
    initFirebaseAdmin();
    console.log('✅ Firebase Admin SDK initialisé');

    // 2. Vérifier que l'utilisateur existe
    const userRecord = await admin.auth().getUser(uid);
    console.log(`👤 Utilisateur trouvé : ${userRecord.email || uid}`);

    // 3. Attribuer le custom claim { role: 'admin' }
    await admin.auth().setCustomUserClaims(uid, { role: 'admin' });
    console.log(`✅ Custom claim { role: 'admin' } attribué à ${uid}`);

    // 4. Synchroniser la Realtime Database (pour le fallback middleware)
    const db = admin.database();
    await db.ref(`users/${uid}/role`).set('admin');
    console.log(`✅ Rôle "admin" enregistré dans Realtime Database (users/${uid}/role)`);

    console.log('\n🎉 Opération terminée avec succès !');
    console.log(`L'utilisateur ${uid} peut maintenant accéder aux routes /admin/*`);
    console.log('💡 Si déjà connecté, déconnexion/reconnexion nécessaire pour rafraîchir le token.');

  } catch (error) {
    console.error('❌ Erreur:', error.message || error);
    process.exit(1);
  }
}

// --- Point d'entrée ---

const uid = process.argv[2];
setAdminRole(uid);