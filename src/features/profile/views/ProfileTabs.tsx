import { useRef, type KeyboardEvent, type ReactNode } from 'react'
import { Link } from 'react-router'
import watchHistoryIcon from '../../../assets/icons/watch-history-18.svg'
import { MaskIcon } from '../../../shared/ui/MaskIcon'
import { StarRating } from '../../../shared/ui/StarRating'
import { cn } from '../../../shared/utils/cn'
import { formatRating } from '../../../shared/utils/formatRating'
import { panelId, tabId, type RatingSummaryStats } from '../models/profile'

/** Pestaña: con `to` es un enlace (pestañas por ruta, como Seguidores / Seguidos). */
export interface TabItem<T extends string> {
  id: T
  label: string
  to?: string
}

/**
 * Tabs (Figma 14296:15934): alto 44, separación 24, borde inferior `line`. Pestaña activa
 * Body/14/SemiBold en text/primary-3 con borde inferior de 2 px en border/default-9 (color de acción:
 * negro en claro, naranja en oscuro); inactiva Body/14 en text/secondary-2.
 * Patrón ARIA tabs: flechas izquierda/derecha cambian de pestaña.
 */
export function ProfileTabList<T extends string>({
  tabs,
  active,
  onSelect,
  label,
}: {
  tabs: TabItem<T>[]
  active: T
  onSelect: (tab: T) => void
  label: string
}) {
  const refs = useRef<Partial<Record<T, HTMLElement | null>>>({})

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return
    event.preventDefault()
    const index = tabs.findIndex((tab) => tab.id === active)
    const next = tabs[(index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length].id
    onSelect(next)
    refs.current[next]?.focus()
  }

  return (
    <div role="tablist" aria-label={label} onKeyDown={onKeyDown} className="flex w-full items-start gap-6 border-b border-line">
      {tabs.map((tab) => {
        const selected = tab.id === active
        const props = {
          ref: (element: HTMLElement | null) => {
            refs.current[tab.id] = element
          },
          id: tabId(tab.id),
          role: 'tab',
          'aria-selected': selected,
          'aria-controls': panelId(tab.id),
          tabIndex: selected ? 0 : -1,
          className: cn(
            '-mb-px cursor-pointer py-3 text-sm leading-[1.4] whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg',
            selected ? 'border-b-2 border-action font-semibold text-link' : 'border-b-2 border-transparent text-fg-placeholder',
          ),
        }
        return tab.to ? (
          <Link key={tab.id} {...props} to={tab.to} replace>
            {tab.label}
          </Link>
        ) : (
          <button key={tab.id} {...props} type="button" onClick={() => onSelect(tab.id)}>
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}

/** SectionHeader de la pestaña: Title/18/SemiBold + "Más recientes⌄" (Caption/12), deshabilitado. */
function ListHeader({ id, title }: { id: string; title: string }) {
  return (
    <div className="flex w-full items-center justify-between leading-[1.4] whitespace-nowrap">
      <h2 id={id} className="text-lg font-semibold text-fg">
        {title}
      </h2>
      <span aria-disabled="true" className="text-xs text-fg-placeholder">
        <span className="md:hidden">Recientes</span>
        <span className="hidden md:inline">Más recientes</span>
        <span aria-hidden="true">⌄</span>
      </span>
    </div>
  )
}

/** Estado vacío de una lista que el backend aún no da. */
export function PendingList({ children }: { children: ReactNode }) {
  return (
    <div className="flex w-full flex-col items-start gap-1 rounded-lg border border-dashed border-line px-4 py-6">
      <p className="text-sm leading-[1.4] text-fg">{children}</p>
      <p className="text-xs leading-[1.4] text-fg-placeholder">Pendiente del backend.</p>
    </div>
  )
}

/** Panel lateral de escritorio (Figma · ProfileListening / RatingSummary): surface/default-3, padding 24, separación 20. */
function SidePanel({ children, label }: { children: ReactNode; label: string }) {
  return (
    <aside aria-label={label} className="hidden w-full flex-col items-start gap-5 rounded-lg bg-surface-input-disabled p-6 md:flex xl:w-[336px] xl:shrink-0">
      {children}
    </aside>
  )
}

/**
 * "Mis Reseñas" (Figma · Perfil Público, PublishedReviews + ProfileListening). Sin endpoint para
 * listar mis reseñas (PROF-01) ni "Suena mucho por aquí" (PROF-04): plantillas vacías.
 */
export function ReviewsTab({ memberSince, own = true }: { memberSince: string | null; own?: boolean }) {
  return (
    <>
      <section aria-labelledby="profile-reviews-title" className="flex w-full min-w-0 flex-col gap-3 md:flex-1 md:gap-4">
        <ListHeader id="profile-reviews-title" title="Reseñas publicadas" />
        <PendingList>{own ? 'Aquí aparecerán las reseñas que publiques.' : 'Aquí aparecerán sus reseñas publicadas.'}</PendingList>
      </section>
      <SidePanel label="Suena mucho por aquí">
        <h2 className="text-xl leading-[1.4] font-semibold text-fg">Suena mucho por aquí</h2>
        <p className="text-sm leading-[1.4] text-fg-soft">
          {own ? 'Tus canciones más escuchadas' : 'Sus canciones más escuchadas'} aparecerán aquí. Pendiente del backend.
        </p>
        {memberSince && <p className="text-xs leading-[1.4] text-fg-placeholder">{memberSince}</p>}
      </SidePanel>
    </>
  )
}

/**
 * "Historial de Calificaciones" (Figma · RatingRecord + RatingSummary "Una vida en canciones"). Sin
 * endpoint para listar mis calificaciones (PROF-02) ni sus estadísticas (PROF-03): plantillas con "—".
 */
export function RatingsTab({ name, summary, own = true }: { name: string; summary: RatingSummaryStats; own?: boolean }) {
  return (
    <>
      <section aria-labelledby="profile-ratings-title" className="flex w-full min-w-0 flex-col gap-3 md:flex-1 md:gap-4">
        <ListHeader id="profile-ratings-title" title="Calificaciones" />
        <PendingList>
          {own ? 'Aquí aparecerán las canciones, álbumes y artistas que califiques.' : 'Aquí aparecerán las canciones, álbumes y artistas que califique.'}
        </PendingList>
      </section>
      <SidePanel label="Una vida en canciones">
        <span className="flex size-6 items-center justify-center">
          <MaskIcon src={watchHistoryIcon} size={18} className="bg-fg" />
        </span>
        <h2 className="text-2xl leading-[1.4] font-bold text-fg">Una vida en canciones.</h2>
        <p className="text-sm leading-[1.4] text-fg-soft">Cada estrella guarda una escucha. Este es el mapa musical de {name}.</p>
        <dl className="flex w-full items-start justify-between leading-[1.4] whitespace-nowrap">
          <div className="flex flex-col-reverse gap-1">
            <dt className="text-xs text-fg-placeholder">Media personal</dt>
            <dd className="text-[32px] font-bold text-fg">
              {summary.average === null ? <SinDatos /> : formatRating(summary.average)}
            </dd>
          </div>
          <div className="flex flex-col-reverse gap-1">
            <dt className="text-xs text-fg-placeholder">Cinco estrellas</dt>
            <dd className="text-[32px] font-bold text-fg">{summary.fiveStars === null ? <SinDatos /> : summary.fiveStars}</dd>
          </div>
        </dl>
        <StarRating value={summary.average ?? 0} size="lg" />
      </SidePanel>
    </>
  )
}

/** "—" con su lectura para lectores de pantalla. */
export function SinDatos() {
  return (
    <>
      <span aria-hidden="true">—</span>
      <span className="sr-only">sin datos</span>
    </>
  )
}
