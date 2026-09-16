# Proposal: Financial Analysis (LLM Integration)

## Intent
Proveer un análisis financiero personalizado y en lenguaje natural basado en los datos transaccionales de los últimos dos meses. Se resolverá utilizando el LLM ya integrado en el ecosistema de la app (mismo que se usa en el "Magic Modal") para brindar consejos dinámicos y orgánicos sobre la salud financiera del usuario.

## Scope

### In Scope
- Creación de un endpoint `GET /api/insights/analysis` que orqueste la llamada al LLM.
- Construcción de un "prompt" del sistema que incluya agrupaciones de gastos del mes actual vs mes anterior y reglas base.
- Integración en el frontend para mostrar el análisis generado (en la pantalla de Dashboard o Insights).
- Reutilización de la conexión/SDK del LLM existente (e.g. OpenAI) usando las API keys ya configuradas en el entorno.

### Out of Scope
- Permitir al usuario chatear libremente con el LLM sobre sus finanzas (es generación de reporte, no chat).
- Análisis proyectado a más de 2 meses.

## Capabilities

### New Capabilities
- `financial-analysis`: Generación de texto descriptivo y recomendaciones de ahorro utilizando IA (LLM) a partir del historial de transacciones.

### Modified Capabilities
- None.

## Approach
Se modificará o extenderá el controlador de `insights.ts` (o se creará un módulo de `analysis.ts`) que:
1. Recupere las transacciones agrupadas (como ya lo hace).
2. Formatee los datos a un JSON o texto plano estructurado.
3. Invoque la misma utilidad LLM usada en `magic.ts`.
4. Devuelva un bloque de texto que el frontend renderizará dentro de un componente tipo "Insight Card".

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `backend/src/controllers/insights.ts` | Modified | Agregar lógica para resumir datos y llamar al LLM |
| `backend/src/utils/llm.ts` (hipotético) | Modified | Reutilizar la integración LLM usada por Magic Modal |
| `frontend/src/pages/Transactions.tsx` o Dashboard | Modified | UI para alojar el nuevo análisis |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Timeout del LLM al procesar el análisis | Medium | Usar timeouts; si falla, mostrar mensaje genérico o esconder la sección |
| Inyección de prompt por datos maliciosos en descripciones de gastos | Low | Sanitizar datos, enviar solo nombres de categorías o descripciones truncadas |

## Rollback Plan
Se puede deshabilitar el botón/sección en el frontend y revertir el endpoint `GET /api/insights/analysis` mediante git revert sin afectar el funcionamiento base de la app.

## Dependencies
- Servicio de LLM configurado (ej. OpenAI `processImage/processText` actual de magic modal).

## Success Criteria
- [ ] El frontend muestra un análisis de 1 o 2 párrafos redactado en lenguaje natural.
- [ ] El análisis menciona el contexto financiero real (ej: si se gastó 30% en comida, el LLM lo advierte).
- [ ] El tiempo de respuesta no congela la UI (manejo asíncrono/estado de loading adecuado).
