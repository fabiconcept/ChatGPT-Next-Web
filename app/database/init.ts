import { connectDB, disconnectDB } from "./config";
import { AIModel, Membership, User } from "./models";
import bcrypt from "bcryptjs";

const initializeDatabase = async () => {
  try {
    await connectDB();

    // Sample AI Models
    const aiModels = [
      {
        modelType: "gpt-4",
        version: "1.0",
        defaultSettings: {
          temperature: 0.7,
          maxTokens: 2000,
          topP: 1,
          frequencyPenalty: 0,
          presencePenalty: 0,
        },
      },
      {
        modelType: "gpt-3.5-turbo",
        version: "1.0",
        defaultSettings: {
          temperature: 0.7,
          maxTokens: 4000,
          topP: 1,
          frequencyPenalty: 0,
          presencePenalty: 0,
        },
      },
    ];

    // Sample Memberships
    const memberships = [
      {
        name: "Free",
        description: "Basic access to AI chat",
        price: 0,
        features: ["Basic chat access", "GPT-3.5 model"],
        maxTokensPerMonth: 50000,
        maxChatsPerDay: 10,
      },
      {
        name: "Pro",
        description: "Professional access with advanced features",
        price: 20,
        features: ["Advanced chat access", "GPT-4 model", "Priority support"],
        maxTokensPerMonth: 500000,
        maxChatsPerDay: 100,
      },
    ];

    // Sample Admin User
    const adminUser = {
      email: "admin@example.com",
      passwordHash: await bcrypt.hash("admin123", 10),
      name: "Admin User",
      loginMethods: ["email"],
      isActive: true,
    };

    // Clear existing data
    await Promise.all([
      AIModel.deleteMany({}),
      Membership.deleteMany({}),
      User.deleteMany({}),
    ]);

    // Insert sample data
    await Promise.all([
      AIModel.insertMany(aiModels),
      Membership.insertMany(memberships),
      User.create(adminUser),
    ]);

    console.log("Database initialized with sample data");
    await disconnectDB();
  } catch (error) {
    console.error("Error initializing database:", error);
    await disconnectDB();
    process.exit(1);
  }
};

// Run initialization if this script is executed directly
if (require.main === module) {
  initializeDatabase();
}
