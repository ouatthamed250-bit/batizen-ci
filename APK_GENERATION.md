# Génération APK BATIZEN.CI
Date : 14/07/2026

## État du projet

### Build Next.js
- **Statut** : ✅ Problème résolu
- **Routes** : 33 routes configurées
- **Problème rencontré** : `/chantier/[id]` incompatible avec `output: "export"` + `dynamicParams`

### Solution appliquée
- `dynamic` changé à `"force-static"` dans `src/app/chantier/[id]/page.tsx`
- Configuration `next.config.ts` maintenue sans `output: "export"` (pour développement serveur)
- Configuration `capacitor.config.ts` mise à jour pour mode serveur

## APK existant

### Chemin de l'APK :
`C:\Users\Mr ZOGBO\Desktop\batizen-ci\batizen-ci-debug.apk`

### Taille : 7.6 MB
### Date de création : 11/07/2026

## Configuration Capacitor

```typescript
// capacitor.config.ts
const config: CapacitorConfig = {
  appId: 'com.batizen.app',
  appName: 'BATIZEN.CI',
  webDir: 'next/server',
  server: {
    url: 'http://10.0.2.2:3000',
    cleartext: true
  }
};
```

## Instructions d'installation

1. **Pour tester en développement** :
   ```bash
   npm run dev
   npx cap open android
   ```

2. **Pour produire un APK statique** :
   - Modifier `next.config.ts` pour ajouter `output: "export"`
   - Modifier `/chantier/[id]/page.tsx` pour retirer la route dynamique ou utiliser des params statiques
   - Exécuter `npm run build && npx cap sync android && cd android && .\gradlew assembleDebug`

## Notes

- L'APK existant (batizen-ci-debug.apk) a été généré avec succès
- Le projet fonctionne en mode développement avec `npm run dev`
- Pour une production complète, il faut soit :
  - Utiliser `output: "export"` avec des routes statiques uniquement
  - Soit intégrer un serveur Node.js dans l'app mobile