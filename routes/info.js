import express from 'express'
import jwt from 'jsonwebtoken'

import guildSchema from '../schemas/guildSchema.js'
import userSchema from '../schemas/userSchema.js'
import channelSchema from '../schemas/channelSchema.js'
import inviteSchema from '../schemas/inviteSchema.js'

const app = express.Router()

app.get('/info/guild', async(req, res) => {
    const { id } = req.query

    try {
        const guildData = await guildSchema.findOne({ id })
        return res.status(200).json(guildData)
    } catch (error) {
        return res.status(404)
    }
})

app.get('/info/user', async(req, res) => {
    const { accessToken } = req.query

    try {
        jwt.verify(accessToken, process.env.SECRET_KEY, async(err, decoded) => {
            if(err) return res.status(404).json({ error: err.message });
            const { userId } = decoded;
            const userData = await userSchema.findOne({ userId })
            if(!userData) return res.status(404).json({ error: 'does not exist' });
            return res.status(200).json(userData)
        })
    } catch (error) {
        console.log(error.message)
    }
})

app.get('/info/user/history', async (req, res) => {
    const accessToken = req.cookies.accessToken

    try {
        jwt.verify(accessToken, process.env.SECRET_KEY, async(err, decoded) => {
            if(err) return res.status(404).json({ error: err.message });
            const { userId } = decoded;
            const userData = await userSchema.findOne({ userId })
            if(!userData) return res.status(404).json({ error: 'does not exist' });
            return res.status(200).json(userData.lastVisited)
        })
    } catch (error) {
        console.log(error.message)
    }
})

app.post('/info/user/history', async(req, res) => {
    const history = req.body;
    const accessToken = req.cookies.accessToken

    try {
        jwt.verify(accessToken, process.env.SECRET_KEY, async(err, decoded) => {
            if(err) return res.status(404).json({ error: err.message });
            const { userId } = decoded;
            const userData = await userSchema.findOneAndUpdate({ userId })
            if(!userData) return res.status(404).json({ error: 'does not exist' });
            userData.lastVisited = history
            await userData.save()
            return res.status(200).json(userData.lastVisited)
        })
    } catch (error) {
        console.log(error.message)
    }
})

app.get('/info/channel', async(req, res) => {
    const { channelId } = req.query
    const channelData = await channelSchema.findOne({ channelId }, { messages: 0 })
    if(!channelData) return res.status(404).json({ message: 'invalid channel id' });
    return res.status(200).json(channelData)
})

app.get('/info/invite', async(req, res) => {
    const { inviteCode, accessToken } = req.query;
    const { userId } = jwt.verify(accessToken, process.env.SECRET_KEY)
    if(!userId) return res.status(404).json({ message: 'invalid token' })
    const inviteData = await inviteSchema.findOne({ inviteCode })
    if(!inviteData) return res.status(404).json({ message: 'invalid invite' })
    const channelData = await channelSchema.findOne({ channelId: inviteData.channelId }, { messages: 0 })
    const userData = await userSchema.findOne({ userId })
    if((userData.guilds.filter(x => x.guildId === channelData.guildId)).length > 0) return res.status(404).json({ message: 'user already in guild' })
    if(!inviteData) return res.status(404).json({ message: 'invalid invite code' })
    return res.status(200).json(inviteData)
})

export default app