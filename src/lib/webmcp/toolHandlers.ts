/**
 * Pure handler logic for the story builder's actions (create draft, search,
 * add items, reorder, edit text, preview, request review).
 *
 * Every handler takes an explicit `deps` object rather than reaching for
 * globals — the same handlers back the real UI's repository in the browser
 * and a fake repository in tests.
 */
import {
  assertTitle,
  assertWithinLength,
  checkReviewReadiness,
  dedupeAssetIds,
  reorderItems,
  StoryValidationError,
} from "../stories/validation";
import { STORY_LIMITS, type MuseumSearchResult, type StoryDraft, type StoryItem } from "../stories/types";
import { StoryNotFoundError, type StoryRepository } from "../stories/storyRepository";

export class ToolInputError extends Error {}

export type ToolDeps = {
  repository: StoryRepository;
  searchAssets: (input: {
    query: string;
    source?: "met" | "artic" | "cleveland";
    artist?: string;
    limit?: number;
  }) => Promise<MuseumSearchResult[]>;
  getAssetsByPublicIds: (publicIds: string[]) => Promise<MuseumSearchResult[]>;
  /** Updates/navigates the UI to the story preview and returns the route shown. */
  showPreview: (storyId: string) => string;
};

function requireDraft(repository: StoryRepository, storyId: string): StoryDraft {
  const draft = repository.get(storyId);
  if (!draft) throw new StoryNotFoundError(storyId);
  return draft;
}

function createId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `item-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function searchMuseumMedia(
  deps: ToolDeps,
  input: { query: string; source?: "met" | "artic" | "cleveland"; artist?: string; limit?: number }
) {
  if (!input.query || !input.query.trim()) {
    throw new ToolInputError("query is required.");
  }

  const results = await deps.searchAssets({
    query: input.query,
    source: input.source,
    artist: input.artist,
    limit: input.limit ?? 10,
  });

  return { results };
}

export function createStoryDraft(deps: ToolDeps, input: { title: string }) {
  const title = assertTitle(input.title);
  const draft = deps.repository.create({ title });

  return {
    storyId: draft.id,
    summary: `Created unpublished draft "${draft.title}" (status: ${draft.status}).`,
  };
}

export async function addStoryItems(
  deps: ToolDeps,
  input: { storyId: string; assetPublicIds: string[] }
) {
  if (!Array.isArray(input.assetPublicIds) || input.assetPublicIds.length === 0) {
    throw new ToolInputError("assetPublicIds must be a non-empty array.");
  }

  const draft = requireDraft(deps.repository, input.storyId);
  const candidateIds = dedupeAssetIds(draft.items, input.assetPublicIds);

  // Only assets the app's own data layer can verify are added — a caller
  // cannot inject arbitrary titles/images/URLs for an unverified public id.
  const verified = await deps.getAssetsByPublicIds(candidateIds);
  const verifiedById = new Map(verified.map((asset) => [asset.assetPublicId, asset]));
  const skipped = candidateIds.filter((id) => !verifiedById.has(id));

  const newItems: StoryItem[] = [...verifiedById.values()].map((asset, index) => ({
    id: createId(),
    assetPublicId: asset.assetPublicId,
    source: asset.source,
    title: asset.title,
    artist: asset.artist,
    date: asset.date,
    medium: asset.medium,
    sourceUrl: asset.sourceUrl,
    imageUrl: asset.thumbnailUrl,
    position: draft.items.length + index,
  }));

  const updated = deps.repository.update(draft.id, (current) => ({
    ...current,
    items: [...current.items, ...newItems],
  }));

  return {
    storyId: updated.id,
    addedCount: newItems.length,
    itemCount: updated.items.length,
    skippedAssetPublicIds: skipped,
  };
}

export function updateStoryItemText(
  deps: ToolDeps,
  input: { storyId: string; itemId: string; caption?: string; narrativeText?: string }
) {
  const draft = requireDraft(deps.repository, input.storyId);
  const item = draft.items.find((candidate) => candidate.id === input.itemId);
  if (!item) throw new ToolInputError(`Item "${input.itemId}" was not found in story "${input.storyId}".`);

  const caption =
    input.caption !== undefined
      ? assertWithinLength(input.caption, STORY_LIMITS.caption, "caption")
      : item.caption;
  const narrativeText =
    input.narrativeText !== undefined
      ? assertWithinLength(input.narrativeText, STORY_LIMITS.narrativeText, "narrativeText")
      : item.narrativeText;

  const updated = deps.repository.update(draft.id, (current) => ({
    ...current,
    items: current.items.map((candidate) =>
      candidate.id === item.id ? { ...candidate, caption, narrativeText } : candidate
    ),
  }));

  return { storyId: updated.id, itemId: item.id, updated: true };
}

export function arrangeStoryItems(
  deps: ToolDeps,
  input: { storyId: string; orderedItemIds: string[] }
) {
  const draft = requireDraft(deps.repository, input.storyId);
  const reordered = reorderItems(draft.items, input.orderedItemIds);

  const updated = deps.repository.update(draft.id, (current) => ({
    ...current,
    items: reordered,
  }));

  return {
    storyId: updated.id,
    order: updated.items
      .slice()
      .sort((a, b) => a.position - b.position)
      .map((item) => item.id),
  };
}

export function deleteStoryDraft(deps: ToolDeps, input: { storyId: string }) {
  requireDraft(deps.repository, input.storyId);
  deps.repository.remove(input.storyId);
  return { storyId: input.storyId, deleted: true };
}

export function previewStory(deps: ToolDeps, input: { storyId: string }) {
  const draft = requireDraft(deps.repository, input.storyId);
  const route = deps.showPreview(draft.id);
  return { storyId: draft.id, route };
}

export function requestReview(deps: ToolDeps, input: { storyId: string }) {
  const draft = requireDraft(deps.repository, input.storyId);
  const readiness = checkReviewReadiness(draft);

  if (!readiness.ok) {
    return {
      storyId: draft.id,
      status: draft.status,
      ok: false,
      message:
        "Story is not ready for review yet: " +
        readiness.reasons.join(" ") +
        " Add the missing details and try again.",
    };
  }

  const updated = deps.repository.update(draft.id, (current) => ({
    ...current,
    status: "ready_for_review",
  }));

  return {
    storyId: updated.id,
    status: updated.status,
    ok: true,
    message:
      "Story marked ready_for_review. This does not publish, deploy, or share it anywhere — " +
      "a human must still take an explicit action in the app to publish.",
  };
}

export { StoryValidationError, StoryNotFoundError };
