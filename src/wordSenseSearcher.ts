// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (c) 2023 Levi Gruspe

// WordSense searcher.

import { Searcher, SearchFunction, Suggestion } from "@palasimi/search";

import { GraphNode } from "./schema";

// Used to search for word senses fuzzily.
export class WordSenseSearcher extends Searcher<GraphNode> {
  constructor(docs: GraphNode[] = []) {
    const keys = [
      {
        name: "data.word",
        weight: 2,
      },
      {
        name: "data.sense",
        weight: 1,
      },
    ];
    super(keys, docs);
  }
}

// Converts graph node into a suggestion.
function toSuggestion(node: GraphNode): Suggestion {
  const { id, word, sense } = node.data;
  return {
    title: word,
    body: sense,
    url: `/graph#/${id}`,
  };
}

// Creates a search function for the search input.
// This function is blocking, so it's best to run this inside a web worker.
// The return value is a search function.
// This function can be slow, too, so it should also be run inside a web
// worker.
export function createSearchFunction(nodes: GraphNode[]): SearchFunction {
  if (!window.Worker) {
    // Fallback
    const searcher = new WordSenseSearcher(nodes);
    return function search(query: string) {
      const results = searcher.search(query);
      return Promise.resolve(results.map(toSuggestion));
    };
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
    return result.map(toSuggestion);
  };
}
