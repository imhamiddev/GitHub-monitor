import { format, isSameDay, isYesterday, subDays } from "date-fns";

export function groupByDay<T extends { createdAt: Date }>(
  items: T[]
): { label: string; items: T[] }[] {
  const today = new Date();
  const groups: { label: string; items: T[] }[] = [];

  for (const item of items) {
    let label: string;
    if (isSameDay(item.createdAt, today)) {
      label = "Today";
    } else if (isYesterday(item.createdAt)) {
      label = "Yesterday";
    } else {
      label = format(item.createdAt, "MMMM d, yyyy");
    }

    const lastGroup = groups[groups.length - 1];
    if (lastGroup && lastGroup.label === label) {
      lastGroup.items.push(item);
    } else {
      groups.push({ label, items: [item] });
    }
  }

  return groups;
}

// Re-exported for convenience where callers need "N days ago" as a Date.
export { subDays };
