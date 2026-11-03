import type { InputHTMLAttributes, ReactNode } from 'react'
import checkIcon from '../../assets/icons/check.svg'

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'className'> {
  children: ReactNode
}

/**
 * ConsentCheckbox (Figma · RegisterForm › TermsAcceptance), 20×20, radio 4, separación 8 con el texto.
 *  - Sin marcar: fondo surface/default, borde 1.5px border/default-2.
 *  - Marcado (State=Checked): fondo brand/accent, borde brand/accent-2 e icono check (12px, original).
 * Se usa un <input type="checkbox"> nativo, invisible, para mantener teclado y lectores de pantalla.
 */
export function Checkbox({ children, id, ...rest }: CheckboxProps) {
  return (
    <div className="flex w-full items-start gap-2">
      <span className="relative flex size-5 shrink-0">
        <input
          id={id}
          type="checkbox"
          className="peer absolute inset-0 m-0 size-5 cursor-pointer opacity-0"
          {...rest}
        />
        <span
          aria-hidden="true"
          className="pointer-events-none flex size-5 items-center justify-center rounded border-[1.5px] border-line-strong bg-surface peer-checked:border-action peer-checked:bg-accent peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-fg [&>img]:hidden peer-checked:[&>img]:block"
        >
          <img src={checkIcon} alt="" width={12} height={12} />
        </span>
      </span>
      <label htmlFor={id} className="flex-1 cursor-pointer text-xs leading-normal text-fg-muted">
        {children}
      </label>
    </div>
  )
}
