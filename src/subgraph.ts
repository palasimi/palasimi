// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (c) 2023 Levi Gruspe

import { getThemeColors } from "./colors";

import cytoscape from "cytoscape";
import fcose from "cytoscape-fcose";

cytoscape.use(fcose);

declare global {
  interface Window {
    subgraph: cytoscape.Core;
  }
}

const colors = getThemeColors();

const style: cytoscape.Stylesheet[] = [
  {
    selector: "*",
    style: {
      "font-family": "Merriweather, serif",
    },
  },
  {
    selector: "node",
    style: {
      label: "data(label)",
      "text-wrap": "wrap",
      "text-max-width": "200",
    },
  },
  {
    selector: "edge",
    style: {
      width: "data(width)",
      // @ts-ignore
      "line-opacity": (ele: cytoscape.Singular) => {
        // "selected" attributes gets set by an event handler.
        return ele.cy().data("selected") > 0 ? 0.2 : 0.5;
      },
    },
  },
  {
    selector: "node.highlight:unselected",
    style: {
      "background-color": colors.colorB,
    },
  },
  {
    selector: "edge.highlight:unselected",
    style: {
      "line-color": colors.colorB,
      "line-opacity": 0.8,
    },
  },
  {
    selector: "node:selected",
    style: {
      "background-color": colors.colorA,
    },
  },
  {
    selector: "edge:selected",
    style: {
      label: "data(weight)",
      "line-color": colors.colorB,
      "line-opacity": 0.8,
    },
  },
];

// Creates cytoscape object for subgraph to be rendered.
function createEmptySubgraph(container: HTMLElement): cytoscape.Core {
  const subgraph = cytoscape({
    container,
    style,
    selectionType: "additive",
  });

  // Counts number of selected nodes.
  // This is probably a costly operation, so it should be called sparingly.
  const countSelected = () => subgraph.nodes("node:selected").length;

  // Register events.
  subgraph.on("select", "node", (event) => {
    event.target.openNeighborhood().addClass("highlight");
    subgraph.data("selected", countSelected());
  });
  subgraph.on("unselect", "node", (event) => {
    const target = event.target;
    const isUnselected = (ele: cytoscape.Singular) => !ele.selected();
    for (const neighbor of target.openNeighborhood()) {
      if (neighbor.isEdge()) {
        if (neighbor.connectedNodes().every(isUnselected)) {
          neighbor.removeClass("highlight");
        }
      } else if (neighbor.openNeighborhood("node").every(isUnselected)) {
        neighbor.removeClass("highlight");
      }
    }
    subgraph.data("selected", countSelected());
  });

  subgraph.data("selected", countSelected());
  return subgraph;
}

// Initializes global subgraph.
export function initSubgraph(container: HTMLElement) {
  window.subgraph = createEmptySubgraph(container);
}

export function graphLayout(): cytoscapeFcose.FcoseLayoutOptions {
  return {
    name: "fcose",
    quality: "proof",
    nodeDimensionsIncludeLabels: true,

    // Makes higher-weight edges shorter.
    // Lengthen edges between high-degree nodes.
    idealEdgeLength: (edge: cytoscape.EdgeSingular) => {
      const sourceDegree = edge.source().degree(false);
      const targetDegree = edge.target().degree(false);
      return 200 - edge.data("weight") + sourceDegree * targetDegree;
    },
  };
}
