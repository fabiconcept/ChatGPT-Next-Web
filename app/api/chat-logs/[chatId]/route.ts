import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/app/database/config";
import { DebugChatLog } from "@/app/database/models/chatLogs";

// GET /api/chat-logs/[chatId]
export async function GET(
  req: NextRequest,
  { params }: { params: { chatId: string } },
) {
  console.log(`[API] GET /api/chat-logs/${params.chatId} - Starting request`);
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

    const chatLog = await DebugChatLog.findOne({
      chatId: params.chatId,
      userId,
    });

    console.log("[API] Got chatId:", params.chatId);
    console.log("[API] Got chat log:", chatLog);

    if (!chatLog) {
      return NextResponse.json(
        { error: "Chat log not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(chatLog);
  } catch (error) {
    console.error("[API] Error getting chat log:", error);
    return NextResponse.json(
      { error: "Failed to get chat log" },
      { status: 500 },
    );
  }
}

// PATCH /api/chat-logs/[chatId]
export async function PATCH(
  req: NextRequest,
  { params }: { params: { chatId: string } },
) {
  console.log(`[API] PATCH /api/chat-logs/${params.chatId} - Starting request`);
  try {
    const userId = req.headers.get("user-id");
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized: No user ID provided" },
        { status: 401 },
      );
    }

    const { chatId } = params;
    const body = await req.json();

    await connectDB();
    console.log("[API] Database connected successfully");

    const chatLog = await DebugChatLog.findOneAndUpdate(
      { chatId, userId },
      { ...body },
      { new: true },
    );

    if (!chatLog) {
      return NextResponse.json(
        { error: "Chat log not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(chatLog);
  } catch (error) {
    console.error("[API] Error updating chat log:", error);
    return NextResponse.json(
      { error: "Failed to update chat log" },
      { status: 500 },
    );
  }
}

// DELETE /api/chat-logs/[chatId]
export async function DELETE(
  req: NextRequest,
  { params }: { params: { chatId: string } },
) {
  console.log("[API] DELETE /api/chat-logs/[chatId] - Starting request");
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

    const result = await DebugChatLog.deleteOne({
      chatId: params.chatId,
      userId,
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "Chat log not found" },
        { status: 404 },
      );
    }

    console.log(`[API] Chat log ${params.chatId} deleted for user ${userId}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] Error deleting chat log:", error);
    return NextResponse.json(
      { error: "Failed to delete chat log" },
      { status: 500 },
    );
  }
}
