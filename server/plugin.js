import fastifyView from '@fastify/view'
import fastifyStatic from '@fastify/static'
import pug from 'pug'
import pool from './db.js'
import i18next from './i18n.js'
import root from './routes/root.js'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default async (app, _options) => {
  app.decorate('db', pool)
  app.decorate('t', i18next.t.bind(i18next))

  await app.register(fastifyStatic, {
    root: join(__dirname, '..', 'public'),
    prefix: '/',
  })

  app.addHook('onClose', async () => {
    await pool.end()
  })

  await app.register(fastifyView, {
    engine: { pug },
    root: join(__dirname, '..', 'views'),
  })

  app.register(root)
}
