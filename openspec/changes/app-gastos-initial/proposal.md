# Proposal: app-gastos-initial

## Intent

Establecer la base tecnológica y las funcionalidades iniciales de la aplicación de control de gastos "app-gastos". El objetivo es permitir el registro de transacciones, gestión de cuentas y presupuestos, asegurando la privacidad del usuario mediante la encriptación selectiva de datos sensibles sin comprometer el rendimiento en consultas.

## Scope

### In Scope
- Desarrollo de Frontend web y móvil (Android) usando React con Ionic.
- Desarrollo de Backend unificado en Node.js con TypeScript.
- Base de datos relacional PostgreSQL.
- Implementación de encriptación estricta para PII (Descripción de transacciones, Etiquetas, Usuarios, Contraseñas).
- Módulos core: Dashboard, Transacciones, Transferencias, Cuentas, Presupuestos.
- Autenticación dual (Email/Contraseña y Google Auth).

### Out of Scope
- Aplicación nativa iOS.
- Sincronización bancaria automática (plaid/etc).
- Importación/exportación masiva de datos (diferido para iteraciones futuras).

## Capabilities

### New Capabilities
- `dashboard`: Visualización de métricas clave, balance general y distribución de gastos.
- `transactions`: CRUD de ingresos, gastos y transferencias entre cuentas.
- `accounts`: Gestión de los repositorios de fondos de los usuarios.
- `budgets`: Definición de límites de gasto por categoría y seguimiento.
- `authentication`: Registro, login y protección de rutas.
- `data-privacy`: Políticas y rutinas de encriptación/desencriptación de PII.

### Modified Capabilities
- None

## Approach

Se adoptará un stack full TypeScript (React/Ionic + Node.js) para maximizar la reutilización de código y tipos. PostgreSQL actuará como base de datos central. El backend será responsable de aplicar las rutinas de encriptación antes de la persistencia (para descripciones, etiquetas y datos de usuario), garantizando que los campos `Valor`, `Fecha` y `Categoría` queden en texto plano. Esto permite que la base de datos ejecute operaciones de agregación (`SUM`, `GROUP BY`) nativamente con alto rendimiento.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `frontend/` | New | Proyecto base en React con Ionic. |
| `backend/` | New | API en Node.js (TypeScript). |
| `database/` | New | Esquema en PostgreSQL con soporte para campos encriptados. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Impacto en rendimiento al listar transacciones por desencriptación | Med | Paginación estricta desde el backend y desencriptación on-the-fly en memoria, evitando desencriptaciones en base de datos. |
| Pérdida de llaves de encriptación | Low | Respaldo seguro de secretos de entorno y uso de KMS (Key Management Service) si aplica. |

## Rollback Plan

Al ser la fase inicial del proyecto, el rollback consistirá en revertir a un estado vacío del repositorio y purgar la instancia de base de datos de desarrollo creada.

## Dependencies

- Google Cloud Console Project configurado para OAuth2.
- Servidor PostgreSQL local o en la nube para el ambiente de desarrollo.

## Success Criteria

- [ ] Los usuarios pueden registrarse, iniciar sesión (Google/Email) y manejar sus sesiones.
- [ ] Los usuarios pueden crear cuentas y registrar gastos.
- [ ] El Dashboard refleja correctamente el balance basado en agregaciones de base de datos sobre campos no encriptados.
- [ ] Una revisión manual a la base de datos confirma que descripciones, etiquetas e información de usuario se encuentran encriptados.
