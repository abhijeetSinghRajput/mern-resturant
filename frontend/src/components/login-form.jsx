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
import GoogleIcon from "./icons/Icons";
import { useGoogleAuth } from "@/hooks/useGoogleAuth";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/stores/useAuthStore";

export function LoginForm({ className, initialError = "", ...props }) {
  const navigate = useNavigate();
  const { handleGoogleLogin } = useGoogleAuth();
  const login = useAuthStore((state) => state.login);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(initialError);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  useEffect(() => {
    setError(initialError || "");
  }, [initialError]);

  const handleInputChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await login(formData);
      navigate("/");
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    setLoading(true);
    setError("");
    try {
      handleGoogleLogin();
    } catch (err) {
      setError(err.message || "Google login failed");
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
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>
            Enter your email below to login to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLoginSubmit}>
            <div className="flex flex-col gap-6">
              <LabledInput
                label="email"
                id="email"
                type="email"
                placeholder="m@example.com"
                value={formData.email}
                onChange={handleInputChange}
                disabled={loading}
              />

              <LabledInput
                label="password"
                id="password"
                type="password"
                placeholder="m@example.com"
                showPasswordToggle={true}
                value={formData.password}
                onChange={handleInputChange}
                disabled={loading}
              />

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Logging in..." : "Login"}
              </Button>
              <Button 
                variant="outline" 
                className="w-full items-center"
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
              >
                <GoogleIcon className="!size-4" />
                {loading ? "Signing in..." : "Login with Google"}
              </Button>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
            <div className="mt-4 text-center text-sm">
              Don&apos;t have an account?{" "}
              <Link to="/signup" className="underline underline-offset-4">
                Sign up
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
