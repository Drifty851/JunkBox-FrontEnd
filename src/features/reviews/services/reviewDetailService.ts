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

/**
 * Lo reseñado a partir de `review.target.summary` (HOME-02), sin pedir el catálogo. Mismo formato
 * que `loadMusic`, salvo el álbum de la canción, que el resumen solo trae como título. null si el
 * objetivo se borró (sin `summary`).
 */
export function reviewedMusicFromSummary(target: ReviewTarget): ReviewedMusic | null {
  const summary = target.summary
  if (!summary) return null
  if (target.type === 'song' && 'track_name' in summary) {
    return {
      title: summary.track_name,
      subtitle: [summary.artist_name, summary.album_title, summary.year].filter(Boolean).join(' · '),
      artistName: summary.artist_name,
      imageUrl: summary.album_image_url,
      href: songPath(summary.spotify_id),
    }
  }
  if (target.type === 'album' && 'title' in summary) {
    return {
      title: summary.title,
      subtitle: [summary.artist_name, summary.album_type === 'single' ? 'Sencillo' : 'Álbum', summary.release_year].filter(Boolean).join(' · '),
      artistName: summary.artist_name,
      imageUrl: summary.image_url,
      href: albumPath(summary.id),
    }
  }
  if (target.type === 'artist' && 'name' in summary) {
    return { title: summary.name, subtitle: 'Artista', artistName: null, imageUrl: summary.image_url, href: artistPath(summary.id) }
  }
  return null
}

/** Reseña Completa: la reseña (GET /reviews/{id}) y lo reseñado (GET /music/…). */
export async function loadReviewDetail(id: string, signal: AbortSignal): Promise<ReviewDetail> {
  const review = await reviewsService.get(id, signal)
  const music = await loadMusic(review.target, signal).catch(() => null)
  return { review, music }
}
