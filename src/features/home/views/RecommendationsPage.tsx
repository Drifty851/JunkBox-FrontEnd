import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import arrowLeftIcon from '../../../assets/icons/arrow-left-20.svg'
import { FormAlert } from '../../../shared/ui/FormAlert'
import { MaskIcon } from '../../../shared/ui/MaskIcon'
import { MusicRow } from '../../../shared/ui/MusicRow'
import { PlayButton } from '../../../shared/ui/PlayButton'
import { useLoad } from '../../catalog/controllers/useLoad'
import { songPath } from '../../catalog/models/catalogPaths'
import { usePlayer } from '../../player/controllers/playerContext'
import { homeService } from '../services/homeService'

/** Canciones de "Ver todo" (GET /home acepta hasta 50). */
const COUNT = 24

const loadAll = (_key: string, signal: AbortSignal) => homeService.getRecommendations(COUNT, signal)

/**
 * "Ver todo" de "Hecho para tus oídos" (/recomendaciones). No está en Figma (decisión del
 * propietario, 2026-11-15): cabecera de Configuración (flecha + título) y filas MusicRow que se
 * pueden reproducir. Las mismas recomendaciones de Inicio (GET /home, HOME-01), con más canciones.
 */
export function RecommendationsPage() {
  const navigate = useNavigate()
  const { play } = usePlayer()
  const [state, retry] = useLoad('recommendations', loadAll)

  useEffect(() => {
    const previous = document.title
    document.title = 'Hecho para tus oídos · Junkbox'
    return () => {
      document.title = previous
    }
  }, [])

  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-4 px-4 pt-3 pb-4 md:gap-6 md:px-8 md:pt-8 md:pb-8 xl:px-20">
      <header className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Volver"
          onClick={() => navigate(-1)}
          className="flex shrink-0 cursor-pointer rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
        >
          <MaskIcon src={arrowLeftIcon} size={20} className="bg-fg" />
        </button>
        <h1 className="text-2xl leading-[1.4] font-bold text-fg md:text-[32px]">Hecho para tus oídos</h1>
      </header>

      {state.status === 'ready' ? (
        state.data.length === 0 ? (
          <p className="text-sm leading-[1.4] text-fg-muted">Todavía no hay recomendaciones.</p>
        ) : (
          <ul className="flex w-full flex-col md:max-w-[800px]">
            {state.data.map((item) => (
              <li key={item.id}>
                <MusicRow
                  title={item.track_name}
                  subtitle={`Canción · ${item.artist_name}`}
                  imageUrl={item.album_image_url}
                  to={songPath(item.spotify_id)}
                  action={<PlayButton label={`Reproducir ${item.track_name}`} onPlay={() => play(item.spotify_id)} />}
                />
              </li>
            ))}
          </ul>
        )
      ) : state.status === 'error' ? (
        <div className="flex flex-col items-start gap-2">
          <FormAlert message={state.message} />
          <button
            type="button"
            onClick={retry}
            className="cursor-pointer text-link-sm font-medium text-link underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
          >
            Reintentar
          </button>
        </div>
      ) : (
        <ul aria-busy="true" aria-label="Cargando recomendaciones" className="flex w-full flex-col gap-2 md:max-w-[800px]">
          {[0, 1, 2, 3, 4].map((index) => (
            <li key={index} aria-hidden="true" className="h-16 w-full rounded bg-surface-input-disabled motion-safe:animate-pulse" />
          ))}
        </ul>
      )}
    </div>
  )
}
