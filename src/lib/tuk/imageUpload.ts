import { createClient } from "@/lib/supabase/client";

// 사진 첨부. 프라이버시를 위해 비공개 버킷에 올리고, 볼 때만 짧은 수명의 서명 URL을
// 만들어 쓴다. 경로는 항상 `{userId}/{entryId}.jpg`로 결정되므로 DB엔 has_image
// 불린만 두면 되고, 파일 경로를 따로 저장할 필요가 없다.
const BUCKET = "entry-images";
const MAX_DIM = 1280; // 긴 변 기준 축소 상한 — 일기용 사진엔 충분하고 용량을 크게 줄인다
const QUALITY = 0.72;
const SIGN_TTL = 3600; // 서명 URL 유효시간(초). load()마다 새로 만들므로 한 세션이면 충분

export interface CompressedImage {
  dataUrl: string; // 즉시 미리보기/게스트 로컬 저장용
  blob: Blob; // 서버 업로드용
}

// 원본을 canvas로 다시 그려 JPEG로 압축한다. 큰 사진도 안전한 크기로 줄여
// 로컬 저장(게스트) 용량과 업로드 트래픽을 함께 줄인다.
export async function compressImage(file: File): Promise<CompressedImage> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const im = new Image();
      im.onload = () => resolve(im);
      im.onerror = () => reject(new Error("이미지를 불러오지 못했어요"));
      im.src = url;
    });
    let { width, height } = img;
    if (width > MAX_DIM || height > MAX_DIM) {
      const scale = MAX_DIM / Math.max(width, height);
      width = Math.round(width * scale);
      height = Math.round(height * scale);
    }
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas 컨텍스트를 만들 수 없어요");
    ctx.drawImage(img, 0, 0, width, height);
    const dataUrl = canvas.toDataURL("image/jpeg", QUALITY);
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/jpeg", QUALITY));
    if (!blob) throw new Error("이미지 변환에 실패했어요");
    return { dataUrl, blob };
  } finally {
    URL.revokeObjectURL(url);
  }
}

// 게스트가 로컬에 인라인 저장해둔 data-URL을, 로그인 시 서버로 올릴 때 Blob으로 되돌린다.
export function dataUrlToBlob(dataUrl: string): Blob {
  const [head, body] = dataUrl.split(",");
  const mime = head.match(/:(.*?);/)?.[1] ?? "image/jpeg";
  const bin = atob(body);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

function pathOf(userId: string, entryId: string): string {
  return `${userId}/${entryId}.jpg`;
}

export async function uploadEntryImage(userId: string, entryId: string, blob: Blob): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(pathOf(userId, entryId), blob, { contentType: "image/jpeg", upsert: true });
  if (error) throw error;
}

// 이미지가 있는 기록들의 서명 URL을 한 번에 만들어 entryId→URL로 돌려준다.
export async function signEntryImages(userId: string, entryIds: string[]): Promise<Record<string, string>> {
  if (entryIds.length === 0) return {};
  const supabase = createClient();
  const paths = entryIds.map((id) => pathOf(userId, id));
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrls(paths, SIGN_TTL);
  if (error || !data) return {};
  const map: Record<string, string> = {};
  data.forEach((d, i) => {
    if (d.signedUrl && !d.error) map[entryIds[i]] = d.signedUrl;
  });
  return map;
}

export async function removeEntryImage(userId: string, entryId: string): Promise<void> {
  const supabase = createClient();
  await supabase.storage.from(BUCKET).remove([pathOf(userId, entryId)]);
}

// "모든 기록 삭제" 시 이 사용자 폴더의 사진도 함께 지운다(개인정보처리방침의 즉시 파기 약속).
export async function removeAllUserImages(userId: string): Promise<void> {
  const supabase = createClient();
  const { data } = await supabase.storage.from(BUCKET).list(userId);
  if (data && data.length > 0) {
    await supabase.storage.from(BUCKET).remove(data.map((f) => `${userId}/${f.name}`));
  }
}
