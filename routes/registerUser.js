import express from 'express'
import bcrypt from 'bcrypt'

import userSchema from '../schemas/userSchema.js'

const registerUser = express.Router()

registerUser.post('/register', async (req, res) => {
    const { email, username, password } = req.body;
    const encodedPassword = await bcrypt.hash(password, 10)
    const date = new Date().getTime().toString().slice(0, 8)
    const random = Math.random().toString().slice(2, 8)
    const userId = parseInt(date.concat(random))
    const check = await userSchema.findOne({ email })
    if (check) return res.status(409).json({ message: 'User already exists. Please login' })
    await userSchema.findOneAndUpdate({ email },
        {
            email,
            userId,
            username,
            password: encodedPassword,
            dateCreated: new Date()
        },
        { upsert: true });
    return res.status(200).json({ message: 'User registered' })
})

export default registerUser