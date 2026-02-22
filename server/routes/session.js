export default async (app) => {
  // GET /session/new — show the login form
  app.get('/session/new', async (request, reply) => {
    return reply.view('session/new.pug')
  })

  // POST /session — authenticate via Passport FormStrategy.
  // passport.authenticate('form', callback) RETURNS a route handler — we pass it directly to app.post.
  // Callback signature: (request, reply, err, user) — passport fills all 4 args.
  // If user is falsy, authentication failed. Otherwise call logIn() to serialize into session.
  app.post('/session', app.passport.authenticate('form', async (request, reply, err, user) => {
    if (err) {
      return reply.code(500).send(err)
    }
    if (!user) {
      return reply.view('session/new.pug', { error: true })
    }
    // logIn tells Passport to call serializeUser → saves user.id in the session
    await request.logIn(user)
    return reply.redirect('/')
  }))

  // DELETE /session — log out
  app.delete('/session', async (request, reply) => {
    await request.logOut()
    return reply.redirect('/')
  })
}
