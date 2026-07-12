-- 카테고리는 앞으로 코드(constants의 CATEGORIES)에서만 관리한다. DB가 값을
-- 고정 목록으로 제한하면 카테고리를 하나 늘릴 때마다 마이그레이션이 필요해
-- 번거롭다. 앱이 항상 유효한 값만 기록하므로, category 컬럼의 CHECK 제약을
-- 완전히 제거해 자유 텍스트로 둔다. (이후 카테고리 추가는 코드 배포만으로 끝.)
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
