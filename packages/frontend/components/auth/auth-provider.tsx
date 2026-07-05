"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  cognitoGetCurrentUser,
  cognitoGetIdToken,
  cognitoSignOut,
} from "@/lib/cognito";

// ---------------------------------------------------------------------------
// Context type
// ---------------------------------------------------------------------------

export interface AuthContextValue {
  status: "loading" | "authenticated" | "unauthenticated";
  userEmail: string | null;
  getToken: () => Promise<string>;
  setAuthenticated: (email: string) => void;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthContextValue["status"]>("loading");
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // On mount, check for existing session
  useEffect(() => {
    cognitoGetCurrentUser().then((user) => {
      if (user) {
        setUserEmail(user.email);
        setStatus("authenticated");
      } else {
        setStatus("unauthenticated");
      }
    });
  }, []);

  const getToken = useCallback(async (): Promise<string> => {
    return cognitoGetIdToken();
  }, []);

  const setAuthenticated = useCallback((email: string) => {
    setUserEmail(email);
    setStatus("authenticated");
  }, []);

  const signOut = useCallback(async () => {
    await cognitoSignOut();
    setUserEmail(null);
    setStatus("unauthenticated");
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ status, userEmail, getToken, setAuthenticated, signOut }),
    [status, userEmail, getToken, setAuthenticated, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
