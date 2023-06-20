// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (c) 2023 Levi Gruspe

import { GraphNode } from "./schema";

function createSuggestion(
  node: GraphNode,
  onClick: () => void
): HTMLDivElement {
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
export function createSuggestionsDiv(): [
  HTMLDivElement,
  (query: string, results: GraphNode[]) => void, // update function
  () => void, // press down
  () => void, // press up
  () => void // press enter
] {
  const div = document.createElement("div");
  div.classList.add("suggestions");

  const update = (query: string, results: GraphNode[]) => {
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
