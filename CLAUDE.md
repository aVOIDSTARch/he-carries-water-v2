# Claude Instructions — hecarrieswater-v2

## Language & Spelling
- Use **American English** spelling throughout (color not colour, center not centre, initialize not initialise, etc.)

## Punctuation in Code & Comments
- Use straight ASCII apostrophes and quotes only: `'` and `"` — never curly/smart quotes (`'` `'` `"` `"`)
- Use `...` (three plain periods) for ellipsis — never the `…` Unicode character
- Use `--` for em-dash in comments — never `—`
- Commas and periods go **inside** quotation marks in prose, **outside** in code contexts
- No trailing spaces

## Code Style
- This project uses **Preact** (not React) — always import hooks from `preact/hooks`, context from `preact`, and nanostores bindings from `@nanostores/preact`
- TypeScript is used throughout — add type annotations on function parameters and return types
- 2-space indentation, single quotes for JS/TS strings, double quotes for JSX attributes
- Trailing commas everywhere (`'all'`)
- See `prettier.config.mjs` for full formatting rules
