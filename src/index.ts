// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (c) 2023 Levi Gruspe

import "./index.css";

import { initSearchBox } from "@palasimi/search";

import { init as initGraph, show as followNode } from "./graph";
import { fetchJSON } from "./requests";
import { getRoute } from "./router";
import { GraphSchema } from "./schema";
import { slug, WordSense } from "./slug";
import { initSubgraph } from "./subgraph";
import { createSearchFunction } from "./wordSenseSearcher";

// Fixes URL hash and document title.
function fixHistoryState(nodeID: string) {
  const attributes = window.graph.getNodeAttributes(nodeID) as WordSense;
  const url = `/graph#/${nodeID}/${slug(attributes)}`;
  history.replaceState(null, "", url);

  const { word, sense } = attributes;
  document.title = `${word} | ${sense}`;
}

// Updates current page if needed.
function updateView() {
  const route = getRoute();
  if (route.type !== "graph") {
    return;
  }

  const id = route.value;
  fixHistoryState(id);
  followNode(id);
}

async function main() {
  // Register service worker.
  if ("serviceWorker" in navigator) {
    // Doesn't run on Firefox in private browsing mode.
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/serviceWorker.js");
    });
  }

  // Initialize various elements.
  initLogo();

  // Render new graph whenever the URL hash changes.
  window.addEventListener("hashchange", updateView);

  // Fetch graph data.
  const data = (await fetchJSON("/data/graph.json")) as GraphSchema;
  initGraph(data);

  const container = document.getElementById("cytoscape-container");
  // This is null in pages that don't have a cytoscape canvas (e.g. the home
  // page).
  if (container) {
    initSubgraph(container);
  }

  // Initialize search bar.
  const search = createSearchFunction(data.elements.nodes);
  const box = document.getElementById("placeholder-search-box") as Element;
  initSearchBox(box, search);

  // Render current page.
  updateView();
}

// Change value in clipboard when copying logo.
function initLogo() {
  const logo = document.querySelector("header > nav > a.logo");
  logo?.addEventListener("copy", (event: Event) => {
    (event as ClipboardEvent).clipboardData?.setData("text/plain", "palasimi");
    event.preventDefault();
  });
}

main();
