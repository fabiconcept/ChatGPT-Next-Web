import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/app/database/config";
import { ChatLog } from "@/app/database/models";

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

    // Get chat logs for the user
    const chatLogs = await ChatLog.find({ userId })
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit);

    // Get total count for pagination
    const total = await ChatLog.countDocuments({ userId });

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

    const chatLog = new ChatLog({
      ...body,
      userId,
      createdAt: new Date(),
    });

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

// DELETE /api/chat-logs
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

    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Missing chat log ID" },
        { status: 400 },
      );
    }

    console.log("[API] Attempting database connection...");
    await connectDB();
    console.log("[API] Database connected successfully");

    const result = await ChatLog.deleteOne({ _id: id, userId });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "Chat log not found or unauthorized" },
        { status: 404 },
      );
    }

    console.log(`[API] Chat log ${id} deleted successfully for user ${userId}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] Error deleting chat log:", error);
    return NextResponse.json(
      { error: "Failed to delete chat log" },
      { status: 500 },
    );
  }
}
