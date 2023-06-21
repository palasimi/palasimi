// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (c) 2023 Levi Gruspe

// Web worker used by search.ts.
// Usage:
// ```
// worker.postMessage({
// 	name: "index",
// 	value: nodes,
// });
//
// worker.postMessage({
//  name: "search",
//  value: query,
// });
// ```

import { WordSenseSearcher } from "./wordSenseSearcher";

let searcher: WordSenseSearcher | null = null;

onmessage = (event) => {
  switch (event.data.name) {
    case "index":
      searcher = new WordSenseSearcher(event.data.value);
      break;
    case "search":
      postMessage({
        query: event.data.value,
        results: searcher?.search(event.data.value) || [],
      });
      break;
    default:
      break;
  }
};
