import fastifyView from '@fastify/view'
import pug from 'pug'
import pool from './db.js'
import root from './routes/root.js'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default async (app, _options) => {
  app.decorate('db', pool)

  app.addHook('onClose', async () => {
    await pool.end()
  })

  await app.register(fastifyView, {
    engine: { pug },
    root: join(__dirname, '..', 'views'),
  })

  app.register(root)
}
