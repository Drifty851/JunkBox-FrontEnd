import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { readEmailLinkToken } from '../models/emailLink'

/**
 * Token de un enlace de correo (`#token=…`). Se lee una sola vez al abrir la página y se quita
 * de la barra de direcciones para que no quede en el historial del navegador.
 */
export function useEmailLinkToken(): string | null {
  const location = useLocation()
  const navigate = useNavigate()
  const [token] = useState(() => readEmailLinkToken(location.hash))

  useEffect(() => {
    if (location.hash === '') return
    navigate({ pathname: location.pathname, search: location.search, hash: '' }, { replace: true })
  }, [location.hash, location.pathname, location.search, navigate])

  return token
}
