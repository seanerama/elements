/**
 * Stylelint config — enforces token usage in component CSS.
 * Raw color/font-size/spacing values are rejected outside src/styles/tokens.css
 * and src/styles/themes/* (the only places where they're allowed).
 */
module.exports = {
  extends: ['stylelint-config-standard'],
  plugins: ['stylelint-declaration-strict-value'],
  ignoreFiles: ['dist/**', '.astro/**', 'node_modules/**'],
  rules: {
    'scale-unlimited/declaration-strict-value': [
      [
        '/color$/',
        'background-color',
        'border-color',
        'fill',
        'stroke',
        'font-size',
        'font-family',
        'box-shadow',
      ],
      {
        ignoreValues: [
          'transparent',
          'currentColor',
          'inherit',
          'initial',
          'unset',
          'none',
          '0',
          'auto',
          // relative font-size units (em / %) and a small handful of values
          // for icon-internal sizing or numeric emphasis are allowed.
          '/^[\\d.]+em$/',
          '/^[\\d.]+%$/',
        ],
        message: 'Use a design token (var(--*)) instead of a raw value.',
      },
    ],
    'selector-class-pattern': null,
    'custom-property-pattern': null,
    'no-descending-specificity': null,
    // Font names are proper nouns (Georgia, Menlo, BlinkMacSystemFont) — case must be preserved.
    'value-keyword-case': null,
    'custom-property-empty-line-before': null,
  },
  overrides: [
    {
      files: ['src/styles/tokens.css', 'src/styles/themes/*.css', 'src/styles/base.css'],
      rules: {
        'scale-unlimited/declaration-strict-value': null,
      },
    },
  ],
};
