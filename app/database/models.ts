import mongoose from "mongoose";
import {
  Collections,
  IUser,
  IAIModel,
  IMembership,
  IChatLog,
  IUserSubscription,
} from "./types";

const userSchema = new mongoose.Schema<IUser>({
  email: { type: String, required: true, unique: true },
  phoneNumber: { type: String },
  passwordHash: { type: String, required: true },
  name: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  lastLoginAt: { type: Date },
  isActive: { type: Boolean, default: true },
  loginMethods: [{ type: String }],
});

const aiModelSchema = new mongoose.Schema<IAIModel>({
  modelType: { type: String, required: true },
  version: { type: String, required: true },
  model: { type: String, required: true },
  providerName: { type: String, required: true },
  defaultSettings: {
    temperature: { type: Number, default: 0.7 },
    maxTokens: { type: Number, default: 2000 },
    topP: { type: Number, default: 1 },
    frequencyPenalty: { type: Number, default: 0 },
    presencePenalty: { type: Number, default: 0 },
    compressMessageLengthThreshold: { type: Number, default: 4000 },
    enableInjectSystemPrompts: { type: Boolean, default: true },
    template: { type: String, default: "" },
    historyMessageCount: { type: Number, default: 10 },
    sendMemory: { type: Boolean, default: true },
    compressModel: { type: String, default: "gpt-3.5-turbo" },
    compressProviderName: { type: String, default: "openai" },
  },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const membershipSchema = new mongoose.Schema<IMembership>({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  features: [{ type: String }],
  maxTokensPerMonth: { type: Number, required: true },
  maxChatsPerDay: { type: Number, required: true },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const chatLogSchema = new mongoose.Schema<IChatLog>({
  userId: { type: String, required: true },
  modelId: { type: String, required: true },
  messages: [
    {
      role: {
        type: String,
        enum: ["user", "assistant", "system"],
        required: true,
      },
      content: { type: String, required: true },
      timestamp: { type: Date, default: Date.now },
    },
  ],
  tokenUsage: {
    promptTokens: { type: Number, required: true },
    completionTokens: { type: Number, required: true },
    totalTokens: { type: Number, required: true },
  },
  cost: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
});

const userSubscriptionSchema = new mongoose.Schema<IUserSubscription>({
  userId: { type: String, required: true },
  membershipId: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  isActive: { type: Boolean, default: true },
  tokenUsage: { type: Number, default: 0 },
  paymentStatus: {
    type: String,
    enum: ["active", "cancelled", "expired"],
    required: true,
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export const User = mongoose.model<IUser>(Collections.USERS, userSchema);
export const AIModel = mongoose.model<IAIModel>(
  Collections.AI_MODELS,
  aiModelSchema,
);
export const Membership = mongoose.model<IMembership>(
  Collections.MEMBERSHIPS,
  membershipSchema,
);
export const ChatLog = mongoose.model<IChatLog>(
  Collections.CHAT_LOGS,
  chatLogSchema,
);
export const UserSubscription = mongoose.model<IUserSubscription>(
  Collections.USER_SUBSCRIPTIONS,
  userSubscriptionSchema,
);
