import type { ReactNode } from 'react'
import { fieldDescriptionId } from './fieldIds'

interface FormFieldProps {
  /** id del <input> que etiqueta. */
  inputId: string
  label: string
  /** Texto de ayuda bajo el campo (Caption/12/Regular/140pct, text/secondary). */
  helperText?: string
  /** Mensaje de validación. Si existe, se muestra en lugar de la ayuda y se anuncia. */
  errorMessage?: string
  children: ReactNode
}

/**
 * FormField (Figma 14296:5948): etiqueta + entrada + ayuda opcional, con separación 4.
 * Etiqueta Body/14/Medium/140pct en text/primary.
 *
 * Nota: Figma no tiene un hueco para el mensaje de error por campo; el input muestra
 * "Revisa el campo". El motivo concreto se muestra en el hueco de ayuda (mismo estilo)
 * para que sea accesible. Ver implementacion.md · Módulo Autenticación · Decisiones.
 */
export function FormField({ inputId, label, helperText, errorMessage, children }: FormFieldProps) {
  const description = errorMessage ?? helperText

  return (
    <div className="flex w-full flex-col gap-1">
      <label htmlFor={inputId} className="text-sm leading-[1.4] font-medium text-fg">
        {label}
      </label>
      {children}
      {description && (
        <p
          id={fieldDescriptionId(inputId)}
          className="text-xs leading-[1.4] text-fg-muted"
          role={errorMessage ? 'alert' : undefined}
        >
          {description}
        </p>
      )}
    </div>
  )
}
