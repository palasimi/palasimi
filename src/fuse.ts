// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (c) 2023 Levi Gruspe

// Fuse wrapper.

import { Node } from "./schema";
import Fuse from "fuse.js";

// Creates Fuse object.
export function createFuse(nodes: Node[]): Fuse<Node> {
  const options = {
    keys: [
      {
        name: "data.word",
        weight: 2,
      },
      {
        name: "data.sense",
        weight: 1,
      },
    ],
    threshold: 0.3, // Stricter matches than the default 0.6
    ignoreLocation: true,
  };

  const index = Fuse.createIndex(options.keys, nodes);
  return new Fuse(nodes, options, index);
}

export function searchFuse(fuse: Fuse<Node>, query: string): Node[] {
  return fuse.search(query).map((result) => result.item);
}
