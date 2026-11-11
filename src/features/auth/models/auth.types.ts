/**
 * Tipos del contrato de autenticación del backend.
 * Fuente: internal/adapters/primary/http/dto/auth_dto.go, internal/core/domain/user.go
 * y README del backend §API REST (endpoints 2 a 6).
 */

/** domain.UserProfile: GET /auth/me y campo `user` de login/register. */
export interface UserProfile {
  id: string
  username: string
  email: string
  display_name: string | null
  avatar_url: string | null
  /** El usuario confirmó su correo con el enlace de verificación (commit 51ec315). */
  email_verified: boolean
  created_at: string
}

/** dto.LoginRequest: POST /auth/login. `identifier` admite email o username. */
export interface LoginRequest {
  identifier: string
  password: string
}

/** dto.RegisterRequest: POST /auth/register. El backend rechaza campos desconocidos. */
export interface RegisterRequest {
  username: string
  email: string
  password: string
  display_name?: string
  avatar_url?: string
}

/** domain.TokenPair: respuesta de POST /auth/refresh. */
export interface TokenPair {
  access_token: string
  refresh_token: string
  /** Segundos de vida del access token (900 = 15 min). */
  expires_in: number
}

/** dto.AuthResponse: respuesta de login (200) y register (201). */
export interface AuthResponse extends TokenPair {
  user: UserProfile
}

/** dto.RefreshRequest: POST /auth/refresh (requiere también el access token anterior en Authorization). */
export interface RefreshRequest {
  refresh_token: string
}

/** dto.LogoutRequest: POST /auth/logout. */
export interface LogoutRequest {
  refresh_token: string
  all_sessions?: boolean
}

/** dto.ForgotPasswordRequest: POST /auth/password/forgot. */
export interface ForgotPasswordRequest {
  email: string
}

/** dto.ResetPasswordRequest: POST /auth/password/reset. `token` es el del enlace del correo. */
export interface ResetPasswordRequest {
  token: string
  password: string
}

/** dto.VerifyEmailRequest: POST /auth/email/verify. `token` es el del enlace del correo. */
export interface VerifyEmailRequest {
  token: string
}

/** dto.MessageResponse: respuesta de los endpoints que solo confirman una acción. */
export interface MessageResponse {
  message: string
}

/** Sesión guardada en el cliente. */
export interface StoredSession {
  accessToken: string
  refreshToken: string
  /** Marca de tiempo (ms) en la que expira el access token. */
  accessTokenExpiresAt: number
}
