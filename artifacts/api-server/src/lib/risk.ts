import { openai } from "@workspace/integrations-openai-ai-server";

export interface ExpenseRiskInput {
  vendor: string;
  category: string;
  description: string;
  amount: number;
  projectName: string;
  projectBudget: number;
  projectSpentSoFar: number;
  recentExpenses: { vendor: string; category: string; amount: number; description: string }[];
}

export interface RiskAssessment {
  riskScore: number;
  riskFlags: string[];
  reasoning: string;
  flagged: boolean;
}

const SYSTEM_PROMPT = `You are an internal-controls auditor for a small NGO. Given a proposed expense, the project budget, and recent expenses on the same project, assess whether this expense looks suspicious or risky. Only flag real risks. Be concise.

Return STRICT JSON in this shape:
{"riskScore": <0-100 integer>, "riskFlags": [<short label strings>], "reasoning": "<one or two sentence explanation>"}

Risk flag examples (use only when applicable):
- "exceeds_remaining_budget"
- "over_budget"
- "duplicate_vendor_recent"
- "round_number_anomaly"
- "category_mismatch"
- "vague_description"
- "unusually_large"
- "split_to_evade_threshold"

Scoring guide: 0-25 normal, 26-60 worth a look, 61-100 should be reviewed by a human.`;

function fallbackRule(input: ExpenseRiskInput): RiskAssessment {
  const remaining = input.projectBudget - input.projectSpentSoFar;
  const flags: string[] = [];
  let score = 0;
  if (input.amount > remaining) {
    flags.push("exceeds_remaining_budget");
    score = Math.max(score, 80);
  }
  if (input.amount > input.projectBudget * 0.4) {
    flags.push("unusually_large");
    score = Math.max(score, 55);
  }
  if (input.description.trim().length < 10) {
    flags.push("vague_description");
    score = Math.max(score, 35);
  }
  return {
    riskScore: score,
    riskFlags: flags,
    reasoning:
      flags.length === 0
        ? "Within budget and consistent with project activity."
        : "Automatic rule-based flag (AI assistant unavailable).",
    flagged: score >= 60,
  };
}

export async function assessExpenseRisk(input: ExpenseRiskInput): Promise<RiskAssessment> {
  try {
    const userPrompt = JSON.stringify(
      {
        proposedExpense: {
          vendor: input.vendor,
          category: input.category,
          description: input.description,
          amount: input.amount,
        },
        project: {
          name: input.projectName,
          totalBudget: input.projectBudget,
          spentSoFar: input.projectSpentSoFar,
          remaining: input.projectBudget - input.projectSpentSoFar,
        },
        recentExpenses: input.recentExpenses,
      },
      null,
      2,
    );

    const completion = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw) as Partial<RiskAssessment>;
    const score = Math.max(0, Math.min(100, Math.round(Number(parsed.riskScore ?? 0))));
    const flags = Array.isArray(parsed.riskFlags) ? parsed.riskFlags.map(String) : [];
    const reasoning = typeof parsed.reasoning === "string" ? parsed.reasoning : "";
    return {
      riskScore: score,
      riskFlags: flags,
      reasoning,
      flagged: score >= 60 || flags.includes("exceeds_remaining_budget") || flags.includes("over_budget"),
    };
  } catch {
    return fallbackRule(input);
  }
}
