import { defineConfig, loadEnv } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    resolveId(id) {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '')
        return path.resolve(__dirname, 'src/assets', filename)
      }
    },
  }
}

/** Origin only, e.g. http://127.0.0.1:3002 from VITE_HUB_API_URL=http://localhost:3002/api */
function resolveHubProxyTarget(hubApiUrl: string | undefined): string {
  const raw = (hubApiUrl || 'http://127.0.0.1:3002/api').trim().replace(/\/$/, '')
  const origin = raw.replace(/\/api$/i, '') || 'http://127.0.0.1:3002'
  return origin.replace('://localhost', '://127.0.0.1')
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const hubProxyTarget = resolveHubProxyTarget(env.VITE_HUB_API_URL)

  return {
    plugins: [
      figmaAssetResolver(),
      // The React and Tailwind plugins are both required for Make, even if
      // Tailwind is not being actively used – do not remove them
      react(),
      tailwindcss(),
      // HTTPS so mobile browsers allow getUserMedia on the LAN Network URL
      basicSsl(),
    ],
    resolve: {
      alias: {
        // Alias @ to the src directory
        '@': path.resolve(__dirname, './src'),
      },
    },

    // Expose Vite on the LAN so phones can open the Network URL
    server: {
      host: true,
      port: 5173,
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:4000',
          changeOrigin: true,
        },
        // Inflero Hub (landing products + order inquiries). Target from VITE_HUB_API_URL.
        '/hub-api': {
          target: hubProxyTarget,
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/hub-api/, ''),
        },
        // OmniCashier: default → local mock; with X-Omni-Target → real LAN device (HTTPS-safe).
        // Vite does not honor http-proxy-middleware `router` — override target per request.
        '/omni-api': {
          target: 'http://127.0.0.1:8989',
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/omni-api/, ''),
          configure: (proxy) => {
            const resolveOmniTarget = (req: { headers: Record<string, unknown> }) => {
              const raw = req.headers['x-omni-target']
              if (typeof raw !== 'string' || !raw.trim()) return 'http://127.0.0.1:8989'
              const cleaned = raw.trim().replace(/^https?:\/\//i, '').replace(/\/+$/, '')
              const hostPort = cleaned.split('/')[0]
              if (!hostPort) return 'http://127.0.0.1:8989'
              const h = hostPort.split(':')[0].toLowerCase()
              const ok =
                h === '127.0.0.1' ||
                h === 'localhost' ||
                /^10\.\d+\.\d+\.\d+$/.test(h) ||
                /^192\.168\.\d+\.\d+$/.test(h) ||
                /^172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+$/.test(h)
              return ok ? `http://${hostPort}` : 'http://127.0.0.1:8989'
            }
            const originalWeb = proxy.web.bind(proxy)
            proxy.web = (req: unknown, res: unknown, opts: Record<string, unknown> = {}) => {
              const target = resolveOmniTarget(req as { headers: Record<string, unknown> })
              return originalWeb(req, res, { ...opts, target })
            }
            proxy.on('proxyReq', (proxyReq) => {
              proxyReq.removeHeader('x-omni-target')
            })
          },
        },
      },
    },

    // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
    assetsInclude: ['**/*.svg', '**/*.csv'],
  }
})
