-- 소비 브랜치 색 캘린더용 감정 필드 (필요/스트레스/충동). 태그로 넣으면
-- 감정 카테고리의 "스트레스" 태그와 이름이 겹치므로, risk와 마찬가지로
-- 별도 컬럼으로 둔다. 소비 카테고리가 아닌 기록은 항상 null.
alter table public.entries
  add column if not exists spend_emotion text
    check (spend_emotion in ('필요', '스트레스', '충동'));
