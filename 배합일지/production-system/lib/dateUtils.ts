export function formatKoreanDateTime(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");

  // 오전/오후 판별
  const period = hours < 12 ? "오전" : "오후";
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  const formattedHours = String(displayHours).padStart(2, "0");

  return `${year}.${month}.${day} ${period} ${formattedHours}:${minutes}`;
}
