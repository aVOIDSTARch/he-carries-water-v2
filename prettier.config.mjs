/** @type {import("prettier").Config} */
export default {
  // ── Core ──────────────────────────────────────────────────────────────────
  printWidth:                  100,      // SVG transform attrs and template literals sit comfortably here
  tabWidth:                    2,
  useTabs:                     false,
  semi:                        true,
  singleQuote:                 true,     // JS/TS strings: single quotes
  jsxSingleQuote:              false,    // JSX attributes: double quotes (aria-hidden="true", not 'true')
  trailingComma:               'all',    // objects, params, generics — everywhere

  // ── Spacing ───────────────────────────────────────────────────────────────
  bracketSpacing:              true,     // { key: value } not {key: value}
  bracketSameLine:             false,    // JSX/HTML closing > on its own line after last attr
  arrowParens:                 'always', // (cloud) => not cloud => — easier to add types later
  singleAttributePerLine:      true,     // every JSX/HTML attr on its own line — clean diffs

  // ── HTML ──────────────────────────────────────────────────────────────────
  htmlWhitespaceSensitivity:   'css',    // respects CSS display when collapsing whitespace in HTML
  // 'css'    → inline elements (span, a) preserve whitespace; block elements (div) collapse it
  // 'strict' → all whitespace preserved (safe but verbose)
  // 'ignore' → all whitespace collapsed (can break inline-element spacing)

  // ── Embedded languages ────────────────────────────────────────────────────
  embeddedLanguageFormatting:  'auto',   // format JS/CSS/HTML embedded in .astro script/style blocks

  // ── Files ─────────────────────────────────────────────────────────────────
  endOfLine:                   'lf',

  // ── Plugins ───────────────────────────────────────────────────────────────
  // pnpm add -D prettier-plugin-astro
  plugins: ['prettier-plugin-astro'],

  // ── Per-file overrides ────────────────────────────────────────────────────
  overrides: [
    {
      files: ['*.astro'],
      options: {
        parser: 'astro',
      },
    },
    {
      // Markdown: wrap prose at printWidth for readable diffs
      files: ['*.md', '*.mdx'],
      options: {
        proseWrap: 'always',
      },
    },
    {
      // JSON: no trailing commas (invalid JSON syntax)
      files: ['*.json', '*.jsonc'],
      options: {
        trailingComma: 'none',
      },
    },
    {
      // CSS/SCSS: double quotes are the CSS convention
      files: ['*.css', '*.scss'],
      options: {
        singleQuote: false,
      },
    },
  ],
};
