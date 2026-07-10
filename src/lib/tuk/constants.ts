import type {
  Category,
  CategoryMeta,
  SpendEmotionMeta,
  ThemeName,
  ThemePalette,
} from "./types";

export const CATEGORIES: Record<Category, CategoryMeta> = {
  식단: { color: "#E8A24C", angle: -55 },
  감정: { color: "#7C9EFF", angle: -20 },
  할일: { color: "#FF6F91", angle: 15 },
  소비: { color: "#5FD9B4", angle: 50 },
  관계: { color: "#FFD76F", angle: 80 },
};

export const SUBTAG_CAT: Record<string, Category> = {
  혼밥: "식단",
  야식: "식단",
  카페인: "식단",
  기분좋음: "감정",
  무기력: "감정",
  스트레스: "감정",
  할일: "할일",
  약속: "할일",
  소비: "소비",
  충동구매: "소비",
  필요소비: "소비",
  친구: "관계",
};

export const NEGATIVE_TAGS = ["무기력", "스트레스"];

// 소비 감정 색 (다크 배경과 어울리는 클레이 톤온톤)
export const SPEND_EMOTION: Record<string, SpendEmotionMeta> = {
  필요: { color: "#7B9E8E", ink: "#0E1613", level: 1 },
  스트레스: { color: "#D98E5A", ink: "#241206", level: 2 },
  충동: { color: "#C0492E", ink: "#FCEAE2", level: 3 },
};

export const EMPTY_DAY = "#26222E";

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

export const THEMES: Record<ThemeName, ThemePalette> = {
  dark: {
    bg: "#15121F", card: "#1E1B2C", cardAlt: "#181523", line: "#2A2540", lineSoft: "#3D3852",
    text: "#F5F1E8", sub: "#8B85A0", dim: "#655F78", invBg: "#F5F1E8", invText: "#15121F",
    chipDim: "#2A2540", treeSky: "linear-gradient(180deg,#1B2530 0%,#161B26 60%,#12141C 100%)",
    trunk: "#4A3B2E", skyInk: "#8FA0B5", fruitStroke: "#12141C",
  },
  light: {
    bg: "#F6F3EE", card: "#FFFFFF", cardAlt: "#EFEBE3", line: "#E4DED3", lineSoft: "#D8D0C2",
    text: "#2A2620", sub: "#8A8175", dim: "#B0A899", invBg: "#2A2620", invText: "#F6F3EE",
    chipDim: "#EFEBE3", treeSky: "linear-gradient(180deg,#EAF0EC 0%,#E4EBE6 60%,#DCE6DF 100%)",
    trunk: "#8A6A4E", skyInk: "#6B8578", fruitStroke: "#FFFFFF",
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
