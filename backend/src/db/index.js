import mongoose from "mongoose"
import { DB_NAME } from "../constants.js"
import { logger } from "../utils/logger.js"

const connectDB = async () => {
    try {
        const maxPoolSize = parseInt(process.env.MONGODB_MAX_POOL_SIZE) || 100;
        const minPoolSize = parseInt(process.env.MONGODB_MIN_POOL_SIZE) || 10;
        
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`, {
            maxPoolSize,
            minPoolSize
        })
       logger.info(`MongoDB connected: ${connectionInstance.connection.host}`)
    } catch (error) {
        logger.error({ err: error }, "MongoDB connection error");
        process.exit(1)
    }
}
export default connectDB;