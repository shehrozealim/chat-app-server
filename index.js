import express from 'express'
import cors from 'cors'
import { createServer } from 'http'
import cookieParser from 'cookie-parser'
import { WebSocketServer, WebSocket } from 'ws'
import mongoose from 'mongoose'
import { config } from 'dotenv'
config()

const app = express()
const server = createServer(app)

const wss = new WebSocketServer({ server })

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
    origin: ['https://chat-app-client-six-ivory.vercel.app', 'http://localhost:3000'],
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE'
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

const channels = new Map()

wss.on('connection', ws => {
    console.log(`Connect: Total active connections: ${wss.clients.size}`)
    ws.on('error', console.error)

    ws.on('message', async (data) => {
        const res = JSON.parse(data.toString())

        if (res.event === 'channelConnect') {
            const { channelId } = res
            ws.channel = channelId;

            if (!channels.has(channelId)) {
                channels.set(channelId, new Set());
            }
            channels.get(channelId).add(ws);


        } else if (res.event === 'messageCreate') {
            const { channelId } = res;
            const clients = channels.get(channelId) || new Set();

            for (const client of clients) {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify(res));
                }
            }
            // wss.clients.forEach(client => {
            //     if (client.readyState === WebSocket.OPEN) {
            //         client.send(JSON.stringify(res));
            //     }
            // })
        } else if (res.event === 'switchChannel') {

            const userId = res.userId;
            const channelId = res.channelData.channelId;
            const guildId = res.channelData.guildId

            const userData = await userSchema.findOneAndUpdate({ userId })
            const lastVisited = userData.lastVisited.filter(x => x.guildId === guildId)
            if (lastVisited.length === 0) {
                userData.lastVisited.push({ channelId, guildId });
                return userData.save()
            } else if (lastVisited.length > 1) {
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

server.listen(5000, () => {
    console.log('Server running on 5000')
    mongoose.connect(`${process.env.MONGODB_URI}`, { dbName: 'chat-app' }).then(() => console.log('Connected to MONGODB'))
        .catch(err => console.log(err.message))
})