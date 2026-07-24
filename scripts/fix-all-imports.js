const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, '..');

// Map of files to their needed Firebase Database functions + dbRef flag
const fixes = {
  'src/app/(tabs)/projets/page.tsx': {
    importFns: ['ref', 'onValue', 'query', 'orderByChild', 'equalTo'],
    hasDbRef: false,
  },
  'src/app/admin/calendar/page.tsx': {
    importFns: ['ref', 'onValue', 'push', 'update'],
    hasDbRef: true,
  },
  'src/app/admin/chantier/[id]/DocumentsSection.tsx': {
    importFns: ['ref', 'onValue', 'push', 'update', 'Unsubscribe'],
    hasDbRef: false,
  },
  'src/app/admin/chantier/[id]/page.tsx': {
    importFns: ['ref', 'onValue', 'push', 'update', 'Unsubscribe'],
    hasDbRef: false,
  },
  'src/app/admin/clients/page.tsx': {
    importFns: ['ref', 'onValue'],
    hasDbRef: false,
  },
  'src/app/admin/dashboard/page.tsx': {
    importFns: ['ref', 'get'],
    hasDbRef: false,
  },
  'src/app/admin/messages/page.tsx': {
    importFns: ['ref', 'onValue', 'query', 'orderByChild', 'limitToLast', 'push', 'set', 'update'],
    hasDbRef: false,
  },
  'src/app/admin/page.tsx': {
    importFns: ['ref', 'onValue', 'get', 'push', 'set', 'update'],
    hasDbRef: true,
  },
  'src/components/chantier/ClientRendezVous.tsx': {
    importFns: ['ref', 'onValue', 'query', 'orderByChild', 'equalTo', 'get', 'push', 'update'],
    hasDbRef: false,
  },
  'src/components/chantier/StatsResume.tsx': {
    importFns: ['ref', 'onValue'],
    hasDbRef: true,
  },
};

let fixedCount = 0;

for (const [file, config] of Object.entries(fixes)) {
  const fullPath = path.join(baseDir, file);
  if (!fs.existsSync(fullPath)) {
    console.log(`❌ Not found: ${file}`);
    continue;
  }

  let content = fs.readFileSync(fullPath, 'utf-8');
  const original = content;

  // 1. Replace dbRef with ref if needed
  if (config.hasDbRef) {
    content = content.replace(/\bdbRef\b/g, 'ref');
  }

  // 2. Check if firebase/database import already exists
  const hasDbImport = content.includes("from 'firebase/database'");

  if (!hasDbImport) {
    const importLine = 'import { ' + config.importFns.join(', ') + " } from 'firebase/database';";

    // Add after the getFirebaseServices import line
    const lines = content.split('\n');
    let insertIdx = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes("import { getFirebaseServices } from")) {
        // Only add if next line doesn't already have firebase/database import
        if (!lines[i + 1]?.includes("from 'firebase/database'")) {
          insertIdx = i + 1;
        }
        break;
      }
    }

    if (insertIdx > 0) {
      lines.splice(insertIdx, 0, importLine);
      content = lines.join('\n');
      console.log(`  ✅ Added import to: ${file}`);
    } else {
      console.log(`  ⚠️ Cannot find insertion point in: ${file}`);
    }
  }

  if (content !== original) {
    fs.writeFileSync(fullPath, content, 'utf-8');
    fixedCount++;
    console.log(`✅ Fixed: ${file}`);
  } else {
    console.log(`➖ No change: ${file}`);
  }
}

console.log(`\n✅ ${fixedCount} files fixed!`);