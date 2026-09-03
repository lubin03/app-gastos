# Tasks: ui-dropdown-footer-fixes

## Phase 1: CSS Overrides (Dropdowns & Footer)

- [x] 1.1 `frontend/src/theme/variables.css`: En la sección `body.light-theme`, añadir una regla para `ion-popover::part(content)` ajustando `background`, `color` y `border` a tonos claros.
- [x] 1.2 `frontend/src/theme/variables.css`: Actualizar la clase `.custom-tab-bar` (o crear una sobreescritura general) para añadir `overflow-x: auto`, `justify-content: flex-start` y `flex-wrap: nowrap`.
- [x] 1.3 `frontend/src/theme/variables.css`: Añadir pseudoclase `::-webkit-scrollbar` a `.custom-tab-bar` con `display: none` para ocultar la barra nativa.
- [x] 1.4 `frontend/src/theme/variables.css`: Añadir a `.custom-tab-bar ion-tab-button` las propiedades `flex-shrink: 0` y un `min-width` (ej. `72px`) para garantizar que mantengan su forma original sin aplastarse.

## Phase 2: Verification

- [x] 2.1 Refrescar el frontend.
- [x] 2.2 Verificar que el modal/popover de meses en `Transactions` muestre fondo blanco/claro en el `light-theme`.
- [x] 2.3 Simular dispositivo móvil (pantalla pequeña) y comprobar que el `IonTabBar` permita deslizar de izquierda a derecha.
