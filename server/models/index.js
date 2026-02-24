// Central registry of all Objection models.
// Import from here instead of importing each model file directly in routes/strategies.
import { User } from './User.js'

// Named exports — for direct imports: import { User } from '../models/index.js'
export { User }

// Default export — for bulk use: import models from '../models/index.js'
export default { user: User }
