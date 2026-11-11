import { PRIVACY_NOTICE } from '../data/privacyNotice'
import { LegalPage } from './LegalPage'

/** Aviso de Privacidad (/privacidad), conforme a la LFPDPPP. Propuesta pendiente de revisión legal. */
export function PrivacyPage() {
  return <LegalPage document={PRIVACY_NOTICE} />
}
