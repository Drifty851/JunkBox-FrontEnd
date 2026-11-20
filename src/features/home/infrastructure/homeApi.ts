import { request } from '../../../shared/api/httpClient'
import type { HomeResponse } from '../models/home.types'

/** Adaptador de GET /api/v1/home (backend handlers_home.go). Bearer. Errores: 400 `limit` · 401. */
export const homeApi = {
  /** GET /home?limit= → 200 HomeResponse. `limit` de 1 a 50 (por defecto 8). */
  getHome(limit: number, accessToken: string, signal?: AbortSignal): Promise<HomeResponse> {
    return request<HomeResponse>(`/home?limit=${limit}`, { accessToken, signal })
  },
}
