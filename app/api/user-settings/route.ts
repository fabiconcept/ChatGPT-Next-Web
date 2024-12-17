import { NextRequest, NextResponse } from "next/server";
import { connectMongoDB } from "@/app/database/mongodb";
import { UserSettings } from "@/app/database/models";
import { IUserSettings } from "@/app/database/types";
import { DEFAULT_USER_SETTINGS } from "@/app/config/defaults";

// Type for the response
interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

// Helper function to create API responses
function createResponse<T>({ data, error, status }: ApiResponse<T>) {
  return NextResponse.json(
    { data, error, timestamp: new Date().toISOString() },
    { status },
  );
}

// Helper function for consistent logging
function logDebug(context: string, message: string, data?: any) {
  console.log(
    `[UserSettings:${context}] ${message}`,
    data ? JSON.stringify(data, null, 2) : "",
  );
}

function logError(context: string, message: string, error: any) {
  console.error(`[UserSettings:${context}] ${message}`, error);
  if (error?.stack) {
    console.error(`[UserSettings:${context}] Stack trace:`, error.stack);
  }
}

// Validate user settings update payload
function validateSettingsPayload(
  payload: Partial<IUserSettings>,
): string | null {
  logDebug("validate", "Starting payload validation", payload);

  const requiredFields = ["userId"];
  const missingFields = requiredFields.filter((field) => !(field in payload));

  if (missingFields.length > 0) {
    logDebug("validate", "Missing required fields", { missingFields });
    return `Missing required fields: ${missingFields.join(", ")}`;
  }

  // Validate TTS config if present
  if (payload.settings?.ttsConfig) {
    logDebug("validate", "Validating TTS config", payload.settings.ttsConfig);
    const { speed } = payload.settings.ttsConfig;
    if (speed !== undefined && (speed < 0.5 || speed > 2.0)) {
      logDebug("validate", "Invalid TTS speed", { speed });
      return "TTS speed must be between 0.5 and 2.0";
    }
  }

  logDebug("validate", "Validation successful");
  return null;
}

// Get default settings for a user
function getDefaultSettings(userId: string): Partial<IUserSettings> {
  logDebug("defaults", "Creating default settings", { userId });
  const settings = {
    userId,
    ...DEFAULT_USER_SETTINGS,
  };
  logDebug("defaults", "Default settings created", settings);
  return settings;
}

export async function GET(req: NextRequest) {
  logDebug("GET", "Starting GET request");
  try {
    const userId = req.headers.get("user-id");
    logDebug("GET", "Extracted user ID from headers", { userId });

    if (!userId) {
      logDebug("GET", "Missing user ID in headers");
      return createResponse({
        error: "User ID is required in headers",
        status: 400,
      });
    }

    logDebug("GET", "Connecting to MongoDB");
    await connectMongoDB();
    logDebug("GET", "MongoDB connection established");

    // Find user settings
    logDebug("GET", "Searching for user settings", { userId });
    const userSettings = await UserSettings.findOne({ userId });
    logDebug("GET", "User settings search result", { found: !!userSettings });

    if (!userSettings) {
      logDebug("GET", "No existing settings found, creating defaults");
      const defaultSettings = getDefaultSettings(userId);
      const newSettings = await UserSettings.create(defaultSettings);
      logDebug("GET", "Created new settings", newSettings);
      return createResponse({
        data: newSettings,
        status: 201,
      });
    }

    logDebug("GET", "Returning existing settings");
    return createResponse({
      data: userSettings,
      status: 200,
    });
  } catch (error: any) {
    logError("GET", "Error handling user settings:", error);
    return createResponse({
      error: "Internal server error while fetching user settings",
      status: 500,
    });
  }
}

export async function PUT(req: NextRequest) {
  logDebug("PUT", "Starting PUT request");

  try {
    const userId = req.headers.get("user-id");
    logDebug("PUT", "Extracted user ID from headers", { userId });

    if (!userId) {
      logDebug("PUT", "Missing user ID in headers");
      return createResponse({
        error: "User ID is required in headers",
        status: 400,
      });
    }

    const payload = await req.json();
    logDebug("PUT", "Received request payload", payload);

    const settingsPayload = {
      ...payload,
      userId,
    };
    logDebug("PUT", "Prepared settings payload", settingsPayload);

    const validationError = validateSettingsPayload(settingsPayload);
    if (validationError) {
      logDebug("PUT", "Validation failed", { error: validationError });
      return createResponse({ error: validationError, status: 400 });
    }

    logDebug("PUT", "Connecting to MongoDB");
    await connectMongoDB();
    logDebug("PUT", "MongoDB connection established");

    logDebug("PUT", "Looking up existing settings", { userId });
    let settings = await UserSettings.findOne({ userId });
    logDebug("PUT", "Existing settings lookup result", { found: !!settings });

    if (!settings) {
      logDebug("PUT", "Creating new settings with defaults");
      settings = new UserSettings({
        ...DEFAULT_USER_SETTINGS,
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      logDebug("PUT", "New settings instance created", settings);
    }

    logDebug("PUT", "Current settings before update", settings);
    Object.assign(settings, {
      ...settingsPayload,
      userId,
      updatedAt: new Date(),
    });
    logDebug("PUT", "Settings after update, before save", settings);

    await settings.save();
    logDebug("PUT", "Settings saved successfully", settings);

    return createResponse({
      data: settings.toObject(),
      status: 200,
    });
  } catch (error: any) {
    logError("PUT", "Error handling settings update:", error);

    if (error.name === "ValidationError") {
      return createResponse({
        error: "Invalid settings data provided",
        status: 400,
      });
    }

    return createResponse({
      error: "Internal server error while updating user settings",
      status: 500,
    });
  }
}
