/**
 * Sub-agent driver for re-runnable element research.
 *
 * Stage 2 ran ONCE manually with sub-agents and committed all 118 element files.
 * This script lets a future maintainer re-run individual elements (e.g. when the
 * schema_version bumps) without firing up the entire pipeline by hand.
 *
 * Requires:
 *   - ANTHROPIC_API_KEY in env
 *   - @anthropic-ai/sdk installed (devDep — install with `npm i -D @anthropic-ai/sdk`)
 *
 * Usage (dev only):
 *   ANTHROPIC_API_KEY=sk-... npx tsx pipelines/fetch-element-data.ts --only=h,fe,au
 */

import { ElementSchema, type Element } from '@/types/element';

export interface SubAgentResult {
  success: boolean;
  data?: Element;
  error?: string;
  attempt: number;
}

export interface SubAgentOptions {
  prompt: string;
  maxAttempts?: number;
  timeoutMs?: number;
}

/**
 * Calls Anthropic's API with the given prompt, parses the JSON response,
 * validates it against ElementSchema, and returns the result.
 *
 * Retries up to maxAttempts (default 3) with exponential backoff on
 * non-validation failures.
 */
export async function runElementSubAgent(opts: SubAgentOptions): Promise<SubAgentResult> {
  const { prompt, maxAttempts = 3 } = opts;

  // Lazy-import so the runtime doesn't need the SDK unless this script runs.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let Anthropic: any;
  try {
    Anthropic = (await import('@anthropic-ai/sdk')).default;
  } catch {
    return {
      success: false,
      error: '@anthropic-ai/sdk not installed. Run: npm i -D @anthropic-ai/sdk',
      attempt: 0,
    };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { success: false, error: 'ANTHROPIC_API_KEY not set', attempt: 0 };
  }

  const client = new Anthropic({ apiKey });

  let lastError = '';
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await client.messages.create({
        model: 'claude-opus-4-7',
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }],
      });
      const text = response.content
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .filter((c: any) => c.type === 'text')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((c: any) => c.text)
        .join('');
      const parsed = JSON.parse(text);
      const validated = ElementSchema.safeParse(parsed);
      if (!validated.success) {
        lastError = `schema validation failed: ${validated.error.issues
          .map((i) => `${i.path.join('.')}: ${i.message}`)
          .join('; ')}`;
        continue;
      }
      return { success: true, data: validated.data, attempt };
    } catch (e) {
      lastError = e instanceof Error ? e.message : String(e);
      if (attempt < maxAttempts) {
        const backoffMs = 1000 * Math.pow(4, attempt - 1);
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
      }
    }
  }

  return { success: false, error: lastError, attempt: maxAttempts };
}
