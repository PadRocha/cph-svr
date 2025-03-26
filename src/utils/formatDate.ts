export function formatDateTime(): string {
  const now = Temporal.Now.zonedDateTimeISO();
  const year = now.year.toString();
  const month = now.month.toString().padStart(2, "0");
  const day = now.day.toString().padStart(2, "0");
  const hours = now.hour.toString().padStart(2, "0");
  const minutes = now.minute.toString().padStart(2, "0");
  const seconds = now.second.toString().padStart(2, "0");
  const milliseconds = now.millisecond.toString().padStart(3, "0");

  return `${year}-${month}-${day}_${hours}-${minutes}-${seconds}-${milliseconds}`;
}
