const fs = require('fs');
const path = require('path');

const files = [
  'src/app/(tabs)/projets/page.tsx',
  'src/app/admin/clients/page.tsx',
  'src/app/admin/dashboard/page.tsx',
  'src/app/admin/messages/page.tsx',
  'src/app/admin/parametres/page.tsx',
  'src/app/chantier/[id]/ChantierDetailClient.tsx',
  'src/app/admin/layout.tsx',
  'src/app/admin/page.tsx',
  'src/components/chantier/StatsResume.tsx',
];

const baseDir = path.join(__dirname, '..');

console.log('🔧 Correction des imports getFirebaseServices...\n');

for (const file of files) {
  const fullPath = path.join(baseDir, file);
  if (!fs.existsSync(fullPath)) {
    console.log(`❌ Fichier introuvable: ${file}`);
    continue;
  }
  
  let content = fs.readFileSync(fullPath, 'utf-8');
  let original = content;
  
  // Corriger `from '../../../lib'` → `from '../../../lib/firebase'`
  content = content.replace(
    /from ['"]\.\.\/\.\.\/\.\.\/lib['"]/g,
    "from '../../../lib/firebase'"
  );
  
  // Corriger `from '../../lib'` → `from '../../lib/firebase'`
  content = content.replace(
    /from ['"]\.\.\/\.\.\/lib['"]/g,
    "from '../../lib/firebase'"
  );
  
  if (content !== original) {
    fs.writeFileSync(fullPath, content, 'utf-8');
    console.log(`✅ ${file} — corrigé`);
  } else {
    console.log(`➖ ${file} — inchangé`);
  }
}

console.log('\n✅ Correction terminée !');