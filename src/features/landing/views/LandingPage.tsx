import { useEffect } from 'react'
import { Link } from 'react-router'
import { JunkboxLogo } from '../../../shared/ui/JunkboxLogo'
import { PRIVACY_PATH, TERMS_PATH } from '../../legal/models/legalPaths'
import { CoverStrip, CoverWall } from './CoverWall'

const BUTTON =
  'flex h-12 w-full items-center justify-center rounded-lg px-6 text-sm leading-none font-semibold whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg sm:w-48'

/**
 * Landing (Hero Page) para usuarios sin sesión, en "/". NO SALE DE FIGMA: especificación del
 * propietario (2026-11-11), con los tokens y componentes existentes.
 *  - Centro: logo de Junkbox, eslogan y dos enlaces de navegación (no modales) a /register y /login.
 *  - Escritorio: portadas en columnas diagonales desde dos esquinas (CoverWall).
 *  - Móvil: un carrusel de portadas arriba y otro abajo, en sentidos opuestos (CoverStrip).
 * Las portadas son una lista fija (LANDING-01): sin sesión no se puede pedir el catálogo.
 */
export function LandingPage() {
  useEffect(() => {
    const previous = document.title
    document.title = 'Junkbox · Califica, reseña y descubre música'
    return () => {
      document.title = previous
    }
  }, [])

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-bg">
      <CoverWall />

      <div className="pt-6 md:hidden">
        <CoverStrip position="top" />
      </div>

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

      <div className="pb-4 md:hidden">
        <CoverStrip position="bottom" />
      </div>

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
