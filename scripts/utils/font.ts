import { readFileSync } from 'node:fs';
import opentype from 'opentype.js';

// Pass a WOFF1 (or TTF/OTF) file: opentype.js can't decompress WOFF2 on its own.
export const loadFont = (fontPath: string) => {
  const buffer = readFileSync(fontPath);
  return opentype.parse(
    buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength,
    ),
  );
};
