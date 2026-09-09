// ==UserScript==
// @name         GainUp -> Конструктор ценников
// @namespace    http://tampermonkey.net/
// @version      1.1
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

    // 1. Находим именно таблицу чека (содержащую "Наименование", "Цена" и "Кол-во")
    // Это исключает сканирование календаря дат и других таблиц на странице
    const allTables = Array.from(document.querySelectorAll('table, .cart-table, .sales-table, [class*="table"]'));
    let cartContainer = allTables.find(t => {
      const txt = t.textContent.toLowerCase();
      return txt.includes('наименование') && txt.includes('цена') && (txt.includes('кол-во') || txt.includes('итог'));
    });

    // Если контейнер по селектору не найден, ищем родителя заголовка "Наименование"
    if (!cartContainer) {
      const thName = Array.from(document.querySelectorAll('th, td, div')).find(el => 
        el.children.length === 0 && el.textContent.trim().toLowerCase() === 'наименование'
      );
      if (thName) {
        cartContainer = thName.closest('table') || thName.closest('.cart-table') || thName.parentElement?.parentElement;
      }
    }

    // Ищем строки только внутри таблицы чека
    const scope = cartContainer || document;
    const rows = Array.from(scope.querySelectorAll('tr, .cart-row, .order-item'));

    for (const row of rows) {
      const cells = Array.from(row.querySelectorAll('td, .cell, [class*="col"]'));
      if (cells.length < 2) continue;

      // Пропускаем строку заголовков таблицы
      const rowText = row.textContent.trim().toLowerCase();
      if (rowText.includes('наименование') && rowText.includes('цена')) continue;

      // Признаки настоящей строки товара в чеке:
      // В ней должны быть элементы управления количеством (- / +) или кнопка удаления (✕ / X)
      const hasQtyButtons = (row.textContent.includes('-') && row.textContent.includes('+')) ||
                            !!row.querySelector('button, [class*="minus"], [class*="plus"]');
      const hasDeleteBtn = row.textContent.includes('✕') || row.textContent.includes('X') ||
                           !!row.querySelector('.fa-times, .close, [class*="delete"], [class*="remove"]');

      if (!hasQtyButtons && !hasDeleteBtn && cells.length < 5) {
        continue;
      }

      // Определяем ячейку с названием и ячейку с ценой
      let nameCell = null;
      let priceCell = null;

      // В стандартной таблице GainUp:
      // cells[0] - иконка информации (i)
      // cells[1] - Наименование
      // cells[2] - Цена
      if (cells.length >= 3) {
        const firstText = cells[0].innerText.trim().toLowerCase();
        if (firstText === 'i' || firstText === '' || cells[0].querySelector('.info, i, svg')) {
          nameCell = cells[1];
          priceCell = cells[2];
        } else {
          nameCell = cells[0];
          priceCell = cells[1];
        }
      } else if (cells.length === 2) {
        nameCell = cells[0];
        priceCell = cells[1];
      }

      if (nameCell && priceCell) {
        // Убираем иконку "i", если она прилипла, и схлопываем переносы строк в одну аккуратную строку
        let title = nameCell.innerText
          .replace(/^i\s*/i, '')
          .replace(/\s+/g, ' ')
          .trim();

        // Очищаем цену (оставляем только цифры и запятую/точку)
        let price = priceCell.innerText.replace(/[^\d.,]/g, '').trim();

        // === ФИЛЬТРЫ ОТ МУСОРА И КАЛЕНДАРЕЙ ===
        // 1. Товар обязательно должен содержать русские или английские буквы (исключает даты календаря)
        if (!/[а-яёa-z]/i.test(title)) {
          continue;
        }

        // 2. Исключаем служебные системные слова
        const lower = title.toLowerCase();
        if (lower.startsWith('итог') || lower.startsWith('стоимость') || lower.startsWith('скидка') || lower === 'принято' || lower === 'сдача') {
          continue;
        }

        // 3. Пропуск пакетов (если включена опция IGNORE_BAGS)
        if (IGNORE_BAGS && /пакет\b/i.test(title)) {
          continue;
        }

        if (title && price) {
          items.push({ title, price });
        }
      }
    }

    return items;
  }

  // Действие по кнопке: парсинг и копирование
  function copyCartToClipboard() {
    const items = parseGainupCart();

    if (!items || items.length === 0) {
      showToast('⚠️ Товары в чеке не найдены', '#f59e0b');
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
