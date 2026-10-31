# SLLAS Mobile — Android Installation Package (APK) Guide

This guide details how to build and install the **SLLAS Mobile Android Package** (`zw.gov.sllas.mobile`).

---

## 📦 Package Specifications

- **Application Name**: SLLAS Mobile
- **Package ID / App ID**: `zw.gov.sllas.mobile`
- **Version**: `1.0.0` (Version Code `1`)
- **Android Target**: Android 14+ (SDK 34/35, backwards compatible down to Android 7 / API 24)
- **Permissions Configured**:
  - `android.permission.INTERNET` (API connectivity to SLLAS backend)
  - `android.permission.ACCESS_NETWORK_STATE` (offline / network detection)
  - `android.permission.READ_EXTERNAL_STORAGE` & `WRITE_EXTERNAL_STORAGE` (lease documents / receipts)

---

## 🚀 Option 1: One-Click Cloud APK Build (Recommended via EAS)

Expo Application Services (EAS) compiles the standalone native `.apk` on high-performance cloud builders without requiring 20GB of Android SDK / NDK tools installed on your local computer.

1. **Log in to Expo (free)**:
   ```bash
   pnpm --filter @sllas/mobile exec eas login
   ```
2. **Build the Standalone Installable APK**:
   ```bash
   pnpm --filter @sllas/mobile run build:apk
   ```
3. **Download and Install**:
   - EAS will generate a direct download URL and a terminal **QR Code**.
   - Open your Android phone's camera, scan the QR code, and tap **Download `sllas-mobile.apk`**.
   - Tap the downloaded file and select **Install**.

---

## 🛠️ Option 2: Local Android Studio / Gradle Build

The complete native Android project has been prebuilt and configured in [`apps/mobile/android/`](./android/).

### Prerequisites
- JDK 17 or JDK 21
- Android Studio / Android SDK (API 34 or 35)

### Build Commands
1. Navigate to the `apps/mobile/android` directory:
   ```bash
   cd apps/mobile/android
   ```
2. Build the release APK:
   ```bash
   # On Windows PowerShell:
   .\gradlew.bat assembleRelease

   # On macOS / Linux:
   ./gradlew assembleRelease
   ```
3. Locate the generated package:
   - File: `apps/mobile/android/app/build/outputs/apk/release/app-release.apk`
4. Install to a connected device via ADB:
   ```bash
   adb install -r apps/mobile/android/app/build/outputs/apk/release/app-release.apk
   ```

---

## 📲 Option 3: Immediate Direct Mobile Installation (PWA / WebAPK)

You can also install SLLAS directly onto your Android device without any APK transfer:

1. Start the mobile server:
   ```bash
   pnpm --filter @sllas/mobile dev
   ```
2. Open Chrome on your Android mobile device and visit:
   `http://<YOUR_PC_IP_ADDRESS>:8081`
3. Tap the Chrome menu (three dots `⋮`) and select **"Install App"** (or **"Add to Home Screen"**).
4. SLLAS Mobile will be installed as a full-screen, standalone application on your Android launcher.
