import bcrypt from 'bcrypt'
import User from '../models/User.js'

export default async (app) => {
  app.get('/users', async (request, reply) => {
    const users = await User.query()
    return reply.view('users/index.pug', { users })
  })

  app.get('/users/new', async (request, reply) => {
    return reply.view('users/new.pug', { user: {}, errors: {} })
  })

  app.post('/users', async (request, reply) => {
    const { data } = request.body

    try {
      const passwordHash = await bcrypt.hash(data.password, 10)

      await User.query().insert({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        passwordHash,
      })

      return reply.redirect('/')
    }
    catch (error) {
      const errors = error.data ?? {}
      return reply.view('users/new.pug', { user: data, errors })
    }
  })

  app.get('/users/:id/edit', async (request, reply) => {
    // Auth guard: must be logged in AND editing your own account
    if (!request.isAuthenticated() || request.user.id !== Number(request.params.id)) {
      return reply.code(403).redirect('/users')
    }

    const user = await User.query().findById(request.params.id)
    if (!user) {
      return reply.code(404).send('User not found')
    }
    return reply.view('users/edit.pug', { user, errors: {} })
  })

  // PATCH /users/:id — update user (only the user themselves)
  app.patch('/users/:id', async (request, reply) => {
    if (!request.isAuthenticated() || request.user.id !== Number(request.params.id)) {
      return reply.code(403).redirect('/users')
    }

    const user = await User.query().findById(request.params.id)
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
        patch.passwordHash = await bcrypt.hash(data.password, 10)
      }

      await user.$query().patchAndFetch(patch)

      return reply.redirect('/users')
    }
    catch (error) {
      const errors = error.data ?? {}
      return reply.view('users/edit.pug', { user: { ...user, ...data }, errors })
    }
  })

  // DELETE /users/:id — delete user (only the user themselves)
  app.delete('/users/:id', async (request, reply) => {
    if (!request.isAuthenticated() || request.user.id !== Number(request.params.id)) {
      return reply.code(403).redirect('/users')
    }

    await User.query().deleteById(request.params.id)
    await request.logOut()
    return reply.redirect('/users')
  })
}
