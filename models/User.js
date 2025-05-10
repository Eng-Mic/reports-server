const mongoose = require('mongoose'); // Erase if already required

// Declare the Schema of the Mongo model
const userSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true},
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        role: { type: String, default: "user", required: true },
        lastActive: { type: Date },
    },
    { timestamps: true }
);

//Export the model
module.exports = mongoose.model('User', userSchema);