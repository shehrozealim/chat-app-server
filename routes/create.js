import express from 'express'
import jwt from 'jsonwebtoken'
import multer from 'multer'
import sharp from 'sharp'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { configDotenv } from 'dotenv';
configDotenv()

import channelSchema from '../schemas/channelSchema.js';
import guildSchema from '../schemas/guildSchema.js';
import userSchema from '../schemas/userSchema.js';
import inviteSchema from '../schemas/inviteSchema.js';

const app = express.Router()

const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ["image/jpeg", "image/png", "image/webp", "video/mp4"];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error("Only images and .mp4 videos are allowed"));
        }
    },
});

app.post('/create/guild', async (req, res) => {
    const { name, accessToken } = req.body;
    const part1 = new Date().getTime().toString().slice(3, 9)
    const part2 = Math.random().toString().slice(2, 7)
    const guildId = `3${part1.concat(part2)}`
    const channelPart1 = new Date().getTime().toString().slice(3, 9)
    const channelPart2 = Math.random().toString().slice(2, 7)
    const channelId = `4${channelPart1.concat(channelPart2)}`
    const msgpart1 = new Date().getTime()
    const msgpart2 = Math.floor(Math.random() * 10000000)
    const messageId = `1${msgpart1}${msgpart2}`
    const { userId } = jwt.decode(accessToken)
    const userData = await userSchema.findOne({ userId })

    try {
        const newChannelMessage = new channelSchema({
            channelId, channelName: 'general', guildId, messages: [{
                messageId,
                messageContent: `Created new channel #general`,
                dateCreated: new Date(),
                serverMessage: true,
                createdBy: { userId: '1', username: '1' }
            }]
        });
        const guildCreate = new guildSchema({
            name, id: guildId, createdBy: userId, dateCreated: new Date(),
            memebers: [{ userId, joinedAt: new Date(), username: userData.username }],
            channels: [{ channelId, channelName: 'general', dateCreated: new Date() }]
        })
        await newChannelMessage.save()
        await guildCreate.save()
        console.log('guild created')
        await userSchema.findOneAndUpdate(
            { userId },
            {
                $push: {
                    guilds: { guildId, dateJoined: new Date() }
                }
            });
        return res.status(200).json({ message: 'guild created' })
    } catch (error) {
        console.log(error.message)
        return res.status(404).json({ message: error.message })
    }
})

app.post('/create/channel', async (req, res) => {
    const { guildId, channelName, channelTopic } = req.body;
    const channelPart1 = new Date().getTime().toString().slice(3, 9)
    const channelPart2 = Math.random().toString().slice(2, 7)
    const channelId = `4${channelPart1.concat(channelPart2)}`
    const part1 = new Date().getTime()
    const part2 = Math.floor(Math.random() * 10000000)
    const messageId = `1${part1}${part2}`
    await guildSchema.findOneAndUpdate({ id: guildId }, {
        $push: {
            channels: {
                channelId,
                channelName,
                dateCreated: new Date()
            }
        }
    }).catch(() => res.sendStatus(404));
    const newChannelMessage = new channelSchema({
        channelId, channelTopic, channelName, guildId, messages: [{
            messageId,
            messageContent: `Created new channel #${channelName}`,
            dateCreated: new Date(),
            serverMessage: true,
            createdBy: { userId: '1', username: '1' }
        }]
    });
    await newChannelMessage.save()
    return res.status(200).json({ message: 'channel created' })
})

app.post('/create/message', upload.single('file'), async (req, res) => {
    const { messageContent, dateCreated, userId, username, channelId, messageId, file } = req.body;
    var messageData = {
        messageContent,
        messageId,
        dateCreated,
        createdBy: {
            userId,
            username
        },
        attachments: []
    }

    if (file.length > 0) {
        await Promise.all(file.map(async (att) => {
            const parts = att.base64.split(';')
            const base64 = parts[1].split(',')[1]
            const fileExtension = att.type.split('/')[1]
            const fileType = att.type.split('/')[0]
            const fileKey = `${new Date().getTime()}${Math.floor(Math.random() * 10000000)}.${fileExtension}`
            const buffer = Buffer.from(base64, "base64");

            await s3.send(new PutObjectCommand({
                Bucket: process.env.AWS_S3_BUCKET,
                Key: fileKey,
                Body: buffer,
                ContentEncoding: "base64",
                ContentType: att.type,
                ACL: "public-read",
            }))

            const url = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`;
            messageData.attachments.push({
                fileUrl: url,
                type: fileType,
                extension: fileExtension,
                dateUploaded: new Date()

            })
        }))
    }

    channelSchema.findOneAndUpdate({ channelId }, { $push: { messages: messageData } })
        .then(() => {
            return res.status(200).json({ ...messageData })
        })
        .catch((err) => {
            console.log(err)
            return res.status(404).json({ error: err.message })
        })

})

app.post('/create/invite', async (req, res) => {
    const { channelId, accessToken, duration, neverExpire, guildId } = req.body
    jwt.verify(accessToken, process.env.SECRET_KEY, async (err, decode) => {
        if (err) return res.status(404).json({ message: 'invalid token' });

        const letters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
        let inviteCode = '';
        for (let i = 0; i < 6; i++) {
            inviteCode += letters[Math.floor(Math.random() * letters.length)];
        }

        const expiresAt = new Date().setTime(new Date().getTime() + duration)

        const { userId } = decode;
        const inviteStore = new inviteSchema({
            createdAt: new Date(),
            createdBy: userId,
            inviteCode,
            expiresAt: neverExpire ? new Date(8640000000000000) : expiresAt,
            channelId,
            guildId,
            neverExpire
        })
        await inviteStore.save();
        return res.status(200).json({ message: 'successfully created invite', inviteCode })
    })
})

export default app