// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (c) 2023 Levi Gruspe

const cacheName = "palasimi-v1.0.6";

const assets = [
  "/",
  "/about",
  "/graph",

  "/about.html",
  "/graph.html",
  "/index.html",

  "/data/graph.json",

  "/fonts/Merriweather/Merriweather-Regular.ttf",

  "/index.css",
  "/index.js",
];

self.addEventListener("install", (event) => {
  (event as ExtendableEvent).waitUntil(
    caches.open(cacheName).then((cache) => cache.addAll(assets))
  );
});

self.addEventListener("fetch", async (event) => {
  const request = (event as FetchEvent).request;
  const response = await caches.match(request);
  if (response != null) {
    return response;
  }
  return fetch(request);
});
