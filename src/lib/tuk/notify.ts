// 네이티브(Capacitor) 앱에서만 로컬 알림을 건다. 웹/SSR에서는 조용히 no-op.
// 동적 import라 웹 번들 로드/서버 렌더 시 플러그인 코드가 실행되지 않는다.
import type { Entry } from "./types";

export type ScheduleResult =
  | { ok: true }
  | { ok: false; reason: "web" | "denied" | "past" | "none" | "error" };

async function nativeModules() {
  const { Capacitor } = await import("@capacitor/core");
  if (!Capacitor.isNativePlatform()) return null;
  const { LocalNotifications } = await import("@capacitor/local-notifications");
  return { LocalNotifications };
}

// UUID 문자열 → 안정적인 양의 32비트 정수(안드로이드 알림 id는 int라 범위 제한).
function numericId(uuid: string): number {
  let h = 0;
  for (let i = 0; i < uuid.length; i++) {
    h = (Math.imul(31, h) + uuid.charCodeAt(i)) | 0;
  }
  return Math.abs(h) % 2147483000;
}

// 예약 시각이 미래인 기록에 로컬 알림을 건다(같은 id면 덮어써서 idempotent).
export async function scheduleReminder(entry: Pick<Entry, "id" | "text" | "remindAt">): Promise<ScheduleResult> {
  if (!entry.remindAt) return { ok: false, reason: "none" };
  const at = new Date(entry.remindAt);
  if (isNaN(at.getTime()) || at.getTime() <= Date.now()) return { ok: false, reason: "past" };
  let mods: Awaited<ReturnType<typeof nativeModules>>;
  try {
    mods = await nativeModules();
  } catch {
    return { ok: false, reason: "error" };
  }
  if (!mods) return { ok: false, reason: "web" };
  const { LocalNotifications } = mods;
  try {
    let perm = await LocalNotifications.checkPermissions();
    if (perm.display !== "granted") perm = await LocalNotifications.requestPermissions();
    if (perm.display !== "granted") return { ok: false, reason: "denied" };
    await LocalNotifications.schedule({
      notifications: [
        {
          id: numericId(entry.id),
          title: "툭",
          body: entry.text || "기록해둔 일이 있어요",
          schedule: { at },
        },
      ],
    });
    return { ok: true };
  } catch {
    return { ok: false, reason: "error" };
  }
}

export async function cancelReminder(id: string): Promise<void> {
  const mods = await nativeModules().catch(() => null);
  if (!mods) return;
  try {
    await mods.LocalNotifications.cancel({ notifications: [{ id: numericId(id) }] });
  } catch {
    /* best-effort */
  }
}

// 앱을 켤 때 한 번: 아직 안 지난 예약들을 (다시) 건다. 다른 기기/웹에서 던져
// 이 기기엔 예약이 없던 알림도 여기서 살아난다. 같은 id 재예약이라 안전하다.
export async function rescheduleAll(entries: Entry[]): Promise<void> {
  const mods = await nativeModules().catch(() => null);
  if (!mods) return;
  const now = Date.now();
  const due = entries.filter((e) => e.remindAt && new Date(e.remindAt).getTime() > now);
  if (due.length === 0) return;
  try {
    let perm = await mods.LocalNotifications.checkPermissions();
    if (perm.display !== "granted") perm = await mods.LocalNotifications.requestPermissions();
    if (perm.display !== "granted") return;
    await mods.LocalNotifications.schedule({
      notifications: due.map((e) => ({
        id: numericId(e.id),
        title: "툭",
        body: e.text || "기록해둔 일이 있어요",
        schedule: { at: new Date(e.remindAt as string) },
      })),
    });
  } catch {
    /* best-effort */
  }
}
