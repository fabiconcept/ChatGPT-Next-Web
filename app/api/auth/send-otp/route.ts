import { NextRequest, NextResponse } from "next/server";
import { User } from "@/app/database/models";
import { generateOTP, sendEmailOTP, sendSMSOTP } from "@/app/auth/otp";
import { connectMongoDB } from "@/app/database/mongodb";

// Debug logger function
const debug = {
  log: (...args: any[]) =>
    console.log(" [DEBUG]", new Date().toISOString(), ...args),
  error: (...args: any[]) =>
    console.error(" [ERROR]", new Date().toISOString(), ...args),
  warn: (...args: any[]) =>
    console.warn(" [WARN]", new Date().toISOString(), ...args),
  info: (...args: any[]) =>
    console.info(" [INFO]", new Date().toISOString(), ...args),
};

export async function POST(req: NextRequest) {
  const requestId = Math.random().toString(36).substring(7);
  debug.info(`[${requestId}]  New OTP request received`);

  try {
    // Ensure MongoDB connection is established
    debug.log(`[${requestId}] Ensuring MongoDB connection...`);
    await connectMongoDB();
    debug.info(`[${requestId}] MongoDB connection confirmed`);

    debug.log(`[${requestId}] Parsing request body...`);
    const { identifier } = await req.json();
    debug.info(
      `[${requestId}] Identifier received:`,
      identifier ? identifier.substring(0, 3) + "***" : "undefined",
    );

    if (!identifier) {
      debug.warn(`[${requestId}] Missing identifier in request`);
      return NextResponse.json(
        { error: "Email or phone number is required" },
        { status: 400 },
      );
    }

    const isEmail = identifier.includes("@");
    debug.info(
      `[${requestId}] Authentication type: ${isEmail ? "EMAIL" : "PHONE"}`,
    );

    const query = isEmail ? { email: identifier } : { phoneNumber: identifier };
    debug.log(`[${requestId}] Database query:`, JSON.stringify(query));

    // Find or create user
    debug.log(`[${requestId}] Searching for existing user...`);
    let user = await User.findOne(query);

    if (!user) {
      debug.info(`[${requestId}] User not found, creating new user...`);
      try {
        user = await User.create({
          ...query,
          loginMethods: [isEmail ? "email" : "phone"],
          isActive: true,
          createdAt: new Date(),
        });
        debug.info(
          `[${requestId}] New user created successfully with ID: ${user._id}`,
        );
      } catch (createError) {
        debug.error(`[${requestId}] Failed to create user:`, createError);
        throw createError;
      }
    } else {
      debug.info(`[${requestId}] Existing user found with ID: ${user._id}`);
    }

    // Generate and save OTP
    debug.log(`[${requestId}] Generating new OTP...`);
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    debug.info(
      `[${requestId}] OTP generated, expires at: ${otpExpiry.toISOString()}`,
    );

    try {
      user.otp = otp;
      user.otpExpiry = otpExpiry;
      await user.save();
      debug.info(`[${requestId}] OTP saved to user record`);
    } catch (saveError) {
      debug.error(
        `[${requestId}] Failed to save OTP to user record:`,
        saveError,
      );
      throw saveError;
    }

    // Send OTP
    debug.log(`[${requestId}] Attempting to send OTP...`);
    try {
      const sent = isEmail
        ? await sendEmailOTP(identifier, otp)
        : await sendSMSOTP(identifier, otp);

      debug.info(
        `[${requestId}] OTP sent successfully via ${isEmail ? "email" : "SMS"}`,
      );

      return NextResponse.json(
        { message: "OTP sent successfully" },
        { status: 200 },
      );
    } catch (sendError) {
      debug.error(`[${requestId}] Failed to send OTP:`, sendError);
      throw sendError;
    }
  } catch (error) {
    debug.error(`[${requestId}] Unhandled error in OTP route:`, error);

    // Detailed error response
    const errorResponse = {
      error: error instanceof Error ? error.message : "Unknown error occurred",
      timestamp: new Date().toISOString(),
      requestId: requestId,
      details:
        error instanceof Error
          ? {
              name: error.name,
              stack:
                process.env.NODE_ENV === "development"
                  ? error.stack
                  : undefined,
            }
          : undefined,
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}
