import type { APIRoute } from "astro";
import type { MuseumRecord } from "../../lib/museums";
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

/** Cloudinary SDK rejections are often plain objects (`{ message, http_code }`), not
 *  real Error instances, so `String(reason)` alone collapses them to "[object Object]". */
function describeUploadError(reason: unknown): string {
  if (reason instanceof Error) return reason.message;
  if (reason && typeof reason === "object" && "message" in reason) {
    return String((reason as { message: unknown }).message);
  }
  return String(reason);
}

function isValidRecord(value: unknown): value is MuseumRecord {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;

  return (
    typeof record.source === "string" &&
    (typeof record.externalId === "string" || typeof record.externalId === "number") &&
    typeof record.title === "string" &&
    typeof record.imageUrl === "string"
  );
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const records: unknown[] = Array.isArray(body.records) ? body.records : [];

    if (records.length === 0) {
      return Response.json({ error: "records must be a non-empty array" }, { status: 400 });
    }

    const invalid = records.filter((record) => !isValidRecord(record));
    if (invalid.length > 0) {
      return Response.json(
        { error: "Every record needs source, externalId, title, and imageUrl.", invalid },
        { status: 400 }
      );
    }

    const validRecords = records as MuseumRecord[];

    const settled = await Promise.allSettled(validRecords.map((record) => uploadMuseumRecord(record)));

    const saved = [];
    const failed = [];

    for (let i = 0; i < settled.length; i++) {
      const outcome = settled[i];
      if (outcome.status === "fulfilled") {
        saved.push(outcome.value);
      } else {
        failed.push({
          title: validRecords[i].title,
          error: describeUploadError(outcome.reason),
        });
      }
    }

    return Response.json({ savedCount: saved.length, saved, failed });
  } catch (error) {
    return Response.json(
      {
        error: "Museum save failed",
        detail: getErrorDetail(error),
      },
      { status: 500 }
    );
  }
};
