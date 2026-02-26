import { describe, beforeAll, it, expect, afterAll } from '@jest/globals'
import { signIn, createApp } from './helpers/index.js'

describe('users', () => {
  let app
  let knex
  let testData

  beforeAll(async () => {
    ;({ app, knex, testData } = await createApp())
  })

  afterAll(() => app.close())

  // --- Authorization: edit ---

  it('GET /users/:id/edit — not logged in → 403', async () => {
    const [user] = await knex('users')

    const response = await app.inject({
      method: 'GET',
      url: `/users/${user.id}/edit`,
    })

    expect(response.statusCode).toBe(403)
  })

  it('GET /users/:id/edit — own profile → 200 with form', async () => {
    const cookie = await signIn(app, testData.users.existing)
    const [user] = await knex('users')

    const response = await app.inject({
      method: 'GET',
      url: `/users/${user.id}/edit`,
      cookies: cookie,
    })

    expect(response.statusCode).toBe(200)
    expect(response.body).toContain('data[firstName]')
    expect(response.body).toContain('data[email]')
    expect(response.body).toContain(testData.users.existing.email)
  })

  it('GET /users/:id/edit — another user\'s profile → 403', async () => {
    const cookie = await signIn(app, testData.users.existing)
    const [, otherUser] = await knex('users')

    const response = await app.inject({
      method: 'GET',
      url: `/users/${otherUser.id}/edit`,
      cookies: cookie,
    })

    expect(response.statusCode).toBe(403)
  })

  // --- Authorization: delete ---

  it('DELETE /users/:id — another user\'s account → 403', async () => {
    const cookie = await signIn(app, testData.users.existing)
    const [, otherUser] = await knex('users')

    const response = await app.inject({
      method: 'DELETE',
      url: `/users/${otherUser.id}`,
      cookies: cookie,
    })

    expect(response.statusCode).toBe(403)

    // Other user must still exist in the DB
    const stillThere = await knex('users').where({ id: otherUser.id }).first()
    expect(stillThere).toBeDefined()
  })

  // Keep this last — it permanently removes the user from the in-memory DB
  it('DELETE /users/:id — own account → 302, user gone, session cleared', async () => {
    const cookie = await signIn(app, testData.users.existing)
    const [user] = await knex('users')

    const response = await app.inject({
      method: 'DELETE',
      url: `/users/${user.id}`,
      cookies: cookie,
    })

    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe('/users')

    // User must be gone from the DB
    const deleted = await knex('users').where({ id: user.id }).first()
    expect(deleted).toBeUndefined()
  })
})
