import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { EmailOtpType } from "@supabase/supabase-js";

// Supabase 이메일 매직링크가 도착하는 곳. PKCE 코드 교환(`code`)이 기본이며,
// `token_hash`+`type` 형태로 오는 경우도 대비해 같이 처리한다.
// PKCE는 매직링크를 "요청한 바로 그 브라우저"에서 열어야만 동작한다 (code_verifier가
// 그 브라우저의 쿠키에만 있음) — 다른 기기/앱에서 열면 code 교환이 실패한다.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/";

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
    console.error("exchangeCodeForSession failed:", error.message);
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(`${origin}${next}`);
    console.error("verifyOtp failed:", error.message);
  }

  return NextResponse.redirect(`${origin}/?authError=1`);
}
