// models/tokenModel.js
const mongoose = require('mongoose');

const tokenSchema = new mongoose.Schema(
    {
        token: { type: String, required: true, unique: true },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        expiresAt: { type: Date, required: true }
    },
    { timestamps: true }
);

// Index to automatically expire and remove tokens
tokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Token', tokenSchema);