/**
 * Guardado de la vinculación con Spotify en este navegador, de la forma más segura posible sin
 * backend (decisión del propietario, 2026-11-13; SPOT-01 pide guardarla en el servidor):
 *
 *  - El access token vive SOLO en memoria (se pierde al recargar y se renueva).
 *  - El refresh token se guarda CIFRADO (AES-GCM 256) en localStorage, por usuario de Junkbox.
 *  - La clave AES se crea como NO EXTRAÍBLE y se guarda en IndexedDB: el código de la página puede
 *    usarla para descifrar, pero no leerla ni copiarla, así que el token guardado no sirve fuera de
 *    este navegador. (Contra un script malicioso dentro de la página no hay protección completa
 *    sin backend; por eso SPOT-01.)
 *  - Al cerrar sesión en Junkbox o desvincular, se borra.
 */

const DB_NAME = 'junkbox'
const STORE = 'keys'
const KEY_ID = 'spotify-token-key'
const storageKey = (userId: string) => `junkbox.spotify.${userId}`

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => request.result.createObjectStore(STORE)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function getKey(): Promise<CryptoKey> {
  const db = await openDb()
  try {
    const existing = await new Promise<CryptoKey | undefined>((resolve, reject) => {
      const request = db.transaction(STORE, 'readonly').objectStore(STORE).get(KEY_ID)
      request.onsuccess = () => resolve(request.result as CryptoKey | undefined)
      request.onerror = () => reject(request.error)
    })
    if (existing) return existing
    const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt'])
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite')
      tx.objectStore(STORE).put(key, KEY_ID)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
    return key
  } finally {
    db.close()
  }
}

const toBase64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes))
const fromBase64 = (text: string) => Uint8Array.from(atob(text), (char) => char.charCodeAt(0))

export const spotifyTokenVault = {
  /** Guarda (cifrado) el refresh token del usuario de Junkbox. */
  async saveRefreshToken(userId: string, refreshToken: string): Promise<void> {
    const key = await getKey()
    const iv = crypto.getRandomValues(new Uint8Array(12))
    const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(refreshToken))
    localStorage.setItem(storageKey(userId), JSON.stringify({ iv: toBase64(iv), data: toBase64(new Uint8Array(cipher)) }))
  },

  /** Lee el refresh token; `null` si no hay vinculación o no se puede descifrar. */
  async readRefreshToken(userId: string): Promise<string | null> {
    const raw = localStorage.getItem(storageKey(userId))
    if (!raw) return null
    try {
      const { iv, data } = JSON.parse(raw) as { iv: string; data: string }
      const key = await getKey()
      const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromBase64(iv) }, key, fromBase64(data))
      return new TextDecoder().decode(plain)
    } catch {
      // Clave distinta (datos del sitio borrados a medias) o contenido alterado: se descarta.
      localStorage.removeItem(storageKey(userId))
      return null
    }
  },

  hasLink(userId: string): boolean {
    return localStorage.getItem(storageKey(userId)) !== null
  },

  clear(userId: string): void {
    localStorage.removeItem(storageKey(userId))
  },
}
