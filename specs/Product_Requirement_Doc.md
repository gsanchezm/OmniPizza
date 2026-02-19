# Product Requirements Document (PRD) - OmniPizza

## 1. Introduction
**OmniPizza** is a QA testing platform designed to facilitate UI and API automation practice. It simulates a multi-platform food ordering service with deterministic user behaviors, multi-market pricing complexities, and internationalization challenges. The primary goal is to provide a robust sandbox environment for Quality Assurance engineers and developers to test various scenarios, including happy paths, edge cases, and failure modes.

## 2. Target Audience
*   **QA Engineers:** To practice writing automated tests (Selenium, Cypress, Playwright, Appium) against a predictable yet complex application.
*   **Developers:** To understand how to build testable applications with features like deterministic chaos and observability.
*   **Students/Learners:** To gain hands-on experience with modern web and mobile testing frameworks.

## 3. User Personas (Test Users)
The application provides specific user accounts with predefined behaviors to simulate real-world scenarios:

| Username | Password | Behavior Description |
| :--- | :--- | :--- |
| **standard_user** | pizza123 | Represents a normal user. Standard performance, no errors, correct pricing and images. |
| **locked_out_user** | pizza123 | Simulates a user who cannot log in. Attempts result in a 403 Forbidden error. |
| **problem_user** | pizza123 | Simulates a user experiencing data issues. Sees $0 prices and broken product images. |
| **performance_glitch_user** | pizza123 | Simulates a user on a slow network or experiencing backend latency. All API requests have a ~3s delay. |
| **error_user** | pizza123 | Simulates system instability. Checkout process fails with a 500 Internal Server Error approximately 50% of the time. |

## 4. Functional Requirements

### 4.1. Authentication
*   **Login:** Users must be able to log in using a username and password.
*   **Market Selection:** Users must select a market (MX, US, CH, JP) upon login. This selection determines the application's locale, currency, and business logic.
*   **Logout:** Users must be able to log out, clearing their session and returning to the login screen.
*   **Persistence:** Authentication state should persist across page reloads (Web: localStorage, Mobile: AsyncStorage).

### 4.2. Catalog & Products
*   **View Pizzas:** Display a list of available pizzas with images, names, descriptions, and prices.
*   **Multi-Market Pricing:** Prices must be displayed in the currency of the selected market (USD, MXN, CHF, JPY).
*   **Localization:** Product names and descriptions must be translated based on the selected market's default language (EN, ES, DE/FR, JA).
*   **Dynamic Data:** The `problem_user` should see modified (incorrect) product data.

### 4.3. Shopping Cart
*   **Add to Cart:** Users can add items to their cart from the catalog.
*   **Update Quantity:** Users can increase or decrease the quantity of items in the cart.
*   **Remove Items:** Users can remove items from the cart.
*   **Cart Summary:** Display total items and total price in the correct currency.

### 4.4. Checkout & Ordering
*   **Dynamic Form:** The checkout form must adapt to the selected market's requirements:
    *   **MX (Mexico):** Requires `colonia`. Prices in MXN. Tip optional.
    *   **US (USA):** Requires `zip_code` (5 digits). Prices in USD. Adds 8% tax.
    *   **CH (Switzerland):** Requires `plz`. Prices in CHF. Supports DE/FR language toggle.
    *   **JP (Japan):** Requires `prefectura`. Prices in JPY (no decimals).
*   **Validation:** Client-side and server-side validation for required fields.
*   **Order Placement:** Users can submit an order. Successful orders display a confirmation screen.
*   **Payment Simulation:**
    *   **Credit Card:** Selectable via toggle. Displays a card form with fields: Cardholder Name, Card Number, Expiry Date (MM/YY), and CVV. All fields are required when card is selected. Card data is UI-only and is **not** sent to the backend.
    *   **Cash on Delivery:** Selectable via toggle. Hides the card form; no card details are required.
    *   Payment method buttons use `data-testid="payment-card"` and `data-testid="payment-cash"`.
*   **Phone Validation:** Phone input uses `type="tel"` with pattern validation (7-20 characters: digits, spaces, +, -, parentheses). Invalid input shows a localized validation message.
*   **Empty Cart:** When the cart is empty, the checkout page displays a "Start Your Order" button that navigates back to the catalog.
*   **Chaos:** The `error_user` should experience random failures during checkout submission.

### 4.5. User Profile
*   **View Details:** Users can view their profile information (Name, Address, Phone).
*   **Edit Details:** Users can update their delivery information.
*   **Auto-fill:** Profile information should automatically populate the checkout form.

### 4.6. Mobile Specifics
*   **Pizza Builder:** A mobile-exclusive feature allowing users to customize pizzas (Size, Crust, Toppings).
*   **Orientation:** Support for both portrait and landscape modes.
*   **Native Navigation:** Smooth transitions between screens using native navigation patterns.

## 5. Non-Functional Requirements
*   **Testability:** All interactive elements must have unique `data-testid` attributes to facilitate stable automation selectors.
*   **Observability:** The backend must expose metrics (Prometheus) and logs for debugging.
*   **Ephemeral State:** The backend database is in-memory and resets on restart, ensuring a clean state for testing sessions.
*   **Performance:** Standard requests should respond quickly (<500ms), except for specific chaos scenarios.
*   **Responsiveness:** The web application must be fully responsive (Mobile, Tablet, Desktop).

## 6. Chaos Engineering & Debugging
*   **Debug Endpoints:** The API must expose endpoints to trigger artificial system stress (e.g., CPU load, latency spikes) for reliability testing.
*   **Deterministic Failure:** Failure modes (latency, errors) must be predictable based on the logged-in user to allow reliable test assertions.
