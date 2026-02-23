import { useEffect, useState } from "react";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const useEmailAvailability = (
  email,
  isActive,
  checkEmailAvailability,
) => {
  const [emailAvailability, setEmailAvailability] = useState({
    status: "idle",
    message: "",
  });

  useEffect(() => {
    if (!isActive) {
      setEmailAvailability({ status: "idle", message: "" });
      return;
    }

    const normalized = String(email || "")
      .trim()
      .toLowerCase();

    if (!normalized) {
      setEmailAvailability({ status: "idle", message: "" });
      return;
    }

    if (!EMAIL_REGEX.test(normalized)) {
      setEmailAvailability({
        status: "invalid",
        message: "Enter a valid email address",
      });
      return;
    }

    let cancelled = false;
    setEmailAvailability({ status: "checking", message: "Checking email..." });

    const timer = setTimeout(async () => {
      const result = await checkEmailAvailability(normalized);
      if (cancelled) return;

      if (result.available === true) {
        setEmailAvailability({
          status: "available",
          message: result.message || "Email is available",
        });
      } else if (result.available === false) {
        setEmailAvailability({
          status: "unavailable",
          message: result.message || "Email is already in use",
        });
      } else {
        setEmailAvailability({
          status: "error",
          message: result.message || "Failed to check email",
        });
      }
    }, 450);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [email, isActive, checkEmailAvailability]);

  return emailAvailability;
};
