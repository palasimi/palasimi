// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (c) 2023 Levi Gruspe

import { initServer } from "@palasimi/workers";

import { GraphNode } from "./schema";
import { WordSenseSearcher } from "./wordSenseSearcher";

const searcher = new WordSenseSearcher();

initServer({
  index: (docs) => searcher.index(docs as GraphNode[]),
  search: (query) => searcher.search(query as string),
});
