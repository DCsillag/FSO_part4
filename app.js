const express = require('express')
const mongoose = require('mongoose')
const config = require('./utils/config')
const middleware = require('./utils/middleware')
const blogRouter = require('./controllers/blogs')
const userRouter = require('./controllers/users')
const loginRouter = require('./controllers/login')

const app = express()

mongoose
    .connect(config.MONGODB_URI)
    .then(() => {
        console.log('Connected to MongoDB')
    })
    .catch((error) => {
        console.log(error)
    })

app.use(express.json())
app.use(middleware.requestLogger)
app.use(middleware.tokenExtractor)
app.use('/api/login', loginRouter)
app.use('/api/blogs', blogRouter)
app.use('/api/users', userRouter)
app.use(middleware.unknownEndpoint)
app.use(middleware.errorHandler)

console.log('middleware loaded')

module.exports = app