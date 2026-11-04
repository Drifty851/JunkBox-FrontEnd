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
- [4. Módulo 2: Inicio](#4-módulo-2-inicio)
- [5. Verificación](#5-verificación)
- [6. Historial](#6-historial)

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

| Capa | Carpeta | Responsabilidad | Auth | Inicio |
|---|---|---|---|---|
| Modelo | `models/` | Tipos del contrato de API y validación de cliente. | `auth.types.ts`, `auth.validation.ts` | `track.types.ts`, `home.types.ts` |
| Infraestructura | `infrastructure/` | Adaptadores HTTP y de almacenamiento. | `authApi.ts`, `sessionStorage.ts` | `musicApi.ts` |
| Servicios | `services/` | Casos de uso; coordinan infraestructura. | `authService.ts`, `errorMessages.ts` | `homeService.ts` |
| Controlador | `controllers/` | Estado de la vista, carga y errores; llama a servicios. | `AuthProvider.tsx`, `authContext.ts`, `useLoginController.ts`, `useRegisterController.ts` | `useHomeController.ts` |
| Vista | `views/` | Componentes React sin lógica de negocio. | `LoginPage.tsx`, `RegisterPage.tsx`, `AuthLayout.tsx`, `AuthSwitchLink.tsx` | `HomePage.tsx`, `RecommendationsSection.tsx` |

Inicio añade además `data/homeTemplate.ts` (la plantilla provisional de canciones, §4.3).

Lo reutilizable entre módulos vive en `src/shared/` (`api/`, `ui/`, `layout/`, `utils/`). La composición global (proveedores, router, guardas y `AppLayout`) está en `src/app/`.

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
| `surface-input-disabled` | `surface/input-2` (también fondo de SearchField y placeholders) | `#f5f5f5` | `#282828` |
| `surface-nav` | `surface/navigation` | `#ffffff` | `#181818` |
| `surface-quickplay` | `action/background-4` | `#ffffff` | `#1e1e1e` |
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
| `Heading/32/Bold/140pct` (Inicio) | `text-heading font-bold leading-[1.4]` |
| `Title/18/SemiBold/140pct` | `text-lg font-semibold leading-[1.4]` |
| `Body/13/SemiBold/140pct` | `text-[13px] font-semibold leading-[1.4]` |
| `Caption/12/*` | `text-xs` |
| `Caption/11/Regular/140pct` | `text-[11px] leading-[1.4]` |
| `Caption/10/*/140pct` | `text-caption-2xs` |

**Espaciado y radios:** las variables `space/4…80` y `radius/4, 8` coinciden con la escala de Tailwind (`gap-1`=4, `gap-4`=16, `px-6`=24, `rounded`=4, `rounded-lg`=8), así que no se usan valores arbitrarios para ellas.

**Tema activo:** se sigue `prefers-color-scheme` y se puede forzar con `<html data-theme="light|dark">`. El variante `dark:` de Tailwind se redefine con `@custom-variant` para respetar ambas cosas.

### 2.4 Recursos Gráficos de Figma

Descargados del MCP de Figma **sin editar**, en `src/assets/`:

| Archivo | Nodo Figma | Uso |
|---|---|---|
| `brand/junkbox-logo-light.svg` | `JunkboxLogo` (frames claros) | Logo 212×46.08, letras `#1D1D1B`. También en la Navbar (128 y 160 de ancho) y como favicon. |
| `brand/junkbox-logo-dark.svg` | `JunkboxLogo` (frames oscuros) | Logo 212×46.08, letras `#F7F7F2`. Igual que el anterior. |
| `icons/eye.svg` | `PasswordVisibilityToggle › eye` | 18 px. |
| `icons/alert-circle.svg` | `ErrorIndicator › alert-circle` | 16 px, dos colores. |
| `icons/lock.svg` | `DisabledIndicator › lock` | 16 px. |
| `icons/check.svg` | `ConsentCheckbox › check` | 12 px. |
| `icons/search-20.svg` | `SearchField › search` | 20 px (Navbar). |
| `icons/search-22.svg` | `NavigationItem › search` | 22 px (BottomBar). |
| `icons/house.svg` | `NavigationItem › house` | 22 px. |
| `icons/square-plus.svg` | `NavigationItem › square-plus` | 22 px. |
| `icons/person.svg` | `NavigationItem › Icon/Person` | 24 px de origen, se pinta a 22. |
| `icons/plus.svg` | `Button › plus` (Crear Reseña) | 16 px. |
| `icons/play-12.svg` · `play-14.svg` | `MusicCard › QuickPlay › play` | 12 px (móvil) y 14 px (escritorio). |

Los iconos de un solo color (`eye`, `lock` y todos los de navegación y QuickPlay) vienen con el color del tema claro fijado en el archivo. Para respetar el tema oscuro sin modificarlos, `MaskIcon` los usa como **máscara CSS** y los pinta con el token correspondiente. El logo tiene dos archivos y se alterna con `dark:hidden` / `dark:block`.

### 2.5 Cliente HTTP y Proxy de Desarrollo

`src/shared/api/httpClient.ts` envuelve `fetch`:

- Base `VITE_API_BASE_URL` (por defecto `/api/v1`).
- Envía y recibe JSON. Añade `Authorization: Bearer` si se le pasa un token.
- Errores: el backend siempre responde `{"error": "..."}` (README del backend, "Formato Estándar de Errores"). Se convierten en `ApiError(status, message)`. Los fallos de red se convierten en `NetworkError`.

`vite.config.ts` redirige `/api` → `VITE_BACKEND_URL` (`http://localhost:8080`). Es la opción por defecto porque funciona en cualquier puerto de Vite.

**CORS del backend** (desde el commit `bab8e12`): `go-chi/cors` con los orígenes de `CORS_ALLOWED_ORIGINS` (por defecto `http://localhost:5173`), métodos `GET`/`POST`/`OPTIONS`, cabeceras `Authorization` y `Content-Type`, sin credenciales. Con `VITE_API_BASE_URL=http://localhost:8080/api/v1` el navegador llama al backend directamente, sin proxy. El cliente HTTP no cambia: no usa cookies (`credentials` queda por defecto) y solo envía esas dos cabeceras más `Accept`, que no necesita permiso de CORS.

### 2.6 Componentes Compartidos

| Componente | Figma | Estados implementados |
|---|---|---|
| `FormField` | `FormField` (14296:5948) | Etiqueta + control + ayuda/error. |
| `TextInput` | `TextInput` (14296:3707) | Default, Focus, Error, Disabled. |
| `PasswordInput` | `PasswordInput` (14296:3770) | Default, Focus, Error, Disabled, Visible (Mostrar/Ocultar). |
| `FieldInputBox` | Caja común de los dos anteriores | Alto 48, padding horizontal 16, radio 8. El Focus de 2 px se dibuja con sombra interior para que el contenido no se mueva. |
| `PrimaryButton` | `PrimaryButton` (14296:3676) | Default, Disabled, Loading (barra de progreso 48×4 + texto). |
| `Checkbox` | `ConsentCheckbox` | Sin marcar / Checked. `<input>` nativo invisible, para teclado y lectores de pantalla. |
| `JunkboxLogo` | `JunkboxLogo` | Claro / Oscuro. Acepta tamaño (AuthShell 212, Navbar 128/160). |
| `MaskIcon` | — | Iconos monocromos que cambian con el tema. |
| `FormAlert` | — (provisional) | Error general del formulario. Ver §3.6. También en el error de Inicio. |
| `Avatar` | Slot `Avatar1` de Navbar | Imagen o círculo neutro si falta o no carga. |
| `MusicCard` | `MusicCard` (14296:3351) | Móvil 112 / escritorio 164; QuickPlay decorativo; carátula o recuadro neutro. |
| `Navbar` (`shared/layout`) | `Navbar` (14296:14145) | Móvil 52 / escritorio 80; enlace activo con `aria-current`. |
| `BottomBar` (`shared/layout`) | `BottomBar` (14296:15745) | Solo móvil; ítem activo con el color `link`. |
| `NavTarget` (`shared/layout`) | — | Enlace (`NavLink`) o botón con `aria-disabled` si el destino no existe. |
| `AccountMenu` (`shared/layout`) | — (provisional) | Menú del avatar con "Cerrar sesión". Ver §4.5. |

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
- La ayuda de la contraseña ahora dice **"De 8 a 72 bytes. Algunos caracteres ocupan más de un byte."**. **Desactualizada desde 2026-11-03:** el backend endureció la regla (§3.4), así que el frontend muestra de forma provisional "Al menos 8 caracteres, con letras, números y caracteres especiales." hasta que Diseño actualice Figma (§3.8).
- Se añadieron estados **Focus / Error / Disabled / Visible** a los inputs y **Disabled / Loading** al botón.
- El pie legal se movió dentro de AuthFooter en móvil.

### 3.2 Rutas y Flujo

| Ruta | Acceso | Vista |
|---|---|---|
| `/login` | Solo sin sesión (`PublicOnlyRoute`) | `LoginPage` |
| `/register` | Solo sin sesión | `RegisterPage` |
| `/` | Solo con sesión (`ProtectedRoute`) | `HomePage` (módulo Inicio, §4) |

Si un usuario con sesión entra en `/login`, se le redirige a `/`. Sin sesión, `/` redirige a `/login`. Tras iniciar sesión o registrarse, se navega a `/`.

### 3.3 Contrato con el Backend

Referencia: `junkbox-backend/README.md` §API REST (endpoints 2 a 6) e `implementacion.md` §3.5.

| Acción | Endpoint | Request | Respuesta OK | Errores tratados |
|---|---|---|---|---|
| Iniciar sesión | `POST /api/v1/auth/login` | `{ identifier, password }` | `200 AuthResponse` | `400`, `401 "credenciales inválidas"` |
| Registrarse | `POST /api/v1/auth/register` | `{ username, email, password, display_name?, avatar_url? }` | `201 AuthResponse` | `400` (validación), `409` (email/username duplicado) |
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
| — (no existe en Figma) | `avatar_url` (opcional) | No se envía: el formulario no tiene campo de avatar. |

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
| `email` | ≤ 255 y formato válido. El backend usa `net/mail` (acepta dominios sin punto); el formulario es más estricto: exige punto y TLD de 2+ letras (§3.8). | "Introduce un correo electrónico válido." |
| `password` | `validatePassword` (desde el commit `63b6626` del backend), en este orden: ≥ 8 **caracteres** (se cuentan code points, como `utf8.RuneCountInString`); ≤ 72 **bytes** UTF-8 (se miden con `TextEncoder`); al menos una letra (`\p{L}`), un número (`\p{Nd}`) y un carácter especial (`\p{P}` o `\p{S}`, como `unicode.IsPunct`/`IsSymbol`) | "Debe tener al menos 8 caracteres." · "No puede superar 72 bytes. Algunos caracteres ocupan más de un byte." · "Debe incluir letras, números y caracteres especiales." |

Cuando un campo falla, el input pasa al estado **Error** de Figma (borde `brand/accent` + "Revisa el campo"), y el motivo concreto aparece en el hueco de ayuda, enlazado con `aria-describedby`.

### 3.5 Sesión y Tokens

- Tokens (README del backend): access token **JWT de 15 min** y refresh token opaco de **7 días** que **rota** en cada uso. Reutilizar un refresh token revoca toda su familia.
- `sessionStorage.ts` guarda `{ accessToken, refreshToken, accessTokenExpiresAt }` en `localStorage` (clave `junkbox.session`).
- Al abrir la app, `AuthProvider` llama a `authService.restoreSession()`:
  1. `GET /auth/me`.
  2. Si responde 401, `POST /auth/refresh` con el access token anterior y repite `/me`.
  3. Si vuelve a dar 401, borra la sesión.
- Mientras tanto, las guardas no pintan nada (`status: 'checking'`), para evitar parpadeos.
- Las llamadas a endpoints protegidos usan `authService.withAccessToken()`, que renueva el token una sola vez aunque fallen varias peticiones a la vez (§4.4).

### 3.6 Decisiones de Implementación

1. **Errores del servicio (401, 409, red):** Figma todavía no define dónde se muestran ("No se define aquí ciclo de sesión, errores del servicio ni destinos", nota del LoginForm). Se muestran encima del botón con `FormAlert`, que reutiliza el icono `alert-circle` y el estilo del ErrorIndicator. El texto es el del backend (ya en español), con mayúscula inicial; la única excepción es el `401` de login, que muestra «Usuario o contraseña incorrectos.» en lugar de «credenciales inválidas» (el backend devuelve el mismo `401` si el identificador no existe o si la contraseña no coincide, así que el mensaje no revela cuál falló). **Provisional** hasta que diseño defina el estado.
2. **"¿Olvidaste tu contraseña?":** sigue visible por decisión del propietario (nota de Figma), pero no hay endpoint de recuperación. Se muestra con el estilo de Figma, sin acción, y con `aria-disabled`.
3. **Botón "Crear cuenta" deshabilitado hasta aceptar los términos:** se usa el estado **Disabled** de PrimaryButton. Es la forma de exigir la aceptación sin enviarla al backend.
4. **Mientras se envía:** los inputs pasan a `readOnly` (no a Disabled, que en Figma muestra "No disponible") y el botón muestra el estado **Loading** ("Iniciando sesión…" / "Creando cuenta…"). La barra de progreso se anima de forma sutil y respeta `prefers-reduced-motion`.
5. **Términos y Política de Privacidad** (casilla y pie legal) se muestran como texto subrayado sin enlace: aún no existen URLs de esos documentos.
6. **Pie legal:** en móvil sigue a AuthFooter (separación 24 en Login, 16 en Registro). En escritorio baja al fondo de la página (`md:mt-auto`), como en los frames de escritorio de Login.
7. **Barra de estado y HomeIndicator** de los frames móviles simulan el teléfono y no se implementan.
8. **`/` fue una página temporal** (`SessionPlaceholderPage`) hasta el módulo Inicio, que la sustituyó (2026-11-04). El cierre de sesión pasó al menú del avatar (§4.5).

### 3.7 Accesibilidad

- `<label htmlFor>` en todos los campos, `aria-invalid` y `aria-describedby` hacia la ayuda o el error.
- `autocomplete` correcto (`username`, `current-password`, `new-password`, `email`, `name`).
- El botón Mostrar/Ocultar contraseña tiene `aria-pressed` y una etiqueta accesible propia.
- Los errores se anuncian con `role="alert"`. El botón en carga usa `aria-busy`.
- Foco visible (`focus-visible:outline`) en enlaces, botones y casilla.

### 3.8 Limitaciones Conocidas

- **Recuperación de contraseña:** no hay endpoint en el backend.
- **Términos:** la aceptación no se guarda en el servidor (el backend no tiene ese campo).
- **Correo:** el backend acepta dominios sin punto (`usuario@dominio`). El formulario es más estricto, pero la API sigue aceptándolos si se llama directamente.
- **Ayuda de la contraseña:** Figma sigue con el texto de la regla anterior ("De 8 a 72 bytes…"). El frontend muestra uno provisional que describe la regla actual del backend.
- **Tokens en `localStorage`:** quedan expuestos si alguna vez hay un XSS. El backend entrega los tokens en el cuerpo JSON (no usa cookies `httpOnly`).
- **CORS:** el backend solo admite los orígenes de `CORS_ALLOWED_ORIGINS`. Para desplegar en otro dominio, quien mantiene el backend tiene que añadirlo a esa variable. Si no, hay que servir el frontend desde el mismo origen.
- **Estados de error del servicio** (§3.6.1) son provisionales.
- **Tablet:** Figma no lo define. Se usa el layout móvil centrado hasta 768 px.
- **Favicon:** Figma no lo define. Se quitó el de la plantilla de Vite y, por decisión del equipo, se usa el logo de Junkbox (§4.5).

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

## 4. Módulo 2: Inicio

Inicio es una **base que crece con los demás módulos**. Muestra solo lo que tiene contrato de API; las secciones de Figma que dependen de módulos o endpoints que aún no existen (reseñas, red social, reproductor) se añadirán cuando existan. No se muestra contenido de ejemplo.

### 4.1 Pantallas de Figma

| Pantalla | Móvil Claro | Móvil Oscuro | Escritorio Claro | Escritorio Oscuro |
|---|---|---|---|---|
| Inicio | `14244:50321` | `14263:21466` | `14244:50496` | `14263:21659` |

Componentes: `Navbar` (14296:14145), `BottomBar` (14296:15745), `SearchField` (14296:4081), `MusicCard` (14296:3351), `Button` · CreateReview (14296:3602).

| Bloque de Figma | En esta versión |
|---|---|
| Navbar y BottomBar | ✅ Estructura común (`AppLayout`) para todas las pantallas con sesión. |
| Feed introduction (escritorio): "Tu próxima obsesión empieza aquí." | ✅ |
| "Hecho para tus oídos" (`MusicCard`) | ✅ Con una plantilla de canciones (§4.3). |
| Tabs "Para ti (Popular)" / "Siguiendo" y `ReviewCard` | ❌ No hay reseñas en el backend. |
| "Conecta por lo que suena" (escritorio) | ❌ No hay sugerencias de usuarios. |
| `MiniPlayer` y `SnippetPlayer` | ❌ No hay audio. |

### 4.2 Rutas y Estructura

| Ruta | Acceso | Vista |
|---|---|---|
| `/` | Solo con sesión (`ProtectedRoute` → `AppLayout`) | `HomePage` |

`AppLayout` (`src/app/layout/`) envuelve todas las rutas con sesión: `Navbar` arriba, el contenido del módulo en `<Outlet />` y, en móvil, `BottomBar` abajo. Los destinos de la navegación están en `app/layout/navigation.ts`: los que todavía no existen (Buscador, Crear Reseña, Perfil) tienen `to: null` y se muestran con el estilo de Figma, sin acción y con `aria-disabled`, como "¿Olvidaste tu contraseña?". Al implementar cada módulo basta con poner su ruta ahí.

### 4.3 Contrato con el Backend

| Acción | Endpoint | Respuesta OK | Errores tratados |
|---|---|---|---|
| Canciones de "Hecho para tus oídos" | `GET /api/v1/music/tracks/{id}` (Bearer), una por canción y en paralelo | `200 TrackDetail` | `404` → se omite la canción · `401` → se renueva la sesión; si no se puede, se cierra · red/`500` → estado de error si no cargó ninguna |
| Avatar de la Navbar | `GET /api/v1/auth/me` (ya lo hace `AuthProvider`) | `avatar_url` | `null` o imagen que no carga → placeholder |

**Plantilla:** no hay endpoint de recomendaciones. `features/home/data/homeTemplate.ts` lista 8 **IDs de Spotify** del dataset, verificados en el catálogo y aprobados por el propietario, iguales para todos los usuarios. Se guardan los IDs de Spotify porque son estables; los IDs locales dependen del orden de carga del dataset. La vista recibe una lista de `RecommendedTrack` y no sabe de dónde salen: cuando exista el endpoint solo cambia `homeService.getRecommendations()`.

**Por qué no `/music/search`:** en cache-miss consulta Spotify y escribe en la base de datos (backend `implementacion.md` §4.1). `GET /music/tracks/{id}` solo lee el catálogo local.

### 4.4 Sesión: renovación del access token

Inicio es el primer módulo que llama a endpoints protegidos después de abrir la app, así que se completó la renovación que §3.8 dejaba pendiente:

- `authService.withAccessToken(call)` ejecuta la llamada con el token guardado. Ante un `401`, renueva la sesión y repite la llamada una vez.
- La renovación es **única y compartida** (`refreshSession`): si varias peticiones reciben `401` a la vez (Inicio lanza 8 en paralelo), todas esperan al mismo `POST /auth/refresh`. Reutilizar un refresh token revoca toda su familia en el backend.
- Si la renovación también da `401`, se borra la sesión y el controlador llama a `logout()`; las guardas llevan a `/login`.
- `restoreSession()` usa la misma renovación.

### 4.5 Decisiones de Implementación

1. **Sin imagen:** las canciones del dataset no tienen carátula. `MusicCard` muestra un recuadro neutro (`surface-input-disabled`) con la geometría de Figma. El avatar sin imagen, o que no carga, es un círculo neutro. Figma no define placeholders; lo aprobó el propietario.
2. **Escritorio muestra 4 tarjetas** (la cuadrícula 2×2 de Figma); en móvil el carrusel horizontal muestra las 8.
3. **Títulos largos:** se recortan con puntos suspensivos y el texto completo queda en `title`. Figma no define el desbordamiento.
4. **QuickPlay y "Ver todo"** se muestran pero no tienen acción: no hay audio ni pantalla de recomendaciones.
5. **Estados de carga, vacío y error** (Figma no los define): tarjetas grises con la geometría de `MusicCard` y `motion-safe:animate-pulse`; "Todavía no hay recomendaciones."; `FormAlert` con el mensaje y "Reintentar".
6. **Cerrar sesión (provisional):** Figma no lo ubica en Inicio. Se abre un menú al pulsar el avatar (`AccountMenu`), con tokens existentes, hasta que exista el módulo de Configuración. Aprobado por el propietario.
7. **Navbar entre 768 y 1280 px:** Figma solo define 1440. Se reducen márgenes (32) y separaciones (24) y el buscador se encoge; desde 1280 px (`xl`) se usan las medidas de Figma.
8. **Home indicator, StatusBar y MiniPlayer** no se implementan: los dos primeros simulan el teléfono (como en Auth) y el tercero necesita audio. La BottomBar respeta el área segura inferior.
9. **Favicon:** el logo de Junkbox, con los dos SVG originales (letras oscuras para pestañas en tema claro y claras en tema oscuro).
10. **El logo de la Navbar** es el mismo arte que el de AuthShell (mismos trazados y colores), exportado a 128 y 160 px de ancho: se reutilizan los mismos archivos con otro tamaño.

### 4.6 Accesibilidad

- Un solo `<h1>` ("Tu próxima obsesión empieza aquí."), visible en escritorio y solo para lectores de pantalla en móvil. La sección usa `<h2>` y cada tarjeta `<h3>`.
- Navegación con `<nav aria-label="Principal">` (Navbar en escritorio y BottomBar en móvil; solo una es visible a la vez). La ruta activa lleva `aria-current="page"`.
- Destinos pendientes con `aria-disabled`; el campo de búsqueda tiene nombre accesible ("Buscar música").
- `AccountMenu`: `aria-haspopup="menu"`, `aria-expanded`, foco en "Cerrar sesión" al abrir, y cierre con Escape (devuelve el foco al avatar) o pulsando fuera.
- Carga con `aria-busy` y texto para lectores de pantalla; errores con `role="alert"`.
- QuickPlay y los placeholders son decorativos (`aria-hidden`). Foco visible en todos los controles.

### 4.7 Limitaciones Conocidas

- **Recomendaciones:** no hay endpoint. Se usa una plantilla igual para todos los usuarios.
- **Carátulas:** el backend no expone imagen por canción. Se muestra el placeholder.
- **Una petición por canción:** no hay endpoint para pedir varias canciones a la vez (8 peticiones al cargar Inicio).
- **Reseñas, sugerencias de usuarios y reproducción:** no hay backend, así que esas secciones de Figma no se muestran y QuickPlay no reproduce.
- **Buscador, Crear Reseña, Perfil y "Ver todo"** no tienen destino todavía.
- **Cerrar sesión** está en un menú provisional que no sale de Figma.
- **Tablet:** Figma no lo define. Entre 768 y 1280 px la Navbar se adapta (§4.5.7).

### 4.8 Verificación del Módulo (2026-11-04)

| Prueba | Resultado |
|---|---|
| `pnpm typecheck` | ✅ Sin errores |
| `pnpm lint` | ✅ Sin avisos |
| `pnpm build` | ✅ Build correcto (JS ≈ 110 kB gzip) |
| Las 8 canciones de la plantilla con `GET /music/tracks/{id}` | ✅ 200 |
| Capturas headless (Edge) con sesión, Claro/Oscuro, 390, 900 y 1440 px | ✅ Coinciden con los frames de Figma |
| Menú de cuenta: abre con "Cerrar sesión" y le pasa el foco | ✅ |
| Consola del navegador | ✅ Sin errores ni avisos |

En desarrollo se ven 16 peticiones a `/music/tracks`: `StrictMode` monta el efecto dos veces y la primera tanda se cancela. En producción son 8.

---

## 5. Verificación

Antes de cerrar cualquier módulo:

```bash
pnpm typecheck
pnpm lint
pnpm build
```

Además: probar las rutas del módulo con el backend en marcha (`pnpm dev`), revisar móvil y escritorio en los dos temas, y comparar con los frames de Figma.

> Aún no hay framework de tests unitarios. Se añadirá cuando un módulo tenga lógica que lo justifique.

---

## 6. Historial

| Fecha | Cambio |
|---|---|
| 2026-11-02 | Creación del proyecto (Vite + React + TS + Tailwind v4, pnpm). Fundamentos (tokens, tema, cliente HTTP, proxy). Módulo 1: Autenticación. |
| 2026-11-02 | Login: el `401` muestra «Usuario o contraseña incorrectos.» en lugar del «credenciales inválidas» del backend. |
| 2026-11-03 | Registro: la validación de la contraseña replica la nueva regla del backend (`validatePassword`: ≥ 8 caracteres, ≤ 72 bytes, letras + números + especiales). Texto de ayuda provisional hasta que Figma se actualice. |
| 2026-11-03 | El backend ya tiene CORS: se documenta (§2.5, §3.8, README, `.env.example`). El proxy de Vite sigue siendo el modo por defecto; no cambia el comportamiento. |
| 2026-11-04 | Módulo 2: Inicio (§4). Estructura común (`AppLayout`, Navbar, BottomBar), "Hecho para tus oídos" con plantilla, menú de cuenta provisional, favicon y renovación compartida del access token. Tokens `surface-nav`, `surface-quickplay` y `text-caption-2xs`. Se elimina `SessionPlaceholderPage`. |
