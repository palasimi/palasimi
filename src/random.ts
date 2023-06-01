// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (c) 2023 Levi Gruspe

// Pick a random item from the array.
export function choose<T>(items: T[]): T {
  const index = Math.floor(Math.random() * items.length);
  return items[index];
}
