// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (c) 2023 Levi Gruspe

import "./search.css";

import { GraphNode } from "./schema";
import { createSuggestionsDiv } from "./suggestions";
import { WordSenseSearcher } from "./word_sense_searcher";

type SearchFunction = (query: string) => Promise<GraphNode[]>;

// Initialize input element.
// Changes behavior of pressing enter and arrow keys.
function initSearchInput(input: HTMLInputElement) {
  input.addEventListener("keydown", (event) => {
    switch (event.keyCode) {
      case 13:
      case 38:
      case 40:
        // Ignore enter, up and down arrow keys, but allow it to propagate.
        event.preventDefault();
        break;

      case 27:
        // Unfocus input when ESC gets pressed.
        input.blur();
        break;
      default:
        break;
    }
  });
}

// Creates a search box without event listeners.
// This should be consistent with HTML in `templates/_header.html`.
function createDumbSearchBox(): HTMLDivElement {
  const div = document.createElement("div");
  div.classList.add("search-box");
  div.innerHTML = `
		<div class="search-input">
			<img class="icon" src="icons/phosphor2/magnifying-glass.svg">
			<input placeholder="Search colexification graphs" autocapitalize="none">
		</div>
	`;
  return div;
}

// `follow`: See `createSuggestionsDiv`.
export function createSearchBox(
  search: SearchFunction,
  follow: (id: string) => void
): HTMLDivElement {
  const box = createDumbSearchBox();
  initSearchBox(box, search, follow);
  return box;
}

// Initializes HTML-defined search box.
// `follow`: see `createSuggestionsDiv`.
export function initSearchBox(
  box: Element,
  search: SearchFunction,
  follow: (id: string) => void
) {
  const [suggestionsDiv, updateSuggestions, down, up, enter] =
    createSuggestionsDiv();
  box.append(suggestionsDiv);

  const inputDiv = box.querySelector(".search-input") as HTMLDivElement;
  const input = inputDiv.querySelector("input") as HTMLInputElement;
  initSearchInput(input);

  box.addEventListener("input", async () => {
    const query = input.value;
    const results = await search(query);
    updateSuggestions(query, results);
  });
  box.addEventListener("palasimi-click-suggestion", (event) => {
    follow((event as CustomEvent).detail.data.id);
    input.value = "";
  });
  box.addEventListener("keydown", (event) => {
    switch ((event as KeyboardEvent).keyCode) {
      case 13:
        enter();
        break;
      case 38:
        up();
        break;
      case 40:
        down();
        break;
      default:
        break;
    }
  });
}

/// Search logic

// Creates a search function.
// This function is blocking, so it's best to run this inside a web worker.
// The return value is a search function.
// This function can be slow, too, so it should also be run inside a web
// worker.
export function createSearchFunction(nodes: GraphNode[]): SearchFunction {
  if (!window.Worker) {
    // Fallback
    const searcher = new WordSenseSearcher(nodes);
    return (query: string) => Promise.resolve(searcher.search(query));
  }

  let pending = "";
  let done = "";
  let result: GraphNode[] = [];

  // This path is not resolved by esbuild.
  const worker = new Worker("/worker.js");
  worker.onmessage = (event) => {
    done = event.data.query;
    result = event.data.results;
  };

  worker.postMessage({ name: "index", value: nodes });

  return async (query: string) => {
    pending = query;
    worker.postMessage({ name: "search", value: query });

    while (query === pending && query !== done) {
      // Wait a few ms if not yet done.
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    return result;
  };
}
