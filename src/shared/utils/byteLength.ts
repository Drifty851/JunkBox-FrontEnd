const encoder = new TextEncoder()

/**
 * Longitud en bytes UTF-8. El backend mide la contraseña en bytes (de 8 a 72),
 * no en caracteres: una "ñ" o un emoji ocupan más de un byte.
 */
export function utf8ByteLength(value: string): number {
  return encoder.encode(value).length
}
