"use client";
import React, { useState } from "react";
import { signIn } from "next-auth/react";
import OtpInput from "../signin/OtpComponent";

export const OtpContext = React.createContext<{
  otp: string;
  setOtp: React.Dispatch<React.SetStateAction<string>>;
  otpSent: boolean;
  loading: boolean;
}>({
  otp: "",
  setOtp: () => {},
  otpSent: false,
  loading: false,
});

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
      setLoading(false);
    }
  };

  return (
    <OtpContext.Provider value={{ otp, setOtp, otpSent, loading }}>
      {error && <div className="errorText">{error}</div>}

      <form
        className="bentoForm"
        onSubmit={otpSent ? handleVerifyOTP : handleSendOTP}
      >
        <input
          id="identifier"
          type="text"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          className={`inputField emailField ${
            otpSent || loading ? "locked" : ""
          }`}
          placeholder="Enter email or phone number"
          required
        />

        <OtpInput />

        <button type="submit" disabled={loading} className="btnField">
          {loading ? "Loading..." : otpSent ? "Verify OTP" : "Send OTP"}
        </button>

        {otpSent && !loading && (
          <span role="button" onClick={() => setOtpSent(false)}>
            Change Email/Phone
          </span>
        )}
      </form>
    </OtpContext.Provider>
  );
}
