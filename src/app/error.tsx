"use client";

import { useEffect } from "react";
import { Sprout } from "lucide-react";

// 이 Next.js 버전은 reset 대신 unstable_retry를 넘겨준다 (node_modules/next/dist/docs 참고).
// AppProvider(테마 컨텍스트)가 이 에러의 원인일 수도 있으므로 useTuk에 기대지 않고
// 다크 테마 값을 그대로 박아 넣는다 — 에러 화면 자체가 또 에러를 내면 안 되니까.
export default function ErrorPage({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 14,
        padding: "32px",
        textAlign: "center",
        background: "#15121F",
        color: "#F5F1E8",
        fontFamily: "'Pretendard', sans-serif",
      }}
    >
      <Sprout size={44} color="#5FD9B4" strokeWidth={1.5} />
      <div style={{ fontSize: 19, fontWeight: 700 }}>잠깐, 뭔가 삐끗했어요</div>
      <div style={{ fontSize: 13.5, color: "#8B85A0", lineHeight: 1.7, maxWidth: 320 }}>
        당신 잘못이 아니에요. 던진 기록은 그대로 있으니 안심하고 다시 시도해주세요.
      </div>
      <button
        onClick={() => unstable_retry()}
        style={{
          marginTop: 8,
          background: "#F5F1E8",
          color: "#15121F",
          border: "none",
          borderRadius: 999,
          padding: "11px 22px",
          fontSize: 13.5,
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        다시 시도하기
      </button>
    </div>
  );
}
