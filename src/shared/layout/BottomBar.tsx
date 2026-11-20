import { MaskIcon } from '../ui/MaskIcon'
import { cn } from '../utils/cn'
import type { NavigationItem } from './navigation.types'
import { NavTarget } from './NavTarget'

interface BottomBarProps {
  items: NavigationItem[]
}

/**
 * BottomBar de Junkbox, solo en móvil (Figma · BottomBar, 14296:15519 / 14296:15235).
 * Cuatro NavigationItem de 80 px: icono de 22 y etiqueta Caption/10.
 * El "Home indicator" del frame simula el teléfono y no se implementa (como la StatusBar):
 * en su lugar se respeta el área segura inferior del dispositivo.
 */
export function BottomBar({ items }: BottomBarProps) {
  return (
    <nav
      aria-label="Principal"
      className="sticky bottom-0 z-10 shrink-0 bg-surface-nav px-4 pt-2 pb-[max(8px,env(safe-area-inset-bottom))] md:hidden"
    >
      <ul className="flex items-start justify-between">
        {items.map((item) => (
          <li key={item.label}>
            <NavTarget
              to={item.to}
              refreshOnReselect={item.refreshOnReselect}
              className={() => 'flex w-20 flex-col items-center gap-1'}
            >
              {(isActive) => (
                <>
                  <MaskIcon src={item.icon} size={22} className={isActive ? 'bg-link' : 'bg-fg-placeholder'} />
                  <span
                    className={cn(
                      'text-caption-2xs whitespace-nowrap',
                      isActive ? 'font-semibold text-link' : 'font-normal text-fg-placeholder',
                    )}
                  >
                    {item.label}
                  </span>
                </>
              )}
            </NavTarget>
          </li>
        ))}
      </ul>
    </nav>
  )
}
