// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (c) 2023 Levi Gruspe

// WordSense searcher.

import { Searcher } from "./fuse";
import { GraphNode } from "./schema";

// Used to search for word senses fuzzily.
export class WordSenseSearcher extends Searcher<GraphNode> {
  constructor(docs: GraphNode[]) {
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
    super(docs, keys);
  }
}
