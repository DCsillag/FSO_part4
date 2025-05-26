// tests/user.test.js
const { test, describe, beforeEach, after } = require('node:test')
const assert = require('node:assert')
const mongoose = require('mongoose')
const supertest = require('supertest')
const bcrypt = require('bcrypt')

const app = require('../app')
const User = require('../models/user')
const api = supertest(app)

// helper to get users in DB as JSON
const helper = {
  usersInDb: async () => {
    const users = await User.find({})
    return users.map(u => u.toJSON())
  }
}

describe('when there is initially one user in db', () => {
  beforeEach(async () => {
    await User.deleteMany({})

    const passwordHash = await bcrypt.hash('sekret', 10)
    const rootUser = new User({ username: 'root', name: 'Superuser', passwordHash })
    await rootUser.save()
  })

  test('creation succeeds with a fresh username', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'mluukkai',
      name: 'Matti Luukkainen',
      password: 'salainen',
    }

    const res = await api
      .post('/api/users')
      .send(newUser)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    assert.strictEqual(res.body.username, newUser.username)

    const usersAtEnd = await helper.usersInDb()
    assert.strictEqual(usersAtEnd.length, usersAtStart.length + 1)

    const usernames = usersAtEnd.map(u => u.username)
    assert.ok(usernames.includes(newUser.username))
  })

  test('creation fails with too-short password', async () => {
    const usersAtStart = await helper.usersInDb()
    const badUser = { username: 'shorty', name: 'Shorty', password: '123' }

    const res = await api
      .post('/api/users')
      .send(badUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    assert.strictEqual(
      res.body.error,
      'Password must be at least 4 characters'
    )

    const usersAtEnd = await helper.usersInDb()
    assert.strictEqual(usersAtEnd.length, usersAtStart.length)
  })

  test('creation fails with missing username', async () => {
    const usersAtStart = await helper.usersInDb()
    const badUser = { name: 'NoUsername', password: 'validpass' }

    const res = await api
      .post('/api/users')
      .send(badUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    // ValidationError for required username
    assert.ok(
      res.body.error.includes('username') && res.body.error.includes('required'),
      `Expected error about missing username, got '${res.body.error}'`
    )

    const usersAtEnd = await helper.usersInDb()
    assert.strictEqual(usersAtEnd.length, usersAtStart.length)
  })

  test('creation fails with username shorter than 4 chars', async () => {
    const usersAtStart = await helper.usersInDb()
    const badUser = { username: 'abc', name: 'TinyName', password: 'validpass' }

    const res = await api
      .post('/api/users')
      .send(badUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    // username minLength violation
    assert.ok(
      res.body.error.includes('shorter than the minimum'),
      `Expected minLength error, got '${res.body.error}'`
    )

    const usersAtEnd = await helper.usersInDb()
    assert.strictEqual(usersAtEnd.length, usersAtStart.length)
  })

  test('creation fails with missing name', async () => {
    const usersAtStart = await helper.usersInDb()
    const badUser = { username: 'noname', password: 'validpass' }

    const res = await api
      .post('/api/users')
      .send(badUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    // ValidationError for required name
    assert.ok(
      res.body.error.includes('name') && res.body.error.includes('required'),
      `Expected error about missing name, got '${res.body.error}'`
    )

    const usersAtEnd = await helper.usersInDb()
    assert.strictEqual(usersAtEnd.length, usersAtStart.length)
  })

  test('creation fails with duplicate username', async () => {
    const usersAtStart = await helper.usersInDb()
    const badUser = { username: 'root', name: 'Another Root', password: 'validpass' }

    const res = await api
      .post('/api/users')
      .send(badUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    assert.strictEqual(
      res.body.error,
      'expected `username` to be unique'
    )

    const usersAtEnd = await helper.usersInDb()
    assert.strictEqual(usersAtEnd.length, usersAtStart.length)
  })

  test('GET /api/users returns the existing user', async () => {
    const res = await api
      .get('/api/users')
      .expect(200)
      .expect('Content-Type', /application\/json/)

    assert.ok(Array.isArray(res.body))
    assert.strictEqual(res.body.length, 1)
    assert.strictEqual(res.body[0].username, 'root')
  })
})

after(async () => {
  await mongoose.connection.close()
})