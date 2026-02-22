import fastifyView from '@fastify/view'
import fastifyStatic from '@fastify/static'
import fastifyFormbody from '@fastify/formbody'
import pug from 'pug'
import Knex from 'knex'
import { Model } from 'objection'
import i18next from './i18n.js'
import knexConfig from '../knexfile.js'
import root from './routes/root.js'
import users from './routes/users.js'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default async (app, _options) => {
  // Pick knex config based on NODE_ENV (default: development)
  const env = process.env.NODE_ENV || 'development'
  const knex = Knex(knexConfig[env])

  Model.knex(knex)

  app.decorate('t', i18next.t.bind(i18next))

  await app.register(fastifyStatic, {
    root: join(__dirname, '..', 'public'),
    prefix: '/',
  })

  // Cleanly close the DB connection when the server shuts down
  app.addHook('onClose', async () => {
    await knex.destroy()
  })

  // Parse application/x-www-form-urlencoded (standard HTML form encoding)
  await app.register(fastifyFormbody)

  // HTML forms only support GET and POST.
  // This hook reads _method from the form body and rewrites request.method
  // so PATCH /users/:id and DELETE /users/:id work from a plain HTML form.
  app.addHook('preHandler', async (request) => {
    if (request.body?._method) {
      request.method = request.body._method.toUpperCase()
    }
  })

  await app.register(fastifyView, {
    engine: { pug },
    root: join(__dirname, '..', 'views'),
  })

  app.register(root)
  app.register(users)
}
