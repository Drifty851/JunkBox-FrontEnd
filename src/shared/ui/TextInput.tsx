import type { InputHTMLAttributes } from 'react'
import { FieldInputBox, fieldInputClassName } from './FieldInputBox'

interface TextInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> {
  invalid?: boolean
}

/** TextInput (Figma 14296:3707) · Estados: Default, Focus, Error, Disabled. */
export function TextInput({ invalid = false, disabled, ...rest }: TextInputProps) {
  return (
    <FieldInputBox invalid={invalid} disabled={disabled}>
      <input
        className={fieldInputClassName}
        disabled={disabled}
        aria-invalid={invalid || undefined}
        {...rest}
      />
    </FieldInputBox>
  )
}
