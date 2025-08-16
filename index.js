import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { WebSocketServer, WebSocket } from 'ws'
import mongoose from 'mongoose'
import { config } from 'dotenv'
config()

const app = express()

const wss = new WebSocketServer({ port: 8080 })

import registerUser from './routes/registerUser.js'
import loginUser from './routes/loginUser.js'
import create from './routes/create.js'
import guildList from './routes/guildList.js'
import info from './routes/info.js'
import verify from './routes/verify.js'
import fetchMessages from './routes/fetchMessages.js'
import join from './routes/join.js'
import search from './routes/search.js'
import userSchema from './schemas/userSchema.js'

app.use(express.json({ limit: '5mb' }))
app.use(express.urlencoded({ limit: '50mb' }));
app.use(cookieParser())
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));


app.use(registerUser)
app.use(loginUser)
app.use(create)
app.use(guildList)
app.use(info)
app.use(verify)
app.use(fetchMessages)
app.use(join)
app.use(search)

wss.on('connection', ws => {
    console.log(`Connect: Total active connections: ${wss.clients.size}`)
    ws.on('error', console.error)

    ws.on('message', async (data) => {
        const res = JSON.parse(data.toString())

        if (res.event === 'messageCreate') {
            wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify(res));
                }
            })
        } else if (res.event === 'switchChannel') {
            console.log('event')
            const userId = res.userId;
            const channelId = res.channelData.channelId;
            const guildId = res.channelData.guildId

            const userData = await userSchema.findOneAndUpdate({ userId })
            const lastVisited = userData.lastVisited.filter(x => x.guildId === guildId)
            if(lastVisited.length === 0) {
                userData.lastVisited.push({ channelId, guildId });
                return userData.save()
            } else if(lastVisited.length > 1) {
                const index = userData.lastVisited.indexOf({ channelId, guildId })
                userData.lastVisited.splice(index, 1)
            }
            lastVisited[0].channelId = channelId
            await userData.save()
        }
    })

    ws.on('close', function close() {
        console.log(`Disconnect: Total active connections: ${wss.clients.size}`);
    });
})

app.listen(5000, () => {
    console.log('Server running on 5000')
    mongoose.connect(`${process.env.MONGODB_URI}`).then(() => console.log('Connected to MONGODB'))
        .catch(err => console.log(err.message))
})