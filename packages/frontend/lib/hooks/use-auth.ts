import { useContext } from "react";
import {
  AuthContext,
  type AuthContextValue,
} from "@/components/auth/auth-provider";

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
