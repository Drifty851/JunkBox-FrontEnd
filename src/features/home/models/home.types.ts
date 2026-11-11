/**
 * Datos que la vista de Inicio necesita para cada MusicCard de "Hecho para tus oídos"
 * (Figma · MusicCard, 14296:3287). La vista no sabe de dónde salen: hoy de la plantilla,
 * más adelante del endpoint de recomendaciones.
 */
export interface RecommendedTrack {
  /** ID de Spotify; sirve de clave y, en el futuro, para abrir la Ficha de Canción. */
  spotifyId: string
  title: string
  artist: string
  /** Carátula del álbum de la canción. `null` si no se encontró: la vista muestra un recuadro neutro. */
  imageUrl: string | null
}
