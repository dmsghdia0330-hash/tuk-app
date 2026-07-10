"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, Download, Shield, Trash2, User } from "lucide-react";
import { useTuk } from "@/context/AppContext";

function calcAge(birthdate: string): number | null {
  if (!birthdate) return null;
  const b = new Date(birthdate);
  if (Number.isNaN(b.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  const monthDiff = now.getMonth() - b.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < b.getDate())) age--;
  return age;
}

export default function SettingsScreen() {
  const { T, theme, setTheme, user, signedIn, signInWithEmail, verifyEmailOtp, signOut, showToast, entries, deleteAllEntries } = useTuk();
  const [email, setEmail] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [guardianConsent, setGuardianConsent] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [notifyOn, setNotifyOn] = useState(true);

  // 저장된 알림 설정 복원. localStorage는 서버에 없으므로 마운트 후에만 읽는다
  // (lazy initializer로 옮기면 hydration 불일치 — AppContext의 welcomeBack과 동일한 이유).
  useEffect(() => {
    if (window.localStorage.getItem("tuk:notifyPref") === "off") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- 위 주석 참고: 의도된 마운트 후 1회성 setState.
      setNotifyOn(false);
    }
  }, []);

  // setState updater 안에서 localStorage를 건드리면 StrictMode의 이중 호출 때
  // 부수효과가 두 번 실행되므로, next를 밖에서 계산해 저장한다.
  const handleToggleNotify = () => {
    const next = !notifyOn;
    setNotifyOn(next);
    window.localStorage.setItem("tuk:notifyPref", next ? "on" : "off");
  };

  const age = calcAge(birthdate);
  const isUnder14 = age !== null && age < 14;
  const sendDisabled = sending || !email.trim() || !birthdate || (isUnder14 && !guardianConsent);

  const handleSendLink = async () => {
    if (sendDisabled) return;
    setSending(true);
    const { error } = await signInWithEmail(email.trim(), birthdate, isUnder14 ? guardianConsent : undefined);
    setSending(false);
    if (error) {
      showToast("메일을 보내지 못했어요");
      return;
    }
    setSent(true);
  };

  const handleVerifyCode = async () => {
    if (verifying || code.trim().length < 6) return;
    setVerifying(true);
    const { error } = await verifyEmailOtp(email.trim(), code.trim());
    setVerifying(false);
    if (error) {
      showToast("코드가 맞지 않거나 만료됐어요");
      return;
    }
    showToast("로그인됐어요");
  };

  const handleExport = () => {
    const data = JSON.stringify(entries, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tuk-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("기록을 파일로 내보냈어요");
  };

  const handleDeleteAll = () => {
    setConfirmingDelete(false);
    deleteAllEntries();
  };

  return (
    <div style={{ padding: "6px 20px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ background: T.card, borderRadius: 14, padding: "15px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 42, height: 42, borderRadius: "50%", background: T.line, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><User size={20} color="#8B85A0" /></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14.5, fontWeight: 500 }}>{signedIn ? user?.email : "게스트로 쓰는 중"}</div>
            <div style={{ fontSize: 11.5, color: T.sub }}>{signedIn ? "기록이 계정에 안전하게 연결돼 있어요" : "가입하면 기록을 잃어버리지 않아요"}</div>
          </div>
          {signedIn && (
            <button onClick={() => signOut()} style={{ background: "transparent", color: T.sub, border: `1px solid ${T.lineSoft}`, borderRadius: 999, padding: "7px 13px", fontSize: 12, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>로그아웃</button>
          )}
        </div>
        {!signedIn && (
          sent ? (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 12.5, color: T.sub, lineHeight: 1.6, marginBottom: 10 }}>
                {email}로 인증 코드를 보냈어요 · 메일함에서 6자리 코드를 확인해주세요
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
                  placeholder="6자리 코드"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  style={{ flex: 1, background: T.cardAlt, border: `1px solid ${T.line}`, borderRadius: 10, padding: "9px 12px", color: T.text, fontSize: 16, letterSpacing: 4, textAlign: "center", fontFamily: "inherit", outline: "none" }}
                />
                <button onClick={handleVerifyCode} disabled={verifying || code.length < 6} style={{ background: T.text, color: T.bg, border: "none", borderRadius: 10, padding: "9px 16px", fontSize: 12.5, fontWeight: 700, cursor: verifying || code.length < 6 ? "default" : "pointer", opacity: verifying || code.length < 6 ? 0.5 : 1, flexShrink: 0, whiteSpace: "nowrap" }}>{verifying ? "확인 중" : "코드 확인"}</button>
              </div>
              <div style={{ fontSize: 11.5, color: T.dim, marginTop: 8, lineHeight: 1.5 }}>
                코드 대신 메일 속 링크를 눌러도 돼요 — 그때는 지금 이 브라우저에서 열어야 로그인이 완료돼요.
              </div>
              <button onClick={handleSendLink} disabled={sending} style={{ background: "none", border: "none", color: T.sub, fontSize: 11.5, marginTop: 6, padding: 0, cursor: sending ? "default" : "pointer", textDecoration: "underline" }}>코드를 못 받았어요 · 다시 보내기</button>
            </div>
          ) : (
            <>
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="이메일 주소" type="email" style={{ width: "100%", marginTop: 12, background: T.cardAlt, border: `1px solid ${T.line}`, borderRadius: 10, padding: "9px 12px", color: T.text, fontSize: 13, fontFamily: "inherit", outline: "none" }} />
              <div>
                <label style={{ display: "block", fontSize: 11, color: T.dim, marginTop: 8, marginBottom: 4 }}>생년월일 (만 14세 미만은 법정대리인 동의가 필요해요)</label>
                <input value={birthdate} onChange={(e) => setBirthdate(e.target.value)} type="date" style={{ width: "100%", background: T.cardAlt, border: `1px solid ${T.line}`, borderRadius: 10, padding: "9px 12px", color: T.text, fontSize: 13, fontFamily: "inherit", outline: "none" }} />
              </div>
              {isUnder14 && (
                <label style={{ display: "flex", alignItems: "flex-start", gap: 8, marginTop: 10, fontSize: 12, color: T.sub, lineHeight: 1.5, cursor: "pointer" }}>
                  <input type="checkbox" checked={guardianConsent} onChange={(e) => setGuardianConsent(e.target.checked)} style={{ marginTop: 2, flexShrink: 0 }} />
                  <span>만 14세 미만이시네요. 법정대리인(부모님 등)이 가입에 동의했어요.</span>
                </label>
              )}
              <button onClick={handleSendLink} disabled={sendDisabled} style={{ width: "100%", marginTop: 10, background: T.text, color: T.bg, border: "none", borderRadius: 10, padding: "10px 14px", fontSize: 12.5, fontWeight: 700, cursor: sendDisabled ? "default" : "pointer", opacity: sendDisabled ? 0.5 : 1 }}>{sending ? "보내는 중" : "인증 코드 받기"}</button>
              <div style={{ fontSize: 11.5, color: T.dim, marginTop: 8, lineHeight: 1.5 }}>메일로 6자리 코드가 가요 · 휴대폰에서도 코드를 입력하면 바로 로그인돼요.</div>
            </>
          )
        )}
      </div>
      <div style={{ background: T.card, borderRadius: 14, padding: "15px 16px", display: "flex", alignItems: "center", gap: 12 }}>
        <Bell size={18} color="#E8A24C" style={{ flexShrink: 0 }} />
        <div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 500 }}>가끔 안부 묻기</div><div style={{ fontSize: 11.5, color: T.sub }}>알림 기능은 준비 중이에요 · 켜두면 열리는 대로 적용돼요</div></div>
        <button onClick={handleToggleNotify} aria-label="안부 알림 켜기/끄기" style={{ width: 44, height: 26, borderRadius: 999, background: notifyOn ? "#5FD9B4" : T.line, position: "relative", flexShrink: 0, border: "none", cursor: "pointer", padding: 0, transition: "background .2s" }}><span style={{ position: "absolute", top: 3, left: notifyOn ? 21 : 3, width: 20, height: 20, borderRadius: "50%", background: T.text, transition: "left .2s" }} /></button>
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
      <button onClick={handleExport} style={{ background: T.card, border: "none", borderRadius: 14, padding: "15px 16px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer", color: T.text, textAlign: "left", width: "100%" }}><Download size={18} color="#7C9EFF" style={{ flexShrink: 0 }} /><div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 500 }}>내 기록 전부 내보내기</div><div style={{ fontSize: 11.5, color: T.sub }}>언제든 갖고 나갈 수 있어요</div></div></button>
      {!confirmingDelete ? (
        <button onClick={() => setConfirmingDelete(true)} style={{ background: T.card, border: "none", borderRadius: 14, padding: "15px 16px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer", color: "#FF6F91", textAlign: "left", width: "100%" }}><Trash2 size={18} color="#FF6F91" style={{ flexShrink: 0 }} /><div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 500, color: T.text }}>모든 기록 완전히 지우기</div><div style={{ fontSize: 11.5, color: T.sub }}>지우면 서버에서도 사라져요</div></div></button>
      ) : (
        <div style={{ background: T.card, borderRadius: 14, padding: "15px 16px" }}>
          <div style={{ fontSize: 13.5, color: T.text, marginBottom: 12, lineHeight: 1.6 }}>정말 다 지울까요? 되돌릴 수 없어요.</div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setConfirmingDelete(false)} style={{ flex: 1, background: T.chipDim, color: T.text, border: "none", borderRadius: 10, padding: "9px", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>취소</button>
            <button onClick={handleDeleteAll} style={{ flex: 1, background: "#FF6F91", color: "#fff", border: "none", borderRadius: 10, padding: "9px", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>지우기</button>
          </div>
        </div>
      )}
      <div style={{ display: "flex", justifyContent: "center", gap: 14 }}>
        <Link href="/terms" style={{ fontSize: 12, color: T.sub }}>이용약관</Link>
        <Link href="/privacy" style={{ fontSize: 12, color: T.sub }}>개인정보 처리방침</Link>
      </div>
      <div style={{ fontSize: 11.5, color: T.dim, textAlign: "center", lineHeight: 1.7, padding: "4px 0" }}>툭 v1.0.0 · 만 14세 미만은 보호자 동의가 필요해요<br />툭은 당신을 어떤 유형으로도 함부로 판단하지 않아요</div>
    </div>
  );
}
