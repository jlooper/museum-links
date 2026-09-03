import { cloudinary } from "./cloudinary";
import { getMuseumRecordId, type MuseumRecord } from "./museums";

export type UploadedMuseumRecord = {
  title: string;
  source: MuseumRecord["source"];
  artist?: string;
  publicId: string;
  secureUrl: string;
};

// Some museum CDNs (e.g. the Art Institute of Chicago's, behind Cloudflare) 403 requests
// that don't look like a browser — including Cloudinary's own server-side remote fetch.
// Fetching the bytes ourselves with a normal browser User-Agent sidesteps that.
const BROWSER_USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = "";
  for (const byte of new Uint8Array(buffer)) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

async function fetchImageAsDataUri(imageUrl: string): Promise<string> {
  const res = await fetch(imageUrl, {
    headers: {
      "User-Agent": BROWSER_USER_AGENT,
      Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch source image (${res.status}): ${imageUrl}`);
  }

  const contentType = res.headers.get("content-type") || "image/jpeg";
  return `data:${contentType};base64,${arrayBufferToBase64(await res.arrayBuffer())}`;
}

/** Uploads one museum record into Cloudinary. Idempotent: re-uploading an already-saved
 *  record's public id returns the existing asset instead of erroring (overwrite: false). */
export async function uploadMuseumRecord(record: MuseumRecord): Promise<UploadedMuseumRecord> {
  const imageData = await fetchImageAsDataUri(record.imageUrl);

  const upload = await cloudinary.uploader.upload(imageData, {
    upload_preset: import.meta.env.CLOUDINARY_UPLOAD_PRESET,
    folder: `museums/${record.source}`,
    public_id: getMuseumRecordId(record),
    overwrite: false,

    tags: [record.source, record.department, record.medium, record.period, record.date].filter(
      Boolean
    ),

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

  return {
    title: record.title,
    source: record.source,
    artist: record.artist,
    publicId: upload.public_id,
    secureUrl: upload.secure_url,
  };
}
