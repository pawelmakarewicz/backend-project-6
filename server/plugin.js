export default async (app, _) => {
  app.get('/', async () => {
    return 'Welcome to Hexlet!'
  })
}
