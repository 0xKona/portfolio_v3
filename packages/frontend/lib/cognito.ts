import { Amplify } from "aws-amplify";
import {
  signIn as amplifySignIn,
  confirmSignIn as amplifyConfirmSignIn,
  signOut as amplifySignOut,
  fetchAuthSession,
  getCurrentUser,
} from "aws-amplify/auth";
import { getConfig } from "@/lib/config";

// ---------------------------------------------------------------------------
// Initialization — must be called once before any auth operations.
// Loads config from /config.json (deployed) or .env.local (local dev).
// ---------------------------------------------------------------------------

let initialized = false;

export async function initAuth(): Promise<void> {
  if (initialized) return;
  const config = await getConfig();
  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId: config.userPoolId,
        userPoolClientId: config.userPoolClientId,
      },
    },
  });
  initialized = true;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SignInResult =
  | { status: "authenticated"; email: string }
  | { status: "newPasswordRequired" };

// ---------------------------------------------------------------------------
// Sign In
// ---------------------------------------------------------------------------

export async function cognitoSignIn(
  email: string,
  password: string,
): Promise<SignInResult> {
  const result = await amplifySignIn({
    username: email,
    password,
  });

  if (result.nextStep.signInStep === "CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED") {
    return { status: "newPasswordRequired" };
  }

  if (result.nextStep.signInStep === "DONE") {
    return { status: "authenticated", email };
  }

  throw new Error(`Unhandled sign-in step: ${result.nextStep.signInStep}`);
}

// ---------------------------------------------------------------------------
// Complete New Password Challenge
// ---------------------------------------------------------------------------

export async function cognitoCompleteNewPassword(
  newPassword: string,
): Promise<void> {
  const result = await amplifyConfirmSignIn({
    challengeResponse: newPassword,
  });

  if (result.nextStep.signInStep !== "DONE") {
    throw new Error(`Unexpected step after password change: ${result.nextStep.signInStep}`);
  }
}

// ---------------------------------------------------------------------------
// Sign Out
// ---------------------------------------------------------------------------

export async function cognitoSignOut(): Promise<void> {
  await amplifySignOut();
}

// ---------------------------------------------------------------------------
// Session & Token
// ---------------------------------------------------------------------------

export async function cognitoGetIdToken(): Promise<string> {
  const session = await fetchAuthSession();
  const token = session.tokens?.idToken?.toString();
  if (!token) throw new Error("Not authenticated");
  return token;
}

export async function cognitoGetCurrentUser(): Promise<{ email: string } | null> {
  try {
    const user = await getCurrentUser();
    return { email: user.signInDetails?.loginId ?? user.username };
  } catch {
    return null;
  }
}

export async function cognitoIsAuthenticated(): Promise<boolean> {
  try {
    await getCurrentUser();
    return true;
  } catch {
    return false;
  }
}
