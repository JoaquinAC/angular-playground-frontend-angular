# Análisis backend para normalización frontend

> Base path real del backend: `/api`.
> 
> Por tanto, los endpoints solicitados por frontend (`/auth/...`, `/users/...`) en este backend son realmente `/api/auth/...` y `/api/users/...`.

## 2) Contrato de endpoints (mínimo obligatorio)

### 2.1 POST /auth/login
**Ruta real:** `POST /api/auth/login`

**Request**
```json
{ "username": "string", "password": "string" }
```

**Notas backend real:**
- El campo `username` se usa internamente como **email** para autenticar.

**Response 200**
```json
{ "token": "jwt-string" }
```

**Errores posibles (backend actual):**
- `401` credenciales inválidas.
- `500` error no controlado.
- `422`: **no implementado** (la validación de `AuthRequest` existe en DTO pero el controlador no usa `@Valid`; no devuelve 422).

---

### 2.2 GET /auth/me
**Ruta real:** `GET /api/auth/me`

**Header requerido:** `Authorization: Bearer <token>`

**Response 200**
```json
{
  "username": "string",
  "authorities": [{ "authority": "ROLE_ADMIN" }]
}
```

**Errores posibles (backend actual):**
- `401` sin token o no autenticado.
- `403` autenticado sin permisos.
- `500` si hay fallo interno no controlado.

---

### 2.3 POST /auth/register
**Ruta real:** `POST /api/auth/register`

**Request**
```json
{ "username": "string", "email": "string", "password": "string" }
```

**Response éxito:** `201 Created` con body de usuario
```json
{
  "id": 1,
  "username": "u",
  "email": "e",
  "role": "GUEST",
  "createdAt": "2026-03-05T12:00:00"
}
```

**Errores posibles (backend actual):**
- `409` email/username ya existente.
- `400` validación de campos (`@Valid`) en lugar de 422.
- `500` error no controlado.

---

### 2.4 GET /users
**Ruta real:** `GET /api/users`

**Response 200**
```json
[
  { "id": 1, "username": "u", "email": "e", "role": "ADMIN", "createdAt": "ISO" }
]
```

**Errores posibles (backend actual):**
- `401` no autenticado.
- `403` no tiene rol ADMIN.
- `500` error no controlado.

---

### 2.5 DELETE /users/:id
**Ruta real:** `DELETE /api/users/{id}`

**Response éxito:** ✅ **204 (sin body)**

**Errores posibles (backend actual):**
- `401` no autenticado.
- `403` no tiene rol ADMIN.
- `404` usuario no encontrado.
- `500` error no controlado.

## 3) Pauta 2 — Estándar oficial de errores de negocio

Regla objetivo solicitada:
```json
{
  "code": "STRING_MACHINE_READABLE",
  "message": "Mensaje legible para usuario/soporte",
  "errors": [
    { "field": "email", "message": "formato inválido" }
  ],
  "traceId": "optional-correlation-id",
  "timestamp": "2026-03-05T12:00:00Z"
}
```

### Estado del backend actual
El backend **no** cumple un esquema único:
- Excepciones globales (`GlobalExceptionHandler`) devuelven `{timestamp,status,error,message}`.
- Validación (`MethodArgumentNotValidException`) devuelve un `Map<field,message>` plano.
- 401/403 de Spring Security (`JwtAuthenticationEntryPoint`, `JwtAccessDeniedHandler`) devuelven `{error,message}`.

### 3.1 Campos obligatorios
- `code` (sí/no): **no**
- `message` (sí/no): **sí**
- `errors[]` (sí/no): **no**
- `traceId` (sí/no): **no**
- `timestamp` (sí/no): **parcial** (sí en GlobalExceptionHandler, no en 401/403 de seguridad)

### 3.2 Reglas por tipo de error
**401 Unauthorized**
- `code`: **no definido actualmente**
- `message`: `"Authentication is required"`

**403 Forbidden**
- `code`: **no definido actualmente**
- `message`: `"You do not have permission to access this resource"`

**422 Validation**
- ¿`errors[]` incluye `field` siempre? **no** (no existe `errors[]`; además se usa 400 en validación).

**500 Internal**
- ¿Se oculta detalle técnico sensible? **no** (se devuelve clase de excepción + mensaje en respuesta).

### 3.3 Catálogo mínimo de `code` (estado actual)
No existe catálogo de `code` implementado.

Propuesta para alinear con frontend:
- `AUTH_INVALID_CREDENTIALS`
- `AUTH_TOKEN_EXPIRED`
- `AUTH_FORBIDDEN`
- `USER_EMAIL_TAKEN`
- `VALIDATION_ERROR`
- `INTERNAL_ERROR`

## 4) Política oficial de roles

Formato único enviado por backend: **mixto según endpoint**
- En `/api/auth/me`: `ROLE_ADMIN` / `ROLE_GUEST` (authorities de Spring Security).
- En DTO usuario (`/api/users`, `/api/auth/register`): `ADMIN` / `GUEST`.

Roles vigentes: **ADMIN, GUEST**

Matriz de permisos resumida:
- **Admin:** listar usuarios, borrar usuarios, ver/editar/cambiar password (incluyendo terceros por lógica de servicio).
- **Guest:** login/register/me, ver/editar/cambiar password solo su propio usuario; no puede listar/borrar usuarios.

## 5) Sesión y token

Expiración JWT: **900000 ms (15 minutos)** en configuración de test; en runtime depende de propiedad `jwt.expiration` del entorno activo.

¿Existe refresh token?: **no**

Si existe: endpoint + contrato refresh: **no aplica**

Regla al iniciar app con token guardado:
- `GET /auth/me + rehidratar sesión + fallback a logout en 401/403`: **sí, recomendado y compatible con el backend actual**.
