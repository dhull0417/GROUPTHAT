import mongoose from "mongoose";
import { ENV } from './env.js';

export const connectDB = async () => {
    try {
        await mongoose.connect(ENV.MONGO_URI)
        console.log("Connected to DB successfully")
    } catch (error) {
        console.log("Error connecting to MongoDB")
        //Only 0 will work, but 1 will kick you out
        process.exit(1);
    }


}