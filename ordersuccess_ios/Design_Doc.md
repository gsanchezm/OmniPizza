# Design Document - OmniPizza

## 1. System Overview
OmniPizza is a full-stack application architected to support rigorous QA testing scenarios. It follows a client-server architecture with a clear separation of concerns between the backend API and the frontend clients (Web and Mobile). The system is designed to be ephemeral, meaning data persistence is temporary (in-memory) to guarantee a clean slate for every test session restart.

## 2. High-Level Architecture

```mermaid
graph TD
    User[User / Test Runner] -->|HTTPS| WebApp[Web Frontend (React)]
    User -->|HTTPS| MobileApp[Mobile App (React Native)]
    
    WebApp -->|REST API| Backend[FastAPI Backend]
    MobileApp -->|REST API| Backend
    
    subgraph Backend Services
        Backend --> Auth[Auth Service (JWT)]
        Backend --> Logic[Business Logic & Chaos Engine]
        Backend --> DB[(In-Memory Database)]
        Logic --> Middleware[Chaos Middleware]
    end
```

## 3. Backend Design (FastAPI)

### 3.1. Core Components
*   **Framework:** FastAPI (Python) for high performance and automatic OpenAPI documentation generation.
*   **Database:** Custom `InMemoryDB` class. It holds lists of `User`, `Pizza`, `Order`, and `Session` objects. Resets on application startup.
*   **Authentication:** JWT (JSON Web Tokens). Tokens contain the `username` and `behavior` claims, allowing the server to apply specific logic per request without stateful session lookups for behavior.

### 3.2. Middleware & Chaos Engine
*   **`require_country_header`**: Intercepts requests to ensure the `X-Country-Code` header is present, enforcing the multi-market context.
*   **`apply_user_behavior`**: This is the heart of the chaos engine. It inspects the user's `behavior` claim from the JWT and dynamically:
    *   Injects latency (`time.sleep`) for `performance_glitch_user`.
    *   Modifies response data (prices = 0) for `problem_user`.
    *   Injects HTTP 500 errors for `error_user`.

### 3.3. API Structure
*   **`/api/auth`**: `login`, `users`.
*   **`/api/pizzas`**: CRUD for products (Read-only for users). Returns data localized based on headers.
*   **`/api/checkout`**: Order processing. Validates headers and body schema dynamically based on the country code.
*   **`/api/debug`**: Endpoints to manually trigger system stress (CPU, Memory) for load testing scenarios.

## 4. Frontend Design (Web - React)

### 4.1. Architecture
*   **Framework:** React with Vite build tool.
*   **State Management:** `Zustand`.
    *   `useAuthStore`: Manages JWT, user info, and behavior flags.
    *   `useCountryStore`: Manages selected market, currency, and language codes.
    *   `useCartStore`: Manages cart items and totals.
*   **Styling:** TailwindCSS for utility-first styling.
*   **Persistence:** `zustand/middleware/persist` syncs state to `localStorage`.

### 4.2. Key Modules
*   **Market Selector:** A critical component that sets the global context (Currency, Language, Validation Rules) before the user enters the main app flow.
*   **Dynamic Checkout:** A form component that renders different input fields based on the active `countryCode` (MX: colonia, US: zip_code, CH: plz, JP: prefectura). Includes a payment method toggle (Credit Card / Cash) that conditionally shows/hides credit card input fields (Cardholder, Card Number, Expiry, CVV). Phone input includes `type="tel"` validation.
*   **Testability:** A strict convention of applying `data-testid` attributes to all interactive elements (buttons, inputs, cards) to support Selenium/Cypress selectors.

## 5. Mobile Design (React Native)

### 5.1. Architecture
*   **Framework:** React Native with Expo.
*   **Navigation:** React Navigation (Stack & Tab).
*   **State Sharing:** logic mirrors the Web frontend, often reusing logic concepts (Zustand stores).

### 5.2. Unique Features
*   **Pizza Builder:** A dedicated screen for custom pizza creation, leveraging mobile-specific UI controls (sliders, touchables).
*   **Native Orientation:** Handles device rotation changes seamlessly.

## 6. Data Model (Conceptual)

### 6.1. User
```json
{
  "username": "standard_user",
  "password": "hashed_...",
  "behavior": "standard", // locked_out, problem, etc.
  "roles": ["customer"]
}
```

### 6.2. Pizza (Catalog Item)
```json
{
  "id": "pepperoni",
  "name": { "en": "Pepperoni", "es": "Pepperoni", "de": "Salami" },
  "price_base_usd": 12.99,
  "image_url": "/assets/pepperoni.png"
}
```

### 6.3. Order
```json
{
  "order_id": "ord_123",
  "user": "standard_user",
  "items": [...],
  "total": 15.50,
  "currency": "USD",
  "country": "US",
  "delivery_info": { "address": "...", "zip_code": "90210" }
}
```

## 7. Infrastructure

### 7.1. Deployment (Render)
*   **Web**: Static site hosting for the React build.
*   **Backend**: Python web service.
*   **Docker**: Used for consistent local development and as the deployment artifact format.

### 7.2. Continuous Integration
*   **API Integration Tests**: TypeScript tests using Vitest validate auth, catalog, checkout flows (all 4 markets), user behaviors, and debug endpoints (`tests/api.test.ts`).
*   **Contract Tests (Legacy)**: Schemathesis validates API compliance against the OpenAPI spec.
*   **Mobile CI**: GitHub Actions workflow builds Android APK and iOS IPA, with release asset uploads via `softprops/action-gh-release@v2`.
