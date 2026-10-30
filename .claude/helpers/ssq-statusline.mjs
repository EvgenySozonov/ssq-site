#!/usr/bin/env node
// Объединённая статус-линия: личные сегменты (модель | каталог | ctx | лимиты)
// + сегменты graft (граф / синхронизация / сохранённые токены).
// Контекст рисуем один раз — в личной строке, graft-рендеру передаём ctxPct: null.
//
// Вход — JSON статус-линии Claude Code (см. комментарии в
// ~/.claude/statusline-command.sh). Если graft недоступен — остаётся личная строка.
import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import fs from 'node:fs';
import path from 'node:path';
import { tmpdir, homedir } from 'node:os';
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

// --- бридж для gsd-context-monitor (~/.claude/hooks/gsd-context-monitor.js) ---
// User-статуслиния (gsd-statusline.js:1186) в этом проекте не активна, поэтому
// метрики для монитора записывает наша линия. Формат бриджа — тот же (#4985):
// remaining_percentage считается до порога auto-compact, чтобы монитор бил
// тревогу ДО сжатия, а не после. Best-effort: любая ошибка не роняет линию.
// --- окно auto-compact: env → настройки /autocompact → окно модели ---
// Возвращено по learning 2026-10-29 («вернуться, если появится /autocompact» —
// и он появился в этой сборке). Разрешаем окно так же, как Claude Code
// (gsd-statusline.js:348): CLAUDE_CODE_AUTO_COMPACT_WINDOW (нечисловое или
// неположительное игнорируется; ограничение 1M, поднятие до 100k), иначе
// настройка autoCompactWindow от /autocompact — per-model settings-цепочка
// (см. readAutoCompactWindowSetting), иначе окно модели. Всегда ограничено
// окном модели.
const AUTO_COMPACT_WINDOW_MIN = 100_000;
const AUTO_COMPACT_WINDOW_MAX = 1_000_000;
const SETTINGS_FILE_MAX_BYTES = 1 << 20;
const MODEL_KEY_MAX_LENGTH = 256;

function isAutoCompactWindowValue(v) {
  // «auto» (настроенное Claude Code окно) — null у вызывающего:
  // считаем порог от окна модели.
  return v === 'auto' ||
    (Number.isInteger(v) && v >= AUTO_COMPACT_WINDOW_MIN && v <= AUTO_COMPACT_WINDOW_MAX);
}

function canonicalModelKey(id) {
  if (typeof id !== 'string') return '';
  let key = id.toLowerCase();
  if (key.length > MODEL_KEY_MAX_LENGTH) return '';
  for (let prev; prev !== key;) {
    prev = key;
    key = key.trim()
      .replace(/(?:\[1m\])+$/, '')
      .replace(/^(?:[a-z]+\.)?anthropic\./, '')
      .replace(/(\d)-v\d+(?::\d+)?$/, '$1')
      .replace(/@\d{8}$/, '')
      .replace(/-\d{8}$/, '');
  }
  return key;
}

function readSettingsFile(file) {
  try {
    const st = fs.statSync(file);
    if (!st.isFile() || st.size > SETTINGS_FILE_MAX_BYTES) return null;
    const s = JSON.parse(fs.readFileSync(file, 'utf8'));
    return s && typeof s === 'object' && !Array.isArray(s) ? s : null;
    // отсутствие/нечитаемость — считаем отсутствующим и идём дальше
  } catch { return null; }
}

function claudeSettingsPaths(dir, env) {
  const candidates = [];
  if (dir) {
    candidates.push(path.join(dir, '.claude', 'settings.local.json'));
    candidates.push(path.join(dir, '.claude', 'settings.json'));
  }
  let claudeDir;
  try {
    claudeDir = env.CLAUDE_CONFIG_DIR || path.join(homedir(), '.claude');
  } catch { claudeDir = null; }
  if (claudeDir) {
    candidates.push(path.join(claudeDir, 'settings.local.json'));
    candidates.push(path.join(claudeDir, 'settings.json'));
  }
  return candidates;
}

function readAutoCompactWindowSetting(dir, env, modelId) {
  let fallback;
  let byModel = {};
  for (const settings of claudeSettingsPaths(dir, env).map(readSettingsFile).filter(Boolean).reverse()) {
    const own = {};
    const perModel = settings.modelSettings;
    if (perModel && typeof perModel === 'object' && !Array.isArray(perModel)) {
      for (const [name, entry] of Object.entries(perModel)) {
        const v = entry && typeof entry === 'object' ? entry.autoCompactWindow : undefined;
        if (!isAutoCompactWindowValue(v)) continue;
        const key = canonicalModelKey(name);
        // Правописание ключа модели каноничное выигрывает у другого написания.
        if (name === key || !own[key]) own[key] = v;
      }
      if (isAutoCompactWindowValue(settings.autoCompactWindow)) {
        fallback = settings.autoCompactWindow;
        byModel = own; // top-level запись файла убирает per-model записи нижних файлов
      } else {
        byModel = { ...byModel, ...own };
      }
    } else if (isAutoCompactWindowValue(settings.autoCompactWindow)) {
      fallback = settings.autoCompactWindow;
      byModel = own;
    } else {
      byModel = { ...byModel, ...own };
    }
  }
  const key = canonicalModelKey(modelId);
  const value = key && Object.hasOwn(byModel, key) ? byModel[key] : fallback;
  return Number.isInteger(value) ? value : null;
}

function autoCompactThreshold(size, env = process.env, modelId = '') {
  if (!(size > 0)) return null;
  if (env.DISABLE_AUTO_COMPACT) return size;
  const envWindow = parseInt(env.CLAUDE_CODE_AUTO_COMPACT_WINDOW, 10);
  let window = size;
  if (envWindow > 0) {
    window = Math.min(Math.max(envWindow, 100_000), 1_000_000, size);
  } else {
    const setting = readAutoCompactWindowSetting(
      input?.workspace?.current_dir ?? input?.cwd ?? '', env, modelId);
    if (setting) window = Math.min(setting, size);
  }
  const effective = window - 20_000; // резерв вывода модели (gsd-statusline.js:401)
  let threshold = effective - 13_000; // буфер summary auto-compact (#4985)
  const pct = parseFloat(env.CLAUDE_AUTOCOMPACT_PCT_OVERRIDE);
  if (Number.isFinite(pct) && pct > 0 && pct <= 100) {
    threshold = Math.min(threshold, Math.floor(effective * (pct / 100)));
  }
  return threshold > 0 ? threshold : null;
}

try {
  const session = String(input?.session_id || '');
  const usage = input?.context_window?.current_usage;
  let usedTokens = null;
  if (usage && typeof usage === 'object') {
    usedTokens = (Number(usage.input_tokens) || 0) +
      (Number(usage.cache_creation_input_tokens) || 0) +
      (Number(usage.cache_read_input_tokens) || 0);
  } else if (typeof input?.context_window?.remaining_percentage === 'number' && ctxSize > 0) {
    usedTokens = Math.round(((100 - input.context_window.remaining_percentage) * ctxSize) / 100);
  }
  const threshold = usedTokens === null
    ? null
    : autoCompactThreshold(Number(ctxSize), process.env, input?.model?.id);
  // Guard как в gsd-statusline: session_id с разделителями пути не пишет вне tmp.
  if (session && !/[/\\]|\.\./.test(session) && Number(ctxSize) > 0 && threshold > 0) {
    const used = Math.max(0, Math.min(100, Math.round((usedTokens / threshold) * 100)));
    writeFileSync(
      path.join(tmpdir(), `claude-ctx-${session}.json`),
      JSON.stringify({
        session_id: session,
        remaining_percentage: 100 - used,
        used_pct: used,
        used_tokens: usedTokens,
        threshold_tokens: threshold,
        timestamp: Math.floor(Date.now() / 1000),
      }),
    );
  }
} catch { /* бридж best-effort — молча */ }

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