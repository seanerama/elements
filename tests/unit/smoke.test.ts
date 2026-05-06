import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..', '..');

const TOKENS_PATH = resolve(repoRoot, 'src/styles/tokens.css');
const THEME_PATH = resolve(repoRoot, 'src/styles/themes/retro-science.css');

function countCustomProperties(css: string, prefix: string): number {
  const re = new RegExp(`--${prefix}[\\w-]+\\s*:`, 'g');
  return (css.match(re) ?? []).length;
}

describe('design tokens', () => {
  const tokensCss = readFileSync(TOKENS_PATH, 'utf-8');
  const themeCss = readFileSync(THEME_PATH, 'utf-8');

  it('defines the documented color tokens', () => {
    const colorCount = countCustomProperties(tokensCss, 'color-');
    expect(colorCount).toBeGreaterThanOrEqual(30);
  });

  it('defines all 11 element category colors', () => {
    const cats = [
      'alkali-metal',
      'alkaline-earth',
      'transition-metal',
      'post-transition',
      'metalloid',
      'nonmetal',
      'halogen',
      'noble-gas',
      'lanthanide',
      'actinide',
      'unknown',
    ];
    for (const cat of cats) {
      expect(tokensCss).toContain(`--color-cat-${cat}:`);
      expect(tokensCss).toContain(`--color-cat-${cat}-tint:`);
    }
  });

  it('defines accent palette (vermillion, prussian, ochre, teal)', () => {
    expect(tokensCss).toContain('--color-accent-vermillion:');
    expect(tokensCss).toContain('--color-accent-prussian:');
    expect(tokensCss).toContain('--color-accent-ochre:');
    expect(tokensCss).toContain('--color-accent-teal:');
  });

  it('defines the type, space, and border scales', () => {
    expect(countCustomProperties(tokensCss, 'text-')).toBeGreaterThanOrEqual(10);
    expect(countCustomProperties(tokensCss, 'space-')).toBeGreaterThanOrEqual(10);
    expect(countCustomProperties(tokensCss, 'border-')).toBeGreaterThanOrEqual(3);
  });

  it('locks the retro-science default values', () => {
    expect(tokensCss).toMatch(/--color-paper:\s*#f5f0e6/);
    expect(tokensCss).toMatch(/--color-ink:\s*#1f1d18/);
  });

  it('retro-science theme file scopes overrides under [data-theme]', () => {
    expect(themeCss).toContain("[data-theme='retro-science']");
  });
});
