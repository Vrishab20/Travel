export function eachDateInclusive(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const cursor = new Date(`${startDate}T12:00:00Z`);
  const end = new Date(`${endDate}T12:00:00Z`);

  if (Number.isNaN(cursor.getTime()) || Number.isNaN(end.getTime()) || cursor > end) {
    return dates;
  }

  while (cursor <= end) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return dates;
}

export function formatDayLabel(
  date: string,
  index: number,
  isArrival: boolean,
  isDeparture: boolean,
): string {
  if (isArrival) return `Day ${index + 1} · Arrival`;
  if (isDeparture) return `Day ${index + 1} · Departure`;
  return `Day ${index + 1} · ${date}`;
}

export function removeItineraryItem(
  days: Array<{ items: Array<{ id: string }> }>,
  itemId: string,
) {
  return days.map((day) => ({
    ...day,
    items: day.items.filter((item) => item.id !== itemId),
  }));
}
