import fastifyView from '@fastify/view'
import fastifyStatic from '@fastify/static'
import pug from 'pug'
import Knex from 'knex'
import i18next from './i18n.js'
import knexConfig from '../knexfile.js'
import root from './routes/root.js'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default async (app, _options) => {
  // Pick knex config based on NODE_ENV (default: development)
  const env = process.env.NODE_ENV || 'development'
  const knex = Knex(knexConfig[env])

  app.decorate('knex', knex)
  app.decorate('t', i18next.t.bind(i18next))

  await app.register(fastifyStatic, {
    root: join(__dirname, '..', 'public'),
    prefix: '/',
  })

  // Cleanly close the DB connection when the server shuts down
  app.addHook('onClose', async () => {
    await knex.destroy()
  })

  await app.register(fastifyView, {
    engine: { pug },
    root: join(__dirname, '..', 'views'),
  })

  app.register(root)
}
