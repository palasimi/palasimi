// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (c) 2023 Levi Gruspe

import "./suggestions.css";

export type Suggestion = {
  title: string; // Short title.
  body: string; // Suggestion text.
  url: string; // URL to follow.
};

function createSuggestionTitle(title: string): HTMLDivElement {
  const div = document.createElement("div");
  div.classList.add("suggestion-title");
  div.textContent = title;
  return div;
}

function createSuggestionBody(body: string): HTMLDivElement {
  const div = document.createElement("div");
  div.classList.add("suggestion-body");
  div.textContent = body;
  return div;
}

// Creates an entry in a list of suggestions.
// The resulting div emits a `palasimi-select-suggestion` custom event when
// the mouse enters its box.
// Clicking on the div brings user to `suggestion.url`.
function createSuggestion(suggestion: Suggestion): HTMLDivElement {
  const div = document.createElement("div");
  div.classList.add("suggestion");
  div.appendChild(createSuggestionTitle(suggestion.title));
  div.appendChild(createSuggestionBody(suggestion.body));

  div.addEventListener("click", () => {
    window.location.href = suggestion.url;
  });
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
export function createSuggestionsDiv(): [
  HTMLDivElement,
  (query: string, results: Suggestion[]) => void, // update function
  () => void, // press down
  () => void, // press up
  () => void // press enter
] {
  const div = document.createElement("div");
  div.classList.add("suggestions");

  const update = (query: string, results: Suggestion[]) => {
    if (query.length === 0) {
      div.replaceChildren();
      return;
    }
    if (results.length === 0) {
      div.replaceChildren(createNoSuggestionsFound());
      return;
    }

    // Only take first 200 results for performance reasons.
    const children = results.slice(0, 200).map(createSuggestion);

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
    const selected = getSelected() as HTMLElement | null;
    if (selected == null) {
      return;
    }
    selected.click();

    // Blur the search input to hide the search results.
    const active = document.activeElement;
    if (active instanceof HTMLInputElement) {
      active.blur();
    }
  };

  div.addEventListener("palasimi-select-suggestion", (event) => {
    if (event.target != null) {
      select(event.target as Element);
    }
  });
  return [div, update, down, up, enter];
}
