import express from 'express'
import jwt from 'jsonwebtoken'
import userSchema from '../schemas/userSchema.js'
import inviteSchema from '../schemas/inviteSchema.js'
import channelSchema from '../schemas/channelSchema.js'
import guildSchema from '../schemas/guildSchema.js'

const app = express.Router()

app.post('/join/channel', async (req, res) => {
    const { inviteCode, accessToken } = req.body
    jwt.verify(accessToken, process.env.SECRET_KEY, async (err, decode) => {
        if (err) return res.status(404).json({ message: 'invalid token' });
        const { userId } = decode;
        try {
            const userData = await userSchema.findOne({ userId });
            console.log(userId)
            if (!userData) return res.status(404).json({ message: 'invalid user' });
            const inviteData = await inviteSchema.findOne({ inviteCode })
            if (!inviteData) return res.status(404).json({ message: 'invalid code' })
            const channelData = await channelSchema.findOne({ channelId: inviteData.channelId })
            if (!channelData) return res.status(404).json({ message: 'invalid channel' });
            await userSchema.findOneAndUpdate({ userId }, { $push: { guilds: { guildId: channelData.guildId, dateJoined: new Date() } } })
            await guildSchema.findOneAndUpdate({ id: channelData.guildId }, { $push: { memebers: { userId, joinedAt: new Date(), roles: [], username: userData.username } } })
            await inviteSchema.findOneAndUpdate({ inviteCode }, { $push: { uses: { userId, usedOn: new Date() } } })
            return res.status(200).json({ message: 'join successful' })
        } catch (error) {
            console.log(error.message)
        }

    })
})

export default app