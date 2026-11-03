/** Une clases CSS condicionales y descarta los valores falsos. */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ')
}
