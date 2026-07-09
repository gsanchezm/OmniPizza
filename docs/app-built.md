# Mobile App Build and Release

This document describes the current mobile build pipeline for OmniPizza. The mobile app lives in `frontend-mobile/` and is built with Expo prebuild plus native Gradle/Xcode steps in GitHub Actions.

## Outputs

The current workflow produces the following artifacts:

1.  **Android**:
    - `omnipizza-release.apk` — Universal APK for real devices & emulators
    - `omnipizza-debug-androidTest.apk` — Instrumented test APK for device farm testing (Espresso/Appium)
2.  **iOS** (simulator only — see [Distribution vs. automation](#distribution-vs-automation-why-ios-is-simulator-only)):
    - `OmniPizza-Simulator.zip` — Simulator build for Appium / iOS Simulator (no signing required)
    - No `.ipa` is produced. iOS physical-device / store distribution is intentionally out of scope.

## Distribution vs. automation (why iOS is simulator-only)

Two different build **purposes** — the same codebase and `testID`s serve both:

| Purpose | Android | iOS |
| --- | --- | --- |
| **Distribution** (real users install it) | `omnipizza-release.apk` — anyone downloads & sideloads it | *(out of scope)* — iOS has **no public `.ipa` sideload**; the only public paths are the App Store or a TestFlight public link, both requiring signing + Apple review. Deliberately not pursued. |
| **UI automation** (Appium / inspection) | the **same** `omnipizza-release.apk` (UIAutomator2 reads the accessibility tree on a release APK) | **`OmniPizza-Simulator.zip`** on the iOS Simulator |

Key facts behind this decision:

- **iOS has no APK equivalent.** You cannot hand someone a `.ipa` to install like an Android APK, so "anyone downloads it" is an Android-only capability in this project.
- **Automation never targets an App Store binary.** Appium drives iOS via XCUITest / WebDriverAgent, which must *launch* the app with test state (deep links, the `detoxCountryCode` launch arg, session reset). That only works on a build the harness controls — the **simulator build** (or a dev/ad-hoc build on a real device). The store binary is for end users, not QA.
- **`testID` / `accessibilityLabel` exist in every build** (Release included — React Native does not strip them), so Appium Inspector sees the object tree on the simulator build.
- **Real-device iOS automation is possible** (dev/ad-hoc signed build + WDA) with an Apple Developer account, but is **out of scope** here — the Simulator build covers the automation need.

Net: publishing to the App Store would add nothing to automation, and iOS device distribution is intentionally skipped. Android's release APK already covers both distribution and automation.

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

### Real-device build — intentionally out of scope

- iOS is **simulator only** by decision (see [Distribution vs. automation](#distribution-vs-automation-why-ios-is-simulator-only)). No `.ipa` is built.
- A signed `.ipa` *could* be added later (certs `.p12` + provisioning profiles, `xcodebuild archive` + `-exportArchive`, App Store/TestFlight submission — e.g. via EAS), but is not part of this pipeline. The Simulator build covers Appium automation.

---

## 4. GitHub Actions Workflow

The workflow lives at `.github/workflows/mobile-release.yml`.

Current trigger:

- `workflow_dispatch` with a required `version` input (e.g. `v1.0.5`) and an optional `release_notes` input (markdown body for the release)

The workflow builds artifacts first and then creates a GitHub Release for the provided version tag, using `release_notes` as the body plus auto-generated commit notes (`generate_release_notes`).

### Pipeline Stages

1. Setup: checkout, install pnpm, install Node.js 22, install dependencies
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
   - creates GitHub Release (body from `release_notes` + auto-generated notes) with uploaded assets

### Action Versions

| Action                        | Version |
| ----------------------------- | ------- |
| `actions/checkout`            | v6      |
| `pnpm/action-setup`           | v4      |
| `actions/setup-node`          | v6      |
| `actions/setup-java`          | v5      |
| `actions/upload-artifact`     | v7      |
| `actions/download-artifact`   | v7      |
| `softprops/action-gh-release` | v2      |

---

## 5. Expected Release Assets

The final GitHub Release will contain:

| Asset                             | Platform | Use Case                               |
| --------------------------------- | -------- | -------------------------------------- |
| `omnipizza-release.apk`           | Android  | Install on real devices & emulators    |
| `omnipizza-debug-androidTest.apk` | Android  | Run instrumented tests on device farms |
| `OmniPizza-Simulator.zip`         | iOS      | Run on iOS Simulator / Appium testing  |

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
- Real-device iOS `.ipa` output is **intentionally out of scope** — iOS is simulator-only (see "Distribution vs. automation"). iOS has no public `.ipa` sideload, and Appium automates the simulator build, not a store binary.
- There is no XCUITest runner artifact in the current pipeline.
- `omnipizza-debug-androidTest.apk` is currently a minimal stub (~7 KB): the Expo-prebuilt `android/` project has no Detox/instrumented-test wiring, so it contains no real instrumented tests. Appium drives the release APK directly.
