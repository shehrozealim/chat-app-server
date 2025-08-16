import express from 'express'
import jwt from 'jsonwebtoken'

import userSchema from '../schemas/userSchema.js'

const app = express.Router()

app.post('/login', async(req, res) => {
    const { email, password } = req.body
    const userData = await userSchema.findOne({ email });
    if(!userData) return res.status(404)
    const accessToken = jwt.sign({ username: userData.username, userId: userData.userId, email, loggedIn: new Date().getTime() }, process.env.SECRET_KEY, {
        expiresIn: 60 * 10
    })
    return res.status(200).json({ accessToken })
})

export default app