# API Examples

Collection de ejemplos de uso del API de OmniPizza.

## Authentication

### Login - Standard User

```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "standard_user",
    "password": "pizza123"
  }'
```

Response:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "username": "standard_user",
  "behavior": "standard"
}
```

### Login - Locked Out User (Error)

```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "locked_out_user",
    "password": "pizza123"
  }'
```

Response (403):
```json
{
  "detail": "Sorry, this user has been locked out."
}
```

### Get Test Users

```bash
curl http://localhost:8000/api/auth/users
```

## Countries

### List All Countries

```bash
curl http://localhost:8000/api/countries
```

To inspect a single country, filter the list client-side (example with `jq`):

```bash
curl -s http://localhost:8000/api/countries | jq '.[] | select(.code=="MX")'
```

Response item example:

```json
{
  "code": "MX",
  "currency": "MXN",
  "currency_symbol": "$",
  "required_fields": ["colonia"],
  "optional_fields": ["propina", "zip_code"],
  "tip_field": "propina",
  "tip_mode": "percentage",
  "tip_percentages": [0, 5, 10, 15],
  "tax_rate": 0.16,
  "delivery_fee": 35.1,
  "languages": ["es"],
  "decimal_places": 2
}
```

## Pizzas

### Get Catalog (Mexico)

```bash
curl http://localhost:8000/api/pizzas \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "X-Country-Code: MX"
```

Response:
```json
{
  "pizzas": [
    {
      "id": "p01",
      "name": "Margherita",
      "description": "Tomate, mozzarella, albahaca",
      "price": 227.97,
      "currency": "MXN",
      "currency_symbol": "$",
      "image": "https://images.unsplash.com/..."
    }
  ],
  "country_code": "MX",
  "currency": "MXN"
}
```

### Get Catalog (Japan - Sin decimales)

```bash
curl http://localhost:8000/api/pizzas \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "X-Country-Code: JP"
```

Response:
```json
{
  "pizzas": [
    {
      "id": "p01",
      "name": "Margherita",
      "price": 2051,
      "currency": "JPY",
      "currency_symbol": "¥"
    }
  ]
}
```

## Checkout

### Checkout - Mexico

```bash
curl -X POST http://localhost:8000/api/checkout \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "country_code": "MX",
    "items": [
      {"pizza_id": "p01", "quantity": 2, "size": "large", "toppings": []},
      {"pizza_id": "p02", "quantity": 1, "size": "small", "toppings": []}
    ],
    "name": "Juan Pérez",
    "address": "Av. Insurgentes 123",
    "phone": "5512345678",
    "colonia": "Roma Norte",
    "propina": 10
  }'
```

`propina`, `tip`, `trinkgeld`, and `chip` are **percentage values**, not fixed amounts.

### Checkout - USA (tax + localized delivery fee)

```bash
curl -X POST http://localhost:8000/api/checkout \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "country_code": "US",
    "items": [
      {"pizza_id": "p01", "quantity": 1}
    ],
    "name": "John Doe",
    "address": "123 Main St",
    "phone": "5551234567",
    "zip_code": "90210"
  }'
```

Response:
```json
{
  "order_id": "ORDER-A1B2C3D4",
  "subtotal": 12.99,
  "delivery_fee": 2.0,
  "tax_rate": 0.08,
  "tip_percentage": 0.0,
  "tax": 1.04,
  "tip": 0.0,
  "total": 16.03,
  "currency": "USD",
  "currency_symbol": "$",
  "items": [...],
  "timestamp": "2026-04-18T10:30:00"
}
```

### Checkout - Error (Missing required field)

```bash
curl -X POST http://localhost:8000/api/checkout \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "country_code": "MX",
    "items": [{"pizza_id": "p01", "quantity": 1}],
    "name": "Test User",
    "address": "Test Address",
    "phone": "1234567890"
  }'
```

Response (400):
```json
{
  "detail": "Field 'colonia' is required for country MX"
}
```

## Orders

### Get Order History

```bash
curl http://localhost:8000/api/orders \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get Specific Order

```bash
curl http://localhost:8000/api/orders/ORDER-A1B2C3D4 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Session Setup Endpoints

These endpoints are for external automation setup (Playwright/Appium/Gatling).

Common headers for setup/session routes:

```bash
-H "Authorization: Bearer YOUR_TOKEN" \
-H "Content-Type: application/json"
```

### Reset Session State

```bash
curl -X POST http://localhost:8000/api/session/reset \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Set Market for Session

```bash
curl -X POST http://localhost:8000/api/store/market \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "country_code": "US"
  }'
```

### Seed Cart for Session

```bash
curl -X POST http://localhost:8000/api/cart \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {"pizza_id": "p01", "quantity": 2, "size": "medium"},
      {"pizza_id": "p02", "quantity": 1, "size": "large"}
    ]
  }'
```

> `size` is optional (defaults to `"small"`). Valid values: `small`, `medium`, `large`, `family`.

### Get Cart (Enriched)

Returns cart items joined with the pizza catalog (name, price, image, currency) for the given market.

```bash
curl http://localhost:8000/api/cart \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "X-Country-Code: US"
```

Response:
```json
{
  "username": "standard_user",
  "country_code": "US",
  "cart_items": [
    {
      "pizza_id": "p02",
      "name": "Pepperoni",
      "size": "large",
      "quantity": 1,
      "price": 14.99,
      "base_price": 14.99,
      "currency": "USD",
      "currency_symbol": "$",
      "image": "https://upload.wikimedia.org/wikipedia/commons/d/d1/Pepperoni_pizza.jpg"
    }
  ],
  "updated_at": "2026-03-11T18:18:28.664814"
}
```

> Both web and mobile checkout screens automatically call this endpoint on load to hydrate the cart from backend state. This enables E2E test frameworks to inject cart state via `POST /api/cart` then navigate directly to checkout.

### Read Current Session State

```bash
curl http://localhost:8000/api/session \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Debug Endpoints

### Latency Spike

```bash
curl http://localhost:8000/api/debug/latency-spike
```

Response:
```json
{
  "message": "Latency spike completed",
  "delay_seconds": 3.47,
  "timestamp": "2024-01-15T10:30:00"
}
```

### CPU Load

```bash
curl http://localhost:8000/api/debug/cpu-load
```

### Prometheus Metrics

```bash
curl http://localhost:8000/api/debug/metrics
```

### Debug Info

```bash
curl http://localhost:8000/api/debug/info
```

Response:
```json
{
  "app_name": "OmniPizza QA Platform",
  "version": "1.0.0",
  "environment": "production",
  "total_orders": 42,
  "test_users": ["standard_user", "locked_out_user", ...],
  "supported_countries": ["MX", "US", "CH", "JP"]
}
```

## Error Responses

### 400 - Bad Request

```json
{
  "error": "X-Country-Code header is required",
  "status_code": 400,
  "timestamp": "2024-01-15T10:30:00"
}
```

### 401 - Unauthorized

```json
{
  "error": "Could not validate credentials",
  "status_code": 401,
  "timestamp": "2024-01-15T10:30:00"
}
```

### 403 - Forbidden

```json
{
  "error": "Sorry, this user has been locked out.",
  "status_code": 403,
  "timestamp": "2024-01-15T10:30:00"
}
```

### 500 - Internal Server Error (error_user)

```json
{
  "error": "Random checkout error triggered for testing purposes",
  "status_code": 500,
  "timestamp": "2024-01-15T10:30:00"
}
```
