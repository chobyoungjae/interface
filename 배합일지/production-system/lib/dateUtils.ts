export function formatKoreanDateTime(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // 패딩 제거
  const day = date.getDate(); // 패딩 제거
  const hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  // 오전/오후 판별
  const period = hours < 12 ? "오전" : "오후";
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours === 12 ? 12 : hours;

  return `${year}. ${month}. ${day} ${period} ${displayHours}:${minutes}:${seconds}`;
}
