// Regenerates the default social-preview card (og:image / twitter:image) and
// the square portrait used by the Person JSON-LD, both in public/. Text is drawn from real IBM Plex glyph outlines (same approach as
// generate-favicon.ts), so the card doesn't depend on any installed fonts.
//
// Re-run with: tsx scripts/generate-og-image.ts
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import opentype from 'opentype.js';
import { Resvg } from '@resvg/resvg-js';
import type { Font, PathCommand } from 'opentype.js';

const ROOT = path.join(import.meta.dirname, '..');
const CARD_OUTPUT_PATH = path.join(ROOT, 'public/og-image.png');
const PORTRAIT_OUTPUT_PATH = path.join(ROOT, 'public/igor-bykov.png');
const PHOTO_PATH = path.join(ROOT, 'src/assets/igor-bykov.jpg');

// WOFF1 specifically: opentype.js can't decompress WOFF2 on its own.
const FONT_DIR = path.join(ROOT, 'node_modules/@fontsource');
const SANS_SEMIBOLD_PATH = path.join(FONT_DIR, 'ibm-plex-sans/files/ibm-plex-sans-latin-600-normal.woff');
const SANS_REGULAR_PATH = path.join(FONT_DIR, 'ibm-plex-sans/files/ibm-plex-sans-latin-400-normal.woff');
const MONO_MEDIUM_PATH = path.join(FONT_DIR, 'ibm-plex-mono/files/ibm-plex-mono-latin-500-normal.woff');

// The standard 1.91:1 size every major platform renders as a large card.
const WIDTH = 1200;
const HEIGHT = 630;

// A black card on the dark theme's canvas; everything else mirrors the
// dark-theme tokens in src/styles/global.css.
const COLOR_CARD = '#000';
const COLOR_BACKDROP = '#14171A'; // --color-canvas
const COLOR_BORDER = '#292F36'; // --color-canvas-subtle (--color-border is too loud on pure black)
const COLOR_FG = '#E6E8EB';
const COLOR_FG_MUTED = '#9AA4AE';
const COLOR_ACCENT = '#34C98D';

const CARD_MARGIN = 40;
const CARD_PADDING = 64;
const CARD_RADIUS = 16;

const PHOTO_RADIUS = 150;
const PHOTO_CENTER_X = WIDTH - CARD_MARGIN - CARD_PADDING - PHOTO_RADIUS;
const PHOTO_CENTER_Y = HEIGHT / 2;
const PHOTO_GAP = 56; // Between the text column and the photo.

// Square region of the source photo (in its own pixels) that ends up inside the
// circle: head & shoulders, roughly centered on the face.
const PHOTO_SOURCE_WIDTH = 4000;
const PHOTO_SOURCE_HEIGHT = 6000;
const PHOTO_CROP = { x: 795, y: 840, size: 2880 };
const PORTRAIT_SIZE = 512;

const TEXT_X = CARD_MARGIN + CARD_PADDING;
const TEXT_MAX_WIDTH = PHOTO_CENTER_X - PHOTO_RADIUS - PHOTO_GAP - TEXT_X;

const DOMAIN = 'igorbykov.dev';
const TITLE = 'Igor Bykov';
const SUBTITLE = 'Senior full stack software engineer';
const LOCATION = 'Barcelona, Spain';

// Handles are written exactly as they appear in the CV. Icon paths are inlined
// (no runtime dependency): GitHub, Stack Overflow & dev.to from Simple Icons
// (CC0), LinkedIn from Bootstrap Icons (MIT), since Simple Icons dropped it.
const SOCIALS = [
  {
    handle: '/in/igor-bykov/',
    iconViewBox: 16,
    iconPath:
      'M0 1.146C0 .513.526 0 1.175 0h13.65C15.474 0 16 .513 16 1.146v13.708c0 .633-.526 1.146-1.175 1.146H1.175C.526 16 0 15.487 0 14.854zm4.943 12.248V6.169H2.542v7.225zm-1.2-8.212c.837 0 1.358-.554 1.358-1.248-.015-.709-.52-1.248-1.342-1.248S2.4 3.226 2.4 3.934c0 .694.521 1.248 1.327 1.248zm4.908 8.212V9.359c0-.216.016-.432.08-.586.173-.431.568-.878 1.232-.878.869 0 1.216.662 1.216 1.634v3.865h2.401V9.25c0-2.22-1.184-3.252-2.764-3.252-1.274 0-1.845.7-2.165 1.193v.025h-.016l.016-.025V6.169h-2.4c.03.678 0 7.225 0 7.225z',
  },
  {
    handle: '@Uzwername',
    iconViewBox: 24,
    iconPath:
      'M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12',
  },
  {
    handle: '/users/9430588/',
    iconViewBox: 24,
    iconPath:
      'M15.725 0l-1.72 1.277 6.39 8.588 1.716-1.277L15.725 0zm-3.94 3.418l-1.369 1.644 8.225 6.85 1.369-1.644-8.225-6.85zm-3.15 4.465l-.905 1.94 9.702 4.517.904-1.94-9.701-4.517zm-1.85 4.86l-.44 2.093 10.473 2.201.44-2.092-10.473-2.203zM1.89 15.47V24h19.19v-8.53h-2.133v6.397H4.021v-6.396H1.89zm4.265 2.133v2.13h10.66v-2.13H6.154Z',
  },
  {
    handle: '@igor_bykov',
    iconViewBox: 24,
    iconPath:
      'M7.42 10.05c-.18-.16-.46-.23-.84-.23H6l.02 2.44.04 2.45.56-.02c.41 0 .63-.07.83-.26.24-.24.26-.36.26-2.2 0-1.91-.02-1.96-.29-2.18zM0 4.94v14.12h24V4.94H0zM8.56 15.3c-.44.58-1.06.77-2.53.77H4.71V8.53h1.4c1.67 0 2.16.18 2.6.9.27.43.29.6.32 2.57.05 2.23-.02 2.73-.47 3.3zm5.09-5.47h-2.47v1.77h1.52v1.28l-.72.04-.75.03v1.77l1.22.03 1.2.04v1.28h-1.6c-1.53 0-1.6-.01-1.87-.3l-.3-.28v-3.16c0-3.02.01-3.18.25-3.48.23-.31.25-.31 1.88-.31h1.64v1.3zm4.68 5.45c-.17.43-.64.79-1 .79-.18 0-.45-.15-.67-.39-.32-.32-.45-.63-.82-2.08l-.9-3.39-.45-1.67h.76c.4 0 .75.02.75.05 0 .06 1.16 4.54 1.26 4.83.04.15.32-.7.73-2.3l.66-2.52.74-.04c.4-.02.73 0 .73.04 0 .14-1.67 6.38-1.8 6.68z',
  },
];

interface Fonts {
  sansSemibold: Font;
  sansRegular: Font;
  monoMedium: Font;
}

const loadFont = (fontPath: string) => {
  const buffer = readFileSync(fontPath);
  return opentype.parse(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength));
};

// Greedy word wrap against the font's real advance widths.
const wrapText = (font: Font, text: string, fontSize: number, maxWidth: number) => {
  const lines: string[] = [];
  let current = '';

  for (const word of text.split(' ')) {
    const candidate = current ? `${current} ${word}` : word;
    if (current && font.getAdvanceWidth(candidate, fontSize) > maxWidth) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }

  if (current) {
    lines.push(current);
  }

  return lines;
};

// Serializes path commands ourselves: opentype.js 2.0's own `toPathData()`
// intermittently emits `NaN` coordinates (e.g. inside "Barcelona" in Plex Mono
// 500) even though the underlying commands are valid, and resvg silently drops
// everything after the first malformed number.
const toPathData = (commands: PathCommand[]) =>
  commands
    .map((command) => {
      const n = (value: number) => value.toFixed(2);
      switch (command.type) {
        case 'M':
        case 'L':
          return `${command.type}${n(command.x)} ${n(command.y)}`;
        case 'Q':
          return `Q${n(command.x1)} ${n(command.y1)} ${n(command.x)} ${n(command.y)}`;
        case 'C':
          return `C${n(command.x1)} ${n(command.y1)} ${n(command.x2)} ${n(command.y2)} ${n(command.x)} ${n(command.y)}`;
        default:
          return 'Z';
      }
    })
    .join('');

interface TextPathOptions {
  font: Font;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fill: string;
}

const textPath = ({ font, text, x, y, fontSize, fill }: TextPathOptions) =>
  `<path d="${toPathData(font.getPath(text, x, y, fontSize).commands)}" fill="${fill}" />`;

// The full source photo, positioned & scaled so that exactly PHOTO_CROP lands
// on the square box at (boxX, boxY) of side boxSize.
interface CroppedPhotoOptions {
  photoBase64: string;
  boxX: number;
  boxY: number;
  boxSize: number;
  attributes?: string;
}

const buildCroppedPhoto = ({ photoBase64, boxX, boxY, boxSize, attributes = '' }: CroppedPhotoOptions) => {
  const scale = boxSize / PHOTO_CROP.size;

  return `<image
    href="data:image/jpeg;base64,${photoBase64}"
    x="${boxX - PHOTO_CROP.x * scale}" y="${boxY - PHOTO_CROP.y * scale}"
    width="${PHOTO_SOURCE_WIDTH * scale}" height="${PHOTO_SOURCE_HEIGHT * scale}"
    preserveAspectRatio="none"
    ${attributes}
  />`;
};

const buildCardPhoto = (photoBase64: string) => `
  <clipPath id="photo-clip">
    <circle cx="${PHOTO_CENTER_X}" cy="${PHOTO_CENTER_Y}" r="${PHOTO_RADIUS}" />
  </clipPath>
  ${buildCroppedPhoto({
    photoBase64,
    boxX: PHOTO_CENTER_X - PHOTO_RADIUS,
    boxY: PHOTO_CENTER_Y - PHOTO_RADIUS,
    boxSize: PHOTO_RADIUS * 2,
    attributes: 'clip-path="url(#photo-clip)"',
  })}
  <circle cx="${PHOTO_CENTER_X}" cy="${PHOTO_CENTER_Y}" r="${PHOTO_RADIUS}" fill="none" stroke="${COLOR_BORDER}" stroke-width="2" />`;

// Plain square headshot (no card, no circle) for structured data, where search
// engines expect a photo of the person rather than a designed graphic.
const buildPortraitSvg = (photoBase64: string) => `<svg xmlns="http://www.w3.org/2000/svg" width="${PORTRAIT_SIZE}" height="${PORTRAIT_SIZE}" viewBox="0 0 ${PORTRAIT_SIZE} ${PORTRAIT_SIZE}">
  ${buildCroppedPhoto({ photoBase64, boxX: 0, boxY: 0, boxSize: PORTRAIT_SIZE })}
</svg>
`;

const SOCIAL_ICON_SIZE = 24;
const SOCIAL_ICON_GAP = 10; // Between an icon and its handle.
const SOCIAL_ITEM_GAP = 40; // Between one handle and the next icon.
const SOCIAL_FONT_SIZE = 22;
const SOCIAL_ROW_GAP = 52; // Baseline-to-baseline, from the location line to the socials row.

// One row of icon + handle pairs, starting at x; `baseline` is the handles'
// text baseline, icons are vertically centered on the text's x-height.
const buildSocials = (font: Font, x: number, baseline: number) => {
  let cursor = x;

  return SOCIALS.map(({ handle, iconViewBox, iconPath }) => {
    const iconY = baseline - SOCIAL_FONT_SIZE * 0.35 - SOCIAL_ICON_SIZE / 2;
    const icon = `<path d="${iconPath}" fill="${COLOR_FG_MUTED}" transform="translate(${cursor} ${iconY}) scale(${SOCIAL_ICON_SIZE / iconViewBox})" />`;
    const textX = cursor + SOCIAL_ICON_SIZE + SOCIAL_ICON_GAP;
    const text = textPath({ font, text: handle, x: textX, y: baseline, fontSize: SOCIAL_FONT_SIZE, fill: COLOR_FG_MUTED });

    cursor = textX + font.getAdvanceWidth(handle, SOCIAL_FONT_SIZE) + SOCIAL_ITEM_GAP;

    return `${icon}\n  ${text}`;
  }).join('\n  ');
};

const buildCardSvg = (fonts: Fonts, photoBase64: string) => {
  const domainSize = 26;
  const titleSize = 76;
  const subtitleSize = 36;
  const subtitleLineHeight = 46;
  const locationSize = 24;

  const subtitleLines = wrapText(fonts.sansRegular, SUBTITLE, subtitleSize, TEXT_MAX_WIDTH);

  // Title + subtitle block is vertically centered on the card; the domain is
  // pinned to the card's top padding, socials (with location right above them)
  // to its bottom padding.
  const blockHeight = titleSize + 24 + subtitleLineHeight * subtitleLines.length;
  // Nudged slightly above true center to balance the location + socials below.
  const titleBaseline = HEIGHT / 2 - blockHeight / 2 + titleSize - 8;
  const firstSubtitleBaseline = titleBaseline + 24 + subtitleLineHeight;

  const cardTop = CARD_MARGIN;
  const cardBottom = HEIGHT - CARD_MARGIN;
  const topBaseline = cardTop + CARD_PADDING + domainSize * 0.75;
  const socialsBaseline = cardBottom - CARD_PADDING;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <rect width="${WIDTH}" height="${HEIGHT}" fill="${COLOR_BACKDROP}" />
  <rect
    x="${CARD_MARGIN}" y="${cardTop}"
    width="${WIDTH - CARD_MARGIN * 2}" height="${HEIGHT - CARD_MARGIN * 2}"
    rx="${CARD_RADIUS}"
    fill="${COLOR_CARD}" stroke="${COLOR_BORDER}" stroke-width="2"
  />
  ${textPath({ font: fonts.monoMedium, text: DOMAIN, x: TEXT_X, y: topBaseline, fontSize: domainSize, fill: COLOR_ACCENT })}
  ${textPath({ font: fonts.sansSemibold, text: TITLE, x: TEXT_X, y: titleBaseline, fontSize: titleSize, fill: COLOR_FG })}
  ${subtitleLines
    .map((line, index) =>
      textPath({
        font: fonts.sansRegular,
        text: line,
        x: TEXT_X,
        y: firstSubtitleBaseline + subtitleLineHeight * index,
        fontSize: subtitleSize,
        fill: COLOR_FG_MUTED,
      }),
    )
    .join('\n  ')}
  ${textPath({ font: fonts.monoMedium, text: LOCATION, x: TEXT_X, y: socialsBaseline - SOCIAL_ROW_GAP, fontSize: locationSize, fill: COLOR_FG_MUTED })}
  ${buildSocials(fonts.monoMedium, TEXT_X, socialsBaseline)}
  ${buildCardPhoto(photoBase64)}
</svg>
`;
};

const writePng = (outputPath: string, svg: string) => {
  const png = new Resvg(svg, { fitTo: { mode: 'original' } }).render().asPng();
  writeFileSync(outputPath, png);
  console.log(`wrote ${path.relative(ROOT, outputPath)} (${Math.round(png.length / 1024)} KB)`);
};

const main = () => {
  const fonts: Fonts = {
    sansSemibold: loadFont(SANS_SEMIBOLD_PATH),
    sansRegular: loadFont(SANS_REGULAR_PATH),
    monoMedium: loadFont(MONO_MEDIUM_PATH),
  };

  const photoBase64 = readFileSync(PHOTO_PATH).toString('base64');

  writePng(CARD_OUTPUT_PATH, buildCardSvg(fonts, photoBase64));
  writePng(PORTRAIT_OUTPUT_PATH, buildPortraitSvg(photoBase64));
};

main();
