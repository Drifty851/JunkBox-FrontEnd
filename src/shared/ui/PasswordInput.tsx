import { useState, type InputHTMLAttributes } from 'react'
import eyeIcon from '../../assets/icons/eye.svg'
import { FieldInputBox, fieldInputClassName } from './FieldInputBox'
import { MaskIcon } from './MaskIcon'

interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className' | 'type'> {
  invalid?: boolean
}

/**
 * PasswordInput (Figma 14296:3770) · Estados: Default, Focus, Error, Disabled, Visible.
 * PasswordVisibilityToggle: icono eye 18px + "Mostrar" / "Ocultar" (Caption/12, text/secondary).
 * Figma usa el mismo icono eye en el estado Visible; solo cambia el texto.
 */
export function PasswordInput({ invalid = false, disabled, ...rest }: PasswordInputProps) {
  const [visible, setVisible] = useState(false)

  return (
    <FieldInputBox invalid={invalid} disabled={disabled}>
      <input
        type={visible ? 'text' : 'password'}
        className={fieldInputClassName}
        disabled={disabled}
        aria-invalid={invalid || undefined}
        {...rest}
      />
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        disabled={disabled}
        aria-pressed={visible}
        aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        className="flex shrink-0 cursor-pointer items-center gap-1 rounded text-xs leading-none text-fg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg disabled:cursor-not-allowed"
      >
        <MaskIcon src={eyeIcon} size={18} className="bg-fg-muted" />
        <span aria-hidden="true">{visible ? 'Ocultar' : 'Mostrar'}</span>
      </button>
    </FieldInputBox>
  )
}
