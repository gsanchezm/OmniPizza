# OmniPizza Design System (UI/UX)

## 1. Introducción
El sistema de diseño de OmniPizza, denominado **"Dark Premium"**, se centra en una estética moderna, oscura y de alto contraste que evoca calidad y velocidad. Utiliza una paleta de colores oscuros profundos con acentos vibrantes en naranja para guiar la acción del usuario. Este documento define los estilos visuales para garantizar la consistencia entre las plataformas Web (React) y Mobile (React Native).

## 2. Paleta de Colores

### 2.1. Brand Colors (Marca)
El color principal es un naranja enérgico que estimula el apetito y la acción.

| Nombre | Hex | Uso |
| :--- | :--- | :--- |
| **Primary** | `#FF5722` | Botones principales, enlaces activos, iconos destacados, chips de selección. |
| **Hover** | `#E64A19` | Estado hover de botones primarios. |
| **Secondary** | `#FF8A65` | Acentos sutiles, bordes de elementos seleccionados secundarios. |
| **Accent** | `#FF5722` | Mismo que el primario, usado para consistencia en mobile. |

### 2.2. Superficies (Dark Mode)
El diseño es nativamente "Dark Mode", utilizando tonos negros y grises muy oscuros en lugar de negro puro `#000000` para reducir la fatiga visual.

| Nombre | Hex | Uso |
| :--- | :--- | :--- |
| **Surface Base** | `#0F0F0F` | Fondo principal de la aplicación (body/screen background). |
| **Surface 2** | `#1E1E1E` | Fondo secundario, inputs, elementos modales. |
| **Card (Web)** | `rgba(30, 30, 30, 0.86)` | Tarjetas de producto, contenedores flotantes. Usa backdrop-filter. |
| **Card (Mobile)**| `#1E1E1E` | Fondo sólido para tarjetas en móvil. |
| **Border** | `#2A2A2A` | Bordes sutiles para separar secciones y definir inputs. |

### 2.3. Funcionales
| Nombre | Hex | Uso |
| :--- | :--- | :--- |
| **Danger** | `#EF4444` | Mensajes de error, botones de eliminar, validaciones fallidas. |
| **Success** | *Implícito* | Generalmente se usa el Primary o verde estándar (`#22C55E`) si es necesario. |

### 2.4. Tipografía (Texto)
| Nombre | Hex | Uso |
| :--- | :--- | :--- |
| **Text Primary** | `#FFFFFF` | Títulos, cuerpo de texto principal, etiquetas de botones. |
| **Text Muted** | `#A0A0A0` | Subtítulos, descripciones de productos, placeholders. |
| **Text Inverse** | `#111111` | Texto sobre fondos claros (si los hubiera). |

## 3. Tipografía

### 3.1. Familia Tipográfica
*   **Web:** `Plus Jakarta Sans` (Google Fonts). Una sans-serif geométrica y moderna con excelente legibilidad.
*   **Mobile:** Fuente del sistema (San Francisco en iOS, Roboto en Android) configurada para coincidir en pesos con la web.

### 3.2. Pesos y Estilos
Se hace un uso extensivo de pesos altos para transmitir solidez y confianza.

| Peso | Valor | Uso |
| :--- | :--- | :--- |
| **Regular** | 400 | Cuerpo de texto, párrafos largos. |
| **Medium** | 500 | Etiquetas de formularios, menús. |
| **Bold** | 700 | Encabezados de tarjetas, precios. |
| **Extra Bold** | 800 | Títulos de página (`h1`), Botones (`CTA`), Chips destacados. |

### 3.3. Escala (Referencia)
*   **H1 / Título Pantalla:** ~24px - 32px
*   **H2 / Título Tarjeta:** ~18px - 20px
*   **Body:** 14px - 16px
*   **Small / Caption:** 11px - 12px

## 4. Componentes UI

### 4.1. Botones (Primary)
*   **Background:** `#FF5722`
*   **Border Radius:** `14px` (Curva pronunciada, moderna).
*   **Padding:** Vertical `12px`, Horizontal `16-18px`.
*   **Texto:** Blanco, Peso 800 (Extra Bold).
*   **Interacción (Web):** Transform `translateY(-1px)` y cambio de color a `#E64A19` en hover.

### 4.2. Tarjetas (Cards)
*   **Background Web:** `rgba(30,30,30, 0.86)` con `backdrop-filter: blur(12px)` (Efecto Glassmorphism).
*   **Background Mobile:** `#1E1E1E`.
*   **Borde:** `1px solid #2A2A2A`.
*   **Border Radius:** `14px`.
*   **Sombra (Web):** `0 20px 60px rgba(0,0,0,0.55)` para dar profundidad.

### 4.3. Inputs (Campos de Texto)
*   **Background:** `#1E1E1E`.
*   **Borde:** `1px solid #2A2A2A`.
*   **Border Radius:** `12px`.
*   **Padding:** `12px`.
*   **Color Texto:** Blanco.

### 4.4. Chips / Etiquetas
Elemento característico para categorías o selección de opciones.
*   **Background:** `#FF5722` (Primary).
*   **Forma:** Pill / Capsula (`borderRadius: 999px`).
*   **Texto:** Blanco, 11px, Peso 800.

## 5. Iconografía
*   **Librería Web:** `lucide-react`
*   **Librería Mobile:** `Lucide` (o compatible vector icons).
*   **Estilo:** Línea (Stroke), generalmente de 1.5px o 2px de grosor.
*   **Color por defecto:** Coincide con el texto (`#FFFFFF`) o Brand (`#FF5722`) según contexto.

## 6. Layout y Espaciado
*   **Grid System:** Flexible, basado en Flexbox y CSS Grid.
*   **Container:** Centrado con max-width para pantallas grandes.
*   **Espaciado Base:** Múltiplos de 4px (0.25rem). Espaciados comunes: 12px, 16px, 24px.
*   **Navbar (Web):** Glassmorphism (`rgba(15, 15, 15, 0.78)` + blur), `border-bottom` sutil.

## 7. Accesibilidad
*   **Contraste:** El texto blanco sobre gris oscuro/negro (`#0F0F0F`) supera el ratio AA.
*   **Indicadores de Error:** Uso de color rojo (`#EF4444`) acompañado de mensajes de texto claros.
*   **Focus States:** Los elementos interactivos deben mantener indicadores de foco visibles (bordes o cambios de brillo).
