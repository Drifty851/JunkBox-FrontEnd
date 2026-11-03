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
      // El backend no tiene middleware CORS. En desarrollo, el proxy hace que el navegador
      // vea un solo origen (ver SOLICITUDES_BACKEND.md · GLOBAL-01).
      proxy: {
        '/api': { target: backendUrl, changeOrigin: true },
      },
    },
  }
})
