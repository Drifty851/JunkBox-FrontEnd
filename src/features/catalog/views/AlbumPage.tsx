import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { MusicRow } from '../../../shared/ui/MusicRow'
import { PlayButton } from '../../../shared/ui/PlayButton'
import { usePlayer } from '../../player/controllers/playerContext'
import { formatDuration, formatMinutes } from '../../../shared/utils/formatTime'
import { isAlbumIncomplete } from '../../music/services/catalogService'
import {
  discographyKey,
  loadAlbum,
  loadDiscography,
  loadFilledAlbum,
  loadReviews,
  loadMyRating,
  reviewsKey,
} from '../controllers/catalogLoaders'
import { useLoad } from '../controllers/useLoad'
import { writeReviewPath } from '../../reviews/models/writeReview'
import { albumPath, artistPath, songPath, spotifyUrl } from '../models/catalogPaths'
import {
  Breadcrumb,
  CommunityRating,
  DetailError,
  DetailLayout,
  DetailSkeleton,
  MusicActions,
  MusicHero,
  SectionHeader,
} from './DetailParts'
import { ReviewsSection } from './ReviewsSection'

/** Pistas visibles antes de "Ver las N" (Figma muestra 2; se enseñan algunas más). */
const TRACKS_PREVIEW = 5
const KIND: Record<string, string> = { album: 'ÁLBUM', single: 'SENCILLO', compilation: 'RECOPILATORIO' }

/**
 * Ficha de Álbum · Figma: móvil 14244:51705 / 14263:22986, escritorio 14244:51880 / 14263:23177.
 * Endpoints: GET /music/albums/{id}, /music/artists/{id}, GET /reviews y la cascada: completa las
 * canciones del álbum (catalogService.fillAlbum) y la discografía del artista, que el backend guarda.
 * Escritorio: AlbumStats de 360 (comunidad + pistas) y AlbumReviews a la derecha (separación 40).
 * Móvil: comunidad, reseñas y pistas, en ese orden (Figma).
 */
export function AlbumPage() {
  const { play } = usePlayer()
  const { id = '' } = useParams()
  const [state, retry] = useLoad(id, loadAlbum)
  const data = state.status === 'ready' ? state.data : null
  const [filled] = useLoad(data ? data.album.id : null, loadFilledAlbum)
  // La cascada del artista se lanza para guardar su discografía; esta ficha no la muestra.
  useLoad(data?.artist ? discographyKey({ id: data.artist.id, name: data.artist.name }) : null, loadDiscography)
  const [reviews] = useLoad(data ? reviewsKey('album', data.album.id) : null, loadReviews)
  const [myRating] = useLoad(data ? reviewsKey('album', data.album.id) : null, loadMyRating)
  const [expanded, setExpanded] = useState(false)

  if (state.status === 'loading' || state.status === 'idle') {
    return (
      <DetailLayout>
        <DetailSkeleton />
      </DetailLayout>
    )
  }
  if (state.status === 'error') {
    return (
      <DetailLayout>
        <DetailError message={state.message} notFound={state.notFound} what="este álbum" onRetry={retry} />
      </DetailLayout>
    )
  }

  const { artist } = state.data
  const album = filled.status === 'ready' ? filled.data : state.data.album
  const complete = !isAlbumIncomplete(album)
  const totalMs = album.tracks.reduce((sum, track) => sum + (track.duration_ms ?? 0), 0)
  const meta = [
    album.release_year,
    album.total_tracks !== null ? (album.total_tracks === 1 ? '1 canción' : `${album.total_tracks} canciones`) : null,
    complete && totalMs > 0 ? formatMinutes(totalMs) : null,
    'Spotify',
  ]
    .filter(Boolean)
    .join(' · ')
  const visibleTracks = expanded ? album.tracks : album.tracks.slice(0, TRACKS_PREVIEW)

  return (
    <DetailLayout>
      <Breadcrumb
        items={[
          artist ? { label: artist.name, to: artistPath(artist.id) } : { label: album.artist_name },
          { label: album.title },
        ]}
      />
      <MusicHero
        kind={KIND[album.album_type] ?? 'ÁLBUM'}
        title={album.title}
        subtitle={
          artist ? (
            <Link to={artistPath(artist.id)} className="rounded hover:underline focus-visible:outline-2 focus-visible:outline-fg">
              {artist.name}
            </Link>
          ) : (
            album.artist_name
          )
        }
        meta={meta}
        imageUrl={album.image_url}
        ratings={album.ratings}
      />
      <MusicActions reviewTo={writeReviewPath('album', album.id)} spotifyHref={spotifyUrl('album', album.spotify_id)} shareTitle={album.title} />

      <div className="flex w-full flex-col gap-6 md:grid md:grid-cols-[360px_minmax(0,1fr)] md:items-start md:gap-x-10 md:gap-y-5">
        <div className="md:col-start-1 md:row-start-1">
          <CommunityRating
            ratings={album.ratings}
            mine={myRating.status === 'ready' ? (myRating.data?.score ?? null) : null}
            editTo={writeReviewPath('album', album.id)}
          />
        </div>

        <div className="md:col-start-2 md:row-span-2 md:row-start-1">
          <ReviewsSection
            title="Reseñas del álbum"
            state={reviews}
            music={{
              title: album.title,
              subtitle: [album.artist_name, KIND[album.album_type] === 'SENCILLO' ? 'Sencillo' : 'Álbum', album.release_year]
                .filter(Boolean)
                .join(' · '),
              imageUrl: album.image_url,
              href: albumPath(album.id),
            }}
          />
        </div>

        {/* Pistas destacadas (Figma): MusicRow con "Artista · duración" y "Ver las N". */}
        <section aria-label="Pistas" className="flex w-full flex-col items-start gap-2 md:col-start-1 md:row-start-2">
          <SectionHeader
            title="Pistas destacadas"
            aside={
              album.tracks.length > TRACKS_PREVIEW && (
                <button
                  type="button"
                  aria-expanded={expanded}
                  onClick={() => setExpanded((value) => !value)}
                  className="cursor-pointer rounded text-xs whitespace-nowrap text-fg-placeholder hover:text-fg focus-visible:outline-2 focus-visible:outline-fg"
                >
                  {expanded ? 'Ver menos' : `Ver las ${album.tracks.length}`}
                </button>
              )
            }
          />
          {filled.status === 'loading' && (
            <p className="text-xs leading-[1.4] text-fg-placeholder">Buscando las canciones del álbum…</p>
          )}
          {album.tracks.length === 0 && filled.status !== 'loading' ? (
            <p className="text-sm leading-[1.4] text-fg-muted">Todavía no tenemos las canciones de este álbum.</p>
          ) : (
            <ul className="w-full">
              {visibleTracks.map((track) => (
                <li key={track.spotify_id}>
                  <MusicRow
                    title={track.track_name}
                    subtitle={[track.artist_name, track.duration_ms ? formatDuration(track.duration_ms) : null].filter(Boolean).join(' · ')}
                    imageUrl={album.image_url}
                    to={songPath(track.spotify_id)}
                    action={<PlayButton label={`Reproducir ${track.track_name}`} onPlay={() => play(track.spotify_id)} />}
                  />
                </li>
              ))}
            </ul>
          )}
          {!complete && filled.status === 'ready' && album.total_tracks !== null && (
            <p className="text-xs leading-[1.4] text-fg-placeholder">
              Tenemos {album.tracks.length} de {album.total_tracks} canciones de este álbum.
            </p>
          )}
        </section>
      </div>
    </DetailLayout>
  )
}
