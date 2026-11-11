/**
 * PLANTILLA PROVISIONAL de "Hecho para tus oídos": la misma para todos los usuarios.
 * El backend aún no tiene endpoint de recomendaciones (HOME-01); se sustituirá por él cuando exista.
 *
 * - `trackId`: ID de Spotify de la canción (estable entre cargas del dataset). Sus datos salen de
 *   GET /music/tracks/{id}. Verificados en el catálogo el 2026-11-03 y aprobados por el propietario.
 * - `album`: álbum al que pertenece la canción, para su carátula. Las canciones del dataset no
 *   tienen álbum enlazado (HOME-02), así que se fija aquí: `spotifyId` (GET /music/albums/{id}) y,
 *   si aún no está en la base, `search` (GET /music/search?type=album, que lo trae de Spotify).
 *   Verificados contra el backend el 2026-11-06.
 */
export interface TemplateTrack {
  trackId: string
  album: { spotifyId: string; search: string }
}

export const RECOMMENDED_TRACKS: readonly TemplateTrack[] = [
  // Blinding Lights · The Weeknd · After Hours (2020)
  { trackId: '0VjIjW4GlUZAMYd2vXMi3b', album: { spotifyId: '4yP0hdKOZPNshxUOjY0cZj', search: 'After Hours The Weeknd' } },
  // bad guy · Billie Eilish · WHEN WE ALL FALL ASLEEP, WHERE DO WE GO? (2019)
  {
    trackId: '2Fxmhks0bxGSBdJ92vM42m',
    album: { spotifyId: '0S0KGZnfBGSIssfF54WSJh', search: 'WHEN WE ALL FALL ASLEEP, WHERE DO WE GO? Billie Eilish' },
  },
  // Despacito · Luis Fonsi · VIDA (2019)
  { trackId: '6habFhsOp2NvshLv26DqMb', album: { spotifyId: '5C0YLr4OoRGFDaqdMQmkeH', search: 'VIDA Luis Fonsi' } },
  // HUMBLE. · Kendrick Lamar · DAMN. (2017)
  { trackId: '7KXjTSCq5nL1LoYtL7XAwS', album: { spotifyId: '4eLPsYPBmXABThSJ821sqY', search: 'DAMN. Kendrick Lamar' } },
  // Get Lucky · Daft Punk · Random Access Memories (2013)
  {
    trackId: '69kOkLUCkxIZYexIgSG8rq',
    album: { spotifyId: '4m2880jivSbbyEGAKfITCa', search: 'Random Access Memories Daft Punk' },
  },
  // Knights of Cydonia · Muse · Black Holes and Revelations (2006)
  {
    trackId: '7ouMYWpwJ422jRcDASZB7P',
    album: { spotifyId: '0lw68yx3MhKflWFqCsGkIs', search: 'Black Holes and Revelations Muse' },
  },
  // Wake Me Up · Avicii · True (Bonus Edition) (2013)
  { trackId: '0nrRP2bk19rLc0orkWPQk2', album: { spotifyId: '50oWFJ0mDEeMa74ElsdAp3', search: 'True Avicii' } },
  // Uptown Funk · Mark Ronson · Uptown Special (2015)
  { trackId: '32OlwWuMpZ6b0aN2RZOeMS', album: { spotifyId: '3vLaOYCNCzngDf8QdBg2V1', search: 'Uptown Special Mark Ronson' } },
]
