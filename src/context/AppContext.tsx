"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { AI_REACTIONS, THEMES } from "@/lib/tuk/constants";
import { guessTags } from "@/lib/tuk/classify";
import { localEntriesRepo, migrateLocalEntriesToRemote, remoteEntriesRepo } from "@/lib/tuk/entriesRepo";
import { recordCorrection } from "@/lib/tuk/personalization";
import type { Entry, ThemeName, ThemePalette } from "@/lib/tuk/types";

interface TodayLeaf {
  id: string;
  color: string;
  x: number;
  y: number;
}

interface AppContextValue {
  entries: Entry[];
  throwEntry: (text: string) => void;
  removeTag: (id: string, tag: string) => void;
  addTag: (id: string, tag: string) => void;
  deleteEntry: (id: string) => void;
  deleteAllEntries: () => Promise<void>;

  theme: ThemeName;
  setTheme: (t: ThemeName) => void;
  T: ThemePalette;

  user: User | null;
  signedIn: boolean;
  signInWithEmail: (email: string, birthdate?: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;

  toast: string | null;
  showToast: (m: string) => void;
  learnNote: string | null;
  welcomeBack: string | null;

  todayLeaves: TodayLeaf[];
  leafPop: string | null;
  aiReaction: string | null;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const supabase = useMemo(() => createClient(), []);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [theme, setTheme] = useState<ThemeName>("dark");
  const [toast, setToast] = useState<string | null>(null);
  const [learnNote, setLearnNote] = useState<string | null>(null);
  const [todayLeaves, setTodayLeaves] = useState<TodayLeaf[]>([]);
  const [leafPop, setLeafPop] = useState<string | null>(null);
  const [aiReaction, setAiReaction] = useState<string | null>(null);
  const [welcomeBack, setWelcomeBack] = useState<string | null>(null);

  const showToast = useCallback((m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 1800);
  }, []);

  // 오랜만에 열었을 때 죄책감 없이 반겨주기. 로그인 여부와 무관하게 이 기기의
  // 마지막 방문 시각만 본다. localStorage는 서버에 없으므로 반드시 마운트 후
  // (useEffect 안에서)에만 읽어야 한다 — lazy initializer로 옮기면 서버가 렌더한
  // HTML(배너 없음)과 클라이언트 첫 렌더(배너 있음)가 어긋나 hydration 에러가 난다.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const last = window.localStorage.getItem("tuk:lastVisit");
    if (last) {
      const daysSince = (Date.now() - Number(last)) / (1000 * 60 * 60 * 24);
      if (daysSince >= 7) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- 위 주석 참고: 의도된 마운트 후 1회성 setState.
        setWelcomeBack(daysSince >= 21 ? "오랜만이에요. 그동안 뭐 있었어요?" : "다시 와줘서 반가워요.");
      }
    }
    window.localStorage.setItem("tuk:lastVisit", String(Date.now()));
  }, []);

  // 인증 상태 추적. 게스트↔로그인 전환 시 entries 소스를 로컬↔서버로 바꾸고,
  // 로그인 순간엔 로컬에 쌓여있던 기록을 서버로 옮긴다.
  useEffect(() => {
    let cancelled = false;

    const loadFor = async (nextUser: User | null) => {
      try {
        const loaded = nextUser ? await remoteEntriesRepo(nextUser.id).load() : await localEntriesRepo.load();
        if (!cancelled) setEntries(loaded);
      } catch (err) {
        console.error(err);
        if (!cancelled) showToast("기록을 불러오지 못했어요");
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      loadFor(session?.user ?? null);
    });

    const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
      const nextUser = session?.user ?? null;
      setUser(nextUser);
      if (event === "SIGNED_IN" && nextUser) {
        try {
          await migrateLocalEntriesToRemote(nextUser.id);
        } catch (err) {
          console.error(err);
          showToast("이전 기록을 옮기지 못했어요");
        }
      }
      loadFor(nextUser);
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  const repo = useMemo(() => (user ? remoteEntriesRepo(user.id) : localEntriesRepo), [user]);

  // 던진 직후엔 아직 태그를 몰라서(=AI 분류가 비동기) 던지기 자체는 즉시 끝내고,
  // 분류가 끝나면 이 함수가 태그/위험신호를 채워 넣는다.
  const classifyEntry = useCallback(
    async (id: string, text: string) => {
      let tags: string[] = [];
      let risk = false;
      let spendEmotion: Entry["spendEmotion"] = null;
      try {
        const res = await fetch("/api/classify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });
        if (!res.ok) throw new Error(`classify failed: ${res.status}`);
        const data = await res.json();
        risk = Boolean(data.risk);
        if (!risk && !data.undecided && data.category) {
          tags = Array.isArray(data.subtags) ? data.subtags.slice(0, 2) : [];
          if (data.category === "소비") {
            spendEmotion = data.spendEmotion ?? null;
          }
        }
      } catch (err) {
        console.error(err);
        tags = guessTags(text); // 분류 서버 호출 실패 시 임시 키워드 매칭으로 대체
      }

      setEntries((p) => p.map((e) => (e.id === id ? { ...e, tags, risk, spendEmotion } : e)));
      repo.update(id, { tags, risk, spendEmotion }).catch((err) => {
        console.error(err);
      });

      if (risk) return; // 위험 신호가 있으면 가벼운 반응을 붙이지 않는다

      const reactableTag = tags.find((t) => AI_REACTIONS[t]);
      if (reactableTag && Math.random() < 0.5) {
        const pool = AI_REACTIONS[reactableTag];
        setAiReaction(pool[Math.floor(Math.random() * pool.length)]);
        setTimeout(() => setAiReaction(null), 3200);
      }
    },
    [repo]
  );

  const throwEntry = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      const entry: Entry = { id: crypto.randomUUID(), text: trimmed, tags: [], createdAt: new Date().toISOString(), risk: false, spendEmotion: null };
      setEntries((p) => [entry, ...p]);
      repo.insert(entry).catch((err) => {
        console.error(err);
        showToast("기록을 저장하지 못했어요");
      });

      // 즉각 보상: 오늘 나무에 잎 하나 돋기 (분류 전이라 아직 카테고리 색은 모름)
      const leafId = crypto.randomUUID();
      const angle = Math.random() * Math.PI - Math.PI / 2; // 위쪽 반원
      const dist = 20 + Math.random() * 42;
      const leaf = { id: leafId, color: "#7FB069", x: Math.cos(angle) * dist, y: -Math.abs(Math.sin(angle) * dist) - 8 };
      setTodayLeaves((prev) => [...prev, leaf]);
      setLeafPop(leafId);
      setTimeout(() => setLeafPop(null), 700);

      classifyEntry(entry.id, trimmed);
    },
    [repo, showToast, classifyEntry]
  );

  const removeTag = useCallback(
    (id: string, tag: string) => {
      setEntries((p) => {
        const next = p.map((e) => (e.id === id ? { ...e, tags: e.tags.filter((t) => t !== tag) } : e));
        const updated = next.find((e) => e.id === id);
        if (updated) {
          repo.update(id, { tags: updated.tags }).catch((err) => {
            console.error(err);
            showToast("태그를 저장하지 못했어요");
          });
        }
        return next;
      });
    },
    [repo, showToast]
  );

  const addTag = useCallback(
    (id: string, tag: string) => {
      let sourceText: string | null = null;
      setEntries((p) => {
        const next = p.map((e) => {
          if (e.id === id && !e.tags.includes(tag) && e.tags.length < 2) {
            sourceText = e.text;
            return { ...e, tags: [...e.tags, tag] };
          }
          return e;
        });
        const updated = next.find((e) => e.id === id);
        if (updated) {
          repo.update(id, { tags: updated.tags }).catch((err) => {
            console.error(err);
            showToast("태그를 저장하지 못했어요");
          });
        }
        return next;
      });
      // 로그인한 사용자의 수정 이력을 저장해두면, 다음 분류 때 이 사람의 표현을 우선 참고한다.
      if (user && sourceText) {
        recordCorrection(user.id, sourceText, tag).catch((err) => console.error(err));
      }
      setLearnNote("고쳤어요 · 비슷한 기록은 다음부터 이렇게 붙일게요");
      setTimeout(() => setLearnNote(null), 2200);
    },
    [repo, showToast, user]
  );

  const deleteEntry = useCallback(
    (id: string) => {
      setEntries((p) => p.filter((e) => e.id !== id));
      repo.remove(id).catch((err) => {
        console.error(err);
        showToast("삭제하지 못했어요");
      });
      showToast("지웠어요. 원래 그런 거예요.");
    },
    [repo, showToast]
  );

  const deleteAllEntries = useCallback(async () => {
    setEntries([]);
    try {
      if (user) {
        await remoteEntriesRepo(user.id).removeAll();
      } else {
        localEntriesRepo.clear();
      }
      showToast("지웠어요. 처음부터 다시 시작해도 괜찮아요.");
    } catch (err) {
      console.error(err);
      showToast("삭제하지 못했어요");
    }
  }, [user, showToast]);

  const signInWithEmail = useCallback(
    async (email: string, birthdate?: string) => {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: birthdate ? { birthdate } : undefined,
        },
      });
      return { error: error?.message ?? null };
    },
    [supabase]
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, [supabase]);

  const T = THEMES[theme];

  const value = useMemo<AppContextValue>(
    () => ({
      entries,
      throwEntry,
      removeTag,
      addTag,
      deleteEntry,
      deleteAllEntries,
      theme,
      setTheme,
      T,
      user,
      signedIn: !!user,
      signInWithEmail,
      signOut,
      toast,
      showToast,
      learnNote,
      welcomeBack,
      todayLeaves,
      leafPop,
      aiReaction,
    }),
    [entries, throwEntry, removeTag, addTag, deleteEntry, deleteAllEntries, theme, T, user, signInWithEmail, signOut, toast, showToast, learnNote, welcomeBack, todayLeaves, leafPop, aiReaction]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useTuk() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useTuk must be used within AppProvider");
  return ctx;
}
