import type { APIRoute } from "astro";
import { cloudinary } from "../../lib/cloudinary";
import {
  assetMatchesArtist,
  assetMatchesQuery,
  assetMatchesSource,
  getAssetPublicId,
  type CloudinaryAsset,
} from "../../lib/cloudinaryAsset";

export const prerender = false;

const DEFAULT_MAX_RESULTS = 100;
const MAX_LIMIT = 50;

export const GET: APIRoute = async ({ url }) => {
  try {
    const result = await cloudinary.search
      .expression("folder:museums/*")
      .with_field("context")
      .with_field("tags")
      .sort_by("created_at", "desc")
      .max_results(DEFAULT_MAX_RESULTS)
      .execute();

    let resources: CloudinaryAsset[] = result.resources ?? [];

    const q = url.searchParams.get("q");
    const source = url.searchParams.get("source");
    const artist = url.searchParams.get("artist");
    const ids = url.searchParams.get("ids");
    const limitParam = url.searchParams.get("limit");

    if (ids) {
      const wanted = new Set(
        ids
          .split(",")
          .map((id) => id.trim())
          .filter(Boolean)
      );

      resources = resources.filter((asset) => wanted.has(getAssetPublicId(asset)));
    }

    if (source && source !== "both") {
      resources = resources.filter((asset) => assetMatchesSource(asset, source));
    }

    if (artist) {
      resources = resources.filter((asset) => assetMatchesArtist(asset, artist));
    }

    if (q) {
      resources = resources.filter((asset) => assetMatchesQuery(asset, q));
    }

    if (limitParam) {
      const parsed = Number(limitParam);
      const limit = Number.isFinite(parsed) ? Math.max(1, Math.min(MAX_LIMIT, parsed)) : undefined;
      if (limit) resources = resources.slice(0, limit);
    }

    return Response.json(resources);
  } catch (error) {
    return Response.json(
      {
        error: "Failed to fetch Cloudinary assets",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
};

export const DELETE: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const publicId = typeof body.publicId === "string" ? body.publicId.trim() : "";

    if (!publicId || !publicId.startsWith("museums/")) {
      return Response.json({ error: "A museum asset publicId is required." }, { status: 400 });
    }

    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: "image",
      invalidate: true,
    });

    if (result.result !== "ok") {
      return Response.json(
        { error: "Asset was not deleted.", result: result.result },
        { status: result.result === "not found" ? 404 : 500 }
      );
    }

    return Response.json({ deleted: true, publicId });
  } catch (error) {
    return Response.json(
      {
        error: "Failed to delete Cloudinary asset",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
};
