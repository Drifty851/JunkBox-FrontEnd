# Solicitudes al Backend de Junkbox

Registro, por módulo del frontend, de los cambios, aclaraciones o capacidades que el frontend necesita del backend. **Solo se listan las solicitudes abiertas**; las resueltas se retiran y quedan anotadas en el [historial](#11-historial-de-cambios).

> **Fuera de GitHub.** Este archivo está en `JunkBox/Proyecto/`, que no es un repositorio. No lo muevas a `Backend/junkbox-backend` (repositorio `github.com/xcxsar/junkbox-backend`) ni a `FrontEnd/`.

> **El backend es de solo lectura para el frontend.** Ningún cambio de esta lista lo hace el equipo de frontend. Cada solicitud se entrega a quien desarrolla el backend para que la apruebe e implemente (CLAUDE.md §2 y §11).

**Última revisión:** 2026-11-19 (backend hasta el commit `2117b07`, "feat: Atender SEARCH-04: Implementar búsqueda de usuarios."). El backend registra sus respuestas a estas solicitudes en `Backend/junkbox-backend/docs/solicitudes.md`.

**Fuentes consultadas (solo lectura):**
- `Backend/junkbox-backend/internal/adapters/primary/http/router.go`: rutas y CORS.
- `Backend/junkbox-backend/internal/adapters/primary/http/dto/auth_dto.go`: request y response.
- `Backend/junkbox-backend/internal/adapters/primary/http/handlers_auth.go`: códigos HTTP y mensajes de error.
- `Backend/junkbox-backend/internal/adapters/primary/http/handlers_account.go` y `internal/core/services/account_email_service.go`: recuperación de contraseña y verificación de correo.
- `Backend/junkbox-backend/internal/core/services/auth_service.go`: reglas de validación (`validateRegister`, `validatePassword`).
- `Backend/junkbox-backend/config/config.go`: `CORS_ALLOWED_ORIGINS`.
- `Backend/junkbox-backend/internal/adapters/primary/http/handlers_music.go`, `internal/core/services/music_service.go` y `db/queries/catalog.sql`: búsqueda y catálogo.
- `Backend/junkbox-backend/internal/adapters/primary/http/dto/review_dto.go`: calificaciones y reseñas.
- `Backend/junkbox-backend/internal/adapters/secondary/spotify/client.go`: integración con Spotify (solo credenciales de la app).
- `Backend/junkbox-backend/internal/core/domain/social.go`, `recommendation.go` y `review.go`: feed, perfiles, comentarios, sugerencias, `/home` y campos sociales de las reseñas.
- `Backend/junkbox-backend/docs/solicitudes.md`: respuestas del backend a HOME-01 a SEARCH-04.
- `Backend/junkbox-backend/README.md` (§API REST, endpoints 1 a 29) y `implementacion.md` (§3.5).

---

## Índice

- [1. Contratos vigentes del backend](#1-contratos-vigentes-del-backend)
- [2. Módulo: Autenticación (Iniciar sesión / Registrarse)](#2-módulo-autenticación-iniciar-sesión--registrarse)
- [3. Módulo: Inicio](#3-módulo-inicio)
- [4. Módulo: Buscador](#4-módulo-buscador)
- [5. Módulo: Cuenta y Configuración](#5-módulo-cuenta-y-configuración)
- [6. Módulo: Spotify y Reproductor](#6-módulo-spotify-y-reproductor)
- [7. Módulo: Fichas (Canción, Álbum, Artista) y Calificaciones](#7-módulo-fichas-canción-álbum-artista-y-calificaciones)
- [8. Módulo: Landing (sin sesión)](#8-módulo-landing-sin-sesión)
- [9. Módulo: Perfil](#9-módulo-perfil) (PROF-01 a PROF-04)
- [10. Plantilla para nuevas solicitudes](#10-plantilla-para-nuevas-solicitudes)
- [11. Historial de cambios](#11-historial-de-cambios)

**Estados posibles:** `Pendiente` · `Enviada` · `Aprobada` · `Resuelta` · `Descartada`
**Responsables posibles:** `Backend` · `Producto` (este archivo solo recoge peticiones al backend; los ajustes de diseño se hacen directamente en Figma)

---

## 1. Contratos vigentes del backend

**Base URL:** `http://localhost:8080/api/v1`. La dirección viene de `HTTP_ADDR` (`:8080` por defecto). El backend corre en WSL Debian. El despliegue en Kubernetes (commit `2d05563`, puerto 80) se revirtió en el commit `1c7b308` (2026-11-16).

| Método | Ruta | Auth | Body | Respuesta |
|---|---|---|---|---|
| `GET` | `/healthz` (sin prefijo) | — | — | `200 ok` |
| `POST` | `/auth/register` | — | `{username, email, password, display_name?, avatar_url?, terms_accepted}`; `terms_accepted` es **obligatorio** (commit `560b33f`) | `201 AuthResponse` · `400 "debes aceptar los Términos de Servicio y la Política de Privacidad"` si es `false` o falta |
| `POST` | `/auth/login` | — | `{identifier, password}`; `identifier` admite email o username | `200 AuthResponse` |
| `POST` | `/auth/refresh` | `Bearer <access anterior>` (puede estar expirado) | `{refresh_token}` | `200 {access_token, refresh_token, expires_in}` |
| `GET` | `/auth/me` | Bearer | — | `200 UserProfile` |
| `POST` | `/auth/logout` | Bearer | `{refresh_token, all_sessions?}` | `200 {"message": "sesión cerrada"}` |
| `POST` | `/auth/password/forgot` | — | `{email}` | Siempre `200 {"message": "Si el correo está registrado, recibirás un enlace para restablecer tu contraseña."}` · `400 "email es requerido"` |
| `POST` | `/auth/password/reset` | — (token del correo) | `{token, password}` | `200 {"message": "Contraseña actualizada. Inicia sesión de nuevo."}` · `400` validación de contraseña (no consume el token) · `401 "token inválido o expirado"`. **Cierra todas las sesiones del usuario.** |
| `POST` | `/auth/email/verify` | — (token del correo) | `{token}` | `200 {"message": "Correo verificado."}` · `401 "token inválido o expirado"` |
| `POST` | `/auth/email/verify/resend` | Bearer | — | `200 {"message": "Si tu correo aún no está verificado, recibirás un nuevo enlace."}` |
| `GET` | `/music/search` | Bearer | `?q=` (obligatorio, ≤200) `&type=track\|artist\|album` (por defecto `track`) `&limit=1..50` (20); sin paginación | `200 {source: "local_cache"\|"spotify_fallback", query, type, count, results[]}` |
| `GET` | `/music/tracks/{id}` | Bearer | `{id}` local (entero) o de Spotify | `200 TrackDetail` |
| `GET` | `/music/artists/{id}` | Bearer | `{id}` UUID o de Spotify | `200 {id, spotify_id, name, genres[], popularity, image_url, created_at, ratings}` |
| `GET` | `/music/albums/{id}` | Bearer | `{id}` UUID o de Spotify | `200 {id, spotify_id, title, artist_id, artist_name, release_year, album_type, image_url, total_tracks, created_at, ratings, tracks[]}` |
| `POST` · `GET` · `DELETE` | `/ratings` · `/ratings/my?target_type=&target_id=` · `/ratings/{id}` | Bearer | `{target_type: song\|album\|artist, target_id, score: 0.5..5.0}` | `201`/`200` Rating · `404` si no votó |
| `POST` · `GET` · `PUT` · `DELETE` | `/reviews` · `/reviews?target_type=&target_id=&limit=&page=` · `/reviews/{id}` | Bearer | `{target_type, target_id, title?, content}` | Review · `403` si no es tuya · `409` si ya reseñaste ese objetivo |
| `GET` | `/music/artists/{id}/tracks` · `/music/artists/{id}/albums` | Bearer | `?limit=1..50` (20) | `200 {count, results[]}` (Track / Album con `ratings`) · `404`. Se sincronizan con Spotify la primera vez y cada 7 días (SEARCH-02, commit `fc7c9d5`) |
| `GET` | `/home` | Bearer | `?limit=1..50` (8) | `200 {sections: [{id: "made_for_you", title, strategy: "similar_to_last"\|"popular", seed \| null, items: [{type: "track", ...Track}]}]}` (HOME-01, commit `1c35740`) |
| `GET` | `/feed` | Bearer | `?tab=popular\|following` (obligatorio) `&tz=` (IANA, solo `popular`, por defecto `America/Mazatlan`) `&limit=1..50` (20) `&cursor=` | `200 {tab, timezone?, limit, next_cursor \| null, reviews: [Review]}` · `400` si tab, tz, cursor o limit no son válidos (HOME-04, commit `b2968e8`) |
| `GET` | `/users/{id}` (UUID o username) | Bearer | — | `200 {id, username, display_name, avatar_url, created_at, followers_count, following_count, reviews_count, followed_by_me, is_me}` · `404` |
| `POST` · `DELETE` | `/users/{id}/follow` | Bearer | — | Perfil actualizado; idempotente · `400` si es uno mismo |
| `GET` | `/users/{id}/followers` · `/users/{id}/following` | Bearer | `?limit=&cursor=` | `200 {user_id, limit, next_cursor, users: [{id, username, display_name, avatar_url, followed_at, followed_by_me}]}` |
| `POST` · `DELETE` | `/reviews/{id}/like` | Bearer | — | `200 {review_id, liked, likes_count}`; idempotente |
| `GET` · `POST` | `/reviews/{id}/comments` | Bearer | `?limit=&cursor=` · `{content, parent_id?}` | Comentarios raíz paginados `{review_id, parent_id, limit, next_cursor, comments[]}` · `201 Comment`. Un solo nivel de respuestas |
| `GET` · `PUT` · `DELETE` | `/comments/{id}/replies` · `/comments/{id}` | Bearer | `?limit=&cursor=` · `{content}` | Respuestas paginadas · editar o borrar solo el autor (`403`) |
| `GET` | `/users/suggestions` | Bearer | `?limit=1..50` (10) | `200 {limit, computed_at \| null, users: [{id, username, display_name, avatar_url, reason: {type, text, common_count, artists, similarity}}]}` (HOME-05, commit `7523d54`) |
| `GET` | `/users/search` | Bearer | `?q=` (obligatorio, hasta 100) `&limit=1..50` (20) | `200 {query, count, results: [{id, username, display_name, avatar_url, followed_by_me}]}` (SEARCH-04, commit `2117b07`). Excluye a quien busca |

**`AuthResponse`:** `{ access_token, refresh_token, expires_in, user: UserProfile }`
**`UserProfile`:** `{ id, username, email, display_name | null, avatar_url | null, email_verified, created_at }`. `email_verified` es nuevo en el commit `51ec315`; los usuarios seed vienen verificados.
**Correos de cuenta** (commit `51ec315`): los enlaces apuntan al frontend, con el token en el fragmento: `{FRONTEND_URL}/restablecer-contrasena#token=…` (válido 30 min) y `{FRONTEND_URL}/verificar-correo#token=…` (24 h). `FRONTEND_URL` vale por defecto el primer origen de CORS. En desarrollo los correos llegan a **Mailpit** (`make db-up`, bandeja en `http://localhost:8025`). El registro envía el correo de verificación automáticamente.
**`Track`** (resultados de búsqueda, `tracks[]` de un álbum, discografía y `/home`): `{id, spotify_id, track_name, artist_name, album_title?, album_image_url | null, artist_image_url | null, year, genre, popularity, duration_ms, has_embedding, pending_embedding, ratings{count, average | null}}`. Las imágenes son del commit `9e0794d`; `ratings` en todos los listados, del commit `34a027e` (SEARCH-03). `TrackDetail` añade `artist_id, album_id, isrc, audio_features`.
**`Review`** (desde los commits `195c611` y `b2968e8`): añade `target.summary` (Track, Album sin `tracks` ni `ratings`, o Artist sin `ratings`; ausente si el objetivo se borró), `comments_count`, `liked_by_me`, `saved_by_me` (siempre `false`: no hay guardados) y `following_author`.
**Búsqueda:** coincidencia difusa (trigramas) en la base local, sin distinguir tildes (SEARCH-01, commit `1927abc`); orden: puntaje, coincidencia exacta, `popularity` y `similarity`. Desde ese commit también consulta Spotify cuando la mejor canción local no es una coincidencia exacta. Antes: si no hay resultados o el mejor puntaje es < 0.8 (`SEARCH_FALLBACK_THRESHOLD`) consulta Spotify y guarda lo encontrado. Desde el commit `9e0794d`, si a un resultado le falta la portada o la foto del artista, la búsqueda la pide a Spotify antes de responder (como máximo `SEARCH_ENRICH_BUDGET`, 2 s); lo que no llega a tiempo sale en `null` y lo completa un worker para la siguiente búsqueda. Al consultar se enlazan también las canciones del dataset con su álbum.
**Tokens:** el access token es JWT HS256 de 15 min. El refresh token es opaco, dura 7 días y rota por familias. Reutilizar un refresh token revoca toda su familia.
**CORS:** `go-chi/cors` con los orígenes de `CORS_ALLOWED_ORIGINS` (por defecto `http://localhost:5173`). Métodos `GET, POST, PUT, DELETE, OPTIONS` (sin `PATCH`), cabeceras `Authorization, Content-Type`, sin credenciales (no hay cookies). Otros orígenes se rechazan.
**Errores:** siempre `{"error": "<mensaje>"}`.
- `400`: falta un campo, JSON inválido, campo desconocido (`DisallowUnknownFields`) o error de validación.
- `401`: credenciales inválidas, token inválido o revocado, refresh token reutilizado, o token de correo inválido o expirado.
- `404`: no encontrado.
- `409`: email o username ya registrado.
- `500`: error interno.
- `502`: proveedor de música no disponible.

**Validaciones del registro** (`auth_service.go`):

| Campo | Regla | Mensaje `400` del backend |
|---|---|---|
| `username` | `^[a-z0-9_.]{3,50}$`, normalizado a minúsculas | — |
| `terms_accepted` | Obligatorio y `true`. Se valida antes que los demás campos. Se guarda la versión `TERMS_VERSION` (por defecto `2026-11-12`) en `user_consents` | `debes aceptar los Términos de Servicio y la Política de Privacidad` |
| `email` | Parseable con `net/mail`, ≤255 caracteres, normalizado a minúsculas; dominio con al menos un punto y TLD de 2 o más letras (o punycode `xn--…`); sin literales IP (commit `4855a38`) | `email inválido` |
| `password` | ≥ 8 **caracteres** (runas), ≤ 72 **bytes**, y al menos una letra, un número y un carácter especial (puntuación o símbolo Unicode) | `la contraseña debe tener al menos 8 caracteres` · `la contraseña no puede superar 72 bytes` · `la contraseña debe incluir letras, números y caracteres especiales` |
| `display_name` | ≤100 caracteres, opcional | `display_name no puede superar 100 caracteres` |
| `avatar_url` | URL `http(s)` con host, opcional | — |

---

## 2. Módulo: Autenticación (Iniciar sesión / Registrarse)

**Figma:** archivo `KQPRPnqGUA7udlAjw8s5fo`.
- Iniciar sesión: `14296:2388`, `14296:2489`, `14296:2442`, `14296:2543`
- Registrarse: `14296:2590`, `14296:2702`, `14296:2649`, `14296:2761`

**Endpoints que usa:** `POST /auth/login`, `POST /auth/register`, `POST /auth/refresh`, `GET /auth/me`, `POST /auth/logout`.

Sin solicitudes abiertas.

---

## 3. Módulo: Inicio

**Figma:** Móvil `14244:50321` (claro) / `14263:21466` (oscuro), Escritorio `14244:50496` (claro) / `14263:21659` (oscuro).

**Endpoints que usa (2026-11-19):** `GET /home` ("Hecho para tus oídos" y "Ver todo"), `GET /feed` ("Para ti" y "Siguiendo", scroll infinito), `GET /users/suggestions` ("Conecta por lo que suena") y `GET /auth/me` (avatar). Ver `FrontEnd/implementacion.md` §4.10.

Sin solicitudes abiertas. HOME-01, HOME-02, HOME-04 y HOME-05 se resolvieron en el backend; HOME-03 se cerró por innecesaria y HOME-06 se descartó (se reproduce con el Web Playback SDK). Me gusta y Seguir ya tienen endpoint: el frontend los conecta en el módulo de interacciones.

---

## 4. Módulo: Buscador

**Figma:** Buscador · Música, Móvil `14244:50703` (claro) / `14263:21885` (oscuro), Escritorio `14244:50815` (claro) / `14263:22014` (oscuro). Buscador · Usuarios: `14244:50943` / `14244:51045`.

**Endpoints que usa:** `GET /music/search` (tres llamadas en paralelo: `type=track`, `album` y `artist`).

Sin solicitudes abiertas. SEARCH-01 a SEARCH-04 se resolvieron en el backend (2026-11-17). Pendiente en el frontend: la pestaña Usuarios con `GET /users/search`, la estrella con `ratings` en las filas y la discografía del artista con `/music/artists/{id}/tracks` y `/albums`.

---

## 5. Módulo: Cuenta y Configuración

**Figma:** Configuración, Móvil `14244:53364` / `14263:24792`, Escritorio `14244:53464` / `14263:24903`.

**Endpoints que usa:** `GET /auth/me`, `POST /auth/password/forgot` (cambio de contraseña por correo), `POST /auth/logout`.

### USER-01 · Editar el perfil
- **Estado:** Pendiente · **Responsable:** Backend · **Bloqueante:** no.
- **Qué pasa:** Configuración permite cambiar el nombre visible (puede repetirse entre usuarios), el username, el correo y la foto. No existe ningún endpoint para actualizar el usuario.
- **Qué se pide:**
  - Endpoint: `PUT /api/v1/users/me` (o `PATCH` si se añade al CORS), con Bearer.
  - Request (todos opcionales): `{ display_name?: string | null, username?: string, avatar_url?: string | null }` con las mismas reglas que el registro.
  - Response: `200 UserProfile`.
  - Errores: `400` validación · `401` · `409 "el username ya está registrado"`.
  - El **correo** conviene cambiarlo con verificación: `POST /api/v1/users/me/email { email, password }` → envía un enlace al nuevo correo y solo se aplica al confirmarlo.
- **Alternativa en el frontend:** los campos se muestran con los datos actuales, y "Guardar cambios" y "Cambiar foto" quedan deshabilitados con la nota "Pendiente del backend".

### USER-02 · Cambiar la contraseña con sesión iniciada
- **Estado:** Pendiente · **Responsable:** Backend · **Bloqueante:** no.
- **Qué pasa:** solo existe el restablecimiento por correo.
- **Qué se pide:** `POST /api/v1/auth/password/change { current_password, new_password }` con Bearer → `200 { message }`. `401` si la actual no coincide, `400` si la nueva no cumple `validatePassword`. Opcional: cerrar las demás sesiones.
- **Alternativa en el frontend (decisión del propietario):** "Cambiar contraseña" envía el enlace de recuperación (`/auth/password/forgot`) al correo del usuario.

### USER-03 · Avatar por defecto
- **Estado:** Pendiente · **Responsable:** Backend · **Bloqueante:** no.
- **Qué pasa:** el propietario quiere el robot (DiceBear `bottts`, como los usuarios seed) para toda cuenta nueva. El backend guarda `avatar_url = NULL` si no se envía.
- **Qué se pide:** asignar `https://api.dicebear.com/7.x/bottts/svg?seed=<username>` cuando el registro no trae `avatar_url`, o confirmar que basta con que lo envíe el frontend.
- **Alternativa en el frontend (implementada, §5):** el registro envía esa URL en `avatar_url`, y `Avatar` la usa como respaldo si `avatar_url` es null o no carga.

### PREF-01 · Frecuencia de recomendaciones
- **Estado:** Pendiente · **Responsable:** Backend y Producto · **Bloqueante:** no.
- **Qué pasa:** Configuración tiene "Frecuencia de recomendaciones" (Semanal por defecto, Cada 3 días, Diario, Nunca). No hay dónde guardarla.
- **Qué se pide:** `GET`/`PUT /api/v1/users/me/preferences` → `{ recommendation_frequency: "weekly" | "every_3_days" | "daily" | "never" }`.
- **Alternativa en el frontend:** la sección se muestra deshabilitada con "Semanal" marcado.

---

## 6. Módulo: Spotify y Reproductor

**Figma:** componente `MiniPlayer` (instancias `14296:15070` móvil, `14296:14858` escritorio). Configuración · "Tu cuenta de música".

### SPOT-01 · Enlazar la cuenta de Spotify del usuario
- **Estado:** Pendiente · **Responsable:** Backend · **Bloqueante:** no.
- **Qué pasa:** el reproductor usa el Web Playback SDK, que necesita un token **del usuario** con Premium (scope `streaming`). El backend solo tiene credenciales de la app (Client Credentials).
- **Qué se pide:**
  - `GET /api/v1/spotify/link` → `200 { authorize_url }` (Authorization Code; el backend guarda `state`).
  - `GET /api/v1/spotify/callback?code=&state=` → guarda `access_token`, `refresh_token` y `expires_at` cifrados y asociados al usuario; redirige a `{FRONTEND_URL}/configuracion`.
  - `GET /api/v1/spotify/token` → `200 { access_token, expires_in }` (renovado en el servidor) · `404` si no está vinculado.
  - `DELETE /api/v1/spotify/link` → desvincular.
  - `GET /auth/me` podría incluir `spotify: { linked, display_name, product } | null`.
- **Alternativa en el frontend (implementada 2026-11-13, `FrontEnd/implementacion.md` §11.1):** Authorization Code con **PKCE** desde el navegador (sin secreto). El access token vive solo en memoria; el refresh token se guarda en `localStorage`, por usuario de Junkbox, **cifrado** con AES-GCM y una clave no extraíble guardada en IndexedDB. Se borra al cerrar sesión o desvincular. La vinculación no sobrevive a otro navegador o dispositivo y no está protegida por completo contra un script malicioso en la página.
- **Impacto en el frontend:** cuando exista, solo cambia `features/player/services/spotifyAuthService.ts` (y desaparece el guardado local); el resto se queda igual.

---

## 7. Módulo: Fichas (Canción, Álbum, Artista) y Calificaciones

**Figma:** Ficha de Canción `14244:51392` / `14244:51550`, Ficha de Álbum `14244:51705` / `14244:51880`, Ficha de Artista `14244:52049` / `14244:52191` (y sus variantes oscuras). Escribir Reseña `14244:51146` / `14244:51275`.

**Endpoints que usa:** `GET /music/tracks|albums|artists/{id}`, `GET /music/search` (cascada), `POST /ratings`, `GET /ratings/my`, `DELETE /ratings/{id}`, `GET|POST /reviews`, `PUT|DELETE /reviews/{id}`.

**Decisión del propietario (2026-11-06):** al abrir una canción, un álbum o un artista se recopila en cascada la información del artista, sus álbumes y las canciones de esos álbumes, para que queden guardados en la base y sus imágenes aparezcan en las fichas.

### CAT-01 · Sincronizar la discografía de un artista desde Spotify
- **Estado:** Pendiente · **Responsable:** Backend · **Bloqueante:** no (hay alternativa parcial).
- **Actualización 2026-11-19:** SEARCH-02 (commit `fc7c9d5`) cubre gran parte: álbumes y sencillos del artista (hasta 50, cada 7 días), canciones completadas con las de sus álbumes, pistas completas de cada álbum y la foto del artista en `GET /music/artists/{id}`. El backend deja fuera de alcance la sincronización completa del catálogo. Cuando el frontend pase la ficha de artista a esos endpoints y deje la cascada, se revisará si CAT-01 se puede cerrar.
- **Qué pasa:** la única forma que tiene el frontend de traer datos de Spotify a la base es `/music/search`, y solo consulta Spotify si no hay buenos resultados locales (SEARCH-01). Prueba en vivo de la cascada (2026-11-06), buscando `type=track q="<álbum> <artista>"` por cada álbum:
  - **Funciona** cuando la búsqueda acaba en Spotify: BBO 1 → 10 de 11 canciones, TRES CREUS 0 → 10 de 10, Starboy 0 → 11 de 18, Hurry Up Tomorrow 0 → 16 de 22.
  - **No funciona** cuando hay canciones del CSV con títulos parecidos: Will Of The People (Muse) 0 de 10, After Hours 2 de 14, los sencillos de Knights of Cydonia y Blinding Lights 0. Las canciones del CSV nunca quedan enlazadas a su álbum.
  - **Artistas del CSV sin foto:** Muse y The Weeknd tienen `image_url: null`, porque la búsqueda de artistas los encuentra en local y nunca consulta Spotify.
  - Además, la cascada cuesta 1 llamada por álbum (≈ 3–5 s por artista).
- **Qué se pide:**
  - Endpoint: `POST /api/v1/music/artists/{id}/sync` (Bearer), o hacerlo automáticamente al pedir el detalle de un artista con `spotify_id`.
  - Que importe de Spotify (`/artists/{id}`, `/artists/{id}/albums`, `/albums/{id}/tracks`) el artista con su imagen, todos sus álbumes y sencillos con imagen, y todas sus canciones enlazadas a su álbum. Si una canción ya existe en `song_metadata` (mismo `track_id`), que se le asigne `album_id` y `artist_id`.
  - Response: `200 { artist: ArtistDetail, albums: AlbumDetail[] }` o `202` si se hace en segundo plano.
  - Errores: `404` si el artista no existe · `502` si Spotify falla.
  - Junto con SEARCH-02 (`/artists/{id}/albums` y `/tracks`), la ficha de artista sería una o dos llamadas.
- **Alternativa en el frontend (implementada, §7.3):** cascada con `/music/search` (artista → `type=album q=<artista>` → `type=track q="<álbum> <artista>"` por álbum incompleto, con concurrencia limitada y una sola vez por sesión). Completa lo que puede; lo demás se muestra tal como está en la base.
- **Impacto en el frontend:** discografías y álbumes incompletos, y artistas del CSV sin foto.

### RATE-01 · Reparto de votos por estrellas
- **Estado:** Pendiente · **Responsable:** Backend · **Bloqueante:** no.
- **Qué pasa:** "La comunidad opina" (Figma) muestra barras con el porcentaje de votos por estrella (5 ★ 72 %, 4 ★ 19 %…). `ratings` solo trae `count` y `average`.
- **Qué se pide:** añadir `distribution: { "5": n, "4.5": n, …, "0.5": n }` (o agrupado por estrella entera, `"1"`–`"5"`) a `ratings` en el detalle de canción, álbum y artista.
- **Alternativa en el frontend (implementada, decisión del propietario):** las barras no se muestran; solo el promedio, las estrellas y el total.

### LIKE-02 · Me gusta en los comentarios
- **Estado:** Pendiente · **Responsable:** Backend · **Bloqueante:** no. Los comentarios ya existen (HOME-04), pero sin Me gusta: el backend lo deja fuera de alcance.
- **Qué pasa:** cada comentario muestra "♡ 12" (Figma · CommentCard).
- **Qué se pide:** `POST /api/v1/comments/{id}/like` y `DELETE /api/v1/comments/{id}/like` (Bearer, idempotentes, como `/reviews/{id}/like`) → `200 { comment_id, liked, likes_count }`. `Comment` incluye `likes_count` y `liked_by_me`. Errores: `401` · `404`.
- **Alternativa en el frontend (implementada):** "♡ N" con `aria-disabled`.

### LIKE-03 · Me gusta en las calificaciones
- **Estado:** Pendiente · **Responsable:** Backend · **Bloqueante:** no.
- **Qué pasa:** el propietario pidió Me gusta también en las calificaciones (2026-11-15). Por ahora no hay interfaz para ello; se mostrará en el historial de calificaciones cuando exista PROF-02.
- **Qué se pide:** `POST /api/v1/ratings/{id}/like` y `DELETE /api/v1/ratings/{id}/like` (Bearer, idempotentes, como `/reviews/{id}/like`) → `200 { rating_id, liked, likes_count }`, más `likes_count` y `liked_by_me` en `Rating` y en los resultados de PROF-02. Errores: `401` · `404`.
- **Alternativa en el frontend:** ninguna por ahora (sin interfaz).

### REV-02 · Consultar mi reseña de un objetivo
- **Estado:** Pendiente · **Responsable:** Backend · **Bloqueante:** no.
- **Qué pasa:** para editar la reseña propia (o tras un `409` al publicar) el frontend necesita su `id`, pero solo existe `GET /reviews?target…` paginado (máximo 50 por página).
- **Qué se pide:** `GET /api/v1/reviews/my?target_type=&target_id=` → `200 Review` · `404` si no hay, igual que `/ratings/my`.
- **Alternativa en el frontend (implementada, §8):** se recorre `GET /reviews?target…&limit=50` (todas las páginas) buscando `author.id` igual al del usuario; también tras un `409` al publicar.

### ART-01 · Ubicación y oyentes del artista
- **Estado:** Pendiente · **Responsable:** Backend y Producto · **Bloqueante:** no.
- **Qué pasa:** la ficha de artista muestra "Rap español · Valencia" y "Artista en Spotify · 428 mil oyentes al mes". El artista solo trae `genres` y `popularity` (que es null en los del CSV). Spotify no expone oyentes mensuales en su API pública.
- **Qué se pide:** decidir si se muestran. Si se quiere la ubicación, añadir `location: string | null` al artista.
- **Alternativa en el frontend (implementada):** se muestran los géneros, "Artista en Spotify" y el número de lanzamientos y canciones en Junkbox; ubicación y oyentes se omiten.

---

## 8. Módulo: Landing (sin sesión)

**Figma:** Interfaces, "Landing" (y=20777): Móvil `16270:6827` / `16274:6827`, Escritorio `16269:6827` / `16271:6827` (claro / oscuro).

**Endpoints que usa:** ninguno. Sin sesión no se puede llamar a `/music/*` (todo exige Bearer).

### LANDING-01 · Portadas públicas para la landing
- **Estado:** Pendiente · **Responsable:** Backend · **Bloqueante:** no.
- **Qué pasa:** el fondo de la landing muestra unas 40 carátulas, pero quien la ve no tiene sesión y todos los endpoints del catálogo exigen Bearer.
- **Qué se pide:**
  - Endpoint: `GET /api/v1/public/covers?limit=40` (sin auth; se puede cachear, p. ej. `Cache-Control: public, max-age=3600`).
  - Response: `200 { "covers": [ { "title": string, "artist_name": string, "image_url": string } ] }`: álbumes con imagen, variados (por popularidad o al azar).
  - Errores: `400` si `limit` está fuera de rango.
  - Solo datos públicos del catálogo; nada de usuarios.
- **Alternativa en el frontend (implementada):** lista fija de 80 álbumes elegidos por el propietario (2026-11-13; antes, 40 de los artistas importados), en `FrontEnd/src/features/landing/data/landingCovers.ts`, con la variante de 300 px del CDN de Spotify. Escritorio muestra las 80 y móvil 40 al azar por visita.
- **Impacto en el frontend:** las portadas no cambian hasta que se actualice la lista a mano.

---

## 9. Módulo: Perfil

**Figma:**
- Perfil Público: Móvil `14244:52670` / `14263:24037`, Escritorio `14244:52870` / `14263:24255`.
- Historial de Calificaciones: Móvil `14244:53034` / `14263:24437`, Escritorio `14244:53191` / `14263:24605`.

**Endpoints que usa:** `GET /auth/me` (avatar, nombre, @usuario y `created_at`).

Decisión del propietario (2026-11-15): **mi perfil** (`/perfil`) sin bio. Después, el mismo día: páginas de **seguidores y seguidos** (`/perfil/seguidores`, `/perfil/seguidos`) y el **perfil de otra persona** (`/usuario/:username` y sus listas), como plantillas.

**2026-11-19:** FOL-01, FOL-02 y PROF-05 se resolvieron con HOME-04 (`GET /users/{id}`, `POST/DELETE /users/{id}/follow`, `GET /users/{id}/followers|following`). El frontend los conecta en el módulo de Perfil. Siguen abiertas las listas de reseñas y calificaciones por usuario y parte de las estadísticas.

### PROF-01 · Listar mis reseñas
- **Estado:** Pendiente · **Responsable:** Backend · **Bloqueante:** no.
- **Qué pasa:** la pestaña "Mis Reseñas" muestra las reseñas del usuario con su `ReviewCard`. `GET /reviews` solo filtra por objetivo (`target_type`/`target_id`), no por autor.
- **Qué se pide:**
  - Endpoint: `GET /api/v1/users/{id}/reviews?limit=&cursor=` (Bearer; `{id}` UUID o username, como `GET /users/{id}`), de la más reciente a la más antigua.
  - Response: `200 { user_id, limit, next_cursor, reviews: [Review] }`, con el mismo `Review` del feed (`target.summary` y campos sociales), para reutilizar `ReviewCard` y el scroll infinito.
  - Errores: `400` si `limit` o `cursor` no son válidos · `401` · `404` si el usuario no existe.
- **Actualización 2026-11-19:** `GET /users/{id}` ya trae `reviews_count`.
- **Alternativa en el frontend (implementada):** la pestaña muestra un estado vacío con "Pendiente del backend".
- **Impacto en el frontend:** el título "N reseñas publicadas" y la lista se llenan cuando exista; se reutiliza `ReviewCard`.

### PROF-02 · Listar mis calificaciones (historial)
- **Estado:** Pendiente · **Responsable:** Backend · **Bloqueante:** no.
- **Qué pasa:** "Historial de Calificaciones" lista lo que el usuario calificó (canciones, álbumes y artistas) con sus estrellas y la fecha. `/ratings/my` solo da la calificación de un elemento concreto.
- **Qué se pide:**
  - Endpoint: `GET /api/v1/users/{id}/ratings?limit=&cursor=` (Bearer; UUID o username), de la más reciente a la más antigua.
  - Response: `200 { user_id, limit, next_cursor, ratings: [{ id, score, created_at, updated_at, target: { type, id, summary } }] }`, con `target.summary` como en las reseñas.
  - Errores: `400` · `401`.
- **Alternativa en el frontend (implementada):** estado vacío con "Pendiente del backend". El propietario descartó un historial parcial con `/ratings/my`.
- **Impacto en el frontend:** la lista usa `MusicRow` con `StarRating`, como en Figma (RatingRecord).

### PROF-03 · Estadísticas del perfil
- **Estado:** Pendiente · **Responsable:** Backend · **Bloqueante:** no.
- **Qué pasa:** ProfileStats muestra Reseñas, Calificaciones, Seguidores y Seguidos, y "Una vida en canciones" muestra la media personal y el total de cinco estrellas.
- **Actualización 2026-11-19:** `GET /users/{id}` ya trae `reviews_count`, `followers_count` y `following_count`. Faltan las tres de calificaciones.
- **Qué se pide:** añadir a `GET /users/{id}` `ratings_count`, `average_score | null` (media de sus calificaciones) y `five_star_count`.
- **Alternativa en el frontend (implementada):** los seis valores se muestran como "—" (leído como "sin datos").
- **Impacto en el frontend:** solo cambia `useProfileController` (`stats` y `summary`).

### PROF-04 · "Suena mucho por aquí"
- **Estado:** Pendiente · **Responsable:** Backend y Producto · **Bloqueante:** no.
- **Qué pasa:** el panel lateral de "Mis Reseñas" muestra tres canciones con su calificación ("Su álbum favorito", "En bucle"). Falta definir de dónde salen: lo más escuchado (requeriría registrar reproducciones) o lo mejor calificado por el usuario.
- **Qué se pide:** que Producto decida el criterio; después, por ejemplo, `GET /api/v1/users/me/highlights?limit=3` → `200 { results: [{ target: { type, id, title, subtitle, image_url }, reason, score | null }] }`.
- **Alternativa en el frontend (implementada):** panel con "Tus canciones más escuchadas aparecerán aquí. Pendiente del backend." y la fecha de alta ("En Junkbox desde…", de `created_at`).
- **Impacto en el frontend:** el panel se llena con `MusicRow` y `PlayButton`.

---

## 10. Plantilla para nuevas solicitudes

```markdown
### <MÓDULO>-NN · <Título corto>
- **Estado:** Pendiente · **Responsable:** Backend · **Bloqueante:** sí/no
- **Qué pasa:** qué necesita el frontend y por qué (con referencia al nodo de Figma).
- **Qué se pide:**
  - Endpoint: `MÉTODO /api/v1/...`
  - Request: `{ ... }`
  - Response: `200 { ... }`
  - Errores: `400` / `401` / `404` / `409` con `{"error": "..."}`
- **Alternativa en el frontend:** qué se hace mientras tanto.
- **Impacto en el frontend:** qué pantalla o flujo queda afectado.
```

---

## 11. Historial de cambios

| Fecha | Cambio |
|---|---|
| 2026-11-02 | Se crea el archivo. Contratos vigentes, GLOBAL-01 y módulo de Autenticación (AUTH-01 a AUTH-05). |
| 2026-11-02 | Módulo de Autenticación implementado. AUTH-01 y AUTH-04 resueltas en Figma. AUTH-02 y AUTH-03 siguen pendientes, con su alternativa implementada. GLOBAL-01 sigue pendiente para producción. |
| 2026-11-02 | AUTH-06: el registro acepta correos con dominio sin punto. Se endurece la validación del formulario mientras el backend no aplique la regla. |
| 2026-11-03 | Revisión del backend (commits `63b6626` y `bab8e12`). **Retiradas por resueltas:** GLOBAL-01 (el backend ya tiene CORS), AUTH-01 (campo username en Figma) y AUTH-04 (el README del backend ya documenta la regla de contraseña). La regla de contraseña cambió en el backend: se actualiza la tabla de validaciones y se abre AUTH-07 para Diseño. AUTH-02, AUTH-03 y AUTH-06 siguen pendientes. |
| 2026-11-03 | Módulo Inicio: HOME-01 a HOME-06 (recomendaciones, carátula, lote de canciones, feed de reseñas, sugerencias de usuarios, audio). Ninguna bloquea Inicio v1. |
| 2026-11-04 | Inicio v1 implementado con las alternativas de HOME-01 a HOME-06. Las solicitudes siguen pendientes; ninguna bloquea. |
| 2026-11-06 | Revisión del backend (commit `51ec315`). **Retirada por resuelta:** AUTH-02 (recuperación de contraseña: `/auth/password/forgot` y `/auth/password/reset`). Se documentan además la verificación de correo (`/auth/email/verify`, `/auth/email/verify/resend`, `email_verified` en `UserProfile`), los enlaces de los correos y Mailpit. El frontend implementó después las rutas `/recuperar-contrasena`, `/restablecer-contrasena` y `/verificar-correo` (ver `FrontEnd/implementacion.md` §3.10). AUTH-03, AUTH-06 y HOME-01 a HOME-06 siguen pendientes. |
| 2026-11-06 | Revisión del backend (commit `6d77d4d`: calificaciones y reseñas). §1 amplía los contratos de música, calificaciones y reseñas, y CORS ya admite `PUT`/`DELETE`. HOME-02 se amplía a los resultados de búsqueda y HOME-06 queda cubierta por el reproductor de Spotify. Nuevas: SEARCH-01 a SEARCH-04 (SEARCH-01 corregida tras comprobar que la búsqueda sí usa título + artista), USER-01 a USER-03, PREF-01 y SPOT-01. |
| 2026-11-06 | Verificación en vivo de todos los endpoints (commit `6d77d4d`): auth, búsqueda, detalle de canción/álbum/artista, calificaciones y reseñas responden según §1 (las pruebas de calificación y reseña se borraron al terminar). Confirmado que no existen (404/405): `/users/me` (GET/PUT/PATCH), `PUT /auth/me`, `/auth/password/change`, `/music/artists/{id}/tracks` y `/albums`, `/users/search`, `/users/me/preferences`, `/spotify/*`, `/home`, `/recommendations`, `/music/tracks?ids=`; `terms_accepted` sigue dando `400`. SEARCH-02 añade la lista incompleta de canciones del álbum. |
| 2026-11-06 | Módulo Fichas y Calificaciones (§7): prueba en vivo de la cascada por búsqueda. Funciona solo cuando la búsqueda acaba en Spotify. Nuevas: CAT-01 (sincronizar discografía), RATE-01 (reparto de votos), REV-01 (likes/comentarios/seguir), REV-02 (mi reseña) y ART-01 (ubicación y oyentes). |
| 2026-11-10 | Revisión del backend (commit `2d05563`: réplicas, Kubernetes y Envoy Gateway). Sin cambios de contrato; §1 anota la base URL en Kubernetes (puerto 80) y la cabecera `X-Instance`. El frontend implementó las alternativas de SEARCH-01 a 04, USER-03, CAT-01, RATE-01, REV-01, REV-02 y ART-01 (`FrontEnd/implementacion.md` §5–§8). Todas siguen pendientes en el backend. |
| 2026-11-11 | Módulo Landing (§8): LANDING-01 (portadas públicas). El frontend usa una lista fija de 40 carátulas. |
| 2026-11-11 | Landing implementada en el frontend (`FrontEnd/implementacion.md` §9) con la alternativa de LANDING-01 (40 carátulas fijas). LANDING-01 sigue pendiente. |
| 2026-11-11 | AUTH-05: el Login del frontend dice "Correo o nombre de usuario" (decisión del propietario); se pide a Diseño actualizar Figma. |
| 2026-11-11 | El archivo queda solo con peticiones al backend. **Retiradas por resueltas en Figma:** AUTH-05 (etiqueta "Correo o nombre de usuario" en `LoginForm`) y AUTH-07 (ayuda de la contraseña en `RegisterForm`). Las pantallas que faltaban (recuperación y verificación, Términos, Privacidad, Landing, menú de la cuenta y sugerencias del buscador) ya están en la página Interfaces. |
| 2026-11-12 | Revisión del backend (commits `9e0794d`, `560b33f` y `4855a38`), con lectura del README, `implementacion.md`, `docs/solicitudes.md` y pruebas en vivo. **Retiradas por resueltas:** AUTH-03 (`terms_accepted` obligatorio, guardado en `user_consents` con fecha y versión; sin él, `400`), AUTH-06 (el registro rechaza `a@dominio` y `a@b.c` con `400 "email inválido"`) y HOME-02 (`album_image_url` y `artist_image_url` en `Track`, en la búsqueda y en el detalle; comprobado con "Hoke"). **El frontend aún no envía `terms_accepted`, así que el registro devuelve `400` hasta que se añada.** El resto sigue pendiente. |
| 2026-11-13 | LANDING-01: la alternativa del frontend pasa a 80 álbumes elegidos por el propietario. Sigue pendiente. |
| 2026-11-13 | SPOT-01: alternativa del frontend implementada (vinculación PKCE con el refresh token cifrado en el navegador). Sigue pendiente en el backend. |
| 2026-11-15 | Módulo Perfil: nuevas PROF-01 (mis reseñas), PROF-02 (mis calificaciones), PROF-03 (estadísticas) y PROF-04 ("Suena mucho por aquí"). El frontend muestra plantillas vacías. |
| 2026-11-15 | Perfil: seguidores, seguidos y perfil de otra persona como plantillas. Nuevas FOL-01 (seguir), FOL-02 (listas de seguidores y seguidos) y PROF-05 (perfil público); PROF-01 y PROF-02 piden aceptar `{username}`. |
| 2026-11-15 | Reseñas: REV-01 se reemplaza por COM-01 (comentarios con respuestas sin límite), LIKE-01 (Me gusta en reseñas), LIKE-02 (en comentarios) y LIKE-03 (en calificaciones); Guardar, descartado. El frontend ya tiene la Reseña Completa (`/resena/:id`) con `GET /reviews/{id}`. |
| 2026-11-15 | SEARCH-04 se amplía con `followers_count`, `following`, paginación y, como opción, la música en común. El frontend ya tiene la pestaña Usuarios (`?tipo=usuarios`). |
| 2026-11-15 | Revisión del backend: sin commits nuevos desde `4855a38`. Prueba en vivo: siguen sin existir `/users/search`, `/users/me` (GET y PATCH), `/users/me/stats`, `/users/me/reviews`, `/users/me/ratings`, `/users/{username}` y sus seguidores, `POST /users/{username}/follow`, `/reviews/{id}/comments`, `PUT /reviews/{id}/like`, `/home`, `/feed`, `/users/me/preferences` y `/music/landing` (404); `/reviews/my` da 400 porque lo toma `/reviews/{id}`. Nada resuelto. Se preparó un resumen por prioridad para el desarrollador del backend. |
| 2026-11-15 | Datos de prueba creados **por la API pública** (no se tocó la base ni los seeds): 12 usuarios `@junkbox.local` (`lucia_vinilos`, `marco_beats`, `sofi_playlist`, `diego_bpm`, `ana_lofi`, `pablo_riffs`, `carla_bside`, `javi_track7`, `nora_eco`, `leo_subgrave`, `vale_coros`, `tomas_rewind`; contraseña `Password123!`), 106 calificaciones y 48 reseñas. Las reseñas y calificaciones se pueden borrar con el script del frontend; los usuarios no, porque no hay API para ello. HOME-01 y HOME-04 tienen ahora una alternativa con contenido al azar. |
| 2026-11-15 | Datos de prueba: 24 reseñas más, **sin calificación** (regla del propietario: calificar, reseñar o las dos). Total: 106 calificaciones y 72 reseñas. Se comprobó que `POST /reviews` sin calificación previa funciona y que la reseña sale con `rating_score: null`. |
| 2026-11-19 | Revisión del backend (commits `1c35740` a `2117b07`, 2026-11-16 y 17; respuestas en `Backend/junkbox-backend/docs/solicitudes.md`). **Retiradas por resueltas:** HOME-01, HOME-04, HOME-05, SEARCH-01 a SEARCH-04, COM-01, LIKE-01, FOL-01, FOL-02 y PROF-05 (HOME-02 ya estaba resuelta). **Cerradas:** HOME-03 (innecesaria tras HOME-01 y HOME-02) y HOME-06 (descartada: Web Playback SDK). **Retirada:** REV-01 (reemplazada el 2026-11-15). **Actualizadas:** PROF-01 y PROF-02 (proponen `/users/{id}/reviews` y `/ratings` con cursor y el `Review` del feed), PROF-03 (solo faltan las estadísticas de calificaciones), LIKE-02 y LIKE-03 (mismo contrato que `/reviews/{id}/like`) y CAT-01 (en gran parte cubierta por SEARCH-02). §1 añade los endpoints 13.1, 13.2 y 23 a 29, los campos nuevos de `Track` y `Review`, y la vuelta al puerto 8080 (`1c7b308`). Inicio ya usa `/home`, `/feed` y `/users/suggestions` (`FrontEnd/implementacion.md` §4.10). Al probar, el backend respondía `500` hasta que su desarrollador aplicó las migraciones pendientes. |
