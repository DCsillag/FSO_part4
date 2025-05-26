const { test, after, beforeEach } = require('node:test')
const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const Blog = require('../models/blog')
const assert = require('node:assert')

const api = supertest(app)
// Sample blogs we will be using to for tests. 
const blogs = [
    {
      _id: "5a422a851b54a676234d17f7",
      title: "React patterns",
      author: "Michael Chan",
      url: "https://reactpatterns.com/",
      likes: 7,
      __v: 0
    },
    {
      _id: "5a422aa71b54a676234d17f8",
      title: "Go To Statement Considered Harmful",
      author: "Edsger W. Dijkstra",
      url: "http://www.u.arizona.edu/~rubinson/copyright_violations/Go_To_Considered_Harmful.html",
      likes: 5,
      __v: 0
    },
    {
      _id: "5a422b3a1b54a676234d17f9",
      title: "Canonical string reduction",
      author: "Edsger W. Dijkstra",
      url: "http://www.cs.utexas.edu/~EWD/transcriptions/EWD08xx/EWD808.html",
      likes: 12,
      __v: 0
    },
    {
      _id: "5a422b891b54a676234d17fa",
      title: "First class tests",
      author: "Robert C. Martin",
      url: "http://blog.cleancoder.com/uncle-bob/2017/05/05/TestDefinitions.htmll",
      likes: 10,
      __v: 0
    },
    {
      _id: "5a422ba71b54a676234d17fb",
      title: "TDD harms architecture",
      author: "Robert C. Martin",
      url: "http://blog.cleancoder.com/uncle-bob/2017/03/03/TDD-Harms-Architecture.html",
      likes: 0,
      __v: 0
    },
    {
      _id: "5a422bc61b54a676234d17fc",
      title: "Type wars",
      author: "Robert C. Martin",
      url: "http://blog.cleancoder.com/uncle-bob/2016/05/01/TypeWars.html",
      likes: 2,
      __v: 0
    }  
]

beforeEach(async () => {
    await Blog.deleteMany({})
    for (let blog of blogs) {
        let blogObject = new Blog(blog)
        await blogObject.save()
        // console.log(blogObject, 'saved')
    }
    console.log('Blogs loaded')
})

test('Correct number of blogs are returned', async () => {
    const response = await api.get('/api/blogs')

    assert.strictEqual(response.body.length, blogs.length)
})

test('Test blogs are using the correct object identifiers', async () => {
    const response = await api.get('/api/blogs')

    // console.log(response.body[0])

    for (let i = 0; i < blogs.length; i++) {
        assert.strictEqual(blogs[i]._id, response.body[i].id)
    }
})

test('Test blog is added succesfully', async () => {
    const newBlog = {
        title: "React anti-patterns",
        author: "Daniel Csillag",
        url: "https://reactpatterns.net/",
        likes: 20
    }
    
    const response = await api.post('/api/blogs').send(newBlog).expect(200).expect('Content-Type', /application\/json/)

    // Check that the response has the correct fields (id, not _id)
    assert.strictEqual(response.body.title, newBlog.title)
    assert.strictEqual(response.body.author, newBlog.author)
    assert.strictEqual(response.body.url, newBlog.url)
    assert.strictEqual(response.body.likes, newBlog.likes)
    assert.ok(response.body.id) // id should exist

    const blogsAtEnd = await api.get('/api/blogs')
    assert.strictEqual(blogsAtEnd.body.length, blogs.length + 1)
})

test('Test likes are defaulted to zero', async () => {
    const noLikesBlog = {
        title: "React anti-patterns",
        author: "Daniel Csillag",
        url: "https://reactpatterns.net/"
    }
    
    const response = await api.post('/api/blogs').send(noLikesBlog).expect(200).expect('Content-Type', /application\/json/)
    assert.strictEqual(response.body.likes, 0)
})

test('Test blogs without titles or names are rejected', async () => {
    const invalidBlog = {
        url: "https://reactpatterns.net/",
        likes: 10
    }
    
    await api.post('/api/blogs').send(invalidBlog)
        .expect(400)
})

test('Test deletion of blogs', async () => {
    
    await api.delete('/api/blogs/5a422ba71b54a676234d17fb')
        .expect(204)
    
    const blogsAtEnd = await api.get('/api/blogs')
    assert.strictEqual(blogsAtEnd.body.length, blogs.length - 1)    
})

test('Test update of likes', async () => {
    const newLikes = {likes: 13}
    const response = await api.put('/api/blogs/5a422ba71b54a676234d17fb').send(newLikes)

    assert.strictEqual(response.body.likes, newLikes.likes)  
})


after(async () => {
    await mongoose.connection.close()
})