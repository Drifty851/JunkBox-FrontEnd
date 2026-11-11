import { useState, type ReactNode } from 'react'
import { MusicRow } from '../../../shared/ui/MusicRow'
import { SecondaryButton } from '../../../shared/ui/SecondaryButton'
import { StarRating } from '../../../shared/ui/StarRating'
import { formatCount, formatRating } from '../../../shared/utils/formatRating'
import type { AlbumRating, AlbumResult, ArtistResult, SearchResults, SongResult } from '../models/search.types'
import { PlayButton } from '../../../shared/ui/PlayButton'
import { albumPath, artistPath, songPath } from '../../catalog/models/catalogPaths'
import { Link } from 'react-router'

/** Canciones visibles antes de "Ver todas las canciones" (Figma muestra 5 en escritorio). */
const SONGS_PREVIEW = 5

interface SearchResultsViewProps {
  results: SearchResults
  featuredRating: AlbumRating | null
}

/**
 * Search results (Figma · 14244:50741 móvil / 14244:50854 escritorio).
 *  - Móvil: una columna con Canciones, Álbumes y Artistas como MusicRow.
 *  - Escritorio: Canciones a la izquierda y, a 48 px, una columna de 384 con las tarjetas
 *    AlbumResult (álbum destacado) y ArtistResult.
 */
export function SearchResultsView({ results, featuredRating }: SearchResultsViewProps) {
  return (
    <div className="flex w-full flex-col gap-6 md:flex-row md:items-start md:gap-12">
      <SongSection songs={results.songs} />
      {(results.albums.length > 0 || results.artists.length > 0) && (
        <div className="flex w-full flex-col gap-6 md:w-[384px] md:shrink-0">
          {results.albums.length > 0 && <AlbumSection albums={results.albums} featuredRating={featuredRating} />}
          {results.artists.length > 0 && <ArtistSection artists={results.artists} />}
        </div>
      )}
    </div>
  )
}

function SectionHeader({ title, aside }: { title: string; aside?: ReactNode }) {
  return (
    <div className="flex w-full items-center justify-between gap-4 leading-[1.4]">
      <h2 className="text-lg font-semibold text-fg">{title}</h2>
      {aside}
    </div>
  )
}

function SongSection({ songs }: { songs: SongResult[] }) {
  const [expanded, setExpanded] = useState(false)
  const visible = expanded ? songs : songs.slice(0, SONGS_PREVIEW)

  return (
    <section aria-label="Canciones" className="flex w-full min-w-0 flex-col items-start gap-2 md:flex-1">
      <SectionHeader
        title="Canciones"
        aside={
          <p className="text-xs whitespace-nowrap text-fg-placeholder">
            {songs.length === 1 ? '1 resultado' : `${songs.length} resultados`}
          </p>
        }
      />
      {songs.length === 0 ? (
        <p className="py-2 text-sm leading-[1.4] text-fg-muted">No encontramos canciones.</p>
      ) : (
        <ul className="w-full">
          {visible.map((song) => (
            <li key={song.spotifyId}>
              <MusicRow
                title={song.title}
                subtitle={song.album ? `${song.artist} · ${song.album}` : song.artist}
                imageUrl={song.imageUrl}
                to={songPath(song.spotifyId)}
                action={<PlayButton label={`Reproducir ${song.title}`} />}
              />
            </li>
          ))}
        </ul>
      )}
      {songs.length > SONGS_PREVIEW && (
        <SecondaryButton
          label={expanded ? 'Ver menos canciones' : 'Ver todas las canciones'}
          aria-expanded={expanded}
          onClick={() => setExpanded((value) => !value)}
        />
      )}
    </section>
  )
}

function albumSubtitle(album: AlbumResult, withKind: boolean): string {
  return [album.artist, withKind ? album.kind : null, album.year].filter((part) => part !== null).join(' · ')
}

function AlbumSection({ albums, featuredRating }: { albums: AlbumResult[]; featuredRating: AlbumRating | null }) {
  const [expanded, setExpanded] = useState(false)
  const [featured, ...rest] = albums

  return (
    <section
      aria-label="Álbumes"
      className="flex w-full flex-col gap-2 md:gap-4 md:rounded-lg md:border md:border-line md:p-6"
    >
      <SectionHeader
        title="Álbumes"
        aside={
          rest.length > 0 && (
            <button
              type="button"
              aria-expanded={expanded}
              onClick={() => setExpanded((value) => !value)}
              className="hidden cursor-pointer rounded text-xs whitespace-nowrap text-fg-placeholder hover:text-fg focus-visible:outline-2 focus-visible:outline-fg md:block"
            >
              {expanded ? 'Ver menos' : 'Ver todos'}
            </button>
          )
        }
      />

      {/* Móvil: filas (Figma muestra el álbum como MusicRow). */}
      <ul className="w-full md:hidden">
        {albums.slice(0, 3).map((album) => (
          <li key={album.id}>
            <MusicRow
                  title={album.title}
                  subtitle={albumSubtitle(album, true)}
                  imageUrl={album.imageUrl}
                  to={albumPath(album.id)}
                />
          </li>
        ))}
      </ul>

      {/* Escritorio: Album preview (carátula 128, título Heading/28) + "Ver álbum". */}
      <div className="hidden w-full flex-col gap-4 md:flex">
        <div className="flex w-full items-center gap-4">
          <span className="block size-32 shrink-0 overflow-hidden rounded bg-surface-input-disabled">
            {featured.imageUrl !== null && (
              <img src={featured.imageUrl} alt="" className="size-full object-cover" />
            )}
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-2 leading-[1.4]">
            <Link
              to={albumPath(featured.id)}
              className="truncate rounded text-heading-sm leading-[1.4] font-bold text-fg hover:underline focus-visible:outline-2 focus-visible:outline-fg"
            >
              {featured.title}
            </Link>
            <p className="truncate text-sm text-fg-placeholder">{albumSubtitle(featured, false)}</p>
            {featuredRating && featuredRating.average !== null ? (
              <>
                <StarRating value={featuredRating.average} />
                <p className="text-xs text-fg-placeholder">
                  {formatRating(featuredRating.average)} · {formatCount(featuredRating.count)}{' '}
                  {featuredRating.count === 1 ? 'valoración' : 'valoraciones'}
                </p>
              </>
            ) : (
              featuredRating && <p className="text-xs text-fg-placeholder">Sin valoraciones todavía</p>
            )}
          </div>
        </div>
        <Link
          to={albumPath(featured.id)}
          className="flex h-11 w-full items-center justify-center rounded-lg border border-line bg-surface-quickplay px-4 text-sm leading-[1.4] font-medium text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
        >
          Ver álbum
        </Link>
        {expanded && (
          <ul className="w-full">
            {rest.map((album) => (
              <li key={album.id}>
                <MusicRow
                  title={album.title}
                  subtitle={albumSubtitle(album, true)}
                  imageUrl={album.imageUrl}
                  to={albumPath(album.id)}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}

function ArtistSection({ artists }: { artists: ArtistResult[] }) {
  return (
    <section
      aria-label="Artistas"
      className="flex w-full flex-col gap-2 md:gap-3 md:rounded-lg md:border md:border-line md:p-6"
    >
      <SectionHeader title="Artistas" />
      <ul className="w-full">
        {artists.map((artist) => (
          <li key={artist.id}>
            <MusicRow
              title={artist.name}
              subtitle={artist.genre ? `Artista · ${artist.genre}` : 'Artista'}
              imageUrl={artist.imageUrl}
              shape="circle"
              to={artistPath(artist.id)}
            />
          </li>
        ))}
      </ul>
    </section>
  )
}
