import { describe, expect, it } from "vitest";
import {
  assertTitle,
  assertWithinLength,
  checkReviewReadiness,
  dedupeAssetIds,
  reorderItems,
  StoryValidationError,
} from "./validation";
import type { StoryDraft, StoryItem } from "./types";

function makeItem(overrides: Partial<StoryItem> = {}): StoryItem {
  return {
    id: overrides.id ?? "item-1",
    assetPublicId: overrides.assetPublicId ?? "museums/met/met-1",
    source: overrides.source ?? "met",
    title: overrides.title ?? "Untitled",
    sourceUrl: overrides.sourceUrl ?? "https://example.org/1",
    imageUrl: overrides.imageUrl ?? "https://example.org/1.jpg",
    position: overrides.position ?? 0,
    caption: overrides.caption,
    narrativeText: overrides.narrativeText,
  };
}

function makeDraft(items: StoryItem[] = []): StoryDraft {
  return {
    id: "draft-1",
    title: "A story",
    status: "draft",
    items,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

describe("assertTitle / assertWithinLength", () => {
  it("trims and accepts a title within the limit", () => {
    expect(assertTitle("  Textiles and Memory  ")).toBe("Textiles and Memory");
  });

  it("rejects an empty title", () => {
    expect(() => assertTitle("   ")).toThrow(StoryValidationError);
  });

  it("rejects text over the max length", () => {
    expect(() => assertWithinLength("x".repeat(300), 280, "caption")).toThrow(StoryValidationError);
  });
});

describe("dedupeAssetIds", () => {
  it("drops ids already on the story and duplicates within the candidate list", () => {
    const existing = [makeItem({ assetPublicId: "museums/met/met-1" })];
    const result = dedupeAssetIds(existing, [
      "museums/met/met-1",
      "museums/artic/artic-2",
      "museums/artic/artic-2",
    ]);
    expect(result).toEqual(["museums/artic/artic-2"]);
  });
});

describe("reorderItems", () => {
  it("reorders items and reassigns position by the new order", () => {
    const items = [
      makeItem({ id: "a", position: 0 }),
      makeItem({ id: "b", position: 1 }),
      makeItem({ id: "c", position: 2 }),
    ];

    const reordered = reorderItems(items, ["c", "a", "b"]);
    expect(reordered.map((item) => item.id)).toEqual(["c", "a", "b"]);
    expect(reordered.map((item) => item.position)).toEqual([0, 1, 2]);
  });

  it("throws when the list omits an existing item", () => {
    const items = [makeItem({ id: "a" }), makeItem({ id: "b" })];
    expect(() => reorderItems(items, ["a"])).toThrow(StoryValidationError);
  });

  it("throws when the list references an unknown item id", () => {
    const items = [makeItem({ id: "a" }), makeItem({ id: "b" })];
    expect(() => reorderItems(items, ["a", "z"])).toThrow(StoryValidationError);
  });

  it("throws on duplicate ids even if the length matches", () => {
    const items = [makeItem({ id: "a" }), makeItem({ id: "b" })];
    expect(() => reorderItems(items, ["a", "a"])).toThrow(StoryValidationError);
  });
});

describe("checkReviewReadiness", () => {
  it("fails when there are no items", () => {
    const readiness = checkReviewReadiness(makeDraft([]));
    expect(readiness.ok).toBe(false);
  });

  it("passes once the story has at least one item", () => {
    const draft = makeDraft([makeItem({ id: "a" }), makeItem({ id: "b" })]);
    expect(checkReviewReadiness(draft).ok).toBe(true);
  });
});
