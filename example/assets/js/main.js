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
    // Макет-заглушка: общий телефон-фолбэк для сообщений об ошибках формы
    var FALLBACK_PHONE = '+7 (000) 000-00-00';

    function clearError(input) {
      input.classList.remove('is-invalid');
      var label = input.closest('label');
      var msg = label && label.querySelector('.field-error');
      if (msg) msg.remove();
    }

    function setError(input, text) {
      clearError(input);
      input.classList.add('is-invalid');
      var msg = document.createElement('span');
      msg.className = 'field-error';
      msg.setAttribute('role', 'alert');
      msg.textContent = text;
      input.closest('label').appendChild(msg);
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      // Валидация обязательных полей: сообщение объясняет, что не так и что делать
      var required = form.querySelectorAll('input[required]');
      var firstInvalid = null;
      required.forEach(function (input) {
        if (!input.value.trim()) {
          if (input.type === 'tel') {
            setError(input, 'Укажите телефон — ответим сразу после заявки. Или позвоните: ' + FALLBACK_PHONE);
          } else {
            setError(input, 'Укажите имя — так мы поймём, как к вам обращаться.');
          }
          if (!firstInvalid) firstInvalid = input;
        } else {
          clearError(input);
        }
      });
      if (firstInvalid) {
        firstInvalid.focus();
        return;
      }

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

    // Ошибка снимается сразу, как пользователь начал исправлять
    form.addEventListener('input', function (e) {
      if (e.target.matches && e.target.matches('input')) clearError(e.target);
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