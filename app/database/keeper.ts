const userSettingsSchema = new mongoose.Schema<IUserSettings>({
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

import mongoose from "mongoose";
import { DEFAULT_CONFIG } from "../store/config";

// Define the schema for user settings
const userSettingsSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
  },
  modelConfig: {
    model: {
      type: String,
      default: DEFAULT_CONFIG.modelConfig.model,
    },
    temperature: {
      type: Number,
      default: DEFAULT_CONFIG.modelConfig.temperature,
    },
    max_tokens: {
      type: Number,
      default: DEFAULT_CONFIG.modelConfig.max_tokens,
    },
    presence_penalty: {
      type: Number,
      default: DEFAULT_CONFIG.modelConfig.presence_penalty,
    },
    frequency_penalty: {
      type: Number,
      default: DEFAULT_CONFIG.modelConfig.frequency_penalty,
    },
    sendMemory: {
      type: Boolean,
      default: DEFAULT_CONFIG.modelConfig.sendMemory,
    },
    historyMessageCount: {
      type: Number,
      default: DEFAULT_CONFIG.modelConfig.historyMessageCount,
    },
    compressMessageLengthThreshold: {
      type: Number,
      default: DEFAULT_CONFIG.modelConfig.compressMessageLengthThreshold,
    },
    template: {
      type: String,
      default: DEFAULT_CONFIG.modelConfig.template,
    },
    enableInjectSystemPrompts: {
      type: Boolean,
      default: DEFAULT_CONFIG.modelConfig.enableInjectSystemPrompts,
    },
    providerName: {
      type: String,
      default: DEFAULT_CONFIG.modelConfig.providerName,
    },
  },
  customModels: {
    type: String,
    default: DEFAULT_CONFIG.customModels,
  },
  lastUpdate: {
    type: Date,
    default: Date.now,
  },
  enableAutoGenerateTitle: {
    type: Boolean,
    default: DEFAULT_CONFIG.enableAutoGenerateTitle,
  },
  dontShowMaskSplashScreen: {
    type: Boolean,
    default: DEFAULT_CONFIG.dontShowMaskSplashScreen,
  },
  hideBuiltinMasks: {
    type: Boolean,
    default: DEFAULT_CONFIG.hideBuiltinMasks,
  },
});

// Add a pre-save middleware to update lastUpdate
userSettingsSchema.pre("save", function (next) {
  this.lastUpdate = new Date();
  next();
});

// Create and export the model
export const UserSettings =
  mongoose.models.UserSettings ||
  mongoose.model("UserSettings", userSettingsSchema);

export type IUserSettings = mongoose.InferSchemaType<typeof userSettingsSchema>;
