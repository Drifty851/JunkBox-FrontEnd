import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'node:fs'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // El backend corre en WSL y escucha en :8080 (HTTP_ADDR). WSL2 lo expone en el localhost de Windows.
  const backendUrl = env.VITE_BACKEND_URL ?? 'http://localhost:8080'
  // https de desarrollo (TEMPORAL, hasta tener hosting): con los archivos de mkcert, Junkbox se abre
  // en el teléfono con https://<IP de la PC>:5173 y se puede vincular Spotify (Spotify solo acepta
  // URLs de retorno https o de loopback). Sin estas variables, todo queda en http. README ·
  // "Probar en el teléfono y en otros navegadores".
  const httpsKey = env.VITE_DEV_HTTPS_KEY
  const httpsCert = env.VITE_DEV_HTTPS_CERT
  const https = httpsKey && httpsCert ? { key: readFileSync(httpsKey), cert: readFileSync(httpsCert) } : undefined

  return {
    plugins: [react(), tailwindcss()],
    server: {
      // 127.0.0.1 (y no solo [::1]): Spotify exige una URL de retorno con IP de loopback
      // (http://127.0.0.1:5173/spotify/callback); "localhost" sigue funcionando.
      host: '127.0.0.1',
      https,
      // El proxy hace que el navegador vea un solo origen, así que funciona en cualquier
      // puerto. El backend también tiene CORS (CORS_ALLOWED_ORIGINS, por defecto
      // http://localhost:5173): con VITE_API_BASE_URL absoluta se puede saltar el proxy.
      proxy: {
        '/api': { target: backendUrl, changeOrigin: true },
      },
    },
  }
})
