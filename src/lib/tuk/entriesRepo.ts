import { createClient } from "@/lib/supabase/client";
import type { Entry } from "./types";

const LOCAL_KEY = "tuk:entries";

type EntryPatch = Partial<Pick<Entry, "tags" | "risk" | "spendEmotion">>;

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

interface EntryRow {
  id: string;
  text: string;
  tags: string[];
  created_at: string;
  risk: boolean;
  spend_emotion: Entry["spendEmotion"];
}

function rowToEntry(row: EntryRow): Entry {
  return { id: row.id, text: row.text, tags: row.tags, createdAt: row.created_at, risk: row.risk, spendEmotion: row.spend_emotion };
}

export function remoteEntriesRepo(userId: string) {
  const supabase = createClient();
  return {
    load: async (): Promise<Entry[]> => {
      const { data, error } = await supabase
        .from("entries")
        .select("id, text, tags, created_at, risk, spend_emotion")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as EntryRow[]).map(rowToEntry);
    },
    insert: async (entry: Entry) => {
      const { error } = await supabase.from("entries").insert({
        id: entry.id,
        user_id: userId,
        text: entry.text,
        tags: entry.tags,
        created_at: entry.createdAt,
        risk: entry.risk,
        spend_emotion: entry.spendEmotion,
      });
      if (error) throw error;
    },
    update: async (id: string, patch: EntryPatch) => {
      const dbPatch: Record<string, unknown> = {};
      if (patch.tags !== undefined) dbPatch.tags = patch.tags;
      if (patch.risk !== undefined) dbPatch.risk = patch.risk;
      if (patch.spendEmotion !== undefined) dbPatch.spend_emotion = patch.spendEmotion;
      const { error } = await supabase.from("entries").update(dbPatch).eq("id", id).eq("user_id", userId);
      if (error) throw error;
    },
    remove: async (id: string) => {
      const { error } = await supabase.from("entries").delete().eq("id", id).eq("user_id", userId);
      if (error) throw error;
    },
    removeAll: async () => {
      const { error } = await supabase.from("entries").delete().eq("user_id", userId);
      if (error) throw error;
    },
  };
}

export async function migrateLocalEntriesToRemote(userId: string): Promise<void> {
  const local = readLocal();
  if (local.length === 0) return;
  const supabase = createClient();
  const rows = local.map((e) => ({
    id: e.id,
    user_id: userId,
    text: e.text,
    tags: e.tags,
    created_at: e.createdAt,
    risk: e.risk,
    spend_emotion: e.spendEmotion,
  }));
  const { error } = await supabase.from("entries").insert(rows);
  if (error) throw error;
  localEntriesRepo.clear();
}
