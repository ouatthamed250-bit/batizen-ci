const fs = require('fs');
const path = require('path');

const envPath = path.join(process.cwd(), '.env.local');
const secretsDir = path.join(process.cwd(), '.secrets');
const jsonPath = path.join(secretsDir, 'firebase-service-account.json');

if (!fs.existsSync(envPath)) {
  console.error('❌ .env.local non trouvé à la racine du projet');
  process.exit(1);
}

let envContent = fs.readFileSync(envPath, 'utf8');
const lines = envContent.split('\n');

let serviceAccountLineIndex = -1;
let serviceAccountJson = null;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();
  if (line.startsWith('FIREBASE_SERVICE_ACCOUNT_KEY=')) {
    serviceAccountLineIndex = i;
    const jsonPart = line.substring('FIREBASE_SERVICE_ACCOUNT_KEY='.length);
    try {
      serviceAccountJson = JSON.parse(jsonPart);
    } catch (e) {
      console.error('❌ Le JSON dans FIREBASE_SERVICE_ACCOUNT_KEY est invalide');
      process.exit(1);
    }
    break;
  }
}

if (serviceAccountLineIndex === -1) {
  console.log('ℹ️ FIREBASE_SERVICE_ACCOUNT_KEY déjà supprimé ou migré. Rien à faire.');
  process.exit(0);
}

if (!fs.existsSync(secretsDir)) {
  fs.mkdirSync(secretsDir, { recursive: true });
}

fs.writeFileSync(jsonPath, JSON.stringify(serviceAccountJson, null, 2));
console.log('✅ Clé extraite dans .secrets/firebase-service-account.json');

const newLines = [];
for (let i = 0; i < lines.length; i++) {
  if (i === serviceAccountLineIndex) {
    newLines.push('GOOGLE_APPLICATION_CREDENTIALS=.secrets/firebase-service-account.json');
  } else {
    newLines.push(lines[i]);
  }
}

fs.writeFileSync(envPath, newLines.join('\n'));
console.log('✅ .env.local mis à jour (FIREBASE_SERVICE_ACCOUNT_KEY → GOOGLE_APPLICATION_CREDENTIALS)');