import express from 'express'
import jwt from 'jsonwebtoken'
import inviteSchema from '../schemas/inviteSchema.js';
import channelSchema from '../schemas/channelSchema.js';

const app = express.Router()

app.post('/verify/login', async (req, res) => {
    const { accessToken } = req.body;
    jwt.verify(accessToken, process.env.SECRET_KEY, (err, decoded) => {
        if (err) return res.status(404).json({ message: 'invalid token' })
        return res.status(200).json({ message: 'valid token' });
    })
})

app.post('/verify/invite', async(req, res) => {
    const { inviteCode } = req.body;
    const inviteCheck = await inviteSchema.findOne({ inviteCode })
    if(!inviteCheck) return res.status(404).json({ message: 'invalid invite' });
    const expiryDate = new Date(inviteCheck.expiresAt).getTime()
    const channelData = await channelSchema.findOne({ channelId: inviteCheck.channelId }, { messages: 0 })
    if((expiryDate - new Date().getTime()) > 0) return res.status(200).json({ channelData });
    return res.status(404).json({ message: 'invalid invite' })
})

export default app