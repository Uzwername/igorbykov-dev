// Regenerates every favicon/PWA-icon asset in public/ from a single source
// of truth: "IB" set in IBM Plex Mono Bold, centered in a black circle on a
// transparent field (matching the site's actual font, not an approximation).
//
// Re-run with: node scripts/generate-favicon.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import opentype from 'opentype.js';
import { Resvg } from '@resvg/resvg-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT, 'public');

const FONT_PATH = path.join(
  ROOT,
  'node_modules/@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-700-normal.woff',
);

const CANVAS_SIZE = 512;
const CIRCLE_MARGIN = 16;
const TEXT = 'IB';
const TEXT_WIDTH_RATIO = 0.62; // Target text width as a fraction of the circle's diameter.
const BLACK = '#000';
const WHITE = '#FFF';
// Windows tiles and the Android PWA splash screen paint the (transparent-background)
// icon directly on top of these values, so they must never match the circle's own
// fill (BLACK) or it would vanish into the backdrop.
const ICON_BACKDROP_COLOR = WHITE;

const loadFont = () => {
  const buffer = readFileSync(FONT_PATH);
  return opentype.parse(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength));
};

const getTextPathAndBounds = (font, fontSize) => {
  const path = font.getPath(TEXT, 0, 0, fontSize);
  const bbox = path.getBoundingBox();
  return { path, bbox };
};

// Render the glyph path data at whatever font size makes it hit the target
// width, then translate it so its bounding box sits centered on the canvas.
const buildCenteredTextPathData = (font) => {
  const circleDiameter = CANVAS_SIZE - CIRCLE_MARGIN * 2;
  const targetWidth = circleDiameter * TEXT_WIDTH_RATIO;

  const probe = getTextPathAndBounds(font, 1000);
  const probeWidth = probe.bbox.x2 - probe.bbox.x1;
  const fontSize = (targetWidth / probeWidth) * 1000;

  const { path, bbox } = getTextPathAndBounds(font, fontSize);
  const width = bbox.x2 - bbox.x1;
  const height = bbox.y2 - bbox.y1;
  const offsetX = CANVAS_SIZE / 2 - (bbox.x1 + width / 2);
  const offsetY = CANVAS_SIZE / 2 - (bbox.y1 + height / 2);

  path.commands = path.commands.map((command) => {
    const translated = { ...command };
    for (const key of ['x', 'y', 'x1', 'y1', 'x2', 'y2']) {
      if (typeof translated[key] === 'number') {
        translated[key] += key.startsWith('x') ? offsetX : offsetY;
      }
    }
    return translated;
  });

  return path.toPathData(3);
};

const circleCx = CANVAS_SIZE / 2;
const circleCy = CANVAS_SIZE / 2;
const circleR = CANVAS_SIZE / 2 - CIRCLE_MARGIN;

const buildColorSvg = (textPathData) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${CANVAS_SIZE} ${CANVAS_SIZE}">
  <circle cx="${circleCx}" cy="${circleCy}" r="${circleR}" fill="${BLACK}" />
  <path d="${textPathData}" fill="${WHITE}" />
</svg>
`;

// Safari's mask-icon must be a single silhouette: the letters become
// transparent cutouts in the circle (evenodd), so whichever accent color
// Safari applies still reads correctly through the tab bar.
const buildMaskSvg = (circlePathData, textPathData) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${CANVAS_SIZE} ${CANVAS_SIZE}">
  <path fill-rule="evenodd" d="${circlePathData} ${textPathData}" />
</svg>
`;

const circleAsPathData = () => {
  // Two arcs so the circle is a closed path usable inside a compound `d`.
  const r = circleR;
  return `M ${circleCx - r},${circleCy} a ${r},${r} 0 1 0 ${r * 2},0 a ${r},${r} 0 1 0 ${-r * 2},0 Z`;
};

const rasterize = (svg, size) => {
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: size },
    background: 'rgba(0,0,0,0)',
  });
  return resvg.render().asPng();
};

// Builds an .ico by embedding complete PNG files as frames, rather than
// decoding to raw pixels and re-encoding as legacy BMP (which has a more
// limited, ambiguous alpha representation).
const buildIco = (pngsBySize) => {
  const sizes = [...pngsBySize.keys()];
  const HEADER_SIZE = 6;
  const DIR_ENTRY_SIZE = 16;

  const header = Buffer.alloc(HEADER_SIZE);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(sizes.length, 4);

  let offset = HEADER_SIZE + DIR_ENTRY_SIZE * sizes.length;
  const dirEntries = [];

  for (const size of sizes) {
    const png = pngsBySize.get(size);
    const entry = Buffer.alloc(DIR_ENTRY_SIZE);
    entry.writeUInt8(size >= 256 ? 0 : size, 0); // width (0 means 256)
    entry.writeUInt8(size >= 256 ? 0 : size, 1); // height (0 means 256)
    entry.writeUInt8(0, 2); // color count: n/a, pixel format lives in the PNG itself
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(png.length, 8);
    entry.writeUInt32LE(offset, 12);
    dirEntries.push(entry);
    offset += png.length;
  }

  return Buffer.concat([header, ...dirEntries, ...sizes.map((size) => pngsBySize.get(size))]);
};

const writePublicFile = (name, contents) => {
  writeFileSync(path.join(PUBLIC_DIR, name), contents);
  console.log('wrote', name);
};

const main = async () => {
  const font = loadFont();
  const textPathData = buildCenteredTextPathData(font);
  const circlePathData = circleAsPathData();

  const colorSvg = buildColorSvg(textPathData);
  const maskSvg = buildMaskSvg(circlePathData, textPathData);

  writePublicFile('favicon.svg', colorSvg);
  writePublicFile('safari-pinned-tab.svg', maskSvg);

  const pngSizes = [16, 32, 48, 96, 120, 128, 150, 152, 167, 180, 192, 256, 512];
  const pngBuffers = new Map();

  for (const size of pngSizes) {
    const buffer = rasterize(colorSvg, size);
    pngBuffers.set(size, buffer);
  }

  writePublicFile('favicon-16x16.png', pngBuffers.get(16));
  writePublicFile('favicon-32x32.png', pngBuffers.get(32));
  writePublicFile('favicon-96x96.png', pngBuffers.get(96));
  writePublicFile('apple-touch-icon.png', pngBuffers.get(180));
  // Legacy convention some iOS/Safari versions probe for implicitly, regardless
  // of any <link> tag, to opt out of the (long-removed) automatic gloss effect.
  writePublicFile('apple-touch-icon-precomposed.png', pngBuffers.get(180));
  writePublicFile('apple-touch-icon-120x120.png', pngBuffers.get(120));
  writePublicFile('apple-touch-icon-152x152.png', pngBuffers.get(152));
  writePublicFile('apple-touch-icon-167x167.png', pngBuffers.get(167));
  writePublicFile('android-chrome-192x192.png', pngBuffers.get(192));
  writePublicFile('android-chrome-512x512.png', pngBuffers.get(512));
  writePublicFile('mstile-150x150.png', pngBuffers.get(150));

  const icoBuffer = buildIco(
    new Map([16, 32, 48, 128, 256].map((size) => [size, pngBuffers.get(size)])),
  );
  writePublicFile('favicon.ico', icoBuffer);

  const manifest = {
    name: 'Igor Bykov — Senior full stack software engineer',
    short_name: 'Igor Bykov',
    icons: [
      { src: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
      { src: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    theme_color: ICON_BACKDROP_COLOR,
    background_color: ICON_BACKDROP_COLOR,
    display: 'standalone',
  };
  writePublicFile('site.webmanifest', JSON.stringify(manifest, null, 2) + '\n');

  const browserConfig = `<?xml version="1.0" encoding="utf-8"?>
<browserconfig>
  <msapplication>
    <tile>
      <square150x150logo src="/mstile-150x150.png"/>
      <TileColor>${ICON_BACKDROP_COLOR}</TileColor>
    </tile>
  </msapplication>
</browserconfig>
`;
  writePublicFile('browserconfig.xml', browserConfig);

  console.log('\nDone.');
};

await main();
