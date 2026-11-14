import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { useAuth } from '../../auth/controllers/authContext'
import { SETTINGS_PATH } from '../../settings/models/settings'
import { spotifyAuthService } from '../services/spotifyAuthService'

/**
 * Intercambios en curso por `search`: el código de Spotify solo sirve una vez y React (StrictMode)
 * ejecuta los efectos dos veces en desarrollo.
 */
const inflight = new Map<string, Promise<string>>()

/**
 * Retorno de Spotify (/spotify/callback?code=&state=). Termina la vinculación y vuelve a la
 * pantalla desde la que se inició (Configuración). No está en Figma: mensaje mínimo.
 */
export function SpotifyCallbackPage() {
  const { user } = useAuth()
  const { search } = useLocation()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    let request = inflight.get(search)
    if (!request) {
      request = spotifyAuthService.completeLink(search, user.id)
      inflight.set(search, request)
    }
    let cancelled = false
    request
      .then((returnTo) => !cancelled && navigate(returnTo, { replace: true }))
      .catch((reason: unknown) => {
        if (!cancelled) setError(reason instanceof Error ? reason.message : 'No se pudo vincular Spotify.')
      })
    return () => {
      cancelled = true
    }
  }, [search, user, navigate])

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      {error ? (
        <>
          <p role="alert" className="text-sm leading-[1.4] text-fg">
            {error}
          </p>
          <Link to={SETTINGS_PATH} className="rounded text-sm font-medium text-link underline focus-visible:outline-2 focus-visible:outline-fg">
            Volver a Configuración
          </Link>
        </>
      ) : (
        <p aria-live="polite" className="text-sm leading-[1.4] text-fg-muted">
          Vinculando tu cuenta de Spotify…
        </p>
      )}
    </div>
  )
}
