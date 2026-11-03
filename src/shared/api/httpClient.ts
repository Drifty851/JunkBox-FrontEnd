/**
 * Cliente HTTP mínimo para el backend de Junkbox (Go · Chi).
 *
 * Contrato (README del backend §API REST):
 *  - Base: /api/v1 (en desarrollo, el proxy de Vite la redirige a http://localhost:8080).
 *  - Errores: siempre JSON { "error": "<mensaje>" } con estado 400/401/404/409/500/502.
 */

const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL ?? '/api/v1'

/** Cuerpo de error que envía el backend (dto.ErrorResponse). */
interface ErrorResponseBody {
  error: string
}

/** Error con respuesta del backend: conserva el código HTTP y el mensaje `error`. */
export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

/** Fallo de red: el backend no respondió (está apagado o el proxy no lo alcanza). */
export class NetworkError extends Error {
  constructor() {
    super('No se pudo conectar con el servidor.')
    this.name = 'NetworkError'
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST'
  body?: unknown
  accessToken?: string | null
  signal?: AbortSignal
}

function isErrorResponseBody(value: unknown): value is ErrorResponseBody {
  return (
    typeof value === 'object' &&
    value !== null &&
    'error' in value &&
    typeof (value as { error: unknown }).error === 'string'
  )
}

/** Hace una petición JSON al backend y devuelve el cuerpo tipado, o lanza ApiError/NetworkError. */
export async function request<TResponse>(path: string, options: RequestOptions = {}): Promise<TResponse> {
  const { method = 'GET', body, accessToken, signal } = options
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`

  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    })
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === 'AbortError') throw cause
    throw new NetworkError()
  }

  const payload: unknown = await response.json().catch(() => null)

  if (!response.ok) {
    const message = isErrorResponseBody(payload) ? payload.error : 'error interno'
    throw new ApiError(response.status, message)
  }

  return payload as TResponse
}
