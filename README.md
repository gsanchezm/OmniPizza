# 🍕 OmniPizza - QA Testing Platform

Una plataforma de práctica de pruebas que simula una operación real de pedidos de comida, optimizada para ser efímera y altamente testeable. Inspirada en el modelo de Sauce Labs Demo App.

## 📋 Características Principales

### ✅ Usuarios Pre-definidos para Testing

| Username | Password | Comportamiento |
|----------|----------|----------------|
| `standard_user` | `pizza123` | ✅ Usuario normal, flujo sin errores |
| `locked_out_user` | `pizza123` | 🚫 Error de login: "Sorry, this user has been locked out." |
| `problem_user` | `pizza123` | 🐛 UI muestra imágenes rotas o precios en $0 |
| `performance_glitch_user` | `pizza123` | ⏱️ Todas las llamadas al API tienen delay de 3s |
| `error_user` | `pizza123` | 💥 El botón de Checkout lanza error 500 al azar (50%) |

### 🌍 Arquitectura Multi-País

La plataforma soporta 4 países con validaciones específicas:

#### 🇲🇽 México (MX)
- **Moneda**: MXN ($)
- **Campos requeridos**: `colonia`
- **Campos opcionales**: `propina`
- **Impuestos**: 0%

#### 🇺🇸 Estados Unidos (US)
- **Moneda**: USD ($)
- **Campos requeridos**: `zip_code` (5 dígitos)
- **Impuestos**: 8% (Sales Tax)

#### 🇨🇭 Suiza (CH)
- **Moneda**: CHF
- **Campos requeridos**: `plz`
- **Idiomas**: Alemán y Francés
- **Impuestos**: 0%

#### 🇯🇵 Japón (JP)
- **Moneda**: JPY (¥, sin decimales)
- **Campos requeridos**: `prefectura`
- **Impuestos**: 0%

### 🔧 Endpoints de Caos y Performance

```
GET /api/debug/latency-spike    # Delay aleatorio entre 0.5s y 5s
GET /api/debug/cpu-load          # Cálculo Fibonacci(35) para estresar CPU
GET /api/debug/metrics           # Métricas en formato Prometheus
GET /api/debug/info              # Información de debug de la aplicación
```

## 🏗️ Arquitectura del Proyecto

```
omnipizza/
├── backend/                 # FastAPI Backend
│   ├── main.py             # Aplicación principal
│   ├── models.py           # Modelos Pydantic
│   ├── auth.py             # Autenticación JWT
│   ├── database.py         # Base de datos en memoria
│   ├── middleware.py       # Middlewares personalizados
│   ├── constants.py        # Configuraciones por país
│   ├── config.py           # Configuración de la app
│   ├── requirements.txt    # Dependencias Python
│   └── Dockerfile          # Imagen Docker del backend
│
├── frontend/               # React Frontend
│   ├── src/
│   │   ├── pages/         # Páginas (Login, Catalog, Checkout)
│   │   ├── components/    # Componentes (Navbar)
│   │   ├── store.js       # Estado global (Zustand)
│   │   └── api.js         # Cliente API (Axios)
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── nginx.conf         # Configuración Nginx
│   └── Dockerfile         # Imagen Docker del frontend
│
├── tests/                 # Contract Tests
│   ├── test_contract.py   # Tests con Schemathesis
│   ├── requirements.txt   # Dependencias de testing
│   └── README.md          # Documentación de tests
│
├── docker-compose.yml     # Orquestación local
├── render.yaml            # Configuración de Render
└── README.md              # Esta documentación
```

## 🚀 Inicio Rápido

### Opción 1: Docker Compose (Recomendado)

```bash
# Clonar el repositorio
git clone <repository-url>
cd omnipizza

# Iniciar todos los servicios
docker-compose up -d

# Acceder a la aplicación
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# API Docs: http://localhost:8000/api/docs
```

### Opción 2: Desarrollo Local

#### Backend (FastAPI)

```bash
cd backend

# Crear entorno virtual
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate

# Instalar dependencias
pip install -r requirements.txt

# Iniciar servidor
python main.py

# El backend estará en http://localhost:8000
```

#### Frontend (React + Vite)

```bash
cd frontend

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# El frontend estará en http://localhost:3000
```

## 📖 Uso de la Plataforma

### 1. Login

Accede a `http://localhost:3000` y selecciona uno de los usuarios de prueba o ingresa manualmente:

```
Usuario: standard_user
Contraseña: pizza123
```

### 2. Catálogo de Pizzas

- Visualiza el catálogo con precios en la moneda del país seleccionado
- Agrega pizzas al carrito
- Los precios se convierten automáticamente según el país

### 3. Cambiar País

Usa el selector de país en la navbar para cambiar entre:
- 🇲🇽 México
- 🇺🇸 USA  
- 🇨🇭 Suiza
- 🇯🇵 Japón

### 4. Checkout

- Completa el formulario con los campos específicos del país
- El formulario cambia dinámicamente según el país seleccionado
- Recibe confirmación con número de orden

## 🧪 Testing

### Contract Tests con Schemathesis

```bash
cd tests

# Instalar dependencias
pip install -r requirements.txt

# Ejecutar tests (asegúrate de que el backend esté corriendo)
pytest test_contract.py -v

# Generar reporte HTML
pytest test_contract.py --html=report.html --self-contained-html
```

### Tests incluidos:

✅ Validación de schema OpenAPI  
✅ Flujo de autenticación  
✅ Validaciones por país  
✅ Comportamientos de usuarios  
✅ Endpoints de caos  
✅ Manejo de errores  

## 🔌 API Endpoints

### Autenticación

```bash
# Login
POST /api/auth/login
Content-Type: application/json
{
  "username": "standard_user",
  "password": "pizza123"
}

# Obtener usuarios de prueba
GET /api/auth/users

# Perfil del usuario actual
GET /api/auth/profile
Authorization: Bearer {token}
```

### Países

```bash
# Listar países soportados
GET /api/countries

# Información de un país específico
GET /api/countries/{country_code}
```

### Pizzas

```bash
# Obtener catálogo (requiere header X-Country-Code)
GET /api/pizzas
X-Country-Code: MX
Authorization: Bearer {token}
```

### Checkout

```bash
# Procesar orden
POST /api/checkout
Content-Type: application/json
Authorization: Bearer {token}
{
  "country_code": "MX",
  "items": [
    {"pizza_id": "1", "quantity": 2}
  ],
  "name": "Juan Pérez",
  "address": "Calle Principal 123",
  "phone": "5512345678",
  "colonia": "Centro"
}
```

### Debug

```bash
# Simular latencia
GET /api/debug/latency-spike

# Generar carga CPU
GET /api/debug/cpu-load

# Métricas Prometheus
GET /api/debug/metrics

# Info de debug
GET /api/debug/info
```

## 🌐 Despliegue en Render

### Opción 1: Blueprint (Automático)

1. Haz fork del repositorio
2. Ve a [Render Dashboard](https://dashboard.render.com)
3. Click en "New Blueprint Instance"
4. Conecta tu repositorio
5. Render detectará el `render.yaml` y desplegará automáticamente

### Opción 2: Manual

#### Backend

1. New Web Service
2. Conecta repositorio
3. Configuración:
   - **Build Command**: `pip install -r backend/requirements.txt`
   - **Start Command**: `cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Environment**: Python 3.11

#### Frontend

1. New Static Site
2. Conecta repositorio
3. Configuración:
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Publish Directory**: `frontend/dist`

## 🔑 Hooks de Automatización

Todos los elementos interactivos tienen atributos para testing:

### Web (data-testid)

```html
<button data-testid="login-button">Login</button>
<input data-testid="username-input" />
<div data-testid="pizza-card-1">...</div>
<button data-testid="add-to-cart-1">Add to Cart</button>
<button data-testid="checkout-submit-button">Checkout</button>
```

### Ejemplo con Playwright/Selenium

```python
# Login
driver.find_element_by_css_selector('[data-testid="username-input"]').send_keys('standard_user')
driver.find_element_by_css_selector('[data-testid="password-input"]').send_keys('pizza123')
driver.find_element_by_css_selector('[data-testid="login-button"]').click()

# Agregar pizza al carrito
driver.find_element_by_css_selector('[data-testid="add-to-cart-1"]').click()

# Checkout
driver.find_element_by_css_selector('[data-testid="checkout-name-input"]').send_keys('Test User')
```

## 💾 Persistencia Efímera

**IMPORTANTE**: Esta es una plataforma de testing, no de producción.

- ✅ Base de datos en memoria (reinicia con cada deploy)
- ✅ No requiere configuración de base de datos externa
- ✅ Estado "limpio" en cada reinicio
- ✅ Ideal para testing automatizado

## 🛠️ Stack Tecnológico

### Backend
- **FastAPI** - Framework web moderno y rápido
- **Pydantic** - Validación de datos
- **JWT** - Autenticación con tokens
- **Prometheus Client** - Métricas
- **Uvicorn** - ASGI server

### Frontend
- **React 18** - UI library
- **Vite** - Build tool
- **TailwindCSS** - Utility-first CSS
- **Zustand** - State management
- **Axios** - HTTP client
- **React Router** - Routing

### Testing
- **Schemathesis** - Contract testing
- **Pytest** - Test framework
- **Hypothesis** - Property-based testing

### DevOps
- **Docker** - Containerización
- **Docker Compose** - Orquestación local
- **Render** - Plataforma de despliegue
- **Nginx** - Servidor web estático

## 📊 Casos de Uso

### Para QA Engineers
- ✅ Practicar testing manual con diferentes usuarios
- ✅ Aprender validaciones por país
- ✅ Simular condiciones de red (latency)
- ✅ Testear manejo de errores

### Para Test Automation Engineers
- ✅ Practicar con Selenium/Playwright
- ✅ Implementar Page Object Model
- ✅ Testing de API con diferentes behaviors
- ✅ Contract testing con Schemathesis

### Para Performance Testers
- ✅ Endpoints de stress testing
- ✅ Métricas Prometheus
- ✅ Simular usuarios con performance issues

## 🤝 Contribución

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más información.

## 👥 Autores

Proyecto creado como plataforma de práctica para QA Engineers.

## 🎯 Roadmap

- [ ] Agregar más países (Brasil, Alemania, Francia)
- [ ] Implementar carrito persistente
- [ ] Agregar historial de órdenes con filtros
- [ ] Crear app móvil con React Native
- [ ] Integrar con herramientas de CI/CD
- [ ] Dashboard de métricas en tiempo real

## 📧 Soporte

Para preguntas o problemas, por favor abre un issue en el repositorio.

---

**Happy Testing! 🍕🧪**
