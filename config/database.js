const mongoose = require('mongoose');

// Cached connection for serverless environments
let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
    // Return cached connection if available (for serverless)
    if (cached.conn) {
        return cached.conn;
    }

    if (!cached.promise) {
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/roadtrip-planner';

        const opts = {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            bufferCommands: false, // Disable buffering for serverless
            maxPoolSize: 10, // Limit connection pool for serverless
        };

        cached.promise = mongoose.connect(mongoUri, opts).then((mongoose) => {
            return mongoose;
        });
    }

    try {
        cached.conn = await cached.promise;
        console.log('MongoDB Connected Successfully');
    } catch (error) {
        console.error('MongoDB connection failed:', error);
        cached.promise = null;
        throw error;
    }

    return cached.conn;
};

module.exports = connectDB;