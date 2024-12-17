import { NextRequest, NextResponse } from "next/server";
import { User } from "@/app/database/models";
import { generateOTP, sendEmailOTP, sendSMSOTP } from "@/app/auth/otp";
import { connectMongoDB } from "@/app/database/mongodb";

export async function POST(req: NextRequest) {
  try {
    await connectMongoDB();
    const { identifier } = await req.json();

    if (!identifier) {
      return NextResponse.json(
        { error: "Email or phone number is required" },
        { status: 400 },
      );
    }

    const isEmail = identifier.includes("@");
    const query = isEmail ? { email: identifier } : { phoneNumber: identifier };
    let user = await User.findOne(query);

    if (!user) {
      const userId = `user_${Math.random()
        .toString(36)
        .substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
      user = await User.create({
        userId,
        ...query,
        loginMethods: [isEmail ? "email" : "phone"],
        isActive: true,
        createdAt: new Date(),
      });
    } else if (!user.userId) {
      const userId = `user_${Math.random()
        .toString(36)
        .substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
      user.userId = userId;
      await user.save();
    }

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save();

    if (isEmail) {
      await sendEmailOTP(identifier, otp);
    } else {
      await sendSMSOTP(identifier, otp);
    }

    return NextResponse.json({ message: "OTP sent successfully" });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 },
    );
  }
}
