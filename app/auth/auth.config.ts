import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import clientPromise from "../database/mongodb";
import { User } from "../database/models";
import { verifyOTP } from "./otp";
import "./types";
import type { AdapterUser } from "next-auth/adapters";
import type { IUser } from "../database/types";

export const authOptions: AuthOptions = {
  adapter: MongoDBAdapter(clientPromise),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/signin",
  },
  providers: [
    CredentialsProvider({
      name: "OTP",
      credentials: {
        identifier: { label: "Email/Phone", type: "text" },
        otp: { label: "OTP", type: "text" },
      },
      async authorize(credentials) {
        console.log("🚀 [Auth] Starting authorization process");

        if (!credentials?.identifier || !credentials?.otp) {
          console.error("❌ [Auth] Missing credentials:", {
            hasIdentifier: !!credentials?.identifier,
            hasOTP: !!credentials?.otp,
          });
          throw new Error("Invalid credentials");
        }

        console.log("📧 [Auth] Credentials received:", {
          identifier: credentials.identifier.substring(0, 3) + "***",
          otpLength: credentials.otp.length,
        });

        const isEmail = credentials.identifier.includes("@");
        console.log(
          "🔍 [Auth] Authentication type:",
          isEmail ? "EMAIL" : "PHONE",
        );

        const query = isEmail
          ? { email: credentials.identifier }
          : { phoneNumber: credentials.identifier };
        console.log("🔎 [Auth] Database query:", query);

        const user = await User.findOne(query);
        console.log("👤 [Auth] User lookup result:", {
          found: !!user,
          userId: user?._id?.toString(),
          hasEmail: !!user?.email,
          hasPhone: !!user?.phoneNumber,
        });

        if (!user) {
          console.error("❌ [Auth] User not found");
          throw new Error("User not found");
        }

        console.log("🔐 [Auth] Starting OTP verification");
        const isValid = await verifyOTP(user, credentials.otp);
        console.log("✅ [Auth] OTP verification result:", isValid);

        if (!isValid) {
          console.error("❌ [Auth] Invalid OTP");
          throw new Error("Invalid OTP");
        }

        if (user && "phoneNumber" in user) {
          const userData = {
            id: user._id.toString(),
            email: user.email,
            phoneNumber: user.phoneNumber,
            name: user.name,
          };
          console.log("✨ [Auth] Authorization successful:", {
            userId: userData.id,
            hasEmail: !!userData.email,
            hasPhone: !!userData.phoneNumber,
          });
          return userData;
        } else {
          console.error("❌ [Auth] User missing phone number");
          throw new Error("User does not have a phone number");
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        const userWithPhone = user as (AdapterUser | IUser) & {
          phoneNumber?: string;
        };
        if (userWithPhone.phoneNumber) {
          token.phoneNumber = userWithPhone.phoneNumber;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.phoneNumber = token.phoneNumber as string;
      }
      return session;
    },
  },
};
