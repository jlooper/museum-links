export function normalizeMuseumRecord(source: "museumA" | "museumB", item: any) {
    return {
      source,
      externalId: item.id,
      title: item.title ?? "Untitled",
      artist: item.artist ?? item.creator ?? "Unknown",
      period: item.period ?? item.date ?? "Unknown",
      rights: item.rights ?? "Unknown",
      imageUrl: item.image_url ?? item.primaryImage,
      tags: [source, item.type, item.medium].filter(Boolean),
      metadata: {
        museum_source: source,
        external_id: item.id,
        artist: item.artist ?? item.creator,
        period: item.period ?? item.date,
        rights: item.rights,
        accession_number: item.accessionNumber,
      },
    };
  }