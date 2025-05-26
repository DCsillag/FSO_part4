const blogRouter = require('express').Router()
const Blog = require('../models/blog')

blogRouter.get('/', async (request, response, next) => {
    console.log('Fetching all blogs')
    const blogs = await Blog.find({})
    response.json(blogs)
})

blogRouter.post('/', async (request, response, next) => {
    
    const body = request.body

    const blog = new Blog({
        title: body.title,
        author: body.author,
        url: body.url,
        likes: body.likes || 0
    })

    const savedBlog = await blog.save()
    response.json(savedBlog)
})

blogRouter.delete('/:id', async (request, response, next) => {
    await Blog.findByIdAndDelete(request.params.id)
    response.status(204).end()
})

blogRouter.put('/:id', async (request, response, next) => {
    const { likes } = request.body

    const updatedBlog = await Blog.findByIdAndUpdate(request.params.id, { likes: likes }, { new: true, runValidators: true })
    response.json(updatedBlog)
})

module.exports = blogRouter