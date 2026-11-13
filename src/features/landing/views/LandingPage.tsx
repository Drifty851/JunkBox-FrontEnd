import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { JunkboxLogo } from '../../../shared/ui/JunkboxLogo'
import { PRIVACY_PATH, TERMS_PATH } from '../../legal/models/legalPaths'
import {
  EASTER_EGG_COVER,
  EASTER_EGG_NUMBER,
  EASTER_EGG_RANGE,
  LANDING_COVERS,
  pickRandomCovers,
  type LandingCover,
} from '../data/landingCovers'
import { CoverWall, MobileCoverWall } from './CoverWall'

const BUTTON =
  'flex h-12 w-full items-center justify-center rounded-lg px-6 text-sm leading-none font-semibold whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg sm:w-48'

/** Portadas en móvil: 40 de las 80, al azar en cada visita. */
const MOBILE_COVER_COUNT = 40

interface WallCovers {
  desktop: readonly LandingCover[]
  mobile: readonly LandingCover[]
}

/**
 * Se sortea una sola vez al abrir la landing: el número del easter egg (1..EASTER_EGG_RANGE) y
 * las 40 portadas de móvil. Si sale EASTER_EGG_NUMBER, todo el fondo es EASTER_EGG_COVER.
 */
function drawCovers(): WallCovers {
  const roll = 1 + Math.floor(Math.random() * EASTER_EGG_RANGE)
  if (roll === EASTER_EGG_NUMBER) {
    return {
      desktop: LANDING_COVERS.map(() => EASTER_EGG_COVER),
      mobile: Array.from({ length: MOBILE_COVER_COUNT }, () => EASTER_EGG_COVER),
    }
  }
  return { desktop: LANDING_COVERS, mobile: pickRandomCovers(LANDING_COVERS, MOBILE_COVER_COUNT) }
}

/**
 * Landing (Hero Page) para usuarios sin sesión, en "/". Especificación del propietario
 * (2026-11-11 y 2026-11-13), con los tokens y componentes existentes.
 *  - Centro: logo de Junkbox, eslogan y dos enlaces de navegación (no modales) a /register y /login.
 *  - Escritorio: 80 portadas en filas inclinadas desde dos esquinas (CoverWall).
 *  - Móvil: 40 portadas al azar en filas que cubren toda la pantalla (MobileCoverWall).
 * Las portadas son una lista fija (LANDING-01): sin sesión no se puede pedir el catálogo.
 */
export function LandingPage() {
  // Inicializador de useState: se sortea una vez por visita, no en cada render.
  const [covers] = useState(drawCovers)

  useEffect(() => {
    const previous = document.title
    document.title = 'Junkbox · Califica, reseña y descubre música'
    return () => {
      document.title = previous
    }
  }, [])

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-bg">
      <CoverWall covers={covers.desktop} />
      <MobileCoverWall covers={covers.mobile} />

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center gap-6 px-6 py-10 text-center md:gap-8">
        <h1 className="flex flex-col items-center gap-4">
          <JunkboxLogo className="aspect-[212/46.08] w-[280px] sm:w-[340px] md:w-[424px]" />
          <span className="max-w-[22ch] text-xl leading-[1.4] font-semibold text-fg md:max-w-none md:text-2xl">
            Califica, reseña y descubre música.
          </span>
        </h1>

        <div className="flex w-full max-w-[342px] flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center">
          <Link to="/register" className={`${BUTTON} bg-action text-on-action hover:opacity-90`}>
            Registrarse
          </Link>
          <Link
            to="/login"
            className={`${BUTTON} border border-line bg-surface-quickplay font-medium text-fg hover:bg-surface-input-disabled`}
          >
            Iniciar sesión
          </Link>
        </div>
      </main>

      <footer className="relative z-10 px-6 pb-6 text-center text-xs leading-normal text-fg-muted md:pb-8">
        <Link to={TERMS_PATH} className="rounded hover:text-fg focus-visible:outline-2 focus-visible:outline-fg">
          Términos de Servicio
        </Link>
        {'  ·  '}
        <Link to={PRIVACY_PATH} className="rounded hover:text-fg focus-visible:outline-2 focus-visible:outline-fg">
          Política de Privacidad
        </Link>
      </footer>
    </div>
  )
}
