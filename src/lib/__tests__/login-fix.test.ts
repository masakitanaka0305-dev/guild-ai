import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

// ─── mock-auth unit tests ─────────────────────────────────────────────────────

function makeMockStorage() {
  const store: Record<string, string> = {};
  return {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => { store[k] = v; },
    removeItem: (k: string) => { delete store[k]; },
    clear: () => { for (const k in store) delete store[k]; },
  };
}

describe("mock-auth", () => {
  beforeEach(() => {
    const mockStorage = makeMockStorage();
    vi.stubGlobal("window", { localStorage: mockStorage });
    vi.stubGlobal("localStorage", mockStorage);
    vi.stubGlobal("document", { get cookie() { return ""; }, set cookie(_: string) {} });
  });
  afterEach(() => { vi.unstubAllGlobals(); });

  it("mockLogin always returns { ok: true }", async () => {
    const { mockLogin } = await import("@/lib/mock-auth");
    const result = mockLogin("anyone@example.com", "anypassword");
    expect(result.ok).toBe(true);
    expect(result.userId).toBe("demo-user");
  });

  it("mockLogin sets guild_authed in localStorage", async () => {
    const { mockLogin, MOCK_AUTH_STORAGE_KEY } = await import("@/lib/mock-auth");
    mockLogin("test@example.com", "secret");
    expect(localStorage.getItem(MOCK_AUTH_STORAGE_KEY)).toBe("1");
  });

  it("isMockAuthed returns true after mockLogin", async () => {
    const { mockLogin, isMockAuthed } = await import("@/lib/mock-auth");
    mockLogin("test@example.com", "secret");
    expect(isMockAuthed()).toBe(true);
  });

  it("isMockAuthed returns false with empty storage", async () => {
    const { isMockAuthed } = await import("@/lib/mock-auth");
    expect(isMockAuthed()).toBe(false);
  });

  it("mockLogout clears the authed flag", async () => {
    const { mockLogin, mockLogout, isMockAuthed } = await import("@/lib/mock-auth");
    mockLogin("test@example.com", "secret");
    mockLogout();
    expect(isMockAuthed()).toBe(false);
  });
});

// ─── Auth restored (2026-04-30): /login is back, /signup replaced by /welcome ──

describe("auth restored: login + welcome routes exist", () => {
  it("/login page.tsx exists (NextAuth + DEV bypass)", () => {
    const loginPage = resolve(__dirname, "../../app/login/page.tsx");
    expect(existsSync(loginPage)).toBe(true);
  });

  it("/welcome page.tsx exists (post-OAuth profile bootstrap)", () => {
    const welcomePage = resolve(__dirname, "../../app/welcome/page.tsx");
    expect(existsSync(welcomePage)).toBe(true);
  });

  it("/signup page.tsx remains absent (replaced by /welcome)", () => {
    const signupPage = resolve(__dirname, "../../app/signup/page.tsx");
    expect(existsSync(signupPage)).toBe(false);
  });
});

// ─── GuestInit: layout sets localStorage.guild_authed = "1" ─────────────────

const guestInitSrc = readFileSync(
  resolve(__dirname, "../../components/GuestInit.tsx"),
  "utf8",
);

describe("GuestInit component", () => {
  it("sets guild_authed to '1' in localStorage", () => {
    expect(guestInitSrc).toContain('localStorage.setItem("guild_authed", "1")');
  });

  it("uses useEffect so it only runs on mount (not SSR)", () => {
    expect(guestInitSrc).toContain("useEffect");
  });
});

// ─── AuthBar: no login/signup links ──────────────────────────────────────────

const authBarSrc = readFileSync(
  resolve(__dirname, "../../components/AuthBar.tsx"),
  "utf8",
);

describe("AuthBar: no auth-related links", () => {
  it("does not link to /login", () => {
    expect(authBarSrc).not.toContain('href="/login"');
  });

  it("does not link to /signup", () => {
    expect(authBarSrc).not.toContain('href="/signup"');
  });

  it("does not render 新規登録 or ログイン text", () => {
    expect(authBarSrc).not.toContain("新規登録");
    expect(authBarSrc).not.toContain("ログイン");
  });
});

// ─── Middleware: no auth redirect logic ──────────────────────────────────────

const middlewareSrc = readFileSync(
  resolve(__dirname, "../../middleware.ts"),
  "utf8",
);

describe("middleware: auth guards disabled", () => {
  it("matcher is empty — no routes intercepted", () => {
    expect(middlewareSrc).toContain("matcher: []");
  });

  it("always calls NextResponse.next()", () => {
    expect(middlewareSrc).toContain("NextResponse.next()");
  });
});
