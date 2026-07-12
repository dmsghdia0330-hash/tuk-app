-- '건강' 카테고리 추가 (생리·병원·운동·아픔 등 몸/건강 관련).
-- entries.category의 기존 CHECK 제약(다섯 카테고리만 허용)을 찾아 지우고,
-- 여섯 카테고리를 허용하는 제약으로 다시 만든다. (제약 이름이 환경마다 다를 수
-- 있어 category를 참조하는 CHECK 제약을 이름과 무관하게 찾아 제거한다.)
do $$
declare c text;
begin
  select conname into c
  from pg_constraint
  where conrelid = 'public.entries'::regclass
    and contype = 'c'
    and pg_get_constraintdef(oid) ilike '%category%';
  if c is not null then
    execute format('alter table public.entries drop constraint %I', c);
  end if;
end $$;

alter table public.entries
  add constraint entries_category_check
  check (category in ('식단', '감정', '할일', '소비', '관계', '건강'));
