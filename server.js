require('dotenv').config()          // ✅ Must be first — loads env vars before anything else

const app = require('./src/app')
const connect = require('./src/db/db')

const PORT = process.env.PORT || 3000

async function startServer() {
    await connect()
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`)
    })
}

startServer()