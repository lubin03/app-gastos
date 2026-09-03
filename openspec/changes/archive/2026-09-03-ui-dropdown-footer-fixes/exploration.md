## Exploration: ui-dropdown-footer-fixes

### Current State
El proyecto tiene un tema claro (`light-theme`) que sobreescribe variables globales. Sin embargo, el componente `ion-popover` (que se usa para los `<IonSelect interface="popover">` como el de meses/años) tiene un `background` quemado a un color oscuro (`rgba(15, 23, 42, 0.95)`) en `variables.css`, y no tiene una sobreescritura (override) en `body.light-theme`.
Por otro lado, el `IonTabBar` (`.custom-tab-bar`) contiene 8 botones. En pantallas pequeñas, estos botones se aplastan y el texto puede solaparse. No tiene manejo de `overflow`.

### Affected Areas
- `frontend/src/theme/variables.css` — Aquí están definidos los estilos globales y los overrides del tema claro.

### Approaches
1. **Sobreescribir Popover y Hacer TabBar scrolleable (Recomendado)**
   - Añadir una regla en `body.light-theme` para `ion-popover::part(content)` que ponga fondo claro y texto oscuro.
   - Añadir `overflow-x: auto; flex-wrap: nowrap; justify-content: flex-start;` al `ion-tab-bar`, y `min-width: 72px; flex-shrink: 0;` a los `ion-tab-button` para que se puedan deslizar en móviles. Ocultar la barra de scroll con `::-webkit-scrollbar { display: none; }`.
   - Pros: Soluciona ambos problemas de forma nativa con CSS, sin tocar lógica TSX.
   - Cons: Ninguna.
   - Effort: Low

### Recommendation
Aplicar el Approach 1, inyectando estilos responsivos en `variables.css`.

### Risks
- Ninguno crítico.

### Ready for Proposal
Yes — The fix is purely CSS and isolated to the global theme overrides.
