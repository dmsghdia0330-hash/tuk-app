import type { ThemePalette } from "@/lib/tuk/types";

// 큼직한 버블들이 은은한 후광 위에 모여 있는 뷰. 항목이 적어도 허전하지 않게
// 후광 배경 + 넉넉한 최소 크기로 채운다. 식단(태그)·관계(사람) 등에서 재사용.
export default function BubbleCloud({
  items,
  color,
  T,
  unit = "번",
}: {
  items: { label: string; count: number }[];
  color: string;
  T: ThemePalette;
  unit?: string;
}) {
  if (items.length === 0) return null;
  const sorted = [...items].sort((a, b) => b.count - a.count).slice(0, 9);
  const mx = Math.max(...sorted.map((i) => i.count), 1);
  return (
    <div style={{ position: "relative", padding: "22px 8px 18px", display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", justifyContent: "center", minHeight: 130 }}>
      <div aria-hidden style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse 72% 82% at 50% 48%, ${color}18, transparent 72%)`, pointerEvents: "none" }} />
      {sorted.map(({ label, count }) => {
        const size = 54 + (count / mx) * 40; // 54~94
        const fs = label.length > 3 ? 12.5 : label.length > 2 ? 14 : 15.5;
        return (
          <div key={label} style={{ position: "relative", width: size, height: size, borderRadius: "50%", background: color + "24", border: `1.5px solid ${color}77`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 1 }}>
            <span style={{ fontSize: fs, fontWeight: 700, color, lineHeight: 1.15, textAlign: "center", padding: "0 4px", wordBreak: "keep-all" }}>{label}</span>
            <span style={{ fontSize: 10.5, color: T.dim }}>{count}{unit}</span>
          </div>
        );
      })}
    </div>
  );
}
