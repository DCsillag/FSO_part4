const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    username: {
        required: true,
        type: String,
        unique: true,
        minLength: 4
    },
    name: {
        required: true,
        type: String
    },
    passwordHash: {
        required: true,
        type: String
    },
    blogs: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Blog'
        }
    ]
})

userSchema.set('toJSON', {
    transform: (document, returnedObject) => {
        returnedObject.id = returnedObject._id.toString()
        delete returnedObject._id
        delete returnedObject.__v
        delete returnedObject.passwordHash
    }
})

const User = mongoose.model('User', userSchema)

module.exports = User