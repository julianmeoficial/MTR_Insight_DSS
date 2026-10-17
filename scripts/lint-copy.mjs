#!/usr/bin/env node
/**
 * lint-copy: fails on banned punctuation and hardcoded visible JSX strings.
 * Scans src/i18n and all TSX under src (no new deps).
 */

import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const SRC = path.join(ROOT, "src");

const EM = "\u2014"; // —
const EN = "\u2013"; // –

const UNIT_AFTER_NUMBER =
  /^(?:%|pp|pasajeros|sillas|vuelos|semanas|días|día|h|min|km|m)$/iu;

/** @type {{file: string, line: number, rule: string, sample: string}[]} */
const errors = [];

function walk(dir, pred, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === "node_modules" || ent.name === ".next") continue;
      walk(p, pred, out);
    } else if (pred(p)) out.push(p);
  }
  return out;
}

function rel(p) {
  return path.relative(ROOT, p);
}

function add(file, line, rule, sample) {
  errors.push({
    file: rel(file),
    line,
    rule,
    sample: sample.slice(0, 120),
  });
}

function checkTextRules(file, content, opts = {}) {
  const { skipHardcodedJsx = false } = opts;
  const lines = content.split(/\r?\n/);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const n = i + 1;

    // Skip pure comments for some rules (still flag em dashes in comments that are Spanish docs? user said visible text - skip // comments for quote/jsx rules)
    const isCodeComment = /^\s*(\/\/|\*|\/\*)/.test(line);

    if (line.includes(EM) || line.includes(EN)) {
      add(file, n, "em-or-en-dash", line.trim());
    }

    if (line.includes("...")) {
      // allow spread and rest in code: ...foo, {...x}, [...a]
      const withoutCodeSpread = line
        .replace(/\.\.\.\s*[\w{[\]]/g, "")
        .replace(/\.\.\.\s*$/g, "");
      if (withoutCodeSpread.includes("...")) {
        add(file, n, "triple-dot-ellipsis", line.trim());
      }
    }

    // Straight double quotes inside Spanish string literals (heuristic: strings with accents or Spanish words)
    if (!isCodeComment) {
      const strRe = /(["'])((?:\\.|(?!\1).)*)\1/g;
      let m;
      while ((m = strRe.exec(line)) !== null) {
        const body = m[2];
        if (m[1] === "'" && !/[¿¡áéíóúñÁÉÍÓÚÑ]/.test(body) && !/\?\s*$/.test(body)) {
          continue;
        }
        const isSpanishCopy =
          /\/i18n\/es\.ts$/.test(file.replace(/\\/g, "/")) ||
          /[áéíóúñ¿¡]/i.test(body);

        // Spanish questions/exclamations require opening marks
        if (isSpanishCopy && /\?/.test(body) && !/¿/.test(body)) {
          if (
            !/https?:\/\//.test(body) &&
            !/\\[sdw]/.test(body) &&
            body.length > 2
          ) {
            add(file, n, "question-without-open", body);
          }
        }
        if (isSpanishCopy && /!/.test(body) && !/¡/.test(body)) {
          if (
            !/https?:\/\//.test(body) &&
            !/!==|!=/.test(line) &&
            body.length > 2
          ) {
            add(file, n, "exclaim-without-open", body);
          }
        }
        if (/"/.test(body) && /[áéíóúñ¿¡]/i.test(body)) {
          add(file, n, "straight-quotes-in-spanish", body);
        }
        // Number + normal space + % or approved unit (not codes like RC-01)
        const unitRe = /(\d+(?:[.,]\d+)?) ([%a-záéíóúñ]+)/gi;
        let um;
        while ((um = unitRe.exec(body)) !== null) {
          const unit = um[2];
          if (unit === "%" || UNIT_AFTER_NUMBER.test(unit)) {
            add(file, n, "nbsp-before-unit", um[0]);
          }
        }
        if (/  +/.test(body) || / [.,;:]/.test(body)) {
          add(file, n, "spacing", body);
        }
      }
    }

    if (!skipHardcodedJsx && file.endsWith(".tsx")) {
      // Only enforce dictionary sourcing on migrated product surfaces
      const relPath = file.replace(/\\/g, "/");
      const migrated =
        /\/(landing|shell)\//.test(relPath) ||
        /\/(sig)\/(p1|alertas|escenarios|decisiones)\//.test(relPath) ||
        /DemoBanner\.tsx$/.test(relPath) ||
        /AlertList\.tsx$/.test(relPath) ||
        /WhyPanel\.tsx$/.test(relPath);
      if (!migrated) continue;

      const jsxText = />([^<>{}\n][^<>{}\n]*)</g;
      let jm;
      while ((jm = jsxText.exec(line)) !== null) {
        const t = jm[1].trim();
        if (!t) continue;
        if (/^[\d\s.,:%+\-·|/→↑↓]+$/.test(t)) continue;
        if (/^(https?:\/\/|mailto:)/.test(t)) continue;
        if (/^[A-Z0-9]{1,8}$/.test(t)) continue;
        // Flag sentence-like Spanish/English literals (3+ words or punctuation)
        const words = t.split(/\s+/).filter(Boolean);
        if (
          (words.length >= 3 || /[¿¡.?]/.test(t)) &&
          /[A-Za-záéíóúñÁÉÍÓÚÑ]/.test(t)
        ) {
          add(file, n, "hardcoded-jsx-text", t);
        }
      }
    }
  }
}

const i18nFiles = walk(path.join(SRC, "i18n"), (p) => /\.(ts|tsx|js|mjs)$/.test(p));
const tsxFiles = walk(SRC, (p) => p.endsWith(".tsx"));

for (const f of i18nFiles) {
  checkTextRules(f, fs.readFileSync(f, "utf8"), { skipHardcodedJsx: true });
}
for (const f of tsxFiles) {
  checkTextRules(f, fs.readFileSync(f, "utf8"));
}

if (errors.length) {
  console.error(`lint:copy failed (${errors.length} issue(s)):\n`);
  for (const e of errors) {
    console.error(`  ${e.file}:${e.line}  [${e.rule}]  ${e.sample}`);
  }
  process.exit(1);
}

console.log(`lint:copy ok (${i18nFiles.length} i18n + ${tsxFiles.length} tsx files)`);
