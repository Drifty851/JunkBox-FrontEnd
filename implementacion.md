# Guía de Implementación del Frontend de Junkbox

Este documento recoge el diseño técnico del frontend de **Junkbox** y, **módulo a módulo**, cómo se implementó cada pantalla a partir de Figma y contra el contrato real del backend.

Se actualiza **al terminar cada módulo**. La documentación del backend (`junkbox-backend/README.md` e `implementacion.md`) es la referencia de los contratos de API.

---

## Tabla de Contenidos

- [1. Contexto y Decisiones Globales](#1-contexto-y-decisiones-globales)
- [2. Fundamentos](#2-fundamentos)
  - [2.1 Stack y Herramientas](#21-stack-y-herramientas)
  - [2.2 Arquitectura MVC por Capas](#22-arquitectura-mvc-por-capas)
  - [2.3 Tokens de Diseño y Temas](#23-tokens-de-diseño-y-temas)
  - [2.4 Recursos Gráficos de Figma](#24-recursos-gráficos-de-figma)
  - [2.5 Cliente HTTP y Proxy de Desarrollo](#25-cliente-http-y-proxy-de-desarrollo)
  - [2.6 Componentes Compartidos](#26-componentes-compartidos)
- [3. Módulo 1: Autenticación (Iniciar sesión / Registrarse)](#3-módulo-1-autenticación-iniciar-sesión--registrarse)
- [4. Verificación](#4-verificación)
- [5. Historial](#5-historial)

---

## 1. Contexto y Decisiones Globales

- **Fuente visual:** Figma, archivo `KQPRPnqGUA7udlAjw8s5fo`. Cada pantalla tiene cuatro frames: Móvil 390×844 y Escritorio 1440×900, en Claro y Oscuro.
- **Fuente de contratos:** backend Go (`junkbox-backend`): `router.go`, `dto/`, `handlers_*.go`, `services/` y su README §API REST. **El backend no se modifica desde el frontend.** Si falta algo, se registra como solicitud al equipo de backend.
- **Desarrollo incremental:** un módulo cada vez, con lo mínimo necesario, sin abstracciones anticipadas.
- **Mobile First:** las clases base describen el móvil; `md:` (≥ 768 px) adapta a escritorio. Figma no define tablet: entre 390 y 1440 se escala el layout móvil centrado hasta `md`.

---

## 2. Fundamentos

### 2.1 Stack y Herramientas

| Pieza | Versión | Motivo |
|---|---|---|
| Vite (`create-vite`, plantilla `react-ts`) | 8.x | Build y servidor de desarrollo con proxy. |
| React | 19.x | UI. Se usa `<Context value>` (sin `.Provider`). |
| TypeScript | 7.x, `strict: true` | Tipado estricto; sin `any`. |
| Tailwind CSS (`@tailwindcss/vite`) | 4.x | Estilos con tokens en `@theme` (sin `tailwind.config`). |
| React Router (`react-router`) | 8.x | Rutas `/login`, `/register`, `/` y guardas de sesión. |
| oxlint | 1.x | Linter que incluye la plantilla de Vite. |
| pnpm | 11.x | Gestor de paquetes del proyecto. |

**No se añadieron** librerías de formularios, de peticiones (axios) ni de estado global: con `fetch`, `useState` y un contexto basta para este módulo.

### 2.2 Arquitectura MVC por Capas

Cada módulo vive en `src/features/<módulo>/` con estas capas:

| Capa | Carpeta | Responsabilidad | Auth |
|---|---|---|---|
| Modelo | `models/` | Tipos del contrato de API y validación de cliente. | `auth.types.ts`, `auth.validation.ts` |
| Infraestructura | `infrastructure/` | Adaptadores HTTP y de almacenamiento. | `authApi.ts`, `sessionStorage.ts` |
| Servicios | `services/` | Casos de uso; coordinan infraestructura. | `authService.ts`, `errorMessages.ts` |
| Controlador | `controllers/` | Estado de la vista, carga y errores; llama a servicios. | `AuthProvider.tsx`, `authContext.ts`, `useLoginController.ts`, `useRegisterController.ts` |
| Vista | `views/` | Componentes React sin lógica de negocio. | `LoginPage.tsx`, `RegisterPage.tsx`, `AuthLayout.tsx`, `AuthSwitchLink.tsx` |

Lo reutilizable entre módulos vive en `src/shared/` (`api/`, `ui/`, `utils/`). La composición global (proveedores, router, guardas) está en `src/app/`.

### 2.3 Tokens de Diseño y Temas

`src/index.css` define cada color como variable CSS `--jb-*` con su **variable de Figma de origen** y la expone a Tailwind con `@theme inline`, de modo que una clase como `bg-surface-input` cambia sola con el tema.

| Token Tailwind | Variable Figma | Claro | Oscuro |
|---|---|---|---|
| `bg` | `--color-bg` / `background/canvas` | `#ffffff` | `#121212` |
| `fg` | `text/primary` | `#000000` | `#f7f7f2` |
| `fg-muted` | `text/secondary` | `#5c5c5c` | `#b3b3b3` |
| `fg-placeholder` | `text/secondary-2` | `#828282` | `#b3b3b3` |
| `on-action` | `text/primary-2` | `#ffffff` | `#151515` |
| `surface` | `surface/default` | `#ffffff` | `#282828` |
| `surface-input` | `surface/input` | `#ffffff` | `#282828` |
| `surface-input-disabled` | `surface/input-2` | `#f5f5f5` | `#282828` |
| `line` | `border/default` | `#e6e6e6` | `#3b3b3b` |
| `line-strong` | `border/default-2` | `#5c5c5c` | `#b3b3b3` |
| `action` | `action/background-2` · `brand/accent-2` | `#000000` | `#d3533c` |
| `link` | `text/primary-3` (claro) · `brand/accent-2` (oscuro) | `#000000` | `#d3533c` |
| `accent` | `brand/accent` | `#d3533c` | `#d3533c` |

**Tipografía:** Inter (Google Fonts, pesos 400/500/600/700). Equivalencias con los estilos de Figma:

| Estilo Figma | Tailwind |
|---|---|
| `Heading/28/Bold/125pct` | `text-heading-sm font-bold` |
| `Heading/32/Bold/125pct` | `text-heading font-bold` |
| `Body/14/*/140pct` | `text-sm leading-[1.4]` |
| `Body/14/*/150pct` | `text-sm leading-normal` |
| `Body/13/Medium/140pct/Link` | `text-link-sm font-medium` |
| `Caption/12/*` | `text-xs` |

**Espaciado y radios:** las variables `space/4…80` y `radius/4, 8` coinciden con la escala de Tailwind (`gap-1`=4, `gap-4`=16, `px-6`=24, `rounded`=4, `rounded-lg`=8), así que no se usan valores arbitrarios para ellas.

**Tema activo:** se sigue `prefers-color-scheme` y se puede forzar con `<html data-theme="light|dark">`. El variante `dark:` de Tailwind se redefine con `@custom-variant` para respetar ambas cosas.

### 2.4 Recursos Gráficos de Figma

Descargados del MCP de Figma **sin editar**, en `src/assets/`:

| Archivo | Nodo Figma | Uso |
|---|---|---|
| `brand/junkbox-logo-light.svg` | `JunkboxLogo` (frames claros) | Logo 212×46.08, letras `#1D1D1B`. |
| `brand/junkbox-logo-dark.svg` | `JunkboxLogo` (frames oscuros) | Logo 212×46.08, letras `#F7F7F2`. |
| `icons/eye.svg` | `PasswordVisibilityToggle › eye` | 18 px. |
| `icons/alert-circle.svg` | `ErrorIndicator › alert-circle` | 16 px, dos colores. |
| `icons/lock.svg` | `DisabledIndicator › lock` | 16 px. |
| `icons/check.svg` | `ConsentCheckbox › check` | 12 px. |

Los iconos de un solo color (`eye`, `lock`) vienen con el color del tema claro fijado en el archivo. Para respetar el tema oscuro sin modificarlos, `MaskIcon` los usa como **máscara CSS** y los pinta con el token correspondiente. El logo tiene dos archivos y se alterna con `dark:hidden` / `dark:block`.

### 2.5 Cliente HTTP y Proxy de Desarrollo

`src/shared/api/httpClient.ts` envuelve `fetch`:

- Base `VITE_API_BASE_URL` (por defecto `/api/v1`).
- Envía y recibe JSON. Añade `Authorization: Bearer` si se le pasa un token.
- Errores: el backend siempre responde `{"error": "..."}` (README del backend, "Formato Estándar de Errores"). Se convierten en `ApiError(status, message)`. Los fallos de red se convierten en `NetworkError`.

`vite.config.ts` redirige `/api` → `VITE_BACKEND_URL` (`http://localhost:8080`), porque el router Chi del backend no tiene CORS.

### 2.6 Componentes Compartidos

| Componente | Figma | Estados implementados |
|---|---|---|
| `FormField` | `FormField` (14296:5948) | Etiqueta + control + ayuda/error. |
| `TextInput` | `TextInput` (14296:3707) | Default, Focus, Error, Disabled. |
| `PasswordInput` | `PasswordInput` (14296:3770) | Default, Focus, Error, Disabled, Visible (Mostrar/Ocultar). |
| `FieldInputBox` | Caja común de los dos anteriores | Alto 48, padding horizontal 16, radio 8. El Focus de 2 px se dibuja con sombra interior para que el contenido no se mueva. |
| `PrimaryButton` | `PrimaryButton` (14296:3676) | Default, Disabled, Loading (barra de progreso 48×4 + texto). |
| `Checkbox` | `ConsentCheckbox` | Sin marcar / Checked. `<input>` nativo invisible, para teclado y lectores de pantalla. |
| `JunkboxLogo` | `JunkboxLogo` | Claro / Oscuro. |
| `MaskIcon` | — | Iconos monocromos que cambian con el tema. |
| `FormAlert` | — (provisional) | Error general del formulario. Ver §3.6. |

---

## 3. Módulo 1: Autenticación (Iniciar sesión / Registrarse)

### 3.1 Pantallas de Figma

| Pantalla | Móvil Claro | Móvil Oscuro | Escritorio Claro | Escritorio Oscuro |
|---|---|---|---|---|
| Iniciar sesión | `14296:2388` | `14296:2489` | `14296:2442` | `14296:2543` |
| Registrarse | `14296:2590` | `14296:2702` | `14296:2649` | `14296:2761` |

Componentes de formulario: `LoginForm` (14296:16086) y `RegisterForm` (14296:16233, con el estado `Checked`).

**Cambios de diseño verificados (2026-11-02)** respecto a la primera auditoría:

- Se añadió **"Nombre de usuario"** (`FormField · Variant=Username`, placeholder `tu_usuario`) a RegisterForm.
- El texto de los **términos** ya usa tokens legibles en claro, y existe el estado `Checked`.
- La ayuda de la contraseña ahora dice **"De 8 a 72 bytes. Algunos caracteres ocupan más de un byte."**, igual que la regla del backend.
- Se añadieron estados **Focus / Error / Disabled / Visible** a los inputs y **Disabled / Loading** al botón.
- El pie legal se movió dentro de AuthFooter en móvil.

### 3.2 Rutas y Flujo

| Ruta | Acceso | Vista |
|---|---|---|
| `/login` | Solo sin sesión (`PublicOnlyRoute`) | `LoginPage` |
| `/register` | Solo sin sesión | `RegisterPage` |
| `/` | Solo con sesión (`ProtectedRoute`) | `SessionPlaceholderPage` (**temporal**) |

Si un usuario con sesión entra en `/login`, se le redirige a `/`. Sin sesión, `/` redirige a `/login`. Tras iniciar sesión o registrarse, se navega a `/`.

### 3.3 Contrato con el Backend

Referencia: `junkbox-backend/README.md` §API REST (endpoints 2 a 6) e `implementacion.md` §3.5.

| Acción | Endpoint | Request | Respuesta OK | Errores tratados |
|---|---|---|---|---|
| Iniciar sesión | `POST /api/v1/auth/login` | `{ identifier, password }` | `200 AuthResponse` | `400`, `401 "credenciales inválidas"` |
| Registrarse | `POST /api/v1/auth/register` | `{ username, email, password, display_name? }` | `201 AuthResponse` | `400` (validación), `409` (email/username duplicado) |
| Recuperar sesión | `GET /api/v1/auth/me` | Bearer | `200 UserProfile` | `401` → intenta refresh |
| Renovar tokens | `POST /api/v1/auth/refresh` | `{ refresh_token }` + Bearer **anterior** | `200 TokenPair` | `401` → borra la sesión |
| Cerrar sesión | `POST /api/v1/auth/logout` | `{ refresh_token }` + Bearer | `200 { message }` | Se ignoran (el cierre local basta) |

**Correspondencia entre formulario y API (registro):**

| Campo de Figma | Campo de API | Normalización (igual que el backend) |
|---|---|---|
| Nombre público | `display_name` (opcional) | `trim`. Si está vacío, **no se envía**. |
| Nombre de usuario | `username` | `trim` + minúsculas. |
| Correo electrónico | `email` | `trim` + minúsculas. |
| Contraseña | `password` | Sin cambios. |
| Acepto los términos… | — (no existe en el backend) | Solo en el cliente. |

El backend rechaza campos desconocidos (`DisallowUnknownFields` → `400 "solicitud inválida"`), así que **no se envía** la aceptación de términos (comprobado con una petición real).

**Login:** Figma etiqueta el campo como "Correo electrónico". El backend acepta email o username en `identifier`, así que también funciona si el usuario escribe su username.

### 3.4 Validación en el Cliente

`auth.validation.ts` **replica** las reglas existentes del backend (`auth_service.go · validateRegister`, `handlers_auth.go`). No añade reglas nuevas; solo adelanta errores que el servidor devolvería con `400`:

| Campo | Regla (backend) | Mensaje bajo el campo |
|---|---|---|
| Login: identificador | Obligatorio | "Introduce tu correo electrónico." |
| Login: contraseña | Obligatoria | "Introduce tu contraseña." |
| `display_name` | ≤ 100 caracteres | "No puede superar 100 caracteres." |
| `username` | `^[a-z0-9_.]{3,50}$` | "De 3 a 50 caracteres: letras, números, '_' o '.'." |
| `email` | ≤ 255 y formato válido (el backend usa `net/mail`) | "Introduce un correo electrónico válido." |
| `password` | 8 a 72 **bytes** UTF-8 (se miden con `TextEncoder`) | "Debe tener entre 8 y 72 bytes." |

Cuando un campo falla, el input pasa al estado **Error** de Figma (borde `brand/accent` + "Revisa el campo"), y el motivo concreto aparece en el hueco de ayuda, enlazado con `aria-describedby`.

### 3.5 Sesión y Tokens

- Tokens (README del backend): access token **JWT de 15 min** y refresh token opaco de **7 días** que **rota** en cada uso. Reutilizar un refresh token revoca toda su familia.
- `sessionStorage.ts` guarda `{ accessToken, refreshToken, accessTokenExpiresAt }` en `localStorage` (clave `junkbox.session`).
- Al abrir la app, `AuthProvider` llama a `authService.restoreSession()`:
  1. `GET /auth/me`.
  2. Si responde 401, `POST /auth/refresh` con el access token anterior y repite `/me`.
  3. Si vuelve a dar 401, borra la sesión.
- Mientras tanto, las guardas no pintan nada (`status: 'checking'`), para evitar parpadeos.

### 3.6 Decisiones de Implementación

1. **Errores del servicio (401, 409, red):** Figma todavía no define dónde se muestran ("No se define aquí ciclo de sesión, errores del servicio ni destinos", nota del LoginForm). Se muestran encima del botón con `FormAlert`, que reutiliza el icono `alert-circle` y el estilo del ErrorIndicator. El texto es el que envía el backend (ya en español), con mayúscula inicial. **Provisional** hasta que diseño defina el estado.
2. **"¿Olvidaste tu contraseña?":** sigue visible por decisión del propietario (nota de Figma), pero no hay endpoint de recuperación. Se muestra con el estilo de Figma, sin acción, y con `aria-disabled`.
3. **Botón "Crear cuenta" deshabilitado hasta aceptar los términos:** se usa el estado **Disabled** de PrimaryButton. Es la forma de exigir la aceptación sin enviarla al backend.
4. **Mientras se envía:** los inputs pasan a `readOnly` (no a Disabled, que en Figma muestra "No disponible") y el botón muestra el estado **Loading** ("Iniciando sesión…" / "Creando cuenta…"). La barra de progreso se anima de forma sutil y respeta `prefers-reduced-motion`.
5. **Términos y Política de Privacidad** (casilla y pie legal) se muestran como texto subrayado sin enlace: aún no existen URLs de esos documentos.
6. **Pie legal:** en móvil sigue a AuthFooter (separación 24 en Login, 16 en Registro). En escritorio baja al fondo de la página (`md:mt-auto`), como en los frames de escritorio de Login.
7. **Barra de estado y HomeIndicator** de los frames móviles simulan el teléfono y no se implementan.
8. **`/` es una página temporal** (`SessionPlaceholderPage`): muestra `@username` y permite cerrar sesión. No sale de Figma y se sustituirá por el módulo Inicio.

### 3.7 Accesibilidad

- `<label htmlFor>` en todos los campos, `aria-invalid` y `aria-describedby` hacia la ayuda o el error.
- `autocomplete` correcto (`username`, `current-password`, `new-password`, `email`, `name`).
- El botón Mostrar/Ocultar contraseña tiene `aria-pressed` y una etiqueta accesible propia.
- Los errores se anuncian con `role="alert"`. El botón en carga usa `aria-busy`.
- Foco visible (`focus-visible:outline`) en enlaces, botones y casilla.

### 3.8 Limitaciones Conocidas

- **Recuperación de contraseña:** no hay endpoint en el backend.
- **Términos:** la aceptación no se guarda en el servidor (el backend no tiene ese campo).
- **Tokens en `localStorage`:** quedan expuestos si alguna vez hay un XSS. El backend entrega los tokens en el cuerpo JSON (no usa cookies `httpOnly`).
- **CORS:** el backend no lo tiene. En desarrollo se resuelve con el proxy de Vite. En producción hace falta mismo origen o que el backend habilite CORS.
- **Renovación de tokens:** solo se renuevan al recuperar la sesión al abrir la app. Cuando haya endpoints protegidos en uso (módulos siguientes), habrá que reintentar con refresh ante un 401.
- **Estados de error del servicio** (§3.6.1) son provisionales.
- **Tablet:** Figma no lo define. Se usa el layout móvil centrado hasta 768 px.
- **Favicon:** Figma no lo define. Se quitó el de la plantilla de Vite.

### 3.9 Verificación del Módulo (2026-11-02)

| Prueba | Resultado |
|---|---|
| `pnpm typecheck` | ✅ Sin errores |
| `pnpm lint` | ✅ Sin avisos |
| `pnpm build` | ✅ Build correcto (JS ≈ 105 kB gzip) |
| Proxy `/api` → backend en WSL (`/healthz`) | ✅ 200 |
| Login con credenciales incorrectas | ✅ `401 {"error":"credenciales inválidas"}` |
| Login con usuario seed (`cesar@junkbox.local`) + `GET /auth/me` | ✅ 200 con `UserProfile` |
| Enviar un campo desconocido al registro | ✅ `400 "solicitud inválida"` (confirma que no se envía `terms_accepted`) |
| Capturas headless (Edge) Claro/Oscuro, ~500 px y 1440 px | ✅ Coinciden con los frames de Figma |

No se ejecutó un registro real para no crear usuarios de prueba en la base de datos del backend.

---

## 4. Verificación

Antes de cerrar cualquier módulo:

```bash
pnpm typecheck
pnpm lint
pnpm build
```

Además: probar las rutas del módulo con el backend en marcha (`pnpm dev`), revisar móvil y escritorio en los dos temas, y comparar con los frames de Figma.

> Aún no hay framework de tests unitarios. Se añadirá cuando un módulo tenga lógica que lo justifique.

---

## 5. Historial

| Fecha | Cambio |
|---|---|
| 2026-11-02 | Creación del proyecto (Vite + React + TS + Tailwind v4, pnpm). Fundamentos (tokens, tema, cliente HTTP, proxy). Módulo 1: Autenticación. |
