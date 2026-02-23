import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Link } from "react-router-dom"
import { LabledInput } from "./ui/labeled-input"
import { useState } from "react"

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ForgotPasswordForm({
  className,
  ...props
}) {
  const [formData, setFormData] = useState({
    email: "",
    otp: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleInputChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.id]: e.target.value }));
    setError("");
    setSuccess("");
  };

  const requestOtp = async () => {
    if (!EMAIL_REGEX.test(formData.email.trim().toLowerCase())) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/request-reset-password-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: formData.email.trim().toLowerCase() }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        setError(data.message || "Failed to send OTP");
        return;
      }

      setOtpSent(true);
      setSuccess("OTP sent to your email");
    } catch (err) {
      setError(err.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    if (!formData.otp.trim()) {
      setError("OTP is required");
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: formData.email.trim().toLowerCase(),
          otp: formData.otp.trim(),
          password: formData.password,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        setError(data.message || "Password reset failed");
        return;
      }

      setSuccess("Password reset successful. You can login now.");
      setFormData({ email: "", otp: "", password: "", confirmPassword: "" });
      setOtpSent(false);
    } catch (err) {
      setError(err.message || "Password reset failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (otpSent) {
      resetPassword();
      return;
    }

    requestOtp();
  };

  return (
    <div className={cn("flex flex-col gap-6 max-w-sm w-full", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Reset password</CardTitle>
          <CardDescription>
            {otpSent
              ? "Enter OTP and set your new password"
              : "Enter your email address and we will send you an OTP"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-6">
              <LabledInput
                label="Email"
                id="email"
                type="email"
                placeholder="m@example.com"
                value={formData.email}
                onChange={handleInputChange}
                disabled={loading || otpSent}
              />

              {otpSent && (
                <>
                  <LabledInput
                    label="OTP"
                    id="otp"
                    placeholder="Enter 6-digit OTP"
                    value={formData.otp}
                    onChange={handleInputChange}
                    disabled={loading}
                  />
                  <LabledInput
                    label="New Password"
                    id="password"
                    type="password"
                    showPasswordToggle={true}
                    value={formData.password}
                    onChange={handleInputChange}
                    disabled={loading}
                  />
                  <LabledInput
                    label="Confirm Password"
                    id="confirmPassword"
                    type="password"
                    showPasswordToggle={true}
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    disabled={loading}
                  />
                </>
              )}

              <Button type="submit" className="w-full">
                {loading ? "Please wait..." : otpSent ? "Reset Password" : "Send OTP"}
              </Button>
              {success && <p className="text-sm text-emerald-500">{success}</p>}
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
            <div className="mt-4 text-center text-sm">
              Remember your password?{" "}
              <Link to="/login" className="underline underline-offset-4">
                Back to login
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
