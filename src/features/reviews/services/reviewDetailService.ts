import { albumPath, artistPath, songPath } from '../../catalog/models/catalogPaths'
import { catalogService } from '../../music/services/catalogService'
import type { Review, ReviewTarget } from '../models/review.types'
import { reviewsService } from './reviewsService'

/** Lo reseñado, para la cabecera de la tarjeta y la línea "Medallones · Hoke · Publicada…". */
export interface ReviewedMusic {
  title: string
  /** "Hoke · BBO · 2022". */
  subtitle: string
  /** Artista principal ("Hoke"), o null si lo reseñado es un artista. */
  artistName: string | null
  imageUrl: string | null
  /** Ficha de lo reseñado. */
  href: string
}

export interface ReviewDetail {
  review: Review
  /** null si la ficha no se pudo leer: la reseña se muestra igual. */
  music: ReviewedMusic | null
}

/** GET /music/* acepta el id local que trae la reseña (`target.id`). */
async function loadMusic(target: ReviewTarget, signal: AbortSignal): Promise<ReviewedMusic> {
  if (target.type === 'song') {
    const track = await catalogService.getTrack(target.id, signal)
    const album = track.album_id ? await catalogService.getAlbum(track.album_id, signal).catch(() => null) : null
    return {
      title: track.track_name,
      subtitle: [track.artist_name, album?.title, track.year ?? album?.release_year].filter(Boolean).join(' · '),
      artistName: track.artist_name,
      imageUrl: track.album_image_url ?? album?.image_url ?? null,
      href: songPath(track.spotify_id),
    }
  }
  if (target.type === 'album') {
    const album = await catalogService.getAlbum(target.id, signal)
    return {
      title: album.title,
      subtitle: [album.artist_name, album.album_type === 'single' ? 'Sencillo' : 'Álbum', album.release_year].filter(Boolean).join(' · '),
      artistName: album.artist_name,
      imageUrl: album.image_url,
      href: albumPath(album.id),
    }
  }
  const artist = await catalogService.getArtist(target.id, signal)
  return { title: artist.name, subtitle: 'Artista', artistName: null, imageUrl: artist.image_url, href: artistPath(artist.id) }
}

/** Reseña Completa: la reseña (GET /reviews/{id}) y lo reseñado (GET /music/…). */
export async function loadReviewDetail(id: string, signal: AbortSignal): Promise<ReviewDetail> {
  const review = await reviewsService.get(id, signal)
  const music = await loadMusic(review.target, signal).catch(() => null)
  return { review, music }
}
