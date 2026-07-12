"use client";

import { useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Heart, PiggyBank, Pin, Search, Share2, Sprout, TreePine, X } from "lucide-react";
import { useTuk } from "@/context/AppContext";
import {
  catOfTag,
  CATEGORIES,
  NEGATIVE_TAGS,
  SPEND_EMOTION,
} from "@/lib/tuk/constants";
import { dayLabelOf, monthKeyOf, monthLabelOf } from "@/lib/tuk/date";
import { exportTreeImage } from "@/lib/tuk/shareImage";
import type { CatData, Category } from "@/lib/tuk/types";
import MiniTree from "./MiniTree";
import BubbleCloud from "./BubbleCloud";

const emptyCatData = (): Record<Category, CatData> => {
  const m = {} as Record<Category, CatData>;
  (Object.keys(CATEGORIES) as Category[]).forEach((c) => (m[c] = { total: 0, subs: {} }));
  return m;
};

export default function TreeScreen() {
  const { entries, T, theme, showToast } = useTuk();
  const [viewMonth, setViewMonth] = useState(() => monthKeyOf(new Date()));
  const [treeBranch, setTreeBranch] = useState<Category | null>(null);
  const [forestView, setForestView] = useState(false);
  const [search, setSearch] = useState("");
  const [sharing, setSharing] = useState(false);
  const treeSvgRef = useRef<SVGSVGElement>(null);

  // 실제로 기록이 있는 달 + 이번 달을 최신순으로 나열 (하드코딩된 달 목록 대신 데이터 기반)
  const monthsOrder = useMemo(() => {
    const keys = new Set(entries.map((e) => monthKeyOf(e.createdAt)));
    keys.add(monthKeyOf(new Date()));
    return [...keys].sort((a, b) => {
      const [ay, am] = a.split("-").map(Number);
      const [by, bm] = b.split("-").map(Number);
      return by - ay || bm - am;
    });
  }, [entries]);

  const monthEntries = useMemo(() => entries.filter((e) => monthKeyOf(e.createdAt) === viewMonth), [entries, viewMonth]);
  // 태그별 카테고리는 더 이상 고정 목록(SUBTAG_CAT)으로 역추정하지 않는다.
  // AI가 자유롭게 짓는 세부 태그는 그 목록에 없을 수 있어서, 대신 각 태그가
  // 실제로 달려있던 기록의 category를 그대로 쓴다(한 기록의 태그는 항상
  // 같은 카테고리에 속하므로 안전하다).
  const tagCounts = useMemo(() => {
    const m: Record<string, number> = {};
    monthEntries.forEach((e) => e.tags.forEach((t) => (m[t] = (m[t] || 0) + 1)));
    return m;
  }, [monthEntries]);
  // 태그는 각자 제 카테고리(catOfTag)로 집계된다. 그래서 한 기록의 태그들이
  // 서로 다른 가지에 걸릴 수 있다 (생리→건강, 무기력→감정).
  const tagCategory = useMemo(() => {
    const m: Record<string, Category> = {};
    monthEntries.forEach((e) => {
      e.tags.forEach((t) => {
        const c = catOfTag(t, e.category);
        if (c) m[t] = c;
      });
    });
    return m;
  }, [monthEntries]);
  const topTags = Object.keys(tagCounts).sort((a, b) => tagCounts[b] - tagCounts[a]);

  const catData = useMemo(() => {
    const m = emptyCatData();
    monthEntries.forEach((e) => {
      e.tags.forEach((t) => {
        const c = catOfTag(t, e.category);
        if (!c) return;
        m[c].total += 1;
        m[c].subs[t] = (m[c].subs[t] || 0) + 1;
      });
    });
    return m;
  }, [monthEntries]);

  const comboInsight = useMemo(() => {
    const pairs: Record<string, number> = {};
    monthEntries.forEach((e) => {
      for (let i = 0; i < e.tags.length; i++)
        for (let j = i + 1; j < e.tags.length; j++) {
          const k = [e.tags[i], e.tags[j]].sort().join(" + ");
          pairs[k] = (pairs[k] || 0) + 1;
        }
    });
    return Object.entries(pairs).sort((a, b) => b[1] - a[1])[0];
  }, [monthEntries]);

  const negativeCount = monthEntries.filter((e) => e.tags.some((t) => NEGATIVE_TAGS.includes(t))).length;
  const showGentleNote = negativeCount >= 4;

  // 숲 뷰: 달별 나무 데이터
  const forest = useMemo(() => {
    return monthsOrder.map((mon) => {
      const es = entries.filter((e) => monthKeyOf(e.createdAt) === mon);
      const cd = emptyCatData();
      es.forEach((e) => {
        e.tags.forEach((t) => {
          const c = catOfTag(t, e.category);
          if (!c) return;
          cd[c].total += 1;
          cd[c].subs[t] = (cd[c].subs[t] || 0) + 1;
        });
      });
      const mx = Math.max(...Object.values(cd).map((c) => c.total), 1);
      return { month: mon, label: monthLabelOf(mon), count: es.length, catData: cd, maxCat: mx };
    });
  }, [entries, monthsOrder]);

  // 검색 결과
  const searchResults = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.trim().toLowerCase();
    return entries.filter((e) => e.text.toLowerCase().includes(q) || e.tags.some((t) => t.includes(q)));
  }, [search, entries]);

  // 가지별 상세 분석 데이터
  const branchDetail = useMemo(() => {
    if (!treeBranch) return null;
    // 이 가지에 속하는 태그를 하나라도 가진 기록. (한 기록이 여러 가지에 나올 수 있다.)
    const items = monthEntries.filter((e) => e.tags.some((t) => catOfTag(t, e.category) === treeBranch));
    const subCounts: Record<string, number> = {};
    items.forEach((e) => e.tags.forEach((t) => {
      if (catOfTag(t, e.category) === treeBranch) subCounts[t] = (subCounts[t] || 0) + 1;
    }));
    return { items, subCounts, count: items.length };
  }, [treeBranch, monthEntries]);

  const maxCat = Math.max(...Object.values(catData).map((c) => c.total), 1);
  const monthIdx = monthsOrder.indexOf(viewMonth);
  const isCurrentMonth = viewMonth === monthKeyOf(new Date());
  const treeMood = monthEntries.length === 0 ? "empty" : isCurrentMonth && monthEntries.length < 5 ? "growing" : monthEntries.length < 4 ? "quiet" : "full";

  // 이번 달 소비 감정 요약: 필요/스트레스/충동이 각각 몇 번이었나.
  const spendSummary = useMemo(() => {
    const counts: Record<string, number> = { 필요: 0, 스트레스: 0, 충동: 0 };
    monthEntries.forEach((e) => {
      if (e.spendEmotion) counts[e.spendEmotion] += 1;
    });
    return { counts, total: counts.필요 + counts.스트레스 + counts.충동 };
  }, [monthEntries]);

  // 전체 기록(최신순) 중 가장 최근 "충동" 소비 이후 이어진 소비 기록 수
  const impulseFree = useMemo(() => {
    let s = 0;
    for (const e of entries) {
      if (!e.spendEmotion) continue;
      if (e.spendEmotion === "충동") break;
      s++;
    }
    return s;
  }, [entries]);

  const handleShare = async () => {
    if (!treeSvgRef.current || sharing) return;
    setSharing(true);
    try {
      await exportTreeImage(treeSvgRef.current, monthLabelOf(viewMonth), viewMonth);
      showToast("나무를 이미지로 저장했어요");
    } catch (err) {
      console.error(err);
      showToast("이미지를 만들지 못했어요");
    } finally {
      setSharing(false);
    }
  };

  return (
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
          <div style={{ fontSize: 12.5, color: T.sub, marginBottom: 12 }}>&quot;{search}&quot; · {searchResults.length}개 찾음</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingBottom: 20 }}>
            {searchResults.length === 0 && <div style={{ textAlign: "center", color: T.dim, padding: "40px 0", fontSize: 14 }}>그런 기록은 없네요. 다른 말로 찾아볼래요?</div>}
            {searchResults.map((e) => (
              <div key={e.id} style={{ background: T.card, borderRadius: 12, padding: "12px 14px" }}>
                <div style={{ fontSize: 13.5, lineHeight: 1.5, marginBottom: 6 }}>{e.text}</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", gap: 5 }}>{e.tags.map((t) => { const tc = catOfTag(t, e.category); const c = (tc && CATEGORIES[tc]?.color) || T.sub; return <span key={t} style={{ fontSize: 11, fontWeight: 700, color: c, background: c + "1E", padding: "2px 8px", borderRadius: 999 }}>#{t}</span>; })}</div>
                  <span style={{ fontSize: 11, color: T.dim }}>{monthLabelOf(monthKeyOf(e.createdAt))} · {dayLabelOf(e.createdAt)}</span>
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
                <MiniTree catData={f.catData} maxCat={f.maxCat} size={100} trunk={T.trunk} fruitStroke={T.fruitStroke} />
                <div className="serif" style={{ fontSize: 16, fontWeight: 700, color: T.text }}>{f.label}</div>
                <div style={{ fontSize: 11, color: T.skyInk }}>{f.count > 0 ? `열매 ${f.count}개` : "쉬어간 달"}</div>
              </button>
            ))}
            {/* 미래의 빈 화분 (다음 달 예고) */}
            <div style={{ background: T.cardAlt, border: `1px dashed ${T.line}`, borderRadius: 16, padding: "14px 10px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, minHeight: 150 }}>
              <Sprout size={28} color={T.dim} strokeWidth={1.5} style={{ opacity: 0.7 }} />
              <div style={{ fontSize: 12, color: T.dim, textAlign: "center", lineHeight: 1.5 }}>다음 달 나무는<br />여기서 자라요</div>
            </div>
          </div>
        </div>
      )}

      {/* 월 이동 (한 그루 보기 · 검색 아님 · 가지상세 아님) */}
      {!treeBranch && !forestView && !search.trim() && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, background: T.card, borderRadius: 14, padding: "8px" }}>
          <button onClick={() => { if (monthIdx < monthsOrder.length - 1) setViewMonth(monthsOrder[monthIdx + 1]); }} disabled={monthIdx >= monthsOrder.length - 1} style={{ background: "none", border: "none", padding: "8px 12px", cursor: monthIdx >= monthsOrder.length - 1 ? "default" : "pointer", opacity: monthIdx >= monthsOrder.length - 1 ? 0.25 : 1, color: T.text, display: "flex" }}><ChevronLeft size={20} /></button>
          <div style={{ textAlign: "center" }}>
            <div className="serif" style={{ fontSize: 19, fontWeight: 700 }}>{monthLabelOf(viewMonth)}</div>
            {isCurrentMonth && <div style={{ fontSize: 11, color: "#5FD9B4" }}>지금 자라는 중</div>}
          </div>
          <button onClick={() => { if (monthIdx > 0) setViewMonth(monthsOrder[monthIdx - 1]); }} disabled={monthIdx <= 0} style={{ background: "none", border: "none", padding: "8px 12px", cursor: monthIdx <= 0 ? "default" : "pointer", opacity: monthIdx <= 0 ? 0.25 : 1, color: T.text, display: "flex" }}><ChevronRight size={20} /></button>
        </div>
      )}

      {/* ========== 전체 나무 (한 그루) ========== */}
      {!treeBranch && !forestView && !search.trim() && (
        <div style={{ animation: "fadeUp .3s ease" }}>
          <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
            <div style={{ flex: 1, background: T.card, borderRadius: 14, padding: "14px 16px" }}>
              <div className="serif" style={{ fontSize: 25, fontWeight: 700 }}>{monthEntries.length}개</div>
              <div style={{ fontSize: 12, color: T.sub }}>{monthLabelOf(viewMonth)}의 열매</div>
            </div>
            <div style={{ flex: 1, background: T.card, borderRadius: 14, padding: "14px 16px" }}>
              {topTags[0] ? (
                <>
                  <div className="serif" style={{ fontSize: 25, fontWeight: 700, color: (tagCategory[topTags[0]] && CATEGORIES[tagCategory[topTags[0]]]?.color) || T.text }}>#{topTags[0]}</div>
                  <div style={{ fontSize: 12, color: T.sub }}>가장 많이 열린 열매</div>
                </>
              ) : (
                <>
                  <div className="serif" style={{ fontSize: 25, color: T.dim }}>—</div>
                  <div style={{ fontSize: 12, color: T.sub }}>아직 열매 없음</div>
                </>
              )}
            </div>
          </div>
          <div style={{ position: "relative", width: "100%", aspectRatio: "1/1", borderRadius: 18, background: T.treeSky, overflow: "hidden", border: `1px solid ${T.line}`, marginBottom: 10 }}>
            <svg ref={treeSvgRef} viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%" }}>
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
                const data = catData[cat as Category];
                const strength = data.total / maxCat, len = 58 + strength * 52, rad = (meta.angle * Math.PI) / 180;
                const bx = 150 + Math.sin(rad) * len, by = 158 - Math.cos(rad) * len * 0.92, branchW = 2.5 + strength * 6.5, subs = Object.entries(data.subs);
                const midx = 150 + Math.sin(rad) * len * 0.5 + Math.cos(rad) * 10;
                const midy = 162 - Math.cos(rad) * len * 0.5;
                return (
                  <g key={cat} style={{ cursor: data.total > 0 ? "pointer" : "default" }} onClick={() => { if (data.total > 0) setTreeBranch(cat as Category); }}>
                    <path d={`M150 164 Q${midx} ${midy} ${bx} ${by}`} stroke={T.trunk} strokeWidth={branchW} fill="none" strokeLinecap="round" />
                    {data.total > 0 && (
                      <>
                        {/* 가지마다 잎을 작고 촘촘하게 — 6가지가 서로 안 뭉개지도록 */}
                        {[[0, 0, 1], [-0.7, -0.45, 0.62], [0.7, -0.35, 0.58], [0, 0.55, 0.5]].map(([dx, dy, sc], k) => {
                          const R = (11 + strength * 12) * sc;
                          return <circle key={k} cx={bx + dx * (8 + strength * 6)} cy={by + dy * (8 + strength * 6)} r={R} fill={meta.color} opacity={0.16 + k * 0.015} />;
                        })}
                        {subs.map(([sub, cnt], i) => {
                          const a = (i / Math.max(subs.length, 1)) * Math.PI * 2 + rad, rr = 7 + strength * 11;
                          const fx = bx + Math.cos(a) * rr, fy = by + Math.sin(a) * rr, fruitR = 2.6 + Math.min(cnt, 8) * 1.3;
                          return (
                            <g key={sub}>
                              <circle cx={fx} cy={fy} r={fruitR} fill={meta.color} stroke={T.fruitStroke} strokeWidth="1" />
                              <circle cx={fx - fruitR * 0.32} cy={fy - fruitR * 0.32} r={fruitR * 0.3} fill="#FFF" opacity="0.4" />
                            </g>
                          );
                        })}
                        <text x={Math.max(26, Math.min(274, bx))} y={Math.max(20, by - (17 + strength * 16))} fill={meta.color} fontSize="11" textAnchor="middle" fontWeight="700" style={{ fontFamily: "'Pretendard',sans-serif" }}>{cat}</text>
                      </>
                    )}
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

          {/* 가지 바로가기 칩 (여러 줄로 감쌈 — 카테고리가 늘어도 다 보이게) */}
          {monthEntries.length > 0 && (
            <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 14 }}>
              {Object.entries(CATEGORIES).filter(([c]) => catData[c as Category].total > 0).map(([cat, meta]) => (
                <button key={cat} onClick={() => setTreeBranch(cat as Category)} style={{ display: "flex", alignItems: "center", gap: 5, background: T.card, border: `1px solid ${meta.color}44`, borderRadius: 999, padding: "7px 12px", fontSize: 12.5, color: T.text, cursor: "pointer", whiteSpace: "nowrap" }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: meta.color }} />{cat} <span style={{ color: T.dim }}>{catData[cat as Category].total}</span>
                </button>
              ))}
            </div>
          )}

          <div style={{ background: T.card, borderRadius: 14, padding: "16px", marginBottom: 12, lineHeight: 1.7, fontSize: 14 }}>
            <div style={{ fontSize: 12, color: T.sub, marginBottom: 6, fontWeight: 700 }}>AI가 정리한 {monthLabelOf(viewMonth)}</div>
            {monthEntries.length === 0 ? (
              <span style={{ color: T.text }}>이 달엔 던진 게 없었어요. 그런 달도 있죠. 아무 일 없이 지나간 것도 하나의 기록이에요.</span>
            ) : (
              <>
                {(() => {
                  const tc = Object.entries(catData).sort((a, b) => b[1].total - a[1].total)[0];
                  return tc && tc[1].total > 0 ? (
                    <>
                      {isCurrentMonth ? "아직 초반이지만, " : `${monthLabelOf(viewMonth)}은 `}
                      <span style={{ color: CATEGORIES[tc[0] as Category].color, fontWeight: 700 }}>{tc[0]}</span> 가지가 제일 무성했어요.{" "}
                    </>
                  ) : null;
                })()}
                {comboInsight && (
                  <>
                    특히 <span style={{ color: (tagCategory[comboInsight[0].split(" + ")[0]] && CATEGORIES[tagCategory[comboInsight[0].split(" + ")[0]]]?.color) || T.text, fontWeight: 700 }}>#{comboInsight[0].split(" + ")[0]}</span>과{" "}
                    <span style={{ color: (tagCategory[comboInsight[0].split(" + ")[1]] && CATEGORIES[tagCategory[comboInsight[0].split(" + ")[1]]]?.color) || T.text, fontWeight: 700 }}>#{comboInsight[0].split(" + ")[1]}</span>이 함께 열린 날이 {comboInsight[1]}번 있었어요.{" "}
                  </>
                )}
                그냥 그때의 당신 리듬이에요. 좋다 나쁘다 없이요.
              </>
            )}
          </div>
          {showGentleNote && (
            <div style={{ background: theme !== "light" ? "#20222E" : "#EAEDF5", borderRadius: 14, padding: "14px 16px", marginBottom: 12, lineHeight: 1.7, fontSize: 13.5, border: `1px solid ${theme !== "light" ? "#2E3346" : "#D5DBEA"}`, display: "flex", gap: 10 }}>
              <Heart size={18} color="#7C9EFF" style={{ flexShrink: 0, marginTop: 2 }} />
              <div style={{ color: "#C7CAD6" }}>요즘 지친 마음이 좀 자주 보였어요. 판단하려는 건 아니고요. 혹시 버겁다면, 가까운 사람이나 전문가와 이야기 나눠보는 것도 방법이에요.</div>
            </div>
          )}
          <button onClick={handleShare} disabled={sharing} style={{ width: "100%", background: T.text, color: T.bg, border: "none", borderRadius: 12, padding: "13px", fontSize: 13.5, fontWeight: 700, marginBottom: 20, cursor: sharing ? "default" : "pointer", opacity: sharing ? 0.6 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}><Share2 size={15} /> {sharing ? "이미지 만드는 중..." : `${monthLabelOf(viewMonth)} 나무 공유하기`}</button>
        </div>
      )}

      {/* ========== 가지 상세 (드릴다운) ========== */}
      {treeBranch && branchDetail && (
        <div style={{ animation: "fadeUp .3s ease" }}>
          <button onClick={() => setTreeBranch(null)} style={{ background: "none", border: "none", color: T.sub, display: "flex", alignItems: "center", gap: 4, cursor: "pointer", fontSize: 13, marginBottom: 14, padding: 0 }}><ChevronLeft size={16} /> 전체 나무로</button>
          <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 4 }}>
            <span style={{ width: 13, height: 13, borderRadius: "50%", background: CATEGORIES[treeBranch].color }} />
            <span className="serif" style={{ fontSize: 26, fontWeight: 700 }}>{treeBranch}</span>
          </div>
          <div style={{ fontSize: 13, color: T.sub, marginBottom: 18 }}>{monthLabelOf(viewMonth)}에 {branchDetail.count}번 · 이 가지만 자세히</div>

          {/* --- 소비 가지: 소비 감정 요약 + 충동소비 스트릭 --- */}
          {treeBranch === "소비" && spendSummary.total > 0 && (
            <>
              <div style={{ background: T.card, borderRadius: 14, padding: "15px 16px", marginBottom: 14 }}>
                <div style={{ fontSize: 12, color: T.sub, marginBottom: 12, fontWeight: 700 }}>이번 달 소비, 어떤 마음이었나</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {Object.entries(SPEND_EMOTION).map(([emo, meta]) => (
                    <span key={emo} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13, background: T.cardAlt, borderRadius: 999, padding: "7px 13px", opacity: spendSummary.counts[emo] ? 1 : 0.45 }}>
                      <span style={{ width: 10, height: 10, borderRadius: "50%", background: meta.color }} />
                      <span style={{ color: T.text }}>{emo}</span>
                      <span style={{ color: T.dim, fontWeight: 700 }}>{spendSummary.counts[emo] || 0}</span>
                    </span>
                  ))}
                </div>
              </div>
              <div style={{ background: T.card, borderRadius: 14, padding: "16px", marginBottom: 14, display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ position: "relative", width: 52, height: 52, flexShrink: 0 }}>
                  <div style={{ position: "absolute", inset: 0, borderRadius: 12, background: T.line, overflow: "hidden" }}><div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: `${Math.min(impulseFree / 8, 1) * 100}%`, background: "linear-gradient(180deg,#F0997B,#C05A2E)" }} /></div>
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}><PiggyBank size={26} color="#FCEAE2" /></div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>충동소비 없이 {impulseFree}번째</div>
                  <div style={{ fontSize: 12, color: T.sub, marginTop: 2 }}>천천히 차오르는 중이에요. 끊겨도 괜찮아요.</div>
                </div>
              </div>
            </>
          )}

          {/* --- 감정 가지: 진짜 기분의 파도 --- */}
          {treeBranch === "감정" && (
            <div style={{ background: theme !== "light" ? "linear-gradient(180deg,#1A1D2B,#131417)" : "linear-gradient(180deg,#EAEEF7,#F2F4F7)", borderRadius: 18, padding: "18px 16px", marginBottom: 14, overflow: "hidden" }}>
              <div style={{ fontSize: 12, color: T.sub, marginBottom: 14, fontWeight: 700 }}>이번 달 기분의 파도</div>
              {(() => {
                const moodOf: Record<string, number> = { 기분좋음: 1.1, 카페인: 0, 무기력: -1, 스트레스: -1.1 };
                const vals = branchDetail.items.map((e) => e.tags.reduce((acc, t) => acc + (moodOf[t] ?? 0), 0));
                if (vals.length === 0) return <div style={{ fontSize: 13, color: T.dim }}>아직 기분 기록이 적어요.</div>;
                const W = 300, H = 120, mid = 62;
                const pts = vals.map((m, i) => [10 + (i / Math.max(vals.length - 1, 1)) * (W - 20), mid - m * 32]);
                let path = `M${pts[0][0]} ${pts[0][1]}`;
                for (let i = 0; i < pts.length - 1; i++) {
                  const p0 = pts[i === 0 ? 0 : i - 1], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
                  const c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
                  const c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
                  path += ` C${c1x} ${c1y} ${c2x} ${c2y} ${p2[0]} ${p2[1]}`;
                }
                const fillPath = `${path} L${pts[pts.length - 1][0]} ${H} L${pts[0][0]} ${H} Z`;
                const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
                return (
                  <>
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
                      <path d={`M0 ${mid + 14} Q75 ${mid + 4} 150 ${mid + 14} T300 ${mid + 14} V${H} H0 Z`} fill="url(#wave2)">
                        <animateTransform attributeName="transform" type="translate" values="0 0; -20 2; 0 0" dur="6s" repeatCount="indefinite" />
                      </path>
                      <line x1="0" y1={mid} x2={W} y2={mid} stroke={T.lineSoft} strokeWidth="1" strokeDasharray="2 5" />
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
                  </>
                );
              })()}
            </div>
          )}

          {/* --- 식단 가지: 이번 달 뭘 먹었나 (버블) --- */}
          {treeBranch === "식단" && (
            <div style={{ background: T.card, borderRadius: 18, padding: "16px 14px 10px", marginBottom: 14 }}>
              <div style={{ fontSize: 12, color: T.sub, fontWeight: 700 }}>이번 달, 뭘 자주 먹었나</div>
              <BubbleCloud items={Object.entries(branchDetail.subCounts).map(([label, count]) => ({ label, count }))} color={CATEGORIES.식단.color} T={T} />
            </div>
          )}

          {/* --- 건강 가지: 이번 달 몸이 보낸 신호 (부드러운 막대) --- */}
          {treeBranch === "건강" && (() => {
            const counts: Record<string, number> = {};
            branchDetail.items.forEach((e) => e.tags.forEach((t) => {
              if (catOfTag(t, e.category) === "건강") counts[t] = (counts[t] || 0) + 1;
            }));
            const list = Object.entries(counts).sort((a, b) => b[1] - a[1]);
            if (list.length === 0) return null;
            const mx = Math.max(...list.map((l) => l[1]), 1);
            return (
              <div style={{ background: T.card, borderRadius: 18, padding: "18px 16px", marginBottom: 14 }}>
                <div style={{ fontSize: 12, color: T.sub, marginBottom: 16, fontWeight: 700 }}>이번 달 몸이 보낸 신호</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {list.map(([tag, n]) => (
                    <div key={tag} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 13, color: T.text, width: 48, flexShrink: 0 }}>{tag}</span>
                      <div style={{ flex: 1, height: 10, background: T.cardAlt, borderRadius: 999, overflow: "hidden" }}>
                        <div style={{ width: `${(n / mx) * 100}%`, height: "100%", background: CATEGORIES.건강.color, opacity: 0.85, borderRadius: 999 }} />
                      </div>
                      <span style={{ fontSize: 12, color: T.dim, width: 22, textAlign: "right", flexShrink: 0 }}>{n}</span>
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: 12.5, color: T.text, marginTop: 16, lineHeight: 1.6, background: T.cardAlt, borderRadius: 10, padding: "10px 12px" }}>
                  <span style={{ color: CATEGORIES.건강.color, fontWeight: 700 }}>AI</span> 몸이 보내는 신호를 알아차린 것만으로 충분해요.
                </div>
              </div>
            );
          })()}

          {/* --- 할일 가지: 코르크 메모보드 (포스트잇) --- */}
          {treeBranch === "할일" && (
            <div style={{ background: theme !== "light" ? "linear-gradient(135deg,#2A2015,#231A12)" : "linear-gradient(135deg,#E8D9BE,#DFCEAD)", borderRadius: 18, padding: "18px 16px", marginBottom: 14, border: `1px solid ${T.line}` }}>
              <div style={{ fontSize: 12, color: theme !== "light" ? "#C9A876" : "#8A6A3E", marginBottom: 14, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                <Pin size={13} style={{ display: "inline", verticalAlign: "-2px" }} /> 던져둔 것들 · {branchDetail.count}개
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
              <div style={{ fontSize: 12, color: theme !== "light" ? "#A89070" : "#8A6A3E", marginTop: 16, lineHeight: 1.6, fontStyle: "italic" }}>
                완료 체크 같은 건 없어요. 급하면 알아서 하겠죠. 안 급하면 그냥 붙여둬도 되고요.
              </div>
            </div>
          )}

          {/* --- 관계 가지: 누구를 자주 떠올렸나 --- */}
          {treeBranch === "관계" && (
            <div style={{ background: T.card, borderRadius: 18, padding: "18px 16px", marginBottom: 14 }}>
              <div style={{ fontSize: 12, color: T.sub, marginBottom: 14, fontWeight: 700 }}>이번 달, 마음에 자주 있던 사람</div>
              {(() => {
                const people: Record<string, number> = {};
                // 1순위: AI가 뽑은 실제 등장 인물(이름/호칭). 2순위: 흔한 관계 호칭 텍스트 매칭.
                const WORDS = ["엄마", "아빠", "언니", "누나", "오빠", "형", "동생", "친구", "가족", "연인", "남편", "아내", "남친", "여친", "팀장", "선배", "후배"];
                branchDetail.items.forEach((e) => {
                  const named = (e.people ?? []).map((p) => p.trim()).filter(Boolean);
                  if (named.length > 0) {
                    named.forEach((p) => (people[p] = (people[p] || 0) + 1));
                  } else {
                    WORDS.forEach((p) => { if (e.text.includes(p)) people[p] = (people[p] || 0) + 1; });
                  }
                });
                const list = Object.entries(people).map(([label, count]) => ({ label, count }));
                if (list.length === 0) return <div style={{ fontSize: 13, color: T.dim, padding: "10px 0" }}>아직 사람 이야기는 많지 않네요. 이름을 적으면 사람별로 모아드려요.</div>;
                return (
                  <>
                    <BubbleCloud items={list} color={CATEGORIES.관계.color} T={T} />
                    <div style={{ fontSize: 12.5, color: T.text, marginTop: 6, lineHeight: 1.6, background: T.cardAlt, borderRadius: 10, padding: "10px 12px" }}>
                      <span style={{ color: CATEGORIES.관계.color, fontWeight: 700 }}>AI</span> 이름을 적으면 사람별로 나눠서 모아드려요. &quot;지수랑 카페&quot;, &quot;팀장님 때문에 힘듦&quot; 같은 것도 알아채요.
                    </div>
                  </>
                );
              })()}
            </div>
          )}

          {/* --- 공통: 세부 태그 분포 (작게, 칩 형태). 식단은 버블이 이미 보여주므로 생략 --- */}
          {treeBranch !== "식단" && Object.keys(branchDetail.subCounts).length > 0 && (
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
                  <div style={{ display: "flex", gap: 5 }}>{e.tags.filter((t) => catOfTag(t, e.category) === treeBranch).map((t) => { const c = CATEGORIES[treeBranch].color; return <span key={t} style={{ fontSize: 11, fontWeight: 700, color: c, background: c + "1E", padding: "2px 8px", borderRadius: 999 }}>#{t}</span>; })}</div>
                  <span style={{ fontSize: 11, color: T.dim }}>{dayLabelOf(e.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
