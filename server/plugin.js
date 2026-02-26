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
import addRoutes from './routes/index.js'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

// --- Database (Knex + Objection) ---
const setupDatabase = (app) => {
  const env = process.env.NODE_ENV || 'development'
  const knex = Knex(knexConfig[env])
  Model.knex(knex)
  // Convert [User, Task, ...] → { user: User, task: Task, ... } via class name
  const modelsMap = Object.fromEntries(models.map(M => [M.name.toLowerCase(), M]))
  app.decorate('objection', { knex, models: modelsMap })
  app.addHook('onClose', async () => {
    await knex.destroy()
  })
}

// --- Fastify plugins (form parsing, secure session, passport) ---
const registerPlugins = async (app) => {
  // qs parser supports nested bracket syntax: data[firstName] → { data: { firstName: ... } }
  await app.register(fastifyFormbody, { parser: str => qs.parse(str) })

  await app.register(fastifySecureSession, {
    secret: process.env.SESSION_KEY,
    cookie: {
      path: '/',
    },
  })

  // Passport: initialize + connect to secure session
  // @fastify/passport with secureSession() provides request.flash() and reply.flash() built-in
  await app.register(fastifyPassport.initialize())
  await app.register(fastifyPassport.secureSession())

  fastifyPassport.registerUserDeserializer(
    user => app.objection.models.user.query().findById(user.id),
  )
  fastifyPassport.registerUserSerializer(user => Promise.resolve(user))

  fastifyPassport.use(new FormStrategy('form', app))

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
  app.addHook('preHandler', async (req, reply) => {
    reply.locals = {
      isAuthenticated: () => req.isAuthenticated(),
    }
  })
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
