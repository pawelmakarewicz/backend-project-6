import root from './root.js'
import users from './users.js'
import session from './session.js'

const controllers = [
  root,
  users,
  session,
]

export default app => controllers.forEach(route => app.register(route))
