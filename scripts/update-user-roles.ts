
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { randomUUID } from 'crypto';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Helper to connect to DB (using the same logic as lib/mongodb.ts but simplified for script)
const connectDB = async () => {
    if (mongoose.connection.readyState >= 1) return;
    try {
        await mongoose.connect(process.env.MONGODB_URI as string);
        console.log("MongoDB Connected");
    } catch (error) {
        console.error("MongoDB connection error:", error);
        process.exit(1);
    }
};

// Define a minimal User Schema for the script to avoid importing the full model 
// and dealing with alias resolution (@/lib/...) which can be tricky in standalone scripts
const UserSchema = new mongoose.Schema({
    role: String,
    sessionId: String,
}, { strict: false }); // strict: false allows us to update fields without defining the whole schema

const User = mongoose.models.User || mongoose.model('User', UserSchema);

const updateUsers = async () => {
    await connectDB();

    try {
        console.log("Updating users...");

        // 1. Set all users to 'Regular'
        const updateResult = await User.updateMany(
            {},
            { $set: { role: 'Regular' } }
        );
        console.log(`Updated ${updateResult.modifiedCount} users to role 'Regular'.`);

        // 2. Backfill sessionId for users who don't have one
        const usersWithoutSession = await User.find({ sessionId: { $exists: false } });
        console.log(`Found ${usersWithoutSession.length} users without sessionId.`);

        for (const user of usersWithoutSession) {
            await User.updateOne(
                { _id: user._id },
                { $set: { sessionId: randomUUID() } }
            );
        }
        if (usersWithoutSession.length > 0) {
            console.log(`Generated sessionIds for ${usersWithoutSession.length} users.`);
        }

        console.log("Done!");
    } catch (error) {
        console.error("Error updating users:", error);
    } finally {
        await mongoose.disconnect();
    }
};

updateUsers();
