import qs from 'qs'
import fastifyView from '@fastify/view'
import fastifyStatic from '@fastify/static'
import fastifyFormbody from '@fastify/formbody'
import fastifyCookie from '@fastify/cookie'
import fastifySession from '@fastify/session'
import pug from 'pug'
import Knex from 'knex'
import { Model } from 'objection'
import i18next from './i18n.js'
import knexConfig from '../knexfile.js'
import User from './models/User.js'
import root from './routes/root.js'
import users from './routes/users.js'
import session from './routes/session.js'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default async (app, _options) => {
  // Pick knex config based on NODE_ENV (default: development)
  const env = process.env.NODE_ENV || 'development'
  const knex = Knex(knexConfig[env])

  Model.knex(knex)

  // Expose knex on app so tests/helpers can access it via app.objection.knex
  // This follows the Hexlet boilerplate convention
  app.decorate('objection', { knex })

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
  // qs parser supports nested bracket syntax: data[firstName] → { data: { firstName: ... } }
  // Without it, @fastify/formbody treats "data[firstName]" as a flat string key.
  await app.register(fastifyFormbody, { parser: (str) => qs.parse(str) })

  // Cookie plugin — required by @fastify/session to store the session ID cookie
  await app.register(fastifyCookie)

  // Session plugin — stores session data server-side, sends only a session ID cookie
  // 'secret' signs the cookie so it can't be tampered with (use env var in production!)
  await app.register(fastifySession, {
    secret: process.env.SESSION_SECRET || 'a-very-long-secret-key-at-least-32-chars!!',
    cookie: { secure: false }, // set true in production with HTTPS
  })

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

  // Decorator: must be declared before routes so Fastify knows about the property
  app.decorateRequest('currentUser', null)

  // On every request: if the session has a userId, load the full user from DB.
  // reply.locals is a special @fastify/view feature — anything set here gets
  // automatically merged into the Pug template context. No need to pass currentUser
  // in every reply.view() call!
  app.addHook('preHandler', async (request, reply) => {
    if (request.session?.userId) {
      request.currentUser = await User.query().findById(request.session.userId)
    }
    reply.locals = {
      ...reply.locals,
      currentUser: request.currentUser,
      t: app.t,
    }
  })

  app.register(root)
  app.register(users)
  app.register(session)
}
