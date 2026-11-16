import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import arrowLeftIcon from '../../../assets/icons/arrow-left-20.svg'
import { MaskIcon } from '../../../shared/ui/MaskIcon'
import { MusicRow } from '../../../shared/ui/MusicRow'
import { PlayButton } from '../../../shared/ui/PlayButton'
import { usePlayer } from '../../player/controllers/playerContext'
import { KIND_LABEL, targetPath } from '../models/home.types'
import { homeService } from '../services/homeService'

/** Elementos por carga. */
const COUNT = 24

/**
 * "Ver todo" de "Hecho para tus oídos" (/recomendaciones). No está en Figma (decisión del
 * propietario, 2026-11-15): cabecera de Configuración (flecha + título) y filas MusicRow; las
 * canciones se pueden reproducir. Elementos al azar de la lista de prueba en cada carga (HOME-01).
 */
export function RecommendationsPage() {
  const navigate = useNavigate()
  const { play } = usePlayer()
  const [items] = useState(() => homeService.pickRecommendations(COUNT))

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
      <ul className="flex w-full flex-col md:max-w-[800px]">
        {items.map((item) => (
          <li key={`${item.type}:${item.id}`}>
            <MusicRow
              title={item.title}
              subtitle={item.type === 'song' ? `${KIND_LABEL.song} · ${item.subtitle}` : item.subtitle}
              imageUrl={item.imageUrl}
              shape={item.type === 'artist' ? 'circle' : 'square'}
              to={targetPath(item)}
              action={item.type === 'song' ? <PlayButton label={`Reproducir ${item.title}`} onPlay={() => play(item.id)} /> : undefined}
            />
          </li>
        ))}
      </ul>
    </div>
  )
}
