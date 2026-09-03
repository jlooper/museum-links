import type { APIRoute } from "astro";
import { fetchAllMuseumRecords, getMuseumRecordId, type MuseumSource } from "../../lib/museums";

export const prerender = false;

const VALID_SOURCES: (MuseumSource | "both")[] = ["met", "artic", "cleveland", "both"];

function getErrorDetail(error: unknown) {
  if (error instanceof Error) return error.message;

  try {
    return JSON.stringify(error, null, 2);
  } catch {
    return String(error);
  }
}

export const GET: APIRoute = async ({ url }) => {
  try {
    const query = url.searchParams.get("q")?.trim() ?? "";
    if (!query) {
      return Response.json({ error: "q is required" }, { status: 400 });
    }

    const sourceParam = url.searchParams.get("source") ?? "both";
    const source = (VALID_SOURCES as string[]).includes(sourceParam)
      ? (sourceParam as MuseumSource | "both")
      : "both";

    const limitParam = Number(url.searchParams.get("limit"));
    const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 20) : 8;

    const records = await fetchAllMuseumRecords({ source, query, limit, strictArtist: true });

    const results = records.map((record) => ({
      ...record,
      recordId: getMuseumRecordId(record),
    }));

    return Response.json({ query, results });
  } catch (error) {
    return Response.json(
      {
        error: "Museum search failed",
        detail: getErrorDetail(error),
      },
      { status: 500 }
    );
  }
};
