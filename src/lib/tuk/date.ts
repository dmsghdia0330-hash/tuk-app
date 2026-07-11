export function monthKeyOf(value: string | Date): string {
  const d = typeof value === "string" ? new Date(value) : value;
  return `${d.getFullYear()}-${d.getMonth() + 1}`;
}

export function monthLabelOf(key: string): string {
  return `${key.split("-")[1]}월`;
}

export function dayLabelOf(value: string | Date): string {
  const d = typeof value === "string" ? new Date(value) : value;
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

// 피드용 상대 시간: "방금" → "N분 전" → "N시간 전" → 그 이후는 시각(오후 9:14).
// 날짜는 dayGroupLabelOf가 그룹 헤더로 보여주므로 여기선 시간까지만 다룬다.
export function timeLabelOf(value: string | Date, now: Date = new Date()): string {
  const d = typeof value === "string" ? new Date(value) : value;
  const diffMin = Math.floor((now.getTime() - d.getTime()) / 60000);
  if (diffMin < 1) return "방금";
  if (diffMin < 60) return `${diffMin}분 전`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24 && d.getDate() === now.getDate()) return `${diffHour}시간 전`;
  const h = d.getHours();
  const ampm = h < 12 ? "오전" : "오후";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${ampm} ${h12}:${String(d.getMinutes()).padStart(2, "0")}`;
}

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function dateKeyOf(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

// 피드 날짜 그룹 헤더: 오늘 / 어제 / M월 D일 (요일) — 해가 다르면 연도까지.
export function dayGroupLabelOf(value: string | Date, now: Date = new Date()): string {
  const d = typeof value === "string" ? new Date(value) : value;
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (dateKeyOf(d) === dateKeyOf(now)) return "오늘";
  if (dateKeyOf(d) === dateKeyOf(yesterday)) return "어제";
  const base = `${d.getMonth() + 1}월 ${d.getDate()}일 (${WEEKDAYS[d.getDay()]})`;
  return d.getFullYear() === now.getFullYear() ? base : `${d.getFullYear()}년 ${base}`;
}

// 같은 그룹인지 판정할 때 쓰는 키 (렌더링에서 헤더 삽입 위치 계산용)
export function dayKeyOf(value: string | Date): string {
  const d = typeof value === "string" ? new Date(value) : value;
  return dateKeyOf(d);
}
