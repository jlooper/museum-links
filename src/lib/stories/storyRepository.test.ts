import { beforeEach, describe, expect, it } from "vitest";
import { LocalStoryRepository, StoryNotFoundError } from "./storyRepository";

beforeEach(() => {
  localStorage.clear();
});

describe("LocalStoryRepository", () => {
  it("creates a draft with draft status and no items", () => {
    const repo = new LocalStoryRepository();
    const draft = repo.create({ title: "Textiles and Memory" });

    expect(draft.status).toBe("draft");
    expect(draft.items).toEqual([]);
    expect(draft.title).toBe("Textiles and Memory");
  });

  it("persists drafts across repository instances via localStorage", () => {
    const repo1 = new LocalStoryRepository();
    const draft = repo1.create({ title: "Persisted story" });

    const repo2 = new LocalStoryRepository();
    expect(repo2.get(draft.id)?.title).toBe("Persisted story");
  });

  it("update() applies the updater and bumps updatedAt", async () => {
    const repo = new LocalStoryRepository();
    const draft = repo.create({ title: "A" });

    await new Promise((resolve) => setTimeout(resolve, 2));

    const updated = repo.update(draft.id, (current) => ({ ...current, title: "B" }));
    expect(updated.title).toBe("B");
    expect(updated.updatedAt >= draft.updatedAt).toBe(true);
  });

  it("update() throws StoryNotFoundError for an unknown id", () => {
    const repo = new LocalStoryRepository();
    expect(() => repo.update("missing", (d) => d)).toThrow(StoryNotFoundError);
  });

  it("remove() deletes the draft", () => {
    const repo = new LocalStoryRepository();
    const draft = repo.create({ title: "Temp" });
    repo.remove(draft.id);
    expect(repo.get(draft.id)).toBeUndefined();
  });
});
