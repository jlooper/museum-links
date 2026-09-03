import type { StoryDraft } from "./types";

/**
 * Persistence boundary for story drafts. The MVP ships a browser-local
 * implementation; swap in an authenticated server-backed implementation
 * later without touching callers (UI or WebMCP tools) — they only depend
 * on this interface.
 */
export interface StoryRepository {
  list(): StoryDraft[];
  get(id: string): StoryDraft | undefined;
  create(input: { title: string }): StoryDraft;
  update(id: string, updater: (draft: StoryDraft) => StoryDraft): StoryDraft;
  remove(id: string): void;
}

export class StoryNotFoundError extends Error {
  constructor(id: string) {
    super(`Story draft "${id}" was not found.`);
  }
}

function createId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/** In-memory repository. Useful as a base class and for tests; not persisted. */
export class InMemoryStoryRepository implements StoryRepository {
  protected drafts = new Map<string, StoryDraft>();

  list(): StoryDraft[] {
    return [...this.drafts.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  get(id: string): StoryDraft | undefined {
    return this.drafts.get(id);
  }

  create(input: { title: string }): StoryDraft {
    const now = new Date().toISOString();

    const draft: StoryDraft = {
      id: createId(),
      title: input.title,
      status: "draft",
      items: [],
      createdAt: now,
      updatedAt: now,
    };

    this.drafts.set(draft.id, draft);
    this.persist();
    return draft;
  }

  update(id: string, updater: (draft: StoryDraft) => StoryDraft): StoryDraft {
    const existing = this.drafts.get(id);
    if (!existing) throw new StoryNotFoundError(id);

    const updated = { ...updater(existing), id, updatedAt: new Date().toISOString() };
    this.drafts.set(id, updated);
    this.persist();
    return updated;
  }

  remove(id: string): void {
    this.drafts.delete(id);
    this.persist();
  }

  /** Hook for subclasses that persist beyond memory (e.g. localStorage). */
  protected persist(): void {}
}

const STORAGE_KEY = "troubadour.stories.v1";

/** Browser-local persistence. This is where the MVP's "local drafts" live. */
export class LocalStoryRepository extends InMemoryStoryRepository {
  constructor(private readonly storage: Storage = globalThis.localStorage) {
    super();
    this.load();
  }

  private load(): void {
    try {
      const raw = this.storage.getItem(STORAGE_KEY);
      if (!raw) return;

      const parsed = JSON.parse(raw) as StoryDraft[];
      for (const draft of parsed) this.drafts.set(draft.id, draft);
    } catch {
      // Corrupt or missing local storage is treated as an empty story list.
    }
  }

  protected persist(): void {
    try {
      this.storage.setItem(STORAGE_KEY, JSON.stringify(this.list()));
    } catch {
      // Storage may be unavailable (private browsing, quota); drafts stay in-memory for this session.
    }
  }
}
