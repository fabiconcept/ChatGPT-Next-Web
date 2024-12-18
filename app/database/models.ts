import mongoose from "mongoose";
import {
  IUser,
  IAIModel,
  IMembership,
  IChatLog,
  IUserSubscription,
  IUserSettings,
  Collections,
} from "./types";

const userSchema = new mongoose.Schema<IUser>({
  userId: { type: String, required: true, unique: true },
  email: { type: String, sparse: true, unique: true },
  phoneNumber: { type: String, sparse: true, unique: true },
  passwordHash: { type: String },
  name: { type: String },
  createdAt: { type: Date, default: Date.now },
  lastLoginAt: { type: Date },
  isActive: { type: Boolean, default: true },
  loginMethods: [{ type: String }],
  otp: { type: String },
  otpExpiry: { type: Date },
  isVerified: { type: Boolean, default: false },
  userType: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
    required: true,
  },
  subscriptionType: { type: String, ref: Collections.MEMBERSHIPS },
});

// Add index to ensure either email or phone is present
userSchema.index(
  {
    email: 1,
    phoneNumber: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      $or: [{ email: { $exists: true } }, { phoneNumber: { $exists: true } }],
    },
  },
);

const userSettingsSchema = new mongoose.Schema<IUserSettings>({
  userId: { type: String, required: true, unique: true },
  settings: {
    submitKey: { type: String, default: "Enter" },
    avatar: { type: String, default: "1f603" },
    fontSize: { type: Number, default: 14 },
    fontFamily: { type: String, default: "" },
    theme: { type: String, default: "auto" },
    tightBorder: { type: Boolean, default: false },
    sendPreviewBubble: { type: Boolean, default: true },
    enableAutoGenerateTitle: { type: Boolean, default: true },
    sidebarWidth: { type: Number, default: 300 },
    enableArtifacts: { type: Boolean, default: true },
    enableCodeFold: { type: Boolean, default: true },
    disablePromptHint: { type: Boolean, default: false },
    dontShowMaskSplashScreen: { type: Boolean, default: false },
    hideBuiltinMasks: { type: Boolean, default: false },
    ttsConfig: {
      enable: { type: Boolean, default: false },
      autoplay: { type: Boolean, default: false },
      engine: { type: String, default: "openai" },
      model: { type: String, default: "tts-1" },
      voice: { type: String, default: "alloy" },
      speed: { type: Number, default: 1.0 },
    },
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Create indexes
userSettingsSchema.index({ userId: 1 }, { unique: true });

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
    template: { type: String },
    historyMessageCount: { type: Number, default: 4 },
    sendMemory: { type: Boolean, default: true },
    compressModel: { type: String },
    compressProviderName: { type: String },
  },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const membershipSchema = new mongoose.Schema<IMembership>({
  membershipId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  features: [{ type: String }],
  maxTokens: { type: Number, required: true },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Add index for membershipId
membershipSchema.index({ membershipId: 1 }, { unique: true });

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
    default: "active",
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Create and export the models
export const User =
  mongoose.models.User || mongoose.model(Collections.USERS, userSchema);
export const UserSettings =
  mongoose.models.UserSettings ||
  mongoose.model(Collections.USER_SETTINGS, userSettingsSchema);
export const AIModel =
  mongoose.models.AIModel ||
  mongoose.model(Collections.AI_MODELS, aiModelSchema);
export const Membership =
  mongoose.models.Membership ||
  mongoose.model(Collections.MEMBERSHIPS, membershipSchema);
export const ChatLog =
  mongoose.models.ChatLog ||
  mongoose.model(Collections.CHAT_LOGS, chatLogSchema);
export const UserSubscription =
  mongoose.models.UserSubscription ||
  mongoose.model(Collections.USER_SUBSCRIPTIONS, userSubscriptionSchema);

// Export types
export type IUser_models = mongoose.InferSchemaType<typeof userSchema>;
export type IUserSettings_models = mongoose.InferSchemaType<
  typeof userSettingsSchema
>;
export type IAIModel_models = mongoose.InferSchemaType<typeof aiModelSchema>;
export type IMembership_models = mongoose.InferSchemaType<
  typeof membershipSchema
>;
export type IChatLog_models = mongoose.InferSchemaType<typeof chatLogSchema>;
export type IUserSubscription_models = mongoose.InferSchemaType<
  typeof userSubscriptionSchema
>;
