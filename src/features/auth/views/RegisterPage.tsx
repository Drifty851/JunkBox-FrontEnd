import { Checkbox } from '../../../shared/ui/Checkbox'
import { FormAlert } from '../../../shared/ui/FormAlert'
import { fieldDescriptionId } from '../../../shared/ui/fieldIds'
import { FormField } from '../../../shared/ui/FormField'
import { PasswordInput } from '../../../shared/ui/PasswordInput'
import { PrimaryButton } from '../../../shared/ui/PrimaryButton'
import { TextInput } from '../../../shared/ui/TextInput'
import { PRIVACY_PATH, TERMS_PATH } from '../../legal/models/legalPaths'
import { useRegisterController } from '../controllers/useRegisterController'
import { AuthLayout } from './AuthLayout'
import { AuthSwitchLink } from './AuthSwitchLink'
import { PASSWORD_HELPER } from './passwordHelper'


/**
 * Registrarse · Figma: móvil 14296:2590 (claro) / 14296:2702 (oscuro),
 * escritorio 14296:2649 (claro) / 14296:2761 (oscuro). Formulario: RegisterForm (14296:16233).
 * Endpoint: POST /api/v1/auth/register { username, email, password, display_name? }.
 */
export function RegisterPage() {
  const { values, fieldErrors, formError, submitting, canSubmit, handleChange, handleSubmit } =
    useRegisterController()

  const describedBy = (id: string, show: boolean) => (show ? fieldDescriptionId(id) : undefined)

  return (
    <AuthLayout
      title="Crea tu cuenta"
      description={['Tu próxima obsesión empieza aquí.', 'Descubre, valora y comparte música.']}
      density="register"
      showThemeToggle
      footer={<AuthSwitchLink prompt="¿Ya tienes una cuenta?" label="Iniciar sesión" to="/login" />}
    >
      <form noValidate onSubmit={handleSubmit} className="flex w-full flex-col gap-4" aria-label="Crear cuenta">
        <div className="flex w-full flex-col gap-4">
          {/* display_name (opcional en el backend, máx. 100 caracteres). */}
          <FormField inputId="register-display-name" label="Nombre público" errorMessage={fieldErrors.displayName}>
            <TextInput
              id="register-display-name"
              name="displayName"
              autoComplete="name"
              placeholder="Cómo quieres que te conozcan"
              value={values.displayName}
              onChange={handleChange}
              invalid={Boolean(fieldErrors.displayName)}
              aria-describedby={describedBy('register-display-name', Boolean(fieldErrors.displayName))}
              readOnly={submitting}
            />
          </FormField>

          {/* username (obligatorio): ^[a-z0-9_.]{3,50}$ tras pasar a minúsculas. */}
          <FormField inputId="register-username" label="Nombre de usuario" errorMessage={fieldErrors.username}>
            <TextInput
              id="register-username"
              name="username"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              placeholder="tu_usuario"
              value={values.username}
              onChange={handleChange}
              invalid={Boolean(fieldErrors.username)}
              aria-describedby={describedBy('register-username', Boolean(fieldErrors.username))}
              readOnly={submitting}
            />
          </FormField>

          <FormField inputId="register-email" label="Correo electrónico" errorMessage={fieldErrors.email}>
            <TextInput
              id="register-email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="correo@dominio.com"
              value={values.email}
              onChange={handleChange}
              invalid={Boolean(fieldErrors.email)}
              aria-describedby={describedBy('register-email', Boolean(fieldErrors.email))}
              readOnly={submitting}
            />
          </FormField>

          <FormField
            inputId="register-password"
            label="Contraseña"
            helperText={PASSWORD_HELPER}
            errorMessage={fieldErrors.password}
          >
            <PasswordInput
              id="register-password"
              name="password"
              autoComplete="new-password"
              placeholder="Crea una contraseña"
              value={values.password}
              onChange={handleChange}
              invalid={Boolean(fieldErrors.password)}
              aria-describedby={fieldDescriptionId('register-password')}
              readOnly={submitting}
            />
          </FormField>
        </div>

        {/* TermsAcceptance: solo se valida en el cliente (implementacion.md §3.8). */}
        <div className="group w-full">
          <Checkbox
            id="register-terms"
            name="termsAccepted"
            checked={values.termsAccepted}
            onChange={handleChange}
            disabled={submitting}
          >
            Acepto los <TermsLink to={TERMS_PATH}>Términos de Servicio</TermsLink> y la{' '}
            <TermsLink to={PRIVACY_PATH}>Política de Privacidad</TermsLink>.
          </Checkbox>
        </div>

        {formError && <FormAlert message={formError} />}

        <PrimaryButton
          label="Crear cuenta"
          loadingLabel="Creando cuenta…"
          loading={submitting}
          disabled={!canSubmit}
        />
      </form>
    </AuthLayout>
  )
}

/**
 * Enlace subrayado de los términos. Figma: text/secondary sin marcar y text/primary marcado (claro);
 * text/primary en oscuro. Se abre en otra pestaña para no perder el formulario.
 */
function TermsLink({ to, children }: { to: string; children: string }) {
  return (
    <a
      href={to}
      target="_blank"
      rel="noopener noreferrer"
      className="rounded text-fg-muted underline group-has-checked:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg dark:text-fg"
    >
      {children}
    </a>
  )
}
