import type { APIRoute } from "astro";
import { cloudinary } from "../../lib/cloudinary";

export const prerender = false;

export const GET: APIRoute = async () => {
  try {
    const result = await cloudinary.search
      .expression("folder:museums/*")
      .with_field("context")
      .with_field("tags")
      .sort_by("created_at", "desc")
      .max_results(100)
      .execute();

    return Response.json(result.resources ?? []);
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