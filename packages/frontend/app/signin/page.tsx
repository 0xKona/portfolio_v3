"use client";

import { Suspense } from "react";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/hooks/use-auth";
import { SignInForm } from "@/components/auth/sign-in-form";
import { TerminalLoading } from "@/components/ui";

function SignInContent() {
  const { status } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // If already authenticated, redirect to destination
  useEffect(() => {
    if (status === "authenticated") {
      const redirect = searchParams.get("redirect") || "/manager";
      router.replace(redirect);
    }
  }, [status, router, searchParams]);

  if (status === "loading") {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <TerminalLoading message="checking session..." />
      </main>
    );
  }

  if (status === "authenticated") {
    return null;
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <SignInForm redirectTo={searchParams.get("redirect") || "/manager"} />
    </main>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center">
          <TerminalLoading message="loading..." />
        </main>
      }
    >
      <SignInContent />
    </Suspense>
  );
}
