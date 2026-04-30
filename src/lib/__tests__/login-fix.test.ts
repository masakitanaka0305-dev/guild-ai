import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// ─── mock-auth unit tests ─────────────────────────────────────────────────────

// Simulate browser globals so mock-auth localStorage/cookie branches run.
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

// ─── login page source-code assertions ───────────────────────────────────────

const loginPageSrc = readFileSync(
  resolve(__dirname, "../../app/login/page.tsx"),
  "utf8",
);

describe("login/page.tsx: routing fix assertions", () => {
  it("imports useRouter from next/navigation (not next/router)", () => {
    expect(loginPageSrc).toContain('from "next/navigation"');
    expect(loginPageSrc).not.toContain('from "next/router"');
  });

  it("imports mockLogin, isMockAuthed (DB action removed)", () => {
    expect(loginPageSrc).toContain("mockLogin");
    expect(loginPageSrc).toContain("isMockAuthed");
    expect(loginPageSrc).not.toContain("loginAction");
  });

  it("router.push is called after mockLogin in onSubmit", () => {
    const mockLoginIdx = loginPageSrc.indexOf("mockLogin(");
    const routerPushIdx = loginPageSrc.indexOf("router.push(");
    expect(mockLoginIdx).toBeGreaterThan(-1);
    expect(routerPushIdx).toBeGreaterThan(-1);
    // router.push must appear after mockLogin call in source order
    expect(routerPushIdx).toBeGreaterThan(mockLoginIdx);
  });

  it("e.preventDefault is called before router.push", () => {
    const preventIdx = loginPageSrc.indexOf("e.preventDefault()");
    const routerPushIdx = loginPageSrc.indexOf("router.push(");
    expect(preventIdx).toBeGreaterThan(-1);
    expect(routerPushIdx).toBeGreaterThan(preventIdx);
  });

  it("submit button has aria-busy attribute", () => {
    expect(loginPageSrc).toContain("aria-busy");
  });

  it("already-authed guard calls router.replace on mount", () => {
    expect(loginPageSrc).toContain("router.replace(");
    expect(loginPageSrc).toContain("isMockAuthed()");
  });
});
