export type Category = "식단" | "감정" | "할일" | "소비" | "관계";

export interface Entry {
  id: number;
  month: string;
  text: string;
  tags: string[];
  time: string;
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
