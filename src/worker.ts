// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (c) 2023 Levi Gruspe

// Usage:
// ```
// const worker = new Worker("/worker.js");
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

import { initWorker } from "@palasimi/search";
import { WordSenseSearcher } from "./wordSenseSearcher";

initWorker(new WordSenseSearcher());
