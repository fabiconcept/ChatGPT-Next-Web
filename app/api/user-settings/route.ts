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
  if (payload.ttsConfig) {
    const { speed } = payload.ttsConfig;
    if (speed !== undefined && (speed < 0.5 || speed > 2.0)) {
      return "TTS speed must be between 0.5 and 2.0";
    }
  }

  return null;
}

// Get default settings for a user
function getDefaultSettings(userId: string): Partial<IUserSettings> {
  return {
    userId,
    ...DEFAULT_USER_SETTINGS,
  };
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
      // Create new settings with defaults
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
    console.error("[GET] Error handling user settings:", error);
    return createResponse({
      error: "Internal server error while fetching user settings",
      status: 500,
    });
  }
}

export async function PUT(req: NextRequest) {
  console.log("[API] Starting PUT /api/user-settings");

  try {
    // Get userId from header
    const userId = req.headers.get("user-id");
    if (!userId) {
      console.error("[API] Missing user-id in headers");
      return createResponse({
        error: "User ID is required in headers",
        status: 400,
      });
    }

    const payload = await req.json();
    console.log("[API] Received payload:", payload);

    // Ensure userId is in the payload
    const settingsPayload = {
      ...payload,
      userId,
    };

    const validationError = validateSettingsPayload(settingsPayload);
    if (validationError) {
      console.error("[API] Validation error:", validationError);
      return createResponse({ error: validationError, status: 400 });
    }

    await connectMongoDB();
    console.log("[API] MongoDB connected");

    console.log("[API] Looking up settings for userId:", userId);

    let settings = await UserSettings.findOne({ userId });
    console.log("[API] Existing settings found:", settings ? "yes" : "no");

    if (!settings) {
      console.log("[API] Creating new settings with defaults");
      settings = new UserSettings({
        ...DEFAULT_USER_SETTINGS,
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // Update fields while preserving userId
    console.log("[API] Updating settings fields");
    Object.assign(settings, {
      ...settingsPayload,
      userId, // Ensure userId is preserved
      updatedAt: new Date(),
    });

    console.log("[API] Settings before save:", {
      settingsObj: settings.toObject(),
      updatedAtType: typeof settings.updatedAt,
      updatedAtValue: settings.updatedAt,
    });

    await settings.save();
    console.log("[API] Settings saved successfully");

    return createResponse({
      data: settings.toObject(),
      status: 200,
    });
  } catch (error: any) {
    console.error("[PUT] Error handling user settings:", error);

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
