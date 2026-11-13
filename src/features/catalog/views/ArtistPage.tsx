import { useState } from 'react'
import { useParams } from 'react-router'
import { MusicRow } from '../../../shared/ui/MusicRow'
import { PlayButton } from '../../../shared/ui/PlayButton'
import { discographyKey, loadArtist, loadDiscography, loadMyRating, loadReviews, reviewsKey } from '../controllers/catalogLoaders'
import { useLoad } from '../controllers/useLoad'
import { writeReviewPath } from '../../reviews/models/writeReview'
import { albumPath, songPath, spotifyUrl } from '../models/catalogPaths'
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

/** "Imprescindibles": álbumes y canciones visibles antes de "Ver toda la discografía". */
const ALBUMS_PREVIEW = 3
const TRACKS_PREVIEW = 5
const KIND: Record<string, string> = { album: 'Álbum', single: 'Sencillo', compilation: 'Recopilatorio' }

/**
 * Ficha de Artista · Figma: móvil 14244:52049 / 14263:23361, escritorio 14244:52191 / 14263:23515.
 * Endpoints: GET /music/artists/{id}, GET /reviews y la cascada del artista (álbumes con carátula y
 * sus canciones, que el backend guarda en la base).
 * Escritorio: ArtistStats 360 · ArtistReviews · ArtistDiscography 272 (separación 40).
 * Ubicación y oyentes de Figma no existen en el backend (ART-01): se muestran géneros y discografía.
 */
export function ArtistPage() {
  const { id = '' } = useParams()
  const [state, retry] = useLoad(id, loadArtist)
  const artist = state.status === 'ready' ? state.data : null
  const [discography] = useLoad(artist ? discographyKey({ id: artist.id, name: artist.name }) : null, loadDiscography)
  const [reviews] = useLoad(artist ? reviewsKey('artist', artist.id) : null, loadReviews)
  const [myRating] = useLoad(artist ? reviewsKey('artist', artist.id) : null, loadMyRating)
  const [expanded, setExpanded] = useState(false)

  if (state.status === 'loading' || state.status === 'idle' || artist === null) {
    return (
      <DetailLayout>
        {state.status === 'error' ? (
          <DetailError message={state.message} notFound={state.notFound} what="este artista" onRetry={retry} />
        ) : (
          <DetailSkeleton />
        )}
      </DetailLayout>
    )
  }

  const disco = discography.status === 'ready' ? discography.data : null
  const albums = disco?.albums ?? []
  const tracks = disco?.topTracks ?? []
  const visibleAlbums = expanded ? albums : albums.slice(0, ALBUMS_PREVIEW)
  const visibleTracks = expanded ? tracks : tracks.slice(0, TRACKS_PREVIEW)
  // Artistas del CSV sin foto: el fondo difuminado usa la carátula más reciente.
  const imageUrl = artist.image_url ?? albums.find((album) => album.image_url)?.image_url ?? null
  const genres = artist.genres.slice(0, 2).join(' · ')

  return (
    <DetailLayout>
      <Breadcrumb items={[{ label: artist.name }]} />
      <MusicHero
        kind="ARTISTA"
        title={artist.name}
        subtitle={genres || 'Artista'}
        meta={artist.spotify_id ? 'Artista en Spotify' : ''}
        imageUrl={artist.image_url}
        backdropUrl={imageUrl}
        shape="circle"
        ratings={artist.ratings}
      />
      <MusicActions
        reviewTo={writeReviewPath('artist', artist.id)}
        spotifyHref={artist.spotify_id ? spotifyUrl('artist', artist.spotify_id) : null}
        shareTitle={artist.name}
      />

      <div className="flex w-full flex-col gap-6 md:grid md:grid-cols-[360px_minmax(0,1fr)_272px] md:items-start md:gap-x-10">
        <div className="flex flex-col gap-5">
          <CommunityRating
            ratings={artist.ratings}
            mine={myRating.status === 'ready' ? (myRating.data?.score ?? null) : null}
            editTo={writeReviewPath('artist', artist.id)}
          />
          {disco && (
            <p className="text-sm leading-[1.4] text-fg-soft">
              {albums.length === 1 ? '1 lanzamiento' : `${albums.length} lanzamientos`} y{' '}
              {tracks.length === 1 ? '1 canción' : `${tracks.length} canciones`} en Junkbox.
            </p>
          )}
        </div>

        <ReviewsSection
          title="Lo que dice la comunidad"
          state={reviews}
          variant="artist"
          music={{ title: artist.name, subtitle: 'Artista', imageUrl }}
        />

        {/* ArtistDiscography · "Imprescindibles" (Figma): álbumes y canciones como MusicRow. */}
        <section aria-label="Imprescindibles" className="flex w-full flex-col items-start gap-3">
          <SectionHeader title="Imprescindibles" />
          {discography.status === 'loading' && (
            <p className="text-sm leading-[1.4] text-fg-muted">Cargando la discografía…</p>
          )}
          {discography.status === 'error' && (
            <p className="text-sm leading-[1.4] text-fg-muted">No pudimos cargar la discografía.</p>
          )}
          {disco && albums.length + tracks.length === 0 && (
            <p className="text-sm leading-[1.4] text-fg-muted">Todavía no tenemos su discografía.</p>
          )}
          {disco && (
            <ul className="w-full">
              {visibleAlbums.map((album) => (
                <li key={album.id}>
                  <MusicRow
                    title={album.title}
                    subtitle={[KIND[album.album_type] ?? 'Álbum', album.release_year].filter(Boolean).join(' · ')}
                    imageUrl={album.image_url}
                    to={albumPath(album.id)}
                  />
                </li>
              ))}
              {visibleTracks.map((track) => (
                <li key={track.spotify_id}>
                  <MusicRow
                    title={track.track_name}
                    subtitle={['Canción', track.year].filter(Boolean).join(' · ')}
                    imageUrl={track.album_image_url}
                    to={songPath(track.spotify_id)}
                    action={<PlayButton label={`Reproducir ${track.track_name}`} />}
                  />
                </li>
              ))}
            </ul>
          )}
          {disco && (albums.length > ALBUMS_PREVIEW || tracks.length > TRACKS_PREVIEW) && (
            <button
              type="button"
              aria-expanded={expanded}
              onClick={() => setExpanded((value) => !value)}
              className="cursor-pointer rounded text-xs text-fg-placeholder hover:text-fg focus-visible:outline-2 focus-visible:outline-fg"
            >
              {expanded ? 'Ver menos' : 'Ver toda la discografía'}
            </button>
          )}
        </section>
      </div>
    </DetailLayout>
  )
}
