import { Strategy } from '@fastify/passport'

// A custom Passport strategy for form-based (email + password) authentication.
// Passport calls authenticate() on every request that goes through app.authenticate().
// We then tell Passport the result: this.success(user), this.fail(), or this.error(err).
export default class FormStrategy extends Strategy {
  constructor(name, app) {
    super(name)
    this.app = app
  }

  async authenticate(request) {
    const { email, password } = request.body?.data ?? {}

    try {
      const user = await this.app.objection.models.user.query().findOne({ email })

      if (user && await user.verifyPassword(password)) {
        // Passport will call serializeUser → store user.id in session
        return this.success(user)
      }

      // Wrong email or password → login failed
      return this.fail()
    }
    catch (err) {
      // Unexpected DB error etc.
      return this.error(err)
    }
  }
}
