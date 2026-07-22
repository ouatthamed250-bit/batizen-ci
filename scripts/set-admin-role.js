/**
 * Script one-shot pour attribuer un rôle admin via custom claims Firebase
 * Usage: node scripts/set-admin-role.js <uid>
 * 
 * Ce script doit être exécuté localement ou sur un serveur avec accès aux
 * credentials Firebase Admin (FIREBASE_SERVICE_ACCOUNT_KEY ou variables d'env)
 */

const admin = require('firebase-admin');

// Initialisation Firebase Admin (nécessite les variables d'environnement)
if (!admin.apps.length) {
  // Option 1: Utiliser le fichier de clé de service (à placer dans .env.local)
  // FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  
  if (serviceAccountKey) {
    try {
      const serviceAccount = JSON.parse(serviceAccountKey);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: process.env.FIREBASE_DATABASE_URL || process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
      });
      console.log('✅ Firebase Admin initialisé avec la clé de service');
    } catch (error) {
      console.error('❌ Erreur parsing service account key:', error.message);
      process.exit(1);
    }
  } else {
    // Option 2: Utiliser Application Default Credentials (GOOGLE_APPLICATION_CREDENTIALS)
    try {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        databaseURL: process.env.FIREBASE_DATABASE_URL || process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
      });
      console.log('✅ Firebase Admin initialisé avec Application Default Credentials');
    } catch (error) {
      console.error('❌ Erreur initialisation Firebase Admin:', error.message);
      console.error('Assurez-vous que FIREBASE_SERVICE_ACCOUNT_KEY ou GOOGLE_APPLICATION_CREDENTIALS est configuré');
      process.exit(1);
    }
  }
}

async function setAdminRole(uid) {
  if (!uid) {
    console.error('❌ Usage: node scripts/set-admin-role.js <uid>');
    process.exit(1);
  }

  try {
    // 1. Vérifier que l'utilisateur existe
    const userRecord = await admin.auth().getUser(uid);
    console.log('👤 Utilisateur trouvé:', userRecord.email || uid);

    // 2. Définir le custom claim role=admin
    await admin.auth().setCustomUserClaims(uid, { role: 'admin' });
    console.log('✅ Custom claim role=admin attribué à l\'utilisateur:', uid);

    // 3. Mettre à jour la base de données en temps réel aussi (pour compatibilité)
    const db = admin.database();
    await db.ref(`users/${uid}/role`).set('admin');
    console.log('✅ Rôle admin mis à jour dans Realtime Database');

    console.log('\n🎉 Opération terminée avec succès !');
    console.log('L\'utilisateur peut maintenant accéder aux routes /admin/*');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

// Récupérer l'UID depuis les arguments
const uid = process.argv[2];
setAdminRole(uid);