import { Link, useParams } from 'react-router'
import { MusicRow } from '../../../shared/ui/MusicRow'
import { formatDuration } from '../../../shared/utils/formatTime'
import { catalogService } from '../../music/services/catalogService'
import {
  discographyKey,
  loadDiscography,
  loadReviews,
  loadSong,
  loadMyRating,
  reviewsKey,
} from '../controllers/catalogLoaders'
import { useLoad } from '../controllers/useLoad'
import { writeReviewPath } from '../../reviews/models/writeReview'
import { albumPath, artistPath, spotifyUrl } from '../models/catalogPaths'
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

/**
 * Ficha de Canción · Figma: móvil 14244:51392 (claro) / 14263:22646 (oscuro),
 * escritorio 14244:51550 (claro) / 14263:22818 (oscuro).
 * Endpoints: GET /music/tracks/{id}, /music/artists/{id}, /music/albums/{id}, GET /reviews y la
 * cascada del artista (catalogService.hydrateArtist), que guarda su discografía en la base.
 * Escritorio: SongStats de 424 a la izquierda y RecentReviews a la derecha (separación 48).
 */
export function SongPage() {
  const { id = '' } = useParams()
  const [state, retry] = useLoad(id, loadSong)
  const data = state.status === 'ready' ? state.data : null

  const artistRef = data?.artist ? { id: data.artist.id, name: data.artist.name } : null
  const [discography] = useLoad(artistRef ? discographyKey(artistRef) : null, loadDiscography)
  const [reviews] = useLoad(data ? reviewsKey('song', data.track.spotify_id) : null, loadReviews)
  const [myRating] = useLoad(data ? reviewsKey('song', data.track.spotify_id) : null, loadMyRating)

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
        <DetailError message={state.message} notFound={state.notFound} what="esta canción" onRetry={retry} />
      </DetailLayout>
    )
  }

  const { track, artist } = state.data
  // Canciones del CSV sin álbum enlazado: se busca en la discografía de la cascada.
  const album =
    state.data.album ??
    catalogService.findAlbumForTrack(track, discography.status === 'ready' ? discography.data : null)
  const imageUrl = track.album_image_url ?? album?.image_url ?? null
  const meta = [
    track.year ?? album?.release_year,
    track.duration_ms ? formatDuration(track.duration_ms) : null,
    track.genre ?? artist?.genres[0],
    'Spotify',
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <DetailLayout>
      <Breadcrumb
        items={[
          ...(artist ? [{ label: artist.name, to: artistPath(artist.id) }] : [{ label: track.artist_name }]),
          { label: track.track_name },
        ]}
      />
      <MusicHero
        kind="CANCIÓN"
        title={track.track_name}
        subtitle={
          <>
            {artist ? (
              <Link to={artistPath(artist.id)} className="rounded hover:underline focus-visible:outline-2 focus-visible:outline-fg">
                {artist.name}
              </Link>
            ) : (
              track.artist_name
            )}
            {album && (
              <>
                {' · '}
                <Link to={albumPath(album.id)} className="rounded hover:underline focus-visible:outline-2 focus-visible:outline-fg">
                  {album.title}
                </Link>
              </>
            )}
          </>
        }
        meta={meta}
        imageUrl={imageUrl}
        ratings={track.ratings}
      />
      <MusicActions reviewTo={writeReviewPath('song', track.spotify_id)} spotifyHref={spotifyUrl('song', track.spotify_id)} shareTitle={track.track_name} />

      <div className="flex w-full flex-col gap-6 md:flex-row md:items-start md:gap-12">
        <div className="flex w-full flex-col gap-6 md:w-[424px] md:shrink-0">
          <CommunityRating
            ratings={track.ratings}
            mine={myRating.status === 'ready' ? (myRating.data?.score ?? null) : null}
            editTo={writeReviewPath('song', track.spotify_id)}
          />
          {/* Track information (Figma · "Acerca de esta canción"): datos reales y enlaces de la cascada. */}
          <section aria-label="Acerca de esta canción" className="flex w-full flex-col gap-2">
            <SectionHeader title="Acerca de esta canción" />
            <p className="text-sm leading-[1.4] text-fg-soft">
              {album ? `Del ${album.album_type === 'single' ? 'sencillo' : 'álbum'} ${album.title}, de ${album.artist_name}.` : `De ${track.artist_name}.`}
              {discography.status === 'loading' && ' Cargando la discografía del artista…'}
            </p>
            <ul className="w-full">
              {album && (
                <li>
                  <MusicRow
                    title={album.title}
                    subtitle={[album.album_type === 'single' ? 'Sencillo' : 'Álbum', album.release_year].filter(Boolean).join(' · ')}
                    imageUrl={album.image_url}
                    to={albumPath(album.id)}
                  />
                </li>
              )}
              {artist && (
                <li>
                  <MusicRow
                    title={artist.name}
                    subtitle={artist.genres[0] ? `Artista · ${artist.genres[0]}` : 'Artista'}
                    imageUrl={artist.image_url ?? track.artist_image_url}
                    shape="circle"
                    to={artistPath(artist.id)}
                  />
                </li>
              )}
            </ul>
          </section>
        </div>
        <div className="flex w-full min-w-0 flex-1">
          <ReviewsSection
            title="Reseñas recientes"
            state={reviews}
            music={{
              title: track.track_name,
              subtitle: [track.artist_name, album?.title, track.year].filter(Boolean).join(' · '),
              imageUrl,
            }}
          />
        </div>
      </div>
    </DetailLayout>
  )
}
