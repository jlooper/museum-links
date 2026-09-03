export type MuseumSource = "met" | "artic" | "cleveland";

export type MuseumRecord = {
  source: MuseumSource;
  externalId: string | number;
  title: string;
  artist?: string;
  period?: string;
  date?: string;
  medium?: string;
  department?: string;
  rights?: string;
  imageUrl: string;
  sourceUrl?: string;
};

export async function fetchMetRecords(query = "painting", limit = 10) {
  const searchUrl = new URL(
    "https://collectionapi.metmuseum.org/public/collection/v1/search"
  );

  searchUrl.searchParams.set("q", query);
  searchUrl.searchParams.set("hasImages", "true");

  const searchRes = await fetch(searchUrl);
  if (!searchRes.ok) throw new Error(`Met search failed: ${searchRes.status}`);

  const search = await searchRes.json();
  const ids = search.objectIDs?.slice(0, limit) ?? [];

  const records = await Promise.all(
    ids.map(async (id: number) => {
      const res = await fetch(
        `https://collectionapi.metmuseum.org/public/collection/v1/objects/${id}`
      );

      if (!res.ok) return null;

      const item = await res.json();

      if (!item.primaryImage) return null;

      return {
        source: "met",
        externalId: item.objectID,
        title: item.title ?? "Untitled",
        artist: item.artistDisplayName,
        period: item.period,
        date: item.objectDate,
        medium: item.medium,
        department: item.department,
        rights: item.rightsAndReproduction,
        imageUrl: item.primaryImage,
        sourceUrl: item.objectURL,
      } satisfies MuseumRecord;
    })
  );

  return records.filter(Boolean) as MuseumRecord[];
}

export async function fetchArticRecords(query = "painting", limit = 10) {
  const url = new URL("https://api.artic.edu/api/v1/artworks/search");

  url.searchParams.set("q", query);
  url.searchParams.set("limit", String(limit));
  url.searchParams.set(
    "fields",
    [
      "id",
      "title",
      "artist_display",
      "date_display",
      "medium_display",
      "department_title",
      "image_id",
      "thumbnail",
      "api_link",
    ].join(",")
  );

  const res = await fetch(url);
  if (!res.ok) throw new Error(`ArtIC search failed: ${res.status}`);

  const json = await res.json();

  return json.data
    .filter((item: any) => item.image_id)
    .map((item: any) => ({
      source: "artic",
      externalId: item.id,
      title: item.title ?? "Untitled",
      artist: item.artist_display,
      date: item.date_display,
      medium: item.medium_display,
      department: item.department_title,
      rights: item.thumbnail?.alt_text,
      imageUrl: `https://www.artic.edu/iiif/2/${item.image_id}/full/843,/0/default.jpg`,
      sourceUrl: item.api_link,
    })) satisfies MuseumRecord[];
}

export async function fetchClevelandRecords(query = "painting", limit = 10) {
  const url = new URL("https://openaccess-api.clevelandart.org/api/artworks/");

  url.searchParams.set("q", query);
  url.searchParams.set("has_image", "1");
  url.searchParams.set("limit", String(limit));

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Cleveland Museum of Art search failed: ${res.status}`);

  const json = await res.json();

  return (json.data ?? [])
    .filter((item: any) => item.images?.web?.url)
    .map((item: any) => ({
      source: "cleveland",
      externalId: item.id,
      title: item.title ?? "Untitled",
      artist: item.creators?.map((creator: any) => creator.description).filter(Boolean).join("; "),
      date: item.creation_date ?? item.date_text,
      medium: item.technique,
      department: item.department,
      rights: item.share_license_status,
      imageUrl: item.images.web.url,
      sourceUrl: item.url,
    })) satisfies MuseumRecord[];
}

export function matchesArtistName(record: Pick<MuseumRecord, "artist">, query: string): boolean {
  const q = query.toLowerCase().trim();
  const artist = String(record.artist || "").toLowerCase();

  return artist.includes(q);
}

export function getMuseumRecordId(record: Pick<MuseumRecord, "source" | "externalId">): string {
  return `${record.source}-${record.externalId}`;
}

export type FetchAllMuseumRecordsOptions = {
  source?: MuseumSource | "both";
  query?: string;
  limit?: number;
  strictArtist?: boolean;
};

export async function fetchAllMuseumRecords({
  source = "both",
  query = "painting",
  limit = 10,
  strictArtist = true,
}: FetchAllMuseumRecordsOptions = {}): Promise<MuseumRecord[]> {
  const records = [
    ...(source === "met" || source === "both" ? await fetchMetRecords(query, limit) : []),
    ...(source === "artic" || source === "both" ? await fetchArticRecords(query, limit) : []),
    ...(source === "cleveland" || source === "both" ? await fetchClevelandRecords(query, limit) : []),
  ];

  return strictArtist ? records.filter((record) => matchesArtistName(record, query)) : records;
}