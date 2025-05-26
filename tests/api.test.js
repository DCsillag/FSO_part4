// tests/api.test.js – updated so GET /api/blogs remains public
const { beforeEach, after, test } = require('node:test')
const assert   = require('node:assert')
const supertest = require('supertest')
const mongoose  = require('mongoose')
const bcrypt    = require('bcrypt')

const app  = require('../app')
const User = require('../models/user')
const Blog = require('../models/blog')

const api = supertest(app)

let user1, user2, token1, token2, blog1

const serial = (name, fn) => test(name, { concurrency: false }, fn)

beforeEach(async () => {
  await Blog.deleteMany({})
  await User.deleteMany({})

  // seed two users
  const passwordHash1 = await bcrypt.hash('pass1234', 10)
  const passwordHash2 = await bcrypt.hash('pass5678', 10)

  user1 = await new User({ username: 'root',  name: 'Super',  passwordHash: passwordHash1 }).save()
  user2 = await new User({ username: 'guest', name: 'Visitor',passwordHash: passwordHash2 }).save()

  // login both users
  token1 = (await api.post('/api/login').send({ username: 'root',  password: 'pass1234'})).body.token
  token2 = (await api.post('/api/login').send({ username: 'guest', password: 'pass5678'})).body.token

  // seed one blog owned by user1
  blog1 = await new Blog({
    title: 'Seed blog',
    author: 'Seeder',
    url: 'http://example.com',
    likes: 1,
    user: user1._id
  }).save()

  user1.blogs = [blog1._id]
  await user1.save()
})

/* ----------  AUTH ---------- */

serial('login succeeds and returns a token', async () => {
  const res = await api.post('/api/login')
    .send({ username: 'root', password: 'pass1234' })
    .expect(200)

  assert.ok(res.body.token)
})

serial('login fails with wrong password', async () => {
  await api.post('/api/login')
    .send({ username: 'root', password: 'wrong' })
    .expect(401)
})

/* ----------  USERS ---------- */

serial('user creation rejects too‑short password', async () => {
  await api.post('/api/users')
    .send({ username: 'tiny', name: 'Tim', password: 'abc' })
    .expect(400)
})

serial('users endpoint returns objects with id not _id', async () => {
  const res = await api.get('/api/users').expect(200)
  const u = res.body[0]
  assert.ok(u.id)
  assert.strictEqual('_id' in u, false)
})

serial('duplicate usernames are rejected', async () => {
  await api.post('/api/users')
    .send({ username: 'root', name: 'Copy', password: 'whatever' })
    .expect(400)
})

/* ----------  BLOGS ---------- */

serial('posting a blog without token is rejected', async () => {
  await api.post('/api/blogs')
    .send({ title: 'No token', author: 'Anon', url: 'x', likes: 1 })
    .expect(401)
})

serial('posting a blog with valid token succeeds', async () => {
  const newBlog = { title: 'With token', author: 'Auth', url: 'y', likes: 5 }

  const res = await api.post('/api/blogs')
    .set('Authorization', `Bearer ${token1}`)
    .send(newBlog)
    .expect(200)

  assert.strictEqual(res.body.title, newBlog.title)

  // GET is public, no token header needed
  const blogsAtEnd = await api.get('/api/blogs').expect(200)
  assert.strictEqual(blogsAtEnd.body.length, 2)
})

serial('likes default to 0 when omitted', async () => {
  const res = await api.post('/api/blogs')
    .set('Authorization', `Bearer ${token1}`)
    .send({ title: 'No likes field', author: 'Nil', url: 'z' })
    .expect(200)

  assert.strictEqual(res.body.likes, 0)
})

serial('GET /api/blogs returns correct count and id fields', async () => {
  const res = await api.get('/api/blogs').expect(200)
  assert.strictEqual(res.body.length, 1)
  assert.ok(res.body[0].id)
  assert.strictEqual('_id' in res.body[0], false)
})

serial('likes can be updated', async () => {
  const res = await api.put(`/api/blogs/${blog1.id}`)
    .send({ likes: 99 })
    .expect(200)

  assert.strictEqual(res.body.likes, 99)
})

serial('owner can delete own blog', async () => {
  await api.delete(`/api/blogs/${blog1.id}`)
    .set('Authorization', `Bearer ${token1}`)
    .expect(204)

  const blogs = await api.get('/api/blogs').expect(200)
  assert.strictEqual(blogs.body.length, 0)
})

serial('non‑owner cannot delete blog', async () => {
  await api.delete(`/api/blogs/${blog1.id}`)
    .set('Authorization', `Bearer ${token2}`)
    .expect(400)
})

/* ----------  teardown ---------- */

after(async () => {
  await mongoose.connection.close()
})
