# Tasks

## Phase 1: Frontend State & Fetch Logic
- [x] 1.1 Modificar `openCardDetails` en `CreditCards.tsx` para cargar siempre `?all=true` en los transactions.
- [x] 1.2 Agrupar `transactions` por `invoice_id` usando `useMemo` o durante el fetch. Asignar los que tienen `invoice_id == null` a la factura `is_current`.

## Phase 2: Frontend UI - Accordion
- [x] 2.1 Importar `IonAccordion` y `IonAccordionGroup` de `@ionic/react`.
- [x] 2.2 Reemplazar el bloque `Selector de Período / Factura` (`IonSelect`) por un `<IonAccordionGroup>`.
- [x] 2.3 Iterar sobre `invoices` y renderizar un `<IonAccordion value={inv.id}>` por cada uno.
- [x] 2.4 El `IonItem` de cabecera del acordeón debe mostrar Mes/Año, Total y Status (`paid`, `closed`, `open`).
- [x] 2.5 El contenido de cada acordeón es un `<div class="ion-padding" slot="content">` que itera sobre las transacciones de ese invoice.
- [x] 2.6 Mover el diseño original de los ítems de transacción (incluyendo botón de mover a la siguiente factura) al interior del acordeón.

## Phase 3: Verification
- [x] 3.1 Probar la carga de una tarjeta con varias facturas.
- [x] 3.2 Probar la navegación al abrir/cerrar un acordeón.
- [x] 3.3 Probar la funcionalidad de Mover al Siguiente Período de Facturación (que debe actualizar el estado).
