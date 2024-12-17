"use strict";
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserSubscription =
  exports.ChatLog =
  exports.Membership =
  exports.AIModel =
  exports.UserSettings =
  exports.User =
    void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const userSchema = new mongoose_1.default.Schema({
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
});
// Add pre-save middleware to ensure userId is set
userSchema.pre("save", function (next) {
  if (!this.userId) {
    this.userId = `user_${Math.random()
      .toString(36)
      .substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
  }
  next();
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
const userSettingsSchema = new mongoose_1.default.Schema({
  userId: { type: String, required: true, unique: true },
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
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});
// Create indexes
userSettingsSchema.index({ userId: 1 }, { unique: true });
const aiModelSchema = new mongoose_1.default.Schema({
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
const membershipSchema = new mongoose_1.default.Schema({
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  features: [{ type: String }],
  maxTokens: { type: Number, required: true },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});
const chatLogSchema = new mongoose_1.default.Schema({
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
const userSubscriptionSchema = new mongoose_1.default.Schema({
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
exports.User =
  mongoose_1.default.models.User ||
  mongoose_1.default.model("User", userSchema);
exports.UserSettings =
  mongoose_1.default.models.UserSettings ||
  mongoose_1.default.model("UserSettings", userSettingsSchema);
exports.AIModel =
  mongoose_1.default.models.AIModel ||
  mongoose_1.default.model("AIModel", aiModelSchema);
exports.Membership =
  mongoose_1.default.models.Membership ||
  mongoose_1.default.model("Membership", membershipSchema);
exports.ChatLog =
  mongoose_1.default.models.ChatLog ||
  mongoose_1.default.model("ChatLog", chatLogSchema);
exports.UserSubscription =
  mongoose_1.default.models.UserSubscription ||
  mongoose_1.default.model("UserSubscription", userSubscriptionSchema);
