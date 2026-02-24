import qs from 'qs'
import fastifyView from '@fastify/view'
import fastifyStatic from '@fastify/static'
import fastifyFormbody from '@fastify/formbody'
import fastifySecureSession from '@fastify/secure-session'
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

// --- Fastify plugins (form parsing, secure session, passport) ---
const registerPlugins = async (app) => {
  // qs parser supports nested bracket syntax: data[firstName] → { data: { firstName: ... } }
  await app.register(fastifyFormbody, { parser: str => qs.parse(str) })

  // Secure session: stores session data in an encrypted cookie (no server-side storage).
  // Same library as the Hexlet boilerplate. Requires a secret (≥32 chars) + salt (16 chars).
  await app.register(fastifySecureSession, {
    secret: process.env.SESSION_KEY || 'a-]very-long-secret-key-at-least-32-chars!!',
    salt: 'mq9hDxBVDbspDR6n',
    cookie: {
      path: '/',
    },
  })

  // Passport: initialize + connect to secure session
  // @fastify/passport with secureSession() provides request.flash() and reply.flash() built-in
  await app.register(fastifyPassport.initialize())
  await app.register(fastifyPassport.secureSession())

  // deserializeUser: called on every request — given the stored user data, load the full user
  fastifyPassport.registerUserDeserializer(
    user => app.objection.models.user.query().findById(user.id),
  )
  // serializeUser: called once on login — what to save in the session cookie
  fastifyPassport.registerUserSerializer(user => Promise.resolve(user))

  // Register our form-based strategy under the name 'form'
  fastifyPassport.use(new FormStrategy('form', app))

  // Expose passport instance on app so routes can use app.passport.authenticate(...)
  app.decorate('passport', fastifyPassport)
}

const setUpViews = (app) => {
  app.register(fastifyView, {
    engine: { pug },
    includeViewExtension: true,
    defaultContext: {
      t: key => i18next.t(key),
      assetPath: filename => `/assets/${filename}`,
    },
    root: join(__dirname, 'views'),
  })

  // Custom render method (same as boilerplate).
  // Passes `reply` into every template so Pug can call reply.flash() directly.
  app.decorateReply('render', function render(viewPath, locals) {
    return this.view(viewPath, { ...locals, reply: this })
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

  // Make auth state available in Pug templates via reply.locals.
  // Flash is NOT read here — templates call reply.flash() directly (see layout/page.pug).
  app.addHook('preHandler', async (req, reply) => {
    reply.locals = {
      isAuthenticated: () => req.isAuthenticated(),
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
  addHooks(app)
  addRoutes(app)

  return app
}
