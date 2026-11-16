import { useState, type MouseEvent } from 'react'
import { useNavigate } from 'react-router'
import { songPath } from '../../catalog/models/catalogPaths'
import type { NowPlaying } from '../models/player'
import { resolveCatalogSongId } from '../services/catalogLink'

/**
 * Abrir la ficha de la canción del reproductor: antes se asegura de que exista en el catálogo
 * (resolveCatalogSongId), porque puede haberse cambiado desde la app de Spotify. Con clic normal
 * se resuelve y navega; con Ctrl/Cmd o clic central se deja el comportamiento del enlace.
 */
export function useOpenSongPage() {
  const navigate = useNavigate()
  const [opening, setOpening] = useState(false)

  function open(event: MouseEvent<HTMLAnchorElement>, track: NowPlaying, onOpened?: () => void) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return
    event.preventDefault()
    if (opening) return
    setOpening(true)
    resolveCatalogSongId(track)
      .catch(() => track.spotifyId)
      .then((id) => {
        setOpening(false)
        onOpened?.()
        navigate(songPath(id))
      })
  }

  return { open, opening }
}
