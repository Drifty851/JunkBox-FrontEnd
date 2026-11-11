import { useId, useRef, useState, type KeyboardEvent } from 'react'
import { useNavigate } from 'react-router'
import searchIcon from '../../../assets/icons/search-20.svg'
import xIcon from '../../../assets/icons/x-16.svg'
import { MaskIcon } from '../../../shared/ui/MaskIcon'
import { cn } from '../../../shared/utils/cn'
import { MAX_QUERY_LENGTH } from '../controllers/useSearchController'
import { useSearchSuggestions } from '../controllers/useSearchSuggestions'
import { SEARCH_PATH, type Suggestion } from '../models/search.types'

/**
 * SearchField de la Navbar (Figma · Navbar › SearchField, 14296:4081): ahora se puede escribir
 * en él. Debajo aparece una lista con las 4 mejores coincidencias de cualquier tipo (no está en
 * Figma: decisión del propietario, 2026-11-06). Patrón ARIA "combobox" con listbox:
 *  - Flechas: recorren la lista. Enter: abre la sugerencia activa o el Buscador con lo escrito.
 *  - Escape: cierra la lista. La última opción abre todos los resultados.
 * Una sugerencia abre su ficha (canción, álbum o artista).
 */
export function NavbarSearch() {
  const navigate = useNavigate()
  const [text, setText] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const listId = useId()
  const optionId = (index: number) => `${listId}-option-${index}`

  const suggestions = useSearchSuggestions(text)
  const items = suggestions.status === 'ready' ? suggestions.items : []
  const query = text.trim()
  /** Opciones navegables: las sugerencias y, al final, "Ver todos los resultados". */
  const optionCount = query === '' ? 0 : items.length + 1
  const expanded = open && query !== ''
  const status =
    suggestions.status === 'loading'
      ? 'Buscando…'
      : suggestions.status === 'error'
        ? 'No pudimos buscar. Pulsa Enter para intentarlo en el Buscador.'
        : suggestions.status === 'ready' && items.length === 0
          ? 'Sin coincidencias.'
          : ''

  function goToSearch(value: string) {
    const next = value.trim().slice(0, MAX_QUERY_LENGTH)
    if (next === '') return
    // El campo de la Navbar vuelve a quedar vacío (con su placeholder): la búsqueda sigue en el Buscador.
    setText('')
    setOpen(false)
    setActive(-1)
    inputRef.current?.blur()
    navigate(`${SEARCH_PATH}?${new URLSearchParams({ q: next }).toString()}`)
  }

  function choose(index: number) {
    if (index >= 0 && index < items.length) {
      // Sugerencia: abre su ficha. El campo vuelve a quedar vacío, como al buscar.
      setText('')
      setOpen(false)
      setActive(-1)
      inputRef.current?.blur()
      navigate(items[index].to)
    } else {
      goToSearch(query)
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      if (optionCount === 0) return
      event.preventDefault()
      setOpen(true)
      const step = event.key === 'ArrowDown' ? 1 : -1
      setActive((current) => (current + step + optionCount) % optionCount)
    } else if (event.key === 'Enter') {
      event.preventDefault()
      choose(expanded ? active : -1)
    } else if (event.key === 'Escape') {
      setOpen(false)
      setActive(-1)
    }
  }

  return (
    <div className="relative flex h-11 min-w-0 flex-1 md:max-w-[344px] md:shrink">
      <div className="flex h-11 w-full items-center gap-2 rounded-lg bg-surface-input-disabled px-3 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-fg">
        <MaskIcon src={searchIcon} size={20} className="bg-fg-placeholder" />
        <div className="relative min-w-0 flex-1">
          {/* Placeholder de Figma, distinto en móvil y escritorio. */}
          {text === '' && (
            <span aria-hidden="true" className="pointer-events-none absolute inset-0 truncate text-sm leading-[1.4] text-fg-placeholder">
              <span className="md:hidden">Buscar música</span>
              <span className="hidden md:inline">Canciones, álbumes, artistas…</span>
            </span>
          )}
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-label="Buscar música"
            aria-autocomplete="list"
            aria-expanded={expanded}
            aria-controls={listId}
            aria-activedescendant={expanded && active >= 0 ? optionId(active) : undefined}
            inputMode="search"
            enterKeyHint="search"
            autoComplete="off"
            maxLength={MAX_QUERY_LENGTH}
            value={text}
            onChange={(event) => {
              setText(event.target.value)
              setOpen(true)
              setActive(-1)
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setOpen(false)}
            onKeyDown={handleKeyDown}
            className="w-full bg-transparent text-sm leading-[1.4] text-fg outline-none"
          />
        </div>
        {text !== '' && (
          <button
            type="button"
            aria-label="Borrar búsqueda"
            // mousedown: evita que el input pierda el foco antes del clic.
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              setText('')
              setActive(-1)
              inputRef.current?.focus()
            }}
            className="flex size-6 shrink-0 cursor-pointer items-center justify-center rounded focus-visible:outline-2 focus-visible:outline-fg"
          >
            <MaskIcon src={xIcon} size={16} className="bg-fg" />
          </button>
        )}
      </div>

      <div
        className={cn(
          'fixed inset-x-4 top-[60px] z-30 overflow-hidden rounded-lg border border-line bg-surface shadow-lg md:absolute md:inset-x-auto md:top-full md:left-0 md:mt-2 md:w-[400px]',
          !expanded && 'hidden',
        )}
      >
        <ul id={listId} role="listbox" aria-label="Sugerencias" className="py-1">
          {items.map((item, index) => (
            <SuggestionOption
              key={item.key}
              id={optionId(index)}
              item={item}
              active={active === index}
              onChoose={() => choose(index)}
              onHover={() => setActive(index)}
            />
          ))}
          {query !== '' && (
            <li
              id={optionId(items.length)}
              role="option"
              aria-selected={active === items.length}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => choose(items.length)}
              onMouseEnter={() => setActive(items.length)}
              className={cn(
                'cursor-pointer truncate border-t border-line px-4 py-3 text-sm leading-[1.4] font-medium text-fg',
                active === items.length && 'bg-surface-input-disabled',
              )}
            >
              Ver todos los resultados de “{query}”
            </li>
          )}
        </ul>
        <p aria-live="polite" className={cn('px-4 text-sm leading-[1.4] text-fg-muted', status !== '' && 'py-3')}>
          {status}
        </p>
      </div>
    </div>
  )
}

interface SuggestionOptionProps {
  id: string
  item: Suggestion
  active: boolean
  onChoose: () => void
  onHover: () => void
}

/** Fila de sugerencia: artwork 40, título y "Tipo · Artista" (estilo de MusicRow, más compacta). */
function SuggestionOption({ id, item, active, onChoose, onHover }: SuggestionOptionProps) {
  return (
    <li
      id={id}
      role="option"
      aria-selected={active}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onChoose}
      onMouseEnter={onHover}
      className={cn('flex cursor-pointer items-center gap-3 px-4 py-2', active && 'bg-surface-input-disabled')}
    >
      <span
        className={cn(
          'block size-10 shrink-0 overflow-hidden bg-surface-input-disabled',
          item.shape === 'circle' ? 'rounded-full' : 'rounded',
        )}
      >
        {item.imageUrl !== null && <img src={item.imageUrl} alt="" className="size-full object-cover" />}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5 leading-[1.4]">
        <span className="truncate text-sm font-semibold text-fg">{item.title}</span>
        <span className="truncate text-xs text-fg-soft">{item.subtitle}</span>
      </span>
    </li>
  )
}
