import React, { useState, useRef, useMemo } from "react";
import { Mic, Camera, Send, LayoutGrid, TreePine, Settings, ChevronRight, ChevronLeft, Shield, Download, Trash2, Heart, X, Bell, User, LogIn, PiggyBank, Share2, Search } from "lucide-react";

// ================== 태그 체계 ==================
const CATEGORIES = {
  식단: { color: "#E8A24C", angle: -55 },
  감정: { color: "#7C9EFF", angle: -20 },
  할일: { color: "#FF6F91", angle: 15 },
  소비: { color: "#5FD9B4", angle: 50 },
  관계: { color: "#FFD76F", angle: 80 },
};
const SUBTAG_CAT = {
  혼밥: "식단", 야식: "식단", 카페인: "식단",
  기분좋음: "감정", 무기력: "감정", 스트레스: "감정",
  할일: "할일", 약속: "할일",
  소비: "소비", 충동구매: "소비", 필요소비: "소비",
  친구: "관계",
};
const NEGATIVE_TAGS = ["무기력", "스트레스"];

// 소비 감정 색 (다크 배경과 어울리는 클레이 톤온톤)
const SPEND_EMOTION = {
  필요: { color: "#7B9E8E", ink: "#0E1613", level: 1 },
  스트레스: { color: "#D98E5A", ink: "#241206", level: 2 },
  충동: { color: "#C0492E", ink: "#FCEAE2", level: 3 },
};
const EMPTY_DAY = "#26222E";

function guessTags(text) {
  const t = text.toLowerCase();
  const tags = [];
  if (/(혼자.*(먹|밥))|혼밥/.test(t)) tags.push("혼밥");
  else if (/(밥|먹|점심|저녁|치킨|라면|빵|떡볶이)/.test(t)) tags.push(/(밤|야식|11시|12시|새벽)/.test(t) ? "야식" : "혼밥");
  if (/(커피|카페|라떼|아아)/.test(t) && tags.length < 2) tags.push("카페인");
  if (/(기분.*(좋|최고))|행복|신남/.test(t) && tags.length < 2) tags.push("기분좋음");
  if (/(우울|무기력|힘들|피곤|지침)/.test(t) && tags.length < 2) tags.push("무기력");
  if (/(스트레스|짜증|화남|열받)/.test(t) && tags.length < 2) tags.push("스트레스");
  if (/(해야|제출|예약|신청|가야)/.test(t) && tags.length < 2) tags.push("할일");
  if (/(약속|만나|만남)/.test(t) && tags.length < 2) tags.push("약속");
  if (/(샀|구매|질렀|결제|주문)/.test(t) && tags.length < 2) tags.push(/(홧김|충동|또)/.test(t) ? "충동구매" : "소비");
  if (/(친구|동생|언니|형|엄마|같이)/.test(t) && tags.length < 2) tags.push("친구");
  return [...new Set(tags)].slice(0, 2);
}

const seed = [
  { id: 101, month: "2026-7", text: "7월 시작. 오늘은 그냥 커피 한잔", tags: ["카페인"], time: "7/2" },
  { id: 102, month: "2026-7", text: "친구랑 점심 약속 잡음", tags: ["친구", "약속"], time: "7/5" },
  { id: 1, month: "2026-6", text: "점심 혼자 김치찌개 먹음ㅋㅋ 맛있었다", tags: ["혼밥"], time: "6/10" },
  { id: 2, month: "2026-6", text: "밤 12시에 치킨 시킴... 또", tags: ["야식", "충동구매"], time: "6/12" },
  { id: 3, month: "2026-6", text: "오늘따라 이유없이 기분 좋음", tags: ["기분좋음"], time: "6/14" },
  { id: 4, month: "2026-6", text: "치과 예약 다시 잡아야 함", tags: ["할일"], time: "6/15" },
  { id: 5, month: "2026-6", text: "친구랑 카페에서 3시간 수다", tags: ["친구", "카페인"], time: "6/17" },
  { id: 6, month: "2026-6", text: "홧김에 신발 질렀다", tags: ["충동구매", "스트레스"], time: "6/19" },
  { id: 7, month: "2026-6", text: "아아 두잔째... 잠이 안깨", tags: ["카페인", "무기력"], time: "6/20" },
  { id: 8, month: "2026-6", text: "야근하고 밤에 라면 끓임", tags: ["야식", "무기력"], time: "6/22" },
  { id: 9, month: "2026-6", text: "새벽까지 배달앱 켜놓고 고민만 함", tags: ["야식", "스트레스"], time: "6/24" },
  { id: 10, month: "2026-6", text: "무기력해서 그냥 누워만 있었음", tags: ["무기력"], time: "6/26" },
  { id: 11, month: "2026-6", text: "월급 스쳐지나감... 또 질렀다", tags: ["충동구매"], time: "6/27" },
  { id: 12, month: "2026-6", text: "친구 생일이라 선물 사야함", tags: ["친구", "할일"], time: "6/28" },
  { id: 13, month: "2026-6", text: "밤에 배고파서 또 시킴", tags: ["야식"], time: "6/29" },
  { id: 51, month: "2026-5", text: "친구가 밥 사줬다 고마워", tags: ["친구", "혼밥"], time: "5/12" },
  { id: 52, month: "2026-5", text: "기분 좋은 하루였음", tags: ["기분좋음"], time: "5/23" },
];
const MONTH_LABEL = { "2026-7": "7월", "2026-6": "6월", "2026-5": "5월" };
const MONTHS_ORDER = ["2026-7", "2026-6", "2026-5"];
const CURRENT_MONTH = "2026-7";
const ALL_SUBTAGS = Object.keys(SUBTAG_CAT).filter((t) => t !== "필요소비");

// 소비 색 캘린더 시드 (6월, day -> 감정)
const spendSeed = { 2: "필요", 3: "충동", 5: "필요", 6: "스트레스", 9: "필요", 10: "충동", 12: "필요", 13: "스트레스", 19: "충동", 20: "스트레스", 24: "필요", 27: "충동", 30: "필요" };

const ONBOARD = [
  { big: "안 써도\n괜찮아요", small: "다이어리 앱, 가계부 앱, 습관 앱...\n깔았다 며칠 만에 관둔 적 있죠?\n툭은 매일 쓰라고 하지 않아요." },
  { big: "생각나면\n그냥 던져요", small: "먹은 것, 산 것, 기분, 할 일 — 뭐든요.\n정리는 AI가 알아서 할게요.\n당신은 던지기만 하면 돼요." },
  { big: "띄엄띄엄 살아도\n기록은 남아요", small: "며칠 빼먹어도 잔소리 없어요.\n한 달에 한 번, 당신이 던진 것들이\n한 그루 나무로 자라나요." },
];

// ================== 테마 팔레트 ==================
const THEMES = {
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

// ================== 미니 나무 (숲 뷰용) ==================
const MiniTree = ({ catData, maxCat, size = 90, trunk, sky, fruitStroke }) => (
  <svg viewBox="0 0 120 120" width={size} height={size} style={{ display: "block" }}>
    <path d="M57 112 Q58 88 59 72 Q60 64 59.5 58 L60.5 58 Q61 64 62 72 Q63 88 64 112 Z" fill={trunk} />
    {Object.entries(CATEGORIES).map(([cat, meta]) => {
      const data = catData[cat] || { total: 0, subs: {} };
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

// ================== 식단 SVG 아이콘 (이모지 대체) ==================
const FoodIcon = ({ type, size = 40, color = "#E8A24C" }) => {
  const icons = {
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
};

export default function TukFinal() {
  const [screen, setScreen] = useState("onboarding"); // onboarding | main
  const [obStep, setObStep] = useState(0);
  const [entries, setEntries] = useState(seed);
  const [text, setText] = useState("");
  const [tab, setTab] = useState("home");
  const [toast, setToast] = useState(null);
  const [learnNote, setLearnNote] = useState(null);
  const [selectedTag, setSelectedTag] = useState(null);
  const [pickedFruit, setPickedFruit] = useState(null);
  const [viewMonth, setViewMonth] = useState(CURRENT_MONTH);
  const [expandedId, setExpandedId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [treeBranch, setTreeBranch] = useState(null); // 파고든 가지 (null=전체나무)
  const [signedIn, setSignedIn] = useState(false);
  const [todayLeaves, setTodayLeaves] = useState([]); // 오늘 돋은 잎 {id, color, x, y}
  const [leafPop, setLeafPop] = useState(null); // 방금 돋은 잎 강조
  const [aiReaction, setAiReaction] = useState(null); // 가끔 뜨는 AI 반응
  const [theme, setTheme] = useState("dark");
  const [forestView, setForestView] = useState(false); // 숲(전체 달) 보기
  const [search, setSearch] = useState(""); // 기록 검색어
  const T = THEMES[theme];
  const idRef = useRef(1000);

  // 던진 직후 AI가 가끔 건네는 관찰 (판단 아님)
  const AI_REACTIONS = {
    야식: ["어제도 밤에 뭐 먹지 않았어요?ㅎㅎ", "밤이 길긴 하죠."],
    충동구매: ["오늘도 질렀군요. 뭐, 그럴 수 있죠.", "지갑이 좀 바빴네요."],
    무기력: ["오늘 좀 축 처졌구나. 알겠어요.", "그런 날이죠."],
    카페인: ["오늘 몇 잔째예요?ㅎㅎ", "잠은 좀 잤어요?"],
    친구: ["누구 만났나 봐요. 좋았겠다.", "사람 만난 날이네요."],
  };

  const showToast = (m) => { setToast(m); setTimeout(() => setToast(null), 1800); };

  const handleThrow = () => {
    if (!text.trim()) return;
    const tags = guessTags(text.trim());
    const now = new Date();
    setEntries((p) => [{ id: idRef.current++, month: CURRENT_MONTH, text: text.trim(), tags, time: `7/${now.getDate()}` }, ...p]);

    // 즉각 보상: 오늘 나무에 잎 하나 돋기
    const leafColor = tags.length ? (CATEGORIES[SUBTAG_CAT[tags[0]]]?.color || "#7FB069") : "#7FB069";
    const leafId = idRef.current;
    const angle = Math.random() * Math.PI - Math.PI / 2; // 위쪽 반원
    const dist = 20 + Math.random() * 42;
    const leaf = { id: leafId, color: leafColor, x: Math.cos(angle) * dist, y: -Math.abs(Math.sin(angle) * dist) - 8 };
    setTodayLeaves((prev) => [...prev, leaf]);
    setLeafPop(leafId);
    setTimeout(() => setLeafPop(null), 700);

    // 가끔(약 35%) AI가 반응
    const reactableTag = tags.find((t) => AI_REACTIONS[t]);
    if (reactableTag && Math.random() < 0.5) {
      const pool = AI_REACTIONS[reactableTag];
      setAiReaction(pool[Math.floor(Math.random() * pool.length)]);
      setTimeout(() => setAiReaction(null), 3200);
    }

    setText("");
  };
  const removeTag = (id, tag) => setEntries((p) => p.map((e) => (e.id === id ? { ...e, tags: e.tags.filter((t) => t !== tag) } : e)));
  const addTag = (id, tag) => {
    setEntries((p) => p.map((e) => (e.id === id && !e.tags.includes(tag) && e.tags.length < 2 ? { ...e, tags: [...e.tags, tag] } : e)));
    setLearnNote("고쳤어요 · 비슷한 기록은 다음부터 이렇게 붙일게요");
    setTimeout(() => setLearnNote(null), 2200);
  };
  const deleteEntry = (id) => { setEntries((p) => p.filter((e) => e.id !== id)); setExpandedId(null); setEditingId(null); showToast("지웠어요. 원래 그런 거예요."); };

  const monthEntries = useMemo(() => entries.filter((e) => e.month === viewMonth), [entries, viewMonth]);
  const tagCounts = useMemo(() => { const m = {}; monthEntries.forEach((e) => e.tags.forEach((t) => (m[t] = (m[t] || 0) + 1))); return m; }, [monthEntries]);
  const topTags = Object.keys(tagCounts).sort((a, b) => tagCounts[b] - tagCounts[a]);
  const catData = useMemo(() => {
    const m = {}; Object.keys(CATEGORIES).forEach((c) => (m[c] = { total: 0, subs: {} }));
    monthEntries.forEach((e) => e.tags.forEach((t) => { const c = SUBTAG_CAT[t]; if (!c) return; m[c].total += 1; m[c].subs[t] = (m[c].subs[t] || 0) + 1; }));
    return m;
  }, [monthEntries]);
  const comboInsight = useMemo(() => {
    const pairs = {};
    monthEntries.forEach((e) => { for (let i = 0; i < e.tags.length; i++) for (let j = i + 1; j < e.tags.length; j++) { const k = [e.tags[i], e.tags[j]].sort().join(" + "); pairs[k] = (pairs[k] || 0) + 1; } });
    return Object.entries(pairs).sort((a, b) => b[1] - a[1])[0];
  }, [monthEntries]);
  const negativeCount = monthEntries.filter((e) => e.tags.some((t) => NEGATIVE_TAGS.includes(t))).length;
  const showGentleNote = negativeCount >= 4;

  // 숲 뷰: 달별 나무 데이터
  const forest = useMemo(() => {
    return MONTHS_ORDER.map((mon) => {
      const es = entries.filter((e) => e.month === mon);
      const cd = {}; Object.keys(CATEGORIES).forEach((c) => (cd[c] = { total: 0, subs: {} }));
      es.forEach((e) => e.tags.forEach((t) => { const c = SUBTAG_CAT[t]; if (!c) return; cd[c].total += 1; cd[c].subs[t] = (cd[c].subs[t] || 0) + 1; }));
      const mx = Math.max(...Object.values(cd).map((c) => c.total), 1);
      return { month: mon, label: MONTH_LABEL[mon], count: es.length, catData: cd, maxCat: mx };
    });
  }, [entries]);

  // 검색 결과
  const searchResults = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.trim().toLowerCase();
    return entries.filter((e) => e.text.toLowerCase().includes(q) || e.tags.some((t) => t.includes(q)));
  }, [search, entries]);

  // 가지별 상세 분석 데이터
  const branchDetail = useMemo(() => {
    if (!treeBranch) return null;
    const items = monthEntries.filter((e) => e.tags.some((t) => SUBTAG_CAT[t] === treeBranch));
    const subCounts = {};
    items.forEach((e) => e.tags.forEach((t) => { if (SUBTAG_CAT[t] === treeBranch) subCounts[t] = (subCounts[t] || 0) + 1; }));
    return { items, subCounts, count: items.length };
  }, [treeBranch, monthEntries]);
  const feed = selectedTag ? entries.filter((e) => e.tags.includes(selectedTag)) : entries;
  const maxCat = Math.max(...Object.values(catData).map((c) => c.total), 1);
  const monthIdx = MONTHS_ORDER.indexOf(viewMonth);
  const isCurrentMonth = viewMonth === CURRENT_MONTH;
  const treeMood = monthEntries.length === 0 ? "empty" : isCurrentMonth && monthEntries.length < 5 ? "growing" : monthEntries.length < 4 ? "quiet" : "full";

  const impulseFree = useMemo(() => { let s = 0; for (let d = 30; d >= 1; d--) { if (spendSeed[d] === "충동") break; if (spendSeed[d]) s++; } return s; }, []);

  const outer = { fontFamily: "'Pretendard', -apple-system, sans-serif", background: T.bg, minHeight: "100vh", color: T.text, display: "flex", justifyContent: "center", transition: "background .3s, color .3s" };
  const styleTag = (
    <style>{`
      @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.css');
      @import url('https://fonts.googleapis.com/css2?family=Nanum+Myeongjo:wght@400;700;800&display=swap');
      .serif { font-family: 'Nanum Myeongjo', serif; letter-spacing: -0.5px; }
      ::-webkit-scrollbar { display: none; }
      @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
      @keyframes sway { 0%,100%{transform:rotate(-1.5deg)} 50%{transform:rotate(1.5deg)} }
      textarea::placeholder { color: #655F78; }
    `}</style>
  );

  // ============ 온보딩 ============
  if (screen === "onboarding") {
    const s = ONBOARD[obStep];
    const last = obStep === ONBOARD.length - 1;
    return (
      <div style={outer}>{styleTag}
        <div style={{ width: "100%", maxWidth: 420, minHeight: "100vh", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", gap: 6, padding: "60px 32px 0" }}>
            {ONBOARD.map((_, i) => <div key={i} style={{ height: 3, flex: 1, borderRadius: 2, background: i <= obStep ? T.text : T.line, transition: "background .3s" }} />)}
          </div>
          <div key={obStep} style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 32px", animation: "fadeUp .4s ease" }}>
            {last && <div style={{ fontSize: 50, marginBottom: 10, animation: "sway 4s ease-in-out infinite", width: "fit-content" }}>🌳</div>}
            <div className="serif" style={{ fontSize: 44, fontWeight: 800, lineHeight: 1.2, whiteSpace: "pre-line", marginBottom: 20 }}>{s.big}</div>
            <div style={{ fontSize: 15, color: T.text, lineHeight: 1.75, whiteSpace: "pre-line" }}>{s.small}</div>
          </div>
          <div style={{ padding: "0 32px 42px" }}>
            {!last ? (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <button onClick={() => setObStep(ONBOARD.length - 1)} style={{ background: "none", border: "none", color: T.dim, fontSize: 13.5, cursor: "pointer" }}>건너뛰기</button>
                <button onClick={() => setObStep(obStep + 1)} style={{ display: "flex", alignItems: "center", gap: 6, background: T.text, color: T.bg, border: "none", borderRadius: 999, padding: "12px 22px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>다음 <ChevronRight size={16} /></button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10, animation: "fadeUp .4s ease" }}>
                <button onClick={() => setScreen("main")} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: T.text, color: T.bg, border: "none", borderRadius: 14, padding: "16px", fontSize: 15.5, fontWeight: 700, cursor: "pointer" }}><Send size={16} /> 가입 없이 일단 던져보기</button>
                <button onClick={() => { setSignedIn(true); setScreen("main"); }} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "transparent", color: T.text, border: `1px solid ${T.lineSoft}`, borderRadius: 14, padding: "15px", fontSize: 14, cursor: "pointer" }}><LogIn size={16} /> Google / Apple로 계속하기</button>
                <div style={{ fontSize: 11.5, color: T.dim, textAlign: "center", marginTop: 6, lineHeight: 1.6 }}>가입 전 기록은 이 기기에만 저장돼요.<br />나중에 가입하면 그대로 이어져요.</div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ============ 메인 ============
  return (
    <div style={outer}>{styleTag}
      <div style={{ width: "100%", maxWidth: 420, position: "relative", paddingBottom: 90 }}>
        {/* 헤더 */}
        <div style={{ padding: "26px 20px 10px" }}>
          <div className="serif" style={{ fontSize: 30, fontWeight: 800 }}>툭</div>
          <div style={{ fontSize: 13, color: T.sub, marginTop: 3 }}>
            {tab === "report" ? "당신이 던진 것들이 자란 모양" : tab === "settings" ? "당신의 기록은 당신 것이에요" : "안 써도 괜찮아요. 생각나면 그냥 툭."}
          </div>
        </div>

        {toast && <div style={{ position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)", background: T.text, color: T.bg, padding: "8px 16px", borderRadius: 999, fontSize: 13, fontWeight: 700, zIndex: 50 }}>{toast}</div>}
        {learnNote && <div style={{ position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)", background: T.line, color: T.text, padding: "8px 16px", borderRadius: 999, fontSize: 12.5, zIndex: 51, border: `1px solid #4D4668`, maxWidth: "90%", textAlign: "center" }}>{learnNote}</div>}

        {/* ===== HOME ===== */}
        {tab === "home" && (
          <>
            {!signedIn && (
              <div style={{ padding: "0 20px 10px" }}>
                <button onClick={() => { setSignedIn(true); showToast("기록이 계정에 연결됐어요"); }} style={{ width: "100%", background: "transparent", border: `1px dashed ${T.lineSoft}`, borderRadius: 14, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
                  <span style={{ fontSize: 12.5, color: T.sub }}>기록이 쌓이고 있어요 · 가입하면 잃어버리지 않아요</span>
                  <ChevronRight size={15} color="#655F78" />
                </button>
              </div>
            )}
            {/* 오늘의 작은 나무 — 던질 때마다 잎이 돋음 (즉각 보상) */}
            <div style={{ padding: "0 20px 10px" }}>
              <div style={{ background: "linear-gradient(180deg,#1D2A22,#181523)", border: `1px solid #2A3A2E`, borderRadius: 16, padding: "14px 16px", display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ position: "relative", width: 76, height: 76, flexShrink: 0 }}>
                  <svg viewBox="0 0 76 76" style={{ width: "100%", height: "100%" }}>
                    {/* 어린 줄기 */}
                    <path d="M38 68 Q37 52 38 40 Q39 32 38 26" stroke={T.trunk} strokeWidth="3.5" fill="none" strokeLinecap="round" />
                    {/* 오늘 돋은 잎들 */}
                    {todayLeaves.map((lf) => (
                      <circle key={lf.id} cx={38 + lf.x} cy={32 + lf.y} r={lf.id === leafPop ? 6.5 : 4.5}
                        fill={lf.color} stroke={T.cardAlt} strokeWidth="1"
                        style={{ transition: "r .4s ease", transformOrigin: "center" }}>
                        {lf.id === leafPop && <animate attributeName="r" from="0" to="6.5" dur="0.4s" />}
                      </circle>
                    ))}
                    {todayLeaves.length === 0 && <circle cx="38" cy="26" r="3" fill="#3A4A3E" />}
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 700 }}>
                    {todayLeaves.length === 0 ? "오늘의 나무, 아직 씨앗이에요" : `오늘 잎이 ${todayLeaves.length}장 돋았어요`}
                  </div>
                  <div style={{ fontSize: 12, color: "#8B9A8E", marginTop: 3 }}>
                    {todayLeaves.length === 0 ? "뭐든 하나 던지면 잎이 나요" : "던질수록 오늘 나무가 자라요"}
                  </div>
                </div>
                <button onClick={() => { setViewMonth(CURRENT_MONTH); setTab("report"); }} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 2, flexShrink: 0 }}>
                  <span style={{ fontSize: 20 }}>🌳</span>
                  <span style={{ fontSize: 9.5, color: "#8B9A8E" }}>한 달 나무</span>
                </button>
              </div>
            </div>

            {/* 던진 직후 가끔 뜨는 AI 반응 */}
            {aiReaction && (
              <div style={{ padding: "0 20px 10px", animation: "fadeUp .3s ease" }}>
                <div style={{ background: theme === "dark" ? "#232038" : "#ECEAF6", borderRadius: 14, borderTopLeftRadius: 4, padding: "11px 14px", fontSize: 13.5, color: theme === "dark" ? "#D8D2E8" : "#4A4568", display: "flex", alignItems: "center", gap: 8, maxWidth: "85%" }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#9DB4FF" }}>AI</span> {aiReaction}
                </div>
              </div>
            )}
            <div style={{ padding: "0 20px 8px" }}>
              <div style={{ background: T.card, borderRadius: 18, padding: 14, border: `1px dashed ${T.lineSoft}` }}>
                <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="오늘 뭐든 툭..." rows={2} style={{ width: "100%", background: "transparent", border: "none", outline: "none", resize: "none", color: T.text, fontSize: 15, fontFamily: "inherit" }} />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
                  <div style={{ display: "flex", gap: 14 }}><Camera size={18} color="#8B85A0" /><Mic size={18} color="#8B85A0" /></div>
                  <button onClick={handleThrow} style={{ display: "flex", alignItems: "center", gap: 6, background: T.text, color: T.bg, border: "none", borderRadius: 999, padding: "8px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}><Send size={14} /> 던지기</button>
                </div>
              </div>
              {/* 첫 사용자용 예시 칩 (기록 없을 때만) */}
              {entries.length === 0 && (
                <div style={{ marginTop: 10, animation: "fadeUp .4s ease" }}>
                  <div style={{ fontSize: 11.5, color: T.dim, marginBottom: 7 }}>이런 걸 던져보세요 👇</div>
                  <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                    {["점심에 라면 먹음", "오늘 좀 무기력함", "홧김에 또 질렀다", "친구랑 카페 감"].map((ex) => (
                      <button key={ex} onClick={() => setText(ex)} style={{ fontSize: 12.5, color: T.sub, background: T.card, border: `1px solid ${T.line}`, borderRadius: 999, padding: "6px 12px", cursor: "pointer" }}>{ex}</button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {selectedTag && (
              <div style={{ padding: "0 20px 4px", display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 12.5, color: T.sub }}>필터:</span>
                <span style={{ fontSize: 12.5, color: CATEGORIES[SUBTAG_CAT[selectedTag]]?.color, fontWeight: 700 }}>#{selectedTag}</span>
                <button onClick={() => setSelectedTag(null)} style={{ background: "none", border: "none", color: T.dim, fontSize: 12, cursor: "pointer" }}>지우기</button>
              </div>
            )}
            <div style={{ padding: "10px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
              {feed.length === 0 && (
                <div style={{ textAlign: "center", padding: "40px 20px", animation: "fadeUp .4s ease" }}>
                  <div style={{ fontSize: 40, marginBottom: 14 }}>🌱</div>
                  <div className="serif" style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>첫 씨앗을 심어볼까요?</div>
                  <div style={{ fontSize: 13.5, color: T.sub, lineHeight: 1.7 }}>위에 뭐든 하나 던지면 시작이에요.<br />먹은 거, 산 거, 기분... 정말 아무거나요.</div>
                </div>
              )}
              {feed.map((e) => {
                const expanded = expandedId === e.id, editing = editingId === e.id;
                return (
                  <div key={e.id} style={{ background: T.card, borderRadius: 14, padding: "13px 15px", boxShadow: "0 2px 8px rgba(0,0,0,0.3)", border: expanded ? `1px solid ${T.lineSoft}` : "1px solid transparent" }}>
                    <div onClick={() => { setExpandedId(expanded ? null : e.id); setEditingId(null); }} style={{ fontSize: 14.5, lineHeight: 1.5, marginBottom: 8, cursor: "pointer" }}>{e.text}</div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                        {e.tags.length > 0 ? e.tags.map((t) => { const c = CATEGORIES[SUBTAG_CAT[t]]?.color || "#8B85A0"; return <button key={t} onClick={() => setSelectedTag(t)} style={{ fontSize: 11.5, fontWeight: 700, color: c, background: c + "1E", padding: "3px 9px", borderRadius: 999, border: "none", cursor: "pointer" }}>#{t}</button>; }) : <span style={{ fontSize: 11.5, color: T.dim }}>메모</span>}
                      </div>
                      <span style={{ fontSize: 11, color: T.dim }}>{e.time}</span>
                    </div>
                    {expanded && !editing && (
                      <div style={{ display: "flex", gap: 8, marginTop: 12, paddingTop: 12, borderTop: `1px solid ${T.line}`, animation: "fadeUp .2s ease" }}>
                        <button onClick={() => setEditingId(e.id)} style={{ flex: 1, background: T.line, color: T.text, border: "none", borderRadius: 10, padding: "9px", fontSize: 12.5, cursor: "pointer" }}>태그 고치기</button>
                        <button onClick={() => deleteEntry(e.id)} style={{ flex: 1, background: "transparent", color: "#FF6F91", border: `1px solid #FF6F9144`, borderRadius: 10, padding: "9px", fontSize: 12.5, cursor: "pointer" }}>지우기</button>
                      </div>
                    )}
                    {expanded && editing && (
                      <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${T.line}`, animation: "fadeUp .2s ease" }}>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                          {e.tags.length > 0 ? e.tags.map((t) => { const c = CATEGORIES[SUBTAG_CAT[t]]?.color || "#8B85A0"; return <span key={t} style={{ fontSize: 11.5, fontWeight: 700, color: c, background: c + "1E", padding: "3px 6px 3px 9px", borderRadius: 999, display: "inline-flex", alignItems: "center", gap: 4 }}>#{t}<button onClick={() => removeTag(e.id, t)} style={{ background: "none", border: "none", color: c, cursor: "pointer", display: "flex", padding: 0 }}><X size={13} /></button></span>; }) : <span style={{ fontSize: 11.5, color: T.dim }}>태그 없이 메모로 둬도 괜찮아요</span>}
                        </div>
                        {e.tags.length < 2 && (
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                            {ALL_SUBTAGS.filter((t) => !e.tags.includes(t)).map((t) => { const c = CATEGORIES[SUBTAG_CAT[t]]?.color || "#8B85A0"; return <button key={t} onClick={() => addTag(e.id, t)} style={{ fontSize: 11.5, color: c, background: "transparent", border: `1px solid ${c}55`, padding: "3px 9px", borderRadius: 999, cursor: "pointer" }}>+ {t}</button>; })}
                          </div>
                        )}
                        <div style={{ display: "flex", justifyContent: "flex-end" }}>
                          <button onClick={() => { setEditingId(null); setExpandedId(null); }} style={{ fontSize: 12, fontWeight: 700, color: T.bg, background: T.text, border: "none", borderRadius: 999, padding: "6px 16px", cursor: "pointer" }}>완료</button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ===== 나무 (전체 나무 → 가지 드릴다운) ===== */}
        {tab === "report" && (
          <div style={{ padding: "4px 20px 0" }}>
            {/* 숲 보기 / 검색 바 (가지 상세일 땐 숨김) */}
            {!treeBranch && (
              <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                <button onClick={() => { setForestView(!forestView); setSearch(""); }} style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 6, background: forestView ? T.text : T.card, color: forestView ? T.bg : T.sub, border: `1px solid ${T.line}`, borderRadius: 999, padding: "9px 14px", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>
                  <TreePine size={15} /> {forestView ? "한 그루 보기" : "숲 보기"}
                </button>
                <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, background: T.card, border: `1px solid ${T.line}`, borderRadius: 999, padding: "0 14px" }}>
                  <Search size={15} color={T.sub} />
                  <input value={search} onChange={(e) => { setSearch(e.target.value); if (e.target.value) setForestView(false); }} placeholder="기록 찾기" style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: T.text, fontSize: 13, fontFamily: "inherit", padding: "9px 0" }} />
                  {search && <button onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", padding: 0 }}><X size={15} color={T.sub} /></button>}
                </div>
              </div>
            )}

            {/* ========== 검색 결과 ========== */}
            {!treeBranch && search.trim() && (
              <div style={{ animation: "fadeUp .3s ease" }}>
                <div style={{ fontSize: 12.5, color: T.sub, marginBottom: 12 }}>"{search}" · {searchResults.length}개 찾음</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingBottom: 20 }}>
                  {searchResults.length === 0 && <div style={{ textAlign: "center", color: T.dim, padding: "40px 0", fontSize: 14 }}>그런 기록은 없네요. 다른 말로 찾아볼래요?</div>}
                  {searchResults.map((e) => (
                    <div key={e.id} style={{ background: T.card, borderRadius: 12, padding: "12px 14px" }}>
                      <div style={{ fontSize: 13.5, lineHeight: 1.5, marginBottom: 6 }}>{e.text}</div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", gap: 5 }}>{e.tags.map((t) => { const c = CATEGORIES[SUBTAG_CAT[t]]?.color || T.sub; return <span key={t} style={{ fontSize: 11, fontWeight: 700, color: c, background: c + "1E", padding: "2px 8px", borderRadius: 999 }}>#{t}</span>; })}</div>
                        <span style={{ fontSize: 11, color: T.dim }}>{MONTH_LABEL[e.month]} · {e.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ========== 숲 뷰 ========== */}
            {!treeBranch && !search.trim() && forestView && (
              <div style={{ animation: "fadeUp .3s ease", paddingBottom: 20 }}>
                <div style={{ fontSize: 13, color: T.sub, marginBottom: 16, lineHeight: 1.6 }}>지금까지 {forest.filter((f) => f.count > 0).length}그루가 자랐어요. 한 그루씩 눌러보세요.</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  {forest.map((f) => (
                    <button key={f.month} onClick={() => { setViewMonth(f.month); setForestView(false); }} style={{ background: T.treeSky, border: `1px solid ${T.line}`, borderRadius: 16, padding: "14px 10px 10px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                      <MiniTree catData={f.catData} maxCat={f.maxCat} size={100} trunk={T.trunk} sky={T.treeSky} fruitStroke={T.fruitStroke} />
                      <div className="serif" style={{ fontSize: 16, fontWeight: 700, color: T.text }}>{f.label}</div>
                      <div style={{ fontSize: 11, color: T.skyInk }}>{f.count > 0 ? `열매 ${f.count}개` : "쉬어간 달"}</div>
                    </button>
                  ))}
                  {/* 미래의 빈 화분 (다음 달 예고) */}
                  <div style={{ background: T.cardAlt, border: `1px dashed ${T.line}`, borderRadius: 16, padding: "14px 10px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, minHeight: 150 }}>
                    <span style={{ fontSize: 26, opacity: 0.5 }}>🪴</span>
                    <div style={{ fontSize: 12, color: T.dim, textAlign: "center", lineHeight: 1.5 }}>다음 달 나무는<br />여기서 자라요</div>
                  </div>
                </div>
              </div>
            )}

            {/* 월 이동 (한 그루 보기 · 검색 아님 · 가지상세 아님) */}
            {!treeBranch && !forestView && !search.trim() && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, background: T.card, borderRadius: 14, padding: "8px" }}>
                <button onClick={() => { if (monthIdx < MONTHS_ORDER.length - 1) { setViewMonth(MONTHS_ORDER[monthIdx + 1]); setPickedFruit(null); } }} disabled={monthIdx >= MONTHS_ORDER.length - 1} style={{ background: "none", border: "none", padding: "8px 12px", cursor: monthIdx >= MONTHS_ORDER.length - 1 ? "default" : "pointer", opacity: monthIdx >= MONTHS_ORDER.length - 1 ? 0.25 : 1, color: T.text, display: "flex" }}><ChevronLeft size={20} /></button>
                <div style={{ textAlign: "center" }}>
                  <div className="serif" style={{ fontSize: 19, fontWeight: 700 }}>{MONTH_LABEL[viewMonth]}</div>
                  {isCurrentMonth && <div style={{ fontSize: 11, color: "#5FD9B4" }}>지금 자라는 중</div>}
                </div>
                <button onClick={() => { if (monthIdx > 0) { setViewMonth(MONTHS_ORDER[monthIdx - 1]); setPickedFruit(null); } }} disabled={monthIdx <= 0} style={{ background: "none", border: "none", padding: "8px 12px", cursor: monthIdx <= 0 ? "default" : "pointer", opacity: monthIdx <= 0 ? 0.25 : 1, color: T.text, display: "flex" }}><ChevronRight size={20} /></button>
              </div>
            )}

            {/* ========== 전체 나무 (한 그루) ========== */}
            {!treeBranch && !forestView && !search.trim() && (
              <div style={{ animation: "fadeUp .3s ease" }}>
                <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
                  <div style={{ flex: 1, background: T.card, borderRadius: 14, padding: "14px 16px" }}>
                    <div className="serif" style={{ fontSize: 25, fontWeight: 700 }}>{monthEntries.length}개</div>
                    <div style={{ fontSize: 12, color: T.sub }}>{MONTH_LABEL[viewMonth]}의 열매</div>
                  </div>
                  <div style={{ flex: 1, background: T.card, borderRadius: 14, padding: "14px 16px" }}>
                    {topTags[0] ? <><div className="serif" style={{ fontSize: 25, fontWeight: 700, color: CATEGORIES[SUBTAG_CAT[topTags[0]]]?.color }}>#{topTags[0]}</div><div style={{ fontSize: 12, color: T.sub }}>가장 많이 열린 열매</div></> : <><div className="serif" style={{ fontSize: 25, color: T.dim }}>—</div><div style={{ fontSize: 12, color: T.sub }}>아직 열매 없음</div></>}
                  </div>
                </div>
                <div style={{ position: "relative", width: "100%", aspectRatio: "1/1", borderRadius: 18, background: T.treeSky, overflow: "hidden", border: `1px solid ${T.line}`, marginBottom: 10 }}>
                  <svg viewBox="0 0 300 300" style={{ width: "100%", height: "100%" }}>
                    <defs>
                      <radialGradient id="ground" cx="0.5" cy="0.5" r="0.5">
                        <stop offset="0%" stopColor={T.trunk} stopOpacity="0.35" />
                        <stop offset="100%" stopColor={T.trunk} stopOpacity="0" />
                      </radialGradient>
                    </defs>
                    <ellipse cx="150" cy="286" rx="95" ry="14" fill="url(#ground)" />
                    {/* 부드러운 몸통 */}
                    <path d="M143 288 Q145 235 147 198 Q148 178 149 162 Q150 158 151 162 Q152 178 153 198 Q155 235 157 288 Z" fill={T.trunk} />
                    {Object.entries(CATEGORIES).map(([cat, meta]) => {
                      const data = catData[cat], strength = data.total / maxCat, len = 58 + strength * 52, rad = (meta.angle * Math.PI) / 180;
                      const bx = 150 + Math.sin(rad) * len, by = 158 - Math.cos(rad) * len * 0.92, branchW = 2.5 + strength * 6.5, subs = Object.entries(data.subs);
                      // 곡선 가지 (S자 느낌)
                      const midx = 150 + Math.sin(rad) * len * 0.5 + Math.cos(rad) * 10;
                      const midy = 162 - Math.cos(rad) * len * 0.5;
                      return (
                        <g key={cat} style={{ cursor: data.total > 0 ? "pointer" : "default" }} onClick={() => { if (data.total > 0) { setTreeBranch(cat); setPickedFruit(null); } }}>
                          <path d={`M150 164 Q${midx} ${midy} ${bx} ${by}`} stroke={T.trunk} strokeWidth={branchW} fill="none" strokeLinecap="round" />
                          {data.total > 0 && (<>
                            {/* 유기적 잎무리 (겹친 원 여러개) */}
                            {[[0, 0, 1], [-1, -0.6, 0.7], [1, -0.4, 0.65], [0.3, 0.9, 0.6], [-0.8, 0.5, 0.55]].map(([dx, dy, sc], k) => {
                              const R = (14 + strength * 18) * sc;
                              return <circle key={k} cx={bx + dx * (10 + strength * 8)} cy={by + dy * (10 + strength * 8)} r={R} fill={meta.color} opacity={0.13 + k * 0.01} />;
                            })}
                            {subs.map(([sub, cnt], i) => {
                              const a = (i / Math.max(subs.length, 1)) * Math.PI * 2 + rad, rr = 9 + strength * 15;
                              const fx = bx + Math.cos(a) * rr, fy = by + Math.sin(a) * rr, fruitR = 3 + Math.min(cnt, 8) * 1.5;
                              return (
                                <g key={sub}>
                                  <circle cx={fx} cy={fy} r={fruitR} fill={meta.color} stroke={T.fruitStroke} strokeWidth="1" />
                                  <circle cx={fx - fruitR * 0.32} cy={fy - fruitR * 0.32} r={fruitR * 0.3} fill="#FFF" opacity="0.4" />
                                </g>
                              );
                            })}
                            <text x={bx} y={by - (20 + strength * 20)} fill={meta.color} fontSize="11.5" textAnchor="middle" fontWeight="700" style={{ fontFamily: "'Pretendard',sans-serif" }}>{cat}</text>
                          </>)}
                        </g>
                      );
                    })}
                  </svg>
                  <div className="serif" style={{ position: "absolute", bottom: 10, left: 0, right: 0, textAlign: "center", fontSize: 13.5, color: T.skyInk, padding: "0 20px" }}>
                    {treeMood === "empty" && "이 달은 이렇게 쉬어갔네요"}
                    {treeMood === "growing" && "아직 씨앗이에요. 급할 거 없어요."}
                    {treeMood === "quiet" && "조용히 지나간 달. 그래도 잎은 났어요."}
                    {treeMood === "full" && "가지를 누르면 더 깊이 볼 수 있어요"}
                  </div>
                </div>

                {/* 가지 바로가기 칩 (한 줄 가로 스크롤) */}
                {monthEntries.length > 0 && (
                  <div style={{ display: "flex", gap: 7, overflowX: "auto", marginBottom: 14, paddingBottom: 2, WebkitOverflowScrolling: "touch" }}>
                    {Object.entries(CATEGORIES).filter(([c]) => catData[c].total > 0).map(([cat, meta]) => (
                      <button key={cat} onClick={() => { setTreeBranch(cat); setPickedFruit(null); }} style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 5, background: T.card, border: `1px solid ${meta.color}44`, borderRadius: 999, padding: "7px 12px", fontSize: 12.5, color: T.text, cursor: "pointer", whiteSpace: "nowrap" }}>
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: meta.color }} />{cat} <span style={{ color: T.dim }}>{catData[cat].total}</span>
                      </button>
                    ))}
                  </div>
                )}

                <div style={{ background: T.card, borderRadius: 14, padding: "16px", marginBottom: 12, lineHeight: 1.7, fontSize: 14 }}>
                  <div style={{ fontSize: 12, color: T.sub, marginBottom: 6, fontWeight: 700 }}>AI가 정리한 {MONTH_LABEL[viewMonth]}</div>
                  {monthEntries.length === 0 ? <span style={{ color: T.text }}>이 달엔 던진 게 없었어요. 그런 달도 있죠. 아무 일 없이 지나간 것도 하나의 기록이에요.</span> : (<>
                    {(() => { const tc = Object.entries(catData).sort((a, b) => b[1].total - a[1].total)[0]; return tc && tc[1].total > 0 ? <>{isCurrentMonth ? "아직 초반이지만, " : `${MONTH_LABEL[viewMonth]}은 `}<span style={{ color: CATEGORIES[tc[0]].color, fontWeight: 700 }}>{tc[0]}</span> 가지가 제일 무성했어요. </> : null; })()}
                    {comboInsight && <>특히 <span style={{ color: CATEGORIES[SUBTAG_CAT[comboInsight[0].split(" + ")[0]]]?.color, fontWeight: 700 }}>#{comboInsight[0].split(" + ")[0]}</span>과 <span style={{ color: CATEGORIES[SUBTAG_CAT[comboInsight[0].split(" + ")[1]]]?.color, fontWeight: 700 }}>#{comboInsight[0].split(" + ")[1]}</span>이 함께 열린 날이 {comboInsight[1]}번 있었어요. </>}
                    그냥 그때의 당신 리듬이에요. 좋다 나쁘다 없이요.
                  </>)}
                </div>
                {showGentleNote && (
                  <div style={{ background: theme === "dark" ? "#20222E" : "#EAEDF5", borderRadius: 14, padding: "14px 16px", marginBottom: 12, lineHeight: 1.7, fontSize: 13.5, border: `1px solid ${theme === "dark" ? "#2E3346" : "#D5DBEA"}`, display: "flex", gap: 10 }}>
                    <Heart size={18} color="#7C9EFF" style={{ flexShrink: 0, marginTop: 2 }} />
                    <div style={{ color: "#C7CAD6" }}>요즘 지친 마음이 좀 자주 보였어요. 판단하려는 건 아니고요. 혹시 버겁다면, 가까운 사람이나 전문가와 이야기 나눠보는 것도 방법이에요.</div>
                  </div>
                )}
                <button onClick={() => showToast("나무를 이미지로 저장했어요 (데모)")} style={{ width: "100%", background: T.text, color: T.bg, border: "none", borderRadius: 12, padding: "13px", fontSize: 13.5, fontWeight: 700, marginBottom: 20, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}><Share2 size={15} /> {MONTH_LABEL[viewMonth]} 나무 공유하기</button>
              </div>
            )}

            {/* ========== 가지 상세 (드릴다운) ========== */}
            {treeBranch && branchDetail && (
              <div style={{ animation: "fadeUp .3s ease" }}>
                {/* 뒤로 + 가지 헤더 */}
                <button onClick={() => setTreeBranch(null)} style={{ background: "none", border: "none", color: T.sub, display: "flex", alignItems: "center", gap: 4, cursor: "pointer", fontSize: 13, marginBottom: 14, padding: 0 }}><ChevronLeft size={16} /> 전체 나무로</button>
                <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 4 }}>
                  <span style={{ width: 13, height: 13, borderRadius: "50%", background: CATEGORIES[treeBranch].color }} />
                  <span className="serif" style={{ fontSize: 26, fontWeight: 700 }}>{treeBranch}</span>
                </div>
                <div style={{ fontSize: 13, color: T.sub, marginBottom: 18 }}>{MONTH_LABEL[viewMonth]}에 {branchDetail.count}번 · 이 가지만 자세히</div>

                {/* --- 소비 가지: 색달력 + 스트릭 --- */}
                {treeBranch === "소비" && (<>
                  <div style={{ background: T.card, borderRadius: 18, padding: "16px 14px", marginBottom: 14 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 6, marginBottom: 6 }}>
                      {["일", "월", "화", "수", "목", "금", "토"].map((d) => <div key={d} style={{ textAlign: "center", fontSize: 11, color: T.dim }}>{d}</div>)}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 6 }}>
                      {Array.from({ length: 1 }).map((_, i) => <div key={"b" + i} />)}
                      {Array.from({ length: 30 }).map((_, i) => {
                        const day = i + 1, emo = spendSeed[day], bg = emo ? SPEND_EMOTION[emo].color : EMPTY_DAY, ink = emo ? SPEND_EMOTION[emo].ink : "#5A5560";
                        return <div key={day} style={{ aspectRatio: "1/1", borderRadius: 8, background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10.5, fontWeight: 600, color: ink }}>{day}</div>;
                      })}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 14, justifyContent: "center", marginBottom: 14, flexWrap: "wrap" }}>
                    {Object.entries(SPEND_EMOTION).map(([emo, meta]) => <span key={emo} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}><span style={{ width: 12, height: 12, borderRadius: 4, background: meta.color, border: `1px solid #ffffff22` }} /><span style={{ color: T.text }}>{emo}</span></span>)}
                    <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}><span style={{ width: 12, height: 12, borderRadius: 4, background: EMPTY_DAY }} /><span style={{ color: T.dim }}>기록 없음</span></span>
                  </div>
                  <div style={{ background: T.card, borderRadius: 14, padding: "16px", marginBottom: 14, display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ position: "relative", width: 52, height: 52, flexShrink: 0 }}>
                      <div style={{ position: "absolute", inset: 0, borderRadius: 12, background: T.line, overflow: "hidden" }}><div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: `${Math.min(impulseFree / 8, 1) * 100}%`, background: "linear-gradient(180deg,#F0997B,#C05A2E)" }} /></div>
                      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}><PiggyBank size={26} color="#FCEAE2" /></div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 700 }}>충동소비 없는 날 {impulseFree}일째</div>
                      <div style={{ fontSize: 12, color: T.sub, marginTop: 2 }}>천천히 차오르는 중이에요. 끊겨도 괜찮아요.</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 12.5, color: T.text, marginBottom: 14, lineHeight: 1.6, background: T.cardAlt, borderRadius: 10, padding: "10px 12px" }}>
                    <span style={{ color: "#C0492E", fontWeight: 700 }}>AI</span> 스트레스 받은 날 지갑이 열리는 편이네요. 알아두면 그걸로 충분해요.
                  </div>
                </>)}

                {/* --- 감정 가지: 진짜 기분의 파도 --- */}
                {treeBranch === "감정" && (
                  <div style={{ background: theme === "dark" ? "linear-gradient(180deg,#1B1E33,#181523)" : "linear-gradient(180deg,#EAEEF7,#F0EDE6)", borderRadius: 18, padding: "18px 16px", marginBottom: 14, overflow: "hidden" }}>
                    <div style={{ fontSize: 12, color: T.sub, marginBottom: 14, fontWeight: 700 }}>이번 달 기분의 파도</div>
                    {(() => {
                      const moodOf = { 기분좋음: 1.1, 카페인: 0, 무기력: -1, 스트레스: -1.1 };
                      const vals = branchDetail.items.map((e) => e.tags.reduce((acc, t) => acc + (moodOf[t] ?? 0), 0));
                      if (vals.length === 0) return <div style={{ fontSize: 13, color: T.dim }}>아직 기분 기록이 적어요.</div>;
                      const W = 300, H = 120, mid = 62;
                      const pts = vals.map((m, i) => [10 + (i / Math.max(vals.length - 1, 1)) * (W - 20), mid - m * 32]);
                      // 부드러운 곡선 (Catmull-Rom → bezier 근사)
                      let path = `M${pts[0][0]} ${pts[0][1]}`;
                      for (let i = 0; i < pts.length - 1; i++) {
                        const p0 = pts[i === 0 ? 0 : i - 1], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
                        const c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
                        const c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
                        path += ` C${c1x} ${c1y} ${c2x} ${c2y} ${p2[0]} ${p2[1]}`;
                      }
                      const fillPath = `${path} L${pts[pts.length - 1][0]} ${H} L${pts[0][0]} ${H} Z`;
                      const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
                      return (<>
                        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: 130 }}>
                          <defs>
                            <linearGradient id="wave" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#7C9EFF" stopOpacity="0.55" />
                              <stop offset="100%" stopColor="#7C9EFF" stopOpacity="0.02" />
                            </linearGradient>
                            <linearGradient id="wave2" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#9DB4FF" stopOpacity="0.25" />
                              <stop offset="100%" stopColor="#9DB4FF" stopOpacity="0" />
                            </linearGradient>
                          </defs>
                          {/* 배경 잔물결 (장식) */}
                          <path d={`M0 ${mid + 14} Q75 ${mid + 4} 150 ${mid + 14} T300 ${mid + 14} V${H} H0 Z`} fill="url(#wave2)">
                            <animateTransform attributeName="transform" type="translate" values="0 0; -20 2; 0 0" dur="6s" repeatCount="indefinite" />
                          </path>
                          <line x1="0" y1={mid} x2={W} y2={mid} stroke={T.lineSoft} strokeWidth="1" strokeDasharray="2 5" />
                          {/* 메인 감정 물결 */}
                          <path d={fillPath} fill="url(#wave)">
                            <animateTransform attributeName="transform" type="translate" values="0 0; 0 3.5; 0 0" dur="4s" repeatCount="indefinite" />
                          </path>
                          <path d={path} stroke="#9DB4FF" strokeWidth="2.5" fill="none" strokeLinecap="round">
                            <animateTransform attributeName="transform" type="translate" values="0 0; 0 3.5; 0 0" dur="4s" repeatCount="indefinite" />
                          </path>
                          {pts.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r="3.5" fill="#DCE4FF"><animate attributeName="cy" values={`${p[1]};${p[1] + 3.5};${p[1]}`} dur="4s" repeatCount="indefinite" /></circle>)}
                        </svg>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: T.dim, marginTop: 2 }}><span>가라앉음</span><span>들뜸</span></div>
                        <div style={{ fontSize: 12.5, color: T.text, marginTop: 14, lineHeight: 1.6, background: T.cardAlt, borderRadius: 10, padding: "10px 12px" }}>
                          <span style={{ color: "#7C9EFF", fontWeight: 700 }}>AI</span> {avg >= 0.3 ? "전반적으로 잔잔하고 맑은 편이었어요." : avg <= -0.3 ? "요즘 좀 자주 출렁였네요. 그런 날들이 있어요." : "오르락내리락, 그냥 사람 사는 리듬이었어요."}
                        </div>
                      </>);
                    })()}
                  </div>
                )}

                {/* --- 식단 가지: 무엇을 자주 먹었나 --- */}
                {treeBranch === "식단" && (
                  <div style={{ background: T.card, borderRadius: 18, padding: "18px 16px", marginBottom: 14 }}>
                    <div style={{ fontSize: 12, color: T.sub, marginBottom: 16, fontWeight: 700 }}>뭘 자주 먹었나</div>
                    {(() => {
                      const foods = [
                        { key: "치킨" }, { key: "라면" }, { key: "김치찌개" },
                        { key: "커피" }, { key: "빵" }, { key: "떡볶이" },
                        { key: "배달" }, { key: "밥" },
                      ];
                      const counts = foods.map((f) => ({ ...f, n: branchDetail.items.filter((e) => e.text.includes(f.key)).length })).filter((f) => f.n > 0).sort((a, b) => b.n - a.n);
                      const mx = Math.max(...counts.map((c) => c.n), 1);
                      const nightN = branchDetail.items.filter((e) => e.tags.includes("야식")).length;
                      if (counts.length === 0) return <div style={{ fontSize: 13, color: T.dim }}>아직 뭘 먹었는지 기록이 적어요.</div>;
                      return (<>
                        <div style={{ display: "flex", gap: 20, flexWrap: "wrap", alignItems: "flex-end", justifyContent: "center", padding: "8px 0 4px" }}>
                          {counts.map((f) => {
                            const size = 32 + (f.n / mx) * 28;
                            return (
                              <div key={f.key} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 7 }}>
                                <div style={{ height: 60, display: "flex", alignItems: "flex-end" }}><FoodIcon type={f.key} size={size} color={CATEGORIES.식단.color} /></div>
                                <span style={{ fontSize: 12, color: T.text }}>{f.key}</span>
                                <span style={{ fontSize: 11, color: T.dim }}>{f.n}번</span>
                              </div>
                            );
                          })}
                        </div>
                        {nightN > 0 && (
                          <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${T.line}`, display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: T.sub }}>
                            그중 야식이 {nightN}번이었어요 🌙
                          </div>
                        )}
                      </>);
                    })()}
                    <div style={{ fontSize: 12.5, color: T.text, marginTop: 14, lineHeight: 1.6, background: T.cardAlt, borderRadius: 10, padding: "10px 12px" }}>
                      <span style={{ color: "#E8A24C", fontWeight: 700 }}>AI</span> 요즘 혼자 대충 때우는 날이 좀 있었네요. 그런 날도 있죠.
                    </div>
                  </div>
                )}

                {/* --- 할일 가지: 코르크 메모보드 (포스트잇) --- */}
                {treeBranch === "할일" && (
                  <div style={{ background: theme === "dark" ? "linear-gradient(135deg,#2A2015,#231A12)" : "linear-gradient(135deg,#E8D9BE,#DFCEAD)", borderRadius: 18, padding: "18px 16px", marginBottom: 14, border: `1px solid ${T.line}` }}>
                    <div style={{ fontSize: 12, color: theme === "dark" ? "#C9A876" : "#8A6A3E", marginBottom: 14, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                      📌 던져둔 것들 · {branchDetail.count}개
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                      {branchDetail.items.length === 0 ? (
                        <div style={{ fontSize: 13, color: T.dim }}>아직 던져둔 할 일이 없어요.</div>
                      ) : branchDetail.items.map((e, i) => {
                        const notes = ["#FFE4A3", "#FFD1DC", "#C9E4CA", "#BFD7EA"];
                        const rot = [-3, 2, -1.5, 3, -2][i % 5];
                        return (
                          <div key={e.id} style={{ background: notes[i % 4], color: "#3A3020", borderRadius: 3, padding: "12px 12px", width: "calc(50% - 5px)", minHeight: 62, transform: `rotate(${rot}deg)`, boxShadow: "0 3px 6px rgba(0,0,0,0.2)", position: "relative", fontSize: 13, lineHeight: 1.4 }}>
                            <div style={{ position: "absolute", top: -6, left: "50%", transform: "translateX(-50%)", width: 10, height: 10, borderRadius: "50%", background: "#C0492E", boxShadow: "0 1px 2px rgba(0,0,0,0.3)" }} />
                            {e.text.length > 28 ? e.text.slice(0, 28) + "…" : e.text}
                          </div>
                        );
                      })}
                    </div>
                    <div style={{ fontSize: 12, color: theme === "dark" ? "#A89070" : "#8A6A3E", marginTop: 16, lineHeight: 1.6, fontStyle: "italic" }}>
                      완료 체크 같은 건 없어요. 급하면 알아서 하겠죠. 안 급하면 그냥 붙여둬도 되고요.
                    </div>
                  </div>
                )}

                {/* --- 관계 가지: 누구를 자주 떠올렸나 --- */}
                {treeBranch === "관계" && (
                  <div style={{ background: T.card, borderRadius: 18, padding: "18px 16px", marginBottom: 14 }}>
                    <div style={{ fontSize: 12, color: T.sub, marginBottom: 14, fontWeight: 700 }}>이번 달, 마음에 자주 있던 사람</div>
                    {(() => {
                      const people = {};
                      branchDetail.items.forEach((e) => {
                        ["친구", "동생", "언니", "형", "엄마", "아빠"].forEach((p) => { if (e.text.includes(p)) people[p] = (people[p] || 0) + 1; });
                      });
                      const list = Object.entries(people).sort((a, b) => b[1] - a[1]);
                      const mx = Math.max(...list.map((l) => l[1]), 1);
                      if (list.length === 0) return <div style={{ fontSize: 13, color: T.dim }}>아직 사람 이야기는 많지 않네요.</div>;
                      return (
                        <>
                          <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center", justifyContent: "center", padding: "10px 0" }}>
                            {list.map(([name, n]) => {
                              const size = 44 + (n / mx) * 40;
                              return (
                                <div key={name} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                                  <div style={{ width: size, height: size, borderRadius: "50%", background: "#FFD76F22", border: `1.5px solid #FFD76F`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#FFD76F" }}>{name}</div>
                                  <span style={{ fontSize: 11, color: T.dim }}>{n}번</span>
                                </div>
                              );
                            })}
                          </div>
                          <div style={{ fontSize: 12.5, color: T.text, marginTop: 14, lineHeight: 1.6, background: T.cardAlt, borderRadius: 10, padding: "10px 12px" }}>
                            <span style={{ color: "#FFD76F", fontWeight: 700 }}>AI</span> 이름을 적으면 사람별로 나눠서 모아드려요. "지수랑 카페", "팀장님 때문에 힘듦" 같은 것도 알아채요.
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}

                {/* --- 공통: 세부 태그 분포 (작게, 칩 형태) --- */}
                {Object.keys(branchDetail.subCounts).length > 0 && (
                  <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 16 }}>
                    {Object.entries(branchDetail.subCounts).sort((a, b) => b[1] - a[1]).map(([sub, cnt]) => {
                      const c = CATEGORIES[treeBranch].color;
                      return <span key={sub} style={{ fontSize: 12, fontWeight: 700, color: c, background: c + "1A", padding: "5px 11px", borderRadius: 999 }}>#{sub} <span style={{ color: T.sub, fontWeight: 400 }}>{cnt}</span></span>;
                    })}
                  </div>
                )}
                <div style={{ fontSize: 12, color: T.sub, marginBottom: 8, fontWeight: 700, paddingLeft: 2 }}>이 가지에 달린 기록</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
                  {branchDetail.items.map((e) => (
                    <div key={e.id} style={{ background: T.card, borderRadius: 12, padding: "12px 14px" }}>
                      <div style={{ fontSize: 13.5, lineHeight: 1.5, marginBottom: 6 }}>{e.text}</div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", gap: 5 }}>{e.tags.filter((t) => SUBTAG_CAT[t] === treeBranch).map((t) => { const c = CATEGORIES[treeBranch].color; return <span key={t} style={{ fontSize: 11, fontWeight: 700, color: c, background: c + "1E", padding: "2px 8px", borderRadius: 999 }}>#{t}</span>; })}</div>
                        <span style={{ fontSize: 11, color: T.dim }}>{e.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}


        {/* ===== 설정 ===== */}
        {tab === "settings" && (
          <div style={{ padding: "6px 20px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ background: T.card, borderRadius: 14, padding: "15px 16px", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 42, height: 42, borderRadius: "50%", background: T.line, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><User size={20} color="#8B85A0" /></div>
              <div style={{ flex: 1 }}><div style={{ fontSize: 14.5, fontWeight: 500 }}>{signedIn ? "user@example.com" : "게스트로 쓰는 중"}</div><div style={{ fontSize: 11.5, color: T.sub }}>{signedIn ? "기록이 계정에 안전하게 연결돼 있어요" : "가입하면 기록을 잃어버리지 않아요"}</div></div>
              {!signedIn && <button onClick={() => { setSignedIn(true); showToast("기록이 계정에 연결됐어요"); }} style={{ background: T.text, color: T.bg, border: "none", borderRadius: 999, padding: "7px 13px", fontSize: 12, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>가입</button>}
            </div>
            <div style={{ background: T.card, borderRadius: 14, padding: "15px 16px", display: "flex", alignItems: "center", gap: 12 }}>
              <Bell size={18} color="#E8A24C" style={{ flexShrink: 0 }} />
              <div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 500 }}>가끔 안부 묻기</div><div style={{ fontSize: 11.5, color: T.sub }}>하루 최대 1번, 예측 못 할 때 · 잔소리 없음</div></div>
              <div style={{ width: 44, height: 26, borderRadius: 999, background: "#5FD9B4", position: "relative", flexShrink: 0 }}><span style={{ position: "absolute", top: 3, left: 21, width: 20, height: 20, borderRadius: "50%", background: T.text }} /></div>
            </div>
            {/* 테마 선택 */}
            <div style={{ background: T.card, borderRadius: 14, padding: "15px 16px", display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>{theme === "dark" ? "🌙" : "☀️"}</span>
              <div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 500 }}>화면 테마</div><div style={{ fontSize: 11.5, color: T.sub }}>당신 취향대로 골라요</div></div>
              <div style={{ display: "flex", background: T.chipDim, borderRadius: 999, padding: 3, flexShrink: 0 }}>
                <button onClick={() => setTheme("light")} style={{ background: theme === "light" ? T.invBg : "transparent", color: theme === "light" ? T.invText : T.sub, border: "none", borderRadius: 999, padding: "6px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>라이트</button>
                <button onClick={() => setTheme("dark")} style={{ background: theme === "dark" ? T.invBg : "transparent", color: theme === "dark" ? T.invText : T.sub, border: "none", borderRadius: 999, padding: "6px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>다크</button>
              </div>
            </div>
            <div style={{ background: T.card, borderRadius: 14, padding: "16px", lineHeight: 1.7, fontSize: 13.5 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}><Shield size={17} color="#5FD9B4" /><span style={{ fontWeight: 700, fontSize: 14 }}>당신의 기록을 지키는 약속</span></div>
              <div style={{ color: T.text }}>· 당신이 던진 내용을 광고에 팔지 않아요.<br />· 민감한 기록은 기기에 먼저 저장돼요.<br />· 누구에게도 당신의 기록을 넘기지 않아요.</div>
            </div>
            <button onClick={() => showToast("기록을 파일로 내보냈어요 (데모)")} style={{ background: T.card, border: "none", borderRadius: 14, padding: "15px 16px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer", color: T.text, textAlign: "left", width: "100%" }}><Download size={18} color="#7C9EFF" style={{ flexShrink: 0 }} /><div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 500 }}>내 기록 전부 내보내기</div><div style={{ fontSize: 11.5, color: T.sub }}>언제든 갖고 나갈 수 있어요</div></div></button>
            <button onClick={() => showToast("설정 · 약관 (데모)")} style={{ background: T.card, border: "none", borderRadius: 14, padding: "15px 16px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer", color: "#FF6F91", textAlign: "left", width: "100%" }}><Trash2 size={18} color="#FF6F91" style={{ flexShrink: 0 }} /><div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 500, color: T.text }}>모든 기록 완전히 지우기</div><div style={{ fontSize: 11.5, color: T.sub }}>지우면 서버에서도 사라져요</div></div></button>
            <div style={{ fontSize: 11.5, color: T.dim, textAlign: "center", lineHeight: 1.7, padding: "4px 0" }}>툭 v1.0.0 · 만 14세 미만은 보호자 동의가 필요해요<br />툭은 당신을 어떤 유형으로도 함부로 판단하지 않아요</div>
          </div>
        )}

        {/* 하단 탭 */}
        <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 420, background: T.cardAlt, borderTop: `1px solid ${T.line}`, display: "flex", justifyContent: "space-around", padding: "10px 0 18px", zIndex: 40 }}>
          {[{ key: "home", label: "홈", icon: LayoutGrid }, { key: "report", label: "나무", icon: TreePine }, { key: "settings", label: "설정", icon: Settings }].map((t) => {
            const Icon = t.icon, active = tab === t.key;
            return <button key={t.key} onClick={() => { setTab(t.key); setExpandedId(null); setEditingId(null); setTreeBranch(null); setForestView(false); setSearch(""); }} style={{ background: "none", border: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, cursor: "pointer", opacity: active ? 1 : 0.4 }}><Icon size={20} color={active ? T.text : T.sub} /><span style={{ fontSize: 10, color: active ? T.text : T.sub }}>{t.label}</span></button>;
          })}
        </div>
      </div>
    </div>
  );
}
