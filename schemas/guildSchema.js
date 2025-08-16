import mongoose from "mongoose";

const guildSchema = new mongoose.Schema({
    name: { type: String, required: true },
    id: { type: String, required: true, unique: true },
    dateCreated: { type: Date, required: true },
    memebers: [{
        userId: { type: String, required: true },
        joinedAt: { type: Date, required: true },
        username: { type: String, required: true },
        profilePic: { type: String },
        roles: { type: Array },
    }],
    createdBy: { type: String, required: true },
    channels: [{
        channelId: { type: String, required: true, unique: true },
        channelName: { type: String, required: true },
        dateCreated: { type: Date, required: true },
    }]
})

export default mongoose.model('GuildSchema', guildSchema)