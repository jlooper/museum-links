import type { MuseumSource } from "./stories/types";

/** Human-readable museum names, keyed by the internal source code stored on every asset. */
export const MUSEUM_LABELS: Record<MuseumSource, string> = {
  met: "The Met",
  artic: "Art Institute of Chicago",
  cleveland: "Cleveland Museum of Art",
};

export function getMuseumLabel(source: string): string {
  return MUSEUM_LABELS[source as MuseumSource] ?? source;
}
