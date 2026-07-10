-- 툭(TUK) 초기 스키마: entries, tag_dictionary, personalization_map
-- 사용자 계정 자체는 Supabase Auth의 auth.users를 그대로 사용 (별도 users 테이블 없음)

-- ===== entries: 사용자가 던진 기록 =====
create table if not exists public.entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  text text not null,
  tags text[] not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists entries_user_id_created_at_idx
  on public.entries(user_id, created_at desc);

alter table public.entries enable row level security;

create policy "entries_select_own" on public.entries
  for select using (auth.uid() = user_id);
create policy "entries_insert_own" on public.entries
  for insert with check (auth.uid() = user_id);
create policy "entries_update_own" on public.entries
  for update using (auth.uid() = user_id);
create policy "entries_delete_own" on public.entries
  for delete using (auth.uid() = user_id);

-- ===== tag_dictionary: 카테고리별 세부 태그 사전 (전역 기본값 + 사용자별 확장) =====
create table if not exists public.tag_dictionary (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  category text not null check (category in ('식단','감정','할일','소비','관계')),
  tag text not null,
  created_at timestamptz not null default now()
);

-- user_id가 null이면 전역 기본 태그, 아니면 그 사용자만의 확장 태그
create unique index if not exists tag_dictionary_global_tag_idx
  on public.tag_dictionary(tag) where user_id is null;
create unique index if not exists tag_dictionary_user_tag_idx
  on public.tag_dictionary(user_id, tag) where user_id is not null;

alter table public.tag_dictionary enable row level security;

create policy "tag_dictionary_select" on public.tag_dictionary
  for select using (user_id is null or auth.uid() = user_id);
create policy "tag_dictionary_insert_own" on public.tag_dictionary
  for insert with check (auth.uid() = user_id);
create policy "tag_dictionary_delete_own" on public.tag_dictionary
  for delete using (auth.uid() = user_id);

insert into public.tag_dictionary (user_id, category, tag) values
  (null, '식단', '혼밥'),
  (null, '식단', '야식'),
  (null, '식단', '카페인'),
  (null, '감정', '기분좋음'),
  (null, '감정', '무기력'),
  (null, '감정', '스트레스'),
  (null, '할일', '할일'),
  (null, '할일', '약속'),
  (null, '소비', '소비'),
  (null, '소비', '충동구매'),
  (null, '관계', '친구')
on conflict do nothing;

-- ===== personalization_map: 사용자가 태그를 고친 이력 (원문 표현 → 태그) =====
-- 아직 앱 로직에서 읽고/쓰지 않음. 다음 단계(실제 LLM 분류 연동)에서 사용 예정.
create table if not exists public.personalization_map (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_text text not null,
  tag text not null,
  created_at timestamptz not null default now()
);

alter table public.personalization_map enable row level security;

create policy "personalization_map_select_own" on public.personalization_map
  for select using (auth.uid() = user_id);
create policy "personalization_map_insert_own" on public.personalization_map
  for insert with check (auth.uid() = user_id);
