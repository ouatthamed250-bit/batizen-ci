# Build APK task
- [ ] Check build prerequisites (Node, Java, Android SDK, Gradle)
- [ ] Read capacitor.config.ts to confirm webDir/sync settings
- [ ] Build the Next.js web app (npm run build)
- [ ] Sync Capacitor (npx cap sync android)
- [ ] Build Android APK (gradlew assembleDebug / release)
- [ ] Copy the generated APK into the project root folder