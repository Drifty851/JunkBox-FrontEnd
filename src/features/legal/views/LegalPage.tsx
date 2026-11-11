import { useEffect } from 'react'
import { Link } from 'react-router'
import { JunkboxLogo } from '../../../shared/ui/JunkboxLogo'
import type { LegalBlock, LegalDocument } from '../models/legal.types'
import { PRIVACY_PATH, TERMS_PATH } from '../models/legalPaths'

/**
 * Página de un documento legal (Términos de Servicio / Aviso de Privacidad). NO SALE DE FIGMA:
 * no hay diseño de estas páginas. Usa los tokens y la tipografía existentes. Es pública: se
 * abre con o sin sesión (en otra pestaña desde Registro).
 */
export function LegalPage({ document: legal }: { document: LegalDocument }) {
  useEffect(() => {
    const previous = document.title
    document.title = `${legal.title} · Junkbox`
    return () => {
      document.title = previous
    }
  }, [legal.title])

  return (
    <div className="flex min-h-dvh flex-col bg-bg">
      <header className="flex h-[52px] shrink-0 items-center border-b border-line bg-surface-nav px-4 md:h-20 md:px-8 xl:px-16">
        <Link
          to="/"
          aria-label="Junkbox, ir a Inicio"
          className="rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
        >
          <JunkboxLogo className="h-[27.81px] w-32 md:h-[34.77px] md:w-40" />
        </Link>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-8 md:px-8 md:py-12">
        <div className="flex flex-col gap-3">
          <h1 className="text-heading-sm font-bold text-fg md:text-heading">{legal.title}</h1>
          <p className="text-xs leading-normal text-fg-muted">Última actualización: {legal.updatedAt}</p>
          <p
            role="note"
            className="rounded-lg border border-line bg-surface-input-disabled px-4 py-3 text-xs leading-normal text-fg-muted"
          >
            Documento en revisión: es una propuesta para un proyecto académico. Debe revisarlo un profesional en
            derecho antes de publicarse. Los datos entre corchetes están pendientes.
          </p>
          <p className="text-sm leading-normal text-fg">{legal.intro}</p>
        </div>

        {legal.sections.map((section) => (
          <section key={section.heading} className="flex flex-col gap-3">
            <h2 className="text-lg leading-[1.4] font-semibold text-fg">{section.heading}</h2>
            {section.blocks.map((block, index) => (
              <Block key={index} block={block} />
            ))}
          </section>
        ))}
      </main>

      <footer className="border-t border-line px-4 py-6 text-center text-xs leading-normal text-fg-muted">
        <Link to={TERMS_PATH} className="underline hover:text-fg">
          Términos de Servicio
        </Link>
        {'  ·  '}
        <Link to={PRIVACY_PATH} className="underline hover:text-fg">
          Política de Privacidad
        </Link>
      </footer>
    </div>
  )
}

function Block({ block }: { block: LegalBlock }) {
  if (typeof block === 'string') {
    return (
      <p className="text-sm leading-normal text-fg-muted">
        <WithPlaceholders text={block} />
      </p>
    )
  }
  return (
    <ul className="flex list-disc flex-col gap-2 pl-5 text-sm leading-normal text-fg-muted marker:text-fg-placeholder">
      {block.map((item) => (
        <li key={item}>
          <WithPlaceholders text={item} />
        </li>
      ))}
    </ul>
  )
}

/** Resalta los datos pendientes "[…]" para que el responsable los localice. */
function WithPlaceholders({ text }: { text: string }) {
  return text.split(/(\[[^\]]+\])/).map((part, index) =>
    part.startsWith('[') ? (
      <mark key={index} className="rounded bg-surface-input-disabled px-1 font-medium text-fg">
        {part}
      </mark>
    ) : (
      part
    ),
  )
}
