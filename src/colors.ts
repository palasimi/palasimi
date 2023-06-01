// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (c) 2023 Levi Gruspe

type ColorPalette = {
  colorA: string;
  colorB: string;
  colorC: string;
  colorD: string;
  colorE: string;
};

// Gets color palette from active theme (see `index.css`).
// The palette goes from darkest (`colorA`) to lightest (`colorE`).
export function getThemeColors(): ColorPalette {
  const style = window.getComputedStyle(document.documentElement);
  return {
    colorA: style.getPropertyValue("--color-a") || "#8d5524",
    colorB: style.getPropertyValue("--color-b") || "#c68642",
    colorC: style.getPropertyValue("--color-c") || "#e0ac69",
    colorD: style.getPropertyValue("--color-d") || "#f1c27d",
    colorE: style.getPropertyValue("--color-e") || "#ffdbac",
  };
}
