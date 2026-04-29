import { describe, it, expect } from "vitest";
import { PAGE_TITLES, getPageTitle, showBackButton, DEFAULT_TITLE } from "@/lib/nav-config";

describe("nav-config", () => {
  it("PAGE_TITLES has entries for all main routes", () => {
    const required = ["/", "/bank", "/sell", "/guild", "/jobs", "/disputes", "/business"];
    for (const route of required) {
      expect(PAGE_TITLES[route], `Missing title for ${route}`).toBeTruthy();
    }
  });

  it("getPageTitle returns correct title for known routes", () => {
    expect(getPageTitle("/")).toBe("ホーム");
    expect(getPageTitle("/sell")).toBe("出品");
    expect(getPageTitle("/guild")).toBe("マイ銀行");
    expect(getPageTitle("/disputes")).toBe("紛争解決センター");
  });

  it("getPageTitle handles dynamic asset routes", () => {
    expect(getPageTitle("/asset/abc123")).toBe("アセット詳細");
    expect(getPageTitle("/lineage/GUILD:X001")).toBe("家系図");
    expect(getPageTitle("/profile/demo-user")).toBe("プロフィール");
  });

  it("getPageTitle returns DEFAULT_TITLE for unknown routes", () => {
    expect(getPageTitle("/unknown-page")).toBe(DEFAULT_TITLE);
    expect(getPageTitle("/foo/bar/baz")).toBe(DEFAULT_TITLE);
  });

  it("showBackButton returns false for root-level nav pages", () => {
    expect(showBackButton("/")).toBe(false);
    expect(showBackButton("/bank")).toBe(false);
    expect(showBackButton("/guild")).toBe(false);
    // deeper pages should show back
    expect(showBackButton("/asset/123")).toBe(true);
    expect(showBackButton("/disputes")).toBe(true);
    expect(showBackButton("/profile")).toBe(true);
  });
});
