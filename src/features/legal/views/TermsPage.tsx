import { TERMS_OF_SERVICE } from '../data/termsOfService'
import { LegalPage } from './LegalPage'

/** Términos de Servicio (/terminos). Propuesta pendiente de revisión legal. */
export function TermsPage() {
  return <LegalPage document={TERMS_OF_SERVICE} />
}
