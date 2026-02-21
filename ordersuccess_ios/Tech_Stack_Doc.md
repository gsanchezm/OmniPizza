# Tech Stack Document - OmniPizza

## 1. Overview
This document outlines the technology decisions made for the OmniPizza platform. The stack was chosen to prioritize **developer experience**, **testability**, and **ease of deployment**.

## 2. Backend Stack

| Category | Technology | Version | Justification |
| :--- | :--- | :--- | :--- |
| **Language** | Python | 3.10+ | Excellent ecosystem for web APIs and testing tools. |
| **Web Framework** | FastAPI | Latest | High performance (async), automatic OpenAPI (Swagger) generation, intuitive typing with Pydantic. |
| **Validation** | Pydantic | V2 | Strong data validation, used for request/response schemas. |
| **Authentication** | PyJWT | Latest | Standard solution for stateless JWT authentication. |
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

## 4. Frontend Mobile Stack

| Category | Technology | Justification |
| :--- | :--- | :--- |
| **Framework** | React Native | Write once, run on iOS and Android. Reuses React knowledge. |
| **Platform** | Expo | Simplifies the React Native development workflow (no native bridging code required for most features). |
| **Navigation** | React Navigation | Standard library for routing in React Native. |
| **State Management**| Zustand | Consistent with Web frontend. |
| **Storage** | AsyncStorage | Key-value storage system for unencrypted, asynchronous, persistent, global, data storage. |

## 5. DevOps & Infrastructure

| Category | Technology | Justification |
| :--- | :--- | :--- |
| **Containerization**| Docker | Ensures consistency between dev and prod environments. |
| **Orchestration** | Docker Compose | Simplifies running multi-container applications locally (Backend + Frontend). |
| **Cloud Provider** | Render | Simple PaaS for deploying web services and static sites directly from Git. |
| **Version Control** | Git | Distributed version control. |

## 6. Key Libraries & Tools

### Backend
*   **`faker`**: For generating random dummy data if needed.
*   **`python-multipart`**: Required for form data parsing in FastAPI.
*   **`prometheus-fastapi-instrumentator`**: Exports metrics for monitoring.

### Frontend
*   **`lucide-react`**: Consistent icon set.
*   **`clsx` / `tailwind-merge`**: Utilities for constructing className strings conditionally.

## 7. Testing Ecosystem
The project makes heavy use of:
*   **`data-testid`**: A convention for reliable DOM selection in automated tests.
*   **Chaos Middleware**: Custom code to inject faults (latency, errors) for testing robustness.
*   **Vitest API Tests** (`tests/api.test.ts`): TypeScript integration tests covering auth, catalog, checkout (all 4 markets), user behaviors, and debug endpoints.
*   **Schemathesis** (legacy): Python-based contract tests validating API against OpenAPI spec.
