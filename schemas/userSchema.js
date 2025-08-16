import { model, Schema } from "mongoose";

const userSchema = new Schema({
    userId: { required: true, type: String, unique: true },
    email: { required: true, type: String, unique: true },
    password: { required: true, type: String },
    username: { required: true, type: String },
    dateCreated: { type: Date },
    guilds: [{
        guildId: String,
        dateJoined: Date
    }],
    isLoggedIn: { type: Boolean, default: false },
    accessToken: { type: String },
    lastVisited: [{
        guildId: String,
        channelId: String
    }]
})

export default model('userSchema', userSchema)