/**
 * Shared shape/helpers for Cloudinary resources returned by the Admin/Search
 * API. Centralized so the gallery page, the search API, and the WebMCP tools
 * all read museum metadata the same way instead of re-deriving it per call site.
 */

export type CloudinaryContext = Record<string, string> & {
  custom?: Record<string, string>;
};

export type CloudinaryAsset = {
  public_id?: string;
  publicId?: string;
  secure_url?: string;
  secureUrl?: string;
  context?: CloudinaryContext;
  tags?: string[];
};

export function getAssetContextValue(
  asset: CloudinaryAsset,
  key: string,
  fallback = "Unknown"
): string {
  return asset.context?.[key] || asset.context?.custom?.[key] || fallback;
}

export function getAssetPublicId(asset: CloudinaryAsset): string {
  return asset.public_id || asset.publicId || "";
}

export type ImageTransformOptions = {
  width?: number;
  height?: number;
  crop?: string;
  gravity?: string;
};

function buildTransformString(options?: ImageTransformOptions): string | null {
  if (!options) return null;

  const parts = ["f_auto", "q_auto"];
  if (options.crop) parts.push(`c_${options.crop}`);
  if (options.gravity) parts.push(`g_${options.gravity}`);
  if (options.width) parts.push(`w_${options.width}`);
  if (options.height) parts.push(`h_${options.height}`);

  return parts.join(",");
}

/**
 * Ensures a Cloudinary delivery URL carries a given crop transform, inserting
 * it if missing. A no-op if the URL already carries this exact gravity
 * setting — safe to call on a URL that may or may not already be cropped
 * (e.g. a story item saved before this crop existed), without stacking a
 * second, redundant transform on top of one already baked in.
 */
export function withImageTransform(url: string, options: ImageTransformOptions): string {
  if (!url.includes("/upload/")) return url;

  const transform = buildTransformString(options);
  if (!transform) return url;
  if (options.gravity && url.includes(`g_${options.gravity}`)) return url;

  return url.replace("/upload/", `/upload/${transform}/`);
}

export function getAssetImageUrl(
  asset: CloudinaryAsset,
  cloudName?: string,
  options?: ImageTransformOptions
): string {
  const transform = buildTransformString(options);
  const baseUrl = asset.secure_url || asset.secureUrl;

  if (baseUrl) {
    return transform ? baseUrl.replace("/upload/", `/upload/${transform}/`) : baseUrl;
  }

  const segments = transform ?? "f_auto,q_auto";
  return `https://res.cloudinary.com/${cloudName ?? ""}/image/upload/${segments}/${getAssetPublicId(asset)}`;
}

export function getAssetTitle(asset: CloudinaryAsset): string {
  return getAssetContextValue(asset, "caption") || getAssetPublicId(asset) || "Untitled";
}

export function assetMatchesQuery(asset: CloudinaryAsset, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  const haystack = [
    getAssetContextValue(asset, "caption", ""),
    getAssetContextValue(asset, "artist", ""),
    getAssetContextValue(asset, "medium", ""),
    getAssetContextValue(asset, "department", ""),
    getAssetContextValue(asset, "period", ""),
    ...(asset.tags ?? []),
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(q);
}

export function assetMatchesArtist(asset: CloudinaryAsset, artist: string): boolean {
  const a = artist.trim().toLowerCase();
  if (!a) return true;

  return getAssetContextValue(asset, "artist", "").toLowerCase().includes(a);
}

export function assetMatchesSource(asset: CloudinaryAsset, source: string): boolean {
  return getAssetContextValue(asset, "museum_source", "").toLowerCase() === source.toLowerCase();
}
