"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, Download, Shield, Trash2, User } from "lucide-react";
import { useTuk } from "@/context/AppContext";

export default function SettingsScreen() {
  const { T, theme, setTheme, user, signedIn, signInWithEmail, signOut, showToast, entries, deleteAllEntries } = useTuk();
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const handleSendLink = async () => {
    if (!email.trim() || sending) return;
    setSending(true);
    const { error } = await signInWithEmail(email.trim());
    setSending(false);
    if (error) {
      showToast("메일을 보내지 못했어요");
      return;
    }
    setSent(true);
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
            <div style={{ fontSize: 12.5, color: T.sub, marginTop: 12, lineHeight: 1.6 }}>
              {email}로 인증 메일을 보냈어요 · 메일함을 확인해주세요
              <br />
              <span style={{ color: "#E8A24C" }}>꼭 지금 이 브라우저에서 메일을 열고 링크를 눌러주세요 — 휴대폰이나 다른 브라우저에서 열면 로그인이 안 돼요.</span>
            </div>
          ) : (
            <>
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="이메일 주소" type="email" style={{ flex: 1, background: T.cardAlt, border: `1px solid ${T.line}`, borderRadius: 10, padding: "9px 12px", color: T.text, fontSize: 13, fontFamily: "inherit", outline: "none" }} />
                <button onClick={handleSendLink} disabled={sending} style={{ background: T.text, color: T.bg, border: "none", borderRadius: 10, padding: "9px 14px", fontSize: 12.5, fontWeight: 700, cursor: sending ? "default" : "pointer", opacity: sending ? 0.6 : 1, flexShrink: 0, whiteSpace: "nowrap" }}>{sending ? "보내는 중" : "인증 메일 받기"}</button>
              </div>
              <div style={{ fontSize: 11.5, color: T.dim, marginTop: 8, lineHeight: 1.5 }}>인증 메일의 링크는 지금 쓰고 있는 이 브라우저에서 열어야 로그인이 완료돼요.</div>
            </>
          )
        )}
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
