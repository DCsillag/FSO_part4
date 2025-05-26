const blogRouter = require('express').Router()
const Blog = require('../models/blog')
const User = require('../models/user')
const { userExtractor } = require('../utils/middleware')

const jwt = require('jsonwebtoken')
/* Now in middleware
const getTokenFrom = request => {
    const authorization = request.get('authorization')
    if (authorization && authorization.startsWith('Bearer ')) {
      return authorization.replace('Bearer ', '')
    }
    return null
}*/

blogRouter.get('/', async (request, response, next) => {
    console.log('Fetching all blogs')
    const blogs = await Blog.find({}).populate('user', { username: 1 })
    response.json(blogs)
})

blogRouter.post('/', userExtractor, async (request, response, next) => {
    
    const body = request.body

    const user = request.user
    console.log(user)

    const blog = new Blog({
        title: body.title,
        author: body.author,
        url: body.url,
        likes: body.likes || 0,
        user: user._id
    })

    const savedBlog = await blog.save()
    user.blogs = user.blogs.concat(savedBlog._id)
    await user.save()

    response.json(savedBlog)
})

blogRouter.delete('/:id', userExtractor, async (request, response, next) => {
    const user = request.user
    const blog = await Blog.findById(request.params.id)

    console.log(user)
    console.log(blog)

    if ( blog.user.toString() === user._id.toString() ) {
        await Blog.findByIdAndDelete(request.params.id)
        return response.status(204).json(blog)
    } else {
        return response.status(400).json({error: 'Insufficient Permissions'})
    }
})

blogRouter.put('/:id', async (request, response, next) => {
    const { likes } = request.body

    const updatedBlog = await Blog.findByIdAndUpdate(request.params.id, { likes: likes }, { new: true, runValidators: true })
    response.json(updatedBlog)
})

module.exports = blogRouter