import pool from './db.js'

export default async (app, _) => {
  app.get('/', async () => {
    try {
      const result = await pool.query('SELECT COUNT(*) FROM users')
      const userCount = parseInt(result.rows[0].count)

      return {
        message: 'Welcome to Hexlet!',
        database: 'connected',
        users: userCount,
      }
    }
    catch (error) {
      return {
        message: 'Welcome to Hexlet!',
        database: 'error',
        error: error.message,
      }
    }
  })
}
