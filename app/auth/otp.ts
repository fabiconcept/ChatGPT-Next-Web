import nodemailer from "nodemailer";
import twilio from "twilio";
import { IUser } from "../database/types";

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

const twilioClient =
  TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN
    ? twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
    : null;

const emailTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendEmailOTP(
  email: string,
  otp: string,
): Promise<boolean> {
  try {
    await emailTransporter.sendMail({
      from: process.env.SMTP_FROM,
      to: email,
      subject: "Your Login OTP",
      text: `Your OTP is: ${otp}. It will expire in 10 minutes.`,
      html: `<p>Your OTP is: <strong>${otp}</strong></p><p>It will expire in 10 minutes.</p>`,
    });
    return true;
  } catch (error) {
    console.error("Error sending email OTP:", error);
    return false;
  }
}

export async function sendSMSOTP(
  phoneNumber: string,
  otp: string,
): Promise<boolean> {
  if (!twilioClient) {
    console.error("Twilio client not configured");
    return false;
  }

  try {
    await twilioClient.messages.create({
      body: `Your OTP is: ${otp}. It will expire in 10 minutes.`,
      from: TWILIO_PHONE_NUMBER,
      to: phoneNumber,
    });
    return true;
  } catch (error) {
    console.error("Error sending SMS OTP:", error);
    return false;
  }
}

export async function verifyOTP(user: IUser, otp: string): Promise<boolean> {
  console.log("🔍 [OTP Verification] Starting verification process");
  console.log("📝 [OTP Verification] Input OTP:", otp);
  console.log("👤 [OTP Verification] User:", {
    id: user.name,
    hasOTP: !!user.otp,
    storedOTP: user.otp,
    hasExpiry: !!user.otpExpiry,
    otpExpiry: user.otpExpiry ? new Date(user.otpExpiry).toISOString() : null,
    currentTime: new Date().toISOString(),
  });

  if (!user.otp || !user.otpExpiry) {
    return false;
  }

  if (new Date() > user.otpExpiry) {
    return false;
  }

  return user.otp === otp;
}
