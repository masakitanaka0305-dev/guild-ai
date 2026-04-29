"use client";

// GUILD AI — Auth context
// Single fetch per page load: AuthProvider reads the current session via server
// action on mount and exposes it through useCurrentUser(). Pages that need a
// userId call useCurrentUser()?.id ?? "demo-user" to switch between
// authenticated data (real user's records) and demo data (when logged out).

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getSessionUserAction, type SessionUserSummary } from "@/app/actions/auth";

type AuthState =
  | { status: "loading"; user: null }
  | { status: "authenticated"; user: SessionUserSummary }
  | { status: "anonymous"; user: null };

const AuthContext = createContext<AuthState>({ status: "loading", user: null });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: "loading", user: null });

  useEffect(() => {
    let mounted = true;
    getSessionUserAction()
      .then((u) => {
        if (!mounted) return;
        if (u) setState({ status: "authenticated", user: u });
        else setState({ status: "anonymous", user: null });
      })
      .catch(() => {
        if (mounted) setState({ status: "anonymous", user: null });
      });
    return () => { mounted = false; };
  }, []);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

/** Returns the current authenticated user summary, or null if not signed in. */
export function useCurrentUser(): SessionUserSummary | null {
  return useContext(AuthContext).user;
}

/**
 * Returns the user id to use for data lookups, falling back to "demo-user"
 * when not authenticated. Centralizes the demo-vs-real-user switch.
 */
export function useUserId(): string {
  const user = useCurrentUser();
  return user?.id ?? "demo-user";
}

/** Full auth state for components that need to distinguish loading vs anonymous. */
export function useAuthState(): AuthState {
  return useContext(AuthContext);
}
