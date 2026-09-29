export function getDaysUntilAnchor(anchorDay: number): string {
  const today = new Date();
  const currentDay = today.getDate();
  if (currentDay === anchorDay) return "Due today";
  if (currentDay < anchorDay) {
    const diff = anchorDay - currentDay;
    return `In ${diff} day${diff === 1 ? "" : "s"}`;
  }
  const lastDayThisMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const diff = lastDayThisMonth - currentDay + anchorDay;
  return `In ${diff} days`;
}
