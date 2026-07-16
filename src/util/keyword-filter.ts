export function splitIntoKeywords(query: string): string[] {
  return query.split(/\s+/).map((keyword) => keyword.trim().toLowerCase());
}

export function matchesAllKeywords(
  keywords: string[],
  searchableText: string[],
): boolean {
  const lowerCased = searchableText.map((text) => text.toLowerCase());

  return keywords.every((keyword) =>
    lowerCased.some((text) => text.includes(keyword)),
  );
}

export function filterByKeywords<T>(
  items: readonly T[],
  query: string,
  getSearchableText: (item: T) => string[],
): T[] {
  const keywords = splitIntoKeywords(query);

  if (keywords.every((keyword) => keyword.length === 0)) {
    return [...items];
  }

  return items.filter((item) =>
    matchesAllKeywords(keywords, getSearchableText(item)),
  );
}
