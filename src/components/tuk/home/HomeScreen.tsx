"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Heart, Mic, Send, Sprout, TreeDeciduous, X } from "lucide-react";
import { useTuk } from "@/context/AppContext";
import { ALL_SUBTAGS, CATEGORIES, SUBTAG_CAT } from "@/lib/tuk/constants";
import { dayGroupLabelOf, dayKeyOf, timeLabelOf } from "@/lib/tuk/date";

export default function HomeScreen() {
  const router = useRouter();
  const { entries, T, theme, signedIn, welcomeBack, todayLeaves, leafPop, aiReaction, throwEntry, removeTag, addTag, deleteEntry, showToast } = useTuk();
  const [text, setText] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [welcomeDismissed, setWelcomeDismissed] = useState(false);

  const handleThrow = () => {
    if (!text.trim()) return;
    throwEntry(text);
    setText("");
  };

  const feed = useMemo(
    () => (selectedTag ? entries.filter((e) => e.tags.includes(selectedTag)) : entries),
    [entries, selectedTag]
  );

  return (
    <>
      {welcomeBack && !welcomeDismissed && (
        <div style={{ padding: "0 20px 10px" }}>
          <div style={{ background: theme === "dark" ? "#1E1E20" : "#F0F0F2", borderRadius: 14, padding: "12px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
            <span style={{ fontSize: 13, color: theme === "dark" ? "#D6D6D9" : "#48484E" }}>{welcomeBack}</span>
            <button onClick={() => setWelcomeDismissed(true)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", padding: 0, flexShrink: 0 }}><X size={14} color={T.dim} /></button>
          </div>
        </div>
      )}
      {!signedIn && (
        <div style={{ padding: "0 20px 10px" }}>
          <button onClick={() => router.push("/settings")} style={{ width: "100%", background: "transparent", border: `1px dashed ${T.lineSoft}`, borderRadius: 14, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
            <span style={{ fontSize: 12.5, color: T.sub }}>기록이 쌓이고 있어요 · 가입하면 잃어버리지 않아요</span>
          </button>
        </div>
      )}

      {/* 오늘의 작은 나무 — 던질 때마다 잎이 돋음 (즉각 보상) */}
      <div style={{ padding: "0 20px 10px" }}>
        <div style={{ background: theme === "dark" ? "linear-gradient(180deg,#17211B,#121413)" : "linear-gradient(180deg,#EDF3EE,#F7F9F7)", border: `1px solid ${theme === "dark" ? "#233129" : "#DCE5DE"}`, borderRadius: 16, padding: "14px 16px", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ position: "relative", width: 76, height: 76, flexShrink: 0 }}>
            <svg viewBox="0 0 76 76" style={{ width: "100%", height: "100%" }}>
              <path d="M38 68 Q37 52 38 40 Q39 32 38 26" stroke={T.trunk} strokeWidth="3.5" fill="none" strokeLinecap="round" />
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
          <button onClick={() => router.push("/tree")} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 2, flexShrink: 0 }}>
            <TreeDeciduous size={22} color="#5FD9B4" strokeWidth={1.8} />
            <span style={{ fontSize: 9.5, color: "#8B9A8E" }}>한 달 나무</span>
          </button>
        </div>
      </div>

      {/* 던진 직후 가끔 뜨는 AI 반응 */}
      {aiReaction && (
        <div style={{ padding: "0 20px 10px", animation: "fadeUp .3s ease" }}>
          <div style={{ background: theme === "dark" ? "#1E1E20" : "#F0F0F2", borderRadius: 14, borderTopLeftRadius: 4, padding: "11px 14px", fontSize: 13.5, color: theme === "dark" ? "#D6D6D9" : "#48484E", display: "flex", alignItems: "center", gap: 8, maxWidth: "85%" }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#9DB4FF" }}>AI</span> {aiReaction}
          </div>
        </div>
      )}

      <div style={{ padding: "0 20px 8px" }}>
        <div style={{ background: T.card, borderRadius: 18, padding: 14, border: `1px dashed ${T.lineSoft}` }}>
          <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="오늘 뭐든 툭..." rows={2} style={{ width: "100%", background: "transparent", border: "none", outline: "none", resize: "none", color: T.text, fontSize: 15, fontFamily: "inherit" }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
            <div style={{ display: "flex", gap: 14 }}>
              <button onClick={() => showToast("사진으로 던지기는 준비 중이에요")} aria-label="사진으로 던지기 (준비 중)" style={{ background: "none", border: "none", padding: 0, cursor: "pointer", display: "flex" }}><Camera size={18} color="#8F8F8F" /></button>
              <button onClick={() => showToast("음성으로 던지기는 준비 중이에요")} aria-label="음성으로 던지기 (준비 중)" style={{ background: "none", border: "none", padding: 0, cursor: "pointer", display: "flex" }}><Mic size={18} color="#8F8F8F" /></button>
            </div>
            <button onClick={handleThrow} style={{ display: "flex", alignItems: "center", gap: 6, background: T.text, color: T.bg, border: "none", borderRadius: 999, padding: "8px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}><Send size={14} /> 던지기</button>
          </div>
        </div>
        {/* 첫 사용자용 예시 칩 (기록 없을 때만) */}
        {entries.length === 0 && (
          <div style={{ marginTop: 10, animation: "fadeUp .4s ease" }}>
            <div style={{ fontSize: 11.5, color: T.dim, marginBottom: 7 }}>이런 걸 던져보세요</div>
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
          {(() => {
            const cat = entries.find((e) => e.tags.includes(selectedTag))?.category;
            const c = (cat && CATEGORIES[cat]?.color) || "#8F8F8F";
            return <span style={{ fontSize: 12.5, color: c, fontWeight: 700 }}>#{selectedTag}</span>;
          })()}
          <button onClick={() => setSelectedTag(null)} style={{ background: "none", border: "none", color: T.dim, fontSize: 12, cursor: "pointer" }}>지우기</button>
        </div>
      )}

      <div style={{ padding: "10px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
        {feed.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px 20px", animation: "fadeUp .4s ease" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}><Sprout size={44} color="#5FD9B4" strokeWidth={1.5} /></div>
            <div className="serif" style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>첫 씨앗을 심어볼까요?</div>
            <div style={{ fontSize: 13.5, color: T.sub, lineHeight: 1.7 }}>위에 뭐든 하나 던지면 시작이에요.<br />먹은 거, 산 거, 기분... 정말 아무거나요.</div>
          </div>
        )}
        {feed.map((e, i) => {
          const expanded = expandedId === e.id, editing = editingId === e.id;
          // 날짜가 바뀌는 지점(피드는 최신순)에 그룹 헤더를 끼워 넣는다 — 스레드 피드 감각
          const showDayHeader = i === 0 || dayKeyOf(e.createdAt) !== dayKeyOf(feed[i - 1].createdAt);
          const dayHeader = showDayHeader ? (
            <div key={`day-${e.id}`} style={{ display: "flex", alignItems: "center", gap: 10, marginTop: i === 0 ? 0 : 8 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: T.sub, flexShrink: 0 }}>{dayGroupLabelOf(e.createdAt)}</span>
              <div style={{ flex: 1, height: 1, background: T.line }} />
            </div>
          ) : null;
          if (e.risk) {
            return (
              <div key={e.id} style={{ display: "contents" }}>
                {dayHeader}
                <div style={{ background: T.card, borderRadius: 14, padding: "13px 15px", boxShadow: "0 2px 8px rgba(0,0,0,0.3)" }}>
                <div style={{ fontSize: 14.5, lineHeight: 1.5, marginBottom: 10 }}>{e.text}</div>
                <div style={{ display: "flex", gap: 10, background: theme === "dark" ? "#20222E" : "#EAEDF5", border: `1px solid ${theme === "dark" ? "#2E3346" : "#D5DBEA"}`, borderRadius: 12, padding: "12px 14px", marginBottom: 8 }}>
                  <Heart size={16} color="#7C9EFF" style={{ flexShrink: 0, marginTop: 2 }} />
                  <div style={{ fontSize: 12.5, color: T.text, lineHeight: 1.6 }}>
                    많이 힘들었겠어요. 혼자 감당하지 않아도 돼요.<br />
                    <span style={{ color: T.sub }}>자살예방상담전화 1393 · 24시간 연결돼요</span>
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 11, color: T.dim }}>{timeLabelOf(e.createdAt)}</span>
                  <button onClick={() => deleteEntry(e.id)} style={{ background: "none", border: "none", color: T.dim, fontSize: 11.5, cursor: "pointer" }}>지우기</button>
                </div>
                </div>
              </div>
            );
          }
          return (
            <div key={e.id} style={{ display: "contents" }}>
              {dayHeader}
              <div style={{ background: T.card, borderRadius: 14, padding: "13px 15px", boxShadow: "0 2px 8px rgba(0,0,0,0.3)", border: expanded ? `1px solid ${T.lineSoft}` : "1px solid transparent" }}>
              <div onClick={() => { setExpandedId(expanded ? null : e.id); setEditingId(null); }} style={{ fontSize: 14.5, lineHeight: 1.5, marginBottom: 8, cursor: "pointer" }}>{e.text}</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                  {e.tags.length > 0 ? e.tags.map((t) => {
                    const c = (e.category && CATEGORIES[e.category]?.color) || "#8F8F8F";
                    return <button key={t} onClick={() => setSelectedTag(t)} style={{ fontSize: 11.5, fontWeight: 700, color: c, background: c + "1E", padding: "3px 9px", borderRadius: 999, border: "none", cursor: "pointer" }}>#{t}</button>;
                  }) : <span style={{ fontSize: 11.5, color: T.dim }}>메모</span>}
                </div>
                <span style={{ fontSize: 11, color: T.dim }}>{timeLabelOf(e.createdAt)}</span>
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
                    {e.tags.length > 0 ? e.tags.map((t) => {
                      const c = (e.category && CATEGORIES[e.category]?.color) || "#8F8F8F";
                      return (
                        <span key={t} style={{ fontSize: 11.5, fontWeight: 700, color: c, background: c + "1E", padding: "3px 6px 3px 9px", borderRadius: 999, display: "inline-flex", alignItems: "center", gap: 4 }}>
                          #{t}
                          <button onClick={() => removeTag(e.id, t)} style={{ background: "none", border: "none", color: c, cursor: "pointer", display: "flex", padding: 0 }}><X size={13} /></button>
                        </span>
                      );
                    }) : <span style={{ fontSize: 11.5, color: T.dim }}>태그 없이 메모로 둬도 괜찮아요</span>}
                  </div>
                  {e.tags.length < 2 && (
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                      {ALL_SUBTAGS.filter((t) => !e.tags.includes(t)).map((t) => {
                        const c = CATEGORIES[SUBTAG_CAT[t]]?.color || "#8F8F8F";
                        return <button key={t} onClick={() => addTag(e.id, t)} style={{ fontSize: 11.5, color: c, background: "transparent", border: `1px solid ${c}55`, padding: "3px 9px", borderRadius: 999, cursor: "pointer" }}>+ {t}</button>;
                      })}
                    </div>
                  )}
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <button onClick={() => { setEditingId(null); setExpandedId(null); }} style={{ fontSize: 12, fontWeight: 700, color: T.bg, background: T.text, border: "none", borderRadius: 999, padding: "6px 16px", cursor: "pointer" }}>완료</button>
                  </div>
                </div>
              )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
