# Mobile App Build and Release

This document describes the current mobile build pipeline for OmniPizza. The mobile app lives in `frontend-mobile/` and is built with Expo prebuild plus native Gradle/Xcode steps in GitHub Actions.

## Outputs

The current workflow produces the following artifacts:

1.  **Android**:
    - `omnipizza-release.apk` — Universal APK for real devices & emulators
    - `omnipizza-debug-androidTest.apk` — Instrumented test APK for device farm testing (Espresso/Appium)
2.  **iOS**:
    - `OmniPizza-Simulator.zip` — Simulator build for Appium/Simulators (no signing required)
    - `OmniPizza.ipa` — Real device build (_future phase_)

## Prerequisites

1. `pnpm` 10+
2. Node.js 20+
3. `frontend-mobile/` as the mobile app root
4. GitHub Actions enabled

---

## 1. Project Configuration

We use **Expo Prebuild** to generate the native Android and iOS projects on-the-fly in CI. This keeps the repo clean (no committed `android/` or `ios/` directories) while giving full control over native build tooling (Gradle & Xcode).

### Current status

- `android/` and `ios/` are generated through Expo prebuild in CI
- native folders are ignored in git
- `frontend-mobile/app.json` contains bundle/package identifiers used during prebuild

---

## 2. Android Build Strategy

We use Gradle to build both the release APK and the androidTest APK.

### Release APK

```bash
cd android && ./gradlew assembleRelease
```

- **Output**: `android/app/build/outputs/apk/release/omnipizza-release.apk` (renamed from app-release.apk)

### Test APK (for device farms)

```bash
cd android && ./gradlew assembleAndroidTest
```

- **Output**: `android/app/build/outputs/apk/androidTest/debug/omnipizza-debug-androidTest.apk` (renamed from app-debug-androidTest.apk)
- This APK is used for running instrumented UI tests on platforms like Sauce Labs, similar to `mda-androidTest-*.apk` in the Sauce Labs releases.

### Signing

- Currently uses the default debug keystore. For production distribution, configure a release keystore via GitHub Secrets (`ANDROID_KEYSTORE_BASE64`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`).

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

- Building an `.ipa` requires certificates (`.p12`) + provisioning profiles.
- When ready, add signing secrets to GitHub and an `xcodebuild archive` + `xcodebuild -exportArchive` step.

---

## 4. GitHub Actions Workflow

The workflow lives at `.github/workflows/mobile-release.yml`.

Current trigger:

- `workflow_dispatch` with a required `version` input

The workflow builds artifacts first and then creates a GitHub Release for the provided version tag.

### Pipeline Stages

1. Setup: checkout, install pnpm, install Node.js 20, install dependencies
2. Prebuild: `npx expo prebuild --platform <platform> --clean`
3. Android build on `ubuntu-latest`:
   - JDK 17
   - `./gradlew assembleRelease`
   - `./gradlew assembleAndroidTest`
   - rename artifacts to `omnipizza-release.apk` and `omnipizza-debug-androidTest.apk`
4. iOS simulator build on `macos-latest`:
   - `pod install`
   - `xcodebuild` simulator build
   - zip `OmniPizza.app` into `OmniPizza-Simulator.zip`
5. Release job:
   - downloads artifacts
   - creates GitHub Release with uploaded assets

### Action Versions

| Action                        | Version |
| ----------------------------- | ------- |
| `actions/checkout`            | v4      |
| `pnpm/action-setup`           | v4      |
| `actions/setup-node`          | v4      |
| `actions/setup-java`          | v4      |
| `actions/upload-artifact`     | v4      |
| `softprops/action-gh-release` | v2      |

---

## 5. Expected Release Assets

The final GitHub Release will contain:

| Asset                             | Platform | Use Case                               |
| --------------------------------- | -------- | -------------------------------------- |
| `omnipizza-release.apk`           | Android  | Install on real devices & emulators    |
| `omnipizza-debug-androidTest.apk` | Android  | Run instrumented tests on device farms |
| `OmniPizza-Simulator.zip`         | iOS      | Run on iOS Simulator / Appium testing  |
| _(Future)_ `OmniPizza.ipa`        | iOS      | Install on real iOS devices            |

---

## 6. Local Build Scripts

Available scripts in `frontend-mobile/package.json`:

```bash
pnpm prebuild            # Generate native projects
pnpm build:android       # Build Android release APK
pnpm build:android:test  # Build Android test APK
pnpm build:ios:simulator # Build iOS simulator app
```

---

## Notes

- The workflow currently creates releases only from manual dispatch.
- Android release signing still uses the current Gradle setup; production signing secrets are not documented here yet.
- Real-device iOS `.ipa` output is not implemented in the workflow.
- There is no XCUITest runner artifact in the current pipeline.
