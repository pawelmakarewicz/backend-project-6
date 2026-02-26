import { describe, beforeAll, it, expect, afterAll } from '@jest/globals'
import { getTestData, signIn, createApp } from './helpers/index.js'

describe('session (auth)', () => {
  let app
  let testData

  beforeAll(async () => {
    ;({ app, testData } = await createApp())
  })

  it('GET /session/new — login form renders', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/session/new',
    })

    expect(response.statusCode).toBe(200)
    expect(response.body).toContain('data[email]')
    expect(response.body).toContain('data[password]')
  })

  it('POST /session — successful login → redirect + cookie', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/session',
      payload: {
        data: testData.users.existing,
      },
    })

    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe('/')

    const sessionCookie = response.cookies.find(c => c.name === 'session')
    expect(sessionCookie).toBeDefined()
  })

  it('POST /session — wrong password → re-renders form', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/session',
      payload: {
        data: { email: testData.users.existing.email, password: 'wrongpass' },
      },
    })

    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe('/session/new')
  })

  it('POST /session — unknown email → re-renders form', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/session',
      payload: {
        data: { email: 'nobody@example.com', password: 'anything' },
      },
    })

    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe('/session/new')
  })

  it('DELETE /session — logout → redirect', async () => {
    const cookie = await signIn(app, testData.users.existing)

    // Log out
    const response = await app.inject({
      method: 'DELETE',
      url: '/session',
      cookies: cookie,
    })

    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe('/')
  })

  it('nav shows login/register when not authenticated', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/',
    })

    expect(response.body).toContain('Вход')
    expect(response.body).toContain('Регистрация')
    expect(response.body).not.toContain('Выход')
  })

  it('nav shows logout when authenticated', async () => {
    const cookie = await signIn(app, testData.users.existing)

    const response = await app.inject({
      method: 'GET',
      url: '/',
      cookies: cookie,
    })

    expect(response.body).toContain('Выход')
    expect(response.body).not.toContain('href="/session/new"')
  })

  afterAll(() => app.close())
})
