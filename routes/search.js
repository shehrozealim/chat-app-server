import express from 'express'
import channelSchema from '../schemas/channelSchema.js'

const app = express.Router()

app.get('/search/:channelId', async (req, res) => {
    const { search } = req.query
    const channelId = req.params.channelId
    
    const result = await channelSchema.aggregate([
        { $match: { channelId } },
        { $unwind: '$messages' },
        { $match: { 'messages.messageContent': { $regex: search, $options: 'i' } } },
        { $replaceRoot: { newRoot: '$messages' } }
    ]);
    return res.json(result)
})

export default app