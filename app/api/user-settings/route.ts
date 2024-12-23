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
  const requiredFields = ["userId"];
  const missingFields = requiredFields.filter((field) => !(field in payload));

  if (missingFields.length > 0) {
    return `Missing required fields: ${missingFields.join(", ")}`;
  }

  // Validate TTS config if present
  if (payload.settings?.ttsConfig) {
    const { speed } = payload.settings.ttsConfig;
    if (speed !== undefined && (speed < 0.5 || speed > 2.0)) {
      return "TTS speed must be between 0.5 and 2.0";
    }
  }

  return null;
}

// Get default settings for a user
function getDefaultSettings(userId: string): Partial<IUserSettings> {
  const settings = {
    userId,
    ...DEFAULT_USER_SETTINGS,
  };
  return settings;
}

export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get("user-id");

    if (!userId) {
      return createResponse({
        error: "User ID is required in headers",
        status: 400,
      });
    }

    await connectMongoDB();

    // Find user settings
    const userSettings = await UserSettings.findOne({ userId });

    if (!userSettings) {
      const defaultSettings = getDefaultSettings(userId);
      const newSettings = await UserSettings.create(defaultSettings);
      return createResponse({
        data: newSettings,
        status: 201,
      });
    }

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
  try {
    const userId = req.headers.get("user-id");

    if (!userId) {
      return createResponse({
        error: "User ID is required in headers",
        status: 400,
      });
    }

    const payload = await req.json();

    const settingsPayload = {
      ...payload,
      userId,
    };

    const validationError = validateSettingsPayload(settingsPayload);
    if (validationError) {
      return createResponse({ error: validationError, status: 400 });
    }

    await connectMongoDB();

    let settings = await UserSettings.findOne({ userId });

    if (!settings) {
      settings = new UserSettings({
        ...DEFAULT_USER_SETTINGS,
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    Object.assign(settings, {
      ...settingsPayload,
      userId,
      updatedAt: new Date(),
    });

    await settings.save();

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
