#!/usr/bin/env node
/**
 * Generate one MP3 per text with the ElevenLabs Text to Speech API.
 *
 * Input : voice-texts.json  (model, one voice id per language, texts per language)
 * Output: audio/<lang>/<id>.mp3
 *
 * Usage (Node 22, no dependencies):
 *   node --env-file=.env generate-voices.mjs             generate new or changed texts
 *   node --env-file=.env generate-voices.mjs --dry-run   show what would be generated, no API calls
 *   node --env-file=.env generate-voices.mjs --only ru/01-moon
 *   node --env-file=.env generate-voices.mjs --force     regenerate everything
 *
 * .env must contain:  ELEVENLABS_API_KEY=...
 * Keep .env out of git.
 */
import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';

const INPUT_FILE = 'voice-texts.json';
const OUT_DIR = 'audio';
const MANIFEST_FILE = path.join(OUT_DIR, '.voice-manifest.json');
const OUTPUT_FORMAT = 'mp3_44100_128';
const API_URL = 'https://api.elevenlabs.io/v1/text-to-speech';
const MAX_RETRIES = 3;

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const force = args.includes('--force');
const onlyIndex = args.indexOf('--only');
const only = onlyIndex !== -1 ? args[onlyIndex + 1] : null;

const exists = (file) => access(file).then(() => true, () => false);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const hashOf = (...parts) => createHash('sha256').update(parts.join('\u0000')).digest('hex');

async function readJson(file, fallback) {
  try {
    return JSON.parse(await readFile(file, 'utf8'));
  } catch (error) {
    if (fallback !== undefined && error.code === 'ENOENT') return fallback;
    throw new Error(`Could not read ${file}: ${error.message}`);
  }
}

async function synthesize({ apiKey, voiceId, model, lang, text }) {
  const body = { text, model_id: model };
  // language_code is not supported by the multilingual_v2 models.
  if (!model.includes('multilingual_v2')) body.language_code = lang;

  for (let attempt = 1; ; attempt++) {
    const response = await fetch(`${API_URL}/${voiceId}?output_format=${OUTPUT_FORMAT}`, {
      method: 'POST',
      headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (response.ok) return Buffer.from(await response.arrayBuffer());

    const detail = (await response.text()).slice(0, 500);
    const retryable = response.status === 429 || response.status >= 500;
    if (!retryable || attempt >= MAX_RETRIES) {
      throw new Error(`HTTP ${response.status}: ${detail}`);
    }
    await sleep(2000 * attempt);
  }
}

async function main() {
  const config = await readJson(INPUT_FILE);
  const { model, voices = {}, texts = {} } = config;
  if (!model) throw new Error(`"model" is missing in ${INPUT_FILE}`);

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!dryRun && !apiKey) {
    throw new Error('ELEVENLABS_API_KEY is not set (put it in .env and run with --env-file=.env)');
  }

  const manifest = await readJson(MANIFEST_FILE, {});
  const jobs = [];

  for (const [lang, entries] of Object.entries(texts)) {
    const voiceId = voices[lang];
    if (!voiceId) throw new Error(`No voice id for language "${lang}" in ${INPUT_FILE}`);

    for (const [id, text] of Object.entries(entries)) {
      const key = `${lang}/${id}`;
      if (!/^[\w-]+$/.test(lang) || !/^[\w-]+$/.test(id)) {
        throw new Error(`"${key}": use only letters, digits, - and _ in language codes and ids`);
      }
      if (typeof text !== 'string' || !text.trim()) {
        throw new Error(`"${key}": text is empty`);
      }
      if (only && only !== key) continue;

      const file = path.join(OUT_DIR, lang, `${id}.mp3`);
      const hash = hashOf(text, voiceId, model, OUTPUT_FORMAT);
      const upToDate = !force && manifest[key] === hash && (await exists(file));
      if (!upToDate) jobs.push({ key, lang, voiceId, text, file, hash });
    }
  }

  if (only && jobs.length === 0) {
    console.log(`Nothing to do for "${only}" (unknown id, or already up to date; add --force to redo it).`);
    return;
  }

  const totalChars = jobs.reduce((sum, job) => sum + job.text.length, 0);
  console.log(`${jobs.length} file(s) to generate, ${totalChars} characters, model ${model}.`);
  if (dryRun) {
    for (const job of jobs) console.log(`  ${job.file}  (${job.text.length} chars)`);
    return;
  }

  let failed = 0;
  // One request at a time keeps this inside every plan's concurrency limit.
  for (const job of jobs) {
    try {
      const audio = await synthesize({ apiKey, model, ...job });
      await mkdir(path.dirname(job.file), { recursive: true });
      await writeFile(job.file, audio);
      manifest[job.key] = job.hash;
      await writeFile(MANIFEST_FILE, JSON.stringify(manifest, null, 2) + '\n');
      console.log(`  ok    ${job.file}`);
    } catch (error) {
      failed++;
      console.error(`  FAIL  ${job.file}\n        ${error.message}`);
    }
  }

  console.log(failed ? `Done with ${failed} failure(s). Run again to retry only those.` : 'Done.');
  if (failed) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
