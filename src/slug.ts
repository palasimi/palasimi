// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (c) 2023 Levi Gruspe

export type WordSense = {
  word: string;
  sense: string;
};

// ] and \ are escaped.
const specialCharacters = /[\]\\/#$%&+,:;<=>?@[^`{|}' ]+/;

// Creates a URL slug for a graph node.
// The result is safe to use in a URI.
export function slug(wordSense: WordSense): string {
  const { word, sense } = wordSense;
  let slug = `${word}-${sense}`;

  for (;;) {
    const newSlug = slug.replace(specialCharacters, "-");
    if (slug === newSlug) {
      break;
    }
    slug = newSlug;
  }
  return encodeURIComponent(slug);
}
