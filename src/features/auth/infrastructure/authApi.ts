import { request } from '../../../shared/api/httpClient'
import type {
  AuthResponse,
  LoginRequest,
  LogoutRequest,
  RefreshRequest,
  RegisterRequest,
  TokenPair,
  UserProfile,
} from '../models/auth.types'

/**
 * Adaptador de los endpoints /api/v1/auth/* del backend (router.go).
 * Solo transporte: no guarda estado ni decide flujos (eso es authService).
 */
export const authApi = {
  /** POST /auth/login → 200 AuthResponse · 400 · 401 "credenciales inválidas". */
  login(body: LoginRequest): Promise<AuthResponse> {
    return request<AuthResponse>('/auth/login', { method: 'POST', body })
  },

  /** POST /auth/register → 201 AuthResponse · 400 validación · 409 email/username duplicado. */
  register(body: RegisterRequest): Promise<AuthResponse> {
    return request<AuthResponse>('/auth/register', { method: 'POST', body })
  },

  /** GET /auth/me (Bearer) → 200 UserProfile · 401. */
  me(accessToken: string): Promise<UserProfile> {
    return request<UserProfile>('/auth/me', { accessToken })
  },

  /**
   * POST /auth/refresh → 200 TokenPair · 401.
   * Exige el access token ANTERIOR (aunque esté expirado) en Authorization.
   */
  refresh(previousAccessToken: string, body: RefreshRequest): Promise<TokenPair> {
    return request<TokenPair>('/auth/refresh', { method: 'POST', body, accessToken: previousAccessToken })
  },

  /** POST /auth/logout (Bearer) → 200 { message } (idempotente). */
  logout(accessToken: string, body: LogoutRequest): Promise<{ message: string }> {
    return request<{ message: string }>('/auth/logout', { method: 'POST', body, accessToken })
  },
}
