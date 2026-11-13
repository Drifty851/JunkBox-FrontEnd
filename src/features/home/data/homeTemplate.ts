/**
 * PLANTILLA PROVISIONAL de "Hecho para tus oídos": la misma para todos los usuarios.
 * El backend aún no tiene endpoint de recomendaciones (HOME-01); se sustituirá por él cuando exista.
 *
 * - `trackId`: ID de Spotify de la canción (estable entre cargas del dataset). Sus datos y su
 *   carátula (`album_image_url`) salen de GET /music/tracks/{id}. Verificados en el catálogo el
 *   2026-11-03 y aprobados por el propietario.
 * - Las canciones del dataset solo tienen álbum (y carátula) cuando el backend las enlaza con
 *   Spotify, lo que ocurre al aparecer en una búsqueda. Las 8 se enlazaron el 2026-11-12; una
 *   canción nueva en esta lista hay que buscarla una vez para que tenga carátula.
 */
export interface TemplateTrack {
  trackId: string
}

export const RECOMMENDED_TRACKS: readonly TemplateTrack[] = [
  // Blinding Lights · The Weeknd · After Hours (2020)
  { trackId: '0VjIjW4GlUZAMYd2vXMi3b' },
  // bad guy · Billie Eilish · WHEN WE ALL FALL ASLEEP, WHERE DO WE GO? (2019)
  { trackId: '2Fxmhks0bxGSBdJ92vM42m' },
  // Despacito · Luis Fonsi · VIDA (2019)
  { trackId: '6habFhsOp2NvshLv26DqMb' },
  // HUMBLE. · Kendrick Lamar · DAMN. (2017)
  { trackId: '7KXjTSCq5nL1LoYtL7XAwS' },
  // Get Lucky · Daft Punk · Random Access Memories (2013)
  { trackId: '69kOkLUCkxIZYexIgSG8rq' },
  // Knights of Cydonia · Muse · Black Holes and Revelations (2006)
  { trackId: '7ouMYWpwJ422jRcDASZB7P' },
  // Wake Me Up · Avicii · True (Bonus Edition) (2013)
  { trackId: '0nrRP2bk19rLc0orkWPQk2' },
  // Uptown Funk · Mark Ronson · Uptown Special (2015)
  { trackId: '32OlwWuMpZ6b0aN2RZOeMS' },
]
