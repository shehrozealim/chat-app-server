import mongoose from 'mongoose'

const channelSchema = new mongoose.Schema({
    guildId: { type: String, required: true },
    channelId: { type: String, required: true },
    channelTopic: { type: String },
    channelName: { type: String, required: true },
    messages: [{
        serverMessage: { type: Boolean, default: false },
        messageContent: { type: String },
        messageId: { type: String, unique: true },
        dateCreated: { type: Date },
        createdBy: {
            username: { type: String },
            userId: { type: String },
        },
        attachments: [{
            fileUrl: { type: String },
            type: { type: String },
            dateUploaded: { type: Date },
        }]
    }]
})

export default mongoose.model('channelSchema', channelSchema)