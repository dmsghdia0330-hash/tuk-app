import { CATEGORIES } from "@/lib/tuk/constants";
import type { CatData, Category } from "@/lib/tuk/types";

export default function MiniTree({
  catData,
  maxCat,
  size = 90,
  trunk,
  fruitStroke,
}: {
  catData: Record<Category, CatData>;
  maxCat: number;
  size?: number;
  trunk: string;
  fruitStroke: string;
}) {
  return (
    <svg viewBox="0 0 120 120" width={size} height={size} style={{ display: "block" }}>
      <path d="M57 112 Q58 88 59 72 Q60 64 59.5 58 L60.5 58 Q61 64 62 72 Q63 88 64 112 Z" fill={trunk} />
      {Object.entries(CATEGORIES).map(([cat, meta]) => {
        const data = catData[cat as Category] || { total: 0, subs: {} };
        if (data.total === 0) return null;
        const strength = data.total / maxCat, len = 24 + strength * 22, rad = (meta.angle * Math.PI) / 180;
        const bx = 60 + Math.sin(rad) * len, by = 60 - Math.cos(rad) * len * 0.9, bw = 1.5 + strength * 3;
        return (
          <g key={cat}>
            <path d={`M60 62 Q${(60 + bx) / 2 + Math.sin(rad) * 4} ${(62 + by) / 2} ${bx} ${by}`} stroke={trunk} strokeWidth={bw} fill="none" strokeLinecap="round" />
            <circle cx={bx} cy={by} r={7 + strength * 9} fill={meta.color} opacity="0.2" />
            {Object.entries(data.subs).map(([sub, cnt], i) => {
              const a = (i / Math.max(Object.keys(data.subs).length, 1)) * Math.PI * 2 + rad, rr = 5 + strength * 7;
              return <circle key={sub} cx={bx + Math.cos(a) * rr} cy={by + Math.sin(a) * rr} r={1.5 + Math.min(cnt, 6) * 0.7} fill={meta.color} stroke={fruitStroke} strokeWidth="0.5" />;
            })}
          </g>
        );
      })}
    </svg>
  );
}
