"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Send, LogIn, TreeDeciduous } from "lucide-react";
import { ONBOARD } from "@/lib/tuk/constants";
import { outerStyle } from "@/lib/tuk/style";
import { useTuk } from "@/context/AppContext";

export default function OnboardingScreen() {
  const router = useRouter();
  const { T, signedIn } = useTuk();
  const [obStep, setObStep] = useState(0);
  const s = ONBOARD[obStep];
  const last = obStep === ONBOARD.length - 1;
  // 설정의 "사용법 다시 보기"로 온 경우(이미 가입함) 가입 CTA 대신 홈으로만 안내한다.
  const isReplay = signedIn;

  const finishOnboarding = (path: string) => {
    window.localStorage.setItem("tuk:onboarded", "1");
    router.push(path);
  };

  return (
    <div style={outerStyle(T)}>
      <div style={{ width: "100%", maxWidth: 420, minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", gap: 6, padding: "calc(60px + env(safe-area-inset-top)) 32px 0" }}>
          {ONBOARD.map((_, i) => (
            <div key={i} style={{ height: 3, flex: 1, borderRadius: 2, background: i <= obStep ? T.text : T.line, transition: "background .3s" }} />
          ))}
        </div>
        <div key={obStep} style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 32px", animation: "fadeUp .4s ease" }}>
          {last && <div style={{ marginBottom: 14, animation: "sway 4s ease-in-out infinite", width: "fit-content" }}><TreeDeciduous size={56} color="#5FD9B4" strokeWidth={1.4} /></div>}
          <div className="serif" style={{ fontSize: 44, fontWeight: 800, lineHeight: 1.2, whiteSpace: "pre-line", marginBottom: 20 }}>{s.big}</div>
          <div style={{ fontSize: 15, color: T.text, lineHeight: 1.75, whiteSpace: "pre-line" }}>{s.small}</div>
        </div>
        <div style={{ padding: "0 32px calc(42px + env(safe-area-inset-bottom))" }}>
          {!last ? (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <button onClick={() => setObStep(ONBOARD.length - 1)} style={{ background: "none", border: "none", color: T.dim, fontSize: 13.5, cursor: "pointer" }}>건너뛰기</button>
              <button onClick={() => setObStep(obStep + 1)} style={{ display: "flex", alignItems: "center", gap: 6, background: T.text, color: T.bg, border: "none", borderRadius: 999, padding: "12px 22px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>다음 <ChevronRight size={16} /></button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, animation: "fadeUp .4s ease" }}>
              <button onClick={() => finishOnboarding("/")} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: T.text, color: T.bg, border: "none", borderRadius: 14, padding: "16px", fontSize: 15.5, fontWeight: 700, cursor: "pointer" }}><Send size={16} /> {isReplay ? "홈으로 돌아가기" : "가입 없이 일단 던져보기"}</button>
              {!isReplay && (
                <>
                  <button onClick={() => finishOnboarding("/settings")} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "transparent", color: T.text, border: `1px solid ${T.lineSoft}`, borderRadius: 14, padding: "15px", fontSize: 14, cursor: "pointer" }}><LogIn size={16} /> 이메일로 가입하기</button>
                  <div style={{ fontSize: 11.5, color: T.dim, textAlign: "center", marginTop: 6, lineHeight: 1.6 }}>가입 전 기록은 이 기기에만 저장돼요.<br />나중에 가입하면 그대로 이어져요.</div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
