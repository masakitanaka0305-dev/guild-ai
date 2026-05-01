import { describe, it, expect } from "vitest";
import {
  signMd,
  djb2Hex,
  hasSignature,
  buildSignatureLine,
} from "@/lib/intelligence-signature";

describe("intelligence-signature: deterministic, idempotent footer", () => {
  it("signMd is deterministic for (mdText, authorHandle) and pins the footer below ---", () => {
    const md = "# Title\n本文を書きます。\n";
    const author = "masaki-tanaka";
    const fixedNow = () => new Date("2026-05-01T00:00:00.000Z");
    const a = signMd(md, author, { now: fixedNow });
    const b = signMd(md, author, { now: fixedNow });
    expect(a.hash).toBe(b.hash);
    expect(a.timestamp).toBe("2026-05-01T00:00:00.000Z");
    // Footer follows the canonical format
    expect(a.signature).toContain("\n---\nIntelligence Signature:");
    expect(a.signature).toContain(buildSignatureLine(a.hash, a.timestamp));
    // Body is preserved (no leakage in front)
    expect(a.signature.startsWith("# Title")).toBe(true);
    // hash is 8 lowercase hex chars
    expect(a.hash).toMatch(/^[0-9a-f]{8}$/);
  });

  it("changing author or body changes the hash", () => {
    const fixedNow = () => new Date("2026-05-01T00:00:00.000Z");
    const a = signMd("Body A", "alice", { now: fixedNow });
    const b = signMd("Body A", "bob",   { now: fixedNow });
    const c = signMd("Body B", "alice", { now: fixedNow });
    expect(a.hash).not.toBe(b.hash);
    expect(a.hash).not.toBe(c.hash);
  });

  it("signMd is idempotent — already-signed MD comes back as-is", () => {
    const md = "# Title\n本文。";
    const author = "carol";
    const first = signMd(md, author, { now: () => new Date("2026-05-01T00:00:00.000Z") });
    const second = signMd(first.signature, author);
    expect(second.signature).toBe(first.signature);
    expect(second.hash).toBe(first.hash);
    expect(hasSignature(second.signature)).toBe(true);
  });

  it("djb2Hex returns 8 zero-padded lowercase hex chars and is stable", () => {
    expect(djb2Hex("guild-ai")).toMatch(/^[0-9a-f]{8}$/);
    expect(djb2Hex("guild-ai")).toBe(djb2Hex("guild-ai"));
    expect(djb2Hex("guild-ai")).not.toBe(djb2Hex("guild-AI"));
  });
});
