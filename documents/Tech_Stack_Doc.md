# Tech Stack Document - OmniPizza

## 1. Overview
This document outlines the technology decisions made for the OmniPizza platform. The stack was chosen to prioritize **developer experience**, **testability**, and **ease of deployment**.

## 2. Backend Stack

| Category | Technology | Version | Justification |
| :--- | :--- | :--- | :--- |
| **Language** | Python | 3.10+ | Excellent ecosystem for web APIs and testing tools. |
| **Web Framework** | FastAPI | Latest | High performance (async), automatic OpenAPI (Swagger) generation, intuitive typing with Pydantic. |
| **Validation** | Pydantic | V2 | Strong data validation, used for request/response schemas. |
| **Authentication** | python-jose | Latest | Standard solution for stateless JWT authentication. |
| **Server** | Uvicorn | Latest | Lightning-fast ASGI server implementation. |
| **Testing** | Pytest | Latest | Industry standard testing framework for Python. |
| **Contract Testing**| Schemathesis | Latest | Validates API compliance against the generated OpenAPI schema (legacy). |

## 2.1. API Integration Testing (TypeScript)

| Category | Technology | Version | Justification |
| :--- | :--- | :--- | :--- |
| **Language** | TypeScript | 5.x | Type safety for test code, consistent with mobile codebase. |
| **Test Runner** | Vitest | Latest | Fast, ESM-native test runner with watch mode and interactive UI. |
| **HTTP Client** | Axios | Latest | Consistent with frontend clients, supports interceptors. |
| **Package Manager** | pnpm | Latest | Fast, disk-efficient package management. |

## 3. Frontend Web Stack

| Category | Technology | Justification |
| :--- | :--- | :--- |
| **Language** | JavaScript (ES6+) | Universal web language. |
| **Framework** | React | Component-based UI formulation, massive ecosystem. |
| **Build Tool** | Vite | Extremely fast dev server and optimized builds. |
| **Styling** | TailwindCSS | Utility-first CSS for rapid UI development and consistent design tokens. |
| **State Management**| Zustand | Minimalistic, hook-based state management (simpler than Redux). |
| **HTTP Client** | Axios | robust feature set for API requests (interceptors, cancellation). |
| **Router** | React Router | Standard routing solution for SPAs. |
| **Testing** | Cypress | Component testing for individual React components. |

## 4. Frontend Mobile Stack

| Category | Technology | Justification |
| :--- | :--- | :--- |
| **Framework** | React Native 0.81 | Write once, run on iOS and Android. Reuses React knowledge. |
| **Platform** | Expo 54 | Simplifies the React Native development workflow (no native bridging code required for most features). |
| **Navigation** | React Navigation 7 (Native Stack) | Standard library for routing in React Native. Deep linking via `omnipizza://` scheme configured via `LinkingOptions`. |
| **State Management** | Zustand 5 | Consistent with Web frontend. Ephemeral (no persistence layer). |
| **Package Manager** | pnpm (`node-linker=hoisted`) | Flat `node_modules` layout required for Metro bundler compatibility. |

### 4.1 Deep Link Configuration

`omnipizza://` is the registered URI scheme (`app.json → scheme`). React Navigation's `linking` prop maps each route:

| Deep Link | Screen | Key Params |
| :--- | :--- | :--- |
| `omnipizza://login` | Login | `resetSession` |
| `omnipizza://catalog` | Catalog | `market`, `lang` |
| `omnipizza://pizza-builder` | PizzaBuilder | `pizzaId`, `size`, `market`, `lang` |
| `omnipizza://checkout` | Checkout | `market`, `lang`, `hydrateCart`, `accessToken` |
| `omnipizza://order-success` | OrderSuccess | `orderId`, `market`, `lang` |
| `omnipizza://profile` | Profile | `market`, `lang` |

Side-effect params (`accessToken`, `market`, `lang`, `hydrateCart`, `resetSession`) are processed by the `useDeepLinkParams` hook in `App.tsx`. `accessToken` is applied first so any downstream fetch (e.g. cart hydration) is already authenticated.

## 5. DevOps & Infrastructure

| Category | Technology | Justification |
| :--- | :--- | :--- |
| **Containerization** | Docker | Ensures consistency between dev and prod environments. |
| **Orchestration** | Docker Compose | Simplifies running multi-container applications locally (Backend + Frontend). |
| **Cloud Provider** | Render | Simple PaaS for deploying web services and static sites directly from Git. |
| **Version Control** | Git | Distributed version control. |
| **Mobile CI/CD** | GitHub Actions (`mobile-release.yml`) | Manual-dispatch workflow that runs `expo prebuild`, builds Android release APK + test APK and iOS Simulator `.app`, then publishes all artifacts as a GitHub Release. |
| **GitHub Pages** | Static HTML + CSS | Landing page for the project; responsive for desktop, tablet, and mobile. |

## 6. Key Libraries & Tools

### Backend
*   **`python-multipart`**: Required for form data parsing in FastAPI.
*   **`prometheus-client`**: Exports metrics for monitoring.

### Frontend
*   **`zustand`**: For lightweight, hook-based state management.
*   **`autoprefixer` / `postcss`**: Required for processing TailwindCSS.

## 7. Testing Ecosystem

The project makes heavy use of:

*   **`data-testid` / `testID` / `accessibilityLabel`**: Unified stable selector convention across web and mobile. Prefixes: `btn-`, `input-`, `text-`, `view-`, `img-`, `card-`, `screen-`. Mobile text-bearing controls also expose readable accessibility values so Appium/XCUITest `getText()` returns visible text instead of only the identifier.
*   **Cypress Frontend Component Tests**: Reliably test individual React web components in isolation (`frontend/cypress/component/`).
*   **Chaos Middleware**: Custom code to inject faults (latency, errors) for testing robustness.
*   **Vitest API Tests** (`tests/api.test.ts`): TypeScript integration tests covering auth, catalog, checkout (all 4 markets), user behaviors, and debug endpoints.
*   **Schemathesis** (legacy): Python-based contract tests validating API against OpenAPI spec.
*   **Atomic Web Testing** (`ATOMIC_WEB_TESTING.md`): Pattern for opening any web route directly via Playwright `addInitScript` + `localStorage` injection after API cart seeding. No full user journey required.
*   **Atomic Mobile Testing** (`ATOMIC_MOBILE_TESTING.md`): Pattern for opening any mobile screen directly via `omnipizza://` deep links (`adb` / `xcrun simctl`) after API cart seeding. Supported by the `useDeepLinkParams` hook and React Navigation `linking` config.

### Recommended External Runners

| Layer | Tool | Pattern |
| :--- | :--- | :--- |
| Web E2E | Playwright | `addInitScript` → seed cart via API → `page.goto('/checkout')` |
| Mobile E2E | Appium / WebdriverIO | Seed cart via API → `deepLink('omnipizza://checkout?hydrateCart=true&accessToken=<jwt>')` |
| Mobile E2E | Detox | `device.launchApp({ launchArgs: { detoxCountryCode: 'MX' } })` |
| API | Vitest / Postman / Gatling | Direct HTTP against `omnipizza-backend.onrender.com` |
