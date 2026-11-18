#!/usr/bin/env node
/**
 * Проверка *.md: (а) битые относительные markdown-ссылки,
 * (б) бэктик-рефы на существующие файлы без активной ссылки
 * (правило «активных ссылок» из CLAUDE.md).
 *
 * Использование:
 *   node .claude/helpers/md-link-check.cjs            # файл из stdin-JSON хука PostToolUse
 *   node .claude/helpers/md-link-check.cjs <file.md>  # вручную, один или несколько файлов
 * Вывод — только предупреждения; exit 0 (не блокирует правку).
 */
const fs = require("fs");
const path = require("path");

function getTargets() {
  const argv = process.argv.slice(2).filter((a) => !a.startsWith("--"));
  if (argv.length > 0) return argv;
  try {
    const raw = fs.readFileSync(0, "utf8");
    if (!raw.trim()) return [];
    const data = JSON.parse(raw);
    const fp =
      (data && data.tool_input && data.tool_input.file_path) ||
      (data && data.tool_response && data.tool_response.file_path) ||
      (data && data.file_path) ||
      null;
    return fp ? [fp] : [];
  } catch {
    return [];
  }
}

const targets = getTargets().filter((f) => f.endsWith(".md"));

function escRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const findings = [];
for (const file of targets) {
  const abs = path.resolve(file);
  const dir = path.dirname(abs);
  let text;
  try {
    text = fs.readFileSync(abs, "utf8");
  } catch {
    findings.push(`${file}: файл не читается`);
    continue;
  }
  const lines = text.split("\n");
  let inFence = false;
  lines.forEach((line, i) => {
    const n = i + 1;
    if (/^\s*```/.test(line)) {
      inFence = !inFence;
      return;
    }
    if (inFence) return;
    // (а) битые относительные ссылки
    for (const m of line.matchAll(/\]\(([^)\n]+)\)/g)) {
      const href = m[1].trim();
      if (!href || href.startsWith("http") || href.startsWith("mailto:")) continue;
      const isAnchor = !href.split("#")[1] && href.startsWith("#");
      if (href.startsWith("#") || isAnchor) continue;
      let rel;
      try {
        rel = decodeURIComponent(href.split("#")[0].replace(/\\\\/g, ""));
      } catch {
        rel = href.split("#")[0];
      }
      if (!rel) continue;
      const resolved = path.resolve(dir, rel);
      if (!fs.existsSync(resolved)) {
        findings.push(`${file}:${n} битая ссылка ](${href})`);
      }
    }
    // (б) неактивные бэктик-рефы на существующие файлы
    for (const m of line.matchAll(/`([^`\n]{3,200})`/g)) {
      const tok = m[1].trim();
      if (/[\s*|]/.test(tok)) continue; // команды, глоб-и другое
      if (!/\.(md|ts|tsx|astro|json|py|cjs|mjs|sh)$/.test(tok)) continue;
      if (/^(grep|find|ls|cat|sed|npm|node|python3?|npx|trail|astro|git|curl|rsync|ssh)\b/.test(tok)) continue;
      const resolved = path.resolve(dir, tok);
      if (!fs.existsSync(resolved)) continue;
      if (!fs.statSync(resolved).isFile()) continue;
      // уже внутри активной ссылки на этой строке?
      const base = path.basename(tok).replace(/[\][%]/g, "");
      const sameLink = new RegExp(
        `\\]\\([^)\\n]*${escRe(base)}[^)\\n]*\\)`
      ).test(line);
      const linkedText = new RegExp(`\\]\\(${escRe(tok)}`).test(line);
      if (sameLink || linkedText) continue;
      findings.push(
        `${file}:${n} файл-реф \`${tok}\` неактивен — сделать активной ссылку`
      );
    }
  });
}

if (findings.length) {
  console.log("[md-link-check] замечания:");
  for (const f of findings) console.log("  " + f);
}
process.exit(0);
