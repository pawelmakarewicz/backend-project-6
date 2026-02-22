import bcrypt from 'bcrypt'
import User from '../models/User.js'

export default async (app) => {
  // GET /users — list all users
  app.get('/users', async (request, reply) => {
    const users = await User.query()
    return reply.view('users/index.pug', { users, t: app.t })
  })

  // GET /users/new — registration form
  app.get('/users/new', async (request, reply) => {
    return reply.view('users/new.pug', { user: {}, errors: {}, t: app.t })
  })

  // POST /users — create a new user
  app.post('/users', async (request, reply) => {
    const { data } = request.body

    try {
      // Hash the password before storing — never save plain text passwords
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
      // Objection throws ValidationError if jsonSchema check fails
      // We re-render the form with error messages so the user can fix them
      const errors = error.data ?? {}
      return reply.view('users/new.pug', { user: data, errors, t: app.t })
    }
  })

  // GET /users/:id/edit — edit form
  app.get('/users/:id/edit', async (request, reply) => {
    const user = await User.query().findById(request.params.id)
    if (!user) {
      return reply.code(404).send('User not found')
    }
    return reply.view('users/edit.pug', { user, errors: {}, t: app.t })
  })

  // PATCH /users/:id — update user
  // Note: HTML forms can't send PATCH — the form uses POST with hidden _method=PATCH
  // @fastify/formbody + our hook in plugin.js rewrites the method
  app.patch('/users/:id', async (request, reply) => {
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

      // Only update password if the user actually typed a new one
      if (data.password) {
        patch.passwordHash = await bcrypt.hash(data.password, 10)
      }

      await user.$query().patchAndFetch(patch)

      return reply.redirect('/users')
    }
    catch (error) {
      const errors = error.data ?? {}
      return reply.view('users/edit.pug', { user: { ...user, ...data }, errors, t: app.t })
    }
  })

  // DELETE /users/:id — delete user
  // Same as PATCH — form uses POST + hidden _method=DELETE
  app.delete('/users/:id', async (request, reply) => {
    await User.query().deleteById(request.params.id)
    return reply.redirect('/users')
  })
}
