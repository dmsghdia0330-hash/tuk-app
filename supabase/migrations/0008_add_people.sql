-- 관계 가지의 '자주 떠올린 사람'을 채우기 위해, AI가 뽑아낸 등장 인물(이름/호칭)을
-- 기록에 저장한다.
alter table public.entries
  add column if not exists people text[] not null default '{}';
