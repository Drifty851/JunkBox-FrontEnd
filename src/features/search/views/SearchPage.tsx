import { FormAlert } from '../../../shared/ui/FormAlert'
import { SecondaryButton } from '../../../shared/ui/SecondaryButton'
import { useSearchController } from '../controllers/useSearchController'
import { SearchHeader } from './SearchHeader'
import { SearchResultsView } from './SearchResultsView'
import { UserSearchResults } from './UserSearchResults'

/**
 * Buscador · Música. Figma: móvil 14244:50703 (claro) / 14263:21885 (oscuro),
 * escritorio 14244:50815 (claro) / 14263:22014 (oscuro).
 * Endpoint: GET /api/v1/music/search (track, album y artist en paralelo).
 * Móvil: márgenes 16, arriba 12. Escritorio: márgenes 80, arriba 32, separación 24.
 * Los estados inicial, cargando, vacío y error no están en Figma (textos propios).
 * Usuarios (2026-11-15): Figma 14244:50943 / 14244:51045, plantilla hasta SEARCH-04.
 */
export function SearchPage() {
  const { input, kind, selectKind, state, featuredRating, handleChange, handleSubmit, clear, retry } = useSearchController()

  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-3 px-4 pt-3 pb-4 md:gap-6 md:px-8 md:pt-8 md:pb-8 xl:px-20">
      <SearchHeader input={input} onChange={handleChange} onSubmit={handleSubmit} onClear={clear} kind={kind} onSelectKind={selectKind} />

      {kind === 'users' ? (
        <UserSearchResults query={input.trim()} />
      ) : (
        <div aria-live="polite" aria-busy={state.status === 'loading'} className="w-full">
          {state.status === 'idle' && (
            <p className="text-sm leading-[1.4] text-fg-muted">Busca canciones, álbumes o artistas.</p>
          )}

          {state.status === 'loading' && (
            <p className="text-sm leading-[1.4] text-fg-muted">Buscando “{state.query}”…</p>
          )}

          {state.status === 'error' && (
            <div className="flex w-full flex-col items-start gap-3 md:max-w-[800px]">
              <FormAlert message={state.message} />
              <SecondaryButton label="Reintentar" onClick={retry} />
            </div>
          )}

          {state.status === 'ready' &&
            (state.results.songs.length + state.results.albums.length + state.results.artists.length === 0 ? (
              <p className="text-sm leading-[1.4] text-fg-muted">
                No encontramos resultados para “{state.results.query}”.
              </p>
            ) : (
              <SearchResultsView results={state.results} featuredRating={featuredRating} />
            ))}
        </div>
      )}
    </div>
  )
}
