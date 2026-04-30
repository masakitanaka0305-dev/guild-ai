import { describe, it, expect } from "vitest";
import { splitJapaneseName } from "@/lib/name-split";

describe("splitJapaneseName", () => {
  it("splits on an ASCII space", () => {
    expect(splitJapaneseName("田中 雅基")).toEqual({
      familyName: "田中",
      givenName: "雅基",
    });
  });

  it("splits on a full-width space", () => {
    expect(splitJapaneseName("田中　雅基")).toEqual({
      familyName: "田中",
      givenName: "雅基",
    });
  });

  it("falls back to first-2-chars heuristic for unspaced JP names", () => {
    expect(splitJapaneseName("田中雅基")).toEqual({
      familyName: "田中",
      givenName: "雅基",
    });
  });

  it("keeps a Latin single token as family name", () => {
    expect(splitJapaneseName("Tanaka")).toEqual({
      familyName: "Tanaka",
      givenName: "",
    });
  });

  it("splits a Latin two-token name", () => {
    expect(splitJapaneseName("Masaki Tanaka")).toEqual({
      familyName: "Masaki",
      givenName: "Tanaka",
    });
  });

  it("returns empty parts for an empty input (no crash)", () => {
    expect(splitJapaneseName("")).toEqual({ familyName: "", givenName: "" });
    expect(splitJapaneseName("   ")).toEqual({ familyName: "", givenName: "" });
  });
});
