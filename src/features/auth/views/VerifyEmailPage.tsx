import { useNavigate } from 'react-router'
import { PrimaryButton } from '../../../shared/ui/PrimaryButton'
import { useAuth } from '../controllers/authContext'
import { useVerifyEmailController } from '../controllers/useVerifyEmailController'
import { AuthLayout } from './AuthLayout'

/**
 * Verificar correo (/verificar-correo#token=…, enlace del correo de registro). NO SALE DE FIGMA:
 * boceto aprobado por el propietario (2026-11-06). Funciona con y sin sesión iniciada.
 * El reenvío del enlace (POST /auth/email/verify/resend) espera a que Diseño lo defina.
 * Endpoint: POST /api/v1/auth/email/verify { token }.
 */
export function VerifyEmailPage() {
  const { state, retry } = useVerifyEmailController()
  const { status } = useAuth()
  const navigate = useNavigate()
  const goToApp = () => navigate(status === 'authenticated' ? '/' : '/login')

  if (state.status === 'verifying') {
    return (
      <AuthLayout title="Verificando tu correo" description="Un momento, por favor." density="login">
        <PrimaryButton type="button" label="" loadingLabel="Verificando…" loading />
      </AuthLayout>
    )
  }

  if (state.status === 'verified') {
    return (
      <AuthLayout title="Correo verificado" description={[state.message, 'Ya puedes usar Junkbox.']} density="login">
        <PrimaryButton type="button" label="Ir a Junkbox" loadingLabel="" onClick={goToApp} />
      </AuthLayout>
    )
  }

  if (state.status === 'error') {
    return (
      <AuthLayout title="No pudimos verificar tu correo" description={state.message} density="login">
        <PrimaryButton type="button" label="Reintentar" loadingLabel="" onClick={retry} />
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="No pudimos verificar tu correo"
      description="El enlace no es válido o ha caducado."
      density="login"
    >
      <PrimaryButton type="button" label="Ir a Junkbox" loadingLabel="" onClick={goToApp} />
    </AuthLayout>
  )
}
