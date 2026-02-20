export default async (app, _options) => {
  const { db } = app

  app.get('/', async (request, reply) => {
    try {
      const result = await db.query('SELECT COUNT(*) FROM users')
      const userCount = parseInt(result.rows[0].count)

      return reply.view('index.pug', {
        message: 'Welcome to Hexlet!',
        database: 'connected',
        users: userCount,
      })
    }
    catch (error) {
      return reply.view('index.pug', {
        message: 'Welcome to Hexlet!',
        database: 'error',
        error: error.message,
      })
    }
  })
}
