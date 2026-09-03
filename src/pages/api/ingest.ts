import type { APIRoute } from "astro";
import { fetchAllMuseumRecords, matchesArtistName } from "../../lib/museums";
import { uploadMuseumRecord } from "../../lib/museumUpload";

export const prerender = false;

function getErrorDetail(error: unknown) {
  if (error instanceof Error) return error.message;

  try {
    return JSON.stringify(error, null, 2);
  } catch {
    return String(error);
  }
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const {
      source = "both",
      query = "painting",
      limit = 10,
      strictArtist = true,
    } = await request.json();

    const records = await fetchAllMuseumRecords({ source, query, limit, strictArtist: false });
    const filteredRecords = strictArtist
      ? records.filter((record) => matchesArtistName(record, query))
      : records;

    const uploaded = [];

    for (const record of filteredRecords) {
      uploaded.push(await uploadMuseumRecord(record));
    }

    return Response.json({
      fetchedCount: records.length,
      filteredCount: filteredRecords.length,
      uploadedCount: uploaded.length,
      strictArtist,
      uploaded,
    });
  } catch (error) {
    console.error("Ingest failed:", error);

    return Response.json(
      {
        error: "Ingest failed",
        detail: getErrorDetail(error),
      },
      { status: 500 }
    );
  }
};