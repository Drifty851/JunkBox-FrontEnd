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

Abre `http://localhost:5173/login`.

---

## Conexión con el backend

El backend es un servicio en Go que se ejecuta aparte (en este equipo, dentro de **WSL Debian**). Para levantarlo, consulta su `README.md` (`make db-up`, `make run-server`, …). **Este repositorio no modifica el backend.**

- **Base de la API:** `/api/v1` (README del backend, §API REST).
- **Proxy de desarrollo:** el backend **no tiene CORS**. En `pnpm dev`, Vite redirige `/api/*` a `VITE_BACKEND_URL` (por defecto `http://localhost:8080`), así el navegador ve un solo origen. WSL2 expone el puerto del backend en el `localhost` de Windows.
- **Usuarios de prueba:** con `make seed-up` en el backend se crean 4 usuarios con la contraseña `Password123!`, por ejemplo `cesar@junkbox.local`.

### Variables de entorno

| Variable | Por defecto | Uso |
|---|---|---|
| `VITE_API_BASE_URL` | `/api/v1` | Base de la API que usa el navegador. En producción, la URL pública del backend (o `/api/v1` si se sirve desde el mismo origen). |
| `VITE_BACKEND_URL` | `http://localhost:8080` | Solo en desarrollo: destino del proxy de Vite. |

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

> **Build de producción:** como el proxy de Vite solo existe en desarrollo, en producción hace falta servir el frontend desde el mismo origen que el backend (proxy inverso) o que el backend habilite CORS para el dominio del frontend.

---

## Estructura de carpetas

```text
src/
├── main.tsx                 # punto de entrada
├── index.css                # Tailwind v4 + tokens de diseño (Claro/Oscuro) de Figma
├── app/                     # composición: proveedores, router, guardas de ruta
│   ├── App.tsx
│   ├── router.tsx
│   └── routes/
├── assets/                  # recursos originales exportados de Figma (logo, iconos)
├── shared/                  # piezas reutilizables entre módulos
│   ├── api/                 # cliente HTTP (fetch) y errores de API
│   ├── ui/                  # componentes de UI (TextInput, PasswordInput, PrimaryButton…)
│   └── utils/
└── features/                # un directorio por módulo
    └── auth/
        ├── models/          # Modelo: tipos del contrato y validación
        ├── infrastructure/  # adaptadores: endpoints /auth y guardado de la sesión
        ├── services/        # casos de uso (login, registro, recuperar sesión, logout)
        ├── controllers/     # Controlador: contexto de sesión y hooks de cada formulario
        └── views/           # Vista: páginas y layout del módulo
```

---

## Módulos

| Módulo | Rutas | Estado | Endpoints |
|---|---|---|---|
| Autenticación | `/login`, `/register` | ✅ Implementado | `POST /auth/login`, `POST /auth/register`, `GET /auth/me`, `POST /auth/refresh`, `POST /auth/logout` |
| Inicio | `/` | ⏳ Pendiente (de momento hay una página temporal de sesión) | — |

El resto de pantallas de Figma (Buscador, Fichas, Reseñas, Perfil, Configuración) se implementarán **un módulo cada vez**.

---

## Tema Claro / Oscuro

El tema sigue la preferencia del sistema (`prefers-color-scheme`). Para forzarlo, añade `data-theme="light"` o `data-theme="dark"` en `<html>`. Los colores están definidos como tokens en `src/index.css`, cada uno con su variable de Figma de origen.
