"use strict";
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectMongoDB = void 0;
const mongodb_1 = require("mongodb");
const mongoose_1 = __importDefault(require("mongoose"));
if (!process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
}
const uri = process.env.MONGODB_URI;
const options = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};
let client;
let clientPromise;
// MongoDB connection handler
const connectMongoDB = async () => {
  try {
    if (mongoose_1.default.connection.readyState !== 1) {
      await mongoose_1.default.connect(uri, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });
      console.log("🌿 MongoDB connected successfully");
    }
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    throw error;
  }
};
exports.connectMongoDB = connectMongoDB;
if (process.env.NODE_ENV === "development") {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  let globalWithMongo = global;
  if (!globalWithMongo._mongoClientPromise) {
    client = new mongodb_1.MongoClient(uri, options);
    globalWithMongo._mongoClientPromise = client.connect();
    // Initialize mongoose connection
    connectMongoDB();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  client = new mongodb_1.MongoClient(uri, options);
  clientPromise = client.connect();
  // Initialize mongoose connection
  connectMongoDB();
}
// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
exports.default = clientPromise;
