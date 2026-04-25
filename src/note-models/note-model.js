const mongoose = require('mongoose')

const noteSchema = mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    }
})

// ✅ FIX: removed `unique: true` from dayname — multiple users can write on the same date,
//         and even the same user can have multiple entries per day (different titles)
const content_save_schema = mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'sign-up',
        required: true
    },
    dayname: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    text: {
        type: String,
        required: true
    },
    mood: String
}, { timestamps: true })

const noteModel = mongoose.model('sign-up', noteSchema)
const content_save = mongoose.model('contents', content_save_schema)

module.exports = { noteModel, content_save }