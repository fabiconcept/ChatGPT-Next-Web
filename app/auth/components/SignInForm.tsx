"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";

export default function SignInForm() {
  const [identifier, setIdentifier] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to send OTP");
      }

      setOtpSent(true);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        identifier,
        otp,
        redirect: false,
      });

      if (result?.error) {
        throw new Error(result.error);
      }

      window.location.href = "/"; // Redirect to home page
    } catch (error) {
      setError(error instanceof Error ? error.message : "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">
        {otpSent ? "Enter OTP" : "Sign In / Register"}
      </h2>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>
      )}

      <form onSubmit={otpSent ? handleVerifyOTP : handleSendOTP}>
        {!otpSent ? (
          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="identifier">
              Email or Phone Number
            </label>
            <input
              id="identifier"
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2"
              placeholder="Enter email or phone number"
              required
            />
          </div>
        ) : (
          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="otp">
              Enter OTP
            </label>
            <input
              id="otp"
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2"
              placeholder="Enter 6-digit OTP"
              maxLength={6}
              required
            />
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? "Loading..." : otpSent ? "Verify OTP" : "Send OTP"}
        </button>

        {otpSent && (
          <button
            type="button"
            onClick={() => setOtpSent(false)}
            className="w-full mt-4 text-blue-500 hover:text-blue-600"
          >
            Change Email/Phone
          </button>
        )}
      </form>
    </div>
  );
}
