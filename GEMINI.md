# Контекст существующего проекта: Печать ценников и воблеров

Этот документ содержит ключевые правила, архитектурные соглашения и форматы данных репозитория. Он обязателен к учету при любых будущих доработках, чтобы не нарушать существующий стиль, функциональность и обратную совместимость.

---

## 1. Зафиксированный стек (НЕ МЕНЯТЬ)

- **Фреймворк и сборщик:** Чистый Client-Side Vanilla Web (**HTML5, CSS3, Vanilla JavaScript ES6+**).
  - Сборщики отсутствуют (**БЕЗ Vite, Webpack, Rollup, Babel**).
  - Node.js и npm в проекте **НЕ используются** (нет `package.json` и `node_modules`).
  - Приложение должно запускаться локально открытием `index.html` напрямую через `file://` (двойным кликом в проводнике), а также на любых статических серверах (GitHub Pages, Nginx и др.).
- **Стилизация:** Нативный **Vanilla CSS** (`style.css`), CSS Custom Properties (`:root`), Flexbox, CSS Grid, медиа-запросы печати `@media print`.
  - Сторонние CSS-фреймворки (Tailwind CSS, Bootstrap и др.) **НЕ используются**.
  - Шрифты: Google Fonts (Montserrat, Bebas Neue, Inter, Caveat, Roboto, Oswald, Russo One и др.).
- **Библиотека иконок / UI:** 
  - Нативные системные Emoji (🏷️, 🖨️, 📝, 📥, 💾, ⚙️, 👁️ и т.д.).
  - Кастомные модальные окна, сайдбар и выдвижные шторки на нативном HTML/CSS/JS.
  - Библиотеки иконок (Lucide, FontAwesome) и UI-киты (shadcn, Material UI) **НЕ используются**.
- **Работа со штрихкодами/данными:**
  - **Штрихкоды:** Библиотеки генерации штрихкодов/QR-кодов **отсутствуют**. Ценники формируются на основе текстовой информации, цен, веса/фасовки и декоративных плашек.
  - **Печать:** Нативный диалог печати `window.print()` с контейнером `#printArea`, правилами `@media print`, расчетом сетки `calcA4Grid` и метками реза.
  - **Экспорт в PDF:** Локально подключенная библиотека `html2pdf.bundle.min.js` (html2canvas + jsPDF) для формирования офлайн A4 PDF с предварительным инлайнингом картинок в Base64 (`inlineAllBackgroundImages`).
  - **Хранилище данных:** `localStorage` (`wobbler_session_v1`, `wobbler_custom_templates_gas`) + `IndexedDB` (`wobbler_extra_bg_db` для пользовательских фонов).
  - **Вспомогательные утилиты:** `gen_bg_index.py` (Python 3) для индексации изображений каталога `bg other/` в `bg_index.json`.

> [!IMPORTANT]
> **Правило:** Не предлагать и не устанавливать альтернативные библиотеки, сборщики (npm, Vite, Webpack) или фреймворки (React, Vue, Tailwind) для задач, которые уже закрыты текущим нативным стеком.

---

## 2. Структура директорий

```
wobbler_designer/
├── index.html                           # Главная разметка: шапка, сайдбар, шторка товаров, модалки, превью, печатная зона
├── style.css                            # Все стили: дизайн-токены (:root), темы, декор-блоки, адаптивность, @media print
├── script.js                            # Основной монолитный контроллер (~8.7k строк): состояние, шаблоны, печать, события
├── html2pdf.bundle.min.js               # Офлайн-библиотека экспорта в PDF (html2canvas + jsPDF)
├── gen_bg_index.py                      # Python-генератор индекса фонов из папки «images»
├── bg_index.json                        # Индекс фонов для работы по HTTP-протоколу (папка images)
├── instruction.html                     # Встроенное автономное руководство пользователя
├── Инструкция_Конструктор_Ценников.pdf  # PDF-версия руководства
├── fonts/                               # Локальные шрифты (при наличии)
└── images/                              # Все фоновые изображения (базовые и дополнительные)
```

- **Расположение шаблонов ценников:**
  - **Встроенные шаблоны (`builtInPresets`):** Описаны непосредственно в [script.js](file:///c:/Users/icich/.gemini/antigravity/scratch/wobbler_designer/script.js) внутри объекта `builtInPresets`. Ключи пресетов (`TEMPLATE_KEYS`): `alaska_dots`, `yellow_tag`, `ryba`, `sneki`, `sneki_5`, `sneki_digit`, `novy_vkus`, `novinka`, `tomat`, `sladko`, `sort_nedeli`, `korona_a5`, `a5`.
  - **Пользовательские шаблоны (`customTemplates`):** Сохраняются в массиве в `localStorage` по ключу `wobbler_custom_templates_gas`.

> [!IMPORTANT]
> **Правило:** Новые модули, стили и шаблоны ценников размещать строго в соответствии с этой структурой (внутри `index.html`, `style.css` и `script.js`), без создания отдельных ES-модулей.

---

## 3. Принятые соглашения по коду

- **Стиль кода:**
  - Нативный **Vanilla JavaScript ES6+**, обёрнутый в единый обработчик `document.addEventListener('DOMContentLoaded', () => { ... })`.
  - **DOM Sync и Single Source of Truth:** Поля ввода в DOM — это проекция состояния. При любых изменениях обновляется модель и вызывается `updatePreview()`.
  - **Двухуровневая модель оформления (Шаблон vs Ценник):**
    - Настройки уровня шаблона: `templateFonts`, `templateDecor`, `templateBg`.
    - Индивидуальные настройки ценника: `itemsData[i].fontsCustomized`, `itemsData[i].decorCustomized`, `itemsData[i].bgCustomized`.
    - Разрешение свойств всегда происходит через резолверы: `fontOf(item, field, fallback)`, `decorOf(...)`, `bgOf(...)`, `resolveItemField(...)`.
    - Режимы применения (`fontApplyMode`, `decorApplyMode`, `bgApplyMode`): `'item'` (правка активного ценника) или `'template'` (правка всего шаблона).
  - **Snapshot-паттерн:** Синхронизация между формами и моделями через пары функций: `readFontSnapshotFromInputs()` / `writeFontSnapshotToInputs(snap)` и аналогичные для `Decor` и `Bg`.
  - **Дебаунсинг персистентности:** Автосохранение сессии в `localStorage` (`scheduleSessionSave`) вызывается с задержкой 600 мс после правок.
- **Форматирование и именование:**
  - Функции и переменные: `camelCase` (например: `calcA4Grid`, `applyState`, `getCurrentState`, `isMultiModeNow`, `freshItem`).
  - Константы: `UPPER_SNAKE_CASE` (например: `TEMPLATE_KEYS`, `SESSION_KEY`, `MAX_ITEMS`, `FONT_FIELDS`).
  - HTML ID и CSS-классы: `kebab-case` (например: `wobbler-preview`, `items-drawer`, `control-card`, `btn-primary`, `print-page`).
- **Импорты:**
  - Использование ES-модулей (`import` / `export`) **СТРОГО ЗАПРЕЩЕНО**, так как локальное открытие через `file://` блокирует их политикой CORS.
  - Внешние библиотеки подключаются только тегом `<script src="...">` в `index.html` и используются через глобальные объекты (`window.html2pdf`).

---

## 4. Границы изменений (Safety Rules)

- **Инкрементальность:** Не переписывать существующие монолитные файлы целиком, если задача требует точечной доработки. Дополнять существующие функции или аккуратно расширять их в `script.js`, `index.html` и `style.css`.
- **Обратная совместимость:** Если меняется структура данных ценника (`Item`) или шаблона (`Preset`/`State`), обязательно сохранять совместимость со старыми сохраненными сессиями (`wobbler_session_v1`) и экспортированными JSON-файлами шаблонов через fallback-значения по умолчанию в `readSession()` и `applyState()`.
- **Печать:** Любые доработки шаблонов ценников должны проверять сохранение верстки в окне `window.print()` (контейнер `#printArea`, класс `.print-page`, расчет сетки `calcA4Grid`, отступы и зазоры `gapMm()`), а также корректность экспорта в PDF через `html2pdf.bundle.min.js`.
- **Сохранение двухуровневой логики:** При добавлении любых новых параметров шрифтов, цветов, декора или фона обязательно интегрировать их в функции `fontOf`/`decorOf`/`bgOf`, методы снапшотов и режимы применения `'item'` / `'template'`.

---

## 5. Структуры данных

### 5.1. Модель единицы товара (`Item`)
```javascript
{
  title: string,              // Наименование товара
  price: string,              // Цена (текст / число)
  subtitle: string,           // Вес, фасовка, доп. текст (напр., "0,45 ж/б")
  subtitleManual: boolean,    // Защита от перезаписи автоматическим парсером Excel
  digit: string,              // Цифра для шаблона снеков с номером (sneki_digit)
  labelPos?: {                // Индивидуальные смещения блоков в мм/px
    title: { x, y },
    subtitle: { x, y },
    price: { x, y },
    priceDigits: { x, y },
    currency: { x, y }
  },
  // Per-item оверрайды шрифтов:
  fontsCustomized?: boolean,
  fonts?: {
    titleFont, titleColor, titleSize, titleWeight, titleItalic, titleAlign, titleOffsetY, titleShadow,
    subtitleColor, subtitleSize, subtitleWeight, subtitleAlign,
    priceFont, priceColor, priceSize, priceWeight, priceAlign, priceOffsetY, priceShadow,
    currency, priceCross, priceCrossColor, priceCrossWidth
  },
  // Per-item оверрайды декор-блоков (outside, inside, bottom):
  decorCustomized?: boolean,
  decor?: {
    outsideShow, outsideText, outsideBg, outsideBgImg, outsideCustomBg, outsideColor, outsideFont, outsideItalic, outsideShadow, outsideFontSize, outsideHeight,
    insideShow, insideText, insideBg, insideBgImg, insideCustomBg, insideColor, insideFont, insideItalic, insideShadow, insideFontSize, insideHeight, insideWidth,
    bottomShow, bottomText, bottomBg, bottomBgImg, bottomCustomBg, bottomColor, bottomFont, bottomItalic, bottomShadow, bottomFontSize, bottomHeight
  },
  // Per-item оверрайд фона:
  bgCustomized?: boolean,
  bg?: {
    headerBg, bgImage, customBgData
  }
}
```

### 5.2. Модель шаблона (`Preset` / `State`)
Возвращается `getCurrentState()` и восстанавливается через `applyState(state)`:
```javascript
{
  widthCm: number, heightCm: number,
  title: string, subtitle: string,
  titleFont: string, titleColor: string, titleSize: number, titleWeight: string, titleItalic: boolean, titleAlign: string, titleOffsetY: number, titleShadow: string,
  subtitleColor: string, subtitleSize: number, subtitleWeight: string, subtitleAlign: string,
  showPrice: boolean, priceFont: string, priceSize: number, priceWeight: string, priceColor: string, priceAlign: string, priceOffsetY: number, priceShadow: string,
  priceCross: boolean, priceCrossColor: string, priceCrossWidth: number,
  price: string, currency: string,
  digit: string, digitFont: string, digitColor: string, digitSize: number, digitWeight: string,
  headerBg: string, bgImage: string, customBgData: string | null, headerHeight: number,
  titleSafe: { left, right, top, bottom },
  layout: string, borderMm: number, layerRotate: number,
  priceInBottom: boolean, subtitleCorner: boolean, pricePlate: boolean,
  decorOutsideShow: boolean, decorOutsideText: string, decorOutsideBg: string, ...
  decorInsideShow: boolean, decorInsideText: string, ...
  decorBottomShow: boolean, decorBottomText: string, ...
  decorBlockPos: string,
  printGapMm: number,
  labelPos: { ... }
}
```

### 5.3. Модель сессии в `localStorage` (`wobbler_session_v1`)
```javascript
{
  app: 'wobbler_designer_session',
  version: 1,
  savedAt: string,            // ISO timestamp
  printMode: 'single' | 'multi',
  activeTemplate: { kind: 'builtin', key: string } | { kind: 'custom', index: number },
  activeItemsKey: string,
  state: Preset,              // Состояние активного шаблона
  items: {                    // Таблицы товаров по всем шаблонам
    [templateKey: string]: Item[]
  }
}
```
