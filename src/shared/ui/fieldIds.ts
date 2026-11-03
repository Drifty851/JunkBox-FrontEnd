/** Id del texto de ayuda o error de un campo, para enlazarlo al input con aria-describedby. */
export function fieldDescriptionId(inputId: string): string {
  return `${inputId}-description`
}
