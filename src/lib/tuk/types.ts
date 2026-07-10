export type Category = "식단" | "감정" | "할일" | "소비" | "관계";
export type SpendEmotion = "필요" | "스트레스" | "충동";

export interface Entry {
  id: string;
  text: string;
  tags: string[];
  createdAt: string;
  risk: boolean;
  spendEmotion: SpendEmotion | null;
  category: Category | null;
}

export type ThemeName = "dark" | "light";

export interface ThemePalette {
  bg: string;
  card: string;
  cardAlt: string;
  line: string;
  lineSoft: string;
  text: string;
  sub: string;
  dim: string;
  invBg: string;
  invText: string;
  chipDim: string;
  treeSky: string;
  trunk: string;
  skyInk: string;
  fruitStroke: string;
}

export interface CategoryMeta {
  color: string;
  angle: number;
}

export interface SpendEmotionMeta {
  color: string;
  ink: string;
  level: number;
}

export interface CatData {
  total: number;
  subs: Record<string, number>;
}
