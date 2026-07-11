import PaperTree from "./PaperTree";
import type { CatData, Category } from "@/lib/tuk/types";

// 숲 뷰의 작은 나무 — 월 나무와 같은 종이-콜라주 결을, 라벨/클릭 없이 작게.
export default function MiniTree({
  catData,
  maxCat,
  size = 90,
}: {
  catData: Record<Category, CatData>;
  maxCat: number;
  size?: number;
}) {
  return <PaperTree catData={catData} maxCat={maxCat} size={size} />;
}
