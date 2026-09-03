/**
 * DOM wiring for the search-first homepage. Live-searches the Met, the Art
 * Institute of Chicago, and the Cleveland Museum of Art through
 * `/api/museum-search` (nothing is saved yet), lets a visitor pick results,
 * then saves only the picked items to Cloudinary through `/api/museum-save`.
 */
import { el } from "./dom";
import { MUSEUM_LABELS } from "../museumLabels";

type MuseumSearchRecord = {
  recordId: string;
  source: "met" | "artic" | "cleveland";
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

function reportError(error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);
  window.alert(message);
}

export function mountMuseumSearch(): void {
  const searchForm = document.getElementById("search-form") as HTMLFormElement;
  const queryInput = document.getElementById("search-query") as HTMLInputElement;
  const sourceSelect = document.getElementById("search-source") as HTMLSelectElement;
  const resultsList = document.getElementById("search-results") as HTMLOListElement;
  const statusEl = document.getElementById("search-status") as HTMLElement;
  const searchButton = searchForm.querySelector('button[type="submit"]') as HTMLButtonElement;

  const saveBar = document.getElementById("save-bar") as HTMLElement;
  const saveButton = document.getElementById("save-button") as HTMLButtonElement;
  const selectedCountEl = document.getElementById("selected-count") as HTMLElement;
  const saveResultEl = document.getElementById("save-result") as HTMLElement;

  const recordsById = new Map<string, MuseumSearchRecord>();
  const selectedIds = new Set<string>();
  const savedIds = new Set<string>();

  function updateSaveBar(): void {
    const count = selectedIds.size;
    selectedCountEl.textContent = String(count);
    saveBar.hidden = count === 0;
    saveButton.disabled = count === 0;
  }

  function setCardSelected(card: HTMLElement, selected: boolean): void {
    card.classList.toggle("selected", selected);
    const checkbox = card.querySelector<HTMLInputElement>('input[type="checkbox"]');
    if (checkbox) checkbox.checked = selected;
  }

  function toggleSelection(recordId: string, card: HTMLElement): void {
    if (savedIds.has(recordId)) return;

    if (selectedIds.has(recordId)) {
      selectedIds.delete(recordId);
      setCardSelected(card, false);
    } else {
      selectedIds.add(recordId);
      setCardSelected(card, true);
    }

    updateSaveBar();
  }

  function markCardSaved(card: HTMLElement): void {
    card.classList.remove("selected");
    card.classList.add("saved");
    const checkbox = card.querySelector<HTMLInputElement>('input[type="checkbox"]');
    if (checkbox) {
      checkbox.checked = false;
      checkbox.disabled = true;
    }
    const savedBadge = card.querySelector<HTMLElement>(".saved-badge");
    if (savedBadge) savedBadge.hidden = false;
  }

  function renderResults(results: MuseumSearchRecord[]): void {
    resultsList.replaceChildren();
    recordsById.clear();
    selectedIds.clear();
    savedIds.clear();
    updateSaveBar();
    saveResultEl.replaceChildren();

    if (results.length === 0) {
      statusEl.textContent = "No results. Try a different name or spelling.";
      return;
    }

    statusEl.textContent = `${results.length} result${results.length === 1 ? "" : "s"}.`;

    for (const record of results) {
      recordsById.set(record.recordId, record);

      const checkbox = el("input", {
        type: "checkbox",
        "aria-label": `Select ${record.title}`,
      }) as HTMLInputElement;
      checkbox.addEventListener("change", () => toggleSelection(record.recordId, card));

      const card = el("li", { class: "result-card", "data-record-id": record.recordId }, [
        el("div", { class: "result-image-wrap" }, [
          el("img", {
            src: record.imageUrl,
            alt: record.title,
            loading: "lazy",
            referrerpolicy: "no-referrer",
          }),
          checkbox,
          el("span", { class: "saved-badge", hidden: "" }, ["Saved"]),
        ]),
        el("div", { class: "card-body" }, [
          el("span", { class: "badge" }, [MUSEUM_LABELS[record.source]]),
          el("h3", {}, [record.title]),
          el("p", {}, [record.artist || "Unknown artist"]),
          record.sourceUrl
            ? el("a", { href: record.sourceUrl, target: "_blank", rel: "noreferrer" }, ["View source"])
            : el("span", {}, []),
        ]),
      ]);

      card.addEventListener("click", (event) => {
        const target = event.target as HTMLElement;
        if (target.tagName === "A" || target === checkbox) return;
        toggleSelection(record.recordId, card);
      });

      resultsList.append(card);
    }
  }

  searchForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const query = queryInput.value.trim();
    if (!query) return;

    const params = new URLSearchParams({ q: query });
    if (sourceSelect.value) params.set("source", sourceSelect.value);

    searchButton.disabled = true;
    statusEl.textContent = "Searching the Met, the Art Institute of Chicago, and the Cleveland Museum of Art…";

    try {
      const res = await fetch(`/api/museum-search?${params.toString()}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Search failed (${res.status}).`);
      }

      const data = await res.json();
      renderResults(data.results as MuseumSearchRecord[]);
    } catch (error) {
      statusEl.textContent = "";
      reportError(error);
    } finally {
      searchButton.disabled = false;
    }
  });

  saveButton.addEventListener("click", async () => {
    const records = [...selectedIds].map((id) => recordsById.get(id)).filter(Boolean) as MuseumSearchRecord[];
    if (records.length === 0) return;

    saveButton.disabled = true;
    saveButton.textContent = "Saving…";

    try {
      const res = await fetch("/api/museum-save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ records }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Save failed (${res.status}).`);
      }

      const data = await res.json();
      const savedTitles = new Set((data.saved as { title: string }[]).map((s) => s.title));

      for (const record of records) {
        if (!savedTitles.has(record.title)) continue;
        savedIds.add(record.recordId);
        selectedIds.delete(record.recordId);

        const card = resultsList.querySelector<HTMLElement>(
          `[data-record-id="${CSS.escape(record.recordId)}"]`
        );
        if (card) markCardSaved(card);
      }

      updateSaveBar();

      const failed = data.failed as { title: string; error: string }[];
      saveResultEl.replaceChildren(
        el("p", { class: "save-success" }, [
          `Saved ${data.savedCount} item${data.savedCount === 1 ? "" : "s"} to `,
          el("a", { href: "/gallery" }, ["your gallery"]),
          ".",
        ]),
        ...(failed.length > 0
          ? [el("p", { class: "save-failed" }, [`${failed.length} item(s) failed to save.`])]
          : [])
      );
    } catch (error) {
      reportError(error);
    } finally {
      saveButton.disabled = selectedIds.size === 0;
      saveButton.textContent = "Save selected to my gallery";
    }
  });
}
