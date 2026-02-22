// Knex config — selected by NODE_ENV (default: development)
import 'dotenv/config'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { knexSnakeCaseMappers } from 'objection'

const __dirname = dirname(fileURLToPath(import.meta.url))
const migrationsDir = join(__dirname, 'database', 'migrations')

/** @type {import('knex').Knex.Config} */
export default {
  development: {
    client: 'better-sqlite3',
    connection: { filename: join(__dirname, 'database', 'dev.sqlite3') },
    migrations: { directory: migrationsDir },
    useNullAsDefault: true, // required for SQLite
    // knexSnakeCaseMappers converts camelCase JS properties (firstName)
    // to snake_case DB columns (first_name) and vice versa automatically.
    // This is a convention: JS uses camelCase, databases use snake_case.
    ...knexSnakeCaseMappers(),
  },

  test: {
    client: 'better-sqlite3',
    connection: { filename: ':memory:' },
    migrations: { directory: migrationsDir },
    useNullAsDefault: true,
    ...knexSnakeCaseMappers(),
  },

  production: {
    client: 'pg',
    connection: {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }, // required by Render
    },
    migrations: { directory: migrationsDir },
    ...knexSnakeCaseMappers(),
  },
}
