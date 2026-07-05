"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/use-auth";
import { TerminalButton } from "@/components/ui";

export function SignOutButton() {
  const router = useRouter();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    router.replace("/");
  };

  return (
    <TerminalButton variant="secondary" onClick={handleSignOut}>
      sign out
    </TerminalButton>
  );
}
