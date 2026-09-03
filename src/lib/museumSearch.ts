/**
 * Browser-side data-access for the museum collection. Always goes through
 * the app's own `/api/assets` endpoint — never talks to Met/AIC or Cloudinary
 * directly — so this is the one place both the gallery UI and the WebMCP
 * tools read search results from.
 */
import {
  getAssetContextValue,
  getAssetImageUrl,
  getAssetPublicId,
  getAssetTitle,
  type CloudinaryAsset,
} from "./cloudinaryAsset";
import type { MuseumSearchResult, MuseumSource } from "./stories/types";

export type MuseumSearchInput = {
  query?: string;
  source?: MuseumSource;
  artist?: string;
  limit?: number;
};

function toSearchResult(asset: CloudinaryAsset): MuseumSearchResult {
  const source = getAssetContextValue(asset, "museum_source", "met") as MuseumSource;

  return {
    assetPublicId: getAssetPublicId(asset),
    source: source === "artic" || source === "cleveland" ? source : "met",
    title: getAssetTitle(asset),
    artist: getAssetContextValue(asset, "artist", "") || undefined,
    date: getAssetContextValue(asset, "period", "") || undefined,
    medium: getAssetContextValue(asset, "medium", "") || undefined,
    thumbnailUrl: getAssetImageUrl(asset, undefined, {
      crop: "fill",
      gravity: "auto:face",
      width: 512,
      height: 544,
    }),
    sourceUrl: getAssetContextValue(asset, "source_url", "") || "",
  };
}

export async function searchMuseumAssets(input: MuseumSearchInput): Promise<MuseumSearchResult[]> {
  const params = new URLSearchParams();

  if (input.query) params.set("q", input.query);
  if (input.source) params.set("source", input.source);
  if (input.artist) params.set("artist", input.artist);
  if (input.limit) params.set("limit", String(input.limit));

  const res = await fetch(`/api/assets?${params.toString()}`);
  if (!res.ok) throw new Error(`Museum search failed: ${res.status}`);

  const assets: CloudinaryAsset[] = await res.json();
  return assets.map(toSearchResult);
}

export async function getMuseumAssetsByPublicIds(
  publicIds: string[]
): Promise<MuseumSearchResult[]> {
  if (publicIds.length === 0) return [];

  const params = new URLSearchParams({ ids: publicIds.join(",") });
  const res = await fetch(`/api/assets?${params.toString()}`);
  if (!res.ok) throw new Error(`Museum asset lookup failed: ${res.status}`);

  const assets: CloudinaryAsset[] = await res.json();
  return assets.map(toSearchResult);
}
