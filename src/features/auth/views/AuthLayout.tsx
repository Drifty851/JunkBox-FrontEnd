import type { ReactNode } from 'react'
import { JunkboxLogo } from '../../../shared/ui/JunkboxLogo'
import { cn } from '../../../shared/utils/cn'

interface AuthLayoutProps {
  title: string
  /** Líneas de AuthDescription (Figma las separa en dos párrafos). */
  description: [string, string]
  /** Separación vertical de Figma: Login 24 en móvil, Registro 16 en móvil; 32 en escritorio. */
  density: 'login' | 'register'
  /** Formulario (LoginForm / RegisterForm). */
  children: ReactNode
  /** Enlace para cambiar de pantalla (AuthFooter). */
  footer: ReactNode
}

/**
 * AuthShell + AuthContent de Figma. Mobile First:
 *  - Móvil (390): contenido de 342 de ancho, padding 24 lateral y 16 inferior;
 *    40 superior en Login y 24 en Registro; título de 28.
 *  - Escritorio (md ≥ 768): contenido de 480, padding 64/80/40, separación 32, título de 32.
 * Los enlaces legales siguen al AuthFooter en móvil y bajan al pie de la página en escritorio.
 * La barra de estado y el HomeIndicator de los frames móviles simulan el teléfono y no se implementan.
 */
export function AuthLayout({ title, description, density, children, footer }: AuthLayoutProps) {
  const isLogin = density === 'login'

  return (
    <main
      className={cn(
        'flex min-h-dvh flex-col items-center bg-bg px-6 pb-4 md:px-20 md:pt-16 md:pb-10',
        isLogin ? 'pt-10' : 'pt-6',
      )}
    >
      <div
        className={cn(
          'flex w-full max-w-[342px] flex-col items-center md:max-w-[480px] md:gap-8',
          isLogin ? 'gap-6' : 'gap-4',
        )}
      >
        <JunkboxLogo />

        <header className="flex w-full flex-col gap-2 text-center">
          <h1 className="text-heading-sm font-bold text-fg md:text-heading">{title}</h1>
          <p className="text-sm leading-normal text-fg-muted">
            <span className="block">{description[0]}</span>
            <span className="block">{description[1]}</span>
          </p>
        </header>

        {children}

        <p className="w-full text-center text-sm leading-normal text-fg-muted">{footer}</p>
      </div>

      <LegalLinks className={cn(isLogin ? 'mt-6' : 'mt-4', 'md:mt-auto md:pt-8')} />
    </main>
  )
}

/**
 * LegalLinks (Caption/12/Regular/150pct, text/secondary).
 * No son enlaces todavía: no hay URLs de Términos ni de Privacidad definidas.
 */
function LegalLinks({ className }: { className?: string }) {
  return (
    <p className={cn('w-full text-center text-xs leading-normal whitespace-pre-wrap text-fg-muted', className)}>
      {'Términos de Servicio  ·  Política de Privacidad'}
    </p>
  )
}
