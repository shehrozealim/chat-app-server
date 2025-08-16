import expres from 'express'
import channelSchema from '../schemas/channelSchema.js'

const app = expres.Router()

app.get('/messages', async (req, res) => {
    const { limit, channelId } = req.query;
    const messageQuery = await channelSchema.findOne({ channelId }, { messages: { $slice: -parseInt(limit) } })
    const topMessages = messageQuery.messages.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateB - dateA;
    })
    return res.status(200).json(topMessages)
})

export default app