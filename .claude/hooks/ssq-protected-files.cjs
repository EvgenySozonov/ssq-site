#!/usr/bin/env node
// PreToolUse-хук: блокирует запись/правку защищённых файлов.
// stdin: JSON события (tool_name, tool_input.file_path | notebook_path).
// stdout: JSON permissionDecision deny / allow. Exit 0 всегда.

const input = JSON.parse(require('fs').readFileSync(0, 'utf8'));
const ti = input.tool_input || {};
const p = ti.file_path || ti.notebook_path || '';

const PROTECTED = [
  // .env и любые его варианты, кроме .env.example
  { re: /(^|\/)\.env(\..+)?$/, why: '.env не правится агентом (секреты); образец — .env.example' },
  // сам каталог .git
  { re: /(^|\/)\.git(\/|$)/, why: 'внутренности .git/ защищены' },
  // lock-файлы менеджеров зависимостей
  { re: /(^|\/)(package-lock\.json|npm-shrinkwrap\.json|yarn\.lock|pnpm-lock\.yaml)$/, why: 'lock-файл правится только установкой пакетов, не вручную' },
  { re: /\.(lock)$/, why: 'lock-файл правится только своим инструментом, не вручную' },
];

const hit =
  /(^|\/)\.env\.example$/.test(p) || /(^|\/)\.env\.sample$/.test(p)
    ? undefined
    : PROTECTED.find(({ re }) => re.test(p));
const result = hit
  ? {
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'deny',
        permissionDecisionReason: `Защищённый файл: ${p} — ${hit.why}`,
      },
    }
  : { hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'allow' } };

console.log(JSON.stringify({ hookEventName: input.hook_event_name, ...result.hookSpecificOutput }));