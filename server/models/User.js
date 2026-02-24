import { Model } from 'objection'
import objectionUnique from 'objection-unique'
import bcrypt from 'bcrypt'

// Mixin: wraps Model and adds pre-insert/update check
// that 'email' is unique across the table
const unique = objectionUnique({ fields: ['email'] })

export class User extends unique(Model) {
  static get tableName() {
    return 'users'
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['firstName', 'lastName', 'email', 'password'],

      properties: {
        id: { type: 'integer' },
        firstName: { type: 'string', minLength: 1 },
        lastName: { type: 'string', minLength: 1 },
        email: { type: 'string', format: 'email' },
        // Virtual field — exists only for validation.
        // The setter below converts it to passwordDigest before saving.
        password: { type: 'string', minLength: 3 },
      },
    }
  }

  // Setter: user.password = 'abc' → automatically hashes and stores as passwordDigest
  set password(value) {
    this.passwordDigest = bcrypt.hashSync(value, 10)
  }

  async verifyPassword(password) {
    return bcrypt.compare(password, this.passwordDigest)
  }
}
