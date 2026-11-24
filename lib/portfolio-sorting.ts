export type DateSortDirection = "asc" | "desc";

export function sortByDate<T extends { id: string; title: string }>(
  items: T[],
  getDate: (item: T) => string | null | undefined,
  direction: DateSortDirection = "desc",
): T[] {
  return items
    .map((item, index) => ({ item, index, timestamp: validTimestamp(getDate(item)) }))
    .sort((a, b) => {
      if (a.timestamp === null && b.timestamp !== null) return 1;
      if (a.timestamp !== null && b.timestamp === null) return -1;
      if (a.timestamp !== null && b.timestamp !== null && a.timestamp !== b.timestamp) {
        return direction === "asc"
          ? a.timestamp - b.timestamp
          : b.timestamp - a.timestamp;
      }
      const titleOrder = a.item.title.localeCompare(b.item.title);
      return titleOrder || a.item.id.localeCompare(b.item.id) || a.index - b.index;
    })
    .map(({ item }) => item);
}

function validTimestamp(value: string | null | undefined): number | null {
  if (!value) return null;
  const match = /^(\d{4}-\d{2}-\d{2})(?:T.*)?$/.exec(value);
  if (!match) return null;
  const calendarDate = new Date(`${match[1]}T00:00:00.000Z`);
  if (
    !Number.isFinite(calendarDate.getTime()) ||
    calendarDate.toISOString().slice(0, 10) !== match[1]
  )
    return null;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : null;
}
