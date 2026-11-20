import { useEffect, useState } from 'react'
import { useAuth } from '../../auth/controllers/authContext'
import type { SpotifyLinkStatus } from '../models/spotify'
import { spotifyAuthService } from '../services/spotifyAuthService'

/**
 * Estado de la vinculación con Spotify para Configuración: comprueba la cuenta vinculada en este
 * navegador (y si es Premium), e inicia o quita la vinculación.
 */
export function useSpotifyLink() {
  const { user } = useAuth()
  const userId = user?.id ?? null
  // `version` vuelve a cargar el perfil tras desvincular; el estado se deriva por clave.
  const [version, setVersion] = useState(0)
  const [loaded, setLoaded] = useState<{ key: string; status: SpotifyLinkStatus } | null>(null)
  const [starting, setStarting] = useState(false)

  const key = `${userId}:${version}`
  const linked = userId !== null && spotifyAuthService.hasLink(userId)

  // Al volver con "Atrás" desde Spotify, el navegador restaura la página tal cual (bfcache) y el
  // botón se quedaba en "Abriendo Spotify…": se reinicia al mostrarse de nuevo.
  useEffect(() => {
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) setStarting(false)
    }
    window.addEventListener('pageshow', onPageShow)
    return () => window.removeEventListener('pageshow', onPageShow)
  }, [])

  useEffect(() => {
    if (!userId || !spotifyAuthService.hasLink(userId)) return
    let cancelled = false
    spotifyAuthService
      .getProfile(userId)
      .then((profile) => !cancelled && setLoaded({ key, status: { status: 'linked', profile } }))
      .catch((error: unknown) => {
        if (cancelled) return
        const unlinked = !spotifyAuthService.hasLink(userId)
        setLoaded({
          key,
          status: unlinked
            ? { status: 'unlinked' }
            : { status: 'error', message: error instanceof Error ? error.message : 'No se pudo contactar con Spotify.' },
        })
      })
    return () => {
      cancelled = true
    }
  }, [userId, key])

  const status: SpotifyLinkStatus = !linked
    ? { status: 'unlinked' }
    : loaded?.key === key
      ? loaded.status
      : { status: 'checking' }

  async function link() {
    if (!userId || starting) return
    setStarting(true)
    await spotifyAuthService.startLink(userId, window.location.pathname)
  }

  function unlink() {
    if (!userId) return
    spotifyAuthService.unlink(userId)
    setVersion((value) => value + 1)
  }

  return {
    status,
    configured: spotifyAuthService.isConfigured(),
    onLinkOrigin: spotifyAuthService.isOnLinkOrigin(),
    linkOrigin: spotifyAuthService.linkOrigin(),
    starting,
    link,
    unlink,
  }
}
