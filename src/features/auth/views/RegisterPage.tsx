import { Checkbox } from '../../../shared/ui/Checkbox'
import { FormAlert } from '../../../shared/ui/FormAlert'
import { fieldDescriptionId } from '../../../shared/ui/fieldIds'
import { FormField } from '../../../shared/ui/FormField'
import { PasswordInput } from '../../../shared/ui/PasswordInput'
import { PrimaryButton } from '../../../shared/ui/PrimaryButton'
import { TextInput } from '../../../shared/ui/TextInput'
import { useRegisterController } from '../controllers/useRegisterController'
import { AuthLayout } from './AuthLayout'
import { AuthSwitchLink } from './AuthSwitchLink'

/** Texto de ayuda de RegistrationPassword en Figma (alineado con la regla del backend: 8–72 bytes). */
const PASSWORD_HELPER = 'De 8 a 72 bytes. Algunos caracteres ocupan más de un byte.'

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

        {/* TermsAcceptance: solo se valida en el cliente (SOLICITUDES_BACKEND.md · AUTH-03). */}
        <div className="group w-full">
          <Checkbox
            id="register-terms"
            name="termsAccepted"
            checked={values.termsAccepted}
            onChange={handleChange}
            disabled={submitting}
          >
            Acepto los <TermsLink>Términos de Servicio</TermsLink> y la <TermsLink>Política de Privacidad</TermsLink>.
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
 * Texto subrayado de los términos. Figma: text/secondary sin marcar y text/primary marcado (claro);
 * text/primary en oscuro. No es un enlace porque aún no hay URLs de los documentos legales.
 */
function TermsLink({ children }: { children: string }) {
  return <span className="text-fg-muted underline group-has-checked:text-fg dark:text-fg">{children}</span>
}
