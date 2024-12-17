import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { Collections, IAIModel } from "@/app/database/types";
import { connectDB } from "@/app/database/config";

const AIModel =
  mongoose.models[Collections.AI_MODELS] ||
  mongoose.model<IAIModel>(
    Collections.AI_MODELS,
    new mongoose.Schema<IAIModel>({
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
    }),
  );

// GET /api/configurations
export async function GET() {
  console.log("[API] GET /api/configurations - Starting request");
  try {
    console.log("[API] Attempting database connection...");
    await connectDB();
    console.log("[API] Database connected successfully");

    const configurations = await AIModel.find({ isActive: true });
    console.log("[API] Found configurations:", configurations);

    if (!configurations || configurations.length === 0) {
      console.log(
        "[API] No active configurations found, creating default configuration",
      );

      const defaultConfig = {
        modelType: "chat",
        version: "1.0",
        model: "gpt-3.5-turbo",
        providerName: "openai",
        defaultSettings: {
          temperature: 0.7,
          maxTokens: 2000,
          topP: 1,
          frequencyPenalty: 0,
          presencePenalty: 0,
          compressMessageLengthThreshold: 4000,
          enableInjectSystemPrompts: true,
          template: "",
          historyMessageCount: 10,
          sendMemory: true,
          compressModel: "gpt-3.5-turbo",
          compressProviderName: "openai",
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const newConfig = await AIModel.create(defaultConfig);
      console.log("[API] Created default configuration:", newConfig);

      return NextResponse.json([newConfig]);
    }

    return NextResponse.json(configurations);
  } catch (error) {
    console.error("[API] Error details:", {
      error,
    });

    return NextResponse.json(
      {
        error: "Failed to fetch configurations",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// POST /api/configurations
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { modelType, version, defaultSettings } = body;

    if (!modelType || !version) {
      return NextResponse.json(
        { error: "Model type and version are required" },
        { status: 400 },
      );
    }

    await connectDB();

    const configuration = new AIModel({
      modelType,
      version,
      defaultSettings: {
        temperature: 0.7,
        maxTokens: 2000,
        topP: 1,
        frequencyPenalty: 0,
        presencePenalty: 0,
        ...defaultSettings,
      },
    });

    await configuration.save();

    return NextResponse.json(configuration, { status: 201 });
  } catch (error) {
    console.error("Error creating configuration:", error);

    if (error instanceof mongoose.Error.ValidationError) {
      return NextResponse.json(
        { error: "Invalid configuration data" },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Failed to create configuration" },
      { status: 500 },
    );
  }
}

// PUT /api/configurations
export async function PUT(req: NextRequest) {
  console.log("[API] PUT /api/configurations - Starting request");
  try {
    const body = await req.json();
    console.log("[API] Request body:", body);

    const {
      modelType,
      version,
      defaultSettings,
      isActive,
      model,
      providerName,
    } = body;

    if (!modelType || !version) {
      console.log("[API] Missing required fields:", { modelType, version });
      return NextResponse.json(
        { error: "Model type and version are required" },
        { status: 400 },
      );
    }

    console.log("[API] Attempting database connection...");
    await connectDB();
    console.log("[API] Database connected successfully");

    console.log("[API] Attempting to update configuration:", {
      modelType,
      version,
      model,
      providerName,
      defaultSettings,
      isActive,
    });

    const updatedConfiguration = await AIModel.findOneAndUpdate(
      { modelType, version },
      {
        model: model || undefined,
        providerName: providerName || undefined,
        defaultSettings: defaultSettings
          ? {
              temperature: 0.7,
              maxTokens: 2000,
              topP: 1,
              frequencyPenalty: 0,
              presencePenalty: 0,
              ...defaultSettings,
            }
          : undefined,
        isActive,
        updatedAt: new Date(),
      },
      { new: true, runValidators: true },
    );

    if (!updatedConfiguration) {
      console.log("[API] Configuration not found for update");
      return NextResponse.json(
        { error: "Configuration not found" },
        { status: 404 },
      );
    }

    console.log(
      "[API] Configuration updated successfully:",
      updatedConfiguration,
    );
    return NextResponse.json(updatedConfiguration);
  } catch (error) {
    console.error("[API] Error details:", {
      error,
    });

    if (error instanceof mongoose.Error.ValidationError) {
      return NextResponse.json(
        {
          error: "Invalid configuration data",
          details: error.message,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        error: "Failed to update configuration",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
