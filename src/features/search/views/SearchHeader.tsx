import { useRef, type ChangeEvent, type FormEvent, type KeyboardEvent } from 'react'
import searchIcon from '../../../assets/icons/search-20.svg'
import xIcon from '../../../assets/icons/x-16.svg'
import { MaskIcon } from '../../../shared/ui/MaskIcon'
import { cn } from '../../../shared/utils/cn'
import { MAX_QUERY_LENGTH } from '../controllers/useSearchController'
import type { SearchKind } from '../models/search.types'

const KINDS: { id: SearchKind; label: string }[] = [
  { id: 'music', label: 'Música' },
  { id: 'users', label: 'Usuarios' },
]

interface SearchHeaderProps {
  input: string
  onChange: (event: ChangeEvent<HTMLInputElement>) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onClear: () => void
  kind: SearchKind
  onSelectKind: (kind: SearchKind) => void
}

/**
 * SearchHeader (Figma · 14244:50730 móvil / 14244:50843 escritorio): título, SearchField
 * (14296:4081) y SegmentedControl (14296:15842). Escritorio: ancho 800.
 * Música y Usuarios son pestañas (2026-11-15); Usuarios es una plantilla hasta SEARCH-04.
 * Patrón ARIA tabs: flechas izquierda/derecha cambian de pestaña.
 */
export function SearchHeader({ input, onChange, onSubmit, onClear, kind, onSelectKind }: SearchHeaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const tabRefs = useRef<Record<SearchKind, HTMLButtonElement | null>>({ music: null, users: null })

  function onTabKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return
    event.preventDefault()
    const next: SearchKind = kind === 'music' ? 'users' : 'music'
    onSelectKind(next)
    tabRefs.current[next]?.focus()
  }

  function handleClear() {
    onClear()
    inputRef.current?.focus()
  }

  return (
    <div className="flex w-full flex-col gap-3 md:max-w-[800px]">
      <h1 className="text-2xl leading-[1.4] font-bold text-fg md:text-heading md:leading-[1.4]">
        <span className="md:hidden">Tu próxima escucha.</span>
        <span className="hidden md:inline">Encuentra tu próxima escucha.</span>
      </h1>

      <form role="search" onSubmit={onSubmit} className="w-full">
        <div className="flex h-11 w-full items-center gap-2 rounded-lg bg-surface-input-disabled px-3 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-fg">
          <MaskIcon src={searchIcon} size={20} className="bg-fg-placeholder" />
          <input
            ref={inputRef}
            type="text"
            inputMode="search"
            enterKeyHint="search"
            autoComplete="off"
            autoFocus
            maxLength={MAX_QUERY_LENGTH}
            value={input}
            onChange={onChange}
            placeholder={kind === 'users' ? 'Nombre o @usuario…' : 'Canciones, álbumes, artistas…'}
            aria-label={kind === 'users' ? 'Buscar personas por nombre o usuario' : 'Buscar canciones, álbumes o artistas'}
            className="min-w-0 flex-1 bg-transparent text-sm leading-[1.4] text-fg outline-none placeholder:text-fg-placeholder"
          />
          {input !== '' && (
            <button
              type="button"
              onClick={handleClear}
              aria-label="Borrar búsqueda"
              className="flex size-6 shrink-0 cursor-pointer items-center justify-center rounded focus-visible:outline-2 focus-visible:outline-fg"
            >
              <MaskIcon src={xIcon} size={16} className="bg-fg" />
            </button>
          )}
        </div>
      </form>

      {/* SegmentedControl: alto 40, padding 4, separación 4; Segment activo action / on-action. */}
      <div role="tablist" aria-label="Tipo de búsqueda" onKeyDown={onTabKeyDown} className="flex h-10 w-full gap-1 rounded-lg bg-surface-input-disabled p-1">
        {KINDS.map((item) => {
          const selected = item.id === kind
          return (
            <button
              key={item.id}
              ref={(element) => {
                tabRefs.current[item.id] = element
              }}
              type="button"
              role="tab"
              aria-selected={selected}
              tabIndex={selected ? 0 : -1}
              onClick={() => onSelectKind(item.id)}
              className={cn(
                'flex flex-1 cursor-pointer items-center justify-center rounded text-sm leading-[1.4] font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg',
                selected ? 'bg-action text-on-action' : 'text-fg-soft',
              )}
            >
              {item.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
