import type { CSSProperties } from "react";
import type { ThemePalette } from "./types";

export function outerStyle(T: ThemePalette): CSSProperties {
  return {
    fontFamily: "'Pretendard', -apple-system, sans-serif",
    background: T.bg,
    minHeight: "100vh",
    color: T.text,
    display: "flex",
    justifyContent: "center",
    transition: "background .3s, color .3s",
  };
}
