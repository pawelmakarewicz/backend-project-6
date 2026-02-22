import fs from 'fs'
import path from 'path'
import { URL } from 'url'
import bcrypt from 'bcrypt'

// --- Fixture loading ---
const getFixturePath = filename => path.join('..', '..', '__fixtures__', filename)
const readFixture = filename => fs.readFileSync(
  new URL(getFixturePath(filename), import.meta.url),
  'utf-8',
).trim()
const getFixtureData = filename => JSON.parse(readFixture(filename))

// Returns the test data used in request payloads (plain passwords for login forms)
export const getTestData = () => getFixtureData('testData.json')

// Seeds the DB with test users. Hashes passwords on the fly.
// Uses raw knex (not Objection) — same pattern as the Hexlet boilerplate.
export const prepareData = async (app) => {
  const knex = app.objection.knex
  const testData = getTestData()

  const passwordHash = await bcrypt.hash(testData.users.existing.password, 10)
  await knex('users').insert({
    firstName: testData.users.existing.firstName,
    lastName: testData.users.existing.lastName,
    email: testData.users.existing.email,
    passwordHash,
  })
}
