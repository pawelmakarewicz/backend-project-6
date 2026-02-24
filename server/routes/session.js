import i18next from 'i18next'

export default async (app) => {
  // GET /session/new — show the login form
  app.get('/session/new', async (request, reply) => {
    return reply.render('session/new')
  })

  // POST /session — authenticate via Passport FormStrategy.
  app.post('/session', app.passport.authenticate('form', async (request, reply, err, user) => {
    if (err) {
      return reply.code(500).send(err)
    }
    if (!user) {
      // Flash stores the message in the session, then redirect re-renders the page.
      // On the next GET /session/new the preHandler hook reads it via request.flash()
      request.flash('error', i18next.t('flash.session.create.error'))
      return reply.redirect('/session/new')
    }
    await request.logIn(user)
    request.flash('success', i18next.t('flash.session.create.success'))
    return reply.redirect('/')
  }))

  // DELETE /session — log out
  app.delete('/session', async (request, reply) => {
    await request.logOut()
    request.flash('info', i18next.t('flash.session.delete.success'))
    return reply.redirect('/')
  })
}
