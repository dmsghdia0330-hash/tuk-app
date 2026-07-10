-- personalization_map에는 삭제 정책이 없어서, "모든 기록 완전히 지우기"를
-- 눌러도 사용자가 과거에 고쳤던 원문 표현(source_text)이 서버에 영구히 남았다.
-- 개인정보처리방침이 "전체 삭제 요청 시 서버에서 즉시 파기"를 약속하므로
-- entries와 동일하게 본인 행에 한해 삭제를 허용한다.
create policy "personalization_map_delete_own" on public.personalization_map
  for delete using (auth.uid() = user_id);
