const jwt = require('jsonwebtoken')
const User = require('../models/user')

const requestLogger = (request, response, next) => {
    console.log('Method:', request.method)
    console.log('Path:  ', request.path)
    console.log('Body:  ', request.body)
    console.log('---')
    next()
}

const unknownEndpoint = (request, response) => {
    response.status(404).send({ error: 'unknown endpoint' })
}

const errorHandler = (error, request, response, next) => {
    console.log(error.message)
  
    if (error.name === 'CastError') {
      return response.status(400).send({ error: 'malformatted id' })
    } else if (error.name === 'ValidationError') {
      return response.status(400).json({ error: error.message })
    } else if (error.name === 'MongoServerError' && error.message.includes('E11000 duplicate key error')) {
      return response.status(400).json({ error: 'expected `username` to be unique' })
    } else if (error.name ===  'JsonWebTokenError') {
      return response.status(401).json({ error: 'token invalid' })
    } else if (error.name === 'TokenExpiredError') {
      return response.status(401).json({
        error: 'token expired'
    })
  }
  
    next(error)
}

const tokenExtractor = (request, response, next) => {
  const authorization = request.get('authorization') || ''
  if (authorization.toLowerCase().startsWith('bearer ')) {
    request.token = authorization.slice(7)   // strip off "Bearer "
  } else {
    request.token = null
  }
  next()
}

const userExtractor = async (request, response, next) => {
  const authorization = request.get('authorization') || ''

  if (!authorization.toLowerCase().startsWith('bearer ')) {
    return response.status(401).json({ error: 'token missing' })
  }

  const token = authorization.slice(7)

  try {
    const decodedToken = jwt.verify(token, process.env.SECRET)
    if (!decodedToken.id) {
      return response.status(401).json({ error: 'token invalid' })
    }

    request.user = await User.findById(decodedToken.id)
    next()
  } catch (err) {
    next(err)           // let errorHandler convert bad/expired tokens to 401
  }
}


  
module.exports = {
    requestLogger,
    unknownEndpoint,
    errorHandler,
    tokenExtractor,
    userExtractor
}