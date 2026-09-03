## Exploration: Bug en pagos y fechas de tarjetas de crédito

### Current State
Actualmente, el método `payCreditCard` en `backend/src/controllers/accounts.ts` toma un `amount` pero lo ignora al momento de saldar la tarjeta. En su lugar, ejecuta un `UPDATE transactions SET paid = TRUE` y `UPDATE credit_card_invoices SET status = 'paid'` masivo para **toda la cuenta**. 
Esto significa que si un usuario hace un pago, todas las compras, incluidas las del nuevo mes que aún no cierran, se marcan como pagadas. Por eso las tarjetas "quedan en cero" al hacer un pago a fin de mes. 
Además, la interfaz de `CreditCards.tsx` no envía qué factura (`invoice_id`) se está pagando, y el backend no valida si las fechas de corte (`closing_day`) y pago (`due_day`) tienen sentido.

### Affected Areas
- `backend/src/controllers/accounts.ts` (`payCreditCard`) — La lógica de pago debe asociarse a un `invoice_id` específico y solo saldar las transacciones de esa factura.
- `frontend/src/pages/CreditCards.tsx` (`handlePayInvoice`) — Debe enviar el `invoice_id` al backend al momento de pagar.
- `backend/src/utils/billingCycle.ts` (`computeInvoicePeriod`) — Podría requerir manejo de fechas más robusto para evitar saltos por huso horario.

### Approaches
1. **Pago por Factura (Invoice-based Payment)** — Requerir un `invoice_id` en el endpoint de pago. El backend solo actualizará a `paid = TRUE` las transacciones que pertenezcan a ese `invoice_id` y cerrará solo esa factura.
   - Pros: Resuelve exactamente el bug. Previene que compras nuevas se marquen como pagadas.
   - Cons: No maneja pagos parciales fácilmente (si se paga menos del total, algunas transacciones de la factura quedarían sin pagar).
   - Effort: Medium

2. **Pago por Monto (Balance-based Payment FIFO)** — Restar el monto pagado de las transacciones más antiguas no pagadas hasta agotar el monto.
   - Pros: Soporta pagos parciales precisos.
   - Cons: Mucho más complejo de implementar en SQL/Node, podría causar estados inconsistentes si el monto no cuadra.
   - Effort: High

### Recommendation
Se recomienda el **Pago por Factura (Approach 1)**, pero ajustado: si el monto es igual o mayor al total de la factura, se marcan sus transacciones como pagadas. Si es menor, se podría registrar el pago como una transacción tipo 'income' a la tarjeta (abonando al saldo general), o implementar una lógica simplificada donde el pago parcial reduce el "deber" total pero no cierra la factura. Dado el estado actual, pasar el `invoice_id` y permitir cerrar esa factura específica es el camino más directo para arreglar que "quede en cero". También se debe agregar validación para `closing_day` y `due_day`.

### Risks
- Cambiar la API de `payCreditCard` afectará cómo el frontend envía la petición.
- Es posible que haya facturas antiguas que queden en un estado intermedio si se cambia la lógica.

### Ready for Proposal
Yes — El problema está identificado y la solución es clara.
