# Quick Start Guide

## Para Desarrolladores

### Setup Inicial

```bash
# Clonar el repositorio
git clone <repository-url>
cd omnipizza

# Opción 1: Docker Compose (Más fácil)
docker-compose up -d

# Opción 2: Local Development
# Terminal 1 - Backend
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python main.py

# Terminal 2 - Frontend
cd frontend
npm install
npm run dev
```

### URLs

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/api/docs

## Para QA Engineers

### Credenciales de Prueba

Usa cualquiera de estos usuarios con password `pizza123`:

1. **standard_user** - Flujo normal sin errores
2. **locked_out_user** - Usuario bloqueado (403)
3. **problem_user** - Imágenes rotas y precios en $0
4. **performance_glitch_user** - Delay de 3 segundos en todas las llamadas
5. **error_user** - 50% de probabilidad de error 500 en checkout

### Flujo de Prueba Básico

1. **Login**: Selecciona un usuario de prueba
2. **Catálogo**: Navega y agrega pizzas al carrito
3. **Cambio de país**: Prueba con MX, US, CH, JP
4. **Checkout**: Completa el formulario (campos cambian según país)

### Validaciones por País

| País | Campo Requerido | Formato | Impuesto |
|------|----------------|---------|----------|
| MX   | colonia        | texto   | 16%      |
| US   | zip_code       | 5 dígitos | 8%     |
| CH   | plz            | texto   | 8.1%     |
| JP   | prefectura     | texto   | 10%      |

Las propinas ahora son porcentuales por mercado:

- MX: `propina`
- US: `tip`
- CH: `trinkgeld`
- JP: `chip`
- Opciones visuales en web y móvil: `0%`, `5%`, `10%`, `15%`
- Default seleccionado: `0%`

## Para Test Automation

### Selectores Disponibles

Selectores representativos actuales:

```javascript
// Web login
'input-username'
'input-password'
'btn-login'
'btn-user-standard_user'

// Web checkout
'order-tip-0'
'order-tip-5'
'order-tip-10'
'order-tip-15'
'order-total'

// Mobile checkout
'screen-checkout'
'btn-tip-0'
'btn-tip-5'
'btn-tip-10'
'btn-tip-15'
'text-subtotal-value'
'text-tax-value'
'text-total-value'
```

### Ejemplo con Playwright

```javascript
await page.fill('[data-testid="input-username"]', 'standard_user');
await page.fill('[data-testid="input-password"]', 'pizza123');
await page.click('[data-testid="btn-login"]');
await page.click('[data-testid="order-tip-0"]');
```

### Cart State Injection (E2E Automation)

For E2E tests (Playwright, Appium, Gatling), you can inject cart state via the API and have the frontend hydrate it automatically:

```bash
# 1. Login to get a token
TOKEN=$(curl -s -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"standard_user","password":"pizza123"}' | jq -r '.access_token')

# 2. Set market
curl -X POST http://localhost:8000/api/store/market \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"country_code":"US"}'

# 3. Seed cart via API
curl -X POST http://localhost:8000/api/cart \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"items":[{"pizza_id":"p01","quantity":2,"size":"medium"}]}'

# 4. Navigate to /checkout — the frontend fetches GET /api/cart and hydrates the cart automatically
```

Both web and mobile checkout screens call `GET /api/cart` on load and populate the cart store from the backend response.

### Contract Testing

```bash
cd tests
pip install -r requirements.txt
pytest test_contract.py -v
```

## Troubleshooting

### Backend no inicia

```bash
# Verificar puerto 8000 está libre
lsof -ti:8000 | xargs kill -9

# Reinstalar dependencias
pip install -r requirements.txt --force-reinstall
```

### Frontend no inicia

```bash
# Limpiar cache y reinstalar
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Docker Compose issues

```bash
# Reconstruir imágenes
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

## Enlaces Útiles

- [API Documentation](http://localhost:8000/api/docs)
- [OpenAPI Schema](http://localhost:8000/api/openapi.json)
- [Health Check](http://localhost:8000/health)
- [Debug Metrics](http://localhost:8000/api/debug/metrics)

---

Para más información, consulta el [README completo](README.md).
