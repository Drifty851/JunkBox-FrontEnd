# Junkbox Frontend

Frontend web de **Junkbox**: plataforma de reseñas musicales, calificaciones (1 a 5 estrellas), red social y recomendaciones personalizadas.

Está construido con **React 19 + TypeScript (estricto) + Tailwind CSS v4** sobre **Vite**, con arquitectura **MVC por capas y por módulos**. Consume la API REST del backend en Go (`junkbox-backend`), que se mantiene en un repositorio aparte.

El diseño de referencia es **Figma** (archivo `KQPRPnqGUA7udlAjw8s5fo`). La estrategia es **Mobile First** con temas **Claro y Oscuro**.

El detalle técnico de cada módulo está en [`implementacion.md`](implementacion.md).

---

## Requisitos

| Herramienta | Versión | Verificar |
|---|---|---|
| Node.js | ≥ 22 (probado con 24) | `node -v` |
| pnpm | 11.x (`packageManager` en `package.json`) | `pnpm -v` |
| Backend Junkbox | En ejecución en `http://localhost:8080` | `curl http://localhost:8080/healthz` → `ok` |

> **Gestor de paquetes:** el proyecto usa **pnpm**. No uses `npm install` (crearía un `package-lock.json` distinto a `pnpm-lock.yaml`).
> Si no tienes pnpm: `corepack enable` (incluido con Node) o `npm i -g pnpm` una sola vez.

---

## Puesta en marcha rápida

```bash
pnpm install
cp .env.example .env.local     # opcional: los valores por defecto ya funcionan en local
pnpm dev                       # http://localhost:5173
```

Abre `http://localhost:5173/`: sin sesión verás la landing, con enlaces a registro e inicio de sesión.

---

## Conexión con el backend

El backend es un servicio en Go que se ejecuta aparte (en este equipo, dentro de **WSL Debian**). Para levantarlo, consulta su `README.md` (`make db-up`, `make run-server`, …). **Este repositorio no modifica el backend.**

- **Base de la API:** `/api/v1` (README del backend, §API REST).
- **Proxy de desarrollo (por defecto):** en `pnpm dev`, Vite redirige `/api/*` a `VITE_BACKEND_URL` (por defecto `http://localhost:8080`), así el navegador ve un solo origen y funciona aunque Vite use otro puerto. WSL2 expone el puerto del backend en el `localhost` de Windows.
- **Kubernetes:** el backend lo quitó (commit `1c7b308`, 2026-11-16) y volvió a escuchar en el puerto 8080. Si tu `.env.local` tiene `VITE_BACKEND_URL=http://localhost` o `http://localhost:80`, cámbialo a `http://localhost:8080`: con el puerto 80 todas las llamadas a la API dan `404`.
- **Migraciones:** si el backend responde `500 "error interno"` en rutas que antes funcionaban (por ejemplo `GET /reviews` o `/feed`), probablemente le faltan migraciones. Las aplica quien mantiene el backend; el frontend no ejecuta `make` ni `goose`.
- **CORS del backend:** el backend acepta peticiones del navegador desde los orígenes de su variable `CORS_ALLOWED_ORIGINS` (por defecto `http://localhost:5173`), con `GET`, `POST`, `PUT`, `DELETE` y `OPTIONS`, las cabeceras `Authorization` y `Content-Type`, y sin cookies. Para saltar el proxy, pon `VITE_API_BASE_URL=http://localhost:8080/api/v1`. Cualquier otro origen se rechaza.
- **Usuarios de prueba:** con `make seed-up` en el backend se crean 4 usuarios con la contraseña `Password123!`, por ejemplo `cesar@junkbox.local`.

### Variables de entorno

| Variable | Por defecto | Uso |
|---|---|---|
| `VITE_API_BASE_URL` | `/api/v1` | Base de la API que usa el navegador. Relativa: pasa por el proxy (desarrollo) o por el mismo origen (producción). Absoluta (`https://…/api/v1`): llamada directa usando el CORS del backend. |
| `VITE_BACKEND_URL` | `http://localhost:8080` | Solo en desarrollo: destino del proxy de Vite. |
| `VITE_SPOTIFY_CLIENT_ID` | — | Client ID **público** de la app de Spotify (PKCE, sin secreto) para vincular Spotify Premium desde Configuración. En el panel de Spotify, la Redirect URI debe ser `http://127.0.0.1:5173/spotify/callback` y, para vincular, Junkbox debe abrirse en `http://127.0.0.1:5173` (`implementacion.md` §11.1). |
| `VITE_SPOTIFY_REDIRECT_URI` | La del origen actual (https o `127.0.0.1`); si no, `http://127.0.0.1:5173/spotify/callback` | Solo para fijar una URL de retorno concreta. |
| `VITE_DEV_HTTPS_KEY` · `VITE_DEV_HTTPS_CERT` | — | Solo desarrollo y **temporal**: rutas al certificado de mkcert para servir https y vincular Spotify desde el teléfono (ver "https en desarrollo con mkcert"). |

`.env` y `.env.*` están en `.gitignore`; `.env.example` sirve de plantilla.

---

## Scripts

| Comando | Qué hace |
|---|---|
| `pnpm dev` | Servidor de desarrollo con recarga en caliente y proxy al backend. |
| `pnpm typecheck` | Comprobación de tipos (`tsc -b`, modo estricto). |
| `pnpm lint` | Linter (`oxlint`). |
| `pnpm build` | Typecheck + build de producción en `dist/`. |
| `pnpm preview` | Sirve `dist/` para probar el build. |

> **Build de producción:** el proxy de Vite solo existe en desarrollo. En producción hay dos opciones: servir el frontend desde el mismo origen que el backend (proxy inverso), o definir `VITE_API_BASE_URL` con la URL pública del backend y pedir que el dominio del frontend se añada a su `CORS_ALLOWED_ORIGINS`. Esa variable es configuración del backend: la cambia quien lo mantiene.

---

## Estructura de carpetas

```text
src/
├── main.tsx                 # punto de entrada
├── index.css                # Tailwind v4 + tokens de diseño (Claro/Oscuro) de Figma
├── app/                     # composición: proveedores, router, guardas de ruta
│   ├── App.tsx
│   ├── router.tsx
│   ├── layout/              # AppLayout (Navbar + BottomBar) y destinos de la navegación
│   └── routes/
├── assets/                  # recursos originales exportados de Figma (logo, iconos)
├── shared/                  # piezas reutilizables entre módulos
│   ├── api/                 # cliente HTTP (fetch) y errores de API
│   ├── hooks/               # hooks reutilizables (scroll infinito)
│   ├── layout/              # Navbar, BottomBar, menú de cuenta, reinicio al volver a pulsar Inicio
│   ├── ui/                  # componentes de UI (TextInput, PrimaryButton, MusicCard, Avatar…)
│   └── utils/
└── features/                # un directorio por módulo
    ├── auth/
    │   ├── models/          # Modelo: tipos del contrato y validación
    │   ├── infrastructure/  # adaptadores: endpoints /auth y guardado de la sesión
    │   ├── services/        # casos de uso (login, registro, sesión, renovación del token, logout)
    │   ├── controllers/     # Controlador: contexto de sesión y hooks de cada formulario
    │   └── views/           # Vista: páginas y layout del módulo
    ├── home/
    │   ├── models/          # contrato de GET /home y pestañas del feed
    │   ├── infrastructure/  # adaptador de GET /home
    │   ├── services/        # caso de uso: recomendaciones de Inicio
    │   ├── controllers/     # recomendaciones, sugerencias y feed paginado (scroll infinito)
    │   └── views/           # Inicio, "Hecho para tus oídos", feed y "Conecta por lo que suena"
    ├── social/              # feed, sugerencias de usuarios (y, después, seguir, Me gusta y comentarios)
    ├── music/               # catálogo compartido: tipos, adaptador /music/* y cascada del catálogo
    ├── search/              # Buscador (/buscar) y buscador de la Navbar con sugerencias
    ├── catalog/             # fichas de Canción, Álbum y Artista (rutas, useLoad, vistas)
    ├── reviews/             # Calificaciones y Reseñas (/resena/nueva, /resena/:id con comentarios)
    ├── legal/               # Términos de Servicio y Aviso de Privacidad
    ├── landing/             # landing de `/` sin sesión (portadas fijas en carrusel)
    ├── settings/            # Configuración (/configuracion): cuenta de música, frecuencia e información pública
    ├── player/              # Spotify: vinculación PKCE y reproductor (Web Playback SDK, MiniPlayer)
    └── profile/             # Mi perfil (/perfil), seguidores/seguidos y perfil de otros (/usuario/:username)
```

---

## Probar en el teléfono y en otros navegadores

### Desde un iPhone (o cualquier teléfono) en la misma red Wi-Fi

1. Levanta el frontend escuchando en la red local: `pnpm dev --host`. La opción de la línea de comandos tiene prioridad sobre `server.host` de `vite.config.ts`, así que `http://127.0.0.1:5173` sigue funcionando en la PC.
2. Vite muestra la dirección en la línea `Network`, por ejemplo `http://192.168.1.50:5173`. Ábrela en Safari del iPhone.
3. Si no carga, Windows está bloqueando el puerto: al primer arranque acepta el aviso del firewall para **redes privadas**, o permite el puerto 5173 para Node.js. La red Wi-Fi debe estar marcada como privada en Windows.
4. El backend no se toca: el teléfono solo habla con Vite y el proxy de Vite llama al backend desde la PC (`localhost:8080`), así que tampoco hace falta CORS.

**Spotify en el teléfono y la tableta:** la música suena en la **app de Spotify** del dispositivo y Junkbox la controla con su MiniPlayer (Spotify Connect, `implementacion.md` §11.3). Requiere Premium, la app de Spotify abierta y vincular la cuenta desde el teléfono, lo que necesita **https** (con `http://192.168…` el botón de vincular falla). Lo demás (sesión, Inicio, Buscador, Fichas, Reseñas, Perfil) funciona sin https.

### https en desarrollo con mkcert (TEMPORAL, hasta tener hosting)

Solo hace falta para vincular Spotify desde teléfonos y tabletas. Cuando Junkbox esté publicado con su dominio y https, esta sección se elimina.

1. Instala [mkcert](https://github.com/FiloSottile/mkcert) en Windows y ejecuta `mkcert -install` (crea una autoridad de certificación local).
2. En `FrontEnd/`, genera el certificado con la IP de la PC en la red (`ipconfig`, "Dirección IPv4"): `mkcert -key-file .cert/dev-key.pem -cert-file .cert/dev.pem 192.168.1.50 127.0.0.1 localhost`. La carpeta `.cert/` no se sube a Git.
3. En `.env.local`: `VITE_DEV_HTTPS_KEY=.cert/dev-key.pem` y `VITE_DEV_HTTPS_CERT=.cert/dev.pem`.
4. Instala la autoridad de mkcert en cada teléfono o tableta (el archivo `rootCA.pem` de la carpeta que muestra `mkcert -CAROOT`; envíatelo por correo o AirDrop):
   - **iPhone y iPad:** ábrelo e instala el perfil (Ajustes › General › VPN y gestión de dispositivos), y después actívalo en Ajustes › General › Información › Ajustes de confianza de certificados.
   - **Android:** Ajustes › Seguridad › Más ajustes › Instalar certificado › Certificado de CA. Firefox para Android además necesita "Usar certificados de terceros" (Ajustes › Acerca de › toca 5 veces el logo › Ajustes secretos).
5. Arranca con `pnpm dev --host`. En la PC Junkbox queda en `https://127.0.0.1:5173` y en el teléfono en `https://192.168.1.50:5173`.
6. En el panel de Spotify (Redirect URIs) registra `https://192.168.1.50:5173/spotify/callback` y `https://127.0.0.1:5173/spotify/callback` (con https activo, la de la PC también cambia).

Si la IP de la PC cambia, repite los pasos 2 y 6. Para volver a http, quita las dos variables de `.env.local`.
- **Vista previa en DevTools:** en el iPhone no hay DevTools. Para ver errores de Safari en iPhone hace falta una Mac (Safari › Desarrollo); desde Windows, el modo dispositivo de Chrome, Edge o Brave sirve para revisar el diseño a 390 px.

### Navegadores compatibles

Tailwind CSS v4 fija el mínimo: **Safari 16.4+** (iOS 16.4+), **Chrome/Edge/Brave 111+** y **Firefox 128+**. En navegadores más viejos el diseño se rompe (colores, espaciados). La app no usa nada que dependa de un navegador concreto: las máscaras de iconos llevan también el prefijo `-webkit-` para Safari.

| Navegador | Estado | Notas |
|---|---|---|
| Chrome, Edge | Probado | Navegadores de referencia del proyecto. |
| Brave | Probado (2026-11-19) | Si no cargan carátulas, avatares o Spotify, desactiva los Shields para `127.0.0.1`. El reproductor de Spotify necesita Widevine (Brave pregunta si se activa la primera vez). |
| Firefox | Debería funcionar, sin verificar | El reproductor de Spotify necesita "Reproducir contenido controlado por DRM" activado (Ajustes › General). |
| Safari (Mac y iPhone) | Debería funcionar, sin verificar | En iPhone, Chrome, Firefox y Brave también usan el motor de Safari (WebKit): se comportan igual que Safari. |

---

## Módulos

| Módulo | Rutas | Estado | Endpoints |
|---|---|---|---|
| Landing | `/` (sin sesión) | Implementado (`implementacion.md` §9). 80 portadas fijas elegidas por el propietario; 40 al azar en móvil (LANDING-01) | — |
| Autenticación | `/login`, `/register`, `/recuperar-contrasena`, `/restablecer-contrasena`, `/verificar-correo` | Implementado. El registro envía `terms_accepted` (obligatorio en el backend desde el 2026-11-12) | `POST /auth/login`, `POST /auth/register`, `GET /auth/me`, `POST /auth/refresh`, `POST /auth/logout`, `POST /auth/password/forgot`, `POST /auth/password/reset`, `POST /auth/email/verify` |
| Inicio | `/` (`?feed=siguiendo`), `/recomendaciones` | Implementado con datos del backend (§4.10): recomendaciones, "Ver todo", feed "Para ti (Popular)" y "Siguiendo" con scroll infinito y "Conecta por lo que suena". El logo, "Inicio" y la BottomBar reinician Inicio si ya estás en él. Me gusta y Seguir, pendientes del siguiente módulo | `GET /home`, `GET /feed`, `GET /users/suggestions` |
| Cuenta y legales | `/terminos`, `/privacidad` · menú del avatar | Implementado (§5). Textos legales en revisión | — (avatar por defecto en `POST /auth/register`) |
| Buscador | `/buscar?q=` (`&tipo=usuarios`) · campo de la Navbar | Implementado (§6). Usuarios, plantilla hasta SEARCH-04 (§6.8) | `GET /music/search`, `GET /music/albums/{id}` |
| Fichas del catálogo | `/cancion/:id`, `/album/:id`, `/artista/:id` | Implementado (§7) | `GET /music/tracks\|albums\|artists/{id}`, `GET /music/search` (cascada), `GET /reviews`, `GET /ratings/my` |
| Calificaciones y Reseñas | `/resena/nueva?tipo=&id=`, `/resena/:id` (Reseña Completa) | Implementado (§8). Me gusta y Seguir reales en todas las tarjetas (§8.9). Comentarios todavía como plantilla (el backend ya los tiene: siguiente módulo) | `POST/GET/DELETE /ratings`, `POST/GET/PUT/DELETE /reviews`, `GET /reviews/{id}`, `POST/DELETE /reviews/{id}/like`, `POST/DELETE /users/{id}/follow` |
| Configuración | `/configuracion` · menú del avatar | Implementado (§10). Guardar el perfil y la frecuencia, pendientes del backend (USER-01, PREF-01) | `GET /auth/me`, `POST /auth/password/forgot`, `POST /auth/logout` |
| Spotify y Reproductor | `/spotify/callback` · Configuración · MiniPlayer | Implementado (§11): vinculación PKCE; reproductor con el Web Playback SDK en escritorio y Spotify Connect en teléfonos y tabletas (§11.3), Spotify Premium | `accounts.spotify.com` (PKCE), `GET /v1/me`, `GET/PUT /v1/me/player…` (play, pause, seek, volume, devices) |
| Perfil | `/perfil` (`?tab=calificaciones`), `/perfil/seguidores`, `/perfil/seguidos`, `/usuario/:username` (y sus listas) | Implementado (§12) con plantillas: listas, contadores, seguir y perfiles de otros pendientes del backend (PROF-01 a PROF-05, FOL-01, FOL-02) | `GET /auth/me` |

Los módulos se implementan **uno cada vez**. Las carencias del backend están en `SOLICITUDES_BACKEND.md`.

---

## Tema Claro / Oscuro

El tema sigue la preferencia del sistema (`prefers-color-scheme`). El botón de sol/luna (Navbar, Iniciar sesión y Registrarse) lo cambia y lo recuerda en el navegador (`localStorage`, clave `junkbox.theme`), que se aplica como `data-theme="light"` o `data-theme="dark"` en `<html>` (`implementacion.md` §2.3). Los colores están definidos como tokens en `src/index.css`, cada uno con su variable de Figma de origen.
