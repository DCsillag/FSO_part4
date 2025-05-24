const blogRouter = require('express').Router()
const Blog = require('../models/blog')

blogRouter.get('/', (request, response, next) => {
    console.log('Fetching all blogs')
    Blog.find({}).then(blog => {
        response.json(blog)
    })
    .catch(error => next(error))
})

blogRouter.post('/', (request, response, next) => {
    const body = request.body

    const blog = new Blog({
        title: body.title,
        author: body.author,
        url: body.url,
        likes: body.likes || 0
    })

    blog.save().then(savedBlog => {
        response.json(savedBlog)
    })
    .catch(error => next(error))
})

module.exports = blogRouter