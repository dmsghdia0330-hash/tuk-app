import { createClient } from "@/lib/supabase/client";
import { dataUrlToBlob, removeAllUserImages, removeEntryImage, signEntryImages, uploadEntryImage } from "./imageUpload";
import type { Entry } from "./types";

const LOCAL_KEY = "tuk:entries";
const PENDING_KEY = "tuk:pendingEntries";

async function retry<T>(fn: () => Promise<T>, attempts = 3, baseDelayMs = 800): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (i < attempts - 1) await new Promise((r) => setTimeout(r, baseDelayMs * 2 ** i));
    }
  }
  throw lastErr;
}

type EntryPatch = Partial<Pick<Entry, "tags" | "risk" | "spendEmotion" | "category">>;

function readLocal(): Entry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LOCAL_KEY);
    return raw ? (JSON.parse(raw) as Entry[]) : [];
  } catch {
    return [];
  }
}

function writeLocal(entries: Entry[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LOCAL_KEY, JSON.stringify(entries));
}

export const localEntriesRepo = {
  load: async (): Promise<Entry[]> => readLocal(),
  insert: async (entry: Entry) => {
    writeLocal([entry, ...readLocal()]);
  },
  update: async (id: string, patch: EntryPatch) => {
    writeLocal(readLocal().map((e) => (e.id === id ? { ...e, ...patch } : e)));
  },
  remove: async (id: string) => {
    writeLocal(readLocal().filter((e) => e.id !== id));
  },
  clear: () => {
    if (typeof window !== "undefined") window.localStorage.removeItem(LOCAL_KEY);
  },
};

// 신호가 불안정할 때 낙관적으로 화면엔 이미 보이는 기록이 새로고침하면 조용히
// 사라지는 걸 막기 위한 대기열. 재시도(retry)까지 다 실패한 insert/update만 여기
// 담아뒀다가, 다음 접속 때(AppContext의 flushPendingWrites) 다시 시도한다.
interface PendingInsert {
  kind: "insert";
  entry: Entry;
}
interface PendingUpdate {
  kind: "update";
  id: string;
  patch: EntryPatch;
}
type PendingWrite = PendingInsert | PendingUpdate;

function readPending(): PendingWrite[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(PENDING_KEY);
    return raw ? (JSON.parse(raw) as PendingWrite[]) : [];
  } catch {
    return [];
  }
}

function writePending(list: PendingWrite[]) {
  if (typeof window === "undefined") return;
  if (list.length === 0) window.localStorage.removeItem(PENDING_KEY);
  else window.localStorage.setItem(PENDING_KEY, JSON.stringify(list));
}

function queuePendingInsert(entry: Entry) {
  const list = readPending();
  if (list.some((w) => w.kind === "insert" && w.entry.id === entry.id)) return;
  writePending([...list, { kind: "insert", entry }]);
}

function queuePendingUpdate(id: string, patch: EntryPatch) {
  const list = readPending().filter((w) => !(w.kind === "update" && w.id === id));
  writePending([...list, { kind: "update", id, patch }]);
}

// 로그인 직후(재접속 포함) 한 번 호출해 밀린 쓰기를 순서대로 다시 시도한다.
// 성공한 항목은 그 즉시 대기열에서 지워야 한다 — 끝에서 한 번에 비우면, 뒤쪽
// 항목이 실패했을 때 이미 성공한 insert를 다음 시도에서 또 밀어넣어 PK 충돌이 난다.
export async function flushPendingWrites(userId: string): Promise<void> {
  let list = readPending();
  if (list.length === 0) return;
  const remote = remoteEntriesRepo(userId);
  for (const w of [...list]) {
    try {
      if (w.kind === "insert") await remote.insert(w.entry);
      else await remote.update(w.id, w.patch);
      list = list.filter((x) => x !== w);
      writePending(list);
    } catch (err) {
      console.error("failed to flush pending write:", err);
      break; // 순서를 지키기 위해, 하나가 계속 실패하면 뒤쪽은 다음 기회에 시도한다
    }
  }
}

interface EntryRow {
  id: string;
  text: string;
  tags: string[];
  created_at: string;
  risk: boolean;
  spend_emotion: Entry["spendEmotion"];
  category: Entry["category"];
  has_image: boolean;
}

function rowToEntry(row: EntryRow): Entry {
  // image는 아래 load()에서 서명 URL로 채운다. 여기선 has_image만 임시 표식으로 둔다.
  return { id: row.id, text: row.text, tags: row.tags, createdAt: row.created_at, risk: row.risk, spendEmotion: row.spend_emotion, category: row.category, image: null };
}

export function remoteEntriesRepo(userId: string) {
  const supabase = createClient();
  return {
    load: async (): Promise<Entry[]> => {
      const { data, error } = await supabase
        .from("entries")
        .select("id, text, tags, created_at, risk, spend_emotion, category, has_image")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const rows = data as EntryRow[];
      const entries = rows.map(rowToEntry);
      // 이미지가 있는 기록만 골라 서명 URL을 한 번에 만들어 채운다.
      const withImage = rows.filter((r) => r.has_image).map((r) => r.id);
      if (withImage.length > 0) {
        const signed = await signEntryImages(userId, withImage);
        for (const e of entries) if (signed[e.id]) e.image = signed[e.id];
      }
      return entries;
    },
    insert: async (entry: Entry) => {
      const doInsert = async () => {
        const { error } = await supabase.from("entries").insert({
          id: entry.id,
          user_id: userId,
          text: entry.text,
          tags: entry.tags,
          created_at: entry.createdAt,
          risk: entry.risk,
          spend_emotion: entry.spendEmotion,
          category: entry.category,
          // 호출자 규약: entry.image가 있으면 스토리지에 이미 업로드된 상태다
          // (throwEntry/마이그레이션이 업로드 실패 시 image를 null로 만들어 전달).
          has_image: !!entry.image,
        });
        if (error) throw error;
      };
      // 네트워크가 잠깐 끊긴 정도면 백오프 재시도로 넘어간다. 그래도 안 되면
      // 낙관적으로 이미 화면엔 보이는 이 기록이 새로고침 시 조용히 사라지지
      // 않도록 대기열에 남겨, 다음 접속 때 flushPendingWrites가 다시 시도한다.
      try {
        await retry(doInsert);
      } catch (err) {
        queuePendingInsert(entry);
        throw err;
      }
    },
    update: async (id: string, patch: EntryPatch) => {
      const doUpdate = async () => {
        const dbPatch: Record<string, unknown> = {};
        if (patch.tags !== undefined) dbPatch.tags = patch.tags;
        if (patch.risk !== undefined) dbPatch.risk = patch.risk;
        if (patch.spendEmotion !== undefined) dbPatch.spend_emotion = patch.spendEmotion;
        if (patch.category !== undefined) dbPatch.category = patch.category;
        const { error } = await supabase.from("entries").update(dbPatch).eq("id", id).eq("user_id", userId);
        if (error) throw error;
      };
      try {
        await retry(doUpdate);
      } catch (err) {
        queuePendingUpdate(id, patch);
        throw err;
      }
    },
    remove: async (id: string) => {
      const { error } = await supabase.from("entries").delete().eq("id", id).eq("user_id", userId);
      if (error) throw error;
      // 사진도 함께 정리 (best-effort — 이미지 없는 기록이면 no-op).
      removeEntryImage(userId, id).catch((err) => console.error(err));
    },
    removeAll: async () => {
      const { error } = await supabase.from("entries").delete().eq("user_id", userId);
      if (error) throw error;
      removeAllUserImages(userId).catch((err) => console.error(err));
    },
  };
}

export async function migrateLocalEntriesToRemote(userId: string): Promise<void> {
  const local = readLocal();
  if (local.length === 0) return;
  const supabase = createClient();
  // 게스트가 인라인 data-URL로 갖고 있던 사진을 서버 스토리지로 올린다. 업로드에
  // 성공한 것만 has_image=true로 두어, load()가 없는 파일을 서명하려다 깨지는 걸 막는다.
  const uploaded = await Promise.all(
    local.map(async (e) => {
      if (!e.image) return false;
      try {
        await uploadEntryImage(userId, e.id, dataUrlToBlob(e.image));
        return true;
      } catch (err) {
        console.error(err);
        return false;
      }
    })
  );
  const rows = local.map((e, i) => ({
    id: e.id,
    user_id: userId,
    text: e.text,
    tags: e.tags,
    created_at: e.createdAt,
    risk: e.risk,
    spend_emotion: e.spendEmotion,
    category: e.category,
    has_image: uploaded[i],
  }));
  const { error } = await supabase.from("entries").insert(rows);
  if (error) throw error;
  localEntriesRepo.clear();
}
