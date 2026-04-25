const app = require('./src/app')
const connect = require('./src/db/db')
const PORT = process.env.PORT || 3000
async function startServer() {
    await connect()
    app.get('/', (req, res) => {
        res.send('Hello what are you doing?')
    })
    app.listen(PORT, () => {
        console.log(`Server is running on port {http://localhost:3000}`)
    })
}
startServer()