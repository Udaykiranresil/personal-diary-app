const express = require('express')
const app = express()
const session = require('express-session')
const cors = require('cors')

// ✅ FIX: cors must allow credentials + reflect origin (not wildcard) for sessions to work
app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true
}))

app.use(express.json())

app.use(session({
    secret: process.env.SESSION_SECRET, // ✅ FIXED
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: 1000 * 60 * 60 * 24
    }
}));
app.use(express.static('public'))

const { noteModel, content_save } = require('./note-models/note-model')

function isAuth(req, res, next) {
    if (!req.session.userId) {
        return res.status(401).json({ message: 'Not logged in' })
    }
    next()
}

// ── Signup ──
app.post('/signup', async (req, res) => {
    try {
        let { username, password } = req.body
        username = username.toLowerCase()
        const user = new noteModel({ username, password })
        await user.save()
        res.status(201).json({ message: 'User created successfully', user })
    } catch (err) {
        console.log(err)
        if (err.code === 11000) {
            return res.status(400).json({ message: 'Username already exists' })
        }
        res.status(500).json({ message: 'Error creating user', error: err.message })
    }
})

// ── Login ──
app.post('/login', async (req, res) => {
    try {
        let { username, password } = req.body
        username = username.toLowerCase()
        // ✅ FIX: password should NOT be lowercased — it is case-sensitive
        const userFound = await noteModel.findOne({ username, password })
        if (!userFound) {
            return res.status(404).json({ found: false, message: 'User not found' })
        }
        req.session.userId = userFound._id
        req.session.username = userFound.username
        res.status(200).json({ found: true, message: 'Login successful' })
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

// ── Logout ──
app.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) return res.status(500).json({ error: 'Logout failed' })
        res.json({ message: 'Logged out' })
    })
})

// ── Session check (used by dashboard auth guard) ──
app.get('/me', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ loggedIn: false })
    }
    res.json({ loggedIn: true, username: req.session.username })
})

// ── Write diary ──
app.post('/write-diary', isAuth, async (req, res) => {
    const { dayname, title, content } = req.body
    try {
        const newContent = new content_save({
            userId: req.session.userId,
            dayname,
            title,
            text: content
        })
        await newContent.save()
        res.status(201).json({ message: 'Saved' })
    } catch (err) {
        res.status(500).json({ error: 'Error saving' })
    }
})

// ── All diaries (user-scoped) ──
// ✅ FIX: removed duplicate /all-diaries route; only one that uses session userId
app.get('/all-diaries', isAuth, async (req, res) => {
    try {
        const data = await content_save
            .find({ userId: req.session.userId })
            .sort({ _id: -1 })
        res.json(data)
    } catch (err) {
        res.status(500).json({ error: 'Error fetching diaries' })
    }
})

// ── Streak (user-scoped) ──
// ✅ FIX: was fetching ALL users' entries — now scoped to logged-in user
app.get('/streak', isAuth, async (req, res) => {
    try {
        const entries = await content_save.find({ userId: req.session.userId })

        const parseDate = (str) => {
            const m = { JAN:0,FEB:1,MAR:2,APR:3,MAY:4,JUN:5,JUL:6,AUG:7,SEP:8,OCT:9,NOV:10,DEC:11 }
            return new Date(parseInt(str.slice(5)), m[str.slice(2,5)], parseInt(str.slice(0,2)))
        }

        const dates = [...new Set(entries.map(e => e.dayname))]
            .sort((a, b) => parseDate(b) - parseDate(a))

        let streak = 0, prev = null
        for (const d of dates) {
            if (!prev) { streak = 1; prev = d; continue }
            const diff = (parseDate(prev) - parseDate(d)) / 86400000
            if (diff === 1) { streak++; prev = d } else break
        }

        res.json({ streak })
    } catch (err) {
        res.status(500).json({ error: 'Error calculating streak' })
    }
})

// ── Update diary ──
app.patch('/update-diary/:id', isAuth, async (req, res) => {
    try {
        const { id } = req.params
        const { title, content, mood } = req.body
        // ✅ Scoped to user's own entry only
        const updated = await content_save.findOneAndUpdate(
            { _id: id, userId: req.session.userId },
            { title, text: content, mood },
            { new: true }
        )
        if (!updated) return res.status(404).json({ error: 'Entry not found' })
        res.json(updated)
    } catch (err) {
        console.log(err)
        res.status(500).json({ error: 'Update failed', detail: err.message })
    }
})
app.delete('/delete-diary/:id', isAuth, async(req, res) =>{
    try{
        const {id} = req.params
        const {password} = req.body
        const user = await noteModel.findById(req.session.userId)
        if(!user){
            return res.status(404).json({
                error: "User not found"
            })
        }
        if(user.password != password){
            return res.status(401).json({
                error: "Incorrect password"
            })
        }
        const deleted = await content_save.findOneAndDelete({
            _id : id,
            userId: req.session.userId
        })
        if(!deleted){
            return res.status(404).json({
                error: "Diary not found"
            })
        }
        res.json({
            message: "Diary deleted successfully"
        })
    }
    catch(err){
        console.log(err)
        res.status(500).json({
            error: "Delete failed"
        })
    }
})
module.exports = app