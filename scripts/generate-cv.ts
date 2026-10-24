// Renders src/data/cv.json into public/cv-igor-bykov.pdf by printing it with
// the locally installed Google Chrome, and publishes the data itself as
// public/cv.json. Node runs this file directly via type stripping.
//
// Re-run with: node scripts/generate-cv.ts
import { copyFile, readFile } from 'node:fs/promises';
import path from 'node:path';
import puppeteer from 'puppeteer-core';
import cv from '../src/data/cv.json' with { type: 'json' };
import layout from './cv/layout.ts';
import { render } from './cv/template.ts';

const ROOT = path.join(import.meta.dirname, '..');
const DATA_PATH = path.join(ROOT, 'src/data/cv.json');
const STYLES_PATH = path.join(import.meta.dirname, 'cv/styles.css');
const PDF_OUTPUT_PATH = path.join(ROOT, 'public/cv-igor-bykov.pdf');
const DATA_OUTPUT_PATH = path.join(ROOT, 'public/cv.json');

const css = await readFile(STYLES_PATH, 'utf8');

const browser = await puppeteer.launch({ channel: 'chrome' });
try {
  const page = await browser.newPage();
  await page.setContent(render(cv, layout, css));
  await page.evaluate(() => document.fonts.ready);
  await page.pdf({ path: PDF_OUTPUT_PATH, preferCSSPageSize: true, printBackground: true, tagged: true });
} finally {
  await browser.close();
}

await copyFile(DATA_PATH, DATA_OUTPUT_PATH);

console.log(`Written ${path.relative(ROOT, PDF_OUTPUT_PATH)} & ${path.relative(ROOT, DATA_OUTPUT_PATH)}`);