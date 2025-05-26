const userRouter = require('express').Router()
const User = require('../models/user')
const bcrypt = require('bcrypt')

userRouter.get('/', async (request, response, next) => {
    console.log('Fetching all users')
    const users = await User.find({}).populate('blogs', { title: 1 })
    response.json(users)
})

userRouter.post('/', async (request, response, next) => {
    const { username, name, password } = request.body
    
    if (password.length < 4) {
        return response.status(400).json({error: "Password must be at least 4 characters"})
    }

    try {
        const saltRounds = 10
        const passwordHash = await bcrypt.hash(password, saltRounds)

        const user = new User({
            username,
            name,
            passwordHash
        })

        const savedUser = await user.save()

        return response.status(201).json(savedUser)
    } catch (error) {
        return next(error)
    }
})

module.exports = userRouter