import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
function read(rel: string) {
  return readFileSync(join(ROOT, rel), "utf-8");
}

describe("/projects — お困りごと一覧 (Friendly Tone)", () => {
  const list = read("src/app/projects/page.tsx");
  const detail = read("src/app/projects/[id]/page.tsx");

  it("/projects h1 reads 「みんなの お困りごと」", () => {
    expect(list).toContain('data-testid="projects-h1"');
    expect(list).toContain("みんなの お困りごと");
  });

  it("table headers swap to friendly Japanese (困りごと / マッチ度 / 想定お礼 / 締切)", () => {
    expect(list).toContain(">困りごと<");
    expect(list).toContain(">マッチ度<");
    expect(list).toContain(">想定お礼<");
    expect(list).toContain(">締切<");
    expect(list).toContain("中身を見る");
  });

  it("entry link to /applications reads 「参加状況を見る →」", () => {
    expect(list).toContain("参加状況を見る →");
  });

  it("/projects/[id] required intelligence section reads 「ほしい知恵（必要なカード）」", () => {
    expect(detail).toContain('title="ほしい知恵（必要なカード）"');
    expect(detail).toContain('data-testid="required-intelligence-list"');
    expect(detail).toContain(
      "この困りごとは、いろんな分野の知恵を組み合わせて解いていきます",
    );
  });

  it("missing-requirement copy reads 「持っていません — X 以上」", () => {
    expect(detail).toContain("（持っていません —");
  });
});
