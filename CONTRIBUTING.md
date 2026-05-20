# Contributing to OmniPizza

¡Gracias por tu interés en contribuir a OmniPizza! 🍕

## Cómo Contribuir

### Reportar Bugs

Si encuentras un bug, por favor abre un issue con:

1. Descripción clara del problema
2. Pasos para reproducir
3. Comportamiento esperado vs actual
4. Screenshots si es aplicable
5. Información del ambiente (browser, OS, etc.)

### Sugerir Features

Para sugerir nuevas características:

1. Abre un issue con etiqueta "enhancement"
2. Describe el caso de uso
3. Explica por qué sería útil para QA testing
4. Proporciona ejemplos si es posible

### Pull Requests

1. Fork el proyecto
2. Crea una rama desde `main`:
   ```bash
   git checkout -b feature/mi-feature
   ```
3. Haz tus cambios siguiendo los estándares de código
4. Agrega tests si es aplicable
5. Actualiza la documentación
6. Commit con mensajes descriptivos:
   ```bash
   git commit -m "feat: Add new country support for Brazil"
   ```
7. Push a tu fork:
   ```bash
   git push origin feature/mi-feature
   ```
8. Abre un Pull Request

## Estándares de Código

### Python (Backend)

- Sigue PEP 8
- Usa type hints
- Documenta funciones con docstrings
- Mantén funciones pequeñas y enfocadas

```python
def calculate_total(items: List[Dict], tax_rate: float) -> float:
    """
    Calculate order total including tax
    
    Args:
        items: List of order items with price and quantity
        tax_rate: Tax rate as decimal (e.g., 0.08 for 8%)
    
    Returns:
        Total amount including tax
    """
    subtotal = sum(item['price'] * item['quantity'] for item in items)
    return subtotal * (1 + tax_rate)
```

### JavaScript/React (Frontend)

- Usa ES6+ syntax
- Componentes funcionales con hooks
- PropTypes o TypeScript para validación
- Nombres descriptivos

```javascript
// Good
const PizzaCard = ({ pizza, onAddToCart }) => {
  // Component logic
};

// Add data-testid for testing
<button data-testid={`add-to-cart-${pizza.id}`}>
  Add to Cart
</button>
```

### Commits

Seguimos [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` Nueva funcionalidad
- `fix:` Corrección de bugs
- `docs:` Cambios en documentación
- `test:` Agregar o modificar tests
- `refactor:` Refactorización de código
- `style:` Cambios de formato (sin afectar funcionalidad)
- `chore:` Tareas de mantenimiento

## Testing

Todos los PRs deben incluir tests:

### API Integration Tests (Vitest)

```bash
cd tests
pnpm install
pnpm test
```

### Contract Tests (Schemathesis, legacy)

```bash
cd tests
pip install -r requirements.txt
pytest test_contract.py -v
```

### Frontend Component Tests (Cypress)

```bash
cd frontend
pnpm install
pnpm test:ct          # headless
pnpm test:ct:open     # interactive runner
```

## Documentación

Actualiza la documentación cuando:

- Agregas nuevos endpoints
- Cambias comportamiento existente
- Agregas nuevos países
- Modificas flujos de usuario

## Code Review

Tu PR será revisado considerando:

1. ✅ Funcionalidad correcta
2. ✅ Tests pasando
3. ✅ Código limpio y mantenible
4. ✅ Documentación actualizada
5. ✅ Sin breaking changes (o bien documentados)

## Preguntas

Si tienes dudas, no dudes en:

1. Abrir un issue con la etiqueta "question"
2. Comentar en un PR existente
3. Revisar issues existentes

## Licencia

Al contribuir, aceptas que tu código será licenciado bajo MIT License.

---

¡Gracias por hacer de OmniPizza una mejor herramienta para QA! 🎉
