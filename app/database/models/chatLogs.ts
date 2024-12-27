import mongoose from "mongoose";
import { Collections } from "../types";

// Create a debug version of ChatLog model
const chatLogSchema = new mongoose.Schema(
  {
    chatId: { type: String, required: true, unique: true },
    userId: { type: String, required: true },
    modelId: { type: String, required: true },
    topic: { type: String, required: true },
    messages: [
      {
        id: { type: String, required: true },
        role: {
          type: String,
          enum: ["user", "assistant", "system"],
          required: true,
        },
        content: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        isError: { type: Boolean },
        tools: [
          {
            id: { type: String, required: true },
            index: { type: Number },
            type: { type: String },
            function: {
              name: { type: String },
              arguments: { type: String },
            },
            content: { type: String },
            isError: { type: Boolean },
            errorMsg: { type: String },
          },
        ],
        audio_url: { type: String },
      },
    ],
    tokenUsage: {
      promptTokens: { type: Number, default: 0 },
      completionTokens: { type: Number, default: 0 },
      totalTokens: { type: Number, default: 0 },
    },
    cost: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
  },
  {
    collection: Collections.CHAT_LOGS,
    toJSON: {
      getters: true,
      virtuals: true,
    },
    toObject: {
      getters: true,
      virtuals: true,
    },
  },
);

// Add indexes for better query performance
chatLogSchema.index({ chatId: 1 }, { unique: true });
chatLogSchema.index({ userId: 1, createdAt: -1 });

// Create the debug model
export const DebugChatLog =
  mongoose.models.ChatLog ||
  mongoose.model("ChatLog", chatLogSchema, Collections.CHAT_LOGS);
