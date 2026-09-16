## Exploration: Análisis Financiero (Últimos 2 Meses)

### Current State
Actualmente, el sistema cuenta con un controlador de *insights* (`backend/src/controllers/insights.ts`) que extrae los totales de ingresos y gastos del mes en curso y del mes anterior. Además, calcula ratios básicos (gasto vs ingreso, crecimiento mes a mes, uso del presupuesto) y las top 3 categorías de gasto.
Sin embargo, no existe un motor de análisis que genere conclusiones redactadas en lenguaje natural ni que compare categorías específicas (como "alimentación" o "gastos imprevistos") contra reglas de salud financiera, como solicita el usuario.

### Affected Areas
- `backend/src/controllers/insights.ts` — Requiere expansión para calcular porcentajes por categoría específica contra el ingreso total y aplicar reglas de negocio.
- `backend/src/routes/insights.ts` — Podría requerir un nuevo endpoint o modificar el actual.
- `frontend/src/pages/Dashboard.tsx` (o una nueva pantalla de `Insights/Analisis`) — Para mostrar las frases y recomendaciones generadas.

### Approaches
1. **Análisis Basado en Reglas (Rule-based Engine)** — Crear un motor de reglas en el backend que reciba los datos agrupados de transacciones y aplique condiciones `if/else` (ej: `if (categoria === 'alimentacion' && porcentaje > 30) return 'Tu consumo...';`).
   - Pros: Implementación rápida, sin dependencias externas, totalmente predecible, gratis.
   - Cons: Escalarlo a decenas de reglas distintas requiere mucho código duro; menos "inteligente" o variado en la redacción.
   - Effort: Low

2. **Análisis Integrado con IA (LLM via API)** — Mandar el resumen de los últimos 2 meses a una API (OpenAI/Anthropic) con un prompt pidiendo un análisis financiero experto de 2 párrafos.
   - Pros: Análisis rico, redactado de forma natural, descubre patrones complejos que las reglas duras pueden obviar.
   - Cons: Requiere gestionar API keys, implica latencia, costo por uso y manejo de errores si la API falla.
   - Effort: Medium

### Recommendation
**Análisis Basado en Reglas (Approach 1)**. Dado el contexto de la aplicación, es más seguro y viable comenzar con un motor de reglas interno que busque palabras clave en las categorías (ej: "imprevistos", "alimentación", "salud") y retorne un array de `recommendations` (strings). Si más adelante el usuario desea añadir su propia API Key, se puede escalar al Approach 2.

### Risks
- Las categorías son creadas por los usuarios; buscar por nombre (ej: "alimentación") puede fallar si el usuario la nombra "comida" o "súper". Se necesitará buscar por ID si son categorías por defecto o normalizar textos (buscar sub-strings).
- Impacto en el performance si se traen todas las transacciones sin agrupar. La base de datos debe encargarse de las agrupaciones (GROUP BY).

### Ready for Proposal
Yes — Estamos listos para proponer la solución concreta.
