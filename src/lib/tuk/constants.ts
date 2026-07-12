import type {
  Category,
  CategoryMeta,
  SpendEmotionMeta,
  ThemeName,
  ThemePalette,
} from "./types";

export const CATEGORIES: Record<Category, CategoryMeta> = {
  식단: { color: "#E8A24C", angle: -72 },
  감정: { color: "#7C9EFF", angle: -43 },
  건강: { color: "#B39DDB", angle: -14 },
  할일: { color: "#FF6F91", angle: 14 },
  소비: { color: "#5FD9B4", angle: 43 },
  관계: { color: "#FFD76F", angle: 72 },
};

export const SUBTAG_CAT: Record<string, Category> = {
  혼밥: "식단",
  야식: "식단",
  카페인: "식단",
  배달: "식단",
  과식: "식단",
  기분좋음: "감정",
  무기력: "감정",
  스트레스: "감정",
  불안: "감정",
  우울: "감정",
  설렘: "감정",
  외로움: "감정",
  할일: "할일",
  약속: "할일",
  공부: "할일",
  마감: "할일",
  소비: "소비",
  충동구매: "소비",
  필요소비: "소비",
  절약: "소비",
  친구: "관계",
  가족: "관계",
  연인: "관계",
  갈등: "관계",
  생리: "건강",
  병원: "건강",
  운동: "건강",
  수면: "건강",
  피로: "건강",
  감기: "건강",
};

// 태그가 속한 카테고리. 사전에 없는(=AI가 자유롭게 지은) 태그는 그 기록의
// 대표 카테고리(fallback)로 본다. 이걸로 한 기록의 태그들이 각자 제 가지에 걸린다.
export function catOfTag(tag: string, fallback: Category | null): Category | null {
  return SUBTAG_CAT[tag] ?? fallback;
}

export const NEGATIVE_TAGS = ["무기력", "스트레스"];

// 소비 감정 색 (다크 배경과 어울리는 클레이 톤온톤)
export const SPEND_EMOTION: Record<string, SpendEmotionMeta> = {
  필요: { color: "#7B9E8E", ink: "#0E1613", level: 1 },
  스트레스: { color: "#D98E5A", ink: "#241206", level: 2 },
  충동: { color: "#C0492E", ink: "#FCEAE2", level: 3 },
};

export const EMPTY_DAY = "#242424";

export const ALL_SUBTAGS = Object.keys(SUBTAG_CAT).filter((t) => t !== "필요소비");

// 소비 색 캘린더 시드 (6월, day -> 감정)
export const spendSeed: Record<number, string> = {
  2: "필요", 3: "충동", 5: "필요", 6: "스트레스", 9: "필요", 10: "충동",
  12: "필요", 13: "스트레스", 19: "충동", 20: "스트레스", 24: "필요", 27: "충동", 30: "필요",
};

export const ONBOARD = [
  { big: "안 써도\n괜찮아요", small: "다이어리 앱, 가계부 앱, 습관 앱...\n깔았다 며칠 만에 관둔 적 있죠?\n툭은 매일 쓰라고 하지 않아요." },
  { big: "생각나면\n그냥 던져요", small: "먹은 것, 산 것, 기분, 할 일 — 뭐든요.\n정리는 AI가 알아서 할게요.\n당신은 던지기만 하면 돼요." },
  { big: "띄엄띄엄 살아도\n기록은 남아요", small: "며칠 빼먹어도 잔소리 없어요.\n한 달에 한 번, 당신이 던진 것들이\n한 그루 나무로 자라나요." },
];

// 모노톤 미니멀 (스레드 감성): 그래파이트/화이트 베이스에 색은 콘텐츠(태그·나무)에만.
// forest: 깊은 숲 다크그린 베이스 + 따뜻한 크림 — 나무/기록 아이덴티티를 색으로 밀어붙인 안.
export const THEMES: Record<ThemeName, ThemePalette> = {
  dark: {
    bg: "#101010", card: "#181818", cardAlt: "#141414", line: "#2A2A2A", lineSoft: "#3A3A3A",
    text: "#F3F5F7", sub: "#8F8F8F", dim: "#5F5F5F", invBg: "#F3F5F7", invText: "#101010",
    chipDim: "#242424", treeSky: "linear-gradient(180deg,#171A18 0%,#131514 60%,#0F1110 100%)",
    trunk: "#4A4038", skyInk: "#7E8883", fruitStroke: "#0F1110",
  },
  forest: {
    bg: "#0E1512", card: "#16201B", cardAlt: "#111A15", line: "#24312A", lineSoft: "#33443A",
    text: "#F2EFE6", sub: "#8FA096", dim: "#5E6F64", invBg: "#F2EFE6", invText: "#0E1512",
    chipDim: "#1F2B24", treeSky: "linear-gradient(180deg,#14211A 0%,#101B15 60%,#0C1510 100%)",
    trunk: "#5A4632", skyInk: "#7FA08C", fruitStroke: "#0C1510",
  },
  light: {
    bg: "#FAFAFA", card: "#FFFFFF", cardAlt: "#F2F2F2", line: "#E7E7E7", lineSoft: "#D8D8D8",
    text: "#0F0F0F", sub: "#8A8A8A", dim: "#B8B8B8", invBg: "#0F0F0F", invText: "#FFFFFF",
    chipDim: "#F0F0F0", treeSky: "linear-gradient(180deg,#EFF2F0 0%,#EAEEEB 60%,#E3E8E4 100%)",
    trunk: "#7C6F60", skyInk: "#7E8883", fruitStroke: "#FFFFFF",
  },
};

// 던진 직후 AI가 가끔 건네는 관찰 (판단 아님)
export const AI_REACTIONS: Record<string, string[]> = {
  야식: ["어제도 밤에 뭐 먹지 않았어요?ㅎㅎ", "밤이 길긴 하죠."],
  충동구매: ["오늘도 질렀군요. 뭐, 그럴 수 있죠.", "지갑이 좀 바빴네요."],
  무기력: ["오늘 좀 축 처졌구나. 알겠어요.", "그런 날이죠."],
  카페인: ["오늘 몇 잔째예요?ㅎㅎ", "잠은 좀 잤어요?"],
  친구: ["누구 만났나 봐요. 좋았겠다.", "사람 만난 날이네요."],
};
