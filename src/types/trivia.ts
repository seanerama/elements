/**
 * Trivia question schema — mirrors sdd-output/contracts/trivia-question.md.
 */

import { z } from 'zod';

export const QuestionType = z.enum(['element', 'compound']);
export type QuestionType = z.infer<typeof QuestionType>;

export const PromptKind = z.enum(['text', 'image']);
export type PromptKind = z.infer<typeof PromptKind>;

export const Difficulty = z.enum(['easy', 'medium', 'hard']);
export type Difficulty = z.infer<typeof Difficulty>;

export const QuestionSchema = z
  .object({
    id: z.string().min(1),
    type: QuestionType,
    subject_symbol: z.string().optional(),
    subject_formula: z.string().optional(),
    prompt: z.string().min(1),
    prompt_kind: PromptKind,
    image_path: z.string().nullable(),
    answer: z.string().min(1),
    alternates: z.array(z.string()).default([]),
    distractors: z.array(z.string()).min(3),
    explanation: z.string().min(1),
    difficulty: Difficulty,
    tags: z.array(z.string()).default([]),
  })
  .strict()
  .superRefine((q, ctx) => {
    if (q.type === 'element' && !q.subject_symbol) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'element questions must have subject_symbol',
        path: ['subject_symbol'],
      });
    }
    if (q.type === 'compound' && !q.subject_formula) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'compound questions must have subject_formula',
        path: ['subject_formula'],
      });
    }
    const lower = q.answer.toLowerCase();
    if (q.distractors.some((d) => d.toLowerCase() === lower)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'answer must not appear in distractors',
        path: ['distractors'],
      });
    }
  });

export type Question = z.infer<typeof QuestionSchema>;

export const QuestionBankSchema = z.object({
  schema_version: z.literal('1.0.0'),
  generated_at: z.string(),
  questions: z.array(QuestionSchema),
});
export type QuestionBank = z.infer<typeof QuestionBankSchema>;
