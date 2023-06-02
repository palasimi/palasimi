// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (c) 2023 Levi Gruspe

import { choose } from "./random";

type GraphRoute = {
  type: "graph";
  value: string; // ID of a graph node
};

type PageRoute = {
  type: "page";
};

type Route = GraphRoute | PageRoute;

// Gets route of the current page location.
// If the graph route leads to an invalid node ID, returns another random node
// ID instead.
export function getRoute(): Route {
  const path = window.location.pathname.replace(/\.html$/, "");
  if (!path.endsWith("graph")) {
    return { type: "page" };
  }

  // The expected location of a graph page is "/graph#/<id>/<slug>".
  // The slug is optional.

  // Remove leading "#/".
  let hash = window.location.hash.slice(1);
  if (hash.startsWith("/")) {
    hash = hash.slice(1);
  }

  // Cut off slug.
  let index = hash.indexOf("/");
  if (index < 0) {
    index = hash.length;
  }

  const prefix = hash.slice(0, index);
  const id = Number(prefix);
  if (prefix.length > 0 && !isNaN(id) && window.graph.hasNode(id)) {
    return {
      type: "graph",
      value: prefix,
    };
  }

  // Return a random node in the graph if the ID is not known.
  return {
    type: "graph",
    value: choose(window.graph.nodes()),
  };
}
