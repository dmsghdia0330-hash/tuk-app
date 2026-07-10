// 아주 단순한 인메모리 rate limiter. 서버 프로세스 하나 안에서만 유효하고
// (재시작하면 초기화, 여러 인스턴스로 스케일하면 인스턴스별로 따로 셈) 완벽한
// 방어는 아니지만, "누군가 URL을 찾아서 반복 호출해 AI 비용을 무한정 태우는"
// 상황을 막는 최소한의 장치로는 충분하다. 트래픽이 커지면 Upstash 같은
// 공유 스토어 기반 리미터로 교체할 것.
const WINDOW_MS = 10 * 60 * 1000; // 10분
const MAX_REQUESTS = 20; // 창당 20회

const store = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(id: string): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const entry = store.get(id);

  if (!entry || now > entry.resetAt) {
    store.set(id, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (entry.count >= MAX_REQUESTS) {
    return { allowed: false, retryAfterSeconds: Math.ceil((entry.resetAt - now) / 1000) };
  }

  entry.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}
