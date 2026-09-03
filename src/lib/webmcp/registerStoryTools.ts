/**
 * Browser-side WebMCP registration for the story-builder page only. Follows
 * the current draft API shape: `document.modelContext.registerTool(...)`.
 * That API is an early, fast-moving proposal, so all knowledge of its exact
 * shape is isolated to this one file — everything else in the app (UI,
 * repository, tool handlers) has no dependency on WebMCP existing at all.
 *
 * Feature-detected: on a browser without `document.modelContext`, this is a
 * no-op and the page works entirely through its normal UI.
 */
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
} from "./toolHandlers";
import { TOOL_DEFINITIONS } from "./toolDefinitions";

type ModelContextToolResult = { content: { type: "text"; text: string }[]; isError?: boolean };

type ModelContextToolDef = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  annotations?: Record<string, unknown>;
  execute: (input: Record<string, unknown>) => Promise<ModelContextToolResult>;
};

type ModelContextGlobal = {
  registerTool: (def: ModelContextToolDef) => unknown;
};

function isWebMcpSupported(): boolean {
  return (
    typeof document !== "undefined" &&
    "modelContext" in document &&
    typeof (document as unknown as { modelContext?: ModelContextGlobal }).modelContext?.registerTool ===
      "function"
  );
}

function toToolResult(value: unknown): ModelContextToolResult {
  return { content: [{ type: "text", text: JSON.stringify(value) }] };
}

function toErrorResult(error: unknown): ModelContextToolResult {
  const message = error instanceof Error ? error.message : String(error);
  return { content: [{ type: "text", text: JSON.stringify({ error: message }) }], isError: true };
}

const HANDLERS: Record<string, (deps: ToolDeps, input: any) => unknown> = {
  search_museum_media: searchMuseumMedia,
  create_story_draft: createStoryDraft,
  delete_story_draft: deleteStoryDraft,
  add_story_items: addStoryItems,
  update_story_item_text: updateStoryItemText,
  arrange_story_items: arrangeStoryItems,
  preview_story: previewStory,
  request_review: requestReview,
};

export type RegisterStoryToolsResult = {
  supported: boolean;
  registeredToolNames: string[];
};

/** Registers all 8 tools against `deps`. Safe to call once the story-builder page mounts. */
export function registerStoryTools(deps: ToolDeps): RegisterStoryToolsResult {
  if (!isWebMcpSupported()) {
    return { supported: false, registeredToolNames: [] };
  }

  const modelContext = (document as unknown as { modelContext: ModelContextGlobal }).modelContext;
  const registeredToolNames: string[] = [];

  for (const definition of TOOL_DEFINITIONS) {
    const handler = HANDLERS[definition.name];
    if (!handler) continue;

    modelContext.registerTool({
      name: definition.name,
      description: definition.description,
      inputSchema: definition.inputSchema,
      annotations: definition.annotations,
      async execute(input) {
        try {
          const result = await handler(deps, input);
          console.debug(`[webmcp] ${definition.name} succeeded`, input, result);
          return toToolResult(result);
        } catch (error) {
          console.debug(`[webmcp] ${definition.name} failed`, input, error);
          return toErrorResult(error);
        }
      },
    });

    registeredToolNames.push(definition.name);
  }

  return { supported: true, registeredToolNames };
}
