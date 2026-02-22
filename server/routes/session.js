import bcrypt from 'bcrypt'
import User from '../models/User.js'

export default async (app) => {
  // GET /session/new — show the login form
  app.get('/session/new', async (request, reply) => {
    return reply.view('session/new.pug', { t: app.t })
  })

  // POST /session — authenticate the user
  app.post('/session', async (request, reply) => {
    const { data } = request.body
    const { email, password } = data

    // 1. Find user by email
    const user = await User.query().findOne({ email })

    // 2. If user exists, compare submitted password with stored hash
    if (user && await bcrypt.compare(password, user.passwordHash)) {
      // 3. Store user ID in session — this is how the server "remembers" who you are
      request.session.userId = user.id
      return reply.redirect('/')
    }

    // If credentials are wrong, re-render the login form
    return reply.view('session/new.pug', { t: app.t, error: true })
  })

  // DELETE /session — log out
  // The form sends POST with hidden _method=delete, our hook in plugin.js rewrites it
  app.delete('/session', async (request, reply) => {
    request.session.destroy()
    return reply.redirect('/')
  })
}
