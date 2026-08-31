import fs from 'node:fs'
import path from 'node:path'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Serve the `api/` Vercel Functions from the Vite dev server.
 *
 * Vite only serves the client bundle, so without this every call to
 * /api/* is a 404 during `npm run dev` and the RSVP confirmation email can
 * only be exercised on a deployment. This mirrors what Vercel does in
 * production: match the path to a file, hand the handler a Web Request, write
 * its Response back.
 *
 * Dev only -- `apply: 'serve'` keeps it out of the build.
 */
function devApiRoutes() {
  return {
    name: 'dev-api-routes',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) return next()

        const route = req.url.split('?')[0].replace(/^\/api\//, '')
        // Underscore-prefixed paths are shared helpers, not routes -- the same
        // convention Vercel uses.
        if (!route || route.startsWith('_') || route.includes('..')) return next()

        const file = path.resolve(server.config.root, 'api', `${route}.js`)
        if (!fs.existsSync(file)) return next()

        try {
          const module = await server.ssrLoadModule(file)
          const handler = module[req.method] ?? module.default
          if (typeof handler !== 'function') {
            res.statusCode = 405
            return res.end(JSON.stringify({ error: `${req.method} not supported.` }))
          }

          const chunks = []
          for await (const chunk of req) chunks.push(chunk)

          // Node lowercases header names but may hand back arrays; Request wants
          // plain strings.
          const headers = Object.fromEntries(
            Object.entries(req.headers).map(([key, val]) => [
              key,
              Array.isArray(val) ? val.join(', ') : String(val ?? ''),
            ]),
          )

          const request = new Request(`http://localhost${req.url}`, {
            method: req.method,
            headers,
            body: ['GET', 'HEAD'].includes(req.method) || !chunks.length
              ? undefined
              : Buffer.concat(chunks),
          })

          const response = await handler(request)
          res.statusCode = response.status
          response.headers.forEach((val, key) => res.setHeader(key, val))
          res.end(Buffer.from(await response.arrayBuffer()))
        } catch (error) {
          server.config.logger.error(`[dev-api] ${route} threw: ${error?.stack ?? error}`)
          res.statusCode = 500
          res.end(JSON.stringify({ error: 'Dev API handler threw. See terminal.' }))
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  /* Load every var, not just VITE_-prefixed ones, so the dev API handlers can
     read SUPABASE_SECRET_KEY and RESEND_API_KEY. This only populates
     process.env in the Node process running the dev server -- the client bundle
     still only ever sees import.meta.env.VITE_*. */
  Object.assign(process.env, loadEnv(mode, process.cwd(), ''))

  return { plugins: [react(), devApiRoutes()] }
})
