/**
 * PLANTILLA PROVISIONAL de "Hecho para tus oídos": la misma para todos los usuarios.
 * El backend aún no tiene endpoint de recomendaciones; se sustituirá por él cuando exista
 * (implementacion.md · Inicio · Limitaciones conocidas).
 *
 * Solo es una selección: los datos se piden a GET /music/tracks/{id}, que lee el catálogo
 * local sin consultar Spotify. Se guardan IDs de Spotify (estables) en lugar de los IDs
 * locales, que dependen del orden de carga del dataset.
 * Verificados en el catálogo el 2026-11-03 y aprobados por el propietario.
 */
export const RECOMMENDED_TRACK_IDS: readonly string[] = [
  '0VjIjW4GlUZAMYd2vXMi3b', // Blinding Lights · The Weeknd · 2020 · pop
  '2Fxmhks0bxGSBdJ92vM42m', // bad guy · Billie Eilish · 2019 · electro
  '6habFhsOp2NvshLv26DqMb', // Despacito · Luis Fonsi · 2019 · pop
  '7KXjTSCq5nL1LoYtL7XAwS', // HUMBLE. · Kendrick Lamar · 2017 · hip-hop
  '69kOkLUCkxIZYexIgSG8rq', // Get Lucky · Daft Punk · 2013 · electro
  '7ouMYWpwJ422jRcDASZB7P', // Knights of Cydonia · Muse · 2006 · rock
  '0nrRP2bk19rLc0orkWPQk2', // Wake Me Up · Avicii · 2013 · dance
  '32OlwWuMpZ6b0aN2RZOeMS', // Uptown Funk · Mark Ronson · 2015 · pop
]
