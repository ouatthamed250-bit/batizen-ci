/**
 * Script one-shot pour attribuer un rôle admin via custom claims Firebase.
 *
 * Utilise l'API modulaire de firebase-admin (identique à src/lib/firebase-admin.ts).
 *
 * Usage :
 *   1. Assurez-vous que .env.local est rempli (FIREBASE_SERVICE_ACCOUNT_KEY)
 *   2. node scripts/set-admin-role.js <UID>
 *
 * Exemple :
 *   node scripts/set-admin-role.js abc123def456
 */

// ── Charger .env.local AVANT toute initialisation Firebase ──
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env.local') });

// ── API modulaire Firebase Admin (même API que firebase-admin.ts) ──
const { initializeApp, getApps, cert, applicationDefault } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getDatabase } = require('firebase-admin/database');

// ── Initialisation (identique à src/lib/firebase-admin.ts) ──

function initFirebaseAdmin() {
  const apps = getApps();
  if (apps.length > 0) return apps[0];

  const databaseURL = process.env.FIREBASE_DATABASE_URL || process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL;
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (serviceAccountKey) {
    try {
      const serviceAccount = JSON.parse(serviceAccountKey);

      if (!serviceAccount.private_key || !serviceAccount.client_email || !serviceAccount.project_id) {
        throw new Error(
          'FIREBASE_SERVICE_ACCOUNT_KEY invalide : le JSON doit contenir ' +
          'private_key, client_email et project_id'
        );
      }

      console.log('✅ Firebase Admin SDK initialisé avec FIREBASE_SERVICE_ACCOUNT_KEY');
      return initializeApp({
        credential: cert(serviceAccount),
        databaseURL,
      });
    } catch (parseError) {
      throw new Error(
        '❌ Erreur parsing FIREBASE_SERVICE_ACCOUNT_KEY : ' + parseError.message
      );
    }
  }

  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.log('✅ Firebase Admin SDK initialisé avec GOOGLE_APPLICATION_CREDENTIALS');
    return initializeApp({
      credential: applicationDefault(),
      databaseURL,
    });
  }

  throw new Error(
    '❌ Firebase Admin SDK : configuration manquante.\n\n' +
    'Configurez FIREBASE_SERVICE_ACCOUNT_KEY dans .env.local :\n' +
    '  1. Allez sur Firebase Console > Paramètres > Comptes de service > Générer une clé privée\n' +
    '  2. Copiez le JSON complet sur UNE SEULE ligne dans FIREBASE_SERVICE_ACCOUNT_KEY\n\n' +
    'Ou configurez GOOGLE_APPLICATION_CREDENTIALS pour un environnement Google Cloud.'
  );
}

// ── Fonction principale ──

async function setAdminRole(uid) {
  if (!uid) {
    console.error('');
    console.error('❌ Usage : node scripts/set-admin-role.js <UID>');
    console.error('');
    console.error('   Exemple : node scripts/set-admin-role.js abc123def456...');
    console.error('');
    console.error('   Pour récupérer votre UID :');
    console.error('     1. Allez sur Firebase Console > Authentication');
    console.error('     2. Trouvez votre compte email');
    console.error('     3. Copiez l\'UID (colonne "Identifiant d\'utilisateur")');
    console.error('');
    process.exit(1);
  }

  try {
    // 1. Initialiser Firebase Admin
    const app = initFirebaseAdmin();
    const adminAuth = getAuth(app);
    const adminDb = getDatabase(app);

    // 2. Vérifier que l'utilisateur cible existe
    let userRecord;
    try {
      userRecord = await adminAuth.getUser(uid);
    } catch (userError) {
      if (userError.code === 'auth/user-not-found') {
        console.error(`❌ Aucun utilisateur trouvé avec l'UID : ${uid}`);
        console.error('');
        console.error('   Vérifiez que :');
        console.error('     - L\'UID est correct (copié depuis Firebase Console)');
        console.error('     - L\'utilisateur existe bien dans Firebase Authentication');
        console.error('');
        process.exit(1);
      }
      throw userError;
    }

    console.log(`👤 Utilisateur trouvé : ${userRecord.email || uid}`);

    // 3. Attribuer le custom claim { role: 'admin' } — c'est LA vérification serveur
    await adminAuth.setCustomUserClaims(uid, { role: 'admin' });
    console.log(`✅ Custom claim { role: 'admin' } attribué à ${uid}`);

    // 4. Synchroniser la Realtime Database (pour le fallback middleware + useAuth)
    await adminDb.ref(`users/${uid}/role`).set('admin');
    console.log(`✅ Rôle "admin" synchronisé dans Realtime Database (users/${uid}/role)`);

    console.log('');
    console.log('🎉 Opération terminée avec succès !');
    console.log(`   L'utilisateur "${userRecord.email || uid}" peut maintenant accéder aux routes /admin/*`);
    console.log('');
    console.log('💡 Étapes suivantes :');
    console.log('   1. Déconnectez-vous de l\'application');
    console.log('   2. Reconnectez-vous (le token doit être regénéré avec le custom claim)');
    console.log('   3. Accédez à /admin/dashboard');
    console.log('');

  } catch (error) {
    console.error('❌ Erreur :', error.message || error);
    if (error.stack) {
      console.error('\nDétail technique :');
      console.error(error.stack.split('\n').slice(1, 3).join('\n'));
    }
    process.exit(1);
  }
}

// ── Point d'entrée ──

const uid = process.argv[2];
setAdminRole(uid);