"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AI_REACTIONS, CATEGORIES, CURRENT_MONTH, SUBTAG_CAT, THEMES, seed } from "@/lib/tuk/constants";
import { guessTags } from "@/lib/tuk/classify";
import type { Entry, ThemeName, ThemePalette } from "@/lib/tuk/types";

interface TodayLeaf {
  id: number;
  color: string;
  x: number;
  y: number;
}

interface AppContextValue {
  entries: Entry[];
  throwEntry: (text: string) => void;
  removeTag: (id: number, tag: string) => void;
  addTag: (id: number, tag: string) => void;
  deleteEntry: (id: number) => void;

  theme: ThemeName;
  setTheme: (t: ThemeName) => void;
  T: ThemePalette;

  signedIn: boolean;
  setSignedIn: (v: boolean) => void;

  toast: string | null;
  showToast: (m: string) => void;
  learnNote: string | null;

  todayLeaves: TodayLeaf[];
  leafPop: number | null;
  aiReaction: string | null;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<Entry[]>(seed);
  const [theme, setTheme] = useState<ThemeName>("dark");
  const [signedIn, setSignedIn] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [learnNote, setLearnNote] = useState<string | null>(null);
  const [todayLeaves, setTodayLeaves] = useState<TodayLeaf[]>([]);
  const [leafPop, setLeafPop] = useState<number | null>(null);
  const [aiReaction, setAiReaction] = useState<string | null>(null);
  const idRef = useRef(1000);

  const showToast = useCallback((m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 1800);
  }, []);

  const throwEntry = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const tags = guessTags(trimmed);
    const now = new Date();
    const currentMonthNum = CURRENT_MONTH.split("-")[1];
    const id = idRef.current++;
    setEntries((p) => [
      { id, month: CURRENT_MONTH, text: trimmed, tags, time: `${currentMonthNum}/${now.getDate()}` },
      ...p,
    ]);

    // 즉각 보상: 오늘 나무에 잎 하나 돋기
    const leafColor = tags.length ? CATEGORIES[SUBTAG_CAT[tags[0]]]?.color || "#7FB069" : "#7FB069";
    const leafId = idRef.current++;
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
  }, []);

  const removeTag = useCallback((id: number, tag: string) => {
    setEntries((p) => p.map((e) => (e.id === id ? { ...e, tags: e.tags.filter((t) => t !== tag) } : e)));
  }, []);

  const addTag = useCallback((id: number, tag: string) => {
    setEntries((p) =>
      p.map((e) => (e.id === id && !e.tags.includes(tag) && e.tags.length < 2 ? { ...e, tags: [...e.tags, tag] } : e))
    );
    setLearnNote("고쳤어요 · 비슷한 기록은 다음부터 이렇게 붙일게요");
    setTimeout(() => setLearnNote(null), 2200);
  }, []);

  const deleteEntry = useCallback(
    (id: number) => {
      setEntries((p) => p.filter((e) => e.id !== id));
      showToast("지웠어요. 원래 그런 거예요.");
    },
    [showToast]
  );

  const T = THEMES[theme];

  const value = useMemo<AppContextValue>(
    () => ({
      entries,
      throwEntry,
      removeTag,
      addTag,
      deleteEntry,
      theme,
      setTheme,
      T,
      signedIn,
      setSignedIn,
      toast,
      showToast,
      learnNote,
      todayLeaves,
      leafPop,
      aiReaction,
    }),
    [entries, throwEntry, removeTag, addTag, deleteEntry, theme, T, signedIn, toast, showToast, learnNote, todayLeaves, leafPop, aiReaction]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useTuk() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useTuk must be used within AppProvider");
  return ctx;
}
