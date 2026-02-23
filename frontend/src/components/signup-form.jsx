import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Link, useNavigate } from "react-router-dom";
import { LabledInput } from "./ui/labeled-input";
import { useEffect, useState } from "react";
import GoogleIcon from "./icons/Icons";
import { useGoogleAuth } from "@/hooks/useGoogleAuth";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?[1-9]\d{9,14}$/;

export function SignupForm({ className, ...props }) {
  const navigate = useNavigate();
  const { handleGoogleLogin } = useGoogleAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [emailStatus, setEmailStatus] = useState({
    checking: false,
    available: null,
    message: "",
  });
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
  });
  const [errors, setErrors] = useState({
    name: null,
    email: null,
    password: null,
    phone: null,
  });

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
    setErrors((prev) => ({ ...prev, [id]: null }));
    setError("");
    setSuccess("");
  };

  useEffect(() => {
    const email = formData.email.trim().toLowerCase();

    if (!email) {
      setEmailStatus({ checking: false, available: null, message: "" });
      return;
    }

    if (!EMAIL_REGEX.test(email)) {
      setEmailStatus({
        checking: false,
        available: false,
        message: "Invalid email format",
      });
      return;
    }

    setEmailStatus((prev) => ({
      ...prev,
      checking: true,
      message: "Checking email...",
    }));

    const timer = setTimeout(async () => {
      try {
        const response = await fetch(
          `${BACKEND_URL}/api/auth/check-email?email=${encodeURIComponent(email)}`,
        );
        const data = await response.json();
        setEmailStatus({
          checking: false,
          available: Boolean(data.available),
          message: data.message || "",
        });
      } catch {
        setEmailStatus({
          checking: false,
          available: null,
          message: "Could not verify email right now",
        });
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.email]);

  const validateSignupFields = () => {
    const nextErrors = {
      name: null,
      email: null,
      phone: null,
      password: null,
    };

    if (!formData.name.trim()) {
      nextErrors.name = "Name is required";
    }
    if (!EMAIL_REGEX.test(formData.email.trim().toLowerCase())) {
      nextErrors.email = "Valid email is required";
    }

    if (formData.password.length < 8) {
      nextErrors.password = "Password must be at least 8 characters";
    }

    if (!formData.phone.trim()) {
      nextErrors.phone = "Phone number is required";
    } else if (!PHONE_REGEX.test(formData.phone.trim())) {
      nextErrors.phone = "Enter a valid phone number";
    }

    if (emailStatus.available === false) {
      nextErrors.email = "Email is already in use";
    }

    const hasError = Object.values(nextErrors).some(Boolean);
    setErrors(nextErrors);
    return hasError;
  };

  const requestSignupOtp = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (validateSignupFields()) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${BACKEND_URL}/api/auth/signup/request-otp`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            name: formData.name.trim(),
            email: formData.email.trim().toLowerCase(),
            password: formData.password,
            phone: formData.phone,
          }),
        },
      );

      const data = await response.json();
      if (!response.ok || !data.success) {
        setError(data.message || "Failed to send OTP");
        return;
      }

      setOtpSent(true);
      setSuccess("OTP sent to your email. Enter it below to complete signup.");
    } catch (err) {
      setError(err.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const verifySignupOtp = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!otp.trim()) {
      setError("OTP is required");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: formData.email.trim().toLowerCase(),
          otp: otp.trim(),
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        setError(data.message || "OTP verification failed");
        return;
      }

      if (data.token) {
        localStorage.setItem("authToken", data.token);
      }
      navigate("/");
    } catch (err) {
      setError(err.message || "OTP verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = () => {
    setLoading(true);
    setError("");
    try {
      handleGoogleLogin();
    } catch (err) {
      setError(err.message || "Google signup failed");
      setLoading(false);
    }
  };

  return (
    <div
      className={cn("flex flex-col gap-6 max-w-sm w-full", className)}
      {...props}
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Create an account</CardTitle>
          <CardDescription>
            Enter your details below to create your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={otpSent ? verifySignupOtp : requestSignupOtp}>
            <div className="flex flex-col gap-6">
              <LabledInput
                label="Full Name"
                value={formData.name}
                onChange={handleInputChange}
                error={errors.name}
                disabled={loading || otpSent}
                id="name"
                placeholder=""
              />

              <div>
                <LabledInput
                  label="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  error={errors.email}
                  disabled={loading || otpSent}
                  loading={emailStatus.checking}
                  id="email"
                  type="email"
                />
                {emailStatus.message && (
                  <p
                    className={`text-sm ml-2 mt-1 ${emailStatus.available ? "text-emerald-500" : "text-muted-foreground"}`}
                  >
                    {emailStatus.message}
                  </p>
                )}
              </div>

              <LabledInput
                label="Phone"
                value={formData.phone}
                onChange={handleInputChange}
                error={errors.phone}
                disabled={loading || otpSent}
                id="phone"
                type="tel"
              />

              <LabledInput
                label="password"
                value={formData.password}
                onChange={handleInputChange}
                error={errors.password}
                disabled={loading || otpSent}
                id="password"
                type="password"
                showPasswordToggle={true}
              />

              {otpSent && (
                <LabledInput
                  label="OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  disabled={loading}
                  id="otp"
                  placeholder="Enter 6-digit OTP"
                />
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={loading || emailStatus.checking}
              >
                {loading
                  ? otpSent
                    ? "Verifying OTP..."
                    : "Sending OTP..."
                  : otpSent
                    ? "Verify OTP & Create Account"
                    : "Send OTP"}
              </Button>
              <Button
                variant="outline"
                className="w-full"
                type="button"
                onClick={handleGoogleSignUp}
                disabled={loading}
              >
                <GoogleIcon className="!size-4" />
                {loading ? "Signing up..." : "Sign up with Google"}
              </Button>
              {success && <p className="text-sm text-emerald-500">{success}</p>}
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
            <div className="mt-4 text-center text-sm">
              Already have an account?{" "}
              <Link to="/login" className="underline underline-offset-4">
                Login
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
