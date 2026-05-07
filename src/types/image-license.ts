/**
 * Image license sidecar schema — mirrors sdd-output/contracts/image-asset.md.
 */

import { z } from 'zod';

export const ImageSource = z.enum(['wikimedia', 'nano-banana-pro', 'manual', 'placeholder']);
export type ImageSource = z.infer<typeof ImageSource>;

export const ImageLicense = z.enum([
  'CC-BY-4.0',
  'CC-BY-SA-4.0',
  'CC-BY-3.0',
  'CC-BY-SA-3.0',
  'CC0',
  'PUBLIC-DOMAIN',
  'GENERATED',
]);
export type ImageLicense = z.infer<typeof ImageLicense>;

export const ImageLicenseSchema = z
  .object({
    source: ImageSource,
    license: ImageLicense,
    attribution: z.string(),
    source_url: z.string().url().nullable(),
    fetched_at: z.string(),
    prompt: z.string().optional(),
  })
  .strict();

export type ImageLicenseRecord = z.infer<typeof ImageLicenseSchema>;
