"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongodb_1 = require("../app/database/mongodb");
const models_1 = require("../app/database/models");
async function migrateUsers() {
    try {
        await (0, mongodb_1.connectMongoDB)();
        // Find all users without userId
        const users = await models_1.User.find({ userId: { $exists: false } });
        console.log(`Found ${users.length} users without userId`);
        // Update each user with a new userId
        for (const user of users) {
            user.userId = `user_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
            await user.save();
            console.log(`Updated user ${user._id} with new userId: ${user.userId}`);
        }
        console.log('Migration completed successfully');
        process.exit(0);
    }
    catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}
migrateUsers();
