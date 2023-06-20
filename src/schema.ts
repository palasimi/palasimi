// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (c) 2023 Levi Gruspe

// Type definitions for JSON objects from the server.

export type GraphNode = {
  data: {
    id: string; // Actually a number, but gets turned into a string.
    word: string;
    sense: string;
  };
};

export type GraphEdge = {
  data: {
    source: string;
    target: string;
    weight: number;
  };
};

// data/graph.json
export type GraphSchema = {
  elements: {
    nodes: GraphNode[];
    edges: GraphEdge[];
  };
};
