import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/app/database/config";
import { nanoid } from "nanoid";
import { DebugChatLog } from "@/app/database/models/chatLogs";

// GET /api/chat-logs
export async function GET(req: NextRequest) {
  console.log("[API] GET /api/chat-logs - Starting request");
  try {
    const userId = req.headers.get("user-id");
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized: No user ID provided" },
        { status: 401 },
      );
    }

    console.log("[API] Attempting database connection...");
    await connectDB();
    console.log("[API] Database connected successfully");

    // Get query parameters
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const offset = parseInt(url.searchParams.get("offset") || "0");

    console.log("[API] Model Info:", {
      modelName: DebugChatLog.modelName,
      type: typeof DebugChatLog,
      collectionName: DebugChatLog.collection.name,
      schema: {
        paths: Object.keys(DebugChatLog.schema.paths),
        definition: DebugChatLog.schema.obj,
      },
      db: DebugChatLog.db.name,
    });

    // Get chat logs for the user
    let chatLogs = await DebugChatLog.find({ userId })
      .select("chatId userId modelId messages tokenUsage cost createdAt")
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit);

    // If no chat logs exist, create a default one
    if (chatLogs.length === 0 && offset === 0) {
      console.log("[API] No chat logs found, creating default chat log");
      const chatId = nanoid();
      console.log("[API] Generated chatId:", chatId);

      const defaultChatLog = new DebugChatLog({
        chatId,
        userId,
        modelId: "gpt-3.5-turbo", // Default model
        messages: [],
        tokenUsage: {
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
        },
        cost: 0,
        createdAt: new Date(),
      });

      console.log(
        "[API] Default chat log:",
        JSON.stringify(defaultChatLog.toJSON(), null, 2),
      );

      console.log(
        "[API] Default chat log before save:",
        JSON.stringify(defaultChatLog.toJSON(), null, 2),
      );

      // Ensure chatId exists
      if (!defaultChatLog.chatId) {
        defaultChatLog.chatId = chatId;
      }

      console.log(
        "[API] Default chat log after save:",
        JSON.stringify(defaultChatLog.toJSON(), null, 2),
      );

      const savedChatLog = await defaultChatLog.save();
      console.log(
        "[API] Saved chat log:",
        JSON.stringify(savedChatLog.toJSON(), null, 2),
      );
      chatLogs = [savedChatLog];
    }

    // Get total count for pagination
    const total = await DebugChatLog.countDocuments({ userId });

    console.log(`[API] Found ${chatLogs.length} chat logs for user ${userId}`);

    return NextResponse.json({
      chatLogs,
      pagination: {
        total,
        offset,
        limit,
      },
    });
  } catch (error) {
    console.error("[API] Error getting chat logs:", error);
    return NextResponse.json(
      { error: "Failed to get chat logs" },
      { status: 500 },
    );
  }
}

// POST /api/chat-logs
export async function POST(req: NextRequest) {
  console.log("[API] POST /api/chat-logs - Starting request");
  try {
    const userId = req.headers.get("user-id");
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized: No user ID provided" },
        { status: 401 },
      );
    }

    const body = await req.json();

    console.log("[API] Attempting database connection...");
    await connectDB();
    console.log("[API] Database connected successfully");

    console.log("Payload:", JSON.stringify(body, null, 2));

    const chatLog = new DebugChatLog({
      ...body,
      chatId: body.chatId || nanoid(), // Use the frontend's id as chatId, or generate new one
      userId,
      createdAt: new Date(),
    });

    console.log(
      "[API] Chat log before save:",
      JSON.stringify(chatLog.toJSON(), null, 2),
    );

    // Remove id field if it exists in body
    if (chatLog.id) {
      delete chatLog.id;
    }

    await chatLog.save();
    console.log(`[API] Chat log saved successfully for user ${userId}`);

    return NextResponse.json(chatLog);
  } catch (error) {
    console.error("[API] Error saving chat log:", error);
    return NextResponse.json(
      { error: "Failed to save chat log" },
      { status: 500 },
    );
  }
}

// DELETE /api/chat-logs (delete all chat logs for a user)
export async function DELETE(req: NextRequest) {
  console.log("[API] DELETE /api/chat-logs - Starting request");
  try {
    const userId = req.headers.get("user-id");
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized: No user ID provided" },
        { status: 401 },
      );
    }

    console.log("[API] Attempting database connection...");
    await connectDB();
    console.log("[API] Database connected successfully");

    const result = await DebugChatLog.deleteMany({ userId });
    console.log(
      `[API] Deleted ${result.deletedCount} chat logs for user ${userId}`,
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] Error deleting chat logs:", error);
    return NextResponse.json(
      { error: "Failed to delete chat logs" },
      { status: 500 },
    );
  }
}
