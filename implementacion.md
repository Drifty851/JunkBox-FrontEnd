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
- [5. Módulo 3: Cuenta (menú, avatar y documentos legales)](#5-módulo-3-cuenta-menú-avatar-y-documentos-legales)
- [6. Módulo 4: Buscador](#6-módulo-4-buscador)
- [7. Módulo 5: Fichas del catálogo (Canción, Álbum, Artista)](#7-módulo-5-fichas-del-catálogo-canción-álbum-artista)
- [8. Módulo 6: Calificaciones y Reseñas](#8-módulo-6-calificaciones-y-reseñas)
- [9. Módulo 7: Landing (usuarios sin sesión)](#9-módulo-7-landing-usuarios-sin-sesión)
- [10. Módulo 8: Configuración](#10-módulo-8-configuración)
- [11. Módulo 9: Spotify y Reproductor](#11-módulo-9-spotify-y-reproductor)
- [12. Módulo 10: Perfil](#12-módulo-10-perfil)
- [13. Verificación](#13-verificación)
- [14. Historial](#14-historial)

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
| React Router (`react-router`) | 8.x | Rutas de cada módulo y guardas de sesión. |
| oxlint | 1.x | Linter que incluye la plantilla de Vite. |
| pnpm | 11.x | Gestor de paquetes del proyecto. |

**No se añadieron** librerías de formularios, de peticiones (axios) ni de estado global: con `fetch`, `useState`, un contexto y el hook `useLoad` (§7.4) basta para todos los módulos.

### 2.2 Arquitectura MVC por Capas

Cada módulo vive en `src/features/<módulo>/` con estas capas:

| Capa | Carpeta | Responsabilidad | Auth | Inicio |
|---|---|---|---|---|
| Modelo | `models/` | Tipos del contrato de API y validación de cliente. | `auth.types.ts`, `auth.validation.ts`, `emailLink.ts` | `home.types.ts` |
| Infraestructura | `infrastructure/` | Adaptadores HTTP y de almacenamiento. | `authApi.ts`, `sessionStorage.ts` | — (usa `music/`) |
| Servicios | `services/` | Casos de uso; coordinan infraestructura. | `authService.ts`, `errorMessages.ts` | `homeService.ts` |
| Controlador | `controllers/` | Estado de la vista, carga y errores; llama a servicios. | `AuthProvider.tsx`, `authContext.ts`, `useLoginController.ts`, `useRegisterController.ts`, `useForgotPasswordController.ts`, `useResetPasswordController.ts`, `useVerifyEmailController.ts`, `useEmailLinkToken.ts` | `useHomeController.ts` |
| Vista | `views/` | Componentes React sin lógica de negocio. | `LoginPage.tsx`, `RegisterPage.tsx`, `ForgotPasswordPage.tsx`, `ResetPasswordPage.tsx`, `VerifyEmailPage.tsx`, `AuthLayout.tsx`, `AuthSwitchLink.tsx`, `passwordHelper.ts` | `HomePage.tsx`, `RecommendationsSection.tsx` |

Inicio añade además `data/homeTemplate.ts` (la plantilla provisional de canciones y sus álbumes, §4.3).

Módulos posteriores (misma estructura de capas; solo las que necesitan):

| Módulo | Carpeta | Contenido |
|---|---|---|
| Catálogo compartido | `features/music/` | `models/catalog.types.ts` (Track, Album, Artist, búsqueda, `ratings`), `infrastructure/musicApi.ts` (`getTrack`, `getAlbum`, `getArtist`, `search`), `services/catalogService.ts` (cascada, §7.3). Lo usan Inicio, Buscador, Fichas y Reseñas. |
| Cuenta / legales | `features/legal/` | `models/` (rutas y tipos), `data/` (textos), `views/` (`LegalPage`, `TermsPage`, `PrivacyPage`). §5. |
| Buscador | `features/search/` | `models/search.types.ts`, `services/searchService.ts`, `controllers/` (`useSearchController`, `useSearchSuggestions`), `views/` (`SearchPage`, `SearchHeader`, `SearchResultsView`, `NavbarSearch`). §6. |
| Fichas | `features/catalog/` | `models/catalogPaths.ts`, `controllers/` (`useLoad`, `catalogLoaders`), `views/` (`SongPage`, `AlbumPage`, `ArtistPage`, `DetailParts`, `ReviewsSection`). §7. |
| Landing | `features/landing/` | `data/landingCovers.ts` (80 portadas fijas y el easter egg), `views/` (`LandingPage`, `CoverWall` con `MobileCoverWall`). §9. |
| Calificaciones y Reseñas | `features/reviews/` | `models/` (`review.types.ts`, `writeReview.ts`), `infrastructure/reviewsApi.ts`, `services/reviewsService.ts`, `controllers/useWriteReviewController.ts`, `views/WriteReviewPage.tsx`. §8. |

Lo reutilizable entre módulos vive en `src/shared/` (`api/`, `ui/`, `layout/`, `utils/`). La composición global (proveedores, router, guardas y `AppLayout`) está en `src/app/`.

### 2.3 Tokens de Diseño y Temas

`src/index.css` define cada color como variable CSS `--jb-*` con su **variable de Figma de origen** y la expone a Tailwind con `@theme inline`, de modo que una clase como `bg-surface-input` cambia sola con el tema.

| Token Tailwind | Variable Figma | Claro | Oscuro |
|---|---|---|---|
| `bg` | `--color-bg` / `background/canvas` | `#ffffff` | `#121212` |
| `fg` | `text/primary` | `#000000` | `#f7f7f2` |
| `fg-muted` | `text/secondary` | `#5c5c5c` | `#b3b3b3` |
| `fg-placeholder` | `text/secondary-2` | `#828282` | `#b3b3b3` |
| `fg-soft` | `text/secondary-3` (subtítulos de MusicRow, Segment inactivo) | `#5c5c5c` | `#cdcdcd` |
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
| `Heading/24/Bold/140pct` (Buscador y fichas en móvil) | `text-2xl font-bold leading-[1.4]` |
| `Heading/36/Bold/140pct` ("La comunidad opina") | `text-4xl font-bold leading-[1.4]` |
| `Heading/56/Bold/140pct` (MusicHero en escritorio) | `text-[56px] font-bold leading-[1.4]` |
| `Title/22/Bold/140pct` (ReviewCard en escritorio) | `text-[22px] font-bold leading-[1.4]` |

Otras variables de Figma de las pantallas nuevas se resolvieron con tokens existentes: `surface/default-3` y `action/background-3` → `surface-input-disabled`; `surface/default-4` y `brand/accent-2` (Segment activo, Button) → `action`; `surface/default-5` (ReviewCard) → `surface-quickplay`.

**Espaciado y radios:** las variables `space/4…80` y `radius/4, 8` coinciden con la escala de Tailwind (`gap-1`=4, `gap-4`=16, `px-6`=24, `rounded`=4, `rounded-lg`=8), así que no se usan valores arbitrarios para ellas.

**Animaciones:** `@theme` expone `animate-marquee-x` y `animate-marquee-y` (`@keyframes jb-marquee-x/y`: de `translate 0` a `-50%`, en bucle lineal) para los carruseles de la landing (§9). La duración y el sentido se fijan en cada pista.

**Tema activo:** se sigue `prefers-color-scheme` y se puede forzar con `<html data-theme="light|dark">`. El variante `dark:` de Tailwind se redefine con `@custom-variant` para respetar ambas cosas.

**Botón de tema (2026-11-13, no está en Figma, aprobado por el propietario):** `ThemeToggle` alterna entre claro y oscuro. Muestra la luna en claro y el sol en oscuro (iconos `sun.svg` y `moon.svg` de Lucide, licencia ISC, 20 px).
- **Lógica** (`shared/utils/theme.ts`): `setTheme` pone `data-theme` y `color-scheme` en `<html>` y guarda la elección en `localStorage` (`junkbox.theme`). `getTheme` y `subscribeTheme` alimentan `useSyncExternalStore`.
- **Sin elección:** se sigue el tema del sistema, y el icono se actualiza si el sistema cambia.
- **Arranque:** un script mínimo en `index.html` aplica la elección guardada antes de pintar, para que no parpadee.
- **Dónde está:** en la Navbar, a la derecha del avatar (todas las pantallas con sesión), y arriba a la derecha en Iniciar sesión y Registrarse (`AuthLayout` · `showThemeToggle`). La landing no lo lleva (decisión del propietario), aunque respeta la elección guardada.
- **Móvil:** el botón mide 28 px, como el avatar, y va pegado a él; así "Buscar música" cabe entero a 390 px.

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
| `icons/play-circle.svg` | `MusicRow › play-circle` | 28 px (filas); 24 px en AudioSnippetPicker. |
| `icons/x-16.svg` | `SearchField › x` | 16 px, borrar búsqueda. |
| `icons/star-rating.svg` | `StarRating` (Rating-04, 96×16) | Máscara de 5 estrellas; también a 76×12 y 106×18. |
| `icons/star-rating-32.svg` | `StarRating` (Rating-08, 176×32) | Estrellas editables de Escribir Reseña. |
| `icons/arrow-left-16.svg` | `Breadcrumb › arrow-left` | 16 px. |
| `icons/share-2.svg` | `MusicActions › share-2` | 20 px. |
| `icons/more-horizontal.svg` · `like.svg` · `message-square.svg` · `bookmark.svg` | `ReviewCard` | 20 y 18 px. |
| `icons/circle-check.svg` | `SelectedMusicPreview › circle-check` | 20 px. |
| `brand/spotify-logo.png` | `SpotifyButton › Spotify logo` | 20 px, a color (no es máscara). |

Los iconos de un solo color (`eye`, `lock`, los de navegación, QuickPlay, filas, fichas y reseñas) vienen con el color del tema claro fijado en el archivo. Para respetar el tema oscuro sin modificarlos, `MaskIcon` los usa como **máscara CSS** y los pinta con el token correspondiente. El logo tiene dos archivos y se alterna con `dark:hidden` / `dark:block`.

### 2.5 Cliente HTTP y Proxy de Desarrollo

`src/shared/api/httpClient.ts` envuelve `fetch`:

- Base `VITE_API_BASE_URL` (por defecto `/api/v1`).
- Envía y recibe JSON con `GET`, `POST`, `PUT` y `DELETE` (los dos últimos, desde Calificaciones y Reseñas). Añade `Authorization: Bearer` si se le pasa un token.
- Errores: el backend siempre responde `{"error": "..."}` (README del backend, "Formato Estándar de Errores"). Se convierten en `ApiError(status, message)`. Los fallos de red se convierten en `NetworkError`.

`vite.config.ts` redirige `/api` → `VITE_BACKEND_URL` (`http://localhost:8080`). Es la opción por defecto porque funciona en cualquier puerto de Vite. Si el backend corre en Kubernetes (kind + Envoy Gateway, commit `2d05563`), la API está en el puerto 80: `VITE_BACKEND_URL=http://localhost` (ver `.env.example`). Cada respuesta trae entonces la cabecera `X-Instance` con la réplica que atendió; el frontend no la usa.

**CORS del backend** (desde el commit `bab8e12`): `go-chi/cors` con los orígenes de `CORS_ALLOWED_ORIGINS` (por defecto `http://localhost:5173`), métodos `GET`/`POST`/`PUT`/`DELETE`/`OPTIONS` (desde el commit `6d77d4d`), cabeceras `Authorization` y `Content-Type`, sin credenciales. Con `VITE_API_BASE_URL=http://localhost:8080/api/v1` el navegador llama al backend directamente, sin proxy. El cliente HTTP no cambia: no usa cookies (`credentials` queda por defecto) y solo envía esas dos cabeceras más `Accept`, que no necesita permiso de CORS.

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
| `Avatar` | Slot `Avatar1` de Navbar | Imagen → respaldo (`fallbackSrc`, el robot por defecto, §5) → círculo neutro si nada carga. |
| `MusicCard` | `MusicCard` (14296:3351) | Móvil 112 / escritorio 164; QuickPlay decorativo; carátula o recuadro neutro. Con `to`, toda la tarjeta enlaza a la ficha. |
| `MusicRow` | `MusicRow` (14296:8113) | Fila de 64: artwork 48 (cuadrado o círculo), título, subtítulo, calificación opcional y acción. Con `to`, enlace que cubre la fila (la acción sigue siendo independiente, con `z-[1]`: encima del enlace y por debajo de la Navbar fija, `z-10`). |
| `SecondaryButton` | `Button` (14296:3647, Button-15/16) | Alto 44, borde `line`, fondo `surface-quickplay`; `aria-disabled` para destinos pendientes. |
| `StarRating` | `StarRating` (14296:5021) | Tamaños `sm` 76×12, `md` 96×16 y `lg` 106×18. Pinta el **promedio real**: el recurso de Figma como máscara, vacío en `line` y relleno en `fg` recortado al porcentaje. |
| `StarRatingInput` | `StarRating` Rating-08 (176×32) | Editable de 0,5 en 0,5 (rol `slider`). §8.4. |
| `ReviewCard` | `ReviewCard` (14296:11962) | Escritorio con borde y padding 20; móvil sin borde. Solo Me gusta y Comentarios (Guardar y "más opciones" se quitaron el 2026-11-15); Seguir y Me gusta con `aria-disabled` (FOL-01, LIKE-01); "Comentarios" abre la Reseña Completa (§8.8). |
| `PlayButton` | `MusicRow › play-circle` | 28 px; sin `onPlay` queda `aria-disabled` (el reproductor está pendiente). |
| `Navbar` (`shared/layout`) | `Navbar` (14296:14145) | Móvil 52 / escritorio 80; enlace activo con `aria-current`. |
| `BottomBar` (`shared/layout`) | `BottomBar` (14296:15745) | Solo móvil; ítem activo con el color `link`. |
| `NavTarget` (`shared/layout`) | — | Enlace (`NavLink`) o botón con `aria-disabled` si el destino no existe. |
| `AccountMenu` (`shared/layout`) | — (propuesta aprobada) | Tarjeta al pasar el ratón y menú con "Configuración" y "Cerrar sesión". Ver §5. |
| `ThemeToggle` | — (aprobado 2026-11-13) | Sol/luna: alterna claro y oscuro y lo recuerda. 28 px en móvil, 36 en escritorio. Ver §2.3. |
| `Navbar` · `search` | `Navbar › SearchField` | La Navbar recibe el campo de búsqueda como `ReactNode`: lo aporta el Buscador (`NavbarSearch`, §6.4). |

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
- La ayuda de la contraseña ahora dice **"De 8 a 72 bytes. Algunos caracteres ocupan más de un byte."**. Desde el 2026-11-03 el backend endureció la regla (§3.4); el frontend y Figma (`RegisterForm`, actualizado el 2026-11-11) dicen "Al menos 8 caracteres, con letras, números y caracteres especiales."
- Se añadieron estados **Focus / Error / Disabled / Visible** a los inputs y **Disabled / Loading** al botón.
- El pie legal se movió dentro de AuthFooter en móvil.

### 3.2 Rutas y Flujo

| Ruta | Acceso | Vista |
|---|---|---|
| `/login` | Solo sin sesión (`PublicOnlyRoute`) | `LoginPage` |
| `/register` | Solo sin sesión | `RegisterPage` |
| `/recuperar-contrasena` | Solo sin sesión | `ForgotPasswordPage` (§3.10) |
| `/restablecer-contrasena#token=…` | Con o sin sesión (sin guarda) | `ResetPasswordPage` (§3.10) |
| `/verificar-correo#token=…` | Con o sin sesión (sin guarda) | `VerifyEmailPage` (§3.10) |
| `/` | Sin sesión: landing (§9) · con sesión: Inicio (`HomeRoute`) | `LandingPage` / `HomePage` (§4) |

Si un usuario con sesión entra en `/login`, se le redirige a `/`. Sin sesión, `/` muestra la landing y las rutas protegidas redirigen a ella (desde 2026-11-11; antes iban a `/login`). Tras iniciar sesión o registrarse, se navega a `/`.

### 3.3 Contrato con el Backend

Referencia: `junkbox-backend/README.md` §API REST (endpoints 2 a 6) e `implementacion.md` §3.5.

| Acción | Endpoint | Request | Respuesta OK | Errores tratados |
|---|---|---|---|---|
| Iniciar sesión | `POST /api/v1/auth/login` | `{ identifier, password }` | `200 AuthResponse` | `400`, `401 "credenciales inválidas"` |
| Registrarse | `POST /api/v1/auth/register` | `{ username, email, password, display_name?, avatar_url? }` | `201 AuthResponse` | `400` (validación), `409` (email/username duplicado) |
| Recuperar sesión | `GET /api/v1/auth/me` | Bearer | `200 UserProfile` | `401` → intenta refresh |
| Renovar tokens | `POST /api/v1/auth/refresh` | `{ refresh_token }` + Bearer **anterior** | `200 TokenPair` | `401` → borra la sesión |
| Cerrar sesión | `POST /api/v1/auth/logout` | `{ refresh_token }` + Bearer | `200 { message }` | Se ignoran (el cierre local basta) |
| Pedir enlace de recuperación | `POST /api/v1/auth/password/forgot` | `{ email }` | Siempre `200 { message }` (no revela si el correo existe) | `400 "email es requerido"` |
| Restablecer contraseña | `POST /api/v1/auth/password/reset` | `{ token, password }` | `200 { message }`; **cierra todas las sesiones** del usuario | `400` (contraseña no válida; el token sigue valiendo) · `401 "token inválido o expirado"` |
| Verificar correo | `POST /api/v1/auth/email/verify` | `{ token }` | `200 { message: "Correo verificado." }` | `400 "token es requerido"` · `401 "token inválido o expirado"` |

`UserProfile` incluye `email_verified` (booleano) desde el commit `51ec315` del backend. Los usuarios seed ya están verificados.

**Correspondencia entre formulario y API (registro):**

| Campo de Figma | Campo de API | Normalización (igual que el backend) |
|---|---|---|
| Nombre público | `display_name` (opcional) | `trim`. Si está vacío, **no se envía**. |
| Nombre de usuario | `username` | `trim` + minúsculas. |
| Correo electrónico | `email` | `trim` + minúsculas. |
| Contraseña | `password` | Sin cambios. |
| Acepto los términos… | `terms_accepted` (obligatorio desde el 2026-11-12) | Se envía el valor de la casilla; el backend guarda fecha y versión. |
| — (no existe en Figma) | `avatar_url` (opcional) | Se envía el robot por defecto (§5.2). |

El backend rechaza campos desconocidos (`DisallowUnknownFields` → `400 "solicitud inválida"`). Hasta el 2026-11-12 eso impedía enviar la aceptación de términos; desde el commit `560b33f` el campo existe y es obligatorio (AUTH-03).

**Login:** El backend acepta email o username en `identifier`. Por decisión del propietario (2026-11-11) el campo dice **"Correo o nombre de usuario"**, con placeholder "correo@dominio.com o tu_usuario", `type="text"` (sin teclado de correo en móvil) y sin autocorrección ni mayúscula inicial. Figma ya lo refleja (`LoginForm`, 2026-11-11).

### 3.4 Validación en el Cliente

`auth.validation.ts` **replica** las reglas existentes del backend (`auth_service.go · validateRegister`, `handlers_auth.go`). No añade reglas nuevas; solo adelanta errores que el servidor devolvería con `400`:

| Campo | Regla (backend) | Mensaje bajo el campo |
|---|---|---|
| Login: identificador | Obligatorio (correo o username) | "Introduce tu correo o tu nombre de usuario." |
| Login: contraseña | Obligatoria | "Introduce tu contraseña." |
| Recuperar: correo | `trim` + minúsculas y el mismo formato que en Registro | "Introduce un correo electrónico válido." |
| Restablecer: nueva contraseña | La misma `validatePassword` que Registro (fila `password`) | Los mismos mensajes que Registro |
| Restablecer: confirmar contraseña | Solo en el cliente: obligatoria e igual a la nueva | "Repite la nueva contraseña." · "Las contraseñas no coinciden." |
| `display_name` | ≤ 100 caracteres | "No puede superar 100 caracteres." |
| `username` | `^[a-z0-9_.]{3,50}$` | "De 3 a 50 caracteres: letras, números, '_' o '.'." |
| `email` | ≤ 255 y formato válido: dominio con punto y TLD de 2+ letras. Es la misma regla que aplica el backend desde el 2026-11-12 (AUTH-06, commit `4855a38`). | "Introduce un correo electrónico válido." |
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
2. **"¿Olvidaste tu contraseña?":** desde 2026-11-06 es un enlace a `/recuperar-contrasena` (§3.10), con el estilo de PasswordRecovery de Figma. Antes, sin endpoint, se mostraba sin acción y con `aria-disabled`.
3. **Botón "Crear cuenta" deshabilitado hasta aceptar los términos:** se usa el estado **Disabled** de PrimaryButton. Además, el backend valida `terms_accepted` y responde `400` si llega `false`.
4. **Mientras se envía:** los inputs pasan a `readOnly` (no a Disabled, que en Figma muestra "No disponible") y el botón muestra el estado **Loading** ("Iniciando sesión…" / "Creando cuenta…"). La barra de progreso se anima de forma sutil y respeta `prefers-reduced-motion`.
5. **Términos y Política de Privacidad** (casilla y pie legal) enlazan a `/terminos` y `/privacidad` en otra pestaña, para no perder lo escrito (§5). La casilla **solo cambia al pulsar el cuadro**: el texto no es un `<label>` y el nombre accesible llega con `aria-labelledby` (decisión del propietario, 2026-11-06).
6. **Pie legal:** en móvil sigue a AuthFooter (separación 24 en Login, 16 en Registro). En escritorio baja al fondo de la página (`md:mt-auto`), como en los frames de escritorio de Login.
7. **Barra de estado y HomeIndicator** de los frames móviles simulan el teléfono y no se implementan.
8. **`/` fue una página temporal** (`SessionPlaceholderPage`) hasta el módulo Inicio, que la sustituyó (2026-11-04). El cierre de sesión pasó al menú del avatar (§5).
9. **Avatar por defecto:** el registro envía `avatar_url` con el robot de DiceBear (`bottts`, semilla = username), el mismo estilo que los usuarios seed. El backend no asigna ninguno (USER-03). Ver §5.

### 3.7 Accesibilidad

- `<label htmlFor>` en todos los campos, `aria-invalid` y `aria-describedby` hacia la ayuda o el error.
- `autocomplete` correcto (`username`, `current-password`, `new-password`, `email`, `name`).
- El botón Mostrar/Ocultar contraseña tiene `aria-pressed` y una etiqueta accesible propia.
- Los errores se anuncian con `role="alert"`. El botón en carga usa `aria-busy`.
- Foco visible (`focus-visible:outline`) en enlaces, botones y casilla.

### 3.8 Limitaciones Conocidas

- **Términos:** el backend ya exige `terms_accepted: true` y guarda fecha y versión (AUTH-03, resuelta el 2026-11-12, commit `560b33f`). El registro envía `terms_accepted` con el valor de la casilla (2026-11-12). Los textos de `/terminos` y `/privacidad` son una propuesta pendiente de revisión legal (§5).
- **Correo:** el backend acepta dominios sin punto (`usuario@dominio`). El formulario es más estricto, pero la API sigue aceptándolos si se llama directamente.
- **Ayuda de la contraseña:** Figma sigue con el texto de la regla anterior ("De 8 a 72 bytes…"). El frontend muestra uno provisional que describe la regla actual del backend.
- **Tokens en `localStorage`:** quedan expuestos si alguna vez hay un XSS. El backend entrega los tokens en el cuerpo JSON (no usa cookies `httpOnly`).
- **CORS:** el backend solo admite los orígenes de `CORS_ALLOWED_ORIGINS`. Para desplegar en otro dominio, quien mantiene el backend tiene que añadirlo a esa variable. Si no, hay que servir el frontend desde el mismo origen.
- **Estados de error del servicio** (§3.6.1) son provisionales.
- **Tablet:** Figma no lo define. Se usa el layout móvil centrado hasta 768 px.
- **Favicon:** Figma no lo define. Se quitó el de la plantilla de Vite y, por decisión del equipo, se usa el logo de Junkbox (§4.5).
- **Recuperación y verificación en Figma (2026-11-11):** las pantallas de §3.10 (boceto aprobado por el propietario) ya están en la página Interfaces, construidas con `FormField` y `PrimaryButton`: Recuperar contraseña (y=13357), Correo enviado (14417), Restablecer contraseña (15477), Enlace inválido (16537), Contraseña actualizada (17597), Verificar correo · Verificado (18657) y · Enlace inválido (19717), cada una en móvil/escritorio y claro/oscuro.
- **Correo sin verificar:** la app todavía no avisa de `email_verified = false` ni ofrece reenviar el enlace (`POST /auth/email/verify/resend`, con Bearer). Espera a que Diseño lo defina.

### 3.9 Verificación del Módulo (2026-11-02)

| Prueba | Resultado |
|---|---|
| `pnpm typecheck` | Sin errores |
| `pnpm lint` | Sin avisos |
| `pnpm build` | Build correcto (JS ≈ 105 kB gzip) |
| Proxy `/api` → backend en WSL (`/healthz`) | 200 |
| Login con credenciales incorrectas | `401 {"error":"credenciales inválidas"}` |
| Login con usuario seed (`cesar@junkbox.local`) + `GET /auth/me` | 200 con `UserProfile` |
| Enviar un campo desconocido al registro | `400 "solicitud inválida"` (verificación de 2026-11-02; desde el 2026-11-12 `terms_accepted` es un campo válido) |
| Capturas headless (Edge) Claro/Oscuro, ~500 px y 1440 px | Coinciden con los frames de Figma |

No se ejecutó un registro real para no crear usuarios de prueba en la base de datos del backend.

### 3.10 Recuperación de Contraseña y Verificación de Correo (2026-11-06)

Se apoya en el commit `51ec315` del backend, que añadió los endpoints de §3.3 y el envío de correos.

**Pantallas.** Figma no tiene pantallas de recuperación ni de verificación. Son un **boceto aprobado por el propietario** que reutiliza AuthShell (`AuthLayout`), `FormField`, `TextInput`, `PasswordInput`, `PrimaryButton`, `FormAlert` y `AuthSwitchLink`, sin elementos visuales nuevos. `AuthLayout` acepta ahora una descripción de una sola línea y un pie opcional.

| Pantalla | Estados |
|---|---|
| Recuperar contraseña (`/recuperar-contrasena`) | **Formulario:** correo + "Enviar enlace". **Enviado:** "Revisa tu correo" con el mensaje del backend, "El enlace caduca en 30 minutos.", "Volver a iniciar sesión" y "¿No te llegó? Reenviar enlace" (anuncia "Te enviamos otro enlace." con `aria-live`). |
| Restablecer contraseña (`/restablecer-contrasena`) | **Formulario:** "Nueva contraseña" (con la ayuda de Registro) + "Confirmar contraseña" (a petición del propietario) + "Guardar contraseña". **Hecho:** "Contraseña actualizada" + "Iniciar sesión". **Enlace inválido** (sin token o `401`): "Este enlace ya no sirve" + "Pedir un enlace nuevo". |
| Verificar correo (`/verificar-correo`) | **Verificando** (botón en Loading) → **Verificado** ("Correo verificado" + "Ir a Junkbox") · **Inválido** ("No pudimos verificar tu correo") · **Error de red o servidor** (con "Reintentar"). "Ir a Junkbox" lleva a `/` con sesión y a `/login` sin ella. |

**Enlaces de los correos.** El backend envía `{FRONTEND_URL}/restablecer-contrasena#token=…` (caduca en 30 min) y `{FRONTEND_URL}/verificar-correo#token=…` (24 h). Por eso `pnpm dev` tiene que servir en el puerto de `FRONTEND_URL` (`5173` en desarrollo). En desarrollo los correos llegan a **Mailpit** (`http://localhost:8025`).

**Decisiones:**

1. **El token va en el fragmento (`#`)**, que el navegador no envía a ningún servidor. `useEmailLinkToken` lo lee una sola vez al montar la página y lo quita de la URL con `navigate(…, { replace: true })`, para que no quede en el historial ni a la vista.
2. **Restablecer y verificar no tienen guarda.** El enlace puede abrirse con o sin sesión, y `PublicOnlyRoute` redirigiría a `/` perdiendo el token. Recuperar sí va en `PublicOnlyRoute`, como Login.
3. **Tras restablecer se cierra la sesión local** (`authService.resetPassword` borra `junkbox.session` y el controlador llama a `logout()`), porque el backend revoca todas las sesiones del usuario. Las demás pestañas acaban en `/login` en su siguiente renovación de token.
4. **Errores de restablecer:** `401` → estado "enlace inválido"; `400` → mensaje bajo "Nueva contraseña" (el token no se consume, así que se puede reintentar); red u otros → `FormAlert`.
5. **Verificar se llama una sola vez por intento.** Una `ref` evita la doble llamada del doble efecto de `StrictMode`. Hace falta porque el token es de un solo uso: la segunda llamada devolvería `401` y taparía el éxito.
6. **"Reenviar enlace"** repite `POST /auth/password/forgot` con el mismo correo. El backend siempre responde `200`, así que la pantalla no revela si la cuenta existe.
7. El texto de ayuda de la contraseña (`views/passwordHelper.ts`) lo comparten Registro y Restablecer.

**Verificación (2026-11-06)**, con backend y Mailpit en marcha, por la UI en Edge headless y con el usuario seed `cesar@junkbox.local` (su contraseña se restableció al mismo valor, `Password123!`):

| Prueba | Resultado |
|---|---|
| `pnpm typecheck` · `pnpm lint` | Sin errores ni avisos |
| "¿Olvidaste tu contraseña?" en Login | Lleva a `/recuperar-contrasena` |
| Enviar vacío o con un correo inválido | "Introduce un correo electrónico válido." |
| Enviar con `cesar@junkbox.local` | "Revisa tu correo"; el correo llega a Mailpit con `http://localhost:5173/restablecer-contrasena#token=…` |
| Abrir el enlace | La URL queda en `/restablecer-contrasena`, sin `#token` |
| Contraseña débil · no coinciden · confirmación vacía | Mensaje bajo el campo correspondiente |
| Contraseña válida | "Contraseña actualizada" y `junkbox.session` borrada |
| Reabrir el mismo enlace y enviar | "Este enlace ya no sirve" (`401`) |
| Login con la contraseña nueva | `200` |
| Sesión abierta antes del reset | El refresh da `401` y la UI acaba en `/login` |
| `/verificar-correo#token=inventado` | "No pudimos verificar tu correo"; el fragmento se quita de la URL |
| `/restablecer-contrasena` y `/verificar-correo` sin token | Estado "enlace inválido" sin llamar al backend |
| Consola del navegador | Sin errores |

El caso de éxito de la verificación no se probó aquí: necesita un usuario sin verificar, y eso solo se consigue registrando una cuenta.

---

## 4. Módulo 2: Inicio

Inicio es una **base que crece con los demás módulos**. Muestra solo lo que tiene contrato de API; las secciones de Figma que dependen de módulos o endpoints que aún no existen (feed de reseñas, red social, reproductor) se añadirán cuando existan. No se muestra contenido de ejemplo.

### 4.1 Pantallas de Figma

| Pantalla | Móvil Claro | Móvil Oscuro | Escritorio Claro | Escritorio Oscuro |
|---|---|---|---|---|
| Inicio | `14244:50321` | `14263:21466` | `14244:50496` | `14263:21659` |

Componentes: `Navbar` (14296:14145), `BottomBar` (14296:15745), `SearchField` (14296:4081), `MusicCard` (14296:3351), `Button` · CreateReview (14296:3602).

| Bloque de Figma | En esta versión |
|---|---|
| Navbar y BottomBar | Estructura común (`AppLayout`) para todas las pantallas con sesión. |
| Feed introduction (escritorio): "Tu próxima obsesión empieza aquí." | Correcto |
| "Hecho para tus oídos" (`MusicCard`) | Con una plantilla de canciones con carátula (§4.3); cada tarjeta abre su ficha (§7). |
| Tabs "Para ti (Popular)" / "Siguiendo" y `ReviewCard` | Pendiente: no hay feed de reseñas en el backend (HOME-04); las reseñas sí se ven en cada ficha (§7). |
| "Conecta por lo que suena" (escritorio) | Pendiente: no hay sugerencias de usuarios. |
| `MiniPlayer` y `SnippetPlayer` | Pendiente: no hay audio. |

### 4.2 Rutas y Estructura

| Ruta | Acceso | Vista |
|---|---|---|
| `/` | Solo con sesión (`ProtectedRoute` → `AppLayout`) | `HomePage` |

`AppLayout` (`src/app/layout/`) envuelve todas las rutas con sesión: `Navbar` arriba, el contenido del módulo en `<Outlet />` y, en móvil, `BottomBar` abajo. Los destinos de la navegación están en `app/layout/navigation.ts`: los que todavía no existen tienen `to: null` y se muestran con el estilo de Figma, sin acción y con `aria-disabled`. Hoy solo **Perfil** sigue así (Buscador → `/buscar`, Crear Reseña → `/resena/nueva`); Configuración (`SETTINGS_PATH`) también está pendiente. Al implementar cada módulo basta con poner su ruta ahí.

### 4.3 Contrato con el Backend

| Acción | Endpoint | Respuesta OK | Errores tratados |
|---|---|---|---|
| Canciones de "Hecho para tus oídos" | `GET /api/v1/music/tracks/{id}` (Bearer), una por canción y en paralelo | `200 TrackDetail` | `404` → se omite la canción · `401` → se renueva la sesión; si no se puede, se cierra · red/`500` → estado de error si no cargó ninguna |
| Carátula de cada canción (desde 2026-11-12) | La misma respuesta de `GET /api/v1/music/tracks/{id}` | `album_image_url` | `null` → la tarjeta se muestra con el recuadro neutro |
| Avatar de la Navbar | `GET /api/v1/auth/me` (ya lo hace `AuthProvider`) | `avatar_url` | `null` o imagen que no carga → placeholder |

**Plantilla:** no hay endpoint de recomendaciones. `features/home/data/homeTemplate.ts` lista 8 **IDs de Spotify** del dataset, verificados en el catálogo y aprobados por el propietario, iguales para todos los usuarios. Se guardan los IDs de Spotify porque son estables; los IDs locales dependen del orden de carga del dataset. La vista recibe una lista de `RecommendedTrack` y no sabe de dónde salen: cuando exista el endpoint solo cambia `homeService.getRecommendations()`.

**Carátulas.** Desde el 2026-11-12 cada canción trae `album_image_url` (commit `9e0794d` del backend) y la plantilla solo guarda el ID de la canción. Las canciones del dataset solo tienen álbum cuando el backend las enlaza con Spotify, lo que ocurre al aparecer en una búsqueda: las 8 se enlazaron el 2026-11-12 buscándolas una vez. **Una canción nueva en la plantilla hay que buscarla una vez** para que tenga carátula. Del 2026-11-06 al 2026-11-12, sin ese campo, la plantilla fijaba a mano el álbum de cada canción; son los mismos que enlazó el backend:

| Canción | Álbum |
|---|---|
| Blinding Lights · The Weeknd | After Hours |
| bad guy · Billie Eilish | WHEN WE ALL FALL ASLEEP, WHERE DO WE GO? |
| Despacito · Luis Fonsi | VIDA |
| HUMBLE. · Kendrick Lamar | DAMN. |
| Get Lucky · Daft Punk | Random Access Memories |
| Knights of Cydonia · Muse | Black Holes and Revelations |
| Wake Me Up · Avicii | True (Bonus Edition) |
| Uptown Funk · Mark Ronson | Uptown Special |

`homeService` pide en paralelo la canción y su álbum (`GET /music/albums/{spotifyId}`). Si el álbum aún no está en la base (`404`), lo busca (`/music/search?type=album`): el backend lo trae de Spotify, **lo guarda** y la próxima vez basta el primer paso. Esta escritura en la base se aceptó a partir de este cambio (antes Inicio solo leía).

### 4.4 Sesión: renovación del access token

Inicio es el primer módulo que llama a endpoints protegidos después de abrir la app, así que se completó la renovación que §3.8 dejaba pendiente:

- `authService.withAccessToken(call)` ejecuta la llamada con el token guardado. Ante un `401`, renueva la sesión y repite la llamada una vez.
- La renovación es **única y compartida** (`refreshSession`): si varias peticiones reciben `401` a la vez (Inicio lanza 8 en paralelo), todas esperan al mismo `POST /auth/refresh`. Reutilizar un refresh token revoca toda su familia en el backend.
- Si la renovación también da `401`, se borra la sesión y el controlador llama a `logout()`; las guardas llevan a `/login`.
- `restoreSession()` usa la misma renovación.

### 4.5 Decisiones de Implementación

1. **Sin imagen:** si una carátula no se encuentra o no carga, `MusicCard` muestra un recuadro neutro (`surface-input-disabled`) con la geometría de Figma. El avatar sin imagen muestra el robot por defecto y, si tampoco carga, un círculo neutro (§5). Figma no define placeholders; lo aprobó el propietario.
2. **Escritorio muestra 4 tarjetas** (la cuadrícula 2×2 de Figma); en móvil el carrusel horizontal muestra las 8.
3. **Títulos largos:** se recortan con puntos suspensivos y el texto completo queda en `title`. Figma no define el desbordamiento.
4. **QuickPlay y "Ver todo"** se muestran pero no tienen acción: no hay audio ni pantalla de recomendaciones.
5. **Estados de carga, vacío y error** (Figma no los define): tarjetas grises con la geometría de `MusicCard` y `motion-safe:animate-pulse`; "Todavía no hay recomendaciones."; `FormAlert` con el mensaje y "Reintentar".
6. **Cerrar sesión:** Figma no lo ubica en Inicio. Está en el menú del avatar (`AccountMenu`, §5), junto a "Configuración".
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
- **Carátulas:** salen de `album_image_url` (HOME-02, resuelta el 2026-11-12). Una canción del dataset que nunca apareció en una búsqueda llega sin álbum ni carátula (recuadro neutro) hasta que el backend la enlaza.
- **Una petición por canción:** no hay endpoint para pedir varias canciones a la vez (8 peticiones al cargar Inicio).
- **Reseñas, sugerencias de usuarios y reproducción:** no hay backend, así que esas secciones de Figma no se muestran y QuickPlay no reproduce.
- **Perfil y "Ver todo"** no tienen destino todavía.
- **Cerrar sesión** está en el menú del avatar, que no sale de Figma (§5).
- **Tablet:** Figma no lo define. Entre 768 y 1280 px la Navbar se adapta (§4.5.7).

### 4.8 Verificación del Módulo (2026-11-04)

| Prueba | Resultado |
|---|---|
| `pnpm typecheck` | Sin errores |
| `pnpm lint` | Sin avisos |
| `pnpm build` | Build correcto (JS ≈ 110 kB gzip) |
| Las 8 canciones de la plantilla con `GET /music/tracks/{id}` | 200 |
| Capturas headless (Edge) con sesión, Claro/Oscuro, 390, 900 y 1440 px | Coinciden con los frames de Figma |
| Menú de cuenta: abre con "Cerrar sesión" y le pasa el foco | Correcto |
| Consola del navegador | Sin errores ni avisos |

En desarrollo se ven 16 peticiones a `/music/tracks`: `StrictMode` monta el efecto dos veces y la primera tanda se cancela. En producción son 8.

**Carátulas (2026-11-12):** las 8 salen de `album_image_url`, con capturas headless en escritorio claro y sin errores en la consola. Antes (2026-11-06) se resolvían por el ID de Spotify de su álbum.

---

## 5. Módulo 3: Cuenta (menú, avatar y documentos legales)

Cambios pedidos por el propietario el 2026-11-06, implementados como propuestas con los tokens y componentes existentes. **Desde el 2026-11-11 están en Figma** (página Interfaces): "Menú de la cuenta" (y=28345: `16285:6932`, `16285:6985`, `16285:7046`, `16285:7099`), "Términos de Servicio" (y=21837: `16273:6827`, `16275:6827`, `16276:6827`, `16277:6827`) y "Aviso de Privacidad" (y=24627: `16278:6827`, `16279:6827`, `16280:6827`, `16281:6827`), en el orden Móvil Claro, Desktop Claro, Móvil Oscuro, Desktop Oscuro.

### 5.1 Menú de cuenta (`shared/layout/AccountMenu.tsx`)

- **Al pasar el ratón** por el avatar (o al llegar con Tab): tarjeta con el **nombre visible en negritas** (`text-sm font-semibold`, `fg`) y `@username` en un tono más claro (`text-xs`, `fg-muted`). Sin nombre visible, el username en ambas líneas.
- **Al pulsar:** menú con la misma cabecera, **"Configuración"** (`SETTINGS_PATH`; `null` hasta que exista el módulo, se muestra con `aria-disabled`) y **"Cerrar sesión"**.
- En móvil no hay "pasar el ratón": el nombre se ve dentro del menú.
- `AppLayout` le pasa un `AccountSummary` (`username`, `displayName`, `avatarUrl`, `fallbackAvatarUrl`).
- **Accesibilidad:** la tarjeta es `role="tooltip"` y describe el botón (`aria-describedby`); el menú sigue el patrón "menu button" (flechas ↑ ↓, Escape devuelve el foco al avatar, cierre al pulsar fuera).

### 5.2 Avatar por defecto

- `shared/utils/defaultAvatar.ts` → `https://api.dicebear.com/7.x/bottts/svg?seed=<username>`: el mismo robot que los usuarios seed, siempre igual para cada cuenta.
- El **registro** lo envía en `avatar_url` (campo que el backend ya acepta).
- `Avatar` lo usa como **respaldo** (`fallbackSrc`) si `avatar_url` es null o no carga; en las reseñas, con el username del autor.
- Pendiente del backend: asignarlo en el servidor (USER-03).

### 5.3 Términos y documentos legales

- **Casilla de Registro:** solo cambia al pulsar el cuadro (§3.6.5); "Términos de Servicio" y "Política de Privacidad" son enlaces (nueva pestaña). El pie legal de `AuthLayout` también enlaza.
- **Rutas públicas** (con o sin sesión), en `features/legal/`:

| Ruta | Vista | Contenido |
|---|---|---|
| `/terminos` | `TermsPage` | Términos de Servicio: quién presta el servicio, requisitos y cuenta, contenido de usuario, música y Spotify (Premium, contenido de sus titulares), uso aceptable, propiedad intelectual, disponibilidad y responsabilidad, baja, cambios y ley mexicana / Ley Federal de Protección al Consumidor. |
| `/privacidad` | `PrivacyPage` | Aviso de Privacidad Integral conforme a la **LFPDPPP** (México, decisión del propietario): responsable, datos que se recaban (incluidos los de Spotify), finalidades primarias y secundarias, transferencias y proveedores (Spotify, DiceBear, correo, alojamiento), derechos ARCO (20 y 15 días hábiles), revocación, almacenamiento en el navegador, seguridad, cambios y autoridad. |

- Los textos están en `data/termsOfService.ts` y `data/privacyNotice.ts` como datos (`LegalDocument`); `LegalPage` los pinta con logo, título, fecha, secciones, listas y un pie con los dos enlaces. Cambia el `document.title`.
- **Es una propuesta:** cada página muestra un aviso ("Documento en revisión…") y los datos pendientes van entre corchetes, resaltados con `<mark>` (responsable, domicilio, correos, proveedores, edad mínima, ciudad, autoridad vigente: la LFPDPPP cambió en 2025 y el INAI desapareció). Debe revisarlo un profesional en derecho antes de publicarse.
- El backend ya guarda la aceptación con fecha y versión (`TERMS_VERSION`, AUTH-03 resuelta el 2026-11-12). El registro envía `terms_accepted` (§3). Cuando cambien los textos hay que avisar al backend para que actualice `TERMS_VERSION`.

### 5.4 Verificación (2026-11-06)

| Prueba | Resultado |
|---|---|
| `pnpm typecheck` · `pnpm lint` | Correcto |
| Tarjeta al pasar el ratón, Claro y Oscuro | "César David Beltrán Loredo / @cesar_beltran" |
| Menú: "Configuración" (deshabilitada) y "Cerrar sesión"; la tarjeta se oculta al abrir | Correcto |
| Avatar de cesar | Robot `bottts?seed=cesar` |
| Registro: pulsar el texto no marca la casilla; pulsar la casilla sí | Correcto |
| Enlaces legales en Registro y en el pie | `/terminos` y `/privacidad` en otra pestaña |
| `/terminos` y `/privacidad` en escritorio claro y móvil oscuro | 7 y 8 datos pendientes resaltados |
| Consola | Sin errores |

---

## 6. Módulo 4: Buscador

### 6.1 Pantallas de Figma

| Pantalla | Móvil Claro | Móvil Oscuro | Escritorio Claro | Escritorio Oscuro |
|---|---|---|---|---|
| Buscador · Música | `14244:50703` | `14263:21885` | `14244:50815` | `14263:22014` |
| Buscador · Usuarios | `14244:50943` | — | `14244:51045` | — |

Componentes: `SearchField` (14296:4081), `SegmentedControl` (14296:15842), `MusicRow` (14296:8113), `Button` (14296:3647), `StarRating` (14296:5021).

### 6.2 Rutas y Estructura

| Ruta | Acceso | Vista |
|---|---|---|
| `/buscar?q=` | Con sesión (`AppLayout`) | `SearchPage` |

- **Móvil:** márgenes 16/12, título "Tu próxima escucha." (24), una columna con Canciones, Álbumes y Artistas como `MusicRow`.
- **Escritorio:** márgenes 80/32, título "Encuentra tu próxima escucha." (32), cabecera de 800; Canciones a la izquierda y, a 48 px, una columna de 384 con las tarjetas **AlbumResult** (álbum destacado: carátula 128, título 28, año, estrellas y "N valoraciones", "Ver álbum", "Ver todos") y **ArtistResult**.

### 6.3 Contrato con el Backend

| Acción | Endpoint | Notas |
|---|---|---|
| Buscar | `GET /api/v1/music/search?q=&type=track\|album\|artist&limit=` (Bearer) | Tres llamadas en paralelo: 20 canciones, 10 álbumes y 5 artistas. Si una falla, las otras se muestran; `401` cierra la sesión. |
| Calificación del álbum destacado | `GET /api/v1/music/albums/{id}` | La búsqueda no trae `ratings` (SEARCH-03). |

La búsqueda compara con `strict_word_similarity` sobre "título + artista" en la base local y, si no hay resultados buenos (puntaje < 0.8), consulta Spotify y **guarda** lo encontrado (backend `README.md` endpoint 11).

### 6.4 Decisiones de Implementación

1. **La consulta vive en la URL** (`?q=`): se puede compartir y "atrás" vuelve a la búsqueda anterior. Escribir la actualiza tras 250 ms sin teclear (con `replace`, sin llenar el historial); Enter busca al momento; el botón de borrar la vacía. Si la URL cambia desde fuera, el campo la sigue.
2. **Estado derivado** (`useSearchController`): cada resultado se guarda con su clave `intento:consulta` y el estado (inicial, cargando, listo, error) se calcula en el render, sin `setState` síncrono en efectos (regla `set-state-in-effect` de oxlint).
3. **Carátula de las canciones:** `album_image_url` de cada resultado (desde el 2026-11-12). Si el backend no la completa a tiempo llega `null` y la fila muestra el recuadro neutro; en la siguiente búsqueda ya suele estar. Antes se buscaba el álbum de la canción entre los álbumes encontrados.
4. **"Ver todas las canciones"** despliega hasta 20 (se ven 5); **"Ver todos"** despliega el resto de álbumes en la tarjeta.
5. **Pestaña "Usuarios"** visible pero deshabilitada (SEARCH-04). **Estrellas por fila** solo si hay calificación (SEARCH-03).
6. **Botón ▶** de cada canción visible y deshabilitado hasta que exista el reproductor.
7. **Filas, título y "Ver álbum"** enlazan a las fichas (§7).
8. **Estados que Figma no define:** "Busca canciones, álbumes o artistas.", "Buscando “…”…", "No encontramos resultados para “…”." y error con "Reintentar".

**Buscador de la Navbar (`NavbarSearch`).** A petición del propietario, el SearchField de la Navbar es un campo real en todas las pantallas con sesión:

- Tras 150 ms sin teclear muestra las **4 mejores coincidencias de cualquier tipo** (`searchService.suggest`, 4 de cada tipo). La API no da un puntaje común, así que se ordenan por relevancia propia: nombre igual (3) · la consulta es exactamente el artista (2,5) · empieza igual (2) · lo contiene (1); sin repetir la misma canción (sencillo y álbum).
- La última opción es "Ver todos los resultados de “…”" (Buscador completo).
- Patrón ARIA **combobox + listbox**: flechas, Enter (opción activa o Buscador), Escape.
- Al elegir, el campo **vuelve a quedar vacío** con su placeholder y se abre la ficha del elemento.
- En móvil la lista ocupa el ancho de la pantalla bajo la barra; en escritorio mide 400 px. En Figma desde el 2026-11-11: "Sugerencias del buscador" (Interfaces, y=29405: `16286:7632`, `16286:7866`, `16286:8139`, `16286:8373`).

### 6.5 Accesibilidad

- `<form role="search">` con campo etiquetado; `SegmentedControl` como `tablist` (Usuarios con `aria-disabled`).
- Resultados en una región `aria-live` con `aria-busy` durante la carga; cada sección con `aria-label`.
- Filas como enlaces que cubren la fila; el botón ▶ queda por encima y tiene su propio nombre.

### 6.6 Limitaciones Conocidas

- **SEARCH-01:** un artista que no está en la base pero cuyo nombre coincide con palabras de títulos locales no consulta Spotify ("Hoke" solo). Tras abrir su ficha (cascada, §7) sus canciones ya quedan en la base y la búsqueda las encuentra.
- **SEARCH-02/03/04:** sin discografía directa, sin calificación en los resultados y sin búsqueda de usuarios.
- Consultas sin sentido no dan "sin resultados": Spotify siempre devuelve algo.

### 6.7 Verificación (2026-11-06)

| Prueba | Resultado |
|---|---|
| `pnpm typecheck` · `pnpm lint` | Correcto |
| Navbar → `/buscar` con el foco en el campo; escribir "Hoke" → `?q=Hoke` | Correcto |
| Secciones con "Hoke": canciones, álbumes (BBO con carátula) y artistas | Correcto |
| "The Weeknd" en escritorio oscuro; "Ver todas" → 20 filas | Correcto |
| El botón de borrar vacía la URL; "atrás" restaura la búsqueda anterior y el campo | Correcto |
| Navbar: "Hoke" → Hoke (artista), Medallones, BBO, TRES CREUS | Correcto |
| Navbar: flechas + Enter abre la ficha; el campo queda vacío | Correcto |
| Capturas móvil/escritorio, Claro/Oscuro · consola | Sin errores |

---

## 7. Módulo 5: Fichas del catálogo (Canción, Álbum, Artista)

### 7.1 Pantallas de Figma

| Pantalla | Móvil Claro | Móvil Oscuro | Escritorio Claro | Escritorio Oscuro |
|---|---|---|---|---|
| Ficha de Canción | `14244:51392` | `14263:22646` | `14244:51550` | `14263:22818` |
| Ficha de Álbum | `14244:51705` | `14263:22986` | `14244:51880` | `14263:23177` |
| Ficha de Artista | `14244:52049` | `14263:23361` | `14244:52191` | `14263:23515` |

Componentes: `MusicHero` (14296:12425), `Button` · Review (14296:3509), `SpotifyButton` · OpenSpotify (14296:5708), `StarRating`, `MusicRow`, `ReviewCard` (14296:11962), `ArtistReviewCard` (14296:11995).

### 7.2 Rutas y Estructura

| Ruta | Vista | `id` |
|---|---|---|
| `/cancion/:id` | `SongPage` | ID de Spotify (o entero local) |
| `/album/:id` | `AlbumPage` | UUID local (o ID de Spotify) |
| `/artista/:id` | `ArtistPage` | UUID local (o ID de Spotify) |

Se llega desde el Buscador, las sugerencias de la Navbar, las tarjetas de Inicio y los enlaces entre fichas (`songPath`, `albumPath`, `artistPath` en `catalog/models/catalogPaths.ts`).

Estructura común (`views/DetailParts.tsx`):

- **Breadcrumb:** flecha (vuelve atrás o al Buscador) + "Buscador / Hoke / BBO".
- **MusicHero:** franja con la carátula difuminada (171/304 px), artwork 136/240 (redondo en el artista), tipo, título 24/56, subtítulo con enlaces, metadatos y la calificación de la comunidad.
- **MusicActions:** "Calificar / Reseñar" (→ §8), "Reproducir en Spotify" (abre `open.spotify.com/{track|album|artist}/{id}` en otra pestaña; "No disponible en Spotify" si el artista no tiene ID de Spotify) y compartir (solo escritorio: `navigator.share` o copia el enlace).
- **CommunityRating** ("La comunidad opina"): promedio 36, estrellas 76×12, "sobre 5 estrellas" y, si ya voté, "Tu calificación: 4,5 · Cambiar".
- **ReviewsSection:** las 3 reseñas más recientes (`ReviewCard`; en el artista, `ArtistReviewCard`). El avatar y el nombre del autor abren su perfil (`/usuario/:username`, §12); si es mi reseña, ese enlace redirige a `/perfil` (2026-11-15). En `ReviewCard` es el campo opcional `authorHref`; el componente compartido no conoce las rutas.

| Ficha | Contenido propio | Escritorio |
|---|---|---|
| Canción | Metadatos "año · duración · género · Spotify"; "Acerca de esta canción" con su álbum y su artista como `MusicRow` enlazadas (no están en Figma: muestran lo recopilado en cascada); "Reseñas recientes". | SongStats 424 · reseñas (separación 48) |
| Álbum | "año · N canciones · M min · Spotify" (los minutos solo si el álbum está completo); "Pistas destacadas" (5 y "Ver las N"; "Tenemos 10 de 11 canciones" si falta alguna); "Reseñas del álbum". | Rejilla 360 · reseñas (40); en móvil: comunidad, reseñas y pistas, como Figma |
| Artista | Géneros; "Artista en Spotify"; "N lanzamientos y M canciones en Junkbox"; "Lo que dice la comunidad"; "Imprescindibles" (3 lanzamientos + 5 canciones y "Ver toda la discografía"). Sin foto (artistas del CSV): círculo neutro y el fondo usa la carátula más reciente. | 360 · reseñas · 272 (40) |

### 7.3 Catálogo en cascada (`music/services/catalogService.ts`)

Decisión del propietario: al abrir una ficha se recopila el artista, sus álbumes y las canciones de esos álbumes, para que **queden guardados en la base** y sus imágenes aparezcan. El backend no tiene un endpoint para ello (CAT-01); la única vía del frontend es `GET /music/search`, que guarda lo que trae de Spotify.

`hydrateArtist({ id, name })`:

1. En paralelo: `search type=artist` (puede traer la foto), `type=album q=<artista>` (50) y `type=track q=<artista>` (50).
2. Detalle de cada álbum del artista (`GET /music/albums/{id}`).
3. Completar los álbumes incompletos (`tracks.length < total_tracks`): `search type=track q="<álbum> <artista>"` y volver a pedir el álbum. Hasta **8 álbumes**, los más grandes primero, **3 a la vez**.
4. Devuelve `{ albums, topTracks, incompleteAlbums }`.

- Se hace **una vez por artista y sesión** (la promesa se guarda en memoria; si falla, se olvida). No se cancela al salir de la ficha.
- `fillAlbum` completa un álbum suelto (ficha de álbum) y `findAlbumForTrack` encuentra el álbum de una canción del CSV sin `album_id` (el que la contiene o su sencillo). La portada de la ficha de canción sale primero de `album_image_url` (desde el 2026-11-12) y, si es `null`, del álbum encontrado; en la ficha de artista, cada canción usa su `album_image_url`.
- `musicApi.getAlbum` normaliza `tracks` a `[]`: el backend omite el campo cuando el álbum no tiene canciones en la base.

**Prueba en vivo (2026-11-06):**

| Artista | Tiempo (2ª vez) | Álbumes con carátula | Canciones guardadas |
|---|---|---|---|
| Hoke | 0,9 s (0 ms) | 5 de 5 | TRES CREUS 10/10 · BBO 10/11 |
| Muse | 3,2 s (0 ms) | 6 de 6 | Black Holes and Revelations 12/12 · Will Of The People 0/10 |
| Daft Punk | 2,9 s (0 ms) | 5 de 5 | Discovery 14/14 · Random Access Memories 12/13 · Homework 15/16 |

Efecto secundario útil: "Get Lucky" (CSV) quedó enlazada a *Random Access Memories*, y la búsqueda de "Hoke" ya devuelve sus canciones. Lo que no se completa son los álbumes cuyas canciones chocan con títulos del CSV (SEARCH-01): se resolverá con CAT-01.

### 7.4 Carga de datos: `useLoad`

`catalog/controllers/useLoad.ts`: `useLoad(key, loader)` hace una petición por clave (o reintento), cancela la anterior y **deriva** el estado (`idle` · `loading` · `ready` · `error` con `notFound`) de la clave de la última respuesta, sin `setState` síncrono en efectos. `key = null` = aún no hay qué cargar (cargas encadenadas: ficha → cascada → reseñas). Un `401` cierra la sesión. Los cargadores son funciones de módulo estables (`catalogLoaders.ts`). Las piezas secundarias (artista, álbum) no rompen la ficha si fallan.

### 7.5 Contrato con el Backend

| Acción | Endpoint |
|---|---|
| Datos de la ficha | `GET /api/v1/music/tracks/{id}` · `/albums/{id}` · `/artists/{id}` (incluyen `ratings: { count, average }`) |
| Cascada | `GET /api/v1/music/search` (§7.3) |
| Reseñas de la ficha | `GET /api/v1/reviews?target_type=&target_id=&limit=3` |
| Mi calificación | `GET /api/v1/ratings/my?target_type=&target_id=` (`404` → no voté) |

### 7.6 Accesibilidad

- `<nav aria-label="Ruta de navegación">` con `aria-current="page"` en el último tramo; la flecha es un botón "Volver".
- Un `<h1>` por ficha (el título del hero) y `<h2>` por sección; las estrellas son `role="img"` con "4,5 de 5 estrellas".
- Acciones sin backend con `aria-disabled` y `title`; compartir anuncia "Enlace copiado" con `aria-live`.

### 7.7 Limitaciones Conocidas

- **CAT-01:** álbumes incompletos y artistas del CSV sin foto. **RATE-01:** las barras de reparto de votos no se muestran (decisión del propietario). **REV-01:** Me gusta, comentarios, guardar y seguir sin acción. **ART-01:** sin ubicación ni oyentes del artista.
- Las fichas solo existen para lo que ya está en la base (los IDs de Spotify nunca importados dan `404`).
- La Navbar no marca "Buscador" como activo dentro de una ficha (Figma sí lo hace).

### 7.8 Verificación (2026-11-06)

| Prueba | Resultado |
|---|---|
| `pnpm typecheck` · `pnpm lint` · `pnpm build` | Correcto |
| Buscador "Hoke" → "TT" → `/cancion/6mQGOlMMCOMww9wMglS9FB`, con álbum BBO y artista enlazados | Correcto |
| Álbum BBO (oscuro y móvil claro): "11 canciones", 10 pistas, "Tenemos 10 de 11" | Correcto |
| Artista Hoke: Imprescindibles con lanzamientos y canciones; Muse sin foto (círculo neutro) | Correcto |
| Barra → sugerencia → `/artista/…` con el campo vacío; tarjeta de Inicio → `/cancion/…` | Correcto |
| `/cancion/0000000000000000000000` → "No encontramos esta canción" | Correcto |
| Reseña y calificación temporales (4,5): media estrella, "1 valoración", ReviewCard con el robot; borradas al terminar | Correcto |
| Consola | Sin errores |

---

## 8. Módulo 6: Calificaciones y Reseñas

### 8.1 Pantallas de Figma

| Pantalla | Móvil | Escritorio |
|---|---|---|
| Escribir Reseña (Claro) | `14244:51146` | `14244:51275` |

Componentes: `SearchField`, `StarRating` · Rating-08 (176×32), `ReviewTextarea` (14296:4102), `AudioSnippetPicker` (14296:6377), `Button` · PublishReview (14296:3558).

### 8.2 Rutas y Flujo

| Ruta | Vista |
|---|---|
| `/resena/nueva?tipo=song\|album\|artist&id=…` | `WriteReviewPage` |

- Desde **"Calificar / Reseñar"** de una ficha (`writeReviewPath(tipo, id)`), con el elemento ya elegido.
- Desde **"Crear Reseña"** (Navbar y BottomBar), sin elemento: se busca con el buscador de la pantalla (mismas sugerencias que la Navbar) y al elegir uno se escribe en la URL.
- Al publicar, quitar o eliminar, vuelve a la ficha, que ya muestra el promedio nuevo y "Tu calificación".

### 8.3 Contrato con el Backend

Referencia: backend `README.md` (endpoints 15–22) e `implementacion.md` §6.

| Acción | Endpoint | Respuesta OK | Errores |
|---|---|---|---|
| Calificar / cambiar | `POST /api/v1/ratings` `{ target_type, target_id, score }` | `201` nuevo · `200` reemplazado | `400` (score fuera de 0,5–5 o no múltiplo de 0,5) · `404` objetivo no importado |
| Mi calificación | `GET /api/v1/ratings/my?target_type=&target_id=` | `200 Rating` | `404` → no voté |
| Quitar calificación | `DELETE /api/v1/ratings/{id}` | `200` | `403` · `404` |
| Publicar reseña | `POST /api/v1/reviews` `{ target_type, target_id, content }` | `201 Review` | `409` → ya existe: se edita con `PUT` |
| Editar reseña | `PUT /api/v1/reviews/{id}` `{ content }` | `200 Review` | `403` · `404` |
| Eliminar reseña | `DELETE /api/v1/reviews/{id}` | `200` | `403` · `404` |
| Reseñas del objetivo | `GET /api/v1/reviews?target_type=&target_id=&limit=&page=` | `200 { total, reviews[] }` | — |

`target_id`: ID de Spotify para canciones y UUID local para álbumes y artistas (el backend acepta ambos). `rating_score` de cada reseña es el voto **actual** de su autor.

### 8.4 Decisiones de Implementación

1. **Calificar en Escribir Reseña** (decisión del propietario, como Figma): las estrellas guardan la calificación (obligatoria) y el texto, si se escribe, la reseña (opcional).
2. **Estrellas de media en media** (`StarRatingInput`, recurso de Figma de 176×32 como máscara): mitad izquierda de una estrella = media, derecha = entera; vista previa al pasar el ratón; teclado ← ↓ / → ↑ (±0,5), Inicio (0,5) y Fin (5).
3. **Texto por nivel** (Figma solo define "5 de 5 · Brutal"; propuesta): 0,5 Nada para mí · 1 Malo · 1,5 Flojo · 2 Regular · 2,5 Pasable · 3 Bueno · 3,5 Muy bueno · 4 Excelente · 4,5 Increíble · 5 Brutal.
4. **Validación** (`writeReview.ts`): estrellas obligatorias; texto de **5 a 2.000** caracteres (el contador de Figma; el backend admite 5.000), contados como el backend (code points). Un texto vacío con reseña existente pide usar «Eliminar mi reseña».
5. **Publicar:** `POST /ratings` y, si hay texto, `PUT` de mi reseña o `POST` (si responde `409`, la busca y hace `PUT`).
6. **Precarga:** mi calificación (`GET /ratings/my`) y mi reseña, que se busca en `GET /reviews` paginado porque no existe `GET /reviews/my` (REV-02). El borrador va ligado a su objetivo, así que se muestra lo publicado hasta que se edita (sin `setState` en efectos). Con algo publicado, el botón dice "Guardar cambios" y aparecen "Quitar mi calificación (4,5)" y "Eliminar mi reseña".
7. **"Elige tus 30 segundos"** se muestra atenuado y "próximamente": no hay reproductor (HOME-06).
8. **Textos cambiados respecto a Figma:** "Seleccionado: TT — Hoke" (en lugar de "Sugerencia: …") y "La reseña es opcional; la calificación, no" (en lugar de "Reproducción en pausa").
9. **ComposerContext** (escritorio, desde `lg`): carátula 296 y los textos de Figma.

### 8.5 Accesibilidad

- Las estrellas son un `slider` (`aria-valuemin` 0,5, `aria-valuemax` 5, `aria-valuetext` "4,5 de 5 estrellas" o "Sin calificar") descrito por el texto del nivel.
- El buscador de la pantalla es un `combobox` con su `listbox`; la textarea tiene nombre ("Tu reseña (opcional)") y `aria-invalid`.
- Errores con `role="alert"`; el botón usa el estado Loading de `PrimaryButton`.

### 8.6 Limitaciones Conocidas

- **REV-02:** encontrar mi reseña recorre las páginas de `GET /reviews` (50 por página).
- **REV-01:** sin Me gusta, comentarios ni seguir. **RATE-01:** sin reparto de votos.
- El fragmento de 30 s no existe en el backend.

### 8.7 Verificación (2026-11-06, flujo completo en Edge headless con `cesar`)

| Prueba | Resultado |
|---|---|
| `pnpm typecheck` · `pnpm lint` · `pnpm build` | Correcto |
| "Calificar / Reseñar" en "TT" → `/resena/nueva?tipo=song&id=…` con el elemento elegido | Correcto |
| Publicar sin estrellas · texto de 3 caracteres | "Elige de media a cinco estrellas." · "…al menos 5 caracteres." |
| Clic en la mitad izquierda de la 5.ª estrella | "4,5 de 5 · Increíble" |
| Publicar → ficha con 4,5, "1 valoración", "Tu calificación: 4,5" y la reseña | Correcto |
| "Cambiar": precarga 4,5 y el texto; ← ← ← y texto nuevo → ficha con 3,0 y la reseña editada (PUT) | Correcto |
| "Eliminar mi reseña" y "Quitar mi calificación" → API: `404` y 0 reseñas | Sin datos de prueba |
| "Crear Reseña" (móvil oscuro) → estrellas deshabilitadas; buscar "Muse" y elegir → `?tipo=artist&id=…` | Correcto |
| Consola | Sin errores |

---

### 8.8 Reseña Completa y comentarios (2026-11-15)

**Figma:** Reseña Completa, móvil `14244:52342` / `14263:23679` y escritorio `14244:52506` / `14263:23859`. Componentes: ReviewCard-17, CommentCard (`14296:8890`), CommentInput (`14296:5773`) y ExpandedComments.

**Pedido del propietario:** comentarios en las reseñas, que también se puedan responder sin límite, y solo Me gusta y Comentarios como acciones.

**Decisiones (2026-11-15):**
1. **Respuestas anidadas** (no están en Figma):
   - sangría bajo el avatar (36 px) hasta **3 niveles** (`MAX_COMMENT_INDENT`);
   - las respuestas más profundas siguen en el nivel 3 con "Respondiendo a @usuario", para que en móvil el texto no se aplaste;
   - cada comentario con respuestas tiene "Ocultar respuestas" / "Ver N respuestas" (`aria-expanded`).
2. **Acciones de la reseña:** solo Me gusta y Comentarios. Se quitaron Guardar (marcador) y "más opciones" de `ReviewCard`. "Seguir" se queda (FOL-01).
3. **Me gusta solo en reseñas** (y en comentarios, como en Figma). El Me gusta de las calificaciones queda como solicitud al backend, sin interfaz (LIKE-03).
4. "Comentarios" de cada `ReviewCard` (y de `ArtistReviewCard`) abre la Reseña Completa.

**Ruta:** `/resena/:id` (`REVIEW_PATH`, UUID de la reseña), dentro de `ProtectedRoute` → `AppLayout`. `/resena/nueva` (Escribir Reseña) tiene prioridad por ser estática.

```
features/reviews/
├── models/reviewDetail.ts              # ruta, comentario (COM-01), buildCommentTree, "Publicada hoy a las…"
├── services/reviewDetailService.ts     # reseña + lo reseñado (portada, título, subtítulo, ficha)
├── controllers/useReviewDetailController.ts
└── views/
    ├── ReviewDetailPage.tsx            # cabecera, ReviewCard completa, línea de publicación
    └── CommentThread.tsx               # CommentThread, CommentCard anidado, CommentInput
```

**Contrato con el backend:**

| Dato | Endpoint | Estado |
|---|---|---|
| La reseña | `GET /reviews/{id}` → 200 Review · 404 · 400 si no es UUID | Disponible |
| Lo reseñado | `GET /music/tracks|albums|artists/{id}` con el id local de `target` | Disponible |
| Comentarios y respuestas | — | **COM-01** |
| Me gusta en reseñas | — | **LIKE-01** (`likes_count` siempre 0) |
| Me gusta en comentarios | — | **LIKE-02** |
| Me gusta en calificaciones | — | **LIKE-03** (sin interfaz) |

**Implementación:**
- La página carga la reseña y después lo reseñado. Si la ficha falla, la reseña se muestra igual, sin portada.
- La línea bajo la tarjeta ("Blinding Lights · The Weeknd · Publicada hoy a las 6:33 p.m.") enlaza a la ficha.
- Desde 1280 px los comentarios van en un panel con borde de 400 px a la derecha; por debajo van bajo la reseña, sin borde (móvil de Figma).
- `ReviewCard` recibe `full` (portada de 104 en escritorio, ReviewCard-17) y `reviewHref`.
- `buildCommentTree` arma el hilo con la lista plana que propone COM-01. Los comentarios principales van del más reciente al más antiguo y las respuestas en orden de conversación; una respuesta sin padre se muestra como principal.
- Hasta COM-01 el hilo muestra "Aquí aparecerán los comentarios y sus respuestas. Pendiente del backend." La caja para comentar (avatar 24, `send-18.svg` descargado de Figma) y "Responder" están deshabilitados. Los Me gusta llevan `aria-disabled`.
- Estados: esqueleto mientras carga; "No encontramos esta reseña" (404/400) o error con reintento, con `DetailError`.
- **No se muestra el SnippetPlayer** (fragmento de 30 s con forma de onda): la reseña no guarda qué fragmento es. Se agregará si Producto lo pide.

**Accesibilidad:**
- `<h1>` "La reseña de …" y `<h2>` "Comentarios".
- Cada comentario es un `article` con "Comentario de …"; las respuestas son una lista "Respuestas a …".
- El nombre del autor enlaza a su perfil; el avatar repite el enlace fuera del orden de tabulación.
- La caja para comentar tiene etiqueta oculta, y el botón de enviar se anuncia como "Enviar comentario".

**Verificación (2026-11-15):** con una reseña temporal de `cesar` (borrada al terminar) y, solo para la prueba, seis comentarios de ejemplo de 5 niveles inyectados en el controlador (revertidos).

| Prueba | Resultado |
|---|---|
| `pnpm typecheck` · `pnpm lint` · `pnpm build` | Correcto |
| 1440 claro | Reseña a la izquierda y panel de comentarios de 400 px; sangría en 3 niveles; niveles 4 y 5 con "Respondiendo a @…" |
| 1024 claro, 390 claro y oscuro | Comentarios debajo de la reseña, sin desbordes |
| "Ocultar respuestas" | Contrae el hilo; pasa a "Ver 2 respuestas" con `aria-expanded="false"` |
| "Comentarios" en la ficha de canción | Lleva a `/resena/<id>` |
| `/resena/<uuid inexistente>` | "No encontramos esta reseña" |
| Consola | Sin errores |

---

## 9. Módulo 7: Landing (usuarios sin sesión)

### 9.1 Diseño

La especificación es del propietario (2026-11-11, ajustada el 2026-11-13) y se implementa con los tokens y componentes existentes. **En Figma** desde el 2026-11-11, capturada de la app (versión anterior al ajuste del 2026-11-13: dos carriles en móvil y portadas más grandes): "Landing" (Interfaces, y=20777: `16270:6827`, `16269:6827`, `16274:6827`, `16271:6827`, en el orden Móvil Claro, Desktop Claro, Móvil Oscuro, Desktop Oscuro).

| Zona | Escritorio (`md:`) | Móvil |
|---|---|---|
| Centro | Logo de Junkbox (424 px), eslogan "Califica, reseña y descubre música." y dos botones en fila | Logo (280–340 px), eslogan y los botones a todo el ancho (alto 48, táctiles) |
| Fondo | **80 portadas distintas** en **8 filas que cruzan la pantalla de lado a lado**, inclinadas −8° (lo más horizontal posible sin dejar de ser diagonales) y apiladas sin cruzarse: las 4 de arriba con las 40 primeras y las 4 de abajo con las 40 siguientes, alternando sentido y velocidad. La portada mide `calc((100vh + 14vw) / 8 - 12px)` para que las 8 filas cubran toda la pantalla ya inclinadas, sin fondo vacío. Opacidad 75 % y máscara radial que deja el centro despejado | **40 portadas al azar** (96 px) en 8 filas de 5 que cubren **toda la pantalla**, alternando sentido y velocidad, con la misma opacidad (75 %) y la misma máscara radial que escritorio |
| Pie | "Términos de Servicio · Política de Privacidad" | Igual |

- **"Registrarse"** (estilo de `PrimaryButton`, acción principal) y **"Iniciar sesión"** (estilo de `SecondaryButton`) son **enlaces** a `/register` y `/login`, no modales.
- El eslogan lo eligió el propietario. El `<h1>` contiene el logo (texto alternativo "Junkbox") y el eslogan; el título de la pestaña es "Junkbox · Califica, reseña y descubre música".

### 9.2 Rutas

| Ruta | Sin sesión | Con sesión |
|---|---|---|
| `/` | `LandingPage` | `AppLayout` + `HomePage` (ruta índice) |
| Rutas protegidas (`/buscar`, fichas, `/resena/nueva`…) | Redirigen a `/` (la landing) | Su pantalla |
| Rutas desconocidas | `/` | `/` |

`HomeRoute` (`app/routes/RouteGuards.tsx`) decide qué mostrar en `/` según la sesión (mientras se comprueba, `SessionCheck`). `ProtectedRoute` redirige a `/` en lugar de a `/login`; cerrar sesión acaba en la landing.

### 9.3 Portadas

- Sin sesión no se puede pedir el catálogo (todos los endpoints de `/music` exigen Bearer). Por eso `features/landing/data/landingCovers.ts` es una **lista fija de 80 álbumes elegidos por el propietario** (2026-11-13), en su orden. Las URLs salen de `GET /music/search?type=album`; los que no estaban en la base los importó el backend de Spotify al buscarlos. Casos particulares: "Weezer (Green Album)" es el "Weezer" de 2001; "Audioslave" se tomó del álbum de la canción "Cochise" (la búsqueda de álbumes no lo devolvía); "DEPR</3$$ED MFKZ" está a nombre de Junior H en el catálogo (es de Gael Valenzuela y Junior H); varios son la edición remasterizada o ampliada (misma portada).
- Se usa la variante de **300 px** del CDN de Spotify (prefijo `ab67616d00001e02` en lugar de `ab67616d0000b273`, de 640 px); las 80 se comprobaron (`HEAD 200`).
- **Selección:** escritorio muestra las 80; móvil, **40 al azar en cada visita** (`pickRandomCovers`, Fisher–Yates). Se sortea una vez al montar `LandingPage` (inicializador de `useState`), así no cambian al volver a renderizar.
- **Easter egg (decisión del propietario, 2026-11-13):** en el mismo sorteo sale un número entre 1 y 137 500 (`EASTER_EGG_RANGE`); si es **67** (`EASTER_EGG_NUMBER`), todas las portadas, en escritorio y en móvil, son **"TRAP STORY"**. No es un álbum sino la portada de una lista pública de Spotify (`1NaTVrYp7vkBAU5v6pxNWP`), obtenida con el oEmbed público de Spotify; si quien la creó cambia la imagen, la URL puede dejar de funcionar. El número no se muestra.
- Una portada que no carga se oculta y deja el recuadro neutro (`surface-input-disabled`).
- Pendiente del backend: un endpoint público para rotarlas (**LANDING-01**).

### 9.4 Decisiones de Implementación

1. **Carrusel infinito sin JavaScript** (`views/CoverWall.tsx`): cada pista contiene su lista dos veces y se desplaza la mitad de su tamaño con `@keyframes jb-marquee-x` (§2.3), así el bucle no tiene salto. La duración se fija por fila (60–90 s en escritorio, 40–64 s en móvil) y el sentido con `animation-direction`.
2. **Se mueve siempre**, también con "reducir movimiento" (decisión del propietario, 2026-11-11): Windows con los *Efectos de animación* desactivados hace que el navegador lo pida, y la primera versión detenía las portadas.
3. **Las esquinas se definen con la máscara** sobre una capa al 75 % de opacidad; funciona igual en claro y oscuro porque el fondo es `bg`. Móvil: `radial-gradient` 62 % × 68 %, transparente hasta el 42 %. Escritorio (2026-11-13): 45 % × 40 %, transparente hasta el 55 %, para que se vea la fila de cada esquina más cercana al centro.
5. **Escritorio a pantalla completa** (2026-11-13, en tres ajustes pedidos por el propietario): (a) antes los grupos de las esquinas se colocaban con `-top-[14vh] -left-[18vw]` y al girarlos la fila exterior quedaba fuera de la pantalla (se veían 3 de 4); (b) se agrandaron las portadas para rellenar las esquinas; (c) las filas pasan a cruzar toda la pantalla, menos inclinadas (−8° en lugar de −12°) y en un solo bloque de 8 filas centrado (`w-[140vw]`, `translateY(-50%) rotate(-8deg)`), porque con dos grupos de filas largas se cruzaban a media pantalla. Cada fila repite sus 10 portadas para que la pista siempre sea más larga que la pantalla.
4. Primero fueron columnas verticales; a petición del propietario pasaron a **filas en carrusel** con sentido alterno.

### 9.5 Accesibilidad

- Todo el fondo es decorativo: `aria-hidden`, `pointer-events-none`, imágenes con `alt=""` y `loading="lazy"`.
- Los botones son enlaces con foco visible y alto táctil de 48 px.
- Las portadas se mueven aunque el sistema pida reducir movimiento (decisión del propietario, §9.4.2).

### 9.6 Limitaciones Conocidas

- **LANDING-01:** las portadas no cambian hasta que se actualice la lista a mano.
- Las portadas de móvil cubren también la zona del pie legal: se lee, pero no queda sobre fondo liso.
- Las carátulas se enlazan desde el CDN de Spotify; si se publica fuera del ámbito académico, conviene revisar las condiciones de Spotify sobre el uso de carátulas.
- A 1440 px el pie legal queda sobre la parte difuminada de las filas inferiores (se lee, pero no queda sobre fondo liso).

### 9.7 Verificación (2026-11-11; ajuste del 2026-11-13 al final)

| Prueba | Resultado |
|---|---|
| `pnpm typecheck` · `pnpm lint` · `pnpm build` | Correcto |
| Capturas headless sin sesión: 1440 claro/oscuro, 1024 oscuro, 390 claro/oscuro | Correcto |
| Filas de escritorio: 1 izq → der · 2 der → izq · 3 izq → der · 4 der → izq | Correcto. Medido con la posición de cada pista |
| Movimiento con `prefers-reduced-motion: reduce` (escritorio y móvil) | Se mueve |
| "Registrarse" → `/register` · "Iniciar sesión" → `/login` | Correcto |
| `/buscar` y `/no-existe` sin sesión → landing | Correcto |
| Con sesión, `/` → Inicio (Navbar), sin landing | Correcto |
| Consola | Sin errores |
| (2026-11-13) Escritorio claro/oscuro: imágenes del fondo | 80 distintas (160 nodos: la pista va dos veces) |
| (2026-11-13) Móvil claro/oscuro: imágenes del fondo, dos recargas | 40 distintas en cada una, y distintas entre recargas |
| (2026-11-13) Easter egg forzado (`Math.random` fijado solo en la prueba) | Escritorio y móvil: todas las portadas son TRAP STORY |
| (2026-11-13) `pnpm typecheck` · `pnpm lint` · consola | Correcto, sin errores |
| (2026-11-13) Escritorio a 1920×1080, 1440×900, 1366×768, 1280×720 y 1024×768: filas visibles y fondo vacío dentro de la zona opaca de la máscara (rejilla de 20 px) | Las 8 filas visibles; fondo vacío 0 % (con las esquinas separadas era 36 %) |

---

## 10. Módulo 8: Configuración

### 10.1 Pantallas de Figma

| Pantalla | Móvil | Escritorio |
|---|---|---|
| Configuración · Claro | `14244:53364` | `14244:53464` |
| Configuración · Oscuro | `14263:24792` | `14263:24903` |

Solo existe la sección **"Cuenta y música"**. Componentes: `SettingsNavigation` (14296:15752), `SpotifyButton` · ConnectSpotify (14296:5579 / 14296:5598), `FrequencyOption` (14296:4240 / 14296:4283), `ProfileField` (14296:4439 / 14296:4469) y `Button` · SaveChanges.

**Cambios del propietario respecto a Figma (2026-11-13):**
- Se quita **"Bio musical"**.
- "Información pública" añade el **correo** (privado) y **"Cambiar contraseña"**, en lugar de una tarjeta aparte.
- Las secciones del menú lateral sin diseño ("Perfil público", "Privacidad", "Ayuda") se muestran **deshabilitadas**.
- Lo que no tiene backend queda como **plantilla**: los campos se pueden editar y validar, pero "Guardar cambios", "Cambiar foto" y la frecuencia están deshabilitados, con la nota "Pendiente del backend".
- "Vincular Cuenta de Spotify" queda **deshabilitado** hasta el módulo Spotify + Reproductor.

### 10.2 Rutas y Estructura

- `/configuracion` (`features/settings/models/settings.ts` · `SETTINGS_PATH`), dentro de `ProtectedRoute` → `AppLayout`.
- Se llega desde **"Configuración"** del menú del avatar: `app/layout/navigation.ts` · `SETTINGS_PATH` deja de ser `null`.
- La flecha de la cabecera vuelve a la página anterior (`navigate(-1)`).

```
features/settings/
├── models/settings.ts                 # ruta, opciones de frecuencia y validación del perfil
├── controllers/useSettingsController.ts
└── views/
    ├── SettingsPage.tsx               # cabecera, columnas y "Información pública"
    └── SettingsSections.tsx           # SettingsNav, SpotifySection, FrequencySection, ProfileField
```

### 10.3 Contrato con el Backend

| Acción | Endpoint | Estado |
|---|---|---|
| Datos del usuario | `GET /auth/me` (ya cargado por `AuthProvider`) | Disponible |
| Cambiar contraseña | `POST /auth/password/forgot { email }` con el correo del usuario: envía el enlace de recuperación (alternativa aprobada para USER-02) | Disponible |
| Cerrar sesión (menú lateral) | `POST /auth/logout` | Disponible |
| Guardar nombre, usuario, correo y foto | — | **USER-01** |
| Cambiar la contraseña con sesión iniciada | — | **USER-02** |
| Frecuencia de recomendaciones | — | **PREF-01** |
| Vincular Spotify | API de Spotify (PKCE) | Módulo Spotify + Reproductor |

### 10.4 Decisiones de Implementación

1. **Validación del perfil** (`validateProfile`): mismas reglas que el registro, reutilizando `auth.validation.ts` (`USERNAME_PATTERN`, `EMAIL_PATTERN`, `DISPLAY_NAME_MAX_LENGTH`). Los errores solo aparecen en los campos que el usuario cambió. El nombre visible puede repetirse entre usuarios.
2. **ProfileField**: caja de 48 px con la etiqueta dentro (Caption/10) y el valor (Body/13), como en Figma. Figma solo define el estado por defecto; el foco y el error reutilizan los bordes del `TextInput` (text/primary y brand/accent).
3. **"Cambiar contraseña"** usa el botón pequeño de Figma (Variant=Button, alto 32, el mismo que "Cambiar foto") y anuncia el mensaje del backend con `aria-live`. **Bloqueo contra clics accidentales** (petición del propietario, 2026-11-13): tras cada clic queda deshabilitado 5 s (`PASSWORD_RESET_COOLDOWN_SECONDS`) con la cuenta atrás "Espera N s"; una referencia lo bloquea en el mismo instante, así que varios clics seguidos envían una sola petición. El backend, además, emite como máximo **3 enlaces por usuario y hora** (`maxEmailTokensPerHour` en `account_email_service.go`) e ignora los demás sin avisar (responde igual); la ayuda lo indica ("hasta 3 por hora").
4. **Colocación por tamaño:**
   - Móvil: una columna, como en Figma (sin menú lateral y sin "Cambiar foto", que Figma no muestra en móvil).
   - De 768 a 1279 px: menú lateral más una columna, con **"Información pública" primero** (petición del propietario, 2026-11-13) y después "Tu cuenta de música" y "Frecuencia", porque a 1024 px la columna central de Figma quedaría de unos 136 px.
   - Desde 1280 px: las tres columnas de Figma (menú de 192, contenido y tarjeta de 440).
5. **Colores:**
   - `surface/default-3` y `action/background-3` → `surface-input-disabled`;
   - `text/secondary-3` → `fg-soft`;
   - `text/secondary-2` → `fg-placeholder`;
   - opción elegida (`brand/accent-2`) → `border-action`;
   - círculo de la opción no elegida (`border/default-7`) → `border-fg-placeholder`.
6. **Recursos de Figma** (`src/assets/icons`): `arrow-left-20.svg`, `circle-minus-16.svg` y `radio-checked-16.svg`, pintados con `MaskIcon` para que tomen el color del tema. El logo de Spotify reutiliza `assets/brand/spotify-logo.png`.
7. El **MiniPlayer** de Figma no se muestra: llega con el módulo Spotify + Reproductor.

### 10.5 Accesibilidad

- Un solo `<h1>` ("Configuración") y un `<h2>` por sección. "Información pública" es un `<form>` etiquetado por su título.
- Los controles sin backend usan `aria-disabled` o `disabled` y apuntan a su nota con `aria-describedby`. "Vincular Cuenta de Spotify" tiene un texto oculto: "Disponible próximamente".
- La frecuencia es un `fieldset` con `legend` y radios reales (ocultos visualmente), deshabilitados.
- El menú lateral es un `nav` con `aria-current="page"` en "Cuenta y música".
- Los errores de cada campo se anuncian (`role="alert"`) y se enlazan con `aria-describedby`.

### 10.6 Limitaciones Conocidas

- **USER-01:** no se puede guardar el nombre, el usuario, el correo ni la foto.
- **USER-02:** no se puede cambiar la contraseña con la actual; se usa el enlace por correo.
- **PREF-01:** la frecuencia se queda en "Semanal".
- **Spotify:** la vinculación llega con el módulo Spotify + Reproductor.
- Las secciones "Perfil público", "Privacidad" y "Ayuda" no tienen diseño en Figma.

### 10.7 Verificación (2026-11-13)

| Prueba | Resultado |
|---|---|
| `pnpm typecheck` · `pnpm lint` | Correcto |
| Capturas headless con sesión: 390 claro/oscuro, 1440 claro/oscuro y 1024 claro | Coinciden con Figma; a 1024 la tarjeta de perfil va debajo |
| Menú del avatar → "Configuración" | Lleva a `/configuracion` |
| Usuario "A B" | "De 3 a 50 caracteres: letras, números, '_' o '.'." |
| "Guardar cambios" | Deshabilitado |
| "Cambiar contraseña" | Muestra el mensaje del backend ("Si el correo está registrado, recibirás un enlace…") |
| Opciones de frecuencia · "Perfil público", "Privacidad", "Ayuda" | Deshabilitadas |
| Tres clics seguidos en "Cambiar contraseña" | Una sola petición; "Espera 5 s" con cuenta atrás y se habilita a los 5 s (un clic después envía otra) |
| 1024 px: orden de las tarjetas | "Información pública" arriba, después "Tu cuenta de música" y "Frecuencia" |
| Consola | Sin errores |

---

## 11. Módulo 9: Spotify y Reproductor

Se implementa en dos pasos: **(1) vincular Spotify** desde Configuración y **(2) el SDK y el MiniPlayer** (ambos 2026-11-13). Decisiones del propietario (2026-11-13):
- **Módulo:** `features/player`, con un proveedor propio.
- **Dónde se guarda la vinculación:** en este navegador, de la forma más segura posible, y se mantiene entre visitas.
- **URL de retorno:** `http://127.0.0.1:5173/spotify/callback`.
- **MiniPlayer en móvil:** como en Figma; la flecha abre una vista ampliada con atrás, adelante y volumen.

### 11.1 Vinculación con Spotify (PKCE)

**Flujo:** Authorization Code con PKCE, desde el navegador y sin secreto. Es el que Spotify recomienda para apps sin servidor propio; el backend no tiene integración por usuario (SPOT-01).
1. "Vincular Cuenta de Spotify" (Configuración) genera un `code_verifier` y un `state` aleatorios (Web Crypto). Los guarda solo para esa vuelta en `sessionStorage` y redirige a `accounts.spotify.com/authorize`, con `code_challenge` S256 y los permisos mínimos: `streaming`, `user-read-email`, `user-read-private`, `user-read-playback-state` y `user-modify-playback-state`.
2. Spotify vuelve a `/spotify/callback`. `SpotifyCallbackPage` comprueba el `state` y el usuario, cambia el código por los tokens (`POST /api/token` con el verifier) y regresa a Configuración. El intercambio se hace una sola vez aunque `StrictMode` repita el efecto.
3. El access token se renueva con el refresh token (`grant_type=refresh_token`), una sola renovación a la vez. Si Spotify revoca la vinculación (400/401), se borra.

**Guardado** (`infrastructure/spotifyTokenVault.ts`):

| Dato | Dónde | Protección |
|---|---|---|
| Access token (1 h) | Solo memoria | Se pierde al recargar y se renueva. |
| Refresh token | `localStorage` (`junkbox.spotify.<id de usuario>`) | Cifrado con AES-GCM 256. |
| Clave AES | IndexedDB (`junkbox` › `keys`) | Creada **no extraíble**: la página puede usarla, pero no leerla ni copiarla, así que el token guardado no sirve fuera de este navegador. |
| `code_verifier` y `state` | `sessionStorage`, solo durante la vinculación | Se borran al volver. |

Al **cerrar sesión** en Junkbox (menú del avatar o Configuración) o al **desvincular**, se borra. Cada usuario de Junkbox tiene su propia vinculación. Sin backend no hay protección completa contra un script malicioso dentro de la propia página; por eso sigue pendiente SPOT-01.

**Dirección de desarrollo:**
- Spotify no acepta `localhost` en las URLs de retorno, así que la vinculación usa `http://127.0.0.1:5173`.
- Vite ahora escucha en `127.0.0.1` (`vite.config.ts`); `localhost` sigue funcionando.
- La vinculación tiene que iniciarse en esa misma dirección: abierta desde `localhost`, Configuración deshabilita el botón y explica a dónde ir.
- La sesión de Junkbox se guarda por dirección, así que en `127.0.0.1` hay que iniciar sesión una vez.
- Se configura con `VITE_SPOTIFY_CLIENT_ID` y, si se usa otra dirección, con `VITE_SPOTIFY_REDIRECT_URI`. En el panel de Spotify hay que registrar la URL de retorno y, con la app en Development Mode, añadir la cuenta en "User Management".

**Configuración · "Tu cuenta de música":**
- **Sin vincular:** "Spotify no vinculado" y el botón de Figma.
- **Vinculado:** "Vinculado como <nombre>", con el icono `circle-check`, y "Desvincular Spotify" con el mismo botón (Figma solo dibuja el estado sin vincular; propuesta).
- **Cuenta no Premium:** avisa que se necesita Premium para reproducir.
- **Sin Client ID o fuera de `127.0.0.1`:** el botón se deshabilita con una nota que explica por qué.

**Estructura:**

```
features/player/
├── models/spotify.ts                    # Client ID, URL de retorno, permisos, tipos
├── infrastructure/spotifyApi.ts         # accounts.spotify.com (token) y /v1/me
├── infrastructure/spotifyTokenVault.ts  # refresh token cifrado (AES-GCM, clave no extraíble)
├── services/spotifyAuthService.ts       # PKCE: vincular, completar, renovar, desvincular
├── infrastructure/spotifyPlaybackSdk.ts # carga del Web Playback SDK y sus tipos
├── models/player.ts                     # estado del reproductor y reglas
├── controllers/useSpotifyLink.ts        # estado para Configuración
├── controllers/playerContext.ts         # usePlayer()
├── controllers/PlayerProvider.tsx       # SDK, reproducción y estado global
└── views/                               # SpotifyCallbackPage, MiniPlayer, PlayerControls, PlayerSheet
```

**Verificación (2026-11-13):**

| Prueba | Resultado |
|---|---|
| `pnpm typecheck` · `pnpm lint` | Correcto |
| Vite en `127.0.0.1:5173` y en `localhost:5173` | Responden las dos |
| Configuración desde `localhost` | Botón deshabilitado con la nota "Para vincular, abre Junkbox en http://127.0.0.1:5173…" |
| Configuración desde `127.0.0.1` → "Vincular" | Lleva al inicio de sesión de Spotify con `client_id`, `redirect_uri` registrada, permisos, `code_challenge_method=S256` y `state` (Spotify aceptó la URL de retorno) |
| `/spotify/callback?error=access_denied` | "Cancelaste la vinculación con Spotify." |
| `/spotify/callback` con un `state` inventado | "La vinculación no es válida o caducó…" |
| Vinculación completa con una cuenta real | Correcto (probada por el propietario). Primero falló con "redirect_uri: Not matching configuration" porque la URL de retorno no estaba registrada en el panel de Spotify; Spotify la comprueba después de iniciar sesión, por eso la prueba sin cuenta no lo detectó |
| Volver con "Atrás" desde Spotify | El botón vuelve a "Vincular Cuenta de Spotify" (antes se quedaba en "Abriendo Spotify…" por la caché de páginas del navegador; se reinicia en `pageshow`) |

### 11.2 Reproductor (SDK y MiniPlayer)

**Cómo suena:**
- Se usa el **Web Playback SDK** de Spotify (`https://sdk.scdn.co/spotify-player.js`, cargado una sola vez): Junkbox aparece como un dispositivo de Spotify llamado "Junkbox".
- Cuando el dispositivo está listo se transfiere la sesión de Spotify a él (`PUT /v1/me/player` con `{ device_ids: [id], play: false }`), para que Spotify lo registre.
- La canción se pide con `PUT /v1/me/player/play?device_id=` y `{ uris: ["spotify:track:<id>"] }`. Si Spotify responde "Device not found" (`404`), se reintenta hasta 3 veces (0,8 s, 1,6 s y 3,2 s).
- Si Spotify da el dispositivo por desconectado (`not_ready`), se descarta el reproductor y el siguiente "reproducir" crea uno nuevo, para no tener dos a la vez.
- **Solo funciona con Spotify Premium** (lo exige el SDK) y en navegadores con DRM (Chrome, Edge, Firefox; no en navegadores sin Widevine).
- Los tipos del SDK están escritos a mano (`infrastructure/spotifyPlaybackSdk.ts`), sin dependencias nuevas.

**Reglas del propietario (2026-11-13):**
- Una sola canción: la que elige el usuario.
- **Atrás** (skip-back): la barra se vacía al instante y la canción vuelve a sonar desde 0, aunque estuviera en pausa o terminada.
- **Adelante** (skip-forward): la termina; la barra se llena y queda en pausa al final. "Reproducir" la vuelve a empezar.
- **Barra de tiempo arrastrable** (2026-11-13): un control deslizante (`<input type="range">`) con el grosor de Figma (2 px en móvil, 3 en escritorio, 4 en la vista ampliada) y una zona de 12 px para pulsar. El avance va en el **color de acción** (negro en claro, #D3533C en oscuro; decisión del propietario) sobre `line`. Al arrastrar muestra la posición y la aplica al soltar (`seek`); con el teclado, flechas de ±5 s. Si la canción había terminado, queda en pausa en la posición elegida.
- **Volumen** de 0 a 100 que empieza siempre en 50.
- **La X** detiene y oculta el reproductor.
- Al terminar sola, la canción queda al final, en pausa.

**Dónde se puede reproducir:**
- el play-circle de las filas (Buscador, ficha de álbum y de artista);
- el QuickPlay de las tarjetas de Inicio, que deja de ser decorativo (`MusicCard` · `onPlay`, con `z-[1]` sobre el enlace de la tarjeta);
- un botón nuevo en la ficha de canción: círculo de 44 con el "play" de QuickPlay, antes de "Calificar / Reseñar". No está en Figma; aprobado. En móvil, con este botón, "Reproducir en Spotify" se acorta a "Spotify" para que quepa la fila.

**Arquitectura** (decisión del propietario: módulo `features/player` con proveedor propio):
- `PlayerProvider` vive en `src/app/App.tsx`, dentro de `AuthProvider` y por encima de las rutas: la música sigue al cambiar de pantalla y se desconecta (y el reproductor se oculta) al cerrar sesión o cambiar de usuario. Sin sesión queda inactivo. El `MiniPlayer` se dibuja en `AppLayout`. Al principio envolvía `AppLayout`, pero Inicio (`/`) y el resto de pantallas usan **dos instancias distintas** de `AppLayout` (`HomeRoute` y las rutas protegidas), así que la música se cortaba al pasar de una a otra (corregido el 2026-11-13, decisión del propietario).
- Las vistas usan `usePlayer()` (`controllers/playerContext.ts`, el mismo patrón que `authContext`).
- El proveedor crea el reproductor del SDK la primera vez que se reproduce. `getOAuthToken` pide el token a `spotifyAuthService.getAccessToken`, que lo renueva solo. Comprueba una vez si la cuenta es Premium (`GET /v1/me` · `product`).
- La posición se lee del SDK dos veces por segundo mientras suena.
- El fin de la canción se detecta cuando Spotify pausa y vuelve la posición a 0 cerca del final.

**MiniPlayer** (Figma · MiniPlayer 14296:15106):

| | Móvil (MiniPlayer-04, 14296:14924) | Escritorio (MiniPlayer-03, 14296:14648) |
|---|---|---|
| Alto | 62 (60 + progreso de 2) | 76 |
| Contenido | Artwork 36, título (13 SemiBold) y artista (11), pausa 24, chevron-up 20, x 16 | Artwork 44, título y artista (260 desde `lg`), skip-back 20, pausa 24, skip-forward 20, tiempos (11), progreso de 3 px, volume-2 20, chevron-up, x |
| Posición | Pie fijo, encima de la BottomBar | Pie fijo |

**Fuera de Figma** (propuestas aprobadas el 2026-11-13):
- En pausa se muestra el "play" de QuickPlay a 24 px, porque Figma solo dibuja la pausa.
- En escritorio, junto a volume-2, un control deslizante de volumen.
- **Aviso** en la barra del reproductor cuando no hay vinculación ("Vincula tu cuenta de Spotify Premium en Configuración para reproducir.", con enlace a Configuración), cuando la cuenta no es Premium o cuando Spotify falla. Se cierra con la X.
- **Vista ampliada** (`PlayerSheet`), que abre la flecha: pantalla completa en móvil y panel centrado en escritorio. Contiene la carátula grande, título, artista, progreso con tiempos, atrás, reproducir/pausa y adelante, y el volumen. Escape o la flecha la cierran.

**Un solo dispositivo por cuenta** (2026-11-15, decisión del propietario):
- Spotify solo deja sonar un dispositivo a la vez por cuenta, y cada pestaña de Junkbox es un dispositivo distinto. Es el comportamiento normal de Spotify; pasa igual con el teléfono o la app.
- **Antes de reproducir** se consulta `GET /v1/me/player` (scope `user-read-playback-state`, que ya se pedía). Si suena en otro dispositivo, la barra del MiniPlayer pregunta: "Ya tienes música sonando en otra pestaña de Junkbox | «nombre del dispositivo». ¿Quieres cambiarla a esta pestaña?", con **"Cambiar aquí"** y **"Cancelar"** (botones pequeños de Figma; el aviso no está en Figma).
  - "Cambiar aquí" reproduce sin volver a preguntar.
  - "Cancelar" deja la música donde estaba; aquí el MiniPlayer **sigue a la vista, en pausa**, con la canción pedida (decisión del propietario, 2026-11-15). Si esta pestaña aún no había sonado, los datos se piden a Spotify (`GET /v1/tracks/{id}`).
  - Si la consulta falla, se reproduce sin preguntar.
  - Mientras esta pestaña no sea el dispositivo activo (porque se canceló o porque otro tomó la música), "reproducir" y "atrás" del MiniPlayer vuelven a pedir la canción, y por tanto a preguntar; "adelante" y la barra no hacen nada. Antes, pulsar "reproducir" tras "Cancelar" daba error, porque se le pedía al reproductor local, que ya no era el activo (corregido el 2026-11-15).
- **La pestaña que pierde la música** (el SDK manda un estado vacío) conserva el MiniPlayer con la canción **en pausa** (decisión del propietario, 2026-11-15; antes mostraba un aviso).

**Abrir la ficha desde el reproductor** (2026-11-15, petición del propietario): en el MiniPlayer (móvil y escritorio) la carátula, el título y el artista forman un enlace a la ficha de la canción (`/cancion/:id`), con `aria-label="Abrir la ficha de <título>"`. En la vista ampliada, la carátula y el título hacen lo mismo y además cierran la vista. Mientras se prepara el reproductor o hay un aviso no hay enlace. La música sigue sonando al navegar.

La canción del reproductor puede no estar en el catálogo de Junkbox: por ejemplo, si se cambió desde la app de Spotify, o porque Spotify informa otra versión de la misma canción con otro ID. Como la ficha solo lee la base (`GET /music/tracks/{id}`), mostraba "No encontrado" (corregido el 2026-11-15).
- Al pulsar, `useOpenSongPage` → `resolveCatalogSongId` (`features/player/services/catalogLink.ts`) comprueba primero ese ID.
- Si da 404, busca por título y primer artista (`GET /music/search?type=track`, que trae la canción de Spotify y la guarda) y abre el mismo ID o el resultado con el mismo título y artista.
- Si nada coincide, abre el ID original.
- Ctrl/Cmd o el clic central conservan el comportamiento normal del enlace.
- Verificado con "Mr. Brightside": el ID que da Spotify (`3n3Ppam7…`) da 404 y la búsqueda encuentra la versión del catálogo (`2RvbnvBX…`), cuya ficha abre.

**Recursos de Figma** (`src/assets/icons`): `skip-back-20.svg`, `pause-24.svg`, `skip-forward-20.svg`, `volume-2-20.svg` y `chevron-up-20.svg`; se reutilizan `x-16.svg` y `play-14.svg`.

**Accesibilidad:**
- El reproductor es una región "Reproductor" con botones etiquetados: "Reiniciar canción", "Pausar"/"Reproducir", "Terminar canción", "Ampliar reproductor", "Cerrar reproductor".
- El progreso es un `progressbar` con el tiempo en texto ("0:58 de 3:24").
- El volumen es un control deslizante nativo.
- La vista ampliada es un `dialog` modal que recibe el foco.

**Importante en desarrollo:** la vinculación se guarda por dirección. Si se vinculó en `http://127.0.0.1:5173`, hay que usar Junkbox en esa dirección para reproducir; en `localhost` el reproductor no la ve y muestra el aviso.

**Verificación (2026-11-13):**

| Prueba | Resultado |
|---|---|
| `pnpm typecheck` · `pnpm lint` | Correcto |
| Botones de reproducir: Inicio (8: tarjetas y QuickPlay), Buscador "Hoke" (5), ficha de canción (1) | Presentes y activos |
| Reproducir sin vinculación (navegador de prueba) | Aviso con "Ir a Configuración" → `/configuracion` |
| X del reproductor | Lo oculta |
| Ficha de canción en 390 y 1440 | La fila de acciones cabe sin salirse |
| Consola | Sin errores |
| Reproducción real (SDK, Premium) | **Pendiente de probar por el propietario**: el navegador de prueba no tiene la cuenta ni DRM |
| (Correcciones) `pnpm typecheck` · `pnpm lint` | Correcto |
| (Correcciones) Persistencia al navegar, "Device not found", barra arrastrable, adelante y atrás | **Pendiente**: el backend no respondía (`/healthz` sin respuesta, proxy 502), así que no se pudo iniciar sesión en el navegador de prueba; lo prueba el propietario |

---

## 12. Módulo 10: Perfil

### 12.1 Pantallas de Figma

| Pantalla | Móvil | Escritorio |
|---|---|---|
| Perfil Público · Claro | `14244:52670` | `14244:52870` |
| Perfil Público · Oscuro | `14263:24037` | `14263:24255` |
| Historial de Calificaciones · Claro | `14244:53034` | `14244:53191` |
| Historial de Calificaciones · Oscuro | `14263:24437` | `14263:24605` |

**Componentes:**
- `ProfileHeader` (14296:12528 / 14296:12656) y `ProfileStat`;
- `Tabs` (14296:15934): "Mis Reseñas" e "Historial de Calificaciones";
- en "Mis Reseñas", `ReviewCard` y el panel "Suena mucho por aquí" (`ProfileListening`);
- en el historial, `RatingRecord` y "Una vida en canciones" (`RatingSummary`).

**Decisiones del propietario (2026-11-15):**
- Por ahora solo **mi perfil**; los perfiles de otros usuarios esperan al backend.
- **Sin bio** (como en Configuración) y **sin "Seguir"** en el propio perfil.
- Los **4 contadores** con "—".
- "Historial de Calificaciones" como **plantilla vacía**: se descartó un historial parcial.
- Lo que no tiene backend se muestra como plantilla con "Pendiente del backend" (PROF-01 a PROF-04).

### 12.2 Rutas y Estructura

- `/perfil` (`features/profile/models/profile.ts` · `PROFILE_PATH`), dentro de `ProtectedRoute` → `AppLayout`.
- "Perfil" de la Navbar y de la BottomBar deja de estar deshabilitado (`navigation.ts` · `PROFILE_ITEM.to`) y se marca activo con `aria-current`.
- La pestaña vive en la URL: `/perfil` (Mis Reseñas) y `/perfil?tab=calificaciones` (Historial). Se puede compartir, y "atrás" vuelve a la pestaña anterior.
- El engrane de la barra superior lleva a `/configuracion`.
- **Seguidores y seguidos** (2026-11-15): `/perfil/seguidores` y `/perfil/seguidos` (`connectionsPath`). Es una página con dos pestañas en la que la ruta decide la activa; cambiar de pestaña reemplaza la entrada del historial.
- "Perfil" de la Navbar y la BottomBar sigue activo en `/perfil/seguidores` y `/perfil/seguidos`: `NavTarget` solo exige coincidencia exacta para Inicio (`/`) (2026-11-15).
- **Perfil de otra persona** (2026-11-15): `/usuario/:username` (`USER_PROFILE_PATH`) y sus listas `/usuario/:username/seguidores|seguidos`. Si `:username` es el mío, redirige a `/perfil` (o a mis listas).

```
features/profile/
├── models/profile.ts                 # ruta, pestañas, tipos de contadores, "En Junkbox desde…"
├── controllers/useProfileController.ts
└── views/
    ├── ProfilePage.tsx               # mi perfil y el de otra persona: barra, cabecera, contadores, pestañas
    ├── ProfileTabs.tsx               # Tabs (botones o enlaces), "Mis Reseñas", "Historial", paneles laterales
    ├── ConnectionsPage.tsx           # Seguidores / Seguidos
    ├── UserCard.tsx                  # SuggestedUser de Figma (lista de FOL-02)
    └── FollowButton.tsx              # Button Variant=Follow, deshabilitado hasta FOL-01
```

### 12.3 Contrato con el Backend

| Dato | Endpoint | Estado |
|---|---|---|
| Avatar, nombre, @usuario y fecha de alta | `GET /auth/me` (ya cargado por `AuthProvider`) | Disponible |
| Mis reseñas | — | **PROF-01** |
| Mis calificaciones | — | **PROF-02** |
| Contadores, media personal y cinco estrellas | — | **PROF-03** |
| "Suena mucho por aquí" | — | **PROF-04** (por definir con Producto) |
| Seguir y dejar de seguir | — | **FOL-01** |
| Seguidores y seguidos | — | **FOL-02** |
| Perfil de otra persona | — | **PROF-05** |

### 12.4 Decisiones de Implementación

1. **Cabecera:**
   - avatar de 64 (móvil) o 96 (escritorio), con el robot por defecto de respaldo (§5.2);
   - nombre visible en Heading/24 o 32 Bold, o el @usuario si no tiene nombre;
   - @usuario en Body/14 y text/secondary-2.
2. **Contadores:**
   - valor en Title/20 Bold y etiqueta en Caption/11;
   - repartidos a lo ancho en móvil y con separación de 48 en escritorio;
   - "—" mientras `null`.
3. **Pestañas:**
   - alto 44, separación 24 y borde inferior `line`;
   - la activa en SemiBold con color `link` y subrayado de 2 px en el color de acción (negro en claro, naranja en oscuro); la inactiva en text/secondary-2;
   - patrón ARIA tabs con flechas.
4. **Encabezado de la lista:** Title/18 SemiBold, sin número porque no se conoce el total, y "Más recientes⌄" deshabilitado ("Recientes" en móvil, como en Figma).
5. **Paneles laterales:**
   - Figma solo los dibuja en escritorio: `surface-input-disabled`, padding 24, separación 20 y 336 de ancho.
   - Desde 1280 px van a la derecha. Entre 768 y 1279 px van debajo, porque no caben, igual que en Configuración. En móvil no se muestran.
   - "Una vida en canciones" lleva el icono `watch-history-18.svg` (descargado de Figma) en un recuadro de 24, los dos totales con "—" y `StarRating` en 0.
6. **Recursos de Figma** (`src/assets/icons`): `settings-20.svg` y `watch-history-18.svg`, pintados con `MaskIcon`.
7. **Seguidores y seguidos** (decisión del propietario, 2026-11-15; no está en Figma):
   - las etiquetas "Seguidores" y "Seguidos" de los contadores son enlaces que cubren todo el contador;
   - del mismo modo, "Reseñas" y "Calificaciones" llevan a su pestaña (`?tab=calificaciones`), con `aria-current` en la que está abierta (decisión del propietario, 2026-11-15);
   - la página reutiliza la cabecera de Configuración (flecha atrás que lleva al perfil de origen + título "Mis conexiones" o "@usuario") y las mismas Tabs del perfil, ahora genéricas (`ProfileTabList` recibe sus pestañas; con `to` son enlaces);
   - cada persona se mostrará con `UserCard`, la tarjeta SuggestedUser de Inicio (Figma 14244:50679): avatar 36, nombre Body/14 SemiBold, @usuario Caption/12 y el botón "Seguir" (Button Variant=Follow 14296:3462). Toda la tarjeta abre su perfil y el botón queda por encima, como en `MusicRow`;
   - hasta FOL-02 cada pestaña muestra el estado "Pendiente del backend".
8. **Perfil de otra persona** (plantilla hasta PROF-05):
   - robot por defecto como avatar y "@usuario" como nombre;
   - "Seguir" a la derecha (mismo Button Variant=Follow), deshabilitado hasta FOL-01;
   - sin engrane ni "En Junkbox desde"; pestañas "Reseñas" y "Calificaciones";
   - nota "Pendiente del backend: aún no se puede consultar el perfil de otros usuarios.". No se comprueba si la persona existe.

### 12.5 Accesibilidad

- Un `<h1>` con el nombre y un `<h2>` por sección.
- Contadores y totales como lista de definiciones (`dl`); el "—" se lee como "sin datos".
- Pestañas con `role="tablist"`/`tab`/`tabpanel`, `aria-selected`, `aria-controls`, foco itinerante y flechas izquierda/derecha.
- El engrane es un enlace con `aria-label="Configuración"`.
- En Seguidores / Seguidos las pestañas son enlaces con `role="tab"` y `aria-selected`; la flecha es un enlace con `aria-label="Volver al perfil"`.
- "Seguir" lleva `aria-disabled`, `aria-label="Seguir a …"` y un `title` que explica por qué no funciona.
- Los paneles laterales son `aside` etiquetados.

### 12.6 Limitaciones Conocidas

- Sin listas ni contadores hasta PROF-01 a PROF-03; "Suena mucho por aquí" espera la definición de Producto (PROF-04).
- Seguidores, seguidos y el perfil de otros son plantillas (FOL-01, FOL-02, PROF-05). Se llega a otro perfil desde el autor de las reseñas de las fichas (§7); las sugerencias de Inicio aún no enlazan a él (HOME-05).

### 12.7 Verificación (2026-11-15)

| Prueba | Resultado |
|---|---|
| `pnpm typecheck` · `pnpm lint` | Correcto |
| Capturas con sesión: 1440 claro (Mis Reseñas), 1440 oscuro (Historial), 390 claro y oscuro, 1024 claro | Coinciden con Figma salvo bio, "Seguir" y los datos que faltan |
| "Perfil" en Navbar y BottomBar | Activo (`aria-current="page"`) |
| Flecha derecha en las pestañas | Cambia a "Historial de Calificaciones", mueve el foco y pone `?tab=calificaciones` |
| "Atrás" del navegador | Vuelve a "Mis Reseñas" (`/perfil`) |
| Engrane | Lleva a `/configuracion` |
| Consola | Sin errores |

---

## 13. Verificación

Antes de cerrar cualquier módulo:

```bash
pnpm typecheck
pnpm lint
pnpm build
```

Además: probar las rutas del módulo con el backend en marcha (`pnpm dev`), revisar móvil y escritorio en los dos temas, y comparar con los frames de Figma.

> Aún no hay framework de tests unitarios. Se añadirá cuando un módulo tenga lógica que lo justifique.

---

## 14. Historial

| Fecha | Cambio |
|---|---|
| 2026-11-02 | Creación del proyecto (Vite + React + TS + Tailwind v4, pnpm). Fundamentos (tokens, tema, cliente HTTP, proxy). Módulo 1: Autenticación. |
| 2026-11-02 | Login: el `401` muestra «Usuario o contraseña incorrectos.» en lugar del «credenciales inválidas» del backend. |
| 2026-11-03 | Registro: la validación de la contraseña replica la nueva regla del backend (`validatePassword`: ≥ 8 caracteres, ≤ 72 bytes, letras + números + especiales). Texto de ayuda provisional hasta que Figma se actualice. |
| 2026-11-03 | El backend ya tiene CORS: se documenta (§2.5, §3.8, README, `.env.example`). El proxy de Vite sigue siendo el modo por defecto; no cambia el comportamiento. |
| 2026-11-04 | Módulo 2: Inicio (§4). Estructura común (`AppLayout`, Navbar, BottomBar), "Hecho para tus oídos" con plantilla, menú de cuenta provisional, favicon y renovación compartida del access token. Tokens `surface-nav`, `surface-quickplay` y `text-caption-2xs`. Se elimina `SessionPlaceholderPage`. |
| 2026-11-06 | Autenticación: recuperación de contraseña (`/recuperar-contrasena`, `/restablecer-contrasena`) y verificación de correo (`/verificar-correo`) con los endpoints del commit `51ec315` del backend (§3.10). "¿Olvidaste tu contraseña?" pasa a ser un enlace. `email_verified` en `UserProfile`. |
| 2026-11-06 | Módulo 3 · Cuenta (§5): menú del avatar con tarjeta, "Configuración" y "Cerrar sesión"; avatar robot por defecto; casilla de términos solo en el cuadro; páginas `/terminos` y `/privacidad` (propuesta LFPDPPP). |
| 2026-11-06 | Inicio: carátulas con el álbum de cada canción fijado en la plantilla (§4.3). Tipos y adaptador de música pasan a `features/music/`. |
| 2026-11-06 | Módulo 4 · Buscador (§6): `/buscar?q=` y buscador de la Navbar con las 4 mejores sugerencias. Componentes `MusicRow`, `SecondaryButton`, `StarRating`; token `fg-soft`. |
| 2026-11-06 | Módulo 5 · Fichas (§7): `/cancion`, `/album`, `/artista` con cascada del catálogo (`catalogService`), `useLoad`, `ReviewCard`, enlaces a Spotify. El cliente HTTP admite `PUT`/`DELETE`. |
| 2026-11-06 | Módulo 6 · Calificaciones y Reseñas (§8): `/resena/nueva`, estrellas de 0,5 (`StarRatingInput`), publicar/editar/quitar/eliminar y "Tu calificación" en las fichas. |
| 2026-11-10 | Documentación de los módulos 3–6. Se restaura `.env.example` (borrado en el commit `9e0ee3e`) con `VITE_SPOTIFY_CLIENT_ID` y el modo Kubernetes del backend (commit `2d05563`, API en el puerto 80; sin cambios de contrato). |
| 2026-11-11 | Módulo 7 · Landing (§9): `/` sin sesión con logo, eslogan, botones a `/register` y `/login` y portadas en carrusel (filas alternas en escritorio, dos carriles en móvil). `HomeRoute`; `ProtectedRoute` lleva a `/`. Animaciones `marquee-x/y`. |
| 2026-11-11 | Login: el campo indica que se puede entrar con correo o nombre de usuario ("Correo o nombre de usuario"), a petición del propietario. AUTH-05 pasa a Diseño. |
| 2026-11-11 | Figma al día con la app: etiqueta "Correo o nombre de usuario" en `LoginForm` y nueva ayuda de contraseña en `RegisterForm`; pantallas nuevas en Interfaces (recuperación y verificación, Términos, Privacidad, Landing, menú de la cuenta y sugerencias del buscador; §3, §5, §6.4, §9.1). `SOLICITUDES_BACKEND.md` queda solo con peticiones al backend. |
| 2026-11-12 | Revisión del backend (commits `9e0794d`, `560b33f`, `4855a38`): AUTH-03, AUTH-06 y HOME-02 resueltas. Registro: envía `terms_accepted` con el valor de la casilla y `EMAIL_PATTERN` admite TLD en punycode, como el backend. Se quitan los emojis de la documentación (regla del proyecto). |
| 2026-11-12 | Carátulas desde `album_image_url`/`artist_image_url` de `Track` (HOME-02): Inicio deja de fijar el álbum de cada canción en la plantilla, el Buscador y las sugerencias dejan de cruzar canciones con álbumes, la ficha de artista usa la portada de cada canción y Escribir Reseña ya no pide el álbum aparte. Las 8 canciones de la plantilla se enlazaron en el backend buscándolas una vez. |
| 2026-11-12 | Buscador: la espera antes de buscar baja de 300 a 150 ms en la barra y de 400 a 250 ms en `/buscar`. Medido en el navegador (escritorio, consultas ya guardadas): de 340–680 ms a 240–280 ms hasta ver resultados. La petición de canciones sigue siendo la más lenta en consultas nuevas (0,4–0,6 s, consulta a Spotify en el backend). |
| 2026-11-13 | Landing: 80 portadas elegidas por el propietario (más chicas en escritorio), móvil a pantalla completa con 40 al azar por visita y la misma opacidad y máscara que escritorio, y easter egg "TRAP STORY" si el sorteo (1–137 500) da 67 (§9). |
| 2026-11-13 | Landing (escritorio): 8 filas que cruzan la pantalla de lado a lado a −8° en un solo bloque, con portadas que escalan para cubrir todo el fondo sin huecos; se ven siempre las 4 filas de arriba y las 4 de abajo (§9.4). |
| 2026-11-13 | Módulo 8 · Configuración (§10): `/configuracion` desde el menú del avatar, con "Tu cuenta de música" (Spotify deshabilitado hasta su módulo), frecuencia de recomendaciones (PREF-01) e "Información pública" sin "Bio musical", con correo y "Cambiar contraseña" (enlace por correo). Guardar el perfil queda pendiente (USER-01). |
| 2026-11-13 | Configuración: "Cambiar contraseña" se bloquea 5 s tras cada clic (el backend limita a 3 enlaces por hora) e "Información pública" va primero entre 768 y 1279 px (§10.4). |
| 2026-11-13 | Botón de tema `ThemeToggle` (sol/luna, iconos de Lucide): en la Navbar a la derecha del avatar y en Iniciar sesión y Registrarse; recuerda la elección (`localStorage`) y la aplica antes de pintar (§2.3). La landing no lo lleva. Verificado: cambia a oscuro, se mantiene al recargar, "Buscar música" cabe a 390 px y sin errores en consola. |
| 2026-11-13 | Corrección: el botón de reproducir de `MusicRow` se sobreponía a la Navbar al desplazarse (los dos tenían `z-10` y la fila va después). Pasa a `z-[1]`, y la lista de sugerencias de Escribir Reseña de `z-20` a `z-[5]`. Verificado en `/buscar` (móvil): con el código anterior el botón quedaba encima del header en 45 de 45 posiciones; ahora el header queda encima en 45 de 45, y el botón visible sigue respondiendo al clic. |
| 2026-11-13 | Módulo 9 · Spotify, paso 1 (§11.1): vinculación con PKCE desde Configuración (`features/player`), refresh token cifrado con AES-GCM y clave no extraíble en IndexedDB, access token solo en memoria, `/spotify/callback`; se borra al cerrar sesión o desvincular. Vite escucha en `127.0.0.1` para la URL de retorno de Spotify. |
| 2026-11-13 | Módulo 9 · Spotify, paso 2 (§11.2): reproductor con el Web Playback SDK (`PlayerProvider`, `usePlayer`) y MiniPlayer de Figma al pie de las pantallas con sesión, con aviso sin Premium y vista ampliada. Reproducir desde filas, tarjetas de Inicio y la ficha de canción. Atrás reinicia, adelante termina, volumen 0–100 desde 50. |
| 2026-11-13 | Reproductor: `PlayerProvider` pasa a `App.tsx` (la música se cortaba al pasar entre Inicio y otras pantallas, que usan instancias distintas de `AppLayout`). Contra "Device not found": transferencia al dispositivo y hasta 3 reintentos. La barra de tiempo es arrastrable y va en el color de acción; "Adelante" la llena y "Atrás" la vacía y vuelve a sonar desde 0 (§11.2). |
| 2026-11-15 | Módulo 10 · Perfil (§12): `/perfil` con avatar, nombre y @usuario reales, contadores con "—", pestañas "Mis Reseñas" e "Historial de Calificaciones" (`?tab=calificaciones`) y paneles laterales como plantillas (PROF-01 a PROF-04). "Perfil" queda activo en la Navbar y la BottomBar. |
| 2026-11-15 | Reproductor: pulsar la canción (carátula o título) en el MiniPlayer o en la vista ampliada abre su ficha (§11.2). |
| 2026-11-15 | Reproductor: si la música ya suena en otro dispositivo de la cuenta (otra pestaña, el teléfono, la app), la barra pregunta antes de cambiarla ("Cambiar aquí" / "Cancelar"); la pestaña que la pierde avisa que pasó a otro dispositivo (§11.2). |
| 2026-11-15 | Reproductor: al pulsar "Cancelar" o cuando la música pasa a otro dispositivo, el MiniPlayer sigue a la vista con la canción en pausa; "reproducir" vuelve a preguntar si se quiere cambiar a esta pestaña (§11.2). |
| 2026-11-15 | Reproductor: al pulsar la canción, si su ID no está en el catálogo (cambiada desde la app de Spotify u otra versión), se busca por título y artista y se abre la ficha correcta en lugar de "No encontrado" (§11.2). |
| 2026-11-15 | Perfil: los contadores Seguidores y Seguidos abren su página con dos pestañas (`/perfil/seguidores`, `/perfil/seguidos`); nuevo perfil de otra persona `/usuario/:username` y sus listas, como plantillas (FOL-01, FOL-02, PROF-05) (§12). |
| 2026-11-15 | Perfil: los contadores "Reseñas" y "Calificaciones" también llevan a su pestaña (§12). |
| 2026-11-15 | Fichas: el avatar y el nombre del autor de cada reseña abren su perfil (`/usuario/:username`); en `ArtistReviewCard`, "Nombre · @usuario" (§7, §12). Verificado con una reseña temporal, borrada al terminar. |
| 2026-11-15 | Reseñas: nueva Reseña Completa (`/resena/:id`) con comentarios anidados (sangría hasta 3 niveles) y Me gusta como plantillas; las tarjetas solo tienen Me gusta y Comentarios (sin Guardar ni "más opciones"); "Comentarios" abre la reseña (§8.8). |
