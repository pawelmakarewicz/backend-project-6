// Central registry of all Objection models.
// Import from here instead of importing each model file directly in routes/strategies.
import User from './User.js'

export default { user: User }
