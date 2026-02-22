import qs from 'qs'
import fastifyView from '@fastify/view'
import fastifyStatic from '@fastify/static'
import fastifyFormbody from '@fastify/formbody'
import fastifyCookie from '@fastify/cookie'
import fastifySession from '@fastify/session'
import fastifyPassport from '@fastify/passport'
import pug from 'pug'
import Knex from 'knex'
import { Model } from 'objection'
import i18next from './i18n.js'
import knexConfig from '../knexfile.js'
import models from './models/index.js'
import FormStrategy from './lib/passportStrategies/FormStrategy.js'
import root from './routes/root.js'
import users from './routes/users.js'
import session from './routes/session.js'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

// --- Database (Knex + Objection) ---
const setupDatabase = (app) => {
  const env = process.env.NODE_ENV || 'development'
  const knex = Knex(knexConfig[env])
  Model.knex(knex)
  // Expose knex and models on app — tests use knex, strategies use models
  app.decorate('objection', { knex, models })
  app.addHook('onClose', async () => {
    await knex.destroy()
  })
}

// --- Fastify plugins (form parsing, cookies, sessions, passport) ---
const registerPlugins = async (app) => {
  // qs parser supports nested bracket syntax: data[firstName] → { data: { firstName: ... } }
  await app.register(fastifyFormbody, { parser: str => qs.parse(str) })
  await app.register(fastifyCookie)

  const isProduction = process.env.NODE_ENV === 'production'
  await app.register(fastifySession, {
    secret: process.env.SESSION_SECRET || 'a-very-long-secret-key-at-least-32-chars!!',
    cookie: { secure: isProduction }, // HTTPS-only in production, HTTP allowed in dev
  })

  // Passport: initialize + connect to session (reads/writes session on each request)
  await app.register(fastifyPassport.initialize())
  await app.register(fastifyPassport.secureSession())

  // serializeUser: called once on login — what to save in the session?
  // We only store the user ID, not the entire user object.
  fastifyPassport.registerUserSerializer(async user => user.id)

  // deserializeUser: called on every request — given the ID from session, load the full user
  fastifyPassport.registerUserDeserializer(async (id) => {
    return app.objection.models.user.query().findById(id)
  })

  // Register our form-based strategy under the name 'form'
  fastifyPassport.use('form', new FormStrategy('form', app))

  // Expose passport instance on app so routes can use app.passport.authenticate(...)
  app.decorate('passport', fastifyPassport)
}

const setUpViews = (app) => {
  app.register(fastifyView, {
    engine: { pug },
    root: join(__dirname, '..', 'views'),
  })
}

const setUpStaticAssets = (app) => {
  app.register(fastifyStatic, {
    root: join(__dirname, '..', 'public'),
    prefix: '/',
  })
}

// --- Request lifecycle hooks ---
const addHooks = (app) => {
  // HTML forms only support GET and POST.
  // Reads _method from form body so PATCH/DELETE work from plain forms.
  app.addHook('preHandler', async (request) => {
    if (request.body?._method) {
      request.method = request.body._method.toUpperCase()
    }
  })

  // Make request.user available in Pug templates via reply.locals
  // Passport populates request.user automatically via deserializeUser on each request
  app.addHook('preHandler', async (request, reply) => {
    reply.locals = {
      ...reply.locals,
      currentUser: request.user,
      isAuthenticated: request.isAuthenticated(),
      t: app.t,
    }
  })
}

// --- Route registration ---
const addRoutes = (app) => {
  app.register(root)
  app.register(users)
  app.register(session)
}

// --- Main entry point — reads like a table of contents ---
export default async (app, _options) => {
  setupDatabase(app)
  await registerPlugins(app)
  setUpViews(app)
  setUpStaticAssets(app)
  app.decorate('t', i18next.t.bind(i18next))
  addHooks(app)
  addRoutes(app)

  return app
}
