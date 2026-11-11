/**
 * Bloque de un documento legal: un párrafo (`string`) o una lista de viñetas (`string[]`).
 * Los textos entre corchetes ("[correo de contacto]") son datos que el responsable debe completar
 * y la vista los resalta.
 */
export type LegalBlock = string | string[]

export interface LegalSection {
  heading: string
  blocks: LegalBlock[]
}

export interface LegalDocument {
  title: string
  /** Fecha legible de la última actualización, p. ej. "6 de noviembre de 2026". */
  updatedAt: string
  intro: string
  sections: LegalSection[]
}
