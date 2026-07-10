-- AI가 매긴 카테고리(식단/감정/할일/소비/관계)를 태그와 별도로 저장한다.
-- 지금까지는 세부 태그 문자열로 카테고리를 역추정했는데, AI가 자유롭게
-- 짓는 세부 태그는 하드코딩된 목록에 없을 수 있어 나무에서 조용히 누락됐다.
-- 카테고리는 분류 결과에서 항상 고정된 5개 중 하나이므로 컬럼으로 직접 저장한다.
alter table public.entries
  add column if not exists category text
    check (category in ('식단', '감정', '할일', '소비', '관계'));
