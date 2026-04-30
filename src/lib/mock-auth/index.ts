export const MOCK_AUTH_STORAGE_KEY = "guild_authed";
export const MOCK_SESSION_COOKIE = "guild_session";

export interface MockLoginResult {
  ok: true;
  userId: string;
}

/**
 * Deterministic mock auth — always succeeds regardless of credentials.
 * Sets localStorage flag + a non-HttpOnly session cookie so the Edge
 * middleware route-guard sees an active session without a DB round-trip.
 */
export function mockLogin(_email: string, _password: string): MockLoginResult {
  if (typeof window !== "undefined") {
    localStorage.setItem(MOCK_AUTH_STORAGE_KEY, "1");
    document.cookie = `${MOCK_SESSION_COOKIE}=mock_demo; path=/; max-age=86400; SameSite=Lax`;
  }
  return { ok: true, userId: "demo-user" };
}

export function mockLogout(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(MOCK_AUTH_STORAGE_KEY);
    document.cookie = `${MOCK_SESSION_COOKIE}=; path=/; max-age=0`;
  }
}

export function isMockAuthed(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(MOCK_AUTH_STORAGE_KEY) === "1";
}
