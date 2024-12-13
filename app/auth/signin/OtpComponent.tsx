import React, { useContext, useRef, useState } from "react";
import "./OtpComponent.scss";
import { OtpContext } from "../components/SignInForm";

const OtpInput: React.FC = () => {
  const { setOtp: setAutoOtp, otpSent, loading } = useContext(OtpContext);
  const length = 6;

  // Define isValidOtp state
  const [isValidOtp, setIsValidOtp] = useState<boolean>(false);

  const onChange = (value: string) => {
    setAutoOtp(value);
  };

  const checkAndSetOtp = () => {
    const otpValues = autoNavigationInputs.current.map((input) => input.value);
    const otp = otpValues.join("");

    // Check if the OTP is complete (length should be equal to `length`)
    if (otp.length === length && /^[0-9]+$/.test(otp)) {
      setAutoOtp(otp); // Set the OTP in the context
      setIsValidOtp(true); // Set isValidOtp to true
    } else {
      setIsValidOtp(false); // Set isValidOtp to false if OTP is invalid
    }
  };

  const autoNavigationInputs = useRef<HTMLInputElement[]>([]); // Specify the type for the ref

  const handleAutoNavigationInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number,
  ) => {
    if (!otpSent) return;
    const { value } = e.target;

    const newOtp = [
      ...autoNavigationInputs.current.map((input) => input.value),
    ];

    if (/^[0-9]$/.test(value)) {
      newOtp[index] = value;

      onChange(newOtp.join(""));
      checkAndSetOtp(); // Check if the OTP is valid

      if (index < length - 1) {
        autoNavigationInputs.current[index + 1].focus();
      }
    } else if (value === "") {
      newOtp[index] = "";

      onChange(newOtp.join(""));
      checkAndSetOtp(); // Check again after clearing
    } else {
      e.target.value = value.slice(0, 1);
    }
  };

  const handleAutoNavigationKeydown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number,
  ) => {
    if (!otpSent) return;
    if (
      e.key === "Backspace" &&
      !autoNavigationInputs.current[index].value &&
      index > 0
    ) {
      autoNavigationInputs.current[index - 1].focus();
    }
  };

  return (
    <div
      className={`otp ${otpSent && !loading ? "otp-sent" : ""} ${
        isValidOtp ? "otp-valid" : ""
      }`}
    >
      {Array.from({ length }).map((_, index) => (
        <input
          key={index}
          ref={(el) => {
            if (el) {
              autoNavigationInputs.current[index] = el;
            }
          }}
          className="p-3 text-center border border-[#bcbcbc] rounded-md outline-none focus:border-primary"
          placeholder="0"
          maxLength={1}
          onChange={(e) => handleAutoNavigationInputChange(e, index)}
          onKeyDown={(e) => handleAutoNavigationKeydown(e, index)}
          type="number"
        />
      ))}
    </div>
  );
};

export default OtpInput;
