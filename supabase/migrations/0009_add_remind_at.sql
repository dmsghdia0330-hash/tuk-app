-- 던진 문장에서 AI가 시간 표현을 찾으면 로컬 알림 예약 시각을 저장한다.
-- 로컬 ISO 문자열("2026-07-15T15:00")을 그대로 담으므로 timestamptz 대신 text.
alter table public.entries
  add column if not exists remind_at text;
