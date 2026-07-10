import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/tuk/rateLimit";

const client = new Anthropic();

const CATEGORY_LIST = ["식단", "감정", "할일", "소비", "관계"] as const;
const MAX_TEXT_LENGTH = 500;

const SYSTEM_PROMPT = `너는 사용자가 하루 중 아무렇게나 남긴 짧은 기록을 분류하는 역할이야.
규칙:
1. 카테고리는 정확히 다음 다섯 중 하나이거나, 애매하면 null: 식단/감정/할일/소비/관계.
2. 세부 태그는 그 카테고리에 자연스럽게 속하는 것만, 최대 2개. 억지로 채우지 마.
3. 사람(이름/호칭: 엄마, 팀장, 지수 등)이 등장하면 people에 원문 표기 그대로 넣어.
4. 감정을 단정적으로 진단하지 마. "무기력"처럼 관찰 가능한 상태 태그만 붙여.
5. 확신이 낮으면(0.6 미만) undecided=true, category=null 로 둬. 억지 분류가 오분류보다 나빠.
6. 자해·자살·타해를 암시하는 표현이 조금이라도 있으면 risk=true로 표시해. 이건 category와 별개로 항상 확인해.
7. category가 "소비"면 spendEmotion도 채워: 필요한 지출로 읽히면 "필요", 스트레스성 지출이면 "스트레스", 충동적인 지출이면 "충동". 소비가 아니면 spendEmotion은 null.
8. 출력은 지정한 JSON 스키마만 채워. 설명 문장 금지.`;

interface ClassifyResult {
  category: (typeof CATEGORY_LIST)[number] | null;
  subtags: string[];
  people: string[];
  confidence: number;
  undecided: boolean;
  risk: boolean;
  spendEmotion: "필요" | "스트레스" | "충동" | null;
}

function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

export async function POST(request: Request) {
  let text: unknown;
  try {
    ({ text } = await request.json());
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }
  if (typeof text !== "string" || !text.trim()) {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }
  if (text.length > MAX_TEXT_LENGTH) {
    return NextResponse.json({ error: "text is too long" }, { status: 400 });
  }

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
      messages: [{ role: "user", content: text.trim() }],
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
            },
            required: ["category", "subtags", "people", "confidence", "undecided", "risk", "spendEmotion"],
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
      subtags: Array.isArray(parsed.subtags) ? parsed.subtags.slice(0, 2) : [],
      people: Array.isArray(parsed.people) ? parsed.people : [],
      confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0,
      undecided: Boolean(parsed.undecided),
      risk: Boolean(parsed.risk),
      spendEmotion: parsed.spendEmotion ?? null,
    };

    return NextResponse.json(result);
  } catch (err) {
    console.error("classify failed:", err);
    return NextResponse.json({ error: "classification failed" }, { status: 502 });
  }
}
