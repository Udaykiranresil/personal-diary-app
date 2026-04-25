const mongoose = require('mongoose')
async function connectDB(){
    try {
        await mongoose.connect("mongodb+srv://yt:D4qn8DQxK72QFl9U@cluster0.ag87hhr.mongodb.net/halley")
        console.log('Database is connected')
    } catch (error) {
        console.log(error)
    }
}
module.exports = connectDB