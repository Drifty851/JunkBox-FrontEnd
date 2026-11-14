import { useId, useState } from 'react'
import circleCheckIcon from '../../../assets/icons/circle-check.svg'
import playCircleIcon from '../../../assets/icons/play-circle.svg'
import searchIcon from '../../../assets/icons/search-20.svg'
import xIcon from '../../../assets/icons/x-16.svg'
import { FormAlert } from '../../../shared/ui/FormAlert'
import { MaskIcon } from '../../../shared/ui/MaskIcon'
import { PrimaryButton } from '../../../shared/ui/PrimaryButton'
import { StarRatingInput } from '../../../shared/ui/StarRatingInput'
import { cn } from '../../../shared/utils/cn'
import { formatRating } from '../../../shared/utils/formatRating'
import { useSearchSuggestions } from '../../search/controllers/useSearchSuggestions'
import { useWriteReviewController, type ReviewTargetView } from '../controllers/useWriteReviewController'
import { countCharacters, ratingLabel, REVIEW_MAX_LENGTH } from '../models/writeReview'

const MAX_LABEL = REVIEW_MAX_LENGTH.toLocaleString('es-ES', { useGrouping: 'always' })

/**
 * Escribir Reseña · Figma: móvil 14244:51146, escritorio 14244:51275 (ReviewComposer).
 * Módulo Calificaciones y Reseñas: POST /ratings (estrellas, obligatorio), POST/PUT /reviews
 * (texto opcional), GET /ratings/my y DELETE /ratings|/reviews/{id}.
 * Escritorio: ReviewForm de 744 y ComposerContext de 344 (separación 64). Móvil: solo el formulario.
 * AudioSnippetPicker ("Elige tus 30 segundos") queda desactivado hasta que exista el reproductor.
 */
export function WriteReviewPage() {
  const controller = useWriteReviewController()
  const { target, mine, values, fieldErrors, formError, submitting } = controller
  const resolved = target.status === 'ready' ? target.data : null
  const existing = mine.status === 'ready' ? mine.data : null
  const ratingTextId = useId()
  const contentId = useId()
  const length = countCharacters(values.content)
  const ready = resolved !== null && mine.status === 'ready'

  return (
    <div className="mx-auto flex w-full max-w-[1440px] justify-center gap-16 px-4 pt-3 pb-8 md:px-8 md:pt-8 xl:px-20">
      <form
        noValidate
        onSubmit={controller.handleSubmit}
        aria-label="Escribir reseña"
        className="flex w-full flex-col gap-3 md:w-[744px] md:gap-5"
      >
        <div className="flex w-full items-center justify-between gap-4 leading-[1.4]">
          <h1 className="text-2xl font-bold text-fg md:text-heading md:leading-[1.4]">Escribir Reseña</h1>
          <button
            type="button"
            onClick={controller.cancel}
            className="cursor-pointer rounded text-[13px] text-fg-placeholder hover:text-fg focus-visible:outline-2 focus-visible:outline-fg"
          >
            Cancelar
          </button>
        </div>

        <ComposerSearch selected={resolved} onChoose={controller.chooseTarget} />

        {target.status === 'loading' && <p className="text-sm leading-[1.4] text-fg-muted">Cargando…</p>}
        {target.status === 'error' && (
          <FormAlert message={target.notFound ? 'No encontramos ese elemento. Búscalo arriba.' : target.message} />
        )}
        {resolved && <SelectedMusicPreview target={resolved} />}

        {/* RatingInput: StarRating 176×32 + "5 de 5 · Brutal" (Caption/12, text/secondary-2). */}
        <div className="flex flex-col gap-1">
          <div className="flex w-full flex-wrap items-center gap-4">
            <StarRatingInput
              label="Tu calificación"
              describedBy={ratingTextId}
              value={values.score}
              onChange={controller.setScore}
              disabled={!ready || submitting}
            />
            <p id={ratingTextId} className="text-xs leading-[1.4] text-fg-placeholder">
              {values.score > 0
                ? `${formatRating(values.score)} de 5 · ${ratingLabel(values.score)}`
                : resolved
                  ? 'Toca las estrellas para calificar'
                  : 'Elige primero qué quieres reseñar'}
            </p>
          </div>
          {fieldErrors.score && <p role="alert" className="text-xs leading-[1.4] text-accent">{fieldErrors.score}</p>}
        </div>

        {/* ReviewTextarea (Figma · 14296:4102): alto 160, padding 12, borde border/default, radio 8. */}
        <div className="flex flex-col gap-1">
          <div
            className={cn(
              'flex h-40 w-full flex-col justify-between gap-2 rounded-lg border p-3 leading-[1.4] focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-fg',
              fieldErrors.content ? 'border-accent' : 'border-line',
            )}
          >
            <textarea
              id={contentId}
              aria-label="Tu reseña (opcional)"
              aria-invalid={Boolean(fieldErrors.content) || undefined}
              value={values.content}
              onChange={(event) => controller.setContent(event.target.value)}
              disabled={!ready || submitting}
              placeholder="¿Qué te hace sentir? Comparte tu reseña, una historia o ese detalle que no puedes dejar de escuchar…"
              className="min-h-0 w-full flex-1 resize-none bg-transparent text-sm text-fg outline-none placeholder:text-fg-placeholder disabled:cursor-default"
            />
            <p className={cn('text-[11px]', length > REVIEW_MAX_LENGTH ? 'text-accent' : 'text-fg-placeholder')}>
              {length.toLocaleString('es-ES', { useGrouping: 'always' })} / {MAX_LABEL}
            </p>
          </div>
          {fieldErrors.content && <p role="alert" className="text-xs leading-[1.4] text-accent">{fieldErrors.content}</p>}
        </div>

        <AudioSnippetPicker />

        {formError && <FormAlert message={formError} />}

        {/* PublishActions */}
        <div className="flex w-full flex-col gap-2">
          <PrimaryButton
            label={existing?.rating || existing?.review ? 'Guardar cambios' : 'Publicar Reseña'}
            loadingLabel="Publicando…"
            loading={submitting}
            disabled={!ready}
          />
          <p className="text-[11px] leading-[1.4] text-fg-placeholder">
            Visible para toda la comunidad · La reseña es opcional; la calificación, no.
          </p>
          {(existing?.rating || existing?.review) && (
            <div className="flex flex-wrap gap-4 text-xs leading-[1.4]">
              {existing.rating && (
                <button
                  type="button"
                  onClick={controller.removeRating}
                  disabled={submitting}
                  className="cursor-pointer rounded text-fg-muted underline hover:text-fg focus-visible:outline-2 focus-visible:outline-fg disabled:cursor-progress"
                >
                  Quitar mi calificación ({formatRating(existing.rating.score)})
                </button>
              )}
              {existing.review && (
                <button
                  type="button"
                  onClick={controller.removeReview}
                  disabled={submitting}
                  className="cursor-pointer rounded text-fg-muted underline hover:text-fg focus-visible:outline-2 focus-visible:outline-fg disabled:cursor-progress"
                >
                  Eliminar mi reseña
                </button>
              )}
            </div>
          )}
        </div>
      </form>

      {/* ComposerContext (solo escritorio): carátula 296, Heading/28 y textos de Figma. */}
      <aside className="hidden w-[344px] shrink-0 flex-col gap-5 self-start rounded-lg bg-surface-input-disabled p-6 leading-[1.4] lg:flex">
        <span className="block size-[296px] overflow-hidden rounded bg-line">
          {resolved?.imageUrl && <img src={resolved.imageUrl} alt="" className="size-full object-cover" />}
        </span>
        <p className="text-heading-sm leading-[1.4] font-bold text-fg">Tu oído. Tu punto de vista.</p>
        <p className="text-sm text-fg-soft">
          No hace falta ser crítico para tener algo que decir. Cuenta qué escuchas y deja que esos 30 segundos hablen
          contigo.
        </p>
        <p className="text-xs text-fg-placeholder">
          Respeta otras opiniones. Las mejores conversaciones empiezan con una escucha.
        </p>
      </aside>
    </div>
  )
}

/**
 * PredictiveMusicSearch (Figma): SearchField + "Canciones, álbumes o artistas · Sugerencia: …".
 * Muestra sugerencias de cualquier tipo (mismas que la Navbar) y al elegir una la convierte en
 * el objetivo de la reseña.
 */
function ComposerSearch({
  selected,
  onChoose,
}: {
  selected: ReviewTargetView | null
  onChoose: (type: ReviewTargetView['type'], id: string) => void
}) {
  const [text, setText] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const shown = text ?? selected?.title ?? ''
  const suggestions = useSearchSuggestions(text ?? '')
  const items = suggestions.status === 'ready' ? suggestions.items : []
  const listId = useId()
  const expanded = open && text !== null && text.trim() !== ''

  return (
    <div className="relative flex w-full flex-col gap-1">
      <div className="flex h-11 w-full items-center gap-2 rounded-lg bg-surface-input-disabled px-3 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-fg">
        <MaskIcon src={searchIcon} size={20} className="bg-fg-placeholder" />
        <input
          type="text"
          role="combobox"
          aria-label="Busca qué quieres reseñar"
          aria-expanded={expanded}
          aria-controls={listId}
          aria-autocomplete="list"
          autoComplete="off"
          value={shown}
          placeholder="Canciones, álbumes, artistas…"
          onChange={(event) => {
            setText(event.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') setOpen(false)
            if (event.key === 'Enter') event.preventDefault()
          }}
          className="min-w-0 flex-1 bg-transparent text-sm leading-[1.4] text-fg outline-none placeholder:text-fg-placeholder"
        />
        {shown !== '' && (
          <button
            type="button"
            aria-label="Borrar búsqueda"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              setText('')
              setOpen(true)
            }}
            className="flex size-6 shrink-0 cursor-pointer items-center justify-center rounded focus-visible:outline-2 focus-visible:outline-fg"
          >
            <MaskIcon src={xIcon} size={16} className="bg-fg" />
          </button>
        )}
      </div>
      <p className="text-[11px] leading-[1.4] text-fg-placeholder">
        Canciones, álbumes o artistas
        {selected ? ` · Seleccionado: ${selected.title} — ${selected.subtitle.split(' · ')[0]}` : ''}
      </p>

      <ul
        id={listId}
        role="listbox"
        aria-label="Sugerencias"
        className={cn(
          'absolute top-12 right-0 left-0 z-[5] overflow-hidden rounded-lg border border-line bg-surface py-1 shadow-lg',
          !expanded && 'hidden',
        )}
      >
        {suggestions.status === 'loading' && <li className="px-4 py-3 text-sm text-fg-muted">Buscando…</li>}
        {suggestions.status === 'ready' && items.length === 0 && (
          <li className="px-4 py-3 text-sm text-fg-muted">Sin coincidencias.</li>
        )}
        {items.map((item) => (
          <li
            key={item.key}
            role="option"
            aria-selected={false}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              setText(null)
              setOpen(false)
              onChoose(item.target.type, item.target.id)
            }}
            className="flex cursor-pointer items-center gap-3 px-4 py-2 hover:bg-surface-input-disabled"
          >
            <span
              className={cn(
                'block size-10 shrink-0 overflow-hidden bg-surface-input-disabled',
                item.shape === 'circle' ? 'rounded-full' : 'rounded',
              )}
            >
              {item.imageUrl && <img src={item.imageUrl} alt="" className="size-full object-cover" />}
            </span>
            <span className="flex min-w-0 flex-col leading-[1.4]">
              <span className="truncate text-sm font-semibold text-fg">{item.title}</span>
              <span className="truncate text-xs text-fg-soft">{item.subtitle}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** SelectedMusicPreview (Figma): carátula 48, título 14/SemiBold, subtítulo 12 y circle-check 20. */
function SelectedMusicPreview({ target }: { target: ReviewTargetView }) {
  return (
    <div className="flex w-full items-center gap-3">
      <span
        className={cn(
          'block size-12 shrink-0 overflow-hidden bg-surface-input-disabled',
          target.type === 'artist' ? 'rounded-full' : 'rounded',
        )}
      >
        {target.imageUrl && <img src={target.imageUrl} alt="" className="size-full object-cover" />}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5 leading-[1.4]">
        <p className="truncate text-sm font-semibold text-fg">{target.title}</p>
        <p className="truncate text-xs text-fg-placeholder">{target.subtitle}</p>
      </div>
      <MaskIcon src={circleCheckIcon} size={20} className="bg-fg" />
    </div>
  )
}

/** Alturas de las barras del Waveform de Figma (AudioSnippetPicker-03). Las 9–30 están dentro del rango. */
const WAVE = [8, 26, 16, 8, 32, 28, 26, 26, 28, 32, 8, 16, 26, 8, 22, 8, 26, 16, 8, 32, 28, 26, 26, 28, 32, 8, 16, 26, 8, 22, 8, 26, 16, 8, 32, 28, 26, 26, 28, 32]

/**
 * AudioSnippetPicker (Figma · 14296:6377): "Elige tus 30 segundos". DESACTIVADO: no hay
 * reproductor ni fragmento en el backend (HOME-06). Se muestra la plantilla de Figma.
 */
function AudioSnippetPicker() {
  return (
    <div
      aria-disabled="true"
      title="Disponible cuando exista el reproductor"
      className="flex w-full flex-col gap-2 rounded-lg border border-line p-3 opacity-60"
    >
      <div className="flex w-full items-center justify-between">
        <p className="text-[13px] leading-[1.4] font-semibold text-fg">Elige tus 30 segundos</p>
        <MaskIcon src={playCircleIcon} size={24} className="bg-fg" />
      </div>
      <div aria-hidden="true" className="relative flex h-10 w-full items-center gap-1">
        {WAVE.map((height, index) => (
          <span
            key={index}
            className={cn('min-w-px flex-1 rounded-[2px]', index >= 9 && index <= 30 ? 'bg-fg' : 'bg-line')}
            style={{ height }}
          />
        ))}
        <span className="absolute top-0 left-[22%] h-10 w-[1%] rounded-[2px] bg-fg" />
        <span className="absolute top-0 left-[77%] h-10 w-[1%] rounded-[2px] bg-fg" />
      </div>
      <div className="flex w-full items-start justify-between text-xs leading-[1.4]">
        <p className="whitespace-pre text-fg">Inicio   0:45</p>
        <p className="text-fg-placeholder">30 s · próximamente</p>
        <p className="whitespace-pre text-fg">Fin   1:15</p>
      </div>
    </div>
  )
}
