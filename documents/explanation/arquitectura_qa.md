# Arquitectura y Diseño: OmniPizza QA Platform

Este documento detalla las decisiones y mejoras arquitectónicas aplicadas a la plataforma OmniPizza, considerando su naturaleza específica como **Entorno de Pruebas (QA)** para herramientas de automatización (Selenium, Playwright, Appium, etc.).

## 🎯 Filosofía del Diseño

A diferencia de un sistema en producción tradicional, las características como bases de datos volátiles (en memoria), credenciales estáticas y latencias/errores artificiales **no son deficiencias, sino requerimientos clave**. Éstas permiten un entorno determinista, fácil de reiniciar y con "Chaos Engineering" integrado para validar que los scripts de prueba manejen correctamente escenarios de error (Happy path vs Sad path).

El enfoque de las mejoras arquitectónicas se centra en la **mantenibilidad del código, la optimización del rendimiento y la aplicación de buenas prácticas de diseño (SOLID, DRY, Algoritmia)**, manteniendo intacta la utilidad fundamental del entorno.

---

## 🏗️ 1. Backend (FastAPI)

### A. Modularización y Enrutamiento (APIRouter)
El diseño monolítico original de `main.py` se refactoriza en módulos lógicos independientes, facilitando el crecimiento ordenado del proyecto y simulando un código empresarial:
- `routers/auth.py`: Autenticación, tokens y gestión de perfiles de usuario (QA personas).
- `routers/catalog.py`: Endpoints relacionados con el catálogo de pizzas, filtros y precios.
- `routers/checkout.py`: Validación de carritos y procesamiento simulado de órdenes.
- `routers/debug_chaos.py`: Endpoints específicos para inyectar fallos de red, errores HTTP 500 y picos de carga en CPU para pruebas de resiliencia.

### B. Aplicación del Principio Open/Closed (SOLID)
La validación de reglas de negocio por país en el Checkout (por ejemplo: validación de código postal en USA o colonia en México) abandona las cadenas extensas de sentencias `if/elif`. En su lugar, adopta un **Mapeo Dinámico (inspirado en el Patrón Estrategia)**, leyendo de forma agnóstica las reglas dictadas por `COUNTRY_CONFIG`. Esto permite añadir nuevas regiones para pruebas sin modificar ni una sola línea de la lógica de procesamiento principal.

### C. Optimización Algorítmica (O(N) a O(1))
Para aplicar mejores prácticas de rendimiento a nivel estructura de datos:
- El `PIZZA_CATALOG` deja de tratarse únicamente como una lista (`Array`). En los puntos críticos, como la evaluación y validación de ítems del carrito (`database.py`), se indexa usando Diccionarios / Tablas Hash referenciadas por el ID del producto. Esto reduce la complejidad temporal de búsqueda lineal O(N) a O(1).

### D. Principio DRY (Don't Repeat Yourself)
Se aplica una refactorización para extraer lógica repetida en la capa de datos. Específicamente, las rutinas de resolución de traducciones de idioma y formateo de monedas, que se duplicaban entre las funciones de obtención del catálogo y el enriquecimiento del carrito, se centralizan en funciones "helper" privadas.

### E. API Orientada al E2E (Testability)
Aprovechando las bondades de la base de datos en memoria para QA, se incorpora el endpoint `POST /api/qa/reset-db` (o similar). Su propósito es permitir a los orquestadores de prueba (Playwright, Cypress) limpiar por completo el estado del servidor en el hook `beforeAll` o `beforeEach`. Garantizando así un estado idéntico (Zero State) entre cada iteración y evitando el flakiness por datos residuales.

---

## ⚡ 2. Frontend Web (React) y Mobile (React Native)

### A. Code Splitting y Lazy Loading
Se incorpora `React.lazy()` acompañado de `<Suspense fallback={...}>` en la capa de enrutamiento principal. Esto asegura que vistas pesadas y secundarias se empaqueten de manera separada (chunks). El peso de descarga inicial disminuye, replicando optimizaciones arquitectónicas usadas en la vida real.

### B. Optimización de Renderizado (Memoization)
Uso estratégico de hooks como `useMemo`, `useCallback` y `React.memo` para evitar recálculos en listas de productos y en el total del carrito, limitando los renders del Virtual DOM únicamente a los subárboles de componentes que realmente cambian su estado.

### C. Gestión de Estado Global Estructurada
División modular del "Store" (Zustand) en Slices o dominios funcionales independientes (Auth, Cart, Configuración Local). Esto incluye la habilitación nativa del middleware de Redux DevTools, entregando a los ingenieros de control de calidad una herramienta poderosa para viajar en el tiempo (Time-travel debugging) y analizar las mutaciones del estado global durante pruebas manuales exploratorias.
