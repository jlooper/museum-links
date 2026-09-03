import { STORY_LIMITS, type StoryDraft, type StoryItem } from "./types";

export class StoryValidationError extends Error {}

/**
 * Strips control characters only. Text is stored as plain data and must
 * always be rendered via textContent/DOM APIs (never innerHTML) — this is
 * not an HTML sanitizer and must not be treated as one.
 */
export function sanitizePlainText(value: string): string {
  return value.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, "").trim();
}

export function assertWithinLength(value: string, max: number, field: string): string {
  const clean = sanitizePlainText(value);

  if (clean.length > max) {
    throw new StoryValidationError(`${field} exceeds the ${max}-character limit (got ${clean.length}).`);
  }

  return clean;
}

export function assertTitle(title: string): string {
  const clean = assertWithinLength(title, STORY_LIMITS.title, "title");
  if (!clean) throw new StoryValidationError("title must not be empty.");
  return clean;
}

export function dedupeAssetIds(existingItems: StoryItem[], candidateIds: string[]): string[] {
  const existing = new Set(existingItems.map((item) => item.assetPublicId));
  const seen = new Set<string>();
  const result: string[] = [];

  for (const id of candidateIds) {
    if (!id || existing.has(id) || seen.has(id)) continue;
    seen.add(id);
    result.push(id);
  }

  return result;
}

/**
 * Returns a copy of `items` reordered to match `orderedItemIds`, with
 * `position` reassigned to the new 0-based order. Throws unless
 * `orderedItemIds` is exactly a permutation of the existing item ids.
 */
export function reorderItems(items: StoryItem[], orderedItemIds: string[]): StoryItem[] {
  const currentIds = new Set(items.map((item) => item.id));
  const providedIds = new Set(orderedItemIds);

  if (orderedItemIds.length !== items.length || providedIds.size !== orderedItemIds.length) {
    throw new StoryValidationError(
      "orderedItemIds must contain each of the story's item ids exactly once."
    );
  }

  for (const id of orderedItemIds) {
    if (!currentIds.has(id)) {
      throw new StoryValidationError(`orderedItemIds references unknown item id "${id}".`);
    }
  }

  const byId = new Map(items.map((item) => [item.id, item]));

  return orderedItemIds.map((id, index) => ({
    ...byId.get(id)!,
    position: index,
  }));
}

export type ReviewReadiness = {
  ok: boolean;
  reasons: string[];
};

export function checkReviewReadiness(draft: StoryDraft): ReviewReadiness {
  const reasons: string[] = [];

  if (draft.items.length === 0) {
    reasons.push("The story has no items yet.");
  }

  return { ok: reasons.length === 0, reasons };
}
