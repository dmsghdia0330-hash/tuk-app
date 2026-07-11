import { forwardRef, useId } from "react";
import { CATEGORIES } from "@/lib/tuk/constants";
import type { CatData, Category } from "@/lib/tuk/types";

// 종이를 오려 붙인 그림책 느낌의 나무. 카테고리마다 손가락처럼 펼쳐진 색종이 잎
// 다발이 트렁크 위에서 뻗어 나온다. 잎 색은 태그 색(CATEGORIES)과 동일.
const TRUNK_FILL = "#E9E0CC";
const TRUNK_EDGE = "#D4C6A8";

// 인덱스 기반 결정적 흔들림(렌더마다 잎이 요동치지 않게).
function jit(n: number): number {
  const x = Math.sin(n * 127.1) * 43758.5453;
  return x - Math.floor(x);
}

export interface Leaf {
  x: number;
  y: number;
  w: number;
  h: number;
  rx: number;
  transform: string;
}

// (bx,by)를 밑동으로 baseAngle 방향으로 spread만큼 부챗살처럼 펼친 잎들.
export function fanLeaves(bx: number, by: number, baseAngle: number, spread: number, count: number, length: number, halfW: number, seed: number): Leaf[] {
  const leaves: Leaf[] = [];
  for (let i = 0; i < count; i++) {
    const a = count === 1 ? baseAngle : baseAngle - spread / 2 + (spread * i) / (count - 1);
    const L = length * (0.82 + jit(seed * 7 + i * 3.1) * 0.34);
    const aa = a + (jit(seed * 5 + i * 2.7) * 9 - 4.5);
    leaves.push({ x: bx - halfW, y: by - L, w: halfW * 2, h: L, rx: halfW, transform: `rotate(${aa} ${bx} ${by})` });
  }
  return leaves;
}

interface Props {
  catData: Record<Category, CatData>;
  maxCat: number;
  size?: number; // 지정하면 그 크기, 없으면 컨테이너를 채움
  showLabels?: boolean;
  onBranch?: (cat: Category) => void;
}

const PaperTree = forwardRef<SVGSVGElement, Props>(function PaperTree(
  { catData, maxCat, size, showLabels = false, onBranch },
  ref
) {
  const uid = useId().replace(/:/g, "");
  const sizeStyle = size ? { width: size, height: size } : { width: "100%", height: "100%" };

  return (
    <svg
      ref={ref}
      viewBox="0 0 300 300"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block", ...sizeStyle }}
    >
      <defs>
        <filter id={`paper-${uid}`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="1.6" floodColor="#2A2418" floodOpacity="0.22" />
        </filter>
        <radialGradient id={`ground-${uid}`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#000" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#000" stopOpacity="0" />
        </radialGradient>
      </defs>

      <ellipse cx="150" cy="288" rx="86" ry="12" fill={`url(#ground-${uid})`} />

      {/* 찢은 크림 종이 줄기 */}
      <g filter={`url(#paper-${uid})`}>
        <path d="M141 290 Q144 236 147 196 Q148 176 149 160 Q150 156 151 160 Q152 176 153 196 Q156 236 159 290 Z" fill={TRUNK_FILL} />
        <path d="M151 160 Q152 176 153 196 Q156 236 159 290 L154 290 Q151 234 149 196 Q148 176 149 161 Z" fill={TRUNK_EDGE} />
      </g>

      {(Object.keys(CATEGORIES) as Category[]).map((cat, ci) => {
        const meta = CATEGORIES[cat];
        const data = catData[cat] || { total: 0, subs: {} };
        if (data.total === 0) return null;
        const strength = Math.min(data.total / maxCat, 1);
        const rad = (meta.angle * Math.PI) / 180;
        const baseDist = 18 + strength * 10;
        const bx = 150 + Math.sin(rad) * baseDist;
        const by = 160 - Math.cos(rad) * baseDist;
        const count = 4 + Math.round(strength * 4);
        const length = 34 + strength * 40;
        const halfW = 4 + strength * 3.5;
        const leaves = fanLeaves(bx, by, meta.angle, 46, count, length, halfW, ci + 1);
        const tipx = bx + Math.sin(rad) * (length + 14);
        const tipy = by - Math.cos(rad) * (length + 14);
        return (
          <g key={cat} style={{ cursor: onBranch ? "pointer" : "default" }} onClick={() => onBranch?.(cat)}>
            {/* 밑동에서 잎다발로 이어지는 짧은 가지 */}
            <path d={`M150 162 Q${(150 + bx) / 2} ${(162 + by) / 2} ${bx} ${by}`} stroke={TRUNK_FILL} strokeWidth={2 + strength * 3} fill="none" strokeLinecap="round" />
            <g filter={`url(#paper-${uid})`}>
              {leaves.map((l, i) => (
                <rect key={i} x={l.x} y={l.y} width={l.w} height={l.h} rx={l.rx} transform={l.transform} fill={meta.color} stroke="rgba(0,0,0,0.06)" strokeWidth="0.8" />
              ))}
            </g>
            {showLabels && (
              <text x={tipx} y={tipy} fill={meta.color} fontSize="12" textAnchor="middle" fontWeight="700" style={{ fontFamily: "'Pretendard',sans-serif" }}>{cat}</text>
            )}
          </g>
        );
      })}
    </svg>
  );
});

export default PaperTree;
