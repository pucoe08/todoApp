import mongoose from "mongoose";

export const connectDatabase = async () => {
    try {
        const { connection } = await mongoose.connect(process.env.MONGO_URI, {
            dbName: "TodoApp",
        })
        console.log(`MongoDB connected with ${connection.host}`);
    } catch (error) {
        console.log(error);
        process.exit
    }
}