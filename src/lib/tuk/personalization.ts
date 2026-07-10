import { createClient } from "@/lib/supabase/client";

// 사용자가 태그를 직접 고치면 (원문 표현 → 태그) 매핑을 그 사용자 사전에 저장한다.
// 다음 분류 때 이 사전을 프롬프트에 주입해 우선 반영한다 (/api/classify 참고).
export async function recordCorrection(userId: string, sourceText: string, tag: string) {
  const supabase = createClient();
  const { error } = await supabase.from("personalization_map").insert({
    user_id: userId,
    source_text: sourceText,
    tag,
  });
  if (error) throw error;
}
