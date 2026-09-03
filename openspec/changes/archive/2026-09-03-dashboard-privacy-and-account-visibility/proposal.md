# Proposal: dashboard-privacy-and-account-visibility

## Intent
Permitir a los usuarios tener mayor control sobre la privacidad de sus datos y la composición de su panel principal (Dashboard). Específicamente, se requiere:
1. Un botón global en el Dashboard para ocultar los valores financieros (útil al abrir la app en público).
2. Opciones por cuenta para excluirla de la suma total del dashboard (ej. cuentas de ahorro a largo plazo) y ocultarla visualmente de la lista de cuentas rápidas del dashboard.

## Scope

### In Scope
- **Backend/DB**: Migración para agregar `include_in_dashboard_sum` y `show_in_dashboard` a la tabla `accounts`. Actualizar el CRUD de cuentas para manejar estos campos y las consultas en `dashboard.ts` para filtrar por ellos.
- **Frontend (Dashboard)**: Añadir botón de "Ojo" (Eye icon) que guarde en `localStorage` el estado de visibilidad y cambie los números por `****`. Modificar la lista de "Saldos de Cuentas" para filtrar las cuentas según su bandera.
- **Frontend (Cuentas)**: Añadir dos toggles en el modal de creación/edición de cuentas (`AccountModal.tsx`) para gestionar las nuevas opciones.

### Out of Scope
- Ocultar valores en otras pantallas fuera del Dashboard (Transactions, Reports) por ahora, limitándolo a la pantalla principal como fue solicitado.
- Configuraciones granulares por tipo de transacción, esto aplica a nivel Cuenta.

## Capabilities

### New Capabilities
- None

### Modified Capabilities
- `dashboard`: Se modifica el cálculo de totales, requiriendo validación contra la bandera `include_in_dashboard_sum` de cada cuenta involucrada.
- `accounts-management`: El esquema de la entidad Cuenta se extiende con configuraciones de visibilidad.

## Approach
Añadiremos dos campos `BOOLEAN DEFAULT TRUE` a la base de datos PostgreSQL. El endpoint `/dashboard` modificará todas sus sentencias `WHERE` (para balances, ingresos, gastos y categorías) añadiendo la condición de que la cuenta vinculada tenga `include_in_dashboard_sum = TRUE`.
En el frontend, el estado `showValues` del Dashboard actuará como una capa puramente visual que convierte formatos numéricos en asteriscos, brindando ofuscación instantánea sin necesidad de recargar o consultar al servidor.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `backend/src/db/migrations/` | New | `014_add_dashboard_visibility.sql` |
| `backend/src/controllers/accounts.ts` | Modified | Leer/Guardar nuevos campos en el CRUD |
| `backend/src/controllers/dashboard.ts` | Modified | Filtrar SQL de totales y categorías |
| `frontend/src/pages/Dashboard.tsx` | Modified | Toggle de ofuscación y filtrado de lista rápida |
| `frontend/src/components/AccountModal.tsx` | Modified | Formularios con 2 toggles extra |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Transferencias asimétricas (origen oculto, destino visible) descuadran el flujo | Medium | Las sentencias en `dashboard.ts` tratan las transferencias separando la cuenta origen y destino. Se validará que el filtro aplique específicamente al alias de la cuenta involucrada (`a` o `d`) en cada bloque de la UNION. |

## Rollback Plan
- Revertir los cambios en el código.
- Ejecutar un `ALTER TABLE accounts DROP COLUMN ...` en la base de datos si fuera estrictamente necesario, aunque los campos pueden quedar huérfanos sin afectar.

## Dependencies
- Ninguna.

## Success Criteria
- [ ] Tocar un ícono en el Dashboard oculta todos los saldos mostrándolos como `****`.
- [ ] Se puede editar una cuenta para que no sume al "Total en Bancos" y al guardar, el Dashboard refleja el nuevo total inmediatamente.
- [ ] Se puede editar una cuenta para que no aparezca en los cuadritos del Dashboard, pero sigue sumando (o ambas desactivadas).
