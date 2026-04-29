import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

const src = readFileSync(
  resolve(__dirname, "../index.ts"),
  "utf8"
);

describe("asset-photos module", () => {
  it("exports getPhoto, setPhoto, removePhoto", () => {
    expect(src).toContain("export function getPhoto");
    expect(src).toContain("export function setPhoto");
    expect(src).toContain("export function removePhoto");
  });

  it("guards against SSR with typeof window check", () => {
    expect(src).toContain('typeof window === "undefined"');
  });

  it("uses guild_photo_ key prefix", () => {
    expect(src).toContain("guild_photo_");
  });

  it("getPhoto returns null guard on server", () => {
    // The function must return null when window is undefined
    expect(src).toMatch(/getPhoto.*typeof window.*null/s);
  });
});

