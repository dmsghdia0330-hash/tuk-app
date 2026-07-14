import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/tuk/rateLimit";
import { CATEGORIES } from "@/lib/tuk/constants";
import type { Category } from "@/lib/tuk/types";

const client = new Anthropic();

// 카테고리 목록은 constants의 CATEGORIES 한 곳에서만 정의한다. 카테고리를 늘리려면
// 거기(색/각도)와 아래 프롬프트 설명만 고치면 되고, DB 변경은 필요 없다.
const CATEGORY_LIST = Object.keys(CATEGORIES) as Category[];
const MAX_TEXT_LENGTH = 500;

const SYSTEM_PROMPT = `너는 사용자가 하루 중 아무렇게나 남긴 짧은 기록을 분류하는 역할이야.

카테고리 정의(정확히 이 여섯 중 하나에 가장 자연스럽게 맞으면 그것, 아니면 null):
- 식단: 먹고 마신 것 (밥, 야식, 커피 등)
- 감정: 기분·마음 상태 (기분좋음, 무기력, 스트레스 등)
- 할일: 해야 할 일·약속·일정
- 소비: 돈을 쓴 것 (구매, 결제, 지출)
- 관계: 사람·관계 (친구, 가족, 만남, 다툼 등)
- 건강: 몸·건강 상태 (생리, 병원, 운동, 아픔, 감기, 수면 등)

규칙:
1. category는 이 기록의 '가장 중심이 되는' 한 가지. 여섯 어디에도 자연스럽지 않으면 절대 억지로 넣지 말고 category=null, undecided=true. 오분류가 미분류보다 나쁘다.
2. subtags는 이 기록을 나타내는 짧은 명사 태그를 최대 4개까지. 한 기록이 여러 측면을 담으면 서로 다른 카테고리의 태그가 섞여도 좋다 (예: "생리 2일차 힘들다" → ["생리", "무기력"], "친구랑 놀아서 기분좋음" → ["친구", "기분좋음"]). 다만 억지로 채우지 말고 실제로 드러난 핵심만.
3. 사람(이름/호칭: 엄마, 팀장, 지수 등)이 등장하면 people에 원문 표기 그대로 넣어.
4. 감정을 단정적으로 진단하지 마. "무기력"처럼 관찰 가능한 상태 태그만 붙여.
5. 확신이 낮으면(0.6 미만) undecided=true, category=null.
6. 자해·자살·타해를 암시하는 표현이 조금이라도 있으면 risk=true로 표시해. 이건 category와 별개로 항상 확인해.
7. category가 "소비"면 spendEmotion도 채워: 필요한 지출이면 "필요", 스트레스성이면 "스트레스", 충동적이면 "충동". 소비가 아니면 null.
8. remindAt: 기록에 '앞으로 챙겨야 할 시점'을 가리키는 시간 표현이 분명히 있으면(예: "내일 3시 병원", "이따 저녁에 약", "금요일 오전 회의") 그 시각을 remindAt에 채운다. 주어지는 '현재 시각'을 기준으로 상대 표현을 절대 시각으로 풀고, 반드시 미래 시각이어야 한다. 형식은 로컬 시간 ISO "YYYY-MM-DDTHH:MM"(시간대 표기 없이). 시(hour)만 있고 분이 없으면 00분. "오후 3시"처럼 오전/오후가 명확하면 24시간제로. 시간 표현이 없거나 애매하면 null. 과거 회상("어제 병원 갔다")은 null.
9. 출력은 지정한 JSON 스키마만 채워. 설명 문장 금지.`;

interface ClassifyResult {
  category: Category | null;
  subtags: string[];
  people: string[];
  confidence: number;
  undecided: boolean;
  risk: boolean;
  spendEmotion: "필요" | "스트레스" | "충동" | null;
  remindAt: string | null;
}

// AI가 준 remindAt이 로컬 ISO 형식("YYYY-MM-DDTHH:MM")이고 실제 날짜로 파싱되면
// 분까지만 남겨 반환, 아니면 null. 미래인지 최종 판정은 클라이언트(로컬 시각 앎)가 한다.
function normalizeRemindAt(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!m) return null;
  const [, y, mo, d, h, mi] = m;
  const dt = new Date(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi));
  if (isNaN(dt.getTime())) return null;
  return `${y}-${mo}-${d}T${h}:${mi}`;
}

function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

export async function POST(request: Request) {
  let text: unknown;
  let now: unknown;
  try {
    ({ text, now } = await request.json());
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }
  if (typeof text !== "string" || !text.trim()) {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }
  if (text.length > MAX_TEXT_LENGTH) {
    return NextResponse.json({ error: "text is too long" }, { status: 400 });
  }
  // 클라이언트의 로컬 현재 시각 문맥(예: "2026-07-14 22:35 (월요일)")으로 상대
  // 시간 표현을 절대 시각으로 풀게 한다. 없거나 이상하면 서버 UTC로 대체.
  const nowContext = typeof now === "string" && now.length <= 40 ? now : new Date().toISOString();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const rateLimitId = user?.id ?? `ip:${getClientIp(request)}`;
  const { allowed, retryAfterSeconds } = checkRateLimit(rateLimitId);
  if (!allowed) {
    return NextResponse.json(
      { error: "too many requests" },
      { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
    );
  }

  let personalizationBlock = "";
  if (user) {
    try {
      const { data: corrections } = await supabase
        .from("personalization_map")
        .select("source_text, tag")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);
      if (corrections && corrections.length > 0) {
        const lines = corrections.map((c: { source_text: string; tag: string }) => `- "${c.source_text}" → ${c.tag}`).join("\n");
        personalizationBlock = `\n\n아래는 이 사용자가 과거에 직접 고친 매핑이야. 우선 참고해:\n${lines}`;
      }
    } catch (err) {
      console.error("failed to load personalization map:", err);
    }
  }

  try {
    const response = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 500,
      system: SYSTEM_PROMPT + personalizationBlock,
      messages: [{ role: "user", content: `[현재 시각: ${nowContext}]\n\n${text.trim()}` }],
      output_config: {
        format: {
          type: "json_schema",
          schema: {
            type: "object",
            properties: {
              category: {
                anyOf: [{ type: "string", enum: CATEGORY_LIST }, { type: "null" }],
              },
              subtags: { type: "array", items: { type: "string" } },
              people: { type: "array", items: { type: "string" } },
              confidence: { type: "number" },
              undecided: { type: "boolean" },
              risk: { type: "boolean" },
              spendEmotion: {
                anyOf: [{ type: "string", enum: ["필요", "스트레스", "충동"] }, { type: "null" }],
              },
              remindAt: {
                anyOf: [{ type: "string" }, { type: "null" }],
              },
            },
            required: ["category", "subtags", "people", "confidence", "undecided", "risk", "spendEmotion", "remindAt"],
            additionalProperties: false,
          },
        },
      },
    });

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("no text block in classify response");
    }
    const parsed = JSON.parse(textBlock.text) as Partial<ClassifyResult>;

    const result: ClassifyResult = {
      category: parsed.category ?? null,
      subtags: Array.isArray(parsed.subtags) ? parsed.subtags.slice(0, 4) : [],
      people: Array.isArray(parsed.people) ? parsed.people : [],
      confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0,
      undecided: Boolean(parsed.undecided),
      risk: Boolean(parsed.risk),
      spendEmotion: parsed.spendEmotion ?? null,
      remindAt: normalizeRemindAt(parsed.remindAt),
    };

    return NextResponse.json(result);
  } catch (err) {
    console.error("classify failed:", err);
    return NextResponse.json({ error: "classification failed" }, { status: 502 });
  }
}
