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

import { createFuse, searchFuse } from "./fuse";
import { Node } from "./schema";

import Fuse from "fuse.js";

let fuse: Fuse<Node> | null = null;

onmessage = (event) => {
  switch (event.data.name) {
    case "index":
      fuse = createFuse(event.data.value);
      break;
    case "search":
      postMessage({
        query: event.data.value,
        results: fuse ? searchFuse(fuse, event.data.value) : [],
      });
      break;
    default:
      break;
  }
};
