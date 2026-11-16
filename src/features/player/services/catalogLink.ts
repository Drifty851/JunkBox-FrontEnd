import { ApiError } from '../../../shared/api/httpClient'
import { authService } from '../../auth/services/authService'
import { musicApi } from '../../music/infrastructure/musicApi'
import { catalogService } from '../../music/services/catalogService'
import type { NowPlaying } from '../models/player'

const normalize = (text: string) =>
  text
    .toLocaleLowerCase('es')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()

/**
 * ID de Spotify con el que la ficha de la canción existe en el catálogo de Junkbox.
 *
 * La canción del reproductor puede venir de fuera de Junkbox (se cambió desde la app de Spotify) y
 * no estar en la base, o Spotify puede informar otra versión de la misma canción (otro ID). La ficha
 * solo lee la base (GET /music/tracks/{id}), así que mostraba "No encontrado" (2026-11-15):
 *  1. Si el ID ya está en el catálogo, se usa.
 *  2. Si no (404), se busca por título y artista con GET /music/search?type=track, que la trae de
 *     Spotify y la GUARDA; se elige el mismo ID o, si no, el resultado con el mismo título y artista.
 *  3. Si nada coincide, se devuelve el ID original (la ficha mostrará "No encontrado").
 */
export async function resolveCatalogSongId(track: NowPlaying): Promise<string> {
  try {
    await catalogService.getTrack(track.spotifyId)
    return track.spotifyId
  } catch (error) {
    if (!(error instanceof ApiError && (error.status === 404 || error.status === 400))) return track.spotifyId
  }
  const firstArtist = track.artist.split(',')[0]?.trim() ?? ''
  const response = await authService.withAccessToken((token) =>
    musicApi.search({ q: `${track.title} ${firstArtist}`.slice(0, 200), type: 'track', limit: 10 }, token),
  )
  const title = normalize(track.title)
  const artist = normalize(firstArtist)
  const match =
    response.results.find((result) => result.spotify_id === track.spotifyId) ??
    response.results.find(
      (result) => normalize(result.track_name) === title && normalize(result.artist_name).includes(artist),
    )
  return match?.spotify_id ?? track.spotifyId
}
