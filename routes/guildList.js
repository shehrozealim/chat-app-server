import express from 'express'
import jwt from 'jsonwebtoken'

import guildSchema from '../schemas/guildSchema.js'

const app = express.Router()

app.get('/guildlist', async (req, res) => {
    const { accessToken } = req.query
    
    try {
        const { userId } = jwt.verify(accessToken, process.env.SECRET_KEY)
        const guildList = await guildSchema.find({ "memebers.userId": userId })
        return res.status(200).json(guildList)
    } catch (error) {
        console.log(error.message)
    }
})

export default app