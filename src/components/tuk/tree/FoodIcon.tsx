export default function FoodIcon({
  type,
  size = 40,
  color = "#E8A24C",
}: {
  type: string;
  size?: number;
  color?: string;
}) {
  const icons: Record<string, React.ReactNode> = {
    치킨: <path d="M20 8c-6 0-10 4-10 9 0 4 3 7 7 8l-2 6 4-1 3 1 3-1 4 1-2-6c4-1 7-4 7-8 0-5-4-9-10-9z" />,
    라면: <g><ellipse cx="20" cy="24" rx="13" ry="7" /><path d="M9 20c3-8 5-10 5-14M15 18c2-7 4-9 4-13M21 18c2-7 4-9 4-13M27 20c3-8 4-9 4-13" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" /></g>,
    김치찌개: <g><path d="M8 18h24l-2 12a3 3 0 01-3 3H13a3 3 0 01-3-3z" /><path d="M14 12c0-3 1-4 1-6M20 12c0-3 1-4 1-6M26 12c0-3 1-4 1-6" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" /></g>,
    커피: <g><path d="M9 12h18v9a9 9 0 01-9 9 9 9 0 01-9-9z" /><path d="M27 14h3a3 3 0 010 6h-3" stroke={color} strokeWidth="2.5" fill="none" /><path d="M14 6c0 2-1 2-1 4M20 6c0 2-1 2-1 4" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" /></g>,
    빵: <path d="M10 16c0-5 4-8 10-8s10 3 10 8c2 0 3 2 3 4s-1 4-3 4v6a2 2 0 01-2 2H12a2 2 0 01-2-2v-6c-2 0-3-2-3-4s1-4 3-4z" />,
    떡볶이: <g><ellipse cx="20" cy="22" rx="13" ry="8" /><rect x="14" y="15" width="4" height="8" rx="2" fill={color} opacity="0.5" /><rect x="21" y="16" width="4" height="7" rx="2" fill={color} opacity="0.5" /></g>,
    배달: <g><rect x="8" y="14" width="16" height="12" rx="2" /><path d="M24 18h4l4 4v4h-8z" /><circle cx="13" cy="28" r="3" fill={color} /><circle cx="27" cy="28" r="3" fill={color} /></g>,
    밥: <g><path d="M8 20a12 8 0 0124 0z" /><path d="M6 20h28v2a3 3 0 01-3 3H9a3 3 0 01-3-3z" fill={color} opacity="0.5" /></g>,
  };
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} fill={color} style={{ display: "block" }}>
      {icons[type] || <circle cx="20" cy="20" r="12" />}
    </svg>
  );
}
