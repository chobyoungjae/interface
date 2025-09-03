export function formatKoreanDateTime(date: Date = new Date()): string {
  // 한국 시간대(KST, UTC+9)로 변환
  const koreaTime = new Date(date.toLocaleString("en-US", {timeZone: "Asia/Seoul"}));
  
  const year = koreaTime.getFullYear();
  const month = koreaTime.getMonth() + 1; // 패딩 제거
  const day = koreaTime.getDate(); // 패딩 제거
  const hours = koreaTime.getHours();
  const minutes = String(koreaTime.getMinutes()).padStart(2, "0");
  const seconds = String(koreaTime.getSeconds()).padStart(2, "0");

  // 오전/오후 판별
  const period = hours < 12 ? "오전" : "오후";
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours === 12 ? 12 : hours;

  return `${year}. ${month}. ${day} ${period} ${displayHours}:${minutes}:${seconds}`;
}
