export default async (app, _options) => {
  app.get('/', async (request, reply) => {
    return reply.view('index.pug')
  })
}
