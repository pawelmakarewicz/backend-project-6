import { Model } from 'objection'
import bcrypt from 'bcrypt'

export default class User extends Model {
  // Tells Objection which DB table this model maps to
  static get tableName() {
    return 'users'
  }

  // JSON Schema — Objection validates data BEFORE inserting/updating
  // This is your first line of defense against bad data
  static get jsonSchema() {
    return {
      type: 'object',
      required: ['firstName', 'lastName', 'email', 'passwordHash'],

      properties: {
        id: { type: 'integer' },
        firstName: { type: 'string', minLength: 1 },
        lastName: { type: 'string', minLength: 1 },
        email: { type: 'string', format: 'email' },
        passwordHash: { type: 'string', minLength: 1 },
      },
    }
  }

  // Returns true if the given plain-text password matches the stored hash
  async verifyPassword(password) {
    return bcrypt.compare(password, this.passwordHash)
  }
}
