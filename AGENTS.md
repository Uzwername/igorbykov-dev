# Igor Bykov's personal site

Personal portfolio/CV site for Igor Bykov (senior full stack engineer, Barcelona). Astro, static output, hosted on **Cloudflare**. **Early stage**: only `/` (homepage), `/404` and `/under-construction/` exist, and the whole site is currently in **under-construction mode** (see "Hosting"). Nav links to `/freelance`, `/projects`, `/cv`, `/writing`, `/contact` are already in the header/mobile-nav but those pages don't exist yet (404).

## Source material — read before any content or design work

`.ai/dev/` holds the user's own source assets. Treat as source of truth; don't invent wording or structure.

- `content.md` — drafted copy for every planned page/section. Match its **exact** wording/casing: "full stack" never "full-stack"; British spellings throughout ("organised", "modernised", "standardised").
- `design.md` — design brief: clean → simple → plain → minimal, explicitly **not** Apple-style polish, references GitHub / GitHub Actions UI / reshaped.so / Docker Desktop, "deeply technical & somewhat raw".
- `structure.txt` — sitemap and page sections, including the CV page filters (Part/Full time, Contractor/Employee, Technology, Industry).
- `cv-igor-bykov.pdf`, `linkedin-export.pdf` — already parsed into `src/data/cv.json` (see below). LinkedIn is the more current/complete source; the CV PDF is stale (missing the current `eSIM Go` role, collapses two separate RepeatMD positions into one).

## Stack

- **Astro 7**, static output, no SSR/adapter. TypeScript strict (`astro/tsconfigs/strictest`).
- **Tailwind CSS v4** via `@tailwindcss/vite`, CSS-first config in `src/styles/global.css` — there is no `tailwind.config.js`.
- **React** (`@astrojs/react`) is installed but *not currently used by any page or component* — kept deliberately for future pages (e.g. CV filters) that need real client state. Don't reach for it for simple interactivity (see Conventions).
- **Fonts**: IBM Plex Sans (body/UI, variable weight) + IBM Plex Mono (technical accents: logo, chips, footer). Chosen deliberately over the more generic Inter/JetBrains Mono pairing for more character — don't swap without reason.
- **Path alias**: `@/*` → `./src/*` (tsconfig + Vite). Always use it, never relative imports across directories.
- **Package manager**: pnpm. Native postinstall scripts are gated — approved ones live in `pnpm-workspace.yaml`'s `allowBuilds` (currently `esbuild`, `sharp`). A new binary dependency will need the same treatment (`pnpm install` will tell you).

## Conventions (established — follow them, don't relitigate)

- **No React for simple interactivity.** `ThemeToggle.astro`, `MobileNav.astro`, `TopNavLogo.astro` are plain Astro components with a small inline `<script>` (bundled as an ES module), not React islands. This keeps simple pages free of the React runtime entirely. Every such script is wrapped `(() => { ... })();` with an early-return guard, and listeners pass `{ passive: true }` unless they must call `preventDefault`.
- **No flash-of-wrong-theme.** `Layout.astro` has a blocking `<script is:inline>` in `<head>` that resolves the theme (stored → `prefers-color-scheme` fallback) and sets `.dark` on `<html>` *before first paint*. Components then key off theme purely via the `dark:` Tailwind variant (`@custom-variant dark` in `global.css`) — they don't re-read storage in an effect. `is:inline` scripts can't `import`; anything they need from TS is passed in via `define:vars`.
- **`constants/` / `types/` / `utils/` split**, all under `src/`:
  - `constants/theme.ts`, `constants/html.ts` (every DOM element id any script touches), `constants/styles.ts` (shared Tailwind class strings, e.g. `ICON_BUTTON_CLASS_NAME`, `NAV_BAR_PADDING_CLASS_NAME`), `constants/site.ts`.
  - `types/theme.ts`, `types/cv.ts`.
  - `utils/localStorage.ts` (wraps `window.localStorage`, every call try/catched, never throws), `utils/theme.ts` (`persistTheme`), `utils/html.ts` (`getById` — **throws** if the id isn't found; these ids are hardcoded and always expected to exist, so fail loud rather than silently no-op).
- **Accessible-name props are required, not optional.** `Emoji.astro` requires `label`; `IconButton.astro` requires `label` and applies it as `aria-label` (its prop type omits `aria-label` from pass-through so there's never two conflicting ways to set it).
- **Shared values over copy-paste.** e.g. `NAV_BAR_PADDING_CLASS_NAME` is used by both `Header.astro` and `MobileNav.astro` so the two can't silently drift out of visual sync.
- Arrow functions everywhere, never `function` declarations. Full `if (...) { }` blocks, never one-line `if (x) return y;`.
- Semantic color tokens only — components use `bg-canvas`, `text-fg`, `border-border`, etc. Never raw hex, and the `dark:` variant is reserved for things CSS custom properties genuinely can't express (e.g. swapping which icon is visible), not for colors.

## Design tokens (`src/styles/global.css`)

CSS custom properties defined once on `:root` (light) and overridden wholesale in `.dark` — `--color-canvas`, `--color-canvas-subtle`, `--color-fg`, `--color-fg-muted`, `--color-border`, `--color-accent`, `--color-accent-emphasis`. `--breakpoint-xs: 20rem` is a custom small-phone breakpoint (Tailwind v4 has no default `xs`).

## Mobile nav (`MobileNav.astro`)

Hamburger → `fixed` right-edge slide-in panel + dimmed backdrop. **Not** a native `<details>` — that was tried and abandoned because modern browsers can't reliably animate `<details>` content on open. Has a dedicated close button (same `IconButton` style/position as the open button); focus moves into the panel on open and back to the trigger on close. No Escape-key handling and no focus-trap — both were added then deliberately removed as redundant once the close button existed. Full-width with no left border below the `xs` breakpoint; a bordered side-panel above it.

## Testing

- **Unit** (`tests/unit/`, Vitest + jsdom — `pnpm test`): pure logic only (`utils/html.ts`, `utils/theme.ts`). Astro components are deliberately *not* unit-tested — the Container API only renders markup, it doesn't execute a component's `<script>`.
- **E2E** (`tests/e2e/`, Playwright — `pnpm test:e2e`): all component/page behavior — theme toggle, mobile nav, the logo's random-emoji easter egg. Builds and previews the site first (`astro build && astro preview` on `:4321`). Projects: `chromium`/`firefox`/`webkit` (desktop) + `mobile-chrome`/`mobile-safari` (emulated devices, not real hardware). Spec naming: `*.desktop.spec.ts` / `*.mobile.spec.ts` run only on matching projects; unsuffixed specs run on all of them. `colorScheme` and `reducedMotion` are pinned explicitly in `playwright.config.ts`'s `use` block — never rely on Playwright's own defaults here, since the suite directly tests theming.
- Running `pnpm test:e2e` from an agent's own shell has reliably failed with "webServer exited early" even though it passes when the user runs it manually. Don't spend time debugging that specific symptom — ask the user to run it.

## Favicon / PWA icons (`scripts/generate-favicon.mjs`)

Single source of truth; regenerate with `node scripts/generate-favicon.mjs` after any change (or `pnpm assets:generate:public`, which runs both this and the og-image script). Renders "IB" using real IBM Plex Mono Bold glyph outlines (via `opentype.js`, loaded from the font's **WOFF1** file specifically — WOFF2 needs an external decompressor `opentype.js` doesn't bundle) centered in a black circle on a transparent 512×512 canvas, rasterized at every needed size via `@resvg/resvg-js`. Outputs `favicon.svg`, `favicon.ico`, PNGs at every standard size, `safari-pinned-tab.svg` (a colorless mask silhouette — letters are `evenodd` cutouts, not colored fill), `site.webmanifest`, `browserconfig.xml`.

Settled findings, don't redo this investigation:
- `favicon.ico` is built by a **hand-rolled packer** (`buildIco` in the script), not the `png-to-ico` package. That package decodes to raw pixels and always re-encodes as legacy BMP, which can't exceed 48×48 without hacks and has an inferior alpha representation. `buildIco` embeds complete real PNG files as ICO frames directly (the modern, widely-supported approach) — verified correct by extracting the frames back out and inspecting each one.
- The icon "backdrop" colors (`msapplication-TileColor`, manifest `theme_color`/`background_color`) are **white**, not black, even though the mark itself is black-on-transparent. Windows tiles and the Android PWA splash screen literally paint the icon on top of that exact color, so black-on-black would make the circle vanish. The plain `<meta name="theme-color">` dark-mode tag (which only tints browser chrome, never hosts the icon on top of itself) correctly stays black.
- Safari was observed adding a white box behind the tab favicon. This is **deliberate Safari behavior** — an automatic contrast check against the tab background, not a bug — triggered because the mark is black and the tab background is dark; a reference site with a colorful icon never triggers it. It is not fixable via file format, encoding, or `<link>` tweaks, and the user explicitly doesn't want it worked around. Several hypotheses were tried and ruled out along the way (dropping the `.ico` link, dropping the SVG link, RGBA-vs-indexed PNG color type via `pngquant`) — all reverted on purpose. **Don't reintroduce `pngquant` or any color-quantization step**; it solved nothing and was removed deliberately.

## SEO / social previews

- `Layout.astro` renders description, canonical, Open Graph and `twitter:card` tags from optional `description` / `image` / `type` props, defaulting to `SITE_DESCRIPTION` / `SITE_DEFAULT_OG_IMAGE` in `constants/site.ts`. Absolute URLs come from `site` in `astro.config.ts`, which `@astrojs/sitemap` also requires. Pages can inject extra head tags via `<… slot="head" />`.
- JSON-LD uses `astro-seo-schema`'s `<Schema>` (Person on `/`, built from `cv.json`). `schema-dts` is types-only, so it's a **dev** dependency, pinned to `^1` because that's `astro-seo-schema`'s peer range. No `astro-seo`: the plain meta tags are written by hand on purpose.
- `public/og-image.png` (1200×630, black card, circled photo from `src/assets/igor-bykov.jpg`) and `public/igor-bykov.png` (512×512 plain headshot from the same crop, used as the Person JSON-LD `image`, since search engines want a photo of the person there rather than a designed card) are both generated by `node scripts/generate-og-image.mjs`, which uses the same glyph-outline approach as the favicon script. The title is set in IBM Plex Sans, which is why the static `@fontsource/ibm-plex-sans` (WOFF1) is a dev dependency next to the variable WOFF2 one the site itself uses. That script serializes paths itself because opentype.js 2.0's `toPathData()` intermittently emits `NaN` (seen inside "Barcelona" in Plex Mono 500). resvg then silently drops the rest of the path, so **don't switch back to `toPathData()`**.

## Hosting (Cloudflare): deploy, redirects & headers

- **Deploy**: Cloudflare **Workers with static assets only** (no Worker script → free & unmetered), configured in `wrangler.jsonc` (`dist/`, `404-page` not-found handling, `auto-trailing-slash`, `igorbykov.dev` as a custom domain). `.github/workflows/ci.yml` runs lint → unit → build → E2E on every push/PR and deploys (`pnpm run deploy` = `wrangler deploy`) only on pushes to `main`, uploading the exact `dist/` that passed. Needs repo secrets `CLOUDFLARE_API_TOKEN` & `CLOUDFLARE_ACCOUNT_ID`. DNS for `igorbykov.dev` is on Cloudflare (registrar: Namecheap); it sends no email, so it has null-MX/SPF `-all`/DMARC `p=reject` records.
- **Under-construction mode**: `/under-construction/` is a `noindex` page, filtered out of the sitemap in `astro.config.ts`. `public/_redirects` only sends `/` there. **Don't try a `/*` catch-all in `_redirects`**: Cloudflare applies redirects even when a file exists, and "pass-through" rules (`/x /x 200`) were tried and verified live NOT to protect files: CSS, icons, `robots.txt` all got redirected. Every other page is redirected by the zone-level `Under construction` Redirect Rule (see below), which supports real exclusions. **To launch**, delete that rule, the `_redirects` line, and the sitemap filter if the page goes too.
- **Zone config that lives only in the Cloudflare dashboard** (not in this repo). Redirect Rules, in order (only the first match runs, so order matters):
  1. `www → root`: `www.igorbykov.dev/*` → `https://igorbykov.dev/*`, 301. The `www` DNS record is a proxied placeholder (`AAAA 100::`) that only exists so the rule can fire.
  2. `/cv.pdf` → `/cv-igor-bykov.pdf` (i.e. `public/cv-igor-bykov.pdf`, so don't rename that file), a short shareable CV link. Must stay above rule 3, which would otherwise redirect it to the under-construction page.
  3. `Under construction`: `http.request.uri.path ne "/under-construction/" and not http.request.uri.path contains "."` → `/under-construction/`, 302. Every file has a `.` in its path and no page does, so assets pass through without an exclusion list.

  Cloudflare **Web Analytics** must stay off. When on, Cloudflare injects its `beacon.min.js` into every page, and the CSP blocks it.
- **Security headers** live in `public/_headers`, matched to a reference site's set at the user's request. The CSP is split on purpose: Astro's `security: { csp: true }` writes a per-page `<meta>` with hashes for every inline script/style (the theme script), while the header only carries directives that don't touch scripts/styles. Browsers enforce **both**, so **never add `default-src`/`script-src`/`style-src` to the header**: that would block the hashed inline theme script. Shiki is disabled (`markdown.syntaxHighlight: false`): no Markdown, and its inline styles clash with the CSP.
- Header caveats: `Cross-Origin-Embedder-Policy: require-corp` blocks cross-origin embeds that don't opt in (a YouTube "Intro video", dev.to cover images…); relax it (e.g. `credentialless`) when those land. HSTS has `includeSubDomains; preload`: every subdomain must be HTTPS, and submitting to hstspreload.org is effectively irreversible.
- **Status-page media**: `404` (GIF via `<Picture>`) and `/under-construction/` (looping muted MP4 via `?url` import; Astro has no video component) share only `OPENING_MEDIA_CLASS_NAME`; a shared component was tried and dropped as more trouble than it was worth. Don't read `image.width`/`image.format` from an imported image just to pass them back into `<Picture>`: touching the metadata makes Astro also emit the full-size original into `dist/`.

## CV data (`src/data/cv.json` + `src/types/cv.ts`)

Normalized, shaped like a real API response: `companies[]` (`id`, `name`, `industry: string[]`, `website`) referenced by `companyId` from `positions[]` — so multi-position companies (RepeatMD, Suitaprest each have two) don't duplicate company data — plus `profile` and `education`. Reconciled from both source PDFs, LinkedIn treated as primary. Industries and websites for real companies were verified via live web search, not guessed (one correction already made and worth remembering: **Suitaprest is financial services / private mortgage lending, not fashion** — don't re-guess from the name alone). `techStack` is per-position with dates and is deliberately *not* pre-aggregated into a single "top tech" list — any such ranking (e.g. "most-mentioned tech across the 5 most recent positions", mentioned as a future CV-page feature) should be computed from this raw data by the page itself, not baked into the JSON.

## Not yet built

- Pages: `/freelance`, `/projects`, `/cv`, `/writing`, `/contact`
- CV page: the four filters (Part/Full time, Contractor/Employee, Technology, Industry) and the tech-stack-frequency calculation
- Per-page og:images (every page currently shares the default card)
- Any actual use of the React integration

## Development

**Never start a dev or preview server (`astro dev`, `astro preview`, `pnpm preview`, any port) without asking the user first.** Before starting one *or* asking to, check whether `http://localhost:4321/` is already running (e.g. `lsof -nP -iTCP:4321 -sTCP:LISTEN`); the user usually has their own server up there, so use it instead. Never stop a server you didn't start yourself, and shut down any you did start once you're done.

When starting the dev server (with permission), use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)
