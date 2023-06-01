// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (c) 2023 Levi Gruspe

import "./search.css";

import { createFuse, searchFuse } from "./fuse";
import { Node } from "./schema";

type SearchFunction = (query: string) => Promise<Node[]>;

function initSearchInput(
  input: HTMLInputElement,
  showSuggestions: (query: string) => void
) {
  input.addEventListener("input", () => showSuggestions(input.value));
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

function createSuggestion(node: Node, onClick: () => void): HTMLDivElement {
  const { word, sense } = node.data;

  const wordDiv = document.createElement("div");
  wordDiv.style.fontWeight = "bold";
  wordDiv.textContent = word;

  const senseDiv = document.createElement("div");
  senseDiv.textContent = sense;

  const div = document.createElement("div");
  div.classList.add("suggestion");
  div.append(wordDiv, senseDiv);
  div.addEventListener("click", onClick);
  div.addEventListener("mouseenter", () => {
    const event = new CustomEvent("palasimi-select-suggestion", {
      bubbles: true,
      detail: div,
    });
    div.dispatchEvent(event);
  });
  return div;
}

function createNoSuggestionsFound(): HTMLDivElement {
  const div = document.createElement("div");
  div.classList.add("suggestion");
  div.textContent = "No results found.";
  return div;
}

// Returns a div element and an update function for inserting search results
// into the div.
function createSuggestionsDiv(): [
  HTMLDivElement,
  (query: string, results: Node[]) => void, // update function
  () => void, // press down
  () => void, // press up
  () => void // press enter
] {
  const div = document.createElement("div");
  div.classList.add("suggestions");

  const update = (query: string, results: Node[]) => {
    if (query.length === 0) {
      div.replaceChildren();
      return;
    }
    if (results.length === 0) {
      div.replaceChildren(createNoSuggestionsFound());
      return;
    }

    // Only take first 200 results for performance reasons.
    const children = results.slice(0, 200).map((result) =>
      createSuggestion(result, () => {
        const event = new CustomEvent("palasimi-click-suggestion", {
          bubbles: true,
          detail: result,
        });
        div.dispatchEvent(event);
        div.replaceChildren();
      })
    );

    // Select first suggestion by default.
    children[0].classList.add("selected");
    div.replaceChildren(...children);
  };

  const getSelected = () => div.querySelector(".selected.suggestion");

  // Checks if suggestion is in view.
  const isInView = (element: Element) => {
    const root = div.getBoundingClientRect();
    const rect = element.getBoundingClientRect();

    if (rect.top < root.top) {
      return false;
    }
    if (rect.bottom > root.bottom) {
      return false;
    }
    return true;
  };

  // Scroll suggestion into view if it's not visible.
  const scrollIntoViewIfNeeded = (element: Element) => {
    if (isInView(element)) {
      return;
    }
    element.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  };

  // Select an element.
  const select = (element: Element) => {
    // Deselect all elements.
    for (const old of div.querySelectorAll(".selected")) {
      old.classList.remove("selected");
    }
    element.classList.add("selected");
  };

  const down = () => {
    if (div.childElementCount === 0) {
      return;
    }
    const old = getSelected();
    const next = old?.nextElementSibling || div.firstElementChild;
    if (next != null) {
      select(next);
      scrollIntoViewIfNeeded(next);
    }
  };

  const up = () => {
    if (div.childElementCount === 0) {
      return;
    }
    const old = getSelected();
    const next = old?.previousElementSibling || div.lastElementChild;
    if (next != null) {
      select(next);
      scrollIntoViewIfNeeded(next);
    }
  };

  const enter = () => {
    const selected = getSelected();
    if (selected == null) {
      return;
    }
    (selected as HTMLElement).click();
  };

  div.addEventListener("palasimi-select-suggestion", (event) => {
    if (event.target != null) {
      select(event.target as Element);
    }
  });
  return [div, update, down, up, enter];
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

  const showSuggestions = (query: string) =>
    search(query).then((results) => updateSuggestions(query, results));

  const inputDiv = box.querySelector(".search-input") as HTMLDivElement;
  const input = inputDiv.querySelector("input") as HTMLInputElement;
  initSearchInput(input, showSuggestions);

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
export function createSearchFunction(nodes: Node[]): SearchFunction {
  if (!window.Worker) {
    // Fallback
    const fuse = createFuse(nodes);
    return (query: string) => Promise.resolve(searchFuse(fuse, query));
  }

  // This path is absolute (not resolved by esbuild).
  let pending = "";
  let done = "";
  let result: Node[] = [];
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
