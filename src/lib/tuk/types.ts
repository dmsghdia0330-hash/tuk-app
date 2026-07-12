export type Category = "식단" | "감정" | "할일" | "소비" | "관계" | "건강";
export type SpendEmotion = "필요" | "스트레스" | "충동";

export interface Entry {
  id: string;
  text: string;
  tags: string[];
  createdAt: string;
  risk: boolean;
  spendEmotion: SpendEmotion | null;
  category: Category | null;
  // AI가 뽑아낸 등장 인물(이름/호칭). 관계 가지의 '자주 떠올린 사람'에 쓴다.
  people: string[];
  // 화면에 바로 그릴 수 있는 이미지 src. 게스트는 data-URL, 로그인 사용자는
  // load() 시 만든 서명 URL이 담긴다. 서버 DB엔 이 문자열이 아니라 has_image
  // 불린만 저장하고, 파일 경로는 {userId}/{entryId}.jpg 로 결정된다.
  image: string | null;
}

export type ThemeName = "dark" | "forest" | "light";

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
