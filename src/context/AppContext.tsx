"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { AI_REACTIONS, SUBTAG_CAT, THEMES } from "@/lib/tuk/constants";
import { guessTags } from "@/lib/tuk/classify";
import { flushPendingWrites, localEntriesRepo, migrateLocalEntriesToRemote, remoteEntriesRepo } from "@/lib/tuk/entriesRepo";
import { clearPersonalization, recordCorrection } from "@/lib/tuk/personalization";
import { dataUrlToBlob, uploadEntryImage } from "@/lib/tuk/imageUpload";
import { cancelReminder, rescheduleAll, rescheduleCheckins, scheduleReminder } from "@/lib/tuk/notify";
import { nowContextString, reminderLabelOf } from "@/lib/tuk/date";
import type { Entry, ThemeName, ThemePalette } from "@/lib/tuk/types";

interface TodayLeaf {
  id: string;
  color: string;
  x: number;
  y: number;
}

interface AppContextValue {
  entries: Entry[];
  throwEntry: (text: string, image?: string | null) => void;
  removeTag: (id: string, tag: string) => void;
  addTag: (id: string, tag: string) => void;
  deleteEntry: (id: string) => void;
  clearReminder: (id: string) => void;
  deleteAllEntries: () => Promise<void>;

  theme: ThemeName;
  setTheme: (t: ThemeName) => void;
  T: ThemePalette;

  user: User | null;
  signedIn: boolean;
  signInWithEmail: (email: string, birthdate?: string, guardianConsent?: boolean) => Promise<{ error: string | null }>;
  verifyEmailOtp: (email: string, token: string) => Promise<{ error: string | null }>;
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

  // classifyEntry는 클로저로 캡처한 repo가 아니라 이 ref로 "지금 로그인된 유저"를
  // 확인한다 — 던진 직후 바로 로그인하면 로컬→서버 마이그레이션이 분류 응답보다
  // 먼저 끝날 수 있어, 분류 결과가 이미 비워진 로컬 저장소로 유실되는 걸 막는다.
  const latestUserRef = useRef<User | null>(null);
  useEffect(() => {
    latestUserRef.current = user;
  }, [user]);

  // 로그인 직후 진행 중인 로컬→서버 마이그레이션을 classifyEntry가 기다릴 수 있게
  // 하는 참조. 마이그레이션 도중에 분류 결과가 오면 targetRepo를 고르기 전에
  // 이 프라미스가 끝나길 기다려야 로컬/서버 어느 쪽으로도 유실되지 않는다.
  const migrationPromiseRef = useRef<Promise<void> | null>(null);

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

    // 안부 알림을 지금(=이번 방문) 기준으로 다시 건다. 계속 열면 매번 뒤로 밀려
    // 절대 안 오고, 한동안 안 열 때만 뜬다. 권한은 여기서 조르지 않는다(네이티브 전용).
    const checkinsOn = window.localStorage.getItem("tuk:notifyPref") !== "off";
    rescheduleCheckins(checkinsOn).catch((err) => console.error(err));
  }, []);

  // 인증 상태 추적. 게스트↔로그인 전환 시 entries 소스를 로컬↔서버로 바꾸고,
  // 로그인 순간엔 로컬에 쌓여있던 기록을 서버로 옮긴다.
  useEffect(() => {
    let cancelled = false;

    const loadFor = async (nextUser: User | null) => {
      try {
        const loaded = nextUser ? await remoteEntriesRepo(nextUser.id).load() : await localEntriesRepo.load();
        if (!cancelled) {
          setEntries(loaded);
          // 네이티브에서만: 아직 안 지난 예약 알림을 다시 걸어둔다(다른 기기/웹에서
          // 던져 이 기기엔 예약이 없던 것도 살아난다). 웹에선 no-op.
          rescheduleAll(loaded).catch((err) => console.error(err));
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) showToast("기록을 불러오지 못했어요");
      }
    };

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setUser(session?.user ?? null);
      // 새 기기/브라우저라 로컬엔 온보딩 흔적이 없어도, 이미 계정이 있는 사람에게
      // 온보딩을 다시 들이밀지 않는다.
      if (session?.user && typeof window !== "undefined") {
        window.localStorage.setItem("tuk:onboarded", "1");
        // 지난 세션에서 네트워크 문제로 서버에 못 올라간 기록/수정이 있으면
        // 여기서 다시 시도한다 — loadFor보다 먼저 해야 그 결과가 곧장 반영된다.
        await flushPendingWrites(session.user.id).catch((err) => console.error(err));
      }
      loadFor(session?.user ?? null);
    });

    const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
      const nextUser = session?.user ?? null;
      setUser(nextUser);
      if (event === "SIGNED_IN" && nextUser) {
        const migration = migrateLocalEntriesToRemote(nextUser.id).catch((err) => {
          console.error(err);
          showToast("이전 기록을 옮기지 못했어요");
        });
        migrationPromiseRef.current = migration;
        await migration;
        migrationPromiseRef.current = null;
        await flushPendingWrites(nextUser.id).catch((err) => console.error(err));
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
      let category: Entry["category"] = null;
      let people: string[] = [];
      let remindAt: Entry["remindAt"] = null;
      try {
        const res = await fetch("/api/classify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, now: nowContextString() }),
        });
        if (!res.ok) throw new Error(`classify failed: ${res.status}`);
        const data = await res.json();
        risk = Boolean(data.risk);
        if (!risk) {
          people = Array.isArray(data.people) ? data.people.slice(0, 5) : [];
          // 서버가 준 로컬 ISO를 로컬 시각으로 파싱해 실제 미래일 때만 채택한다.
          if (typeof data.remindAt === "string" && new Date(data.remindAt).getTime() > Date.now()) {
            remindAt = data.remindAt;
          }
          if (!data.undecided && data.category) {
            tags = Array.isArray(data.subtags) ? data.subtags.slice(0, 4) : [];
            category = data.category;
            if (data.category === "소비") {
              spendEmotion = data.spendEmotion ?? null;
            }
          }
        }
      } catch (err) {
        console.error(err);
        tags = guessTags(text); // 분류 서버 호출 실패 시 임시 키워드 매칭으로 대체
        category = tags[0] ? SUBTAG_CAT[tags[0]] ?? null : null;
      }

      // 현재 이 함수가 바인딩된 repo는 호출 시점의 게스트/로그인 상태를 가리킨다.
      // 던진 직후 곧바로 로그인해 로컬→서버 마이그레이션이 진행/완료되면 이 update는
      // 이미 비워진 로컬 저장소를 향하게 되므로, 진행 중인 마이그레이션을 먼저
      // 기다린 뒤 최신 유저 기준 repo를 다시 계산해 서버 쪽에 반영되게 한다.
      if (migrationPromiseRef.current) await migrationPromiseRef.current;
      const targetRepo = latestUserRef.current ? remoteEntriesRepo(latestUserRef.current.id) : repo;
      setEntries((p) => p.map((e) => (e.id === id ? { ...e, tags, risk, spendEmotion, category, people, remindAt } : e)));
      targetRepo.update(id, { tags, risk, spendEmotion, category, people, remindAt }).catch((err) => {
        console.error(err);
      });

      if (risk) return; // 위험 신호가 있으면 가벼운 반응을 붙이지 않는다

      // 시간 표현이 잡혔으면 네이티브에서 로컬 알림을 걸고 결과를 살짝 알려준다.
      if (remindAt) {
        const res = await scheduleReminder({ id, text, remindAt });
        const label = reminderLabelOf(remindAt);
        if (res.ok) showToast(`${label}에 알림을 맞췄어요`);
        else if (res.reason === "web") showToast(`${label}에 알림 예정 · 폰 앱에서 울려요`);
        else if (res.reason === "denied") showToast("알림 권한이 꺼져 있어요");
      }

      const reactableTag = tags.find((t) => AI_REACTIONS[t]);
      if (reactableTag && Math.random() < 0.5) {
        const pool = AI_REACTIONS[reactableTag];
        setAiReaction(pool[Math.floor(Math.random() * pool.length)]);
        setTimeout(() => setAiReaction(null), 3200);
      }
    },
    [repo, showToast]
  );

  const throwEntry = useCallback(
    (text: string, image?: string | null) => {
      const trimmed = text.trim();
      if (!trimmed && !image) return; // 글도 사진도 없으면 던질 게 없다
      const entry: Entry = { id: crypto.randomUUID(), text: trimmed, tags: [], createdAt: new Date().toISOString(), risk: false, spendEmotion: null, category: null, people: [], image: image ?? null, remindAt: null };
      setEntries((p) => [entry, ...p]);

      // 즉각 보상: 오늘 나무에 잎 하나 돋기 (분류 전이라 아직 카테고리 색은 모름)
      const leafId = crypto.randomUUID();
      const angle = Math.random() * Math.PI - Math.PI / 2; // 위쪽 반원
      const dist = 20 + Math.random() * 42;
      const leaf = { id: leafId, color: "#7FB069", x: Math.cos(angle) * dist, y: -Math.abs(Math.sin(angle) * dist) - 8 };
      setTodayLeaves((prev) => [...prev, leaf]);
      setLeafPop(leafId);
      setTimeout(() => setLeafPop(null), 700);

      // 저장은 순서대로: (사진이 있으면) 업로드 → insert → 분류. insert가 분류보다
      // 먼저 끝나야 분류 결과 update가 빈 곳을 때리지 않는다.
      (async () => {
        let entryToStore = entry;
        const user = latestUserRef.current;
        if (user && image) {
          try {
            await uploadEntryImage(user.id, entry.id, dataUrlToBlob(image));
          } catch (err) {
            console.error(err);
            showToast("사진을 올리지 못했어요");
            // 업로드 실패 시 image를 비워 서버엔 has_image=false로 남긴다(깨진 이미지 방지).
            // 화면상 미리보기는 이번 세션 동안만 남는다.
            entryToStore = { ...entry, image: null };
          }
        }
        if (migrationPromiseRef.current) await migrationPromiseRef.current;
        const repoNow = latestUserRef.current ? remoteEntriesRepo(latestUserRef.current.id) : localEntriesRepo;
        try {
          await repoNow.insert(entryToStore);
        } catch (err) {
          console.error(err);
          showToast("기록을 저장하지 못했어요");
        }
        if (trimmed) classifyEntry(entry.id, trimmed);
      })();
    },
    [showToast, classifyEntry]
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
          if (e.id === id && !e.tags.includes(tag) && e.tags.length < 4) {
            sourceText = e.text;
            // 태그는 화면에서 각자 제 카테고리 가지에 걸린다(catOfTag). 그래서 여기선
            // 기록의 대표 category는 비어있을 때만 이 태그로 채우고, 이미 있으면 유지한다.
            const category = e.category ?? SUBTAG_CAT[tag] ?? null;
            return { ...e, tags: [...e.tags, tag], category };
          }
          return e;
        });
        const updated = next.find((e) => e.id === id);
        if (updated) {
          repo.update(id, { tags: updated.tags, category: updated.category }).catch((err) => {
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
      cancelReminder(id).catch((err) => console.error(err)); // 예약된 알림도 함께 취소
      showToast("지웠어요. 원래 그런 거예요.");
    },
    [repo, showToast]
  );

  // 기록은 두고 예약된 알림만 끈다.
  const clearReminder = useCallback(
    (id: string) => {
      setEntries((p) => p.map((e) => (e.id === id ? { ...e, remindAt: null } : e)));
      repo.update(id, { remindAt: null }).catch((err) => {
        console.error(err);
        showToast("알림을 끄지 못했어요");
      });
      cancelReminder(id).catch((err) => console.error(err));
      showToast("알림을 껐어요");
    },
    [repo, showToast]
  );

  const deleteAllEntries = useCallback(async () => {
    setEntries([]);
    try {
      if (user) {
        await remoteEntriesRepo(user.id).removeAll();
        await clearPersonalization(user.id);
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
    async (email: string, birthdate?: string, guardianConsent?: boolean) => {
      // 보호자 동의 여부와 시각을 계정 메타데이터에 함께 남긴다 — 체크박스는
      // 화면에만 있고 서버 어디에도 기록되지 않으면 나중에 확인할 수 없다.
      const data =
        birthdate || guardianConsent
          ? {
              ...(birthdate ? { birthdate } : {}),
              ...(guardianConsent ? { guardianConsentAt: new Date().toISOString() } : {}),
            }
          : undefined;
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data,
        },
      });
      return { error: error?.message ?? null };
    },
    [supabase]
  );

  // 메일 링크 대신 인증 코드를 직접 입력해 로그인한다. 메일 앱이 링크를
  // 자체 인앱 브라우저로 열어버리면(특히 모바일) PKCE의 "같은 브라우저" 조건이
  // 깨져 링크 클릭이 실패할 수 있는데, 코드 입력은 그 문제와 무관하게 항상 된다.
  const verifyEmailOtp = useCallback(
    async (email: string, token: string) => {
      const { error } = await supabase.auth.verifyOtp({ email, token, type: "email" });
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
      clearReminder,
      deleteAllEntries,
      theme,
      setTheme,
      T,
      user,
      signedIn: !!user,
      signInWithEmail,
      verifyEmailOtp,
      signOut,
      toast,
      showToast,
      learnNote,
      welcomeBack,
      todayLeaves,
      leafPop,
      aiReaction,
    }),
    [entries, throwEntry, removeTag, addTag, deleteEntry, clearReminder, deleteAllEntries, theme, T, user, signInWithEmail, verifyEmailOtp, signOut, toast, showToast, learnNote, welcomeBack, todayLeaves, leafPop, aiReaction]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useTuk() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useTuk must be used within AppProvider");
  return ctx;
}
