import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import arrowLeftIcon from '../../../assets/icons/arrow-left-20.svg'
import { Avatar } from '../../../shared/ui/Avatar'
import { MaskIcon } from '../../../shared/ui/MaskIcon'
import { PrimaryButton } from '../../../shared/ui/PrimaryButton'
import { defaultAvatarUrl } from '../../../shared/utils/defaultAvatar'
import { useSettingsController } from '../controllers/useSettingsController'
import { FrequencySection, PendingNote, ProfileField, SectionTitle, SettingsNav, SpotifySection } from './SettingsSections'

/** Button pequeño de Figma (Variant=Button 14296:3403): alto 32, padding 12, borde, Body/14/Medium. */
const SMALL_BUTTON =
  'flex h-8 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-line bg-surface-quickplay px-3 text-sm leading-[1.4] font-medium whitespace-nowrap text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg aria-disabled:cursor-default aria-disabled:text-fg-placeholder'

/**
 * Configuración · Figma: móvil 14244:53364 (claro) / 14263:24792 (oscuro), escritorio
 * 14244:53464 (claro) / 14263:24903 (oscuro). Solo la sección "Cuenta y música".
 * Cambios del propietario respecto a Figma (2026-11-13): sin "Bio musical"; "Información pública"
 * añade el correo (privado) y "Cambiar contraseña".
 * Sin backend: guardar el perfil y la foto (USER-01), la frecuencia (PREF-01) y vincular Spotify
 * (módulo Spotify + Reproductor). Se muestran como plantillas deshabilitadas.
 */
export function SettingsPage() {
  const navigate = useNavigate()
  const {
    user,
    values,
    fieldErrors,
    handleChange,
    canSave,
    passwordReset,
    passwordResetCooldown,
    requestPasswordReset,
    logout,
  } = useSettingsController()
  const passwordLocked = passwordReset.status === 'sending' || passwordResetCooldown > 0

  useEffect(() => {
    const previous = document.title
    document.title = 'Configuración · Junkbox'
    return () => {
      document.title = previous
    }
  }, [])

  return (
    <div className="flex w-full flex-col gap-3 px-4 pt-3 pb-4 md:gap-8 md:px-20 md:py-8">
      <header className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Volver"
          onClick={() => navigate(-1)}
          className="flex cursor-pointer rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
        >
          <MaskIcon src={arrowLeftIcon} size={20} className="bg-fg" />
        </button>
        <h1 className="text-2xl leading-[1.4] font-bold text-fg md:text-[32px]">Configuración</h1>
      </header>

      <div className="flex flex-col gap-3 md:flex-row md:items-start md:gap-12">
        <SettingsNav onLogout={() => void logout()} />

        <div className="flex min-w-0 flex-1 flex-col gap-3 md:gap-6 xl:flex-row xl:items-start xl:gap-12">
          <div className="flex min-w-0 flex-1 flex-col gap-3 md:gap-6">
            <SpotifySection />
            <FrequencySection />
          </div>

          <form
            noValidate
            onSubmit={(event) => event.preventDefault()}
            aria-labelledby="profile-title"
            className="flex w-full flex-col gap-2 md:order-first md:gap-4 md:rounded-lg md:border md:border-line md:p-6 xl:order-none xl:w-[440px] xl:shrink-0"
          >
            <SectionTitle id="profile-title">Información pública</SectionTitle>

            {/* Edit profile photo: solo escritorio en Figma. Sin backend para subirla (USER-01). */}
            <div className="hidden items-center gap-4 md:flex">
              <Avatar
                src={user?.avatar_url ?? null}
                fallbackSrc={user ? defaultAvatarUrl(user.username) : null}
                alt=""
                className="size-16"
              />
              <button type="button" aria-disabled="true" className={SMALL_BUTTON}>
                Cambiar foto
              </button>
            </div>

            <ProfileField
              id="settings-display-name"
              name="displayName"
              label="Nombre"
              autoComplete="nickname"
              value={values.displayName}
              placeholder={user?.username}
              onChange={handleChange}
              errorMessage={fieldErrors.displayName}
            />
            <ProfileField
              id="settings-username"
              name="username"
              label="Usuario"
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              value={values.username}
              onChange={handleChange}
              errorMessage={fieldErrors.username}
            />
            <ProfileField
              id="settings-email"
              name="email"
              type="email"
              label="Correo (privado)"
              autoComplete="email"
              value={values.email}
              onChange={handleChange}
              errorMessage={fieldErrors.email}
            />

            {/* Contraseña: sin cambio con sesión (USER-02); se envía el enlace de recuperación. */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[13px] leading-[1.4] text-fg">Contraseña</span>
                <button
                  type="button"
                  onClick={() => void requestPasswordReset()}
                  aria-disabled={passwordLocked || undefined}
                  className={SMALL_BUTTON}
                >
                  {passwordReset.status === 'sending'
                    ? 'Enviando…'
                    : passwordResetCooldown > 0
                      ? `Espera ${passwordResetCooldown} s`
                      : 'Cambiar contraseña'}
                </button>
              </div>
              <p aria-live="polite" className="text-xs leading-[1.4] text-fg-muted">
                {passwordReset.status === 'sent' || passwordReset.status === 'error'
                  ? passwordReset.message
                  : 'Te enviaremos un enlace a tu correo para elegir una nueva (hasta 3 por hora).'}
              </p>
            </div>

            <p className="text-xs leading-[1.4] text-fg-placeholder">
              Esta información aparece en tu perfil público. Tu correo siempre será privado.
            </p>
            <PrimaryButton
              label="Guardar cambios"
              loadingLabel="Guardando…"
              disabled={!canSave}
              aria-describedby="profile-pending"
              className="h-11 font-medium"
            />
            <span id="profile-pending">
              <PendingNote>Pendiente del backend: por ahora no se pueden guardar los cambios ni la foto.</PendingNote>
            </span>
          </form>
        </div>
      </div>
    </div>
  )
}
