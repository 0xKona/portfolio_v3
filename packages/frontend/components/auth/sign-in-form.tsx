"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cognitoSignIn, cognitoCompleteNewPassword } from "@/lib/cognito";
import { useAuth } from "@/lib/hooks/use-auth";
import { TerminalButton, TerminalInput } from "@/components/ui";

type FormState = "signin" | "newPassword";

interface SignInFormProps {
  redirectTo?: string;
}

export function SignInForm({ redirectTo = "/manager" }: SignInFormProps) {
  const router = useRouter();
  const { setAuthenticated } = useAuth();

  const [formState, setFormState] = useState<FormState>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await cognitoSignIn(email, password);

      if (result.status === "newPasswordRequired") {
        setFormState("newPassword");
        setIsLoading(false);
        return;
      }

      setAuthenticated(result.email);
      router.push(redirectTo);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Invalid email or password",
      );
      setIsLoading(false);
    }
  };

  const handleNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setIsLoading(true);

    try {
      await cognitoCompleteNewPassword(newPassword);
      setAuthenticated(email);
      router.push(redirectTo);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to set new password",
      );
      setIsLoading(false);
    }
  };

  if (formState === "newPassword") {
    return (
      <section className="w-full max-w-md mx-auto">
        <div className="font-mono text-sm text-neutral-500 mb-3">
          <span className="text-green-400">$</span> passwd --new-required
        </div>
        <form
          onSubmit={handleNewPassword}
          className="border border-neutral-800 p-6"
        >
          <h2 className="text-neutral-300 font-mono text-lg mb-2">
            new password required
          </h2>
          <p className="text-sm text-neutral-500 mb-4">
            Your account requires a password change before continuing.
          </p>

          <TerminalInput
            label="new password *"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="new password..."
            required
            minLength={8}
            autoComplete="new-password"
          />

          <div className="mt-4">
            <TerminalInput
              label="confirm password *"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="confirm password..."
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>

          {error && (
            <p className="text-sm text-red-400 font-mono mt-3">{error}</p>
          )}

          <div className="flex items-center gap-3 mt-6">
            <TerminalButton
              type="submit"
              variant="primary"
              disabled={isLoading}
            >
              {isLoading ? "setting..." : "set password"}
            </TerminalButton>
          </div>
        </form>
      </section>
    );
  }

  return (
    <section className="w-full max-w-md mx-auto">
      <div className="font-mono text-sm text-neutral-500 mb-3">
        <span className="text-green-400">$</span> ssh admin@portfolio
      </div>
      <form onSubmit={handleSignIn} className="border border-neutral-800 p-6">
        <TerminalInput
          label="email *"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="admin@example.com"
          required
          autoComplete="email"
        />

        <div className="mt-4">
          <TerminalInput
            label="password *"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            autoComplete="current-password"
          />
        </div>

        {error && (
          <p className="text-sm text-red-400 font-mono mt-3">{error}</p>
        )}

        <div className="flex items-center gap-3 mt-6">
          <TerminalButton type="submit" variant="primary" disabled={isLoading}>
            {isLoading ? "connecting..." : "sign in"}
          </TerminalButton>
          <TerminalButton
            type="button"
            variant="ghost"
            onClick={() => router.push("/")}
          >
            cancel
          </TerminalButton>
        </div>
      </form>
    </section>
  );
}
