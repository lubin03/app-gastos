# Tasks: fix-credit-card-billing

## Phase 1: Backend Foundation (Validaciones)

- [x] 1.1 `backend/src/controllers/accounts.ts`: En `createAccount`, validar que si `type === 'credit_card'`, `closing_day` y `due_day` existan y estén entre 1 y 31. Retornar error 400 si son inválidos.
- [x] 1.2 `backend/src/controllers/accounts.ts`: En `updateAccount`, agregar la misma validación de rango (1-31) para `closing_day` y `due_day` antes de hacer el UPDATE.

## Phase 2: Backend Core (Lógica de Pagos)

- [x] 2.1 `backend/src/controllers/accounts.ts`: En `payCreditCard`, extraer `invoice_id` del `req.body`. Validar que se provea.
- [x] 2.2 `backend/src/controllers/accounts.ts`: En `payCreditCard`, modificar la consulta que marca las transacciones como pagadas (`UPDATE transactions SET paid = TRUE...`) para filtrar por `invoice_id = $2` en lugar de afectar a toda la cuenta.
- [x] 2.3 `backend/src/controllers/accounts.ts`: En `payCreditCard`, modificar la consulta de cierre de factura (`UPDATE credit_card_invoices SET status = 'paid'...`) para filtrar por el `id` de la factura específica.

## Phase 3: Frontend Integration

- [x] 3.1 `frontend/src/pages/CreditCards.tsx`: En `handlePayInvoice`, incluir `invoice_id: selectedInvoiceId` en el payload de `api.post(\`/accounts/\${selectedCard.id}/pay\`, ... )`.

## Phase 4: Verification

- [x] 4.1 Iniciar el backend y frontend.
- [x] 4.2 Verificar que intentar crear/editar una tarjeta con fecha de corte `35` arroje error 400.
- [x] 4.3 Generar consumos para la factura actual y mover uno a la factura siguiente.
- [x] 4.4 Pagar la factura actual y verificar que la transacción futura siga marcada como impaga y la tarjeta no quede con balance cero total.
