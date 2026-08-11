# 05 — Auth, perfil, sesiones y recuperación

## Objetivo

Documentar sesión JWT, perfil de usuario, seguimiento de ingresos y recuperación de contraseña.

## Alcance

- Token JWT (~65 min) e idle de 5 minutos en frontend
- Campos de perfil: correo, celular, red, cargo
- Cambio obligatorio de contraseña en primer acceso (usuarios nuevos)
- Registro de ingresos (`sesiones_ingreso`)
- Recuperación por correo (`password_reset_tokens`)

## Responsabilidades

| Pieza | Responsabilidad |
|-------|-----------------|
| `sql/03_usuarios_perfil_sesiones.sql` | Columnas y tablas (idempotente) |
| `Backend/apps/accounts/` | Login, `/me`, perfil, password, forgot/reset, sesiones |
| `Frontend` AuthContext / páginas | Idle, 401, Mi perfil, Olvidé/Restablecer, Seguimiento |

## Dependencias

- Ejecutar `sql/03_*.sql` **antes** de desplegar backend con modelos nuevos
- Copiar plantillas de entorno:
  - `Backend/.env.example` → `Backend/.env`
  - `Frontend/.env.example` → `Frontend/.env`
- Variables `EMAIL_*`, `FRONTEND_URL`, `ACCESS_TOKEN_EXPIRE_MINUTES` (ver ejemplos comentados en `.env.example`)
- Dependencias Python: `Backend/requirements.txt`
- En desarrollo, `EMAIL_BACKEND=console` imprime el enlace de recuperación en la consola del `runserver`

## Archivos relacionados

- `sql/03_usuarios_perfil_sesiones.sql`
- `Backend/apps/accounts/`
- `Frontend/src/context/AuthContext.tsx`
- `Frontend/src/features/profile/ProfilePage.tsx`
- `Frontend/src/features/sessions/SessionsPage.tsx`
- `Frontend/src/features/auth/ForgotPasswordPage.tsx`
- `Frontend/src/features/auth/ResetPasswordPage.tsx`

## Endpoints

| Método | Ruta | Notas |
|--------|------|--------|
| POST | `/api/auth/login` | Registra ingreso; `debe_cambiar_password` |
| GET | `/api/auth/me` | Perfil extendido |
| PUT | `/api/auth/me/perfil` | Self-service |
| PUT | `/api/auth/me/password` | Self-service |
| POST | `/api/auth/forgot-password` | Respuesta genérica |
| POST | `/api/auth/reset-password` | Token 30 min |
| GET | `/api/auth/sesiones` | Permiso `admin:sesiones` o `*` |

## Riesgos

- Desplegar backend sin SQL 03 rompe `/auth/me` y login
- Sin correo en perfil no hay recuperación real
- Re-ejecutar `02_seed` borra `perfil_permisos` — no hacerlo en BD en uso

## Mejoras posibles

- Export Excel de sesiones
- Catálogo de redes
- SMTP institucional documentado por ambiente
