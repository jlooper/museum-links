export type MuseumSource = "met" | "artic" | "cleveland";

export type StoryStatus = "draft" | "ready_for_review";

export type StoryItem = {
  id: string;
  assetPublicId: string;
  source: MuseumSource;
  title: string;
  artist?: string;
  date?: string;
  medium?: string;
  sourceUrl: string;
  imageUrl: string;
  caption?: string;
  narrativeText?: string;
  position: number;
};

export type StoryDraft = {
  id: string;
  title: string;
  status: StoryStatus;
  items: StoryItem[];
  createdAt: string;
  updatedAt: string;
};

/** A museum object as returned by the app's own search layer (never museum-content invented by a caller). */
export type MuseumSearchResult = {
  assetPublicId: string;
  source: MuseumSource;
  title: string;
  artist?: string;
  date?: string;
  medium?: string;
  thumbnailUrl: string;
  sourceUrl: string;
};

export const STORY_LIMITS = {
  title: 140,
  caption: 280,
  narrativeText: 2000,
} as const;
