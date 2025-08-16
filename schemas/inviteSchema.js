import mongoose from 'mongoose'

const inviteSchema = new mongoose.Schema({
    guildId: { type: String },
    channelId: { type: String },
    createdBy: { type: String },
    createdAt: { type: Date },
    expiresAt: { type: Date },
    inviteCode: { type: String },
    neverExpire: { type: Boolean, default: false },
    totalUses: { type: Number, default: 0 },
    uses: [{
        userId: { type: String },
        usedOn: { type: Date }
    }]
})

export default mongoose.model('InviteSchema', inviteSchema)