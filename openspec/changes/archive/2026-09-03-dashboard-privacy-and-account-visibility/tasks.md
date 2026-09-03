# Tasks: dashboard-privacy-and-account-visibility

## Phase 1: Database & Backend (Foundation)

- [x] 1.1 Crear migración `backend/src/db/migrations/014_add_dashboard_visibility.sql` que añada las columnas `include_in_dashboard_sum` y `show_in_dashboard` (ambas `BOOLEAN DEFAULT TRUE`) a la tabla `accounts`.
- [x] 1.2 Ejecutar migración en PostgreSQL.
- [x] 1.3 `backend/src/controllers/accounts.ts`: Actualizar `getAccounts`, `createAccount` y `updateAccount` para leer y persistir los campos `include_in_dashboard_sum` y `show_in_dashboard`.
- [x] 1.4 `backend/src/controllers/dashboard.ts`: Modificar las queries SQL (balances, ingresos, gastos y categorías) añadiendo la condición `AND a.include_in_dashboard_sum = TRUE` (y `d.include_in_dashboard_sum = TRUE` para cuentas destino en transferencias).

## Phase 2: Frontend - Gestión de Cuentas (Core)

- [x] 2.1 `frontend/src/components/AccountModal.tsx`: Añadir dos `<IonToggle>` para "Incluir en sumatoria del dashboard" y "Mostrar en lista rápida del dashboard".
- [x] 2.2 `frontend/src/components/AccountModal.tsx`: Asegurar que el estado inicial de estas variables sea `true` para cuentas nuevas y que se envíen en el body del POST/PUT hacia la API.

## Phase 3: Frontend - Dashboard Privacidad y Filtro (Core)

- [x] 3.1 `frontend/src/pages/Dashboard.tsx`: Añadir estado local `showValues` (inicializado desde `localStorage.getItem('dashboard_show_values')`).
- [x] 3.2 `frontend/src/pages/Dashboard.tsx`: Añadir botón con ícono de ojo junto al saludo del usuario para alternar y guardar el estado `showValues`.
- [x] 3.3 `frontend/src/pages/Dashboard.tsx`: Crear función helper `formatCurrency` que retorne `****` si `!showValues` o el número formateado si `showValues`. Reemplazar todos los montos mostrados en la vista.
- [x] 3.4 `frontend/src/pages/Dashboard.tsx`: Modificar la variable `dashboardAccounts` para que el renderizado de la cuadrícula de cuentas (Saldos de Cuentas) filtre usando `show_in_dashboard !== false`.

## Phase 4: Verification (Testing)

- [x] 4.1 Test manual: Crear una cuenta excluida de suma y verificar que el "Total en Bancos" baje.
- [x] 4.2 Test manual: Tocar el ícono de ojo y verificar que todos los valores (incluyendo gráficos) cambien a `****`. Refrescar y comprobar que persiste.
- [x] 4.3 Correr los tests de integración (`npm run test`) en backend para asegurar que nada se rompió.
