import i18next from 'i18next'

export default async (app) => {
  app.get('/users', async (request, reply) => {
    const users = await app.objection.models.user.query()
    return reply.render('users/index', { users })
  })

  app.get('/users/new', async (request, reply) => {
    return reply.render('users/new', { user: {}, errors: {} })
  })

  app.post('/users', async (request, reply) => {
    const { data } = request.body

    try {
      await app.objection.models.user.query().insert({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
      })

      request.flash('success', i18next.t('flash.users.create.success'))
      return reply.redirect('/')
    }
    catch (error) {
      const errors = error.data ?? {}
      request.flash('error', i18next.t('flash.users.create.error'))
      return reply.render('users/new', { user: data, errors })
    }
  })

  app.get('/users/:id/edit', async (request, reply) => {
    // Auth guard: must be logged in AND editing your own account
    if (!request.isAuthenticated() || request.user.id !== Number(request.params.id)) {
      return reply.code(403).redirect('/users')
    }

    const user = await app.objection.models.user.query().findById(request.params.id)
    if (!user) {
      return reply.code(404).send('User not found')
    }
    return reply.render('users/edit', { user, errors: {} })
  })

  // PATCH /users/:id — update user (only the user themselves)
  app.patch('/users/:id', async (request, reply) => {
    if (!request.isAuthenticated() || request.user.id !== Number(request.params.id)) {
      return reply.code(403).redirect('/users')
    }

    const user = await app.objection.models.user.query().findById(request.params.id)
    if (!user) {
      return reply.code(404).send('User not found')
    }

    const { data } = request.body

    try {
      const patch = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
      }

      if (data.password) {
        patch.password = data.password
      }

      await user.$query().patchAndFetch(patch)

      return reply.redirect('/users')
    }
    catch (error) {
      const errors = error.data ?? {}
      return reply.render('users/edit', { user: { ...user, ...data }, errors })
    }
  })

  // DELETE /users/:id — delete user (only the user themselves)
  app.delete('/users/:id', async (request, reply) => {
    if (!request.isAuthenticated() || request.user.id !== Number(request.params.id)) {
      return reply.code(403).redirect('/users')
    }

    await app.objection.models.user.query().deleteById(request.params.id)
    await request.logOut()
    return reply.redirect('/users')
  })
}
