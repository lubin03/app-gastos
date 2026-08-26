## Exploration: app-gastos-initial

### Current State
El proyecto actual se encuentra vacío. Se cuenta con requerimientos basados en 29 imágenes de referencia (prototipos/screens de una app estilo Mobills) y un archivo Excel con un histórico de transacciones. 
El Excel define un modelo de datos robusto con:
- **Transacciones (Gastos e Ingresos):** Fecha, Descripción, Valor, Cuenta, Situación (ej. Pagado/Pendiente), Categoría, Subcategoría y Etiquetas.
- **Transferencias:** Fecha, Cuenta Origen, Cuenta Destino, Valor, Etiquetas.

Las imágenes revelan las funcionalidades principales de la interfaz:
- Dashboard (Vista general) con saldo, ingresos y gastos.
- Gráficos de rendimiento (Ingresos vs Gastos por categoría).
- Gestión de transacciones con listado, creación, y filtros por fecha y estado.
- Gestión de cuentas y tarjetas de crédito con múltiples instituciones financieras.
- Gestión de presupuestos y metas.

### Affected Areas
- `openspec/changes/app-gastos-initial/*` — Definición de la arquitectura y el diseño base.
- **Frontend** — Aplicación web (y posiblemente móvil) para la UI.
- **Backend** — API para la lógica de negocio, autenticación y encriptación.
- **Base de Datos** — Estructura para almacenar usuarios, cuentas, transacciones y transferencias.

### Approaches

1. **Node.js (NestJS / Express) + React + PostgreSQL + AES-256**
   - Pros: Stack unificado en TypeScript. Ecosistema rico para autenticación (Passport) y criptografía.
   - Cons: Requiere configuración detallada de la arquitectura.
   - Effort: Medium

2. **Python (FastAPI) + React/Vue + PostgreSQL + Cryptography**
   - Pros: FastAPI es excelente para validación de datos (Pydantic). Las librerías de encriptación en Python son muy maduras y robustas.
   - Cons: Manejo de dos lenguajes distintos en el proyecto (Python en backend, JS/TS en frontend).
   - Effort: Medium

3. **BaaS (Supabase / Firebase) + React**
   - Pros: Autenticación social (Google Auth) nativa y desarrollo muy rápido del CRUD.
   - Cons: Implementar **encriptación a nivel de campo** (para que las transacciones sean ilegibles directamente en la base de datos) es complejo usando solo el cliente o requiere muchas funciones Edge/Serverless, lo que complica la arquitectura a largo plazo.
   - Effort: High (debido a la complejidad de la encriptación requerida).

### Recommendation
**Approach 1 o 2 (Backend propio con PostgreSQL)**. 
Dado el requerimiento crítico de que las transacciones y contraseñas deben estar estrictamente encriptadas en la base de datos, un backend propio (Node.js o Python) es la mejor opción. Permite usar cifrado a nivel de aplicación (ej. AES-256-GCM) antes de persistir los datos en la DB. 
Para la base de datos, **PostgreSQL** es ideal por su soporte nativo para `pgcrypto` si se prefiere encriptar en la capa de la base de datos, aunque la encriptación en el backend ofrece mayor seguridad. Para la autenticación se puede usar OAuth2 para Google y hashing fuerte (Bcrypt/Argon2) para las contraseñas.

### Risks
- **Rendimiento de Consultas:** Si se encriptan campos como `Valor`, `Fecha` o `Categoría` de forma no determinista, será imposible realizar agregaciones o filtros eficientes (ej. `SUM`, `GROUP BY`) directamente con SQL en la base de datos. Se deberá definir cuidadosamente la estrategia de encriptación (ej. solo encriptar `Descripción`, o encriptar todo y calcular las sumas en memoria del backend).
- **Gestión de Llaves de Encriptación:** La pérdida o compromiso de la Master Key (KMS o variable de entorno) resultaría en la pérdida irreversible de los datos de todos los usuarios.
- **Complejidad de Autenticación:** La integración de login tradicional (correo/contraseña) y OAuth (Google) requiere vincular correctamente las identidades para evitar cuentas duplicadas.

### Ready for Proposal
Yes — The orchestrator should tell the user that the data model (based on the Excel) and UI (based on the images) are well understood. The orchestrator should ask the user to confirm the preferred technology stack (e.g. Node.js or Python) and clarify the encryption strategy (whether to encrypt all fields, which degrades DB aggregation performance, or only sensitive PII like descriptions).
