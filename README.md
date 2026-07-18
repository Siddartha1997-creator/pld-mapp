# PLD SLM Mobile

A React Native mobile application for managing PLD SLM devices with Bluetooth Low Energy (BLE) connectivity and HiveMQ cloud integration.

**Features:**
- User authentication (login/signup)
- BLE device discovery and pairing
- Real-time device communication via HiveMQ MQTT
- Device list and camera streaming
- Cross-platform iOS and Android support

---

## Prerequisites

- **Node.js** 18+ — [Download](https://nodejs.org/)
- **Xcode** 15+ — For iOS development
- **CocoaPods** — `sudo gem install cocoapods`
- **Android Studio** — For Android development
- **Java Development Kit (JDK)** 11+ — For Android

### iOS Requirements
- macOS 12+
- Xcode Command Line Tools: `xcode-select --install`

### Android Requirements
- Android SDK API 21+

---

## Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   Fill in your HiveMQ and auth configuration (see [Environment Variables](#environment-variables) below).

3. **Install iOS pods:**
   ```bash
   cd ios && pod install && cd ..
   ```

---

## Quick Start

### Start Metro Bundler
```bash
npm start
```

### iOS Simulator
```bash
npm run ios
```

### iOS Physical Device
```bash
npm run ios -- --device "Device Name"
```
Replace `Device Name` with your device name (e.g., `Siddhartha's iPhone`). Use correct capitalization.

### Android Emulator
```bash
npm run android
```

### Android Physical Device
```bash
npm run android -- --deviceIdOnly
```

---

## Project Structure

```
src/
├── api/                  # API clients (auth, HiveMQ, general client)
├── components/           # Reusable UI components (Button, Input, LoadingOverlay, etc.)
├── constants/            # Configuration (BLE, environment)
├── context/              # React Context (authentication state)
├── hooks/                # Custom React hooks (useBle, useFormField)
├── navigation/           # Navigation config (Auth, Root, App stacks)
├── screens/              # Screen components (Login, Home, Pairing, etc.)
├── theme/                # UI theming and styling
├── types/                # TypeScript type definitions
└── utils/                # Utilities (token management, secure storage)

ios/                       # Xcode project
android/                   # Android project
```

---

## Environment Variables

Create a `.env` file with the following variables (do **NOT** commit this file):

| Variable | Example | Description |
|----------|---------|-------------|
| `HIVEMQ_ADMIN_USERNAME` | `sid1997` | HiveMQ admin credentials |
| `HIVEMQ_ADMIN_PASSWORD` | `your-password` | HiveMQ admin password |
| `AUTH_BASE_URL` | `https://your-instance.hivemq.cloud` | HiveMQ broker URL |
| `HIVEMQ_ORG_ID` | `your-org-id` | HiveMQ organization ID |
| `DEV_BYPASS_AUTH` | `true` | Skip authentication in dev mode |

⚠️ **IMPORTANT:** Never commit `.env` to Git. The `.gitignore` file already excludes it.

---

## Building & Cleaning

### Metro Bundler Cache (Quick)
Clears JS bundler cache:
```bash
npm start -- --reset-cache
```

### Clean JS Dependencies
```bash
rm -rf node_modules
npm install
```

### Clean iOS Build
```bash
rm -rf ios/Pods ios/build ios/Podfile.lock
cd ios && pod install && cd ..
```

### Full Clean Rebuild (iOS)
```bash
rm -rf node_modules ios/Pods ios/build ios/Podfile.lock
npm install
cd ios && pod install
npm run ios
```

### Full Clean Rebuild (Android)
```bash
rm -rf node_modules android/build android/.gradle
npm install
npm run android
```

---

## Troubleshooting

### Device Connection Issues

**Error: "No device UDID or name matching..."**
- Check device name capitalization: `npm run ios -- --device "Siddhartha's iPhone"`
- List available devices: `xcrun xctrace list devices`

**Metro bundler not starting**
```bash
# Kill Metro process
pkill -f "metro"

# Start with cache clean
npm start -- --reset-cache
```

### Build Failures

**"Module not found" errors**
```bash
# Full reinstall
rm -rf node_modules && npm install
```

**iOS build fails**
```bash
# Clear Pods and rebuild
cd ios && rm -rf Pods Podfile.lock && pod install && cd ..
npm run ios
```

**Android build fails**
```bash
rm -rf android/.gradle android/build
npm run android
```

### Pod Installation Issues
```bash
# Update CocoaPods specs
pod repo update

# Reinstall pods
cd ios && pod install && cd ..
```

---

## Development Tips

- **TypeScript:** Check types with your IDE or run `tsc --noEmit`
- **Hot Reload:** Changes auto-reload during `npm start`
- **Debugging:** Use React Native Debugger or Chrome DevTools
- **Environment:** Use `.env` for local development; never hardcode secrets
- **Metro:** Start bundler separately with `npm start` before running app commands

---

## License

Internal use only.
