# PLD SLM Mobile

React Native (Expo) app for PLD SLM.

---

## Prerequisites

- Node.js 18+
- Xcode (for iOS)
- Android Studio (for Android)
- CocoaPods: `sudo gem install cocoapods`
- Expo CLI: `npm install -g expo-cli`

---

## Running the App

### iOS (simulator)

```bash
npx expo run:ios
```

### iOS (physical device)

```bash
npx expo run:ios --device
```

### Android

```bash
npx expo run:android
```

---

## Clean Builds

### Quick clean (JS only)

Clears Metro bundler cache without touching native code:

```bash
npx expo start --clear
```

### Clean JS dependencies

```bash
rm -rf node_modules
npm install
```

### Clean iOS native build

```bash
rm -rf ios/Pods ios/build ios/Podfile.lock
cd ios && pod install
```

### Full clean rebuild (iOS)

Clears everything — JS deps, native pods, and build artifacts — then reinstalls:

```bash
rm -rf node_modules ios/Pods ios/build ios/Podfile.lock
npm install
cd ios && pod install
cd ..
npx expo run:ios
```

### Full clean rebuild (Android)

```bash
rm -rf node_modules android/build android/.gradle
npm install
npx expo run:android
```

---

## Expo Prebuild

`prebuild` regenerates the `ios/` and `android/` native project folders from `app.config.js`. Run this when you add a new native plugin or change native config.

> **Warning:** This overwrites native project files. Any manual native changes will be lost unless you have ejected.

```bash
npx expo prebuild
```

To target a specific platform:

```bash
npx expo prebuild --platform ios
npx expo prebuild --platform android
```

To do a clean prebuild (deletes and regenerates native folders):

```bash
npx expo prebuild --clean
```

After prebuild, reinstall pods for iOS:

```bash
cd ios && pod install
```

---

## Environment Variables

Copy `.env.example` to `.env` and fill in values (if applicable). Variables are injected via `app.config.js` into `expo.extra`:

| Variable | Description |
|---|---|
| `AUTH_BASE_URL` | Base URL for auth service (default: `http://localhost:8080`) |
| `HIVEMQ_ADMIN_USERNAME` | HiveMQ admin username |
| `HIVEMQ_ADMIN_PASSWORD` | HiveMQ admin password |
| `HIVEMQ_ORG_ID` | HiveMQ org ID |
| `DEV_BYPASS_AUTH` | Set to `true` to skip auth in dev (default: `false`) |

---

## EAS Build (cloud builds)

```bash
# Install EAS CLI
npm install -g eas-cli

# Development build
eas build --profile development --platform ios

# Production build
eas build --profile production --platform ios
```
