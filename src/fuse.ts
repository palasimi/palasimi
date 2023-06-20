// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (c) 2023 Levi Gruspe

// Fuse wrapper.

import Fuse from "fuse.js";

export type SearchKey = {
  name: string;
  weight: number;
};

// Fuse wrapper.
export class Searcher<DocumentType> {
  private fuse: Fuse<DocumentType>;

  constructor(docs: DocumentType[], keys: SearchKey[]) {
    const options = {
      keys,
      threshold: 0.3, // Stricter matches than the default 0.6
      ignoreLocation: true,
    };
    const index = Fuse.createIndex(keys, docs);
    this.fuse = new Fuse(docs, options, index);
  }

  // Run the query and return the results.
  search(query: string): DocumentType[] {
    return this.fuse.search(query).map((result) => result.item);
  }
}
