## Exploration: dashboard-privacy-and-account-visibility

### Current State
- **Dashboard UI**: Los valores financieros (`balance.bankTotal`, `balance.ccDebt`, `balance.income`, etc.) se renderizan directamente en `Dashboard.tsx`. No hay estado local ni global para ofuscarlos (ej. mostrar `****`).
- **Dashboard Backend**: `dashboard.ts` calcula los totales usando todas las cuentas no archivadas.
- **Accounts**: La tabla `accounts` no tiene banderas para excluir cuentas de las sumas totales ni para ocultarlas visualmente del dashboard.

### Affected Areas
- **Database**: Se necesita una nueva migración (`014_add_dashboard_visibility.sql`) para la tabla `accounts`.
- **Backend (`accounts.ts`, `dashboard.ts`)**: 
  - `accounts.ts`: Permitir leer/escribir las nuevas banderas (`include_in_dashboard_sum`, `show_in_dashboard`).
  - `dashboard.ts`: Modificar las queries SQL para filtrar con `AND a.include_in_dashboard_sum = TRUE`.
- **Frontend (`Dashboard.tsx`, `AccountModal.tsx`)**:
  - `Dashboard.tsx`: Añadir estado `showValues` (guardado en `localStorage`) y un botón para alternar la visibilidad de los números. Filtrar la lista de cuentas con `show_in_dashboard === true`.
  - `AccountModal.tsx`: Añadir dos toggles (switches) para configurar estas nuevas opciones al crear o editar una cuenta.

### Approaches
1. **Frontend-Only sum filtering**
   - Pros: Menos cambios en SQL.
   - Cons: El endpoint `/dashboard` ya hace las agregaciones (SUM) directo en SQL. Sería imposible separar qué suma vino de qué cuenta sin reescribir todo a lógica de Javascript en el cliente.
   - Effort: High

2. **Backend-driven filtering (Recommended)**
   - Añadir columnas `include_in_dashboard_sum` (DEFAULT TRUE) y `show_in_dashboard` (DEFAULT TRUE) en PostgreSQL.
   - Actualizar `dashboard.ts` para que todas sus queries SQL de suma incluyan `WHERE a.include_in_dashboard_sum = TRUE`.
   - El frontend manejará el toggle de ofuscación de valores de forma puramente visual (cambiando texto a `****` si el toggle está activo).
   - Pros: Escalable, mantiene la performance del motor SQL para las sumatorias.
   - Cons: Requiere tocar varias consultas SQL en `dashboard.ts`.
   - Effort: Medium

### Recommendation
Proceder con el **Approach 2 (Backend-driven filtering)**. Es la forma correcta y óptima dado que la arquitectura actual ya delega el cálculo de métricas agregadas al motor de base de datos.

### Risks
- Las transferencias entre una cuenta excluida y una incluida pueden desbalancear los totales si no se manejan bien en la query `normalized_txs` (actualmente hace JOIN con la cuenta origen y destino por separado, lo cual es manejable añadiendo el filtro a la tabla unida).

### Ready for Proposal
Yes — Proceed to `sdd-propose`.
