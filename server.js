const app = require('./src/app')
const connect = require('./src/db/db')
async function startServer() {
    await connect()
    app.get('/', (req, res) => {
        res.send('Hello what are you doing?')
    })
    app.listen(3000, () => {
        console.log(`Server is running on port {http://localhost:3000}`)
    })
}
startServer()