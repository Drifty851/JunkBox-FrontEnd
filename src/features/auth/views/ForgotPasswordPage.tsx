import { useNavigate } from 'react-router'
import { FormAlert } from '../../../shared/ui/FormAlert'
import { fieldDescriptionId } from '../../../shared/ui/fieldIds'
import { FormField } from '../../../shared/ui/FormField'
import { PrimaryButton } from '../../../shared/ui/PrimaryButton'
import { TextInput } from '../../../shared/ui/TextInput'
import { useForgotPasswordController } from '../controllers/useForgotPasswordController'
import { AuthLayout } from './AuthLayout'
import { AuthSwitchLink } from './AuthSwitchLink'

/**
 * Recuperar contraseña (/recuperar-contrasena). NO SALE DE FIGMA: no hay pantallas de
 * recuperación. Boceto aprobado por el propietario (2026-11-06) con los componentes de AuthShell.
 * Endpoint: POST /api/v1/auth/password/forgot { email }.
 */
export function ForgotPasswordPage() {
  const { values, fieldErrors, formError, submitting, sentMessage, resent, handleChange, handleSubmit, resend } =
    useForgotPasswordController()
  const navigate = useNavigate()

  if (sentMessage !== null) {
    return (
      <AuthLayout
        title="Revisa tu correo"
        description={[sentMessage, 'El enlace caduca en 30 minutos.']}
        density="login"
        footer={
          <>
            {'¿No te llegó? '}
            <button
              type="button"
              onClick={resend}
              disabled={submitting}
              className="cursor-pointer rounded font-semibold text-link underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg disabled:cursor-progress"
            >
              {submitting ? 'Reenviando enlace…' : 'Reenviar enlace'}
            </button>
          </>
        }
      >
        <div className="flex w-full flex-col gap-4">
          <p aria-live="polite" className="text-center text-xs leading-[1.4] text-fg-muted">
            {resent ? 'Te enviamos otro enlace.' : ''}
          </p>
          {formError && <FormAlert message={formError} />}
          <PrimaryButton
            type="button"
            label="Volver a iniciar sesión"
            loadingLabel=""
            onClick={() => navigate('/login')}
          />
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Recupera tu contraseña"
      description="Escribe tu correo y te enviaremos un enlace para crear una nueva."
      density="login"
      footer={<AuthSwitchLink prompt="¿La recordaste?" label="Inicia sesión" to="/login" />}
    >
      <form noValidate onSubmit={handleSubmit} className="flex w-full flex-col gap-6" aria-label="Recuperar contraseña">
        <FormField inputId="forgot-email" label="Correo electrónico" errorMessage={fieldErrors.email}>
          <TextInput
            id="forgot-email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="correo@dominio.com"
            value={values.email}
            onChange={handleChange}
            invalid={Boolean(fieldErrors.email)}
            aria-describedby={fieldErrors.email ? fieldDescriptionId('forgot-email') : undefined}
            readOnly={submitting}
          />
        </FormField>

        {formError && <FormAlert message={formError} />}

        <PrimaryButton label="Enviar enlace" loadingLabel="Enviando enlace…" loading={submitting} />
      </form>
    </AuthLayout>
  )
}
