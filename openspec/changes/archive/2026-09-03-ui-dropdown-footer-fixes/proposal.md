# Proposal: ui-dropdown-footer-fixes

## Intent
Solucionar problemas visuales y de responsividad en la UI:
1. Los desplegables (popovers) mantienen un fondo oscuro incluso en el tema claro, dificultando la lectura.
2. La barra de navegación inferior (`IonTabBar`) aprieta los botones en pantallas móviles debido a la cantidad de pestañas.

## Scope

### In Scope
- Sobreescribir el `background` y `color` de `ion-popover::part(content)` dentro de `body.light-theme`.
- Añadir `overflow-x: auto` al `IonTabBar` y un `min-width` a los botones para permitir el desplazamiento horizontal en pantallas pequeñas.

### Out of Scope
- Rediseño estructural de la navegación.
- Cambios lógicos en componentes (puro CSS).

## Capabilities

### New Capabilities
- None

### Modified Capabilities
- None (este es un fix puramente estético/CSS sin impacto en reglas de negocio).

## Approach
Añadiremos reglas específicas en `frontend/src/theme/variables.css` bajo el selector `body.light-theme` para limpiar el estilo oscuro en los popovers.
Para el `IonTabBar`, utilizaremos CSS para habilitar desplazamiento horizontal nativo (`overflow-x: auto; flex-wrap: nowrap; justify-content: flex-start;`) y ocultaremos la barra de scroll (`::-webkit-scrollbar { display: none; }`) para mantener un look limpio.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `frontend/src/theme/variables.css` | Modified | Ajustes de CSS. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| El popover global se desconfigure en otros lados | Low | El fix se aplica vía pseudo-elemento `::part(content)` sobre la clase `.light-theme`, aislando el impacto. |

## Rollback Plan
Revertir el archivo `frontend/src/theme/variables.css`.

## Dependencies
- Ninguna.

## Success Criteria
- [ ] Los selectores tipo Popover (ej. meses y años) en tema claro se ven con fondo claro y texto oscuro.
- [ ] La barra inferior (`IonTabBar`) se puede deslizar horizontalmente en un teléfono, sin textos montados.
