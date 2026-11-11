import { createBrowserRouter, Navigate } from 'react-router'
import { FORGOT_PASSWORD_PATH, RESET_PASSWORD_PATH, VERIFY_EMAIL_PATH } from '../features/auth/models/emailLink'
import { ForgotPasswordPage } from '../features/auth/views/ForgotPasswordPage'
import { LoginPage } from '../features/auth/views/LoginPage'
import { RegisterPage } from '../features/auth/views/RegisterPage'
import { ResetPasswordPage } from '../features/auth/views/ResetPasswordPage'
import { VerifyEmailPage } from '../features/auth/views/VerifyEmailPage'
import { HomePage } from '../features/home/views/HomePage'
import { PRIVACY_PATH, TERMS_PATH } from '../features/legal/models/legalPaths'
import { PrivacyPage } from '../features/legal/views/PrivacyPage'
import { ALBUM_PATH, ARTIST_PATH, SONG_PATH } from '../features/catalog/models/catalogPaths'
import { AlbumPage } from '../features/catalog/views/AlbumPage'
import { ArtistPage } from '../features/catalog/views/ArtistPage'
import { SongPage } from '../features/catalog/views/SongPage'
import { WRITE_REVIEW_PATH } from '../features/reviews/models/writeReview'
import { WriteReviewPage } from '../features/reviews/views/WriteReviewPage'
import { SEARCH_PATH } from '../features/search/models/search.types'
import { SearchPage } from '../features/search/views/SearchPage'
import { TermsPage } from '../features/legal/views/TermsPage'
import { AppLayout } from './layout/AppLayout'
import { ProtectedRoute, PublicOnlyRoute } from './routes/RouteGuards'

/**
 * Rutas de la aplicación. Cada módulo nuevo añade aquí sus pantallas.
 *  - /login, /register, /recuperar-contrasena: módulo Autenticación (solo sin sesión).
 *  - /restablecer-contrasena, /verificar-correo: enlaces de los correos del backend. Sin guarda:
 *    pueden abrirse con o sin sesión, y una guarda los redirigiría perdiendo el token.
 *  - /terminos, /privacidad: documentos legales, públicos (con o sin sesión).
 *  - Rutas con sesión: dentro de AppLayout (Navbar + BottomBar).
 *  - /: módulo Inicio. /buscar?q=: módulo Buscador.
 *  - /cancion/:id, /album/:id, /artista/:id: fichas del catálogo.
 *  - /resena/nueva?tipo=&id=: Escribir Reseña (calificaciones y reseñas).
 */
export const router = createBrowserRouter([
  {
    element: <PublicOnlyRoute />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
      { path: FORGOT_PASSWORD_PATH, element: <ForgotPasswordPage /> },
    ],
  },
  { path: RESET_PASSWORD_PATH, element: <ResetPasswordPage /> },
  { path: VERIFY_EMAIL_PATH, element: <VerifyEmailPage /> },
  { path: TERMS_PATH, element: <TermsPage /> },
  { path: PRIVACY_PATH, element: <PrivacyPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/', element: <HomePage /> },
          { path: SEARCH_PATH, element: <SearchPage /> },
          { path: SONG_PATH, element: <SongPage /> },
          { path: ALBUM_PATH, element: <AlbumPage /> },
          { path: ARTIST_PATH, element: <ArtistPage /> },
          { path: WRITE_REVIEW_PATH, element: <WriteReviewPage /> },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])
