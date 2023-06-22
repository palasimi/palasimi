// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (c) 2023 Levi Gruspe

import "./search.css";

import {
  createSuggestionsDiv,
  FollowFunction,
  Suggestion,
} from "./suggestions";

export type SearchFunction = (query: string) => Promise<Suggestion[]>;

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
function createDumbSearchBox(placeholder = "Search concepts"): HTMLDivElement {
  const div = document.createElement("div");
  div.classList.add("search-box");
  div.innerHTML = `
		<div class="search-input">
			<input autocapitalize="none">
		</div>
	`;

  const input = div.querySelector("input") as HTMLInputElement;
  input.placeholder = placeholder;
  return div;
}

export type SearchBoxOptions = {
  // Tells what to do when the user clicks on a search result.
  follow?: FollowFunction;

  // Input element placeholder text.
  placeholder?: string;
};

export function createSearchBox(
  search: SearchFunction,
  options: SearchBoxOptions = {}
): HTMLDivElement {
  const box = createDumbSearchBox(options.placeholder);
  initSearchBox(box, search, options.follow);
  return box;
}

// Initializes HTML-defined search box.
// Takes an optional follow function, which tells what to do when the user
// clicks on a search result.
export function initSearchBox(
  box: Element,
  search: SearchFunction,
  follow?: FollowFunction
) {
  const [suggestionsDiv, updateSuggestions, down, up, enter] =
    createSuggestionsDiv(follow);
  box.append(suggestionsDiv);

  const inputDiv = box.querySelector(".search-input") as HTMLDivElement;
  const input = inputDiv.querySelector("input") as HTMLInputElement;
  initSearchInput(input);

  box.addEventListener("input", async () => {
    const query = input.value;
    const results = await search(query);
    updateSuggestions(query, results);
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
