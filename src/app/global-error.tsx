"use client";

// error.tsx는 루트 레이아웃(AppProvider) 자체가 던지는 에러는 못 잡는다.
// 그 경우를 위한 최후 방어선 — html/body를 직접 그려야 해서 폰트/전역 스타일 없이 최소한으로 둔다.
export default function GlobalError({
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <html lang="ko">
      <body>
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
            fontFamily: "sans-serif",
          }}
        >
          <div style={{ fontSize: 40 }}>🌱</div>
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
      </body>
    </html>
  );
}
