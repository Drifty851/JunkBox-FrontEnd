import type { InputHTMLAttributes, ReactNode } from 'react'
import circleMinusIcon from '../../../assets/icons/circle-minus-16.svg'
import radioCheckedIcon from '../../../assets/icons/radio-checked-16.svg'
import spotifyLogo from '../../../assets/brand/spotify-logo.png'
import { fieldDescriptionId } from '../../../shared/ui/fieldIds'
import { MaskIcon } from '../../../shared/ui/MaskIcon'
import { cn } from '../../../shared/utils/cn'
import { DEFAULT_FREQUENCY, FREQUENCY_OPTIONS } from '../models/settings'

/** Título de sección: Title/16/SemiBold en móvil y Title/20/SemiBold en escritorio. */
const SECTION_TITLE = 'text-base leading-[1.4] font-semibold text-fg md:text-xl'

export function SectionTitle({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <h2 id={id} className={SECTION_TITLE}>
      {children}
    </h2>
  )
}

/** Nota "pendiente" bajo los controles que aún no tienen backend. */
export function PendingNote({ children }: { children: ReactNode }) {
  return <p className="text-xs leading-[1.4] text-fg-placeholder">{children}</p>
}

const NAV_ITEMS = ['Cuenta y música', 'Perfil público', 'Privacidad', 'Ayuda'] as const

/**
 * SettingsNavigation (Figma 14296:15752, solo escritorio). Solo "Cuenta y música" tiene diseño:
 * las demás secciones se muestran deshabilitadas (decisión del propietario, 2026-11-13).
 */
export function SettingsNav({ onLogout }: { onLogout: () => void }) {
  return (
    <nav aria-label="Secciones de configuración" className="hidden w-48 shrink-0 flex-col gap-2 md:flex">
      {NAV_ITEMS.map((label, index) =>
        index === 0 ? (
          <span key={label} aria-current="page" className="flex h-11 items-start rounded-lg bg-surface-input-disabled p-3 text-sm leading-[1.4] font-semibold text-fg">
            {label}
          </span>
        ) : (
          <span key={label} aria-disabled="true" className="flex h-11 items-start rounded-lg p-3 text-sm leading-[1.4] text-fg-placeholder">
            {label}
          </span>
        ),
      )}
      <button
        type="button"
        onClick={onLogout}
        className="cursor-pointer self-start rounded text-xs leading-[1.4] text-fg-placeholder hover:text-fg focus-visible:outline-2 focus-visible:outline-fg"
      >
        Cerrar sesión
      </button>
    </nav>
  )
}

/** SpotifyButton · ConnectSpotify (Figma 14296:5579 / 14296:5598). Deshabilitado hasta el módulo Spotify. */
function SpotifyButton() {
  return (
    <button
      type="button"
      aria-disabled="true"
      aria-describedby="spotify-pending"
      className="flex h-11 w-full cursor-default items-center justify-center gap-2 rounded-lg bg-surface-input-disabled text-sm leading-[1.4] font-medium text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
    >
      <img src={spotifyLogo} alt="" width={20} height={20} className="size-5 shrink-0 object-cover" />
      Vincular Cuenta de Spotify
    </button>
  )
}

/**
 * "Tu cuenta de música" (Figma · SpotifyConnection 14244:53507 escritorio / 14244:53394 móvil).
 * La vinculación (PKCE) llega con el módulo Spotify + Reproductor.
 */
export function SpotifySection() {
  return (
    <section aria-labelledby="spotify-title" className="flex w-full flex-col gap-2 md:gap-4 md:rounded-lg md:bg-surface-input-disabled md:p-6">
      {/* Móvil: título y estado en una fila. Escritorio: título, estado con icono y descripción. */}
      <div className="flex items-start justify-between md:flex-col md:gap-4">
        <h2 id="spotify-title" className="text-sm leading-[1.4] font-semibold text-fg md:text-xl">
          <span className="md:hidden">Cuenta de música</span>
          <span className="hidden md:inline">Tu cuenta de música</span>
        </h2>
        <p className="flex items-center gap-2 text-xs leading-[1.4] text-fg-placeholder md:text-sm md:text-fg-soft">
          <span className="hidden md:inline-flex">
            <MaskIcon src={circleMinusIcon} size={16} className="bg-fg-soft" />
          </span>
          Spotify no vinculado
        </p>
        <p className="hidden text-sm leading-[1.4] text-fg-soft md:block">
          Conecta Spotify para descubrir música a tu medida y reproducir tus canciones favoritas.
        </p>
      </div>
      <SpotifyButton />
      <p className="text-caption-2xs text-fg-placeholder md:hidden">OAuth seguro · Nunca guardamos tu contraseña</p>
      <p className="hidden text-[11px] leading-[1.4] text-fg-placeholder md:block">
        Conexión segura mediante OAuth. Nunca guardamos tu contraseña.
      </p>
      <span id="spotify-pending" className="sr-only">Disponible próximamente.</span>
    </section>
  )
}

/**
 * "Frecuencia de recomendaciones" (Figma · RecommendationFrequency, FrequencyOption 14296:4240 /
 * 14296:4283). Sin backend (PREF-01): se muestra "Semanal" marcado y deshabilitado.
 * Móvil: rejilla 2×2 de 32 px y texto 11; escritorio: lista de 48 px y texto 14.
 */
export function FrequencySection() {
  return (
    <fieldset disabled aria-describedby="frequency-pending" className="flex w-full min-w-0 flex-col gap-2 md:gap-3">
      <legend className={cn(SECTION_TITLE, 'mb-2 md:mb-3')}>Frecuencia de recomendaciones</legend>
      <p className="hidden text-sm leading-[1.4] text-fg-soft md:block">
        Elige cuándo recibir nuevos descubrimientos. Tu ritmo, tus reglas.
      </p>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-1 md:gap-3">
        {FREQUENCY_OPTIONS.map((option) => {
          const selected = option.value === DEFAULT_FREQUENCY
          return (
            <label
              key={option.value}
              className={cn(
                'flex h-8 items-center gap-2 rounded-lg border px-2 text-[11px] leading-[1.4] text-fg md:h-12 md:px-3 md:text-sm',
                selected ? 'border-action font-medium' : 'border-line',
              )}
            >
              <input type="radio" name="frequency" value={option.value} defaultChecked={selected} className="sr-only" />
              {selected ? (
                <MaskIcon src={radioCheckedIcon} size={16} className="bg-fg" />
              ) : (
                <span aria-hidden="true" className="size-4 shrink-0 rounded-full border border-fg-placeholder" />
              )}
              {option.label}
            </label>
          )
        })}
      </div>
      <span id="frequency-pending">
        <PendingNote>Pendiente del backend: por ahora no se puede cambiar.</PendingNote>
      </span>
    </fieldset>
  )
}

interface ProfileFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className' | 'id'> {
  id: string
  label: string
  errorMessage?: string
}

/**
 * ProfileField (Figma 14296:4439 / 14296:4469): caja de 48 con la etiqueta dentro (Caption/10,
 * text/secondary-2) y el valor (Body/13, text/primary). Figma solo tiene el estado por defecto;
 * foco y error reutilizan los del TextInput (borde text/primary o brand/accent).
 */
export function ProfileField({ id, label, errorMessage, ...rest }: ProfileFieldProps) {
  const invalid = errorMessage !== undefined
  return (
    <div className="flex w-full flex-col gap-1">
      <label
        htmlFor={id}
        className={cn(
          'flex h-12 w-full flex-col justify-center gap-0.5 rounded-lg border px-3 py-1.5',
          invalid
            ? 'border-accent shadow-[inset_0_0_0_1px_var(--color-accent)]'
            : 'border-line focus-within:border-fg focus-within:shadow-[inset_0_0_0_1px_var(--color-fg)]',
        )}
      >
        <span className="text-caption-2xs text-fg-placeholder">{label}</span>
        <input
          id={id}
          aria-invalid={invalid || undefined}
          aria-describedby={invalid ? fieldDescriptionId(id) : undefined}
          className="w-full bg-transparent text-[13px] leading-[1.4] text-fg outline-none"
          {...rest}
        />
      </label>
      {invalid && (
        <p id={fieldDescriptionId(id)} role="alert" className="text-xs leading-[1.4] text-fg-muted">
          {errorMessage}
        </p>
      )}
    </div>
  )
}

