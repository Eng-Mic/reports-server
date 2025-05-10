const mongoose = require('mongoose')
require('dotenv').config();

// mongoose.set('strictQuery', true);

// Connection function
const connectDB = async () => {
    // try-catch block
    try {
        const URI = process.env.MONGO_URI;
        if (!URI) {
            throw new Error("MONGO_URI is not defined in the environment variables.");
        }
        // console.log(`Connecting to MongoDB at URI: ${URI}`); // Debugging line

        const conn = await mongoose.connect(URI) // connection
        console.log(`MongoDB Connected: ${conn.connection.host}`.cyan.underline);
    }
    catch (error) {
        console.error(`❌ MongoDB Connection Error: ${error.message}`.red);
        // exit the process with failure of 1
        process.exit(1)
    }
}

module.exports = connectDB;