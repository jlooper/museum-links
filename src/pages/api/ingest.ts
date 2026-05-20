import type { APIRoute } from "astro";
import { cloudinary } from "../../lib/cloudinary";
import { fetchArticRecords, fetchMetRecords } from "../../lib/museums";

export const prerender = false;

function getErrorDetail(error: unknown) {
  if (error instanceof Error) return error.message;

  try {
    return JSON.stringify(error, null, 2);
  } catch {
    return String(error);
  }
}

function matchesArtist(record: any, query: string) {
  const q = query.toLowerCase().trim();
  const artist = String(record.artist || "").toLowerCase();

  return artist.includes(q);
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const {
      source = "both",
      query = "painting",
      limit = 10,
      strictArtist = true,
    } = await request.json();

    const records = [
      ...(source === "met" || source === "both"
        ? await fetchMetRecords(query, limit)
        : []),
      ...(source === "artic" || source === "both"
        ? await fetchArticRecords(query, limit)
        : []),
    ];

    const filteredRecords = strictArtist
      ? records.filter((record) => matchesArtist(record, query))
      : records;

    const uploaded = [];

    for (const record of filteredRecords) {
      const upload = await cloudinary.uploader.upload(record.imageUrl, {
        upload_preset: import.meta.env.CLOUDINARY_UPLOAD_PRESET,
        folder: `museums/${record.source}`,
        public_id: `${record.source}-${record.externalId}`,
        overwrite: false,

        tags: [
          record.source,
          record.department,
          record.medium,
          record.period,
          record.date,
        ].filter(Boolean),

        context: {
          caption: record.title,
          alt: `${record.title}${record.artist ? ` by ${record.artist}` : ""}`,
          source_url: record.sourceUrl ?? "",
          museum_source: record.source,
          external_id: String(record.externalId),
          artist: record.artist ?? "",
          period: record.period ?? record.date ?? "",
          medium: record.medium ?? "",
          rights: record.rights ?? "",
          department: record.department ?? "",
        },
      });

      uploaded.push({
        title: record.title,
        source: record.source,
        artist: record.artist,
        publicId: upload.public_id,
        secureUrl: upload.secure_url,
      });
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