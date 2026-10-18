/* ============================================================
   Умный квадрат — интерактив
   ============================================================ */
(function () {
  'use strict';

  /* ---------- Полноэкранное меню ---------- */
  var overlay = document.getElementById('overlay-menu');
  var openBtn = document.getElementById('menu-open');
  var closeBtn = document.getElementById('menu-close');

  function setMenu(open) {
    if (!overlay) return;
    overlay.hidden = !open;
    if (openBtn) openBtn.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
    if (open && closeBtn) closeBtn.focus();
    if (!open && openBtn) openBtn.focus();
  }

  if (openBtn) openBtn.addEventListener('click', function () { setMenu(true); });
  if (closeBtn) closeBtn.addEventListener('click', function () { setMenu(false); });

  if (overlay) {
    // Закрытие по клику на пункт меню
    overlay.addEventListener('click', function (e) {
      if (e.target.closest('.overlay-menu__nav a')) setMenu(false);
    });
    // Закрытие по Escape
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !overlay.hidden) setMenu(false);
    });
  }

  /* ---------- Форма-заглушка (отправка не подключена) ---------- */
  var form = document.getElementById('lead-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      // Простая валидация обязательных полей
      var required = form.querySelectorAll('input[required]');
      var valid = true;
      required.forEach(function (input) {
        if (!input.value.trim()) {
          input.style.borderBottomColor = '#e0455c';
          valid = false;
        } else {
          input.style.borderBottomColor = '';
        }
      });
      if (!valid) return;

      form.reset();
      var note = document.getElementById('form-note');
      if (note) {
        note.textContent = 'Заявка зафиксирована локально (макет кнопки). Отправка на сервер будет подключена позже.';
        note.style.opacity = '1';
        setTimeout(function () {
          note.textContent = 'Нажимая кнопку, вы соглашаетесь на обработку персональных данных. Отправка данных сейчас не подключена — это макет.';
          note.style.opacity = '';
        }, 5000);
      }
    });
  }

  /* ---------- Появление блоков при скролле ---------- */
  var revealTargets = document.querySelectorAll(
    '.about__text, .about__photo, .case, .rows__item, .price, .quote, .faq__item'
  );
  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    revealTargets.forEach(function (el) {
      el.classList.add('reveal');
      observer.observe(el);
    });
  }
})();