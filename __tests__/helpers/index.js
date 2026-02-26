import fs from 'fs'
import path from 'path'
import { URL } from 'url'
import bcrypt from 'bcrypt'
import fastify from 'fastify'
import { expect } from '@jest/globals'
import init from '../../server/plugin.js'

// --- Fixture loading ---
const getFixturePath = filename => path.join('..', '..', '__fixtures__', filename)
const readFixture = filename => fs.readFileSync(
  new URL(getFixturePath(filename), import.meta.url),
  'utf-8',
).trim()
const getFixtureData = filename => JSON.parse(readFixture(filename))

// Returns the test data used in request payloads (plain passwords for login forms)
export const getTestData = () => getFixtureData('testData.json')

// Seeds the DB with ALL test users. Hashes passwords on the fly.
// Uses raw knex (not Objection) — same pattern as the Hexlet boilerplate.
export const prepareData = async (app) => {
  const knex = app.objection.knex
  const testData = getTestData()

  // Insert existing user first (so it gets a lower ID)
  const existingDigest = await bcrypt.hash(testData.users.existing.password, 10)
  await knex('users').insert({
    firstName: testData.users.existing.firstName,
    lastName: testData.users.existing.lastName,
    email: testData.users.existing.email,
    passwordDigest: existingDigest,
  })

  // Insert a second user — needed for "can't edit/delete other user" scenarios
  const newDigest = await bcrypt.hash(testData.users.new.password, 10)
  await knex('users').insert({
    firstName: testData.users.new.firstName,
    lastName: testData.users.new.lastName,
    email: testData.users.new.email,
    passwordDigest: newDigest,
  })
}

// Signs in and returns a ready-to-use cookies object: { session: '<value>' }
// Fails fast with a clear assertion if login itself doesn't work.
export const signIn = async (app, userData) => {
  const res = await app.inject({
    method: 'POST',
    url: '/session',
    payload: { data: userData },
  })

  expect(res.statusCode).toBe(302)
  expect(res.cookies.length).toBeGreaterThan(0)

  const [sessionCookie] = res.cookies
  return { [sessionCookie.name]: sessionCookie.value }
}

// Creates and fully boots a test app instance.
// Runs migrations and seeds the DB so tests can start immediately.
// Returns { app, knex, testData } — call app.close() in afterAll.
export const createApp = async () => {
  const app = fastify({ exposeHeadRoutes: false })
  await init(app)
  const knex = app.objection.knex
  await knex.migrate.latest()
  await prepareData(app)
  const testData = getTestData()
  return { app, knex, testData }
}
