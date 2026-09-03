# Proposal: fix-credit-card-billing

## Intent
Resolver el bug crítico donde el pago de una tarjeta de crédito salda incorrectamente todas las compras no facturadas, dejando el balance en cero. Asegurar que los pagos se rigen estrictamente por la **fecha de corte** (ej. del 17 al 17) a través de las facturas (`invoices`), y permitir que los usuarios paguen por adelantado moviendo transacciones entre períodos.

## Scope

### In Scope
- **Pago por Período de Facturación:** Modificar el endpoint de pago de tarjetas (`payCreditCard`) para recibir el `invoice_id`. Al pagar, **solo** se marcarán como `paid = TRUE` las transacciones de esa factura (que inherentemente agrupa compras de fecha de corte a fecha de corte).
- **Pago por Adelantado:** Como las facturas controlan qué se paga, si el usuario decide "pagar por adelantado", simplemente mueve una transacción futura a la factura del período actual. Al pagar la factura actual, esa transacción adelantada quedará saldada.
- Modificar el frontend (`CreditCards.tsx`) para enviar el `invoice_id` que el usuario está pagando.
- Validación estricta en el backend para la creación/actualización de las fechas de corte y vencimiento (`closing_day`, `due_day`).

### Out of Scope
- Lógica de pagos parciales numéricos de una factura (si el usuario paga menos del total, no marcamos transacciones individuales, se asume pago de la factura completa por ahora).
- Refactorización del cálculo de períodos (el sistema `computeInvoicePeriod` actual ya agrupa bien por fecha de corte, solo necesitamos que el pago respete esa agrupación).

## Capabilities

### New Capabilities
- None

### Modified Capabilities
- `accounts`: El pago de tarjetas ahora es dependiente del `invoice_id`. Esto garantiza que los cortes de ciclo (ej. 17 a 17) definan qué compras se saldan, en lugar de saldar el total adeudado.
- `transactions`: El estado `paid` de una transacción respeta el pago de su factura asignada. Esto habilita los "pagos por adelantado" al cambiar el período de la transacción.

## Approach
Implementaremos un **Pago basado en la Factura (Invoice-based Payment)**.
El frontend ya muestra las facturas agrupadas por fecha de corte (gracias a `computeInvoicePeriod`).
1. El frontend enviará el `invoice_id` al pagar.
2. El backend (`accounts.ts`) buscará esa factura y hará `UPDATE transactions SET paid = TRUE WHERE invoice_id = $1`.
3. Esto garantiza que las compras del próximo período (las que se hacen después del día de corte) NO se marquen como pagadas, a menos que el usuario explícitamente las haya movido a esta factura para pagarlas por adelantado.
4. Validaremos que `closing_day` y `due_day` sean valores correctos.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `backend/src/controllers/accounts.ts` | Modified | Endpoint `payCreditCard` usará `invoice_id` para marcar transacciones pagadas. |
| `frontend/src/pages/CreditCards.tsx` | Modified | Enviar `selectedInvoiceId` en `handlePayInvoice`. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Inconsistencia con transacciones huérfanas | Medium | Transacciones antiguas sin `invoice_id` podrían quedar colgadas. Mitigación: incluir lógica que actualice transacciones huérfanas anteriores al corte si es necesario, o depender de que tengan `invoice_id`. |

## Rollback Plan
Revertir los commits en `backend/src/controllers/accounts.ts` y `frontend/src/pages/CreditCards.tsx`. No hay cambios de esquema de base de datos destructivos.

## Dependencies
- Ninguna externa.

## Success Criteria
- [ ] Pagar una tarjeta no pone en cero las compras hechas después de la fecha de corte.
- [ ] Mover una transacción futura a la factura actual y pagarla marca correctamente esa transacción como pagada (Pago por adelantado).
- [ ] La factura elegida pasa a estado `paid`.
