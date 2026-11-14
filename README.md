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
- **Backend en Kubernetes** (kind + Envoy Gateway, commit `2d05563` del backend): la API está en el puerto 80. Pon `VITE_BACKEND_URL=http://localhost` en `.env.local`. Los contratos no cambian.
- **CORS del backend:** el backend acepta peticiones del navegador desde los orígenes de su variable `CORS_ALLOWED_ORIGINS` (por defecto `http://localhost:5173`), con `GET`, `POST`, `PUT`, `DELETE` y `OPTIONS`, las cabeceras `Authorization` y `Content-Type`, y sin cookies. Para saltar el proxy, pon `VITE_API_BASE_URL=http://localhost:8080/api/v1`. Cualquier otro origen se rechaza.
- **Usuarios de prueba:** con `make seed-up` en el backend se crean 4 usuarios con la contraseña `Password123!`, por ejemplo `cesar@junkbox.local`.

### Variables de entorno

| Variable | Por defecto | Uso |
|---|---|---|
| `VITE_API_BASE_URL` | `/api/v1` | Base de la API que usa el navegador. Relativa: pasa por el proxy (desarrollo) o por el mismo origen (producción). Absoluta (`https://…/api/v1`): llamada directa usando el CORS del backend. |
| `VITE_BACKEND_URL` | `http://localhost:8080` | Solo en desarrollo: destino del proxy de Vite (`http://localhost` si el backend corre en Kubernetes). |
| `VITE_SPOTIFY_CLIENT_ID` | — | Client ID **público** de la app de Spotify (PKCE, sin secreto) para vincular Spotify Premium desde Configuración. En el panel de Spotify, la Redirect URI debe ser `http://127.0.0.1:5173/spotify/callback` y, para vincular, Junkbox debe abrirse en `http://127.0.0.1:5173` (`implementacion.md` §11.1). |
| `VITE_SPOTIFY_REDIRECT_URI` | `http://127.0.0.1:5173/spotify/callback` | Solo si se registra otra URL de retorno en Spotify. |

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
│   ├── layout/              # Navbar, BottomBar, menú de cuenta
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
    │   ├── data/            # plantilla de canciones recomendadas (IDs de Spotify)
    │   ├── models/          # tipos de la vista
    │   ├── services/        # caso de uso: recomendaciones de Inicio
    │   ├── controllers/     # carga, error y reintento
    │   └── views/           # Inicio y "Hecho para tus oídos"
    ├── music/               # catálogo compartido: tipos, adaptador /music/* y cascada del catálogo
    ├── search/              # Buscador (/buscar) y buscador de la Navbar con sugerencias
    ├── catalog/             # fichas de Canción, Álbum y Artista (rutas, useLoad, vistas)
    ├── reviews/             # Calificaciones y Reseñas (/resena/nueva, /ratings, /reviews)
    ├── legal/               # Términos de Servicio y Aviso de Privacidad
    ├── landing/             # landing de `/` sin sesión (portadas fijas en carrusel)
    └── settings/            # Configuración (/configuracion): cuenta de música, frecuencia e información pública
```

---

## Módulos

| Módulo | Rutas | Estado | Endpoints |
|---|---|---|---|
| Landing | `/` (sin sesión) | Implementado (`implementacion.md` §9). 80 portadas fijas elegidas por el propietario; 40 al azar en móvil (LANDING-01) | — |
| Autenticación | `/login`, `/register`, `/recuperar-contrasena`, `/restablecer-contrasena`, `/verificar-correo` | Implementado. El registro envía `terms_accepted` (obligatorio en el backend desde el 2026-11-12) | `POST /auth/login`, `POST /auth/register`, `GET /auth/me`, `POST /auth/refresh`, `POST /auth/logout`, `POST /auth/password/forgot`, `POST /auth/password/reset`, `POST /auth/email/verify` |
| Inicio | `/` | Base implementada con carátulas (`album_image_url`): crece con los demás módulos (`implementacion.md` §4) | `GET /music/tracks/{id}` |
| Cuenta y legales | `/terminos`, `/privacidad` · menú del avatar | Implementado (§5). Textos legales en revisión | — (avatar por defecto en `POST /auth/register`) |
| Buscador | `/buscar?q=` · campo de la Navbar | Implementado (§6) | `GET /music/search`, `GET /music/albums/{id}` |
| Fichas del catálogo | `/cancion/:id`, `/album/:id`, `/artista/:id` | Implementado (§7) | `GET /music/tracks\|albums\|artists/{id}`, `GET /music/search` (cascada), `GET /reviews`, `GET /ratings/my` |
| Calificaciones y Reseñas | `/resena/nueva?tipo=&id=` | Implementado (§8) | `POST/GET/DELETE /ratings`, `POST/GET/PUT/DELETE /reviews` |
| Configuración | `/configuracion` · menú del avatar | Implementado (§10). Guardar el perfil y la frecuencia, pendientes del backend (USER-01, PREF-01) | `GET /auth/me`, `POST /auth/password/forgot`, `POST /auth/logout` |
| Spotify y Reproductor | `/spotify/callback` · Configuración | Vinculación implementada (§11.1); reproductor pendiente | `accounts.spotify.com` (PKCE), `GET /v1/me` |

Perfil y Spotify/Reproductor se implementarán **un módulo cada vez**. Las carencias del backend están en `SOLICITUDES_BACKEND.md`.

---

## Tema Claro / Oscuro

El tema sigue la preferencia del sistema (`prefers-color-scheme`). El botón de sol/luna (Navbar, Iniciar sesión y Registrarse) lo cambia y lo recuerda en el navegador (`localStorage`, clave `junkbox.theme`), que se aplica como `data-theme="light"` o `data-theme="dark"` en `<html>` (`implementacion.md` §2.3). Los colores están definidos como tokens en `src/index.css`, cada uno con su variable de Figma de origen.
