---
phase: "1"
slug: "dannye-i-karkas-uslug"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-10-29"
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 5 (Wave 0 install; `getViteConfig()` поверх Astro), Playwright 1.64 (есть), Python unittest (есть) |
| **Config file** | `site/vitest.config.ts` — Wave 0 создаёт |
| **Quick run command** | `cd site && npm test` |
| **Full suite command** | `cd site && npm test && npm run lint && npm run check && npm run build` |
| **Estimated runtime** | ~15 seconds (vitest ~5s + lint/check/build ~10s) |

---

## Sampling Rate

- **After every task commit:** Run `cd site && npm test`
- **After every plan wave:** Run `cd site && npm test && npm run lint && npm run check && npm run build`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 20 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| {N}-01-01 | 01 | 0 | REQ-growth-extensibility | — | N/A | unit | `cd site && npm test` | ❌ W0 | ⬜ pending |
| {N}-01-02 | 01 | 1 | REQ-services-lines-hierarchy | — | N/A | unit+build | `cd site && npm test && npm run build` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*
*(финальная карта заполняется планировщиком по факту разбиения задач)*

---

## Wave 0 Requirements

- [ ] `site/package.json` — devDeps: vitest, zod пин 4.6.7; script `"test": "vitest run"`
- [ ] `site/vitest.config.ts` — `getViteConfig()` из astro, `environment: "node"`
- [ ] `site/src/lib/data.test.ts` — stub-тесты инвариантов REQ (slug kebab-case, уникальность, priceFrom:0 → «по смете»)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Тест добавляемости (строка в lines.json собирает раздел) | REQ-growth-extensibility | Гоняется единожды как приёмка каркаса; можно автоматизировать e2e-кроулингом позже | Добавить запись в `lines.json` → `npm run build` → открыть `/services/<slug>/` |
| Визуальная сетка «от … ₽» / «по смете» на посадочной | REQ-services-lines-hierarchy | Рендер-верждка дизайн-токенов | Открыть `/services/elektromontazh/`, проверить карточки по test-case.md шаг 1 |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 20s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending