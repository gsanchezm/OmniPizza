# 🍕 OmniPizza v1.0.0 (First Official Release)

Welcome to the official **v1.0.0** release of OmniPizza! 🎉
This version marks a significant milestone, consolidating OmniPizza as a complete and stable Quality Assurance (QA) platform, featuring fully integrated Web and Mobile applications powered by a dynamic backend.

## 🌟 Key Features

### 📱 Mobile Application (React Native/Expo)
- **Deep Linking Support (`omnipizza://`)**: Direct navigation to Checkout and Catalog, bypassing intermediate screens via `accessToken`. Ideal for **Atomic Testing**.
- **Native Catalog & Checkout**: Robust user experience utilizing our custom `cartService` and `pizzaService` flows.
- **Integrated CI/CD Pipeline**: Automated artifact generation for Android (`.apk` for release and debug) and iOS (`.zip` for Simulators) using the latest 2026 GitHub Actions.

### 🌐 Web Application (React/Vite)
- **100% Responsive & Test-Ready**: All interactive elements now include `data-testid` properties to simplify E2E automation.
- **Cart Hydration (API State Injection)**: Direct backend-level cart state loading and manipulation prior to navigating to the checkout order.

### ⚙️ Backend & Testing Engine (FastAPI)
- **Injectable Test Users**: Configurable profiles with simulated behaviors (`standard`, `problem`, `locked_out`, `performance_glitch` with an intentional 3s delay, and `error`).
- **Dynamic Multi-Country Validation (MX, US, CH, JP)**: Country-specific rules, taxes, and automatic currency conversions enforced via the `X-Country-Code` header.
- **Chaos & Load Testing Endpoints**: Ready-to-use endpoints designed to evaluate integration stability by dynamically injecting failures (500) and latency spikes.

## 🛠 Technical Highlights
* **Infrastructure**: Migrated our GitHub Action dependencies to `Node.js v22` (`checkout@v6`, `setup-node@v6`, `upload-artifact@v7`). Automated local setup using `docker-compose.yml`.
* **Testing**: Embedded contract testing using `Schemathesis`, establishing strict schema compliance validation based on our OpenAPI models.

*The source code of this project is now considered 100% stable for production or local deployments (via Render / Docker) and is ready for advanced QA test automation.*
