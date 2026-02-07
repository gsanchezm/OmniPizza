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
| MX   | colonia        | texto   | 0%       |
| US   | zip_code       | 5 dígitos | 8%     |
| CH   | plz            | texto   | 0%       |
| JP   | prefectura     | texto   | 0%       |

## Para Test Automation

### Selectores Disponibles

Todos los elementos tienen `data-testid`:

```javascript
// Login
'username-input'
'password-input'
'login-button'
'select-user-standard_user'

// Catalog
'pizza-card-1'
'pizza-name-1'
'pizza-price-1'
'add-to-cart-1'

// Checkout
'checkout-name-input'
'checkout-address-input'
'checkout-phone-input'
'checkout-colonia-input' // MX
'checkout-zipcode-input' // US
'checkout-plz-input'     // CH
'checkout-prefectura-input' // JP
'checkout-submit-button'
```

### Ejemplo con Playwright

```javascript
// Login
await page.fill('[data-testid="username-input"]', 'standard_user');
await page.fill('[data-testid="password-input"]', 'pizza123');
await page.click('[data-testid="login-button"]');

// Agregar pizza
await page.click('[data-testid="add-to-cart-1"]');

// Checkout
await page.fill('[data-testid="checkout-name-input"]', 'Test User');
await page.click('[data-testid="checkout-submit-button"]');
```

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
