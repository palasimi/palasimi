// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (c) 2023 Levi Gruspe

import { GraphSchema } from "./schema";
import { graphLayout } from "./subgraph";

import Graph from "graphology";
import { NotFoundGraphError } from "graphology";
import { forEachConnectedComponent } from "graphology-components";
import { subgraph as induceSubgraph } from "graphology-operators";
import { bfsFromNode } from "graphology-traversal";

declare global {
  interface Window {
    graph: Graph;
    show: (id: string) => void;
  }
}

type CyNodeData = {
  id: string;
  [key: string]: unknown;
};

type CyEdgeData = {
  source: string;
  target: string;
  [key: string]: unknown;
};

type CyNode = {
  group: "nodes";
  data: CyNodeData;
};

type CyEdge = {
  group: "edges";
  data: CyEdgeData;
};

type CyElement = CyNode | CyEdge;

interface Attributes {
  [key: string]: unknown;
}

function createGraph(options: GraphSchema): Graph {
  const graph = new Graph({
    allowSelfLoops: false,
    multi: false,
    type: "undirected",
  });
  for (const node of options.elements.nodes) {
    const { id, word, sense } = node.data;
    graph.addNode(id, { word, sense });
  }
  for (const edge of options.elements.edges) {
    const { source, target, weight } = edge.data;
    graph.addEdge(source, target, { weight });
  }

  // Compute connected components.
  // Nodes are tagged with a component number if the component they belong to
  // isn't too big.
  let i = 0;
  forEachConnectedComponent(graph, (component) => {
    if (component.length > 50) {
      return;
    }
    for (const node of component) {
      graph.setNodeAttribute(node, "component", i);
    }
    i++;
  });
  return graph;
}

// Generates nodes reachable from the given node.
// If the source node belongs to a very large component, only its neighboring
// nodes are generated.
function* getComponent(graph: Graph, source: string): Iterable<string> {
  const set = new Set([source]);
  bfsFromNode(graph, source, (node, attributes, depth) => {
    if (attributes.component == null && depth > 2) {
      return true;
    }
    set.add(node);
  });
  yield* set;
}

// Generates graph elements in cytoscape format (nodes and edges).
// Adds additional static attributes needed for styling.
function* toCytoscape(graph: Graph): Iterable<CyElement> {
  // TODO should this be async?
  const nodeMapper = (id: string, attributes: Attributes) => {
    const { word, sense } = attributes;
    return {
      group: "nodes",
      data: {
        ...attributes,
        id,
        label: `${word}: ${sense}`,
      },
    };
  };

  const edgeMapper = (
    id: string,
    attributes: Attributes,
    source: string,
    target: string
  ) => {
    const { weight } = attributes;

    // The higher the weight, the thicker the edge.
    // Maps [0, 80] to [0, 10].
    // 80 is used as the upper bound, because only a very small number of edges
    // have weights > 80.
    const width = Math.min(10, Math.max(2, (weight as number) / 8));
    return {
      group: "edges",
      data: {
        ...attributes,
        id,
        source,
        target,
        width: `${width}px`,
      },
    };
  };

  yield* graph.mapNodes(nodeMapper) as Iterable<CyNode>;
  yield* graph.mapEdges(edgeMapper) as Iterable<CyEdge>;
}

// Show subgraph of neighborhood of given node.
// Relies on global graph and subgraph objects.
// Don't call before calling `init`.
export function show(id: string) {
  try {
    const neighborhood = Array.from(getComponent(window.graph, id));
    const subgraph = induceSubgraph(window.graph, neighborhood);
    const elements = Array.from(toCytoscape(subgraph));

    window.subgraph.remove("*");
    window.subgraph.add(elements);
    window.subgraph.layout(graphLayout()).run();

    // Pre-select node.
    window.subgraph.getElementById(id).select();
  } catch (error) {
    if (error instanceof NotFoundGraphError) {
      alert(`The following node ID does not exist: ${id}`);
      return;
    }
  }
}

// Initializes global objects.
export function init(data: GraphSchema) {
  window.graph = createGraph(data);

  // Expose some useful functions.
  window.show = show;
}
