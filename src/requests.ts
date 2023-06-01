// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (c) 2023 Levi Gruspe

export async function fetchJSON<T>(pathname: string): Promise<T> {
  const response = await fetch(pathname);
  return response.json();
}
