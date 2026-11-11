import { useNavigate } from 'react-router'
import { FormAlert } from '../../../shared/ui/FormAlert'
import { fieldDescriptionId } from '../../../shared/ui/fieldIds'
import { FormField } from '../../../shared/ui/FormField'
import { PasswordInput } from '../../../shared/ui/PasswordInput'
import { PrimaryButton } from '../../../shared/ui/PrimaryButton'
import { useResetPasswordController } from '../controllers/useResetPasswordController'
import { FORGOT_PASSWORD_PATH } from '../models/emailLink'
import { AuthLayout } from './AuthLayout'
import { AuthSwitchLink } from './AuthSwitchLink'
import { PASSWORD_HELPER } from './passwordHelper'

/**
 * Restablecer contraseña (/restablecer-contrasena#token=…, enlace del correo). NO SALE DE FIGMA:
 * boceto aprobado por el propietario (2026-11-06), con "Confirmar contraseña" a petición suya.
 * Endpoint: POST /api/v1/auth/password/reset { token, password }.
 */
export function ResetPasswordPage() {
  const { status, values, fieldErrors, formError, submitting, doneMessage, handleChange, handleSubmit } =
    useResetPasswordController()
  const navigate = useNavigate()
  const loginLink = <AuthSwitchLink prompt="¿La recordaste?" label="Inicia sesión" to="/login" />

  if (status === 'done') {
    return (
      <AuthLayout
        title="Contraseña actualizada"
        description={[doneMessage ?? 'Inicia sesión de nuevo.', 'Cerramos tu sesión en todos tus dispositivos.']}
        density="login"
      >
        <PrimaryButton type="button" label="Iniciar sesión" loadingLabel="" onClick={() => navigate('/login')} />
      </AuthLayout>
    )
  }

  if (status === 'invalid') {
    return (
      <AuthLayout
        title="Este enlace ya no sirve"
        description={['El enlace no es válido o ha caducado.', 'Pide uno nuevo para cambiar tu contraseña.']}
        density="login"
        footer={loginLink}
      >
        <PrimaryButton
          type="button"
          label="Pedir un enlace nuevo"
          loadingLabel=""
          onClick={() => navigate(FORGOT_PASSWORD_PATH)}
        />
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Crea una nueva contraseña"
      description="Escríbela dos veces para confirmarla."
      density="login"
      footer={loginLink}
    >
      <form noValidate onSubmit={handleSubmit} className="flex w-full flex-col gap-6" aria-label="Restablecer contraseña">
        <div className="flex w-full flex-col gap-4">
          <FormField
            inputId="reset-password"
            label="Nueva contraseña"
            helperText={PASSWORD_HELPER}
            errorMessage={fieldErrors.password}
          >
            <PasswordInput
              id="reset-password"
              name="password"
              autoComplete="new-password"
              placeholder="Crea una contraseña"
              value={values.password}
              onChange={handleChange}
              invalid={Boolean(fieldErrors.password)}
              aria-describedby={fieldDescriptionId('reset-password')}
              readOnly={submitting}
            />
          </FormField>

          <FormField inputId="reset-confirm-password" label="Confirmar contraseña" errorMessage={fieldErrors.confirmPassword}>
            <PasswordInput
              id="reset-confirm-password"
              name="confirmPassword"
              autoComplete="new-password"
              placeholder="Repite la contraseña"
              value={values.confirmPassword}
              onChange={handleChange}
              invalid={Boolean(fieldErrors.confirmPassword)}
              aria-describedby={fieldErrors.confirmPassword ? fieldDescriptionId('reset-confirm-password') : undefined}
              readOnly={submitting}
            />
          </FormField>
        </div>

        {formError && <FormAlert message={formError} />}

        <PrimaryButton label="Guardar contraseña" loadingLabel="Guardando contraseña…" loading={submitting} />
      </form>
    </AuthLayout>
  )
}
