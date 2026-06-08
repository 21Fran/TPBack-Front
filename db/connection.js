import 'dotenv/config'
import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/myapp'

let cached = global.mongoose || { conn: null, promise: null }

export const connectToDatabase = async () => {
    if (cached.conn) return cached.conn
    cached.promise = cached.promise || mongoose.connect(MONGODB_URI, {
        dbName:'MongoDB',
        bufferCommands: false,
    })
    
    cached.conn = await cached.promise;


    return cached.conn
}