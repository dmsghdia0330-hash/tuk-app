"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { LayoutGrid, Settings, TreePine } from "lucide-react";
import { useTuk } from "@/context/AppContext";
import { outerStyle } from "@/lib/tuk/style";

const NAV_ITEMS = [
  { href: "/", label: "홈", icon: LayoutGrid },
  { href: "/tree", label: "나무", icon: TreePine },
  { href: "/settings", label: "설정", icon: Settings },
];

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { T, theme, toast, learnNote } = useTuk();
  // 화면 위쪽에서 은은하게 번지는 초록빛 — "빛을 받아 자라는" 분위기. 포레스트에선 조금 더 진하게.
  const glow = theme === "forest" ? "rgba(95,217,180,0.10)" : theme === "light" ? "rgba(95,217,180,0.06)" : "rgba(95,217,180,0.07)";

  const subtitle =
    pathname === "/tree" ? "당신이 던진 것들이 자란 모양"
    : pathname === "/settings" ? "당신의 기록은 당신 것이에요"
    : "안 써도 괜찮아요. 생각나면 그냥 툭.";

  return (
    <div style={outerStyle(T)}>
      <div style={{ width: "100%", maxWidth: 420, position: "relative", paddingBottom: "calc(90px + env(safe-area-inset-bottom))" }}>
        <div aria-hidden style={{ position: "absolute", top: 0, left: 0, right: 0, height: 320, pointerEvents: "none", background: `radial-gradient(ellipse 78% 100% at 50% 0%, ${glow}, transparent 70%)` }} />
        <div style={{ position: "relative", padding: "calc(26px + env(safe-area-inset-top)) 20px 10px" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span className="serif" style={{ fontSize: 31, fontWeight: 700 }}>툭</span>
            <span className="serif" style={{ fontSize: 13, color: T.dim, letterSpacing: 0 }}>가볍게, 툭</span>
          </div>
          <div style={{ fontSize: 13, color: T.sub, marginTop: 4 }}>{subtitle}</div>
        </div>

        {toast && <div style={{ position: "fixed", top: "calc(16px + env(safe-area-inset-top))", left: "50%", transform: "translateX(-50%)", background: T.text, color: T.bg, padding: "8px 16px", borderRadius: 999, fontSize: 13, fontWeight: 700, zIndex: 50 }}>{toast}</div>}
        {learnNote && <div style={{ position: "fixed", top: "calc(16px + env(safe-area-inset-top))", left: "50%", transform: "translateX(-50%)", background: T.line, color: T.text, padding: "8px 16px", borderRadius: 999, fontSize: 12.5, zIndex: 51, border: `1px solid #4D4668`, maxWidth: "90%", textAlign: "center" }}>{learnNote}</div>}

        {children}

        <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 420, background: T.cardAlt, borderTop: `1px solid ${T.line}`, display: "flex", justifyContent: "space-around", padding: "10px 0 calc(18px + env(safe-area-inset-bottom))", zIndex: 40 }}>
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link key={href} href={href} style={{ background: "none", border: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, cursor: "pointer", opacity: active ? 1 : 0.4 }}>
                <Icon size={20} color={active ? T.text : T.sub} />
                <span style={{ fontSize: 10, color: active ? T.text : T.sub }}>{label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
