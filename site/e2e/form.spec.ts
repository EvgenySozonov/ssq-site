import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";

/**
 * E2E-контракт формы заявок (test-first, красные до реализации).
 * Источник требований: docs/architecture.md «Форма и заявки»,
 * docs/specs/ssq-site-stack-design.md §6.1, qa.md раздел «Форма» (пп. 1–3 клиентские).
 *
 * Контекст: страница /contacts/, POST на cgi-bin/contact.py с JSON.
 * Серверная логика (honeypot-успех, rate-limit, доставка в Telegram) здесь не
 * проверяется — это контракт cgi-bin/contact.py.
 *
 * Решения спецификации (мои пометки для реализации формы):
 * - селекторы по accessible-именам: label /имя|телефон|коммент/i, чекбокс
 *   /соглас|обработку/i, кнопка /отправ|заявк/i — тексты лейблов это часть контракта;
 * - подсветка ошибок поля = атрибут aria-invalid="true" (a11y-корректно и тестируемо);
 * - форма обёрнута в <form> ( honeypot и ссылки ищутся внутри неё);
 * - подтверждение успеха — элемент role="status" или aria-live="polite".
 */

const FORM_URL = "/contacts/";
const SUBMIT_PATH = "/cgi-bin/contact.py";

const VALID = {
  name: "Иван Тестов",
  phone: "+7 (999) 123-45-67",
  comment: "Нужен расчёт смарт-дома",
};
const VALID_PHONE_FORMATS = ["+7 (999) 123-45-67", "+79991234567", "8 999 123-45-67"];
const INVALID_PHONE_FORMATS = ["123", "abc", "+7 999 12", "9991234567"];

/** Шпион-мок эндпоинта формы: собирает POST-запросы, отвечает success-моком (или заданным). */
function spyContactEndpoint(page: Page, response?: { status?: number; body?: object }) {
  const requests: { url: string; json: Record<string, unknown>; text: string }[] = [];
  page.route(`**${SUBMIT_PATH}*`, async (route) => {
    const req = route.request();
    const text = req.postData() ?? "";
    requests.push({ url: req.url(), json: req.postDataJSON(), text });
    await route.fulfill({
      status: response?.status ?? 200,
      contentType: "application/json",
      body: JSON.stringify(response?.body ?? { ok: true }),
    });
  });
  return requests;
}

async function fillForm(
  page: Page,
  data: { name?: string; phone?: string; comment?: string },
  agree = true,
) {
  if (data.name !== undefined) await page.getByLabel(/имя/i).fill(data.name);
  if (data.phone !== undefined) await page.getByLabel(/телефон/i).fill(data.phone);
  if (data.comment !== undefined) await page.getByLabel(/коммент/i).fill(data.comment);
  const consent = page.getByRole("checkbox", { name: /соглас|обработку/i });
  if ((await consent.isChecked()) !== agree) await consent.click(); // привести к целевому состоянию
}

async function submit(page: Page) {
  await page.getByRole("button", { name: /отправ|заявк/i }).click();
}

// ─── Структура и honeypot ───────────────────────────────────────────────────

test.describe("форма заявки: структура", () => {
  test("на странице /contacts/ есть поля имя, телефон, комментарий и чекбокс согласия", async ({
    page,
  }) => {
    await page.goto(FORM_URL);
    await expect(page.getByLabel(/имя/i)).toBeVisible();
    await expect(page.getByLabel(/телефон/i)).toBeVisible();
    await expect(page.getByLabel(/коммент/i)).toBeVisible();
    await expect(page.getByRole("checkbox", { name: /соглас|обработку/i })).toBeVisible();
  });

  test("чекбокс согласия ссылается на /legal/privacy/", async ({ page }) => {
    await page.goto(FORM_URL);
    const link = page.locator("form").getByRole("link", { name: /политик|приват/i });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute("href", /legal\/privacy/);
  });

  test("honeypot website скрыт от человека и пуст, но присутствует в DOM", async ({ page }) => {
    await page.goto(FORM_URL);
    const honeypot = page.locator('form input[name="website"]');
    await expect(honeypot).toBeAttached();
    await expect(honeypot).toBeHidden();
    await expect(honeypot).toHaveValue("");
  });
});

// ─── Клиентская валидация (qa.md пп. 1, 3: пустые обязательные, чекбокс) ────

test.describe("форма заявки: клиентская валидация", () => {
  test("пустая отправка подсвечивает обязательные поля, запрос не отправляется", async ({
    page,
  }) => {
    await page.goto(FORM_URL);
    const requests = spyContactEndpoint(page);
    await submit(page);
    await expect(page.getByText(/обязательн|заполните|ошиб/i).first()).toBeVisible();
    await expect(page.getByLabel(/имя/i)).toHaveAttribute("aria-invalid", "true");
    await expect(page.getByLabel(/телефон/i)).toHaveAttribute("aria-invalid", "true");
    expect(requests).toHaveLength(0);
  });

  test("некорректный телефон блокирует отправку и подсвечивает поле", async ({ page }) => {
    await page.goto(FORM_URL);
    const requests = spyContactEndpoint(page);
    for (const phone of INVALID_PHONE_FORMATS) {
      await fillForm(page, { name: VALID.name, phone });
      await submit(page);
      await expect(page.getByText(/неверн|некорректн|ошиб/i).first()).toBeVisible();
      await expect(page.getByLabel(/телефон/i)).toHaveAttribute("aria-invalid", "true");
    }
    expect(requests).toHaveLength(0);
  });

  test("валидные форматы телефона проходят клиентскую валидацию и уходят POST'ом", async ({
    page,
  }) => {
    await page.goto(FORM_URL);
    const requests = spyContactEndpoint(page);
    for (const [i, phone] of VALID_PHONE_FORMATS.entries()) {
      await fillForm(page, { name: VALID.name, phone });
      await submit(page);
      // Каждый валидный формат доходит до эндпоинта, honeypot в теле пуст.
      await expect.poll(() => requests.length).toBe(i + 1);
      expect(requests[i].text).toContain("999");
      expect(requests[i].json.website ?? "").toBe("");
      if (i < VALID_PHONE_FORMATS.length - 1) await page.reload(); // чистое состояние перед следующим форматом
    }
  });

  test("без чекбокса согласия отправка блокируется", async ({ page }) => {
    await page.goto(FORM_URL);
    const requests = spyContactEndpoint(page);
    await fillForm(page, { name: VALID.name, phone: VALID.phone }, false);
    await submit(page);
    await expect(page.getByText(/соглас|обработк|ошиб/i).first()).toBeVisible();
    expect(requests).toHaveLength(0);
  });

  test("подсветка ошибок снимается, когда поля заполнены валидно", async ({ page }) => {
    await page.goto(FORM_URL);
    spyContactEndpoint(page);
    await submit(page); // пустая отправка → ошибки на обоих полях
    await expect(page.getByLabel(/имя/i)).toHaveAttribute("aria-invalid", "true");
    await fillForm(page, { name: VALID.name, phone: VALID.phone });
    await expect(page.getByLabel(/имя/i)).not.toHaveAttribute("aria-invalid", "true");
    await expect(page.getByLabel(/телефон/i)).not.toHaveAttribute("aria-invalid", "true");
  });
});

// ─── Отправка и состояния формы (qa.md пп. 2, 6 — клиентская часть) ─────────

test.describe("форма заявки: отправка", () => {
  test("валидная отправка уходит как JSON со всеми полями", async ({ page }) => {
    await page.goto(FORM_URL);
    const requests = spyContactEndpoint(page);
    await fillForm(page, VALID);
    await submit(page);
    await expect.poll(() => requests.length).toBe(1);
    const body = requests[0].json;
    expect(requests[0].url).toContain(SUBMIT_PATH);
    expect(body.name).toBe(VALID.name);
    expect(String(body.phone)).toContain("999");
    expect(body.website ?? "").toBe("");
  });

  test("успех: форма сбрасывается, подтверждение видно (state ok)", async ({ page }) => {
    await page.goto(FORM_URL);
    spyContactEndpoint(page); // мок ok:true
    await fillForm(page, VALID);
    await submit(page);
    await expect.poll(async () => (await page.getByLabel(/имя/i).inputValue()).length).toBe(0);
    await expect(page.getByLabel(/телефон/i)).toHaveValue("");
    await expect(
      page.getByRole("status").or(page.locator("[aria-live=polite]")).first(),
    ).toBeVisible();
  });

  test("ошибка валидации сервера (400): текст ошибки и телефон-фоллбек видны", async ({ page }) => {
    await page.goto(FORM_URL);
    spyContactEndpoint(page, {
      status: 400,
      body: { ok: false, error: "Проверьте номер телефона" },
    });
    await fillForm(page, VALID);
    await submit(page);
    await expect(page.getByText(/Проверьте номер телефона/i)).toBeVisible();
    const tel = page.locator('a[href^="tel:"]');
    await expect(tel.first()).toBeVisible();
  });

  test("недоступный эндпоинт: пользователь видит ошибку и телефон, не «тихую потерю»", async ({
    page,
  }) => {
    await page.goto(FORM_URL);
    await page.route(`**${SUBMIT_PATH}*`, (route) => route.abort());
    await fillForm(page, VALID);
    await submit(page);
    await expect(
      page.getByText(/ошиб|не удал|попробуйте|позвоните|напишите/i).first(),
    ).toBeVisible();
    const tel = page.locator('a[href^="tel:"]');
    await expect(tel.first()).toBeVisible();
    await expect(page.locator("form button[type=submit]")).toBeEnabled();
  });
});
