# Mobile App Compilation Plan (Sauce Labs Style)

This plan outlines the steps to configure the OmniPizza mobile app (React Native/Expo) to generate distributable binaries for Android and iOS, similar to the [Sauce Labs Demo Apps](https://github.com/saucelabs/my-demo-app-android/releases).

## Objectives

The goal is to automatically generate and release the following artifacts on GitHub Releases:

1.  **Android**:
    *   `app-release.apk` — Universal APK for real devices & emulators
    *   `app-debug-androidTest.apk` — Instrumented test APK for device farm testing (Espresso/Appium)
2.  **iOS**:
    *   `OmniPizza-Simulator.zip` — Simulator build for Appium/Simulators (no signing required)
    *   `OmniPizza.ipa` — Real device build (*Requires Apple Developer Account — future phase*)

## Prerequisites

1.  **pnpm**: Version 10+ (matches `packageManager` in `package.json`).
2.  **Node.js**: Version 20+.
3.  **Repo Structure**: `frontend-mobile` is the root for the mobile app.
4.  **GitHub Actions**: Enabled in the repository.

---

## 1. Project Configuration (Prebuild)

We use **Expo Prebuild** to generate the native Android and iOS projects on-the-fly in CI. This keeps the repo clean (no committed `android/` or `ios/` directories) while giving full control over native build tooling (Gradle & Xcode).

### Status
- [x] `android/` and `ios/` added to `.gitignore`
- [x] `npx expo prebuild` generates native projects correctly
- [x] `app.json` configured with `com.omnipizza.app` bundle identifier

---

## 2. Android Build Strategy

We use Gradle to build both the release APK and the androidTest APK.

### Release APK
```bash
cd android && ./gradlew assembleRelease
```
*   **Output**: `android/app/build/outputs/apk/release/app-release.apk`

### Test APK (for device farms)
```bash
cd android && ./gradlew assembleAndroidTest
```
*   **Output**: `android/app/build/outputs/apk/androidTest/debug/app-debug-androidTest.apk`
*   This APK is used for running instrumented UI tests on platforms like Sauce Labs, similar to `mda-androidTest-*.apk` in the Sauce Labs releases.

### Signing
*   Currently uses the default debug keystore. For production distribution, configure a release keystore via GitHub Secrets (`ANDROID_KEYSTORE_BASE64`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`).

---

## 3. iOS Build Strategy

We use `xcodebuild` to generate the `.app` for Simulator.

### Simulator Build (No signing required)
```bash
# Install native dependencies
cd ios && pod install

# Build for simulator
xcodebuild -workspace ios/OmniPizza.xcworkspace \
  -scheme OmniPizza \
  -configuration Release \
  -sdk iphonesimulator \
  -derivedDataPath ios/build

# Zip the .app bundle
cd ios/build/Build/Products/Release-iphonesimulator
zip -r OmniPizza-Simulator.zip OmniPizza.app
```

### Real Device Build (Future — Requires Apple Developer Account)
*   Building an `.ipa` requires certificates (`.p12`) + provisioning profiles.
*   When ready, add signing secrets to GitHub and an `xcodebuild archive` + `xcodebuild -exportArchive` step.

---

## 4. GitHub Actions Workflow

The workflow lives at `.github/workflows/mobile-release.yml` and triggers on:
- **GitHub Release publication** — builds and attaches artifacts to the release
- **Manual dispatch** (`workflow_dispatch`) — for testing the pipeline without creating a release

### Pipeline Stages

1.  **Setup**: Checkout code, install pnpm 10, setup Node.js 20, install dependencies.
2.  **Prebuild**: Run `npx expo prebuild --platform <platform> --clean`.
3.  **Build Android** (ubuntu-latest):
    *   Setup JDK 17 (Zulu).
    *   `./gradlew assembleRelease` — produces `app-release.apk`.
    *   `./gradlew assembleAndroidTest` — produces `app-debug-androidTest.apk`.
    *   Upload both as artifacts + attach to GitHub Release.
4.  **Build iOS** (macos-latest):
    *   `pod install` for CocoaPods dependencies.
    *   `xcodebuild` for Simulator build.
    *   Zip `.app` bundle.
    *   Upload as artifact + attach to GitHub Release.

### Action Versions
| Action | Version |
|--------|---------|
| `actions/checkout` | v4 |
| `pnpm/action-setup` | v4 |
| `actions/setup-node` | v4 |
| `actions/setup-java` | v4 |
| `actions/upload-artifact` | v4 |
| `softprops/action-gh-release` | v2 |

---

## 5. Expected Release Assets

The final GitHub Release will contain:

| Asset | Platform | Use Case |
|-------|----------|----------|
| `app-release.apk` | Android | Install on real devices & emulators |
| `app-debug-androidTest.apk` | Android | Run instrumented tests on device farms |
| `OmniPizza-Simulator.zip` | iOS | Run on iOS Simulator / Appium testing |
| *(Future)* `OmniPizza.ipa` | iOS | Install on real iOS devices |

---

## 6. Local Build Scripts

Helper scripts in `frontend-mobile/package.json` for local development:

```bash
pnpm run prebuild           # Generate native projects
pnpm run build:android       # Build Android release APK
pnpm run build:android:test  # Build Android test APK
pnpm run build:ios:simulator # Build iOS simulator app
```

---

## Completed Steps

- [x] Configure `app.json` with bundle identifiers
- [x] Add `android/` and `ios/` to `.gitignore`
- [x] Create `.github/workflows/mobile-release.yml`
- [x] Add androidTest APK build step
- [x] Fix pnpm/Node version mismatches in workflow
- [x] Add local build helper scripts to `package.json`

## Remaining Steps

- [ ] Test the pipeline end-to-end (push a release or use `workflow_dispatch`)
- [ ] Configure Android release keystore signing (optional, for signed APKs)
- [ ] Add Apple Developer certificates for `.ipa` builds (requires paid account)
- [ ] Add XCUITest runner build for iOS test automation (similar to Sauce Labs `XCUITest.zip`)
