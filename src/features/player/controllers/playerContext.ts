import { createContext, useContext } from 'react'
import type { PlayerState } from '../models/player'

export interface PlayerContextValue {
  state: PlayerState
  /** Reproduce una canción por su ID de Spotify. Si falta Spotify Premium, muestra el aviso. */
  play: (spotifyId: string) => void
  togglePlay: () => void
  /** "Atrás": vuelve al inicio de la canción. */
  restart: () => void
  /** "Adelante": termina la canción (queda al final, en pausa). */
  finish: () => void
  setVolume: (volume: number) => void
  /** X: detiene y oculta el reproductor. */
  close: () => void
  setExpanded: (expanded: boolean) => void
}

export const PlayerContext = createContext<PlayerContextValue | null>(null)

/** Acceso al reproductor. Debe usarse dentro de <PlayerProvider> (pantallas con sesión). */
export function usePlayer(): PlayerContextValue {
  const value = useContext(PlayerContext)
  if (!value) throw new Error('usePlayer debe usarse dentro de <PlayerProvider>.')
  return value
}

/** Igual que usePlayer, pero devuelve null fuera del proveedor (componentes compartidos). */
export function useOptionalPlayer(): PlayerContextValue | null {
  return useContext(PlayerContext)
}
