// ==UserScript==
// @name         GainUp -> Конструктор ценников
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  Парсинг набитых товаров из кассы GainUp в программу печати ценников
// @match        *://*.gainup.ru/mp/retail/sales*
// @grant        GM_setClipboard
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  // НАСТРОЙКИ:
  // Игнорировать ли пакеты (true - пропускать пакеты, false - добавлять в ценники)
  const IGNORE_BAGS = true;

  // Извлечение товаров из таблицы чека GainUp
  function parseGainupCart() {
    const items = [];

    // Ищем все строки таблицы чека на странице
    const rows = Array.from(document.querySelectorAll('tr, .cart-row, .order-item, tbody tr'));

    for (const row of rows) {
      // Игнорируем календарь выбора даты
      if (row.closest('.calendar, .datepicker, .flatpickr, [class*="calendar"], [class*="picker"]')) {
        continue;
      }

      const cells = Array.from(row.querySelectorAll('td, th, .cell, [class*="col"]'));
      if (cells.length < 2) continue;

      const rowText = row.textContent.trim().toLowerCase();
      // Пропускаем строку заголовков
      if (rowText.includes('наименование') && rowText.includes('цена')) continue;

      let nameCell = null;
      let priceCell = null;

      // 1. Умный поиск ячейки названия и цены по содержимому ячеек
      for (let i = 0; i < cells.length; i++) {
        const text = cells[i].innerText.replace(/\s+/g, ' ').trim();

        // Наименование: содержит буквы, длина > 2, не кнопка количества +/-
        if (!nameCell && /[а-яёa-z]/i.test(text) && text.length > 2 && !text.includes('+') && !text.includes('-')) {
          const lower = text.toLowerCase();
          if (lower !== 'наименование' && !lower.startsWith('итог') && !lower.startsWith('стоимость') && !lower.startsWith('скидка')) {
            nameCell = cells[i];
            continue;
          }
        }

        // Цена: первое числовое значение после названия
        if (nameCell && !priceCell) {
          const clean = text.replace(/[^\d.,]/g, '').trim();
          if (clean && /^\d+([.,]\d+)?$/.test(clean)) {
            priceCell = cells[i];
            break;
          }
        }
      }

      // 2. Запасной fallback по позициям колонок
      if (!nameCell && cells.length >= 2) {
        if (/[а-яёa-z]/i.test(cells[0].innerText)) {
          nameCell = cells[0];
          priceCell = cells[1];
        } else if (cells.length >= 3 && /[а-яёa-z]/i.test(cells[1].innerText)) {
          nameCell = cells[1];
          priceCell = cells[2];
        }
      }

      if (nameCell && priceCell) {
        // Убираем иконку "i", если она прилипла к названию, и склеиваем многострочный перенос
        let title = nameCell.innerText
          .replace(/^i\s*/i, '')
          .replace(/\s+/g, ' ')
          .trim();

        let price = priceCell.innerText.replace(/[^\d.,]/g, '').trim();

        // ФИЛЬТРЫ:
        // 1. В названии обязательно должны быть буквы (отсекает даты календаря 31, 7, 14...)
        if (!/[а-яёa-z]/i.test(title)) continue;

        // 2. Исключаем системные и служебные строки
        const lower = title.toLowerCase();
        if (lower.startsWith('итог') || lower.startsWith('стоимость') || lower.startsWith('скидка') || lower === 'принято' || lower === 'сдача') {
          continue;
        }

        // 3. Пропуск пакетов (если включена опция IGNORE_BAGS)
        if (IGNORE_BAGS && /пакет\b/i.test(title)) continue;

        if (title && price) {
          items.push({ title, price });
        }
      }
    }

    console.log('[GainUp-Wobbler] Найдено товаров:', items.length, items);
    return items;
  }

  // Действие по кнопке: парсинг и копирование
  function copyCartToClipboard() {
    const items = parseGainupCart();

    if (!items || items.length === 0) {
      showToast('⚠️ Товары в чеке не найдены. Убедитесь, что в чеке есть позиции', '#f59e0b');
      return;
    }

    // Формируем формат для вставки: Название \t Цена
    const tsvText = items.map(it => `${it.title}\t${it.price}`).join('\n');

    // Копируем в буфер обмена
    if (typeof GM_setClipboard === 'function') {
      GM_setClipboard(tsvText);
    } else {
      navigator.clipboard.writeText(tsvText);
    }

    // Показываем уведомление на экране кассы
    showToast(`🏷️ Скопировано товаров: ${items.length}! Перейдите в Конструктор и нажмите Ctrl+V`, '#10b981');
  }

  // Всплывающее уведомление на экране кассы
  function showToast(message, bgColor = '#10b981') {
    let toast = document.getElementById('gainup-wobbler-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'gainup-wobbler-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      top: 24px;
      right: 24px;
      background: ${bgColor};
      color: #ffffff;
      padding: 14px 22px;
      border-radius: 12px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 15px;
      font-weight: 700;
      z-index: 9999999;
      box-shadow: 0 10px 25px rgba(0,0,0,0.3);
      transition: all 0.3s ease;
      display: block;
      pointer-events: none;
    `;
    clearTimeout(window.__gainupToastTimer);
    window.__gainupToastTimer = setTimeout(() => {
      if (toast) toast.style.display = 'none';
    }, 3500);
  }

  // Встраивание кнопки в интерфейс GainUp
  function injectButton() {
    if (document.getElementById('gainup-to-wobbler-btn')) return;

    const btn = document.createElement('button');
    btn.id = 'gainup-to-wobbler-btn';
    btn.type = 'button';
    btn.innerHTML = '🏷️ В ценники <span style="font-size:11px;opacity:0.8;font-weight:normal;">(F4)</span>';
    btn.style.cssText = `
      background: linear-gradient(135deg, #2563eb, #1d4ed8);
      color: #ffffff;
      border: 1px solid #1e40af;
      border-radius: 8px;
      padding: 8px 16px;
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
      transition: transform 0.1s ease, background 0.2s ease;
      user-select: none;
    `;

    btn.addEventListener('mouseenter', () => btn.style.transform = 'translateY(-1px)');
    btn.addEventListener('mouseleave', () => btn.style.transform = 'translateY(0)');
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      copyCartToClipboard();
    });

    // Встраиваем в верхнюю панель к "Реквизиты смены", "ЕГАИС", "ЭДО"
    const topNav = document.querySelector('.header, .top-bar, .navbar, .header-buttons') ||
                   Array.from(document.querySelectorAll('div')).find(d => 
                     d.children.length >= 2 && Array.from(d.children).some(c => c.textContent.includes('ЭДО') || c.textContent.includes('ЕГАИС'))
                   );

    if (topNav) {
      btn.style.marginLeft = '16px';
      topNav.appendChild(btn);
    } else {
      btn.style.position = 'fixed';
      btn.style.top = '12px';
      btn.style.right = '70px';
      btn.style.zIndex = '999999';
      document.body.appendChild(btn);
    }
  }

  // Горячая клавиша F4
  window.addEventListener('keydown', (e) => {
    if (e.key === 'F4') {
      e.preventDefault();
      copyCartToClipboard();
    }
  });

  setInterval(injectButton, 1000);
})();
