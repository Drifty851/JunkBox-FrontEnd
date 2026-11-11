import { useEffect, useId, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import { Link } from 'react-router'
import { Avatar } from '../ui/Avatar'
import { cn } from '../utils/cn'

/** Datos de la cuenta que muestra el menú. */
export interface AccountSummary {
  username: string
  displayName: string | null
  avatarUrl: string | null
  /** Avatar de respaldo si `avatarUrl` es null o no carga (robot por defecto). */
  fallbackAvatarUrl: string | null
}

interface AccountMenuProps {
  account: AccountSummary | null
  /** Ruta de Configuración; `null` mientras no exista el módulo (se muestra deshabilitada). */
  settingsTo: string | null
  onLogout: () => Promise<void>
}

const ITEM_CLASS =
  'block w-full cursor-pointer px-4 py-2 text-left text-sm leading-[1.4] text-fg hover:bg-surface-input-disabled focus-visible:bg-surface-input-disabled focus-visible:outline-none'

/**
 * Menú de cuenta del avatar de la Navbar. NO SALE DE FIGMA: propuesta aprobada por el
 * propietario (2026-11-04 y 2026-11-06), con los tokens existentes.
 *  - Al pasar el ratón o al enfocar con teclado: tarjeta con el nombre visible en negritas y
 *    @username en un tono más claro. Sin nombre visible, el username en ambos.
 *  - Al pulsar: el mismo encabezado, "Configuración" y "Cerrar sesión".
 */
export function AccountMenu({ account, settingsTo, onLogout }: AccountMenuProps) {
  const [open, setOpen] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const menuId = useId()
  const cardId = useId()

  const label = account ? `Cuenta de @${account.username}` : 'Cuenta'
  const showCard = account !== null && !open && (hovered || focused)

  useEffect(() => {
    if (!open) return
    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false)
        buttonRef.current?.focus()
      }
    }
    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  /** Flechas arriba/abajo entre las opciones del menú (patrón ARIA "menu button"). */
  function handleMenuKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
    event.preventDefault()
    const items = Array.from(menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])
    const current = items.indexOf(document.activeElement as HTMLElement)
    const step = event.key === 'ArrowDown' ? 1 : -1
    items[(current + step + items.length) % items.length]?.focus()
  }

  async function handleLogout() {
    setLeaving(true)
    await onLogout()
  }

  return (
    <div
      ref={containerRef}
      className="relative shrink-0"
      onPointerEnter={(event) => event.pointerType === 'mouse' && setHovered(true)}
      onPointerLeave={() => setHovered(false)}
    >
      <button
        ref={buttonRef}
        type="button"
        aria-label={label}
        aria-describedby={account ? cardId : undefined}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((value) => !value)}
        onFocus={(event) => setFocused(event.currentTarget.matches(':focus-visible'))}
        onBlur={() => setFocused(false)}
        className="block cursor-pointer rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
      >
        <Avatar
          src={account?.avatarUrl ?? null}
          fallbackSrc={account?.fallbackAvatarUrl ?? null}
          alt=""
          className="size-7 md:size-9"
        />
      </button>

      {account && (
        <div
          id={cardId}
          role="tooltip"
          className={cn(
            'pointer-events-none absolute top-full right-0 z-20 mt-2 w-max max-w-64 rounded-lg border border-line bg-surface px-4 py-3 shadow-lg',
            !showCard && 'hidden',
          )}
        >
          <AccountIdentity account={account} />
        </div>
      )}

      {open && (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-label={label}
          onKeyDown={handleMenuKeyDown}
          className="absolute top-full right-0 z-20 mt-2 w-max min-w-48 max-w-64 rounded-lg border border-line bg-surface py-1 shadow-lg"
        >
          {account && (
            <div className="border-b border-line px-4 pt-2 pb-3">
              <AccountIdentity account={account} />
            </div>
          )}
          {settingsTo !== null ? (
            <Link to={settingsTo} role="menuitem" autoFocus onClick={() => setOpen(false)} className={ITEM_CLASS}>
              Configuración
            </Link>
          ) : (
            <button
              type="button"
              role="menuitem"
              autoFocus
              aria-disabled="true"
              className={cn(ITEM_CLASS, 'cursor-default text-fg-placeholder')}
            >
              Configuración
            </button>
          )}
          <button
            type="button"
            role="menuitem"
            disabled={leaving}
            onClick={handleLogout}
            className={cn(ITEM_CLASS, 'disabled:cursor-progress')}
          >
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  )
}

/** Nombre visible (negritas) y @username (más claro). Sin nombre visible: el username en ambos. */
function AccountIdentity({ account }: { account: AccountSummary }) {
  const primary = account.displayName?.trim() || account.username
  return (
    <>
      <p className="truncate text-sm leading-[1.4] font-semibold text-fg">{primary}</p>
      <p className="truncate text-xs leading-[1.4] text-fg-muted">@{account.username}</p>
    </>
  )
}
