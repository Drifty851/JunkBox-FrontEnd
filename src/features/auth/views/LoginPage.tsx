import { Link } from 'react-router'
import { FormAlert } from '../../../shared/ui/FormAlert'
import { fieldDescriptionId } from '../../../shared/ui/fieldIds'
import { FormField } from '../../../shared/ui/FormField'
import { PasswordInput } from '../../../shared/ui/PasswordInput'
import { PrimaryButton } from '../../../shared/ui/PrimaryButton'
import { TextInput } from '../../../shared/ui/TextInput'
import { useLoginController } from '../controllers/useLoginController'
import { FORGOT_PASSWORD_PATH } from '../models/emailLink'
import { AuthLayout } from './AuthLayout'
import { AuthSwitchLink } from './AuthSwitchLink'

/**
 * Iniciar sesión · Figma: móvil 14296:2388 (claro) / 14296:2489 (oscuro),
 * escritorio 14296:2442 (claro) / 14296:2543 (oscuro). Formulario: LoginForm (14296:16086).
 * Endpoint: POST /api/v1/auth/login { identifier, password }.
 */
export function LoginPage() {
  const { values, fieldErrors, formError, submitting, handleChange, handleSubmit } = useLoginController()

  return (
    <AuthLayout
      title="Iniciar sesión"
      description={['Qué bueno tenerte de vuelta.', 'Tu música y tu comunidad te esperan.']}
      density="login"
      footer={<AuthSwitchLink prompt="¿Aún no tienes cuenta?" label="Regístrate" to="/register" />}
    >
      <form noValidate onSubmit={handleSubmit} className="flex w-full flex-col gap-6" aria-label="Iniciar sesión">
        <div className="flex w-full flex-col gap-4">
          {/* El backend acepta email o username en `identifier`. Figma etiqueta el campo como correo;
              por decisión del propietario (2026-11-11) se deja claro que vale cualquiera de los dos (AUTH-05). */}
          <FormField inputId="login-identifier" label="Correo o nombre de usuario" errorMessage={fieldErrors.identifier}>
            <TextInput
              id="login-identifier"
              name="identifier"
              type="text"
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              placeholder="correo@dominio.com o tu_usuario"
              value={values.identifier}
              onChange={handleChange}
              invalid={Boolean(fieldErrors.identifier)}
              aria-describedby={fieldErrors.identifier ? fieldDescriptionId('login-identifier') : undefined}
              readOnly={submitting}
            />
          </FormField>

          <FormField inputId="login-password" label="Contraseña" errorMessage={fieldErrors.password}>
            <PasswordInput
              id="login-password"
              name="password"
              autoComplete="current-password"
              placeholder="Introduce tu contraseña"
              value={values.password}
              onChange={handleChange}
              invalid={Boolean(fieldErrors.password)}
              aria-describedby={fieldErrors.password ? fieldDescriptionId('login-password') : undefined}
              readOnly={submitting}
            />
          </FormField>

          {/* PasswordRecovery (Figma): lleva a Recuperar contraseña (POST /auth/password/forgot). */}
          <div className="flex w-full justify-end">
            <Link
              to={FORGOT_PASSWORD_PATH}
              className="rounded text-link-sm font-medium text-link underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
        </div>

        {formError && <FormAlert message={formError} />}

        <PrimaryButton label="Iniciar sesión" loadingLabel="Iniciando sesión…" loading={submitting} />
      </form>
    </AuthLayout>
  )
}
