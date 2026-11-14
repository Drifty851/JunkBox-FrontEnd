import type { ReactNode } from 'react'
import plusIcon from '../../assets/icons/plus.svg'
import { JunkboxLogo } from '../ui/JunkboxLogo'
import { MaskIcon } from '../ui/MaskIcon'
import { ThemeToggle } from '../ui/ThemeToggle'
import { cn } from '../utils/cn'
import { AccountMenu, type AccountSummary } from './AccountMenu'
import type { NavigationItem } from './navigation.types'
import { NavTarget } from './NavTarget'

interface NavbarProps {
  /** Enlaces del centro (solo escritorio): Inicio, Buscador, Perfil. */
  links: NavigationItem[]
  /** Destino del botón "Crear Reseña" (solo escritorio); `null` si no existe aún. */
  createReviewTo: string | null
  /** SearchField: lo aporta el módulo Buscador (campo con sugerencias). */
  search: ReactNode
  /** Cuenta del menú del avatar; `null` mientras se carga el perfil. */
  account: AccountSummary | null
  /** Ruta de Configuración (menú del avatar); `null` mientras no exista el módulo. */
  settingsTo: string | null
  onLogout: () => Promise<void>
}

/**
 * Navbar de Junkbox (Figma · Navbar). Una sola pieza responsive:
 *  - Móvil (14296:13787 / 14296:13056): alto 52, logo 128, SearchField "Buscar música", avatar 28.
 *  - Escritorio (14296:13870 / 14296:13139): alto 80, logo 160, SearchField de 344,
 *    enlaces, botón "Crear Reseña" y avatar 36.
 * Figma solo define 1440 px: entre 768 y 1280 px se reducen márgenes y el buscador se encoge.
 * A la derecha del avatar va el botón de tema (ThemeToggle; no está en Figma, aprobado 2026-11-13).
 */
export function Navbar({ links, createReviewTo, search, account, settingsTo, onLogout }: NavbarProps) {
  return (
    <header className="sticky top-0 z-10 flex h-[52px] shrink-0 items-center gap-3 border-b border-line bg-surface-nav px-4 md:h-20 md:gap-6 md:px-8 xl:gap-10 xl:px-16">
      <NavTarget to="/" ariaLabel="Junkbox, ir a Inicio" className={() => 'shrink-0 rounded'}>
        {() => <JunkboxLogo className="h-[27.81px] w-32 md:h-[34.77px] md:w-40" />}
      </NavTarget>

      {/* SearchField (Figma): el módulo Buscador lo hace escribible y con sugerencias. */}
      {search}

      <nav aria-label="Principal" className="hidden min-w-0 flex-1 items-center gap-7 md:flex">
        {links.map((link) => (
          <NavTarget
            key={link.label}
            to={link.to}
            className={(isActive) =>
              cn(
                'shrink-0 whitespace-nowrap text-sm leading-[1.4]',
                isActive ? 'font-semibold text-link' : 'font-normal text-fg-placeholder',
              )
            }
          >
            {() => link.label}
          </NavTarget>
        ))}
      </nav>

      <NavTarget
        to={createReviewTo}
        className={() =>
          'hidden h-11 shrink-0 items-center justify-center gap-2 rounded-lg border border-action bg-action px-4 text-sm leading-[1.4] font-medium whitespace-nowrap text-on-action md:flex'
        }
      >
        {() => (
          <>
            <MaskIcon src={plusIcon} size={16} className="bg-on-action" />
            Crear Reseña
          </>
        )}
      </NavTarget>

      <AccountMenu account={account} settingsTo={settingsTo} onLogout={onLogout} />
      <ThemeToggle className="-ml-3 md:-ml-2" />
    </header>
  )
}
