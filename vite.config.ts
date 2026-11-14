import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // El backend corre en WSL y escucha en :8080 (HTTP_ADDR). WSL2 lo expone en el localhost de Windows.
  const backendUrl = env.VITE_BACKEND_URL ?? 'http://localhost:8080'

  return {
    plugins: [react(), tailwindcss()],
    server: {
      // 127.0.0.1 (y no solo [::1]): Spotify exige una URL de retorno con IP de loopback
      // (http://127.0.0.1:5173/spotify/callback); "localhost" sigue funcionando.
      host: '127.0.0.1',
      // El proxy hace que el navegador vea un solo origen, así que funciona en cualquier
      // puerto. El backend también tiene CORS (CORS_ALLOWED_ORIGINS, por defecto
      // http://localhost:5173): con VITE_API_BASE_URL absoluta se puede saltar el proxy.
      proxy: {
        '/api': { target: backendUrl, changeOrigin: true },
      },
    },
  }
})
