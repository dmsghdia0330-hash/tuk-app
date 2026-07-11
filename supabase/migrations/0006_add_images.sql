-- 기록에 사진 첨부. 파일 경로는 항상 {userId}/{entryId}.jpg 로 결정되므로,
-- DB엔 사진 유무만 두고 실제 파일은 Storage 비공개 버킷에 둔다.
alter table public.entries
  add column if not exists has_image boolean not null default false;

-- 비공개 버킷: URL을 알아도 그냥 접근할 수 없고, 볼 때만 짧은 수명의 서명 URL을 만든다.
insert into storage.buckets (id, name, public)
values ('entry-images', 'entry-images', false)
on conflict (id) do nothing;

-- 본인 폴더({userId}/...)의 사진만 읽기/올리기/지우기 가능.
-- (읽기 권한이 있어야 본인 사진의 서명 URL도 만들 수 있다.)
create policy "tuk read own entry images" on storage.objects
  for select to authenticated
  using (bucket_id = 'entry-images' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "tuk insert own entry images" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'entry-images' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "tuk delete own entry images" on storage.objects
  for delete to authenticated
  using (bucket_id = 'entry-images' and (storage.foldername(name))[1] = auth.uid()::text);
