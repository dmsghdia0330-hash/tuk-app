-- 실제 LLM 분류 연동: 안전 신호(자해/자살 암시 등) 플래그 컬럼 추가
-- risk=true인 기록은 평소 태그 대신 안전 안내 카드로 표시됨 (앱 로직에서 처리)
alter table public.entries
  add column if not exists risk boolean not null default false;
