/**
 * DOM wiring for the story-builder page. Deliberately thin: all story
 * mutation logic lives in ../webmcp/toolHandlers.ts — this file only builds
 * and updates the DOM, and never uses innerHTML for user-supplied text.
 */
import { LocalStoryRepository, type StoryRepository } from "../stories/storyRepository";
import type { MuseumSearchResult, StoryDraft } from "../stories/types";
import { getMuseumAssetsByPublicIds, searchMuseumAssets } from "../museumSearch";
import {
  addStoryItems,
  arrangeStoryItems,
  createStoryDraft,
  deleteStoryDraft,
  previewStory,
  requestReview,
  searchMuseumMedia,
  updateStoryItemText,
  type ToolDeps,
} from "../webmcp/toolHandlers";
import { registerStoryTools } from "../webmcp/registerStoryTools";
import { getMuseumLabel } from "../museumLabels";
import { buildExhibitionWall, storyImageSrc, withImageFallback } from "./exhibitionWall";
import { el } from "./dom";

function reportError(error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);
  window.alert(message);
}

export function mountStoryBuilder(): void {
  const draftSelect = document.getElementById("draft-select") as HTMLSelectElement;
  const deleteDraftButton = document.getElementById("delete-draft-button") as HTMLButtonElement;
  const newDraftForm = document.getElementById("new-draft-form") as HTMLFormElement;
  const draftTitleInput = document.getElementById("draft-title") as HTMLInputElement;
  const draftTitleDisplay = document.getElementById("draft-title-display") as HTMLElement;
  const draftStatusEl = document.getElementById("draft-status") as HTMLElement;

  const searchForm = document.getElementById("search-form") as HTMLFormElement;
  const searchButton = searchForm.querySelector('button[type="submit"]') as HTMLButtonElement;
  const searchQueryInput = document.getElementById("search-query") as HTMLInputElement;
  const searchSourceSelect = document.getElementById("search-source") as HTMLSelectElement;
  const searchResultsList = document.getElementById("search-results") as HTMLOListElement;
  const searchStatusEl = document.getElementById("search-status") as HTMLElement;
  const activeDraftHintEl = document.getElementById("search-active-draft") as HTMLElement;

  const sequenceList = document.getElementById("sequence-list") as HTMLOListElement;

  const previewPanel = document.getElementById("preview-panel") as HTMLElement;
  const previewContent = document.getElementById("preview-content") as HTMLElement;
  const downloadPdfButton = document.getElementById("download-pdf-button") as HTMLButtonElement;

  const previewButton = document.getElementById("preview-button") as HTMLButtonElement;
  const requestReviewButton = document.getElementById("request-review-button") as HTMLButtonElement;
  const reviewMessage = document.getElementById("review-message") as HTMLElement;

  const webmcpStatusEl = document.getElementById("webmcp-status") as HTMLElement;

  let currentDraftId: string | null = null;

  const baseRepository = new LocalStoryRepository();

  function scheduleRender(): void {
    renderDraftOptions();
    renderDraftMeta();
    renderSequence();
    if (!previewPanel.hidden) renderPreview();
  }

  const repository: StoryRepository = {
    list: () => baseRepository.list(),
    get: (id) => baseRepository.get(id),
    create: (input) => {
      const draft = baseRepository.create(input);
      scheduleRender();
      return draft;
    },
    update: (id, updater) => {
      const draft = baseRepository.update(id, updater);
      scheduleRender();
      return draft;
    },
    remove: (id) => {
      baseRepository.remove(id);
      scheduleRender();
    },
  };

  function showPreview(storyId: string): string {
    currentDraftId = storyId;
    previewPanel.hidden = false;
    scheduleRender();
    previewPanel.scrollIntoView({ behavior: "smooth", block: "start" });
    return `${location.pathname}#preview-panel`;
  }

  const deps: ToolDeps = {
    repository,
    searchAssets: (input) => searchMuseumAssets(input),
    getAssetsByPublicIds: (ids) => getMuseumAssetsByPublicIds(ids),
    showPreview,
  };

  function currentDraft(): StoryDraft | undefined {
    return currentDraftId ? repository.get(currentDraftId) : undefined;
  }

  function renderDraftOptions(): void {
    draftSelect.replaceChildren();

    // Reviewed drafts move exclusively to the Archive — this list is drafts-in-progress only.
    const drafts = repository.list().filter((draft) => draft.status === "draft");

    if (drafts.length === 0) {
      draftSelect.append(el("option", { value: "" }, ["No drafts yet"]));
      draftSelect.disabled = true;
      deleteDraftButton.disabled = true;
      currentDraftId = null;
      return;
    }

    draftSelect.disabled = false;
    deleteDraftButton.disabled = false;

    if (!drafts.some((draft) => draft.id === currentDraftId)) {
      currentDraftId = drafts[0].id;
    }

    for (const draft of drafts) {
      draftSelect.append(
        el("option", { value: draft.id }, [`${draft.title} — ${draft.status}`])
      );
    }

    draftSelect.value = currentDraftId ?? drafts[0].id;
  }

  function renderDraftMeta(): void {
    const draft = currentDraft();

    draftTitleDisplay.textContent = draft ? draft.title : "No draft selected";
    draftStatusEl.textContent = draft ? draft.status : "—";
    draftStatusEl.setAttribute("data-status", draft ? draft.status : "");
    draftStatusEl.hidden = !draft;

    const hasDraft = Boolean(draft);
    previewButton.disabled = !hasDraft;
    requestReviewButton.disabled = !hasDraft;

    activeDraftHintEl.replaceChildren(
      hasDraft
        ? el("span", {}, ["Adding items to: ", el("strong", {}, [draft!.title])])
        : el("span", { class: "hint-warning" }, [
            "Create or select a draft above before adding items.",
          ])
    );
  }

  function renderSearchResults(results: MuseumSearchResult[]): void {
    searchResultsList.replaceChildren();

    if (results.length === 0) {
      searchStatusEl.textContent = "No matches in your saved collection. Try a different name or spelling.";
      return;
    }

    searchStatusEl.textContent = `${results.length} result${results.length === 1 ? "" : "s"}.`;

    for (const result of results) {
      const addButton = el("button", { type: "button", class: "secondary" }, ["Add to story"]);
      addButton.addEventListener("click", async () => {
        if (!currentDraftId) {
          activeDraftHintEl.classList.add("attention");
          document.getElementById("draft-panel")?.scrollIntoView({ behavior: "smooth", block: "start" });
          draftTitleInput.focus();
          window.setTimeout(() => activeDraftHintEl.classList.remove("attention"), 1600);
          return;
        }
        const input = { storyId: currentDraftId, assetPublicIds: [result.assetPublicId] };
        try {
          await addStoryItems(deps, input);
        } catch (error) {
          reportError(error);
        }
      });

      const card = el("li", { class: "search-card" }, [
        withImageFallback(el("img", { src: result.thumbnailUrl, alt: "", loading: "lazy" }) as HTMLImageElement),
        el("div", { class: "card-body" }, [
          el("span", { class: "badge" }, [getMuseumLabel(result.source)]),
          el("h3", {}, [result.title]),
          el("p", {}, [result.artist ?? "Unknown artist"]),
          result.sourceUrl
            ? el("a", { href: result.sourceUrl, target: "_blank", rel: "noreferrer" }, ["View source"])
            : el("span", {}, []),
          addButton,
        ]),
      ]);

      searchResultsList.append(card);
    }
  }

  function moveItem(itemId: string, direction: -1 | 1): void {
    const draft = currentDraft();
    if (!draft) return;

    const ordered = [...draft.items].sort((a, b) => a.position - b.position).map((item) => item.id);
    const index = ordered.indexOf(itemId);
    const swapWith = index + direction;
    if (swapWith < 0 || swapWith >= ordered.length) return;

    [ordered[index], ordered[swapWith]] = [ordered[swapWith], ordered[index]];

    try {
      arrangeStoryItems(deps, { storyId: draft.id, orderedItemIds: ordered });
    } catch (error) {
      reportError(error);
    }
  }

  function removeItem(itemId: string): void {
    const draft = currentDraft();
    if (!draft) return;

    repository.update(draft.id, (current) => ({
      ...current,
      items: current.items
        .filter((item) => item.id !== itemId)
        .map((item, index) => ({ ...item, position: index })),
    }));
  }

  function saveItemText(itemId: string, field: "caption" | "narrativeText", value: string): void {
    const draft = currentDraft();
    if (!draft) return;

    try {
      updateStoryItemText(deps, { storyId: draft.id, itemId, [field]: value });
    } catch (error) {
      reportError(error);
    }
  }

  function renderSequence(): void {
    sequenceList.replaceChildren();
    const draft = currentDraft();
    if (!draft) return;

    const items = [...draft.items].sort((a, b) => a.position - b.position);

    items.forEach((item, index) => {
      const upButton = el("button", { type: "button", class: "icon secondary", "aria-label": `Move "${item.title}" earlier` }, ["↑"]);
      upButton.disabled = index === 0;
      upButton.addEventListener("click", () => moveItem(item.id, -1));

      const downButton = el("button", { type: "button", class: "icon secondary", "aria-label": `Move "${item.title}" later` }, ["↓"]);
      downButton.disabled = index === items.length - 1;
      downButton.addEventListener("click", () => moveItem(item.id, 1));

      const removeButton = el("button", { type: "button", class: "icon secondary", "aria-label": `Remove "${item.title}"` }, ["✕"]);
      removeButton.addEventListener("click", () => removeItem(item.id));

      const captionInput = el("input", { type: "text", value: item.caption ?? "", placeholder: "A short caption…" }) as HTMLInputElement;
      captionInput.addEventListener("change", () => saveItemText(item.id, "caption", captionInput.value));

      const narrativeInput = el("textarea", { placeholder: "What's the story behind this moment?" }, [item.narrativeText ?? ""]) as HTMLTextAreaElement;
      narrativeInput.addEventListener("change", () => saveItemText(item.id, "narrativeText", narrativeInput.value));

      const captionField = el("label", { class: "field" }, [el("span", { class: "field-label" }, ["Caption"]), captionInput]);
      const narrativeField = el("label", { class: "field" }, [
        el("span", { class: "field-label" }, ["Narrative text"]),
        narrativeInput,
      ]);

      const body = el("div", { class: "card-body" }, [
        el("span", { class: "badge" }, [getMuseumLabel(item.source)]),
        el("h3", {}, [item.title]),
        el("p", {}, [item.artist ? `${item.artist}${item.date ? `, ${item.date}` : ""}` : (item.date ?? "")]),
        el("a", { href: item.sourceUrl, target: "_blank", rel: "noreferrer" }, ["View source"]),
        el("div", { class: "item-fields" }, [captionField, narrativeField]),
      ]);

      const card = el("li", { class: "sequence-card" }, [
        withImageFallback(el("img", { src: storyImageSrc(item.imageUrl), alt: item.title }) as HTMLImageElement),
        body,
        el("div", { class: "move-controls" }, [upButton, downButton, removeButton]),
      ]);

      sequenceList.append(card);
    });
  }

  function renderPreview(): void {
    previewContent.replaceChildren();
    const draft = currentDraft();
    if (!draft) return;

    previewContent.append(buildExhibitionWall(draft));
  }

  newDraftForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const input = { title: draftTitleInput.value };
    try {
      const result = createStoryDraft(deps, input);
      currentDraftId = result.storyId;
      newDraftForm.reset();
      scheduleRender();
    } catch (error) {
      reportError(error);
    }
  });

  draftSelect.addEventListener("change", () => {
    currentDraftId = draftSelect.value || null;
    scheduleRender();
  });

  deleteDraftButton.addEventListener("click", () => {
    const draft = currentDraft();
    if (!draft) return;
    if (!window.confirm(`Delete draft "${draft.title}"? This cannot be undone.`)) return;

    try {
      deleteStoryDraft(deps, { storyId: draft.id });
      currentDraftId = null;
      previewPanel.hidden = true;
      scheduleRender();
    } catch (error) {
      reportError(error);
    }
  });

  searchForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const input = {
      query: searchQueryInput.value,
      source: (searchSourceSelect.value as "met" | "artic" | "cleveland" | "") || undefined,
    };

    searchButton.disabled = true;
    searchButton.textContent = "Searching…";
    searchStatusEl.textContent = "";

    try {
      const result = await searchMuseumMedia(deps, input);
      renderSearchResults(result.results);
    } catch (error) {
      reportError(error);
    } finally {
      searchButton.disabled = false;
      searchButton.textContent = "Search";
    }
  });

  previewButton.addEventListener("click", () => {
    if (!currentDraftId) return;
    try {
      previewStory(deps, { storyId: currentDraftId });
    } catch (error) {
      reportError(error);
    }
  });

  downloadPdfButton.addEventListener("click", () => {
    window.print();
  });

  requestReviewButton.addEventListener("click", () => {
    if (!currentDraftId) return;
    try {
      const result = requestReview(deps, { storyId: currentDraftId });

      if (result.ok) {
        // The reviewed draft has already been filtered out of the picker by the
        // repository.update side effect inside requestReview — don't let the
        // preview silently swap to whatever draft became current underneath it.
        previewPanel.hidden = true;
        currentDraftId = null;
        scheduleRender();
        reviewMessage.replaceChildren(
          "This exposition has been conserved. ",
          el("a", { href: "/archive" }, ["View it in the Archive →"])
        );
      } else {
        reviewMessage.textContent = result.message;
        renderDraftMeta();
      }
    } catch (error) {
      reportError(error);
    }
  });

  scheduleRender();

  const registration = registerStoryTools(deps);
  webmcpStatusEl.dataset.supported = String(registration.supported);
  webmcpStatusEl.textContent = registration.supported
    ? `WebMCP: ready (${registration.registeredToolNames.length} tools)`
    : "WebMCP: unavailable in this browser — standard UI ready";
}
