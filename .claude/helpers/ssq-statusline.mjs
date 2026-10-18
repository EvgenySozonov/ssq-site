#!/usr/bin/env node
// Объединённая статус-линия: личные сегменты (модель | каталог | ctx | лимиты)
// + сегменты graft (граф / синхронизация / сохранённые токены).
// Контекст рисуем один раз — в личной строке, graft-рендеру передаём ctxPct: null.
//
// Вход — JSON статус-линии Claude Code (см. комментарии в
// ~/.claude/statusline-command.sh). Если graft недоступен — остаётся личная строка.
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';

const C = {
  cyan: (s) => `\x1b[36m${s}\x1b[0m`,
  blue: (s) => `\x1b[34m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
  nd: (s) => `\x1b[33m${s}\x1b[0m`,
};
const SEP = C.dim(' | ');

// --- резолв dist/claude пакета @nanonets/graft (логика graft-statusline.cjs) ---
const dir = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const BAKED = '/usr/local/lib/node_modules/@nanonets/graft/dist/claude';

function fromPkg(base) {
  try {
    const pkgPath = require.resolve('@nanonets/graft/package.json', { paths: [base] });
    return path.join(path.dirname(pkgPath), 'dist', 'claude');
  } catch { return null; }
}

function globalRoot() {
  try {
    return execFileSync('npm', ['root', '-g'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim() || null;
  } catch { return null; }
}

// Наивный числовое сравнение версий; непрочитанная версия проигрывает любой известной.
function newer(a, b) {
  if (!a) return false;
  if (!b) return true;
  const p = (v) => String(v).split('-')[0].split('.').map(Number);
  const pa = p(a), pb = p(b);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    if ((pa[i] || 0) !== (pb[i] || 0)) return (pa[i] || 0) > (pb[i] || 0);
  }
  return false;
}

function bestDir(dirs, name) {
  let hit = null, hitVer = null;
  for (const d of dirs) {
    if (!d || !existsSync(path.join(d, name))) continue;
    let v = null;
    try {
      v = JSON.parse(readFileSync(path.join(d, '..', '..', 'package.json'), 'utf8')).version || null;
    } catch { /* версия неизвестна — директория всё равно допустима */ }
    if (hit === null || newer(v, hitVer)) { hit = d; hitVer = v; }
  }
  return hit;
}

function entry(name) {
  const cheap = [BAKED, fromPkg(dir), fromPkg(path.join(path.dirname(process.execPath), '..', 'lib'))];
  const hit = bestDir(cheap, name);
  if (hit) return path.join(hit, name);
  const gr = globalRoot();
  const global = gr && path.join(gr, '@nanonets', 'graft', 'dist', 'claude');
  if (global && existsSync(path.join(global, name))) return path.join(global, name);
  return null;
}

let input = {};
try { input = JSON.parse(readFileSync(0, 'utf8')); } catch { /* пустой stdin */ }

// --- личные сегменты ---
const model = input?.model?.display_name ?? 'unknown';
let cwd = input?.workspace?.current_dir ?? input?.cwd ?? '';
if (cwd && process.env.HOME && cwd.startsWith(process.env.HOME)) {
  cwd = `~${cwd.slice(process.env.HOME.length)}`;
}

const ctxUsed = input?.context_window?.used_percentage;
const ctxSize = input?.context_window?.context_window_size;
const ctxSeg = typeof ctxUsed === 'number'
  ? C.yellow(`ctx: ${Math.round(ctxUsed)}%`)
  : C.nd('ctx: н/д');

let totalSeg = C.nd('н/д');
if (typeof ctxSize === 'number' && ctxSize >= 1000) totalSeg = `${Math.round(ctxSize / 1000)}k`;
else if (typeof ctxSize === 'number') totalSeg = String(ctxSize);

const fmtRem = (v) => typeof v !== 'number' ? 'н/д' : `${Math.round(100 - v)}%`;
const limitsSeg = C.green(
  `лимиты: всего ${totalSeg}, 5h:${fmtRem(input?.rate_limits?.five_hour?.used_percentage)}, ` +
  `7d:${fmtRem(input?.rate_limits?.seven_day?.used_percentage)}`
);

const personal = [
  model ? C.cyan(model) : null,
  cwd ? C.blue(cwd) : null,
  ctxSeg,
  limitsSeg,
].filter(Boolean).join(SEP);

// --- graft-сегменты ---
const lines = [personal];
const agent = input?.agent?.name;
if (agent) {
  try {
    const [fmt, st] = await Promise.all([
      import(pathToFileURL(entry('format.js')).href),
      import(pathToFileURL(entry('state.js')).href),
    ]);
    const sdir = process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd();
    lines.push(fmt.renderSubagent(agent, st.readSession(sdir, input.session_id || 'default')));
  } catch { /* graft недоступен */ }
} else {
  try {
    const entryPath = entry('statusline.js');
    if (!entryPath) throw new Error('graft not found');
    const graft = path.dirname(entryPath);
    const [fmt, st] = await Promise.all([
      import(pathToFileURL(path.join(graft, 'format.js')).href),
      import(pathToFileURL(path.join(graft, 'state.js')).href),
    ]);
    const status = await import(pathToFileURL(entryPath).href);
    const sdir = process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd();
    const session = st.readSession(sdir, input.session_id || 'default');
    // ctx рисуется в личной строке — graft-рендеру передаём ctxPct: null.
    // Сегмент 'last: файл' не показываем: вырезаем его из строк graft, а строку
    // '▸ …', оставшуюся после этого пустой, отбрасываем.
    const graftLines = fmt.renderStatusline(status.resolveStats(sdir), session, {})
      .map((l) => l.replace(
        /(\x1b\[38;5;244m · \x1b\[0m)?\x1b\[38;5;244mlast: \x1b\[0m\x1b\[38;5;251m[^\x1b]*\x1b\[0m/g,
        ''
      ))
      .filter((l) => !['', '▸'].includes(l.replace(/\x1b\[[0-9;]*m/g, '').trim()));
    lines.push(...graftLines);
  } catch { /* graft недоступен — одна личная строка */ }
}

console.log(lines.filter(Boolean).join('\n'));