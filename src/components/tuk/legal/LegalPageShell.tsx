"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronLeft } from "lucide-react";
import { useTuk } from "@/context/AppContext";
import { outerStyle } from "@/lib/tuk/style";

export default function LegalPageShell({ title, children }: { title: string; children: ReactNode }) {
  const { T } = useTuk();

  return (
    <div style={outerStyle(T)}>
      <div style={{ width: "100%", maxWidth: 420, minHeight: "100vh", padding: "26px 20px 60px" }}>
        <Link href="/settings" style={{ display: "inline-flex", alignItems: "center", gap: 4, color: T.sub, fontSize: 13, marginBottom: 18 }}>
          <ChevronLeft size={16} /> 설정으로
        </Link>
        <div className="serif" style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>{title}</div>
        <div style={{ background: T.card, border: `1px solid ${T.line}`, borderRadius: 12, padding: "12px 14px", fontSize: 12, color: T.sub, lineHeight: 1.6, marginBottom: 20 }}>
          이 문서는 초안입니다. 정식 출시 전 실제 법률 검토를 거쳐야 합니다.
        </div>
        <div style={{ fontSize: 13.5, color: T.text, lineHeight: 1.8 }}>{children}</div>
      </div>
    </div>
  );
}
