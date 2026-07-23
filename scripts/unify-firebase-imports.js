/**
 * Script de correction automatique des imports Firebase
 * 
 * Remplace les imports directs de 'firebase/database', 'firebase/auth', 'firebase/storage'
 * par l'instance centralisée getFirebaseServices depuis '@/lib/firebase'.
 * 
 * Usage : node scripts/unify-firebase-imports.js
 */

const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, '..', 'src');

// Fichiers à ignorer (ceux qui utilisent firebase-admin ou qui sont corrects)
const IGNORE_FILES = [
  'lib/firebase.ts',      // Le fichier central lui-même
  'lib/firebase-admin.ts', // Admin SDK (pas le même)
  'lib/rtdb.ts',          // Déjà basé sur getFirebaseServices
  'lib/notifications.ts', // Déjà basé sur getFirebaseServices
  'lib/plans/storage.ts', // Déjà basé sur getFirebaseServices
  'middleware.ts',         // Utilise firebase-admin
  'db/index.ts',          // Drizzle/autre DB
  'db/schema.ts',         // Drizzle/autre DB
];

// Stats
const stats = {
  scanned: 0,
  modified: 0,
  skipped: 0,
  errors: [],
  details: [],
};

/**
 * Vérifie si un fichier doit être ignoré
 */
function shouldIgnore(filePath) {
  const relative = path.relative(SRC_DIR, filePath).replace(/\\/g, '/');
  return IGNORE_FILES.some(ignore => relative === ignore || relative.endsWith(ignore));
}

/**
 * Extrait les fonctions Firebase importées depuis un import 'firebase/*'
 */
function extractFirebaseFunctions(importLine) {
  const match = importLine.match(/import\s+\{([^}]+)\}\s+from\s+['"]firebase\/(database|auth|storage)['"]/);
  if (!match) return null;
  const functions = match[1].split(',').map(f => f.trim()).filter(f => 
    !f.startsWith('type ') && 
    !f.startsWith('type Fire') &&
    f !== 'FirebaseApp' &&
    f !== 'Auth' &&
    f !== 'Database' &&
    f !== 'FirebaseStorage'
  );
  return functions.length > 0 ? functions : null;
}

/**
 * Corrige les imports dans un fichier
 */
function fixFile(filePath) {
  const relative = path.relative(SRC_DIR, filePath).replace(/\\/g, '/');
  
  if (shouldIgnore(filePath)) {
    stats.skipped++;
    return false;
  }

  let content = fs.readFileSync(filePath, 'utf-8');
  let original = content;
  let modified = false;

  // 1. Remplacer import { getDatabase } from 'firebase/database'
  content = content.replace(
    /import\s+\{[^}]*getDatabase[^}]*\}\s+from\s+['"]firebase\/database['"];?\s*\n/gm,
    (match) => {
      const functions = extractFirebaseFunctions(match);
      if (!functions) {
        // Si getDatabase est le seul import, on le remplace entièrement
        // Sinon, on extrait les autres fonctions à garder
        const otherFns = match.match(/\{([^}]+)\}/);
        if (otherFns) {
          const fns = otherFns[1].split(',').map(f => f.trim()).filter(f => 
            f !== 'getDatabase' && 
            !f.startsWith('type ') &&
            f !== 'Database'
          );
          if (fns.length > 0) {
            // Garder les autres fonctions (ex: ref, set, onValue)
            return `import { ${fns.join(', ')} } from 'firebase/database';\n`;
          }
        }
        return ''; // Supprimer l'import entier si getDatabase était seul
      }
      return ''; // Supprimer la ligne
    }
  );

  // 2. Remplacer import { getAuth } from 'firebase/auth' (sauf AuthContext qui a besoin aussi des providers)
  if (!filePath.includes('AuthContext.tsx')) {
    content = content.replace(
      /import\s+\{([^}]*)\}\s+from\s+['"]firebase\/auth['"];?\s*\n/gm,
      (match, p1) => {
        const fns = p1.split(',').map(f => f.trim()).filter(f => 
          f !== 'getAuth' && 
          f !== 'GoogleAuthProvider' &&
          f !== 'Auth' &&
          !f.startsWith('type ')
        );
        if (fns.length > 0) {
          return `import { ${fns.join(', ')} } from 'firebase/auth';\n`;
        }
        return ''; // Supprimer l'import entier
      }
    );
  }

  // 3. Remplacer import { getStorage } from 'firebase/storage'
  content = content.replace(
    /import\s+\{([^}]*)\}\s+from\s+['"]firebase\/storage['"];?\s*\n/gm,
    (match, p1) => {
      const fns = p1.split(',').map(f => f.trim()).filter(f => 
        f !== 'getStorage' && 
        f !== 'FirebaseStorage' &&
        !f.startsWith('type ')
      );
      if (fns.length > 0) {
        return `import { ${fns.join(', ')} } from 'firebase/storage';\n`;
      }
      return ''; // Supprimer l'import entier
    }
  );

  // 4. Remplacer les appels getDatabase() par getFirebaseServices().db
  content = content.replace(/const\s+(\w+)\s*=\s*getDatabase\s*\(\s*\)/g, (match, varName) => {
    modified = true;
    return `const { db: ${varName} } = getFirebaseServices()`;
  });

  // 5. Remplacer les appels getAuth() par getFirebaseServices().auth
  content = content.replace(/const\s+(\w+)\s*=\s*getAuth\s*\(\s*\)/g, (match, varName) => {
    if (varName !== 'auth') { // Ne pas remplacer si le nom est déjà 'auth'
      modified = true;
      return `const { auth: ${varName} } = getFirebaseServices()`;
    }
    return match;
  });

  // 6. Remplacer `const db = getDatabase();` si non déjà fait
  content = content.replace(/(?:const|let|var)\s+db\s*=\s*getDatabase\s*\(\s*\)/g, () => {
    modified = true;
    return 'const { db } = getFirebaseServices()';
  });

  // 7. Remplacer `const auth = getAuth();` si non déjà fait
  content = content.replace(/(?:const|let|var)\s+auth\s*=\s*getAuth\s*\(\s*\)/g, () => {
    modified = true;
    return 'const { auth } = getFirebaseServices()';
  });

  // 8. Remplacer `const storage = getStorage();` 
  content = content.replace(/(?:const|let|var)\s+\w+\s*=\s*getStorage\s*\(\s*\)/g, () => {
    modified = true;
    return 'const { storage } = getFirebaseServices()';
  });

  // 9. S'assurer que l'import getFirebaseServices est présent si besoin
  if (modified && !content.includes("from '@/lib/firebase'") && !content.includes("from '../lib/firebase'") && !content.includes("from '../../lib/firebase'") && !content.includes("from '../../../lib/firebase'")) {
    // Déterminer le chemin relatif vers lib/firebase
    const relativeToLib = path.relative(path.dirname(filePath), path.join(SRC_DIR, 'lib')).replace(/\\/g, '/');
    const importPath = relativeToLib.startsWith('.') ? relativeToLib : `./${relativeToLib}`;
    
    // Ajouter après le dernier import existant
    const lastImportIndex = content.lastIndexOf('import ');
    if (lastImportIndex !== -1) {
      const endOfLine = content.indexOf('\n', content.indexOf(';', lastImportIndex) !== -1 ? content.indexOf(';', lastImportIndex) : lastImportIndex);
      if (endOfLine !== -1) {
        content = content.slice(0, endOfLine + 1) + `import { getFirebaseServices } from '${importPath}';\n` + content.slice(endOfLine + 1);
      } else {
        content += `\nimport { getFirebaseServices } from '${importPath}';\n`;
      }
    }
  }

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf-8');
    stats.modified++;
    stats.details.push({ file: relative, status: 'modified' });
    return true;
  }

  return false;
}

/**
 * Parcourt récursivement les fichiers
 */
function walkDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.git') {
        walkDir(fullPath);
      }
      continue;
    }

    if (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts')) {
      stats.scanned++;
      fixFile(fullPath);
    }
  }
}

// Exécution
console.log('🔍 Scan des fichiers en cours...\n');
walkDir(SRC_DIR);

console.log('=== RÉSULTATS ===');
console.log(`📄 Fichiers scannés : ${stats.scanned}`);
console.log(`✅ Fichiers modifiés : ${stats.modified}`);
console.log(`⏭️  Fichiers ignorés : ${stats.skipped}`);
console.log(`❌ Erreurs : ${stats.errors.length}`);

if (stats.errors.length > 0) {
  console.log('\n⚠️ Erreurs :');
  stats.errors.forEach(e => console.log(`  - ${e}`));
}

console.log('\n=== FICHIERS MODIFIÉS ===');
stats.details.filter(d => d.status === 'modified').forEach(d => console.log(`  ✅ ${d.file}`));

console.log('\n✅ Correction terminée !');