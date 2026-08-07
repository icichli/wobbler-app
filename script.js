document.addEventListener('DOMContentLoaded', () => {
  // Device Mode Toggle Buttons
  const deviceAutoBtn = document.getElementById('deviceAutoBtn');
  const deviceMobileBtn = document.getElementById('deviceMobileBtn');
  const deviceDesktopBtn = document.getElementById('deviceDesktopBtn');

  // Mobile View Tabs
  const mobileTabBtns = document.querySelectorAll('.mobile-tab-btn');

  // Apply Device Layout Mode (auto, mobile, desktop)
  function setDeviceMode(mode) {
    document.body.classList.remove('mode-auto', 'force-mobile', 'force-desktop');
    document.querySelectorAll('.device-btn').forEach(b => b.classList.remove('active'));

    if (mode === 'mobile') {
      document.body.classList.add('force-mobile');
      if (deviceMobileBtn) deviceMobileBtn.classList.add('active');
    } else if (mode === 'desktop') {
      document.body.classList.add('force-desktop');
      if (deviceDesktopBtn) deviceDesktopBtn.classList.add('active');
    } else {
      document.body.classList.add('mode-auto');
      if (deviceAutoBtn) deviceAutoBtn.classList.add('active');
    }

    localStorage.setItem('wobbler_device_mode', mode);
  }

  function setMobileActiveTab(tabName) {
    document.body.classList.remove('view-preview', 'view-controls');
    document.body.classList.add(`view-${tabName}`);

    mobileTabBtns.forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-mobile-view') === tabName);
    });
  }

  if (deviceAutoBtn) deviceAutoBtn.addEventListener('click', () => setDeviceMode('auto'));
  if (deviceMobileBtn) deviceMobileBtn.addEventListener('click', () => setDeviceMode('mobile'));
  if (deviceDesktopBtn) deviceDesktopBtn.addEventListener('click', () => setDeviceMode('desktop'));

  mobileTabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const view = btn.getAttribute('data-mobile-view');
      setMobileActiveTab(view);
    });
  });

  // Sample Items from User's Excel Screenshot
  const initialExcelItems = [
    { title: 'Alaska Фейхоа 0,45 ж/б', price: '350' },
    { title: 'Alaska Мешаешь: Малина, маракуйя, манго 0,45 ж/б', price: '350' },
    { title: 'Alaska Мешаешь: Земляничный чизкейк 0,45 ж/б', price: '350' },
    { title: '', price: '' },
    { title: '', price: '' },
    { title: '', price: '' },
    { title: '', price: '' },
    { title: '', price: '' },
    { title: '', price: '' },
    { title: '', price: '' },
    { title: '', price: '' },
    { title: '', price: '' },
    { title: '', price: '' },
    { title: '', price: '' },
    { title: '', price: '' },
    { title: '', price: '' },
    { title: '', price: '' },
    { title: '', price: '' }
  ];

  // Per-template хранилище товаров в режиме «Разные товары».
  // Каждый встроенный пресет имеет СВОЙ массив товаров — ввод наименования,
  // цена и вес независимы по каждому шаблону. itemsData оставляем let-ссылкой на
  // активный массив; весь существующий код читает/пишет itemsData, поэтому при
  // смене шаблона достаточно перенаправить ссылку на templateItems[key].
  // Массив растёт прогрессивно: стартует с 1 пустой строки; при вводе в последнее
  // поле появляется следующая пустая (см. syncRowExtent / normalizeItemsArray).
  const MAX_ITEMS = 100; // мягкий защитный потолок (только для вставки больших таблиц)
  const TEMPLATE_KEYS = ['alaska_dots', 'yellow_tag', 'ryba', 'sneki', 'novy_vkus', 'novinka', 'tomat', 'sladko', 'sort_nedeli'];
  const templateItems = {};
  function freshItem() {
    return { title: '', price: '', subtitle: '', subtitleManual: false };
  }
  // Пуста ли строка: все три поля (наименование/вес/цена) не заполнены.
  function isItemEmpty(it) {
    return !it || (
      !(it.title || '').trim() &&
      !(it.subtitle || '').trim() &&
      !(it.price || '').trim()
    );
  }
  // Заполнена ли строка (введено ХОТЯ БЫ в одно из трёх полей) — для роста списка.
  function isItemFilled(it) { return !isItemEmpty(it); }
  function freshItems() {
    return [ freshItem() ]; // стартовая 1 пустая строка-«добавить»
  }
  TEMPLATE_KEYS.forEach(k => { templateItems[k] = freshItems(); });
  let itemsData = templateItems.alaska_dots;   // активный массив (старт — Бутылки)

  // Index of the item currently shown in the single preview (multi mode)
  let activePreviewIndex = 0;

  // === Per-item шрифты/цвета ===
  // templateFonts — источник истины для оформления всего шаблона (title/price/subtitle
  // шрифты/цвета/размеры/толщина/выравнивание/offset/валюта). Инпуты DOM — это только
  // UI активного контекста; логика рендера читает fontOf()/templateFonts, а не .value.
  // fontApplyMode: 'item' (правим выбранный ценник) | 'template' (правим весь шаблон).
  // В single-режиме всегда 'template'; сегмент переключателя скрыт.
  let fontApplyMode = 'item';
  let templateFonts = null;
  const fontApplyModeWrap = document.getElementById('fontApplyModeWrap');
  const resetItemFontsBtn = document.getElementById('resetItemFontsBtn');

  // === Per-item оформление (фон #4 + декор-блоки #5) ===
  // Зеркало шрифтовой модели: templateDecor — источник истины шаблона;
  // itemsData[i].decor + decorCustomized — per-item override ценника.
  // decorApplyMode: 'item' (выбранный ценник) | 'template' (весь шаблон).
  // В single-режиме всегда 'template'; сегмент скрыт.
  let decorApplyMode = 'item';
  let templateDecor = null;
  const decorApplyModeWrap = document.getElementById('decorApplyModeWrap');
  const resetItemDecorBtn = document.getElementById('resetItemDecorBtn');

  // === Per-item ФОН ценника (секция #4) — независимая модель ===
  // Отдельна от Оформления (#5): пользователь может править фон per-item,
  // а декор-блоки — по шаблону (или наоборот). bgApplyMode/templateBg независимы.
  let bgApplyMode = 'item';
  let templateBg = null;
  const bgApplyModeWrap = document.getElementById('bgApplyModeWrap');
  const resetItemBgBtn = document.getElementById('resetItemBgBtn');

  // DOM Inputs - Size
  const wobblerWidthInput = document.getElementById('wobblerWidthInput');
  const wobblerHeightInput = document.getElementById('wobblerHeightInput');
  const rulerHText = document.getElementById('rulerHText');
  const rulerVText = document.getElementById('rulerVText');
  const topSubtitle = document.getElementById('topSubtitle');
  const sheetCalcText = document.getElementById('sheetCalcText');

  // DOM Mode Switchers
  const printModeRadios = document.querySelectorAll('input[name="printMode"]');
  const multiItemSection = document.getElementById('multiItemSection');
  const singleItemSection = document.getElementById('singleItemSection');
  const itemsListContainer = document.getElementById('itemsListContainer');
  const pasteExcelArea = document.getElementById('pasteExcelArea');
  const applyPasteBtn = document.getElementById('applyPasteBtn');
  const autoFitFontBtn = document.getElementById('autoFitFontBtn');

  // DOM Inputs - Title
  const inputTitle = document.getElementById('inputTitle');
  const inputSubtitle = document.getElementById('inputSubtitle');
  const titleFont = document.getElementById('titleFont');
  const titleColor = document.getElementById('titleColor');
  const titleSize = document.getElementById('titleSize');
  const titleSizeVal = document.getElementById('titleSizeVal');
  const titleSizePreview = document.getElementById('titleSizePreview');
  const titleSizePreviewVal = document.getElementById('titleSizePreviewVal');
  const titleWeight = document.getElementById('titleWeight');
  const titleItalic = document.getElementById('titleItalic');
  const titleOffsetY = document.getElementById('titleOffsetY');
  const titleOffsetYVal = document.getElementById('titleOffsetYVal');
  const titleShadow = document.getElementById('titleShadow');
  const titleShadowColor = document.getElementById('titleShadowColor');
  const titleShadowVal = document.getElementById('titleShadowVal');

  // Subtitle (Вес / доп. текст) — собственные параметры слоя.
  const subtitleColor = document.getElementById('subtitleColor');
  const subtitleSize = document.getElementById('subtitleSize');
  const subtitleSizeVal = document.getElementById('subtitleSizeVal');
  const subtitleWeight = document.getElementById('subtitleWeight');

  // Price Toggle & Inputs
  const showPriceToggle = document.getElementById('showPriceToggle');
  const priceFieldsBlock = document.getElementById('priceFieldsBlock');
  const priceFont = document.getElementById('priceFont');
  const priceSize = document.getElementById('priceSize');
  const priceSizeVal = document.getElementById('priceSizeVal');
  const priceWeight = document.getElementById('priceWeight');
  const priceColor = document.getElementById('priceColor');
  const priceOffsetY = document.getElementById('priceOffsetY');
  const priceOffsetYVal = document.getElementById('priceOffsetYVal');
  const priceShadow = document.getElementById('priceShadow');
  const priceShadowColor = document.getElementById('priceShadowColor');
  const priceShadowVal = document.getElementById('priceShadowVal');
  const inputCurrency = document.getElementById('inputCurrency');
  const pricePlateToggle = document.getElementById('pricePlateToggle');

  // Цена вводится свободным текстом в одно поле. inputPrice — прокси-объект с
  // .value, совместимый со старым API (чтение/запись/событие 'input'), чтобы не
  // ломать остальные части (preview, печать, сохранение шаблона).
  const priceFreeInput = document.getElementById('inputPriceFree');
  const inputPrice = {
    get value() {
      return priceFreeInput ? priceFreeInput.value : '';
    },
    set value(v) {
      if (priceFreeInput) priceFreeInput.value = String(v != null ? v : '');
    },
    addEventListener(type, fn) {
      if (priceFreeInput) priceFreeInput.addEventListener(type, fn);
    }
  };

  // Background & Pattern Inputs
  const headerBgColor = document.getElementById('headerBgColor');
  const bgImageSelect = document.getElementById('bgImageSelect');
  const customBgUpload = document.getElementById('customBgUpload');
  const uploadStatus = document.getElementById('uploadStatus');
  const customBgOption = document.getElementById('customBgOption');
  const extraBgDirInput = document.getElementById('extraBgDirInput');
  const extraBgStatus = document.getElementById('extraBgStatus');
  const headerHeightRange = document.getElementById('headerHeightRange');
  const headerHeightVal = document.getElementById('headerHeightVal');

  // Декоративные блоки «Оформление» (внешний сверху + внутренний сверху)
  const decorOutsideShow = document.getElementById('decorOutsideShow');
  const decorOutsideText = document.getElementById('decorOutsideText');
  const decorOutsideBg = document.getElementById('decorOutsideBg');
  const decorOutsideBgImg = document.getElementById('decorOutsideBgImg');
  const decorOutsideCustomUpload = document.getElementById('decorOutsideCustomUpload');
  const decorOutsideCustomOption = document.getElementById('decorOutsideCustomOption');
  const decorOutsideUploadStatus = document.getElementById('decorOutsideUploadStatus');
  const decorOutsideColor = document.getElementById('decorOutsideColor');
  const decorOutsideFontSize = document.getElementById('decorOutsideFontSize');
  const decorOutsideFontSizeVal = document.getElementById('decorOutsideFontSizeVal');
  const decorOutsideHeight = document.getElementById('decorOutsideHeight');
  const decorOutsideHeightVal = document.getElementById('decorOutsideHeightVal');
  const wobblerOutsideTop = document.getElementById('wobblerOutsideTop');
  const outsideTopText = document.getElementById('outsideTopText');

  const decorInsideShow = document.getElementById('decorInsideShow');
  const decorInsideText = document.getElementById('decorInsideText');
  const decorInsideBg = document.getElementById('decorInsideBg');
  const decorInsideBgImg = document.getElementById('decorInsideBgImg');
  const decorInsideCustomUpload = document.getElementById('decorInsideCustomUpload');
  const decorInsideCustomOption = document.getElementById('decorInsideCustomOption');
  const decorInsideUploadStatus = document.getElementById('decorInsideUploadStatus');
  const decorInsideColor = document.getElementById('decorInsideColor');
  const decorInsideFontSize = document.getElementById('decorInsideFontSize');
  const decorInsideFontSizeVal = document.getElementById('decorInsideFontSizeVal');
  const decorInsideHeight = document.getElementById('decorInsideHeight');
  const decorInsideHeightVal = document.getElementById('decorInsideHeightVal');
  const decorInsideWidth = document.getElementById('decorInsideWidth');
  const decorInsideWidthVal = document.getElementById('decorInsideWidthVal');
  const wobblerInsideTop = document.getElementById('wobblerInsideTop');
  const insideTopText = document.getElementById('insideTopText');

  // Декоративный блок СНИЗУ (под ценником) — полный аналог блока СВЕРХУ.
  const decorBottomShow = document.getElementById('decorBottomShow');
  const decorBottomText = document.getElementById('decorBottomText');
  const decorBottomBg = document.getElementById('decorBottomBg');
  const decorBottomBgImg = document.getElementById('decorBottomBgImg');
  const decorBottomCustomUpload = document.getElementById('decorBottomCustomUpload');
  const decorBottomCustomOption = document.getElementById('decorBottomCustomOption');
  const decorBottomUploadStatus = document.getElementById('decorBottomUploadStatus');
  const decorBottomColor = document.getElementById('decorBottomColor');
  const decorBottomFontSize = document.getElementById('decorBottomFontSize');
  const decorBottomFontSizeVal = document.getElementById('decorBottomFontSizeVal');
  const decorBottomHeight = document.getElementById('decorBottomHeight');
  const decorBottomHeightVal = document.getElementById('decorBottomHeightVal');
  const wobblerOutsideBottom = document.getElementById('wobblerOutsideBottom');
  const outsideBottomText = document.getElementById('outsideBottomText');

  let uploadedDataUrl2 = null; // фон внешнего блока (custom)
  let uploadedDataUrl3 = null; // фон внутреннего блока (custom)
  let uploadedDataUrl4 = null; // фон нижнего блока (custom)

  // Sheet Config & Buttons
  const sheetCount = document.getElementById('sheetCount');
  const singleRepeatCount = document.getElementById('singleRepeatCount');
  const showCropMarks = document.getElementById('showCropMarks');
  const gapInput = document.getElementById('gapMm');
  const gapMmVal = document.getElementById('gapMmVal');
  const printBtn = document.getElementById('printBtn');
  const printBtnSidebar = document.getElementById('printBtnSidebar');

  // Preview Elements
  const wobblerPreview = document.getElementById('wobblerPreview');
  const wobblerHeader = document.getElementById('wobblerHeader');
  const wobblerBottom = document.getElementById('wobblerBottom');
  const previewTitle = document.getElementById('previewTitle');
  const previewSubtitle = document.getElementById('previewSubtitle');
  const previewPriceBox = document.getElementById('previewPriceBox');
  const previewPrice = document.getElementById('previewPrice');
  const previewCurrency = document.getElementById('previewCurrency');
  const sheetGridPreview = document.getElementById('sheetGridPreview');
  const printArea = document.getElementById('printArea');
  const dragModeToggle = document.getElementById('dragModeToggle');
  const safeEditToggle = document.getElementById('safeEditToggle');
  const resetLabelPosBtn = document.getElementById('resetLabelPosBtn');

  // Modal & Template Elements
  const saveTemplateBtn = document.getElementById('saveTemplateBtn');
  const saveModal = document.getElementById('saveModal');
  const cancelSaveModal = document.getElementById('cancelSaveModal');
  const confirmSaveModal = document.getElementById('confirmSaveModal');
  const newTemplateNameInput = document.getElementById('newTemplateNameInput');
  const updateTemplateBtn = document.getElementById('updateTemplateBtn');
  const saveModalHint = document.getElementById('saveModalHint');
  const userTemplatesContainer = document.getElementById('userTemplates');
  const emptyUserTemplates = document.getElementById('emptyUserTemplates');
  const userCount = document.getElementById('userCount');

  // Экспорт / Импорт шаблонов
  const exportAllBtn = document.getElementById('exportAllBtn');
  const importBtn = document.getElementById('importBtn');
  const importFileInput = document.getElementById('importFileInput');

  let alignState = {
    title: 'center',
    subtitle: 'left',
    price: 'center'
  };

  let uploadedDataUrl = null;
  // Размещение блока цены в нижнем поле (для шаблонов вроде «Рыба»)
  let rybaPriceInBottom = false;
  // Подзаголовок (вес) в нижнем левом углу (для шаблона «Рыба»)
  let subtitleCorner = false;
  // Текущая раскладка воблера ('full' | 'split'). Источник правды вместо
  // убранной radio-группы «Формат воблера» — задаётся выбранным шаблоном.
  let currentLayout = 'full';
  // Белая рамка вокруг графики фона (мм). 0 = фон до самых краёв ценника.
  // Реализуется как padding контента фона + background-clip: content-box, чтобы
  // внешняя полоса оставалась цветом заливки (по умолчанию белой) — запас под обрез.
  let borderMm = 0;
  // Наклон текстовых слоёв (название + цена), в градусах. 0 = без наклона.
  // Для шаблонов с наклонённой графикой (напр. «Сорт недели») слои повторяют угол.
  let layerRotate = 0;

  // Ручные смещения надписей (перетаскивание мышью), в мм.
  // priceDigits — массив позиций по одной на цифру цены; currency — символ валюты.
  function defaultLabelPos() {
    return {
      title: { x: 0, y: 0 },
      subtitle: { x: 0, y: 0 },
      price: { x: 0, y: 0 },
      priceDigits: [],
      currency: { x: 0, y: 0 }
    };
  }
  // Глубокая копия позиций надписей (для сброса/копирования без ссылок).
  function cloneLabelPos(src) {
    const base = defaultLabelPos();
    if (!src) return base;
    return {
      title: { x: (src.title && src.title.x) || 0, y: (src.title && src.title.y) || 0 },
      subtitle: { x: (src.subtitle && src.subtitle.x) || 0, y: (src.subtitle && src.subtitle.y) || 0 },
      price: { x: (src.price && src.price.x) || 0, y: (src.price && src.price.y) || 0 },
      priceDigits: Array.isArray(src.priceDigits) ? src.priceDigits.map(d => ({ x: (d && d.x) || 0, y: (d && d.y) || 0 })) : [],
      currency: { x: (src.currency && src.currency.x) || 0, y: (src.currency && src.currency.y) || 0 }
    };
  }

  // Глобальный labelPos используется только как база/совместимость (пресеты).
  let labelPos = defaultLabelPos();
  // Позиции для одиночного режима (один ценник).
  let singleLabelPos = defaultLabelPos();

  // Рассылать ли позиции перетаскивания на все ценники. true — обычный режим
  // «Двигать надписи» (положение разносится на все), false — «Двигать отдельно»
  // (двигается только выбранный ценник, остальные не меняются).
  let dragBroadcast = true;

  // Возвращает объект позиций, актуальный для текущего режима и активного товара.
  // Это единая точка чтения/записи для ручного перетаскивания.
  function activeLabelPos() {
    if (document.querySelector('input[name="printMode"]:checked').value === 'multi') {
      const it = itemsData[activePreviewIndex] || (itemsData[activePreviewIndex] = {});
      if (!it.labelPos) it.labelPos = defaultLabelPos();
      return it.labelPos;
    }
    return singleLabelPos;
  }

  // Per-item размер шрифта наименования. В multi ценник хранит свой кегль в
  // itemsData[i].fonts.titleSize (старое поле itemsData[i].titleSize — обратно
  // совместимо); в single / без override — templateFonts.titleSize.
  // Гарантирует числовое значение.
  function activeItemTitleSize(item) {
    let raw = null;
    if (item) {
      if (item.fonts && item.fonts.titleSize != null) raw = item.fonts.titleSize;
      else if (item.titleSize != null && item.titleSize !== '') raw = item.titleSize; // legacy
    }
    if (raw != null && raw !== '') {
      const v = parseFloat(raw);
      if (!isNaN(v)) return v;
    }
    const fb = templateFonts && templateFonts.titleSize;
    return parseFloat(fb) || 13;
  }

  // === Per-item оформление и фон (кнопка ⚙ в строке таблицы) ===
  // Каждый ценник может переопределить блоки СВЕРХУ/ВНУТРИ и фон. В single-режиме
  // всегда читаются глобальные контролы; в multi — per-item поле, если оно задано,
  // иначе fallback к глобальному. Хелперы ниже — единая точка чтения значений для
  // превью активного ценника (updatePreview) и для клонов листа/печати.
  // Поле считается «заданным», если выставлен флаг ...Show явно (true/false),
  // чтобы пользователь мог и включать, и выключать блок для конкретного ценника.
  const PER_ITEM_FIELDS = {
    outside: ['outsideShow','outsideText','outsideBg','outsideBgImg','outsideCustomBg','outsideColor','outsideFontSize','outsideHeight'],
    inside:  ['insideShow','insideText','insideBg','insideBgImg','insideCustomBg','insideColor','insideFontSize','insideHeight'],
    bottom:  ['bottomShow','bottomText','bottomBg','bottomBgImg','bottomCustomBg','bottomColor','bottomFontSize','bottomHeight'],
    bg:      ['headerBg','bgImage','customBgData','titleSafe']
  };

  function isMultiModeNow() {
    return document.querySelector('input[name="printMode"]:checked').value === 'multi';
  }

  // Резолвит значение конкретного поля для ценника i: per-item если задано, иначе глобальное.
  // kind — 'outside'|'inside'|'bg', field — имя поля, globalVal — значение глобального контрола.
  function resolveItemField(i, kind, field, globalVal) {
    if (!isMultiModeNow()) return globalVal;
    const it = itemsData[i];
    if (it && it[`${kind}Customized`]) {
      return it[field] != null ? it[field] : globalVal;
    }
    return globalVal;
  }

  // === Per-item шрифты/цвета (для блока «Настройки шрифтов и текста») ===
  // Каждый ценник в multi-режиме может переопределить ВСЕ шрифтовые настройки
  // одним снимком: itemsData[i].fontsCustomized + itemsData[i].fonts = {...}.
  // Если override нет — ценник наследует оформление шаблона (templateFonts).
  // Список всех полей, редактируемых в Section 3 (title/subtitle/price).
  const FONT_FIELDS = [
    'titleFont', 'titleColor', 'titleSize', 'titleWeight', 'titleItalic', 'titleAlign', 'titleOffsetY', 'titleShadow',
    'subtitleColor', 'subtitleSize', 'subtitleWeight', 'subtitleAlign',
    'priceFont', 'priceColor', 'priceSize', 'priceWeight', 'priceAlign', 'priceOffsetY', 'currency', 'priceShadow'
  ];

  // Возвращает значение шрифтового поля для ценника: per-item override, иначе fallback
  // (обычно templateFonts[field]). itItalic хранится как boolean.
  function fontOf(item, field, fallback) {
    if (item && item.fontsCustomized && item.fonts && item.fonts[field] != null) {
      return item.fonts[field];
    }
    return fallback;
  }

  // Собирает CSS-строку text-shadow из силы (0..10) и цвета.
  // strength=0 → '' (нет тени). Иначе многослойная диагональная тень, дающая
  // объёмный «3D»-эффект: N жестких слоёв со смещением 1..N + одно мягкое
  // размытие на ту же глубину. Цвет берётся как есть (HEX).
  function buildShadow(strength, color) {
    const s = parseInt(strength, 10);
    if (!s || s <= 0) return '';
    const c = color || '#000000';
    const layers = [];
    for (let i = 1; i <= s; i++) layers.push(`${i}px ${i}px 0 ${c}`);
    layers.push(`${s}px ${s}px ${s * 2}px ${c}`);
    return layers.join(', ');
  }

  // Обратное преобразование сохранённой CSS-строки text-shadow в силу и цвет
  // для ползунка/палитры UI. Действует «лучшее усилие»: если строка не наша —
  // сила = 0, цвет = #000000.
  function parseShadow(shadowStr) {
    if (!shadowStr) return { strength: 0, color: '#000000' };
    // Цвет: первый найденный HEX в строке.
    const hexMatch = String(shadowStr).match(/#([0-9a-fA-F]{3,8})\b/);
    const color = hexMatch ? hexMatch[0] : '#000000';
    // Сила: максимальное значение смещения среди слоёв вида "Npx Npx".
    let strength = 0;
    const re = /(\d+)px\s+(\d+)px/g;
    let m;
    while ((m = re.exec(shadowStr)) !== null) {
      const off = Math.max(parseInt(m[1], 10), parseInt(m[2], 10));
      if (off > strength) strength = off;
    }
    if (strength > 10) strength = 10; // ограничиваем диапазоном ползунка
    return { strength, color };
  }

  // Снимок всех 17 шрифтовых полей из текущих значений инпутов DOM.
  // Это «редактируемое» состояние, которое затем пишется в templateFonts
  // или в itemsData[active].fonts в зависимости от fontApplyMode.
  function readFontSnapshotFromInputs() {
    return {
      titleFont:      titleFont ? titleFont.value : 'Arial, sans-serif',
      titleColor:     titleColor ? titleColor.value : '#ffffff',
      titleSize:      titleSize ? titleSize.value : 13,
      titleWeight:    titleWeight ? titleWeight.value : '800',
      titleItalic:    !!(titleItalic && titleItalic.checked),
      titleAlign:     alignState.title || 'center',
      titleOffsetY:   titleOffsetY ? titleOffsetY.value : 0,
      titleShadow:    buildShadow(titleShadow ? titleShadow.value : 0, titleShadowColor ? titleShadowColor.value : '#000000'),
      subtitleColor:  subtitleColor ? subtitleColor.value : '#ffffff',
      subtitleSize:   subtitleSize ? subtitleSize.value : 11,
      subtitleWeight: subtitleWeight ? subtitleWeight.value : '700',
      subtitleAlign:  alignState.subtitle || 'left',
      priceFont:      priceFont ? priceFont.value : 'Arial, sans-serif',
      priceColor:     priceColor ? priceColor.value : '#ffffff',
      priceSize:      priceSize ? priceSize.value : 40,
      priceWeight:    priceWeight ? priceWeight.value : '700',
      priceAlign:     alignState.price || 'center',
      priceOffsetY:   priceOffsetY ? priceOffsetY.value : 0,
      priceShadow:    buildShadow(priceShadow ? priceShadow.value : 0, priceShadowColor ? priceShadowColor.value : '#000000'),
      currency:       inputCurrency ? inputCurrency.value : '₽'
    };
  }

  // Записывает снимок из объекта (templateFonts или item.fonts) обратно в инпуты DOM
  // и активные align-кнопки. Без вызова updatePreview — вызывает вызывающая сторона.
  function writeFontSnapshotToInputs(snap) {
    if (!snap) return;
    if (titleFont) titleFont.value = snap.titleFont;
    if (titleColor) titleColor.value = snap.titleColor;
    if (titleSize) titleSize.value = snap.titleSize;
    if (titleWeight) titleWeight.value = snap.titleWeight;
    if (titleItalic) titleItalic.checked = !!snap.titleItalic;
    if (titleOffsetY) titleOffsetY.value = snap.titleOffsetY;
    {
      const tsh = parseShadow(snap.titleShadow);
      if (titleShadow) titleShadow.value = tsh.strength;
      if (titleShadowColor) titleShadowColor.value = tsh.color;
    }
    alignState.title = snap.titleAlign || 'center';
    if (subtitleColor) subtitleColor.value = snap.subtitleColor;
    if (subtitleSize) subtitleSize.value = snap.subtitleSize;
    if (subtitleWeight) subtitleWeight.value = snap.subtitleWeight;
    alignState.subtitle = snap.subtitleAlign || 'left';
    if (priceFont) priceFont.value = snap.priceFont;
    if (priceColor) priceColor.value = snap.priceColor;
    if (priceSize) priceSize.value = snap.priceSize;
    if (priceWeight) priceWeight.value = snap.priceWeight;
    if (priceOffsetY) priceOffsetY.value = snap.priceOffsetY;
    {
      const psh = parseShadow(snap.priceShadow);
      if (priceShadow) priceShadow.value = psh.strength;
      if (priceShadowColor) priceShadowColor.value = psh.color;
    }
    if (inputCurrency) inputCurrency.value = snap.currency;
    alignState.price = snap.priceAlign || 'center';
    // Обновляем текстовые индикаторы и дублирующий слайдер.
    if (titleSizeVal) titleSizeVal.textContent = titleSize ? titleSize.value : '';
    if (titleOffsetYVal) titleOffsetYVal.textContent = titleOffsetY ? titleOffsetY.value : '';
    if (subtitleSizeVal) subtitleSizeVal.textContent = subtitleSize ? subtitleSize.value : '';
    if (priceSizeVal) priceSizeVal.textContent = priceSize ? priceSize.value : '';
    if (priceOffsetYVal) priceOffsetYVal.textContent = priceOffsetY ? priceOffsetY.value : '';
    if (titleShadowVal) titleShadowVal.textContent = titleShadow ? titleShadow.value : '';
    if (priceShadowVal) priceShadowVal.textContent = priceShadow ? priceShadow.value : '';
    syncTitleSizePreview();
    // Реактивируем кнопки выравнивания под новым состоянием.
    ['title', 'subtitle', 'price'].forEach(target => {
      document.querySelectorAll(`.align-btn[data-target="${target}"]`).forEach(b => {
        b.classList.toggle('active', b.getAttribute('data-align') === (alignState[target] || 'center'));
      });
    });
  }

  // Переводит инпуты DOM в состояние активного контекста (item vs template) и
  // обновляет вид сегмента переключателя. Не зовёт updatePreview — это делает
  // вызывающая сторона (кроме внутренних мест, где синхронизация сама по себе
  // не требует немедленного ре-рендера, например перед updatePreview).
  function syncFontControlsToContext() {
    const isMulti = isMultiModeNow();
    if (!isMulti) {
      // Single-режим: сегмент скрыт, режим всегда template, инпуты = templateFonts.
      fontApplyMode = 'template';
      if (fontApplyModeWrap) fontApplyModeWrap.style.display = 'none';
      writeFontSnapshotToInputs(templateFonts);
      return;
    }
    if (fontApplyModeWrap) fontApplyModeWrap.style.display = '';
    // Подсветка активной кнопки сегмента.
    document.querySelectorAll('[data-font-mode]').forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-font-mode') === fontApplyMode);
    });
    if (fontApplyMode === 'item') {
      const it = itemsData[activePreviewIndex];
      const snap = (it && it.fontsCustomized && it.fonts) ? it.fonts : templateFonts;
      writeFontSnapshotToInputs(snap);
    } else {
      writeFontSnapshotToInputs(templateFonts);
    }
  }

  // === Per-item оформление (декор-блоки #5): snapshot-модель ===
  // Список полей блоков СВЕРХУ/ВНУТРИ/СНИЗУ. Фон ценника (#4) вынесен в отдельную
  // модель (templateBg/bgApplyMode). insideWidth и titleSafe/headerHeight —
  // только шаблонные, в набор не входят.
  const DECOR_FIELDS = [
    // СВЕРХУ
    'outsideShow','outsideText','outsideBg','outsideBgImg','outsideCustomBg','outsideColor','outsideFontSize','outsideHeight',
    // ВНУТРИ (без insideWidth — он только шаблонный)
    'insideShow','insideText','insideBg','insideBgImg','insideCustomBg','insideColor','insideFontSize','insideHeight',
    // СНИЗУ
    'bottomShow','bottomText','bottomBg','bottomBgImg','bottomCustomBg','bottomColor','bottomFontSize','bottomHeight'
  ];

  // Возвращает per-item значение поля оформления, иначе fallback (обычно templateDecor[field]).
  function decorOf(item, field, fallback) {
    if (item && item.decorCustomized && item.decor && item.decor[field] != null) {
      return item.decor[field];
    }
    return fallback;
  }

  // Снимок всех полей оформления из текущих контролов DOM (включая custom-фоны data-URL).
  function readDecorSnapshotFromInputs() {
    return {
      outsideShow:       !!(decorOutsideShow && decorOutsideShow.checked),
      outsideText:       decorOutsideText ? decorOutsideText.value : '',
      outsideBg:         decorOutsideBg ? decorOutsideBg.value : '#e63946',
      outsideBgImg:      decorOutsideBgImg ? decorOutsideBgImg.value : 'none',
      outsideCustomBg:   uploadedDataUrl2 || null,
      outsideColor:      decorOutsideColor ? decorOutsideColor.value : '#ffffff',
      outsideFontSize:   decorOutsideFontSize ? decorOutsideFontSize.value : 14,
      outsideHeight:     decorOutsideHeight ? decorOutsideHeight.value : 12,
      insideShow:        !!(decorInsideShow && decorInsideShow.checked),
      insideText:        decorInsideText ? decorInsideText.value : '',
      insideBg:          decorInsideBg ? decorInsideBg.value : '#e63946',
      insideBgImg:       decorInsideBgImg ? decorInsideBgImg.value : 'none',
      insideCustomBg:    uploadedDataUrl3 || null,
      insideColor:       decorInsideColor ? decorInsideColor.value : '#ffffff',
      insideFontSize:    decorInsideFontSize ? decorInsideFontSize.value : 11,
      insideHeight:      decorInsideHeight ? decorInsideHeight.value : 8,
      bottomShow:        !!(decorBottomShow && decorBottomShow.checked),
      bottomText:        decorBottomText ? decorBottomText.value : '',
      bottomBg:          decorBottomBg ? decorBottomBg.value : '#e63946',
      bottomBgImg:       decorBottomBgImg ? decorBottomBgImg.value : 'none',
      bottomCustomBg:    uploadedDataUrl4 || null,
      bottomColor:       decorBottomColor ? decorBottomColor.value : '#ffffff',
      bottomFontSize:    decorBottomFontSize ? decorBottomFontSize.value : 14,
      bottomHeight:      decorBottomHeight ? decorBottomHeight.value : 12
    };
  }

  // Записывает снимок в контролы DOM и обновляет вспомогательный UI
  // (custom-option visibility, upload-status, *Val spans). Без updatePreview —
  // вызывает вызывающая сторона.
  function writeDecorSnapshotToInputs(snap) {
    if (!snap) return;
    // СВЕРХУ
    if (decorOutsideShow) decorOutsideShow.checked = !!snap.outsideShow;
    if (decorOutsideText) decorOutsideText.value = snap.outsideText || '';
    if (decorOutsideBg) decorOutsideBg.value = snap.outsideBg || '#e63946';
    if (decorOutsideColor) decorOutsideColor.value = snap.outsideColor || '#ffffff';
    if (decorOutsideFontSize) decorOutsideFontSize.value = snap.outsideFontSize != null ? snap.outsideFontSize : 14;
    if (decorOutsideHeight) decorOutsideHeight.value = snap.outsideHeight != null ? snap.outsideHeight : 12;
    uploadedDataUrl2 = snap.outsideCustomBg || null;
    if (decorOutsideCustomOption) decorOutsideCustomOption.style.display = (snap.outsideBgImg === 'custom' && snap.outsideCustomBg) ? 'block' : 'none';
    if (decorOutsideBgImg) decorOutsideBgImg.value = (snap.outsideBgImg === 'custom' && snap.outsideCustomBg) ? 'custom' : (snap.outsideBgImg || 'none');
    if (decorOutsideUploadStatus) decorOutsideUploadStatus.textContent = (snap.outsideBgImg === 'custom' && snap.outsideCustomBg) ? '✓ Пользовательский фон' : '';
    // ВНУТРИ
    if (decorInsideShow) decorInsideShow.checked = !!snap.insideShow;
    if (decorInsideText) decorInsideText.value = snap.insideText || '';
    if (decorInsideBg) decorInsideBg.value = snap.insideBg || '#e63946';
    if (decorInsideColor) decorInsideColor.value = snap.insideColor || '#ffffff';
    if (decorInsideFontSize) decorInsideFontSize.value = snap.insideFontSize != null ? snap.insideFontSize : 11;
    if (decorInsideHeight) decorInsideHeight.value = snap.insideHeight != null ? snap.insideHeight : 8;
    uploadedDataUrl3 = snap.insideCustomBg || null;
    if (decorInsideCustomOption) decorInsideCustomOption.style.display = (snap.insideBgImg === 'custom' && snap.insideCustomBg) ? 'block' : 'none';
    if (decorInsideBgImg) decorInsideBgImg.value = (snap.insideBgImg === 'custom' && snap.insideCustomBg) ? 'custom' : (snap.insideBgImg || 'none');
    if (decorInsideUploadStatus) decorInsideUploadStatus.textContent = (snap.insideBgImg === 'custom' && snap.insideCustomBg) ? '✓ Пользовательский фон' : '';
    // СНИЗУ
    if (decorBottomShow) decorBottomShow.checked = !!snap.bottomShow;
    if (decorBottomText) decorBottomText.value = snap.bottomText || '';
    if (decorBottomBg) decorBottomBg.value = snap.bottomBg || '#e63946';
    if (decorBottomColor) decorBottomColor.value = snap.bottomColor || '#ffffff';
    if (decorBottomFontSize) decorBottomFontSize.value = snap.bottomFontSize != null ? snap.bottomFontSize : 14;
    if (decorBottomHeight) decorBottomHeight.value = snap.bottomHeight != null ? snap.bottomHeight : 12;
    uploadedDataUrl4 = snap.bottomCustomBg || null;
    if (decorBottomCustomOption) decorBottomCustomOption.style.display = (snap.bottomBgImg === 'custom' && snap.bottomCustomBg) ? 'block' : 'none';
    if (decorBottomBgImg) decorBottomBgImg.value = (snap.bottomBgImg === 'custom' && snap.bottomCustomBg) ? 'custom' : (snap.bottomBgImg || 'none');
    if (decorBottomUploadStatus) decorBottomUploadStatus.textContent = (snap.bottomBgImg === 'custom' && snap.bottomCustomBg) ? '✓ Пользовательский фон' : '';
    // Текстовые индикаторы
    if (decorOutsideFontSizeVal) decorOutsideFontSizeVal.textContent = decorOutsideFontSize ? decorOutsideFontSize.value : '';
    if (decorOutsideHeightVal) decorOutsideHeightVal.textContent = decorOutsideHeight ? decorOutsideHeight.value : '';
    if (decorInsideFontSizeVal) decorInsideFontSizeVal.textContent = decorInsideFontSize ? decorInsideFontSize.value : '';
    if (decorInsideHeightVal) decorInsideHeightVal.textContent = decorInsideHeight ? decorInsideHeight.value : '';
    if (decorBottomFontSizeVal) decorBottomFontSizeVal.textContent = decorBottomFontSize ? decorBottomFontSize.value : '';
    if (decorBottomHeightVal) decorBottomHeightVal.textContent = decorBottomHeight ? decorBottomHeight.value : '';
  }

  // Переводит контролы оформления под активный контекст (item vs template).
  function syncDecorControlsToContext() {
    const isMulti = isMultiModeNow();
    if (!isMulti) {
      decorApplyMode = 'template';
      if (decorApplyModeWrap) decorApplyModeWrap.style.display = 'none';
      writeDecorSnapshotToInputs(templateDecor);
      return;
    }
    if (decorApplyModeWrap) decorApplyModeWrap.style.display = '';
    document.querySelectorAll('[data-decor-mode]').forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-decor-mode') === decorApplyMode);
    });
    if (decorApplyMode === 'item') {
      const it = itemsData[activePreviewIndex];
      const snap = (it && it.decorCustomized && it.decor) ? it.decor : templateDecor;
      writeDecorSnapshotToInputs(snap);
    } else {
      writeDecorSnapshotToInputs(templateDecor);
    }
  }

  // === Per-item ФОН ценника (#4): независимая snapshot-модель ===
  // Возвращает per-item значение поля фона, иначе fallback (обычно templateBg[field]).
  function bgOf(item, field, fallback) {
    if (item && item.bgCustomized && item.bg && item.bg[field] != null) {
      return item.bg[field];
    }
    return fallback;
  }

  // ===== Дополнительные фоны из папки «bg other» =====
  // Механизм: один раз выбираем папку через <input webkitdirectory>; файлы
  // читаются как data:URL и кэшируются в IndexedDB. При следующих открытиях
  // страницы фоны подгружаются из IndexedDB автоматически — без повторного
  // выбора папки и без сервера. Работает и на file://, и на http://.
  //
  // extraBgMap: маркер 'bgother:<имя файла>' → data:URL картинки.
  // applyBackgroundTo() применяет выбранный доп. фон по этой карте.
  let extraBgMap = {};
  let extraBgOrder = [];   // имена в порядке выбора (для стабильного порядка в UI)

  const EXTRA_BG_DB = 'wobbler_extra_bgs';
  const EXTRA_BG_STORE = 'bgs';

  // Промис-обёртка над открытием IndexedDB. Возвращает null, если IndexedDB
  // недоступен (приватный режим и т.п.) — тогда механизм просто отключается.
  function openExtraBgDb() {
    return new Promise(resolve => {
      if (!window.indexedDB) { resolve(null); return; }
      try {
        const req = indexedDB.open(EXTRA_BG_DB, 1);
        req.onupgradeneeded = () => {
          const db = req.result;
          if (!db.objectStoreNames.contains(EXTRA_BG_STORE)) {
            db.createObjectStore(EXTRA_BG_STORE); // key = имя файла, value = data:URL
          }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => resolve(null);
      } catch (e) { resolve(null); }
    });
  }

  // Читает все сохранённые ранее фоны из IndexedDB и наполняет подменю.
  // Вызывается при загрузке страницы. Ошибки/пустое хранилище не выбрасывает.
  async function loadExtraBackgrounds() {
    const group = document.getElementById('extraBgGroup');
    if (!group) return;
    const db = await openExtraBgDb();
    if (!db) return;
    try {
      const tx = db.transaction(EXTRA_BG_STORE, 'readonly');
      const store = tx.objectStore(EXTRA_BG_STORE);
      const allReq = store.getAllKeys();
      allReq.onsuccess = async () => {
        const names = (allReq.result || []).slice().sort((a, b) =>
          String(a).toLowerCase().localeCompare(String(b).toLowerCase()));
        if (!names.length) { db.close(); return; }
        // Дочитаем значения по ключам.
        const tx2 = db.transaction(EXTRA_BG_STORE, 'readonly');
        const store2 = tx2.objectStore(EXTRA_BG_STORE);
        let loaded = 0;
        names.forEach(name => {
          const getReq = store2.get(name);
          getReq.onsuccess = () => {
            const dataUrl = getReq.result;
            if (dataUrl) {
              const marker = 'bgother:' + name;
              extraBgMap[marker] = dataUrl;
              const opt = document.createElement('option');
              opt.value = marker;
              opt.textContent = name;
              group.appendChild(opt);
            }
            loaded++;
            if (loaded === names.length) {
              db.close();
              extraBgOrder = names;
              // Если активный фон — доп. и его option появился только сейчас,
              // повторно синхронизируем контролы, чтобы селект его отобразил.
              try { syncBgControlsToContext(); } catch (e) {}
            }
          };
          getReq.onerror = () => {
            loaded++;
            if (loaded === names.length) { db.close(); }
          };
        });
      };
      allReq.onerror = () => db.close();
    } catch (e) { try { db.close(); } catch (_) {} }
  }

  // Сохраняет массив {name, dataUrl} в IndexedDB (заменяя всё содержимое),
  // затем обновляет extraBgMap/extraBgOrder и подменю. Возвращает Promise.
  async function saveExtraBackgrounds(entries) {
    const db = await openExtraBgDb();
    if (!db) return;
    try {
      const tx = db.transaction(EXTRA_BG_STORE, 'readwrite');
      const store = tx.objectStore(EXTRA_BG_STORE);
      store.clear();
      entries.forEach(e => store.put(e.dataUrl, e.name));
      tx.oncomplete = () => db.close();
      tx.onerror = () => db.close();
    } catch (e) { try { db.close(); } catch (_) {} }

    // Обновляем карту и подменю в памяти.
    extraBgMap = {};
    const group = document.getElementById('extraBgGroup');
    if (group) {
      Array.from(group.querySelectorAll('option')).forEach(o => o.remove());
    }
    extraBgOrder = entries.map(e => e.name)
      .sort((a, b) => String(a).toLowerCase().localeCompare(String(b).toLowerCase()));
    extraBgOrder.forEach(name => {
      const dataUrl = (entries.find(e => e.name === name) || {}).dataUrl;
      if (!dataUrl) return;
      const marker = 'bgother:' + name;
      extraBgMap[marker] = dataUrl;
      if (group) {
        const opt = document.createElement('option');
        opt.value = marker;
        opt.textContent = name;
        group.appendChild(opt);
      }
    });
    try { syncBgControlsToContext(); } catch (e) {}
  }

  // Снимок полей фона из DOM-контролов + загруженной data-URL картинки.
  function readBgSnapshotFromInputs() {
    return {
      headerBg:     headerBgColor ? headerBgColor.value : '#18181b',
      bgImage:      bgImageSelect ? bgImageSelect.value : 'none',
      customBgData: uploadedDataUrl || null
    };
  }

  // Записывает снимок фона в контролы DOM (color/select/option/status/data-url).
  function writeBgSnapshotToInputs(snap) {
    if (!snap) return;
    if (headerBgColor) headerBgColor.value = snap.headerBg || '#18181b';
    uploadedDataUrl = snap.customBgData || null;
    if (customBgOption) customBgOption.style.display = (snap.bgImage === 'custom' && snap.customBgData) ? 'block' : 'none';
    if (bgImageSelect) bgImageSelect.value = (snap.bgImage === 'custom' && snap.customBgData) ? 'custom' : (snap.bgImage || 'none');
    if (uploadStatus) uploadStatus.textContent = (snap.bgImage === 'custom' && snap.customBgData) ? '✓ Пользовательский фон' : '';
  }

  // Переводит контролы фона под активный контекст (item vs template).
  function syncBgControlsToContext() {
    const isMulti = isMultiModeNow();
    if (!isMulti) {
      bgApplyMode = 'template';
      if (bgApplyModeWrap) bgApplyModeWrap.style.display = 'none';
      writeBgSnapshotToInputs(templateBg);
      return;
    }
    if (bgApplyModeWrap) bgApplyModeWrap.style.display = '';
    document.querySelectorAll('[data-bg-mode]').forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-bg-mode') === bgApplyMode);
    });
    if (bgApplyMode === 'item') {
      const it = itemsData[activePreviewIndex];
      const snap = (it && it.bgCustomized && it.bg) ? it.bg : templateBg;
      writeBgSnapshotToInputs(snap);
    } else {
      writeBgSnapshotToInputs(templateBg);
    }
  }

  // Возвращает полный «снимок» оформления блока (outside/inside/bottom) для ценника i.
  // Per-item override берётся из itemsData[i].decor (если decorCustomized),
  // иначе из templateDecor. Контракт прежний: {show,text,bg,bgImg,customBg,color,fontSize,height[,width]}.
  function resolveDecorBlock(i, kind) {
    const it = itemsData[i];
    const td = templateDecor || {};
    if (kind === 'outside') {
      return {
        show:     decorOf(it, 'outsideShow',   td.outsideShow != null ? td.outsideShow : false),
        text:     decorOf(it, 'outsideText',   td.outsideText != null ? td.outsideText : ''),
        bg:       decorOf(it, 'outsideBg',     td.outsideBg || '#e63946'),
        bgImg:    decorOf(it, 'outsideBgImg',  td.outsideBgImg || 'none'),
        customBg: decorOf(it, 'outsideCustomBg', td.outsideCustomBg != null ? td.outsideCustomBg : null),
        color:    decorOf(it, 'outsideColor',  td.outsideColor || '#ffffff'),
        fontSize: decorOf(it, 'outsideFontSize', td.outsideFontSize != null ? td.outsideFontSize : 14),
        height:   decorOf(it, 'outsideHeight', td.outsideHeight != null ? td.outsideHeight : 12)
      };
    }
    if (kind === 'bottom') {
      return {
        show:     decorOf(it, 'bottomShow',   td.bottomShow != null ? td.bottomShow : false),
        text:     decorOf(it, 'bottomText',   td.bottomText != null ? td.bottomText : ''),
        bg:       decorOf(it, 'bottomBg',     td.bottomBg || '#e63946'),
        bgImg:    decorOf(it, 'bottomBgImg',  td.bottomBgImg || 'none'),
        customBg: decorOf(it, 'bottomCustomBg', td.bottomCustomBg != null ? td.bottomCustomBg : null),
        color:    decorOf(it, 'bottomColor',  td.bottomColor || '#ffffff'),
        fontSize: decorOf(it, 'bottomFontSize', td.bottomFontSize != null ? td.bottomFontSize : 14),
        height:   decorOf(it, 'bottomHeight', td.bottomHeight != null ? td.bottomHeight : 12)
      };
    }
    // inside. width — только шаблонный (не per-item): из DOM decorInsideWidth.
    return {
      show:     decorOf(it, 'insideShow',   td.insideShow != null ? td.insideShow : false),
      text:     decorOf(it, 'insideText',   td.insideText != null ? td.insideText : ''),
      bg:       decorOf(it, 'insideBg',     td.insideBg || '#e63946'),
      bgImg:    decorOf(it, 'insideBgImg',  td.insideBgImg || 'none'),
      customBg: decorOf(it, 'insideCustomBg', td.insideCustomBg != null ? td.insideCustomBg : null),
      color:    decorOf(it, 'insideColor',  td.insideColor || '#ffffff'),
      fontSize: decorOf(it, 'insideFontSize', td.insideFontSize != null ? td.insideFontSize : 11),
      height:   decorOf(it, 'insideHeight', td.insideHeight != null ? td.insideHeight : 8),
      width:    decorInsideWidth ? decorInsideWidth.value : 50
    };
  }

  // Глобальная safe-зона названия (доли 0..0.45 от сторон шапки) — хранится в JS,
  // не в DOM-инпутах (поля L/R/T/B убраны из UI). Источник: applyState(state.titleSafe)
  // и drag-редактор границ. Применяется как глобальное значение по умолчанию в
  // resolveItemBg/bgFromItem.
  let globalTitleSafe = { left: 0, right: 0, top: 0, bottom: 0 };
  // Возвращает копию глобальной safe-зоны (чтобы потребители не мутировали оригинал).
  function readGlobalTitleSafe() {
    return { left: globalTitleSafe.left, right: globalTitleSafe.right, top: globalTitleSafe.top, bottom: globalTitleSafe.bottom };
  }
  // Нормализует объект titleSafe (защита от частичных/нечисловых значений из state).
  function normTitleSafe(s) {
    const n = v => { const x = parseFloat(v); return isNaN(x) ? 0 : Math.max(0, Math.min(0.45, x)); };
    return s ? { left: n(s.left), right: n(s.right), top: n(s.top), bottom: n(s.bottom) } : { left:0, right:0, top:0, bottom:0 };
  }
  // Ограничение доли в [0, 0.9] (для drag краёв safe-зоны).
  const clampSafe = v => Math.max(0, Math.min(0.9, v));

  // Позиционирует прямоугольник редактора (.safe-rect) по текущим долям titleSafe.
  // inset — в % от .wobbler-header. Нет элемента/режима — тихо пропускает.
  function positionSafeRect(ts) {
    const rect = document.getElementById('safeRect');
    if (!rect) return;
    rect.style.left   = (ts.left   * 100).toFixed(2) + '%';
    rect.style.right  = (ts.right  * 100).toFixed(2) + '%';
    rect.style.top    = (ts.top    * 100).toFixed(2) + '%';
    rect.style.bottom = (ts.bottom * 100).toFixed(2) + '%';
  }

  // Возвращает снимок фона ценника (хедер) для ценника i.
  // headerBg/bgImage/customBgData — per-item из itemsData[i].bg иначе templateBg.
  // titleSafe — всегда глобальная (не per-item).
  function resolveItemBg(i) {
    const it = itemsData[i];
    const tb = templateBg || {};
    return {
      headerBg: bgOf(it, 'headerBg',     tb.headerBg || '#ffffff'),
      bgImage:  bgOf(it, 'bgImage',      tb.bgImage || 'none'),
      customBg: bgOf(it, 'customBgData', tb.customBgData != null ? tb.customBgData : null),
      titleSafe: normTitleSafe(readGlobalTitleSafe())
    };
  }

  // Объектный вариант резолвера блока: работает по самому item (для клонов листа/печати).
  // Параметризованная версия — принимает decor-snapshot td (форма как templateDecor)
  // и insideWidth-значение, чтобы работать с ЛЮБЫМ preset, а не только активным.
  function decorBlockFromItemCtx(item, kind, td, insideWidthVal) {
    td = td || {};
    if (kind === 'outside') {
      return {
        show:     decorOf(item, 'outsideShow',   td.outsideShow != null ? td.outsideShow : false),
        text:     decorOf(item, 'outsideText',   td.outsideText != null ? td.outsideText : ''),
        bg:       decorOf(item, 'outsideBg',     td.outsideBg || '#e63946'),
        bgImg:    decorOf(item, 'outsideBgImg',  td.outsideBgImg || 'none'),
        customBg: decorOf(item, 'outsideCustomBg', td.outsideCustomBg != null ? td.outsideCustomBg : null),
        color:    decorOf(item, 'outsideColor',  td.outsideColor || '#ffffff'),
        fontSize: decorOf(item, 'outsideFontSize', td.outsideFontSize != null ? td.outsideFontSize : 14),
        height:   decorOf(item, 'outsideHeight', td.outsideHeight != null ? td.outsideHeight : 12)
      };
    }
    if (kind === 'bottom') {
      return {
        show:     decorOf(item, 'bottomShow',   td.bottomShow != null ? td.bottomShow : false),
        text:     decorOf(item, 'bottomText',   td.bottomText != null ? td.bottomText : ''),
        bg:       decorOf(item, 'bottomBg',     td.bottomBg || '#e63946'),
        bgImg:    decorOf(item, 'bottomBgImg',  td.bottomBgImg || 'none'),
        customBg: decorOf(item, 'bottomCustomBg', td.bottomCustomBg != null ? td.bottomCustomBg : null),
        color:    decorOf(item, 'bottomColor',  td.bottomColor || '#ffffff'),
        fontSize: decorOf(item, 'bottomFontSize', td.bottomFontSize != null ? td.bottomFontSize : 14),
        height:   decorOf(item, 'bottomHeight', td.bottomHeight != null ? td.bottomHeight : 12)
      };
    }
    return {
      show:     decorOf(item, 'insideShow',   td.insideShow != null ? td.insideShow : false),
      text:     decorOf(item, 'insideText',   td.insideText != null ? td.insideText : ''),
      bg:       decorOf(item, 'insideBg',     td.insideBg || '#e63946'),
      bgImg:    decorOf(item, 'insideBgImg',  td.insideBgImg || 'none'),
      customBg: decorOf(item, 'insideCustomBg', td.insideCustomBg != null ? td.insideCustomBg : null),
      color:    decorOf(item, 'insideColor',  td.insideColor || '#ffffff'),
      fontSize: decorOf(item, 'insideFontSize', td.insideFontSize != null ? td.insideFontSize : 11),
      height:   decorOf(item, 'insideHeight', td.insideHeight != null ? td.insideHeight : 8),
      width:    insideWidthVal != null ? insideWidthVal : 50
    };
  }
  function decorBlockFromItem(item, kind) {
    return decorBlockFromItemCtx(item, kind, templateDecor, decorInsideWidth ? decorInsideWidth.value : 50);
  }
  function bgFromItemCtx(item, tb, titleSafe) {
    tb = tb || {};
    return {
      headerBg: bgOf(item, 'headerBg',     tb.headerBg || '#ffffff'),
      bgImage:  bgOf(item, 'bgImage',      tb.bgImage || 'none'),
      customBg: bgOf(item, 'customBgData', tb.customBgData != null ? tb.customBgData : null),
      titleSafe: normTitleSafe(titleSafe || readGlobalTitleSafe())
    };
  }
  function bgFromItem(item) {
    return bgFromItemCtx(item, templateBg, readGlobalTitleSafe());
  }
  // Per-item кегль названия с явным fallback (для рендера под произвольный preset).
  function titleSizeForCtx(item, fbSize) {
    let raw = null;
    if (item) {
      if (item.fonts && item.fonts.titleSize != null) raw = item.fonts.titleSize;
      else if (item.titleSize != null && item.titleSize !== '') raw = item.titleSize; // legacy
    }
    if (raw != null && raw !== '') {
      const v = parseFloat(raw);
      if (!isNaN(v)) return v;
    }
    return parseFloat(fbSize) || 13;
  }

  // Сбрасывает per-item ОФОРМЛЕНИЕ ценника i (декор-блоки; фон не трогает).
  // Удаляет новый snapshot (decor/decorCustomized) и legacy per-kind поля decor.
  function resetItemDecor(i) {
    const it = itemsData[i];
    if (!it) return;
    delete it.decorCustomized;
    delete it.decor;
    // Legacy cleanup (старая per-kind модель decor; bg-флаги чистит resetItemBg).
    delete it.outsideCustomized;
    delete it.insideCustomized;
    delete it.bottomCustomized;
    [...PER_ITEM_FIELDS.outside, ...PER_ITEM_FIELDS.inside, ...PER_ITEM_FIELDS.bottom].forEach(f => delete it[f]);
  }

  // Сбрасывает per-item ФОН ценника i (headerBg/bgImage/customBgData).
  function resetItemBg(i) {
    const it = itemsData[i];
    if (!it) return;
    delete it.bgCustomized;
    delete it.bg;
    // Legacy cleanup (старые плоские bg-поля).
    PER_ITEM_FIELDS.bg.forEach(f => delete it[f]);
  }

  // Полный сброс per-item ОФОРМЛЕНИЯ ценника i к шаблону: декор, фон и шрифты
  // (снимает per-item overrides — ценник снова наследует templateFonts/templateDecor/
  // templateBg). Текст товара (title/price/subtitle) не трогает.
  function resetItemVisuals(i) {
    const it = itemsData[i];
    if (!it) return;
    resetItemDecor(i);
    resetItemBg(i);
    delete it.fontsCustomized;
    delete it.fonts;
    // Legacy per-item кегль наименования — иначе он перекрывает templateFonts.titleSize.
    delete it.titleSize;
  }

  // Built-in presets (Default font for Alaska is Arial)
  const builtInPresets = {
    alaska_dots: {
      name: 'Бутылки',
      widthCm: 6.5,
      heightCm: 3.5,
      title: 'Alaska Фейхоа 0,45 ж/б',
      subtitle: '',
      titleFont: "Arial, sans-serif",
      titleColor: '#ffffff',
      titleSize: 10,
      titleWeight: '800',
      titleItalic: false,
      titleAlign: 'center',
      titleOffsetY: 0,
      subtitleColor: '#ffffff',
      subtitleSize: 13,
      subtitleWeight: '400',
      subtitleAlign: 'left',
      showPrice: true,
      priceFont: "Arial, sans-serif",
      priceSize: 40,
      priceWeight: '400',
      priceColor: '#ffffff',
      priceAlign: 'center',
      priceOffsetY: 0,
      price: '350',
      currency: '₽',
      headerBg: '#18181b',
      bgImage: 'dots_bg.jpg',
      customBgData: null,
      headerHeight: 90,
      // Safe-зона названия Alaska (выставлена вручную в визуальном редакторе границ
      // поверх dots_bg.jpg): название в верхней половине ценника — отступы сверху
      // 0.32 и снизу 0.45, по бокам без ограничений. Доли от сторон шапки.
      titleSafe: { left: 0, right: 0, top: 0.32, bottom: 0.45 },
      layout: 'full',
      priceInBottom: false,
      subtitleCorner: false,
      pricePlate: false,
      decorOutsideShow: false,
      decorOutsideText: 'НОВИНКА',
      decorOutsideBg: '#e63946',
      decorOutsideBgImg: 'none',
      decorOutsideCustomBg: null,
      decorOutsideColor: '#ffffff',
      decorOutsideFontSize: 14,
      decorOutsideHeight: 12,
      decorInsideShow: false,
      decorInsideText: 'НОВИНКА',
      decorInsideBg: '#e63946',
      decorInsideBgImg: 'none',
      decorInsideCustomBg: null,
      decorInsideColor: '#ffffff',
      decorInsideFontSize: 11,
      decorInsideHeight: 8,
      decorInsideWidth: 50,
      decorBottomShow: false,
      decorBottomText: 'НОВИНКА',
      decorBottomBg: '#e63946',
      decorBottomBgImg: 'none',
      decorBottomCustomBg: null,
      decorBottomColor: '#ffffff',
      decorBottomFontSize: 14,
      decorBottomHeight: 12,
      // Зазор между ценниками на листе А4 для «Бутылок» — 0,5 мм (под аккуратный рез).
      gapMm: 0.5,
      labelPos: { title: { x: -0.4, y: 1 }, subtitle: { x: -4.9, y: -0.3 }, price: { x: 0.2, y: 1.7 }, priceDigits: [ { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 } ], currency: { x: 0, y: 0 } }
    },
    // «Желтый ценник» — копия «Бутылок» (alaska_dots), но со своим файлом фона
    // yellow_bg.jpg и настроенными вручную цветами/расположением надписей
    // (импортировано из шаблона «Желтый ценник (изменён)»): текст/цена — чёрные,
    // цена смещена вниз на 2 мм, название — на 4,9 мм.
    yellow_tag: {
      name: 'Желтый ценник',
      widthCm: 6.5,
      heightCm: 3.5,
      title: 'Alaska Фейхоа 0,45 ж/б',
      subtitle: '',
      titleFont: "Arial, sans-serif",
      titleColor: '#000000',
      titleSize: 10,
      titleWeight: '800',
      titleItalic: false,
      titleAlign: 'center',
      titleOffsetY: 0,
      subtitleColor: '#000000',
      subtitleSize: 13,
      subtitleWeight: '400',
      subtitleAlign: 'left',
      showPrice: true,
      priceFont: "Arial, sans-serif",
      priceSize: 40,
      priceWeight: '400',
      priceColor: '#000000',
      priceAlign: 'center',
      priceOffsetY: 2,
      price: '350',
      currency: '₽',
      headerBg: '#18181b',
      bgImage: 'yellow_bg.jpg',
      customBgData: null,
      headerHeight: 90,
      // Safe-зона названия как у Бутылок (точечный фон идентичен по геометрии).
      titleSafe: { left: 0, right: 0, top: 0.32, bottom: 0.45 },
      layout: 'full',
      priceInBottom: false,
      subtitleCorner: false,
      pricePlate: false,
      decorOutsideShow: false,
      decorOutsideText: 'НОВИНКА',
      decorOutsideBg: '#e63946',
      decorOutsideBgImg: 'none',
      decorOutsideCustomBg: null,
      decorOutsideColor: '#ffffff',
      decorOutsideFontSize: 14,
      decorOutsideHeight: 12,
      decorInsideShow: false,
      decorInsideText: 'НОВИНКА',
      decorInsideBg: '#e63946',
      decorInsideBgImg: 'none',
      decorInsideCustomBg: null,
      decorInsideColor: '#ffffff',
      decorInsideFontSize: 11,
      decorInsideHeight: 8,
      decorInsideWidth: 50,
      decorBottomShow: false,
      decorBottomText: 'НОВИНКА',
      decorBottomBg: '#e63946',
      decorBottomBgImg: 'none',
      decorBottomCustomBg: null,
      decorBottomColor: '#ffffff',
      decorBottomFontSize: 14,
      decorBottomHeight: 12,
      // Зазор между ценниками на листе А4 — 0,5 мм (как у Бутылок).
      gapMm: 0.5,
      labelPos: { title: { x: -0.4, y: 4.9 }, subtitle: { x: -4.9, y: -0.3 }, price: { x: 0.2, y: 1.7 }, priceDigits: [ { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 } ], currency: { x: 0, y: 0 } }
    },
    novy_vkus: {
      name: 'Новый вкус',
      widthCm: 6.5,
      heightCm: 3.5,
      title: 'НОВЫЙ ВКУС',
      titleFont: "'Montserrat', sans-serif",
      titleColor: '#ffffff',
      titleSize: 18,
      titleWeight: '900',
      titleItalic: false,
      titleAlign: 'center',
      titleOffsetY: 0,
      showPrice: false,
      priceFont: "'Montserrat', sans-serif",
      priceSize: 28,
      priceWeight: '900',
      priceColor: '#ffffff',
      priceAlign: 'center',
      priceOffsetY: 0,
      price: '199',
      currency: '₽',
      headerBg: '#e63946',
      bgImage: 'none',
      customBgData: null,
      headerHeight: 100,
      layout: 'full',
      titleSafe: { left: 0, right: 0, top: 0, bottom: 0 }
    },
    novinka: {
      name: 'Новинка',
      widthCm: 6.5,
      heightCm: 7.0,
      title: 'НОВИНКА',
      titleFont: "'Montserrat', sans-serif",
      titleColor: '#111111',
      titleSize: 18,
      titleWeight: '900',
      titleItalic: false,
      titleAlign: 'center',
      titleOffsetY: 0,
      showPrice: false,
      priceFont: "'Montserrat', sans-serif",
      priceSize: 28,
      priceWeight: '900',
      priceColor: '#111111',
      priceAlign: 'center',
      priceOffsetY: 0,
      price: '240',
      currency: '₽',
      headerBg: '#ffd600',
      bgImage: 'none',
      customBgData: null,
      headerHeight: 50,
      layout: 'split',
      titleSafe: { left: 0, right: 0, top: 0, bottom: 0 }
    },
    tomat: {
      name: 'Томатное',
      widthCm: 6.5,
      heightCm: 7.0,
      title: 'ТОМАТНОЕ',
      titleFont: "'Montserrat', sans-serif",
      titleColor: '#ffffff',
      titleSize: 17,
      titleWeight: '900',
      titleItalic: false,
      titleAlign: 'center',
      titleOffsetY: 0,
      showPrice: false,
      priceFont: "'Montserrat', sans-serif",
      priceSize: 28,
      priceWeight: '900',
      priceColor: '#ffffff',
      priceAlign: 'center',
      priceOffsetY: 0,
      price: '199',
      currency: '₽',
      headerBg: '#e63946',
      bgImage: 'none',
      customBgData: null,
      headerHeight: 50,
      layout: 'split',
      titleSafe: { left: 0, right: 0, top: 0, bottom: 0 }
    },
    sladko: {
      name: 'Сладко',
      widthCm: 6.5,
      heightCm: 7.0,
      title: 'СЛАДКО!',
      titleFont: "'Montserrat', sans-serif",
      titleColor: '#ffffff',
      titleSize: 18,
      titleWeight: '900',
      titleItalic: false,
      titleAlign: 'center',
      titleOffsetY: 0,
      showPrice: false,
      priceFont: "'Montserrat', sans-serif",
      priceSize: 28,
      priceWeight: '900',
      priceColor: '#ffffff',
      priceAlign: 'center',
      priceOffsetY: 0,
      price: '159',
      currency: '₽',
      headerBg: '#7b2cbf',
      bgImage: 'none',
      customBgData: null,
      headerHeight: 50,
      layout: 'split',
      titleSafe: { left: 0, right: 0, top: 0, bottom: 0 }
    },
    // «Сорт недели»: крупный воблер с готовой графикой (красный фон, волнистый
    // верх, белый блок под цену вверху). Графика JPG уже несёт белый блок — цену
    // накладываем поверх. Белые поля 4 мм вокруг графики = запас под обрез.
    // Слои (цена + текст акции) наклонены под тем же углом, что и графика.
    // Дефолтные позиции/границы/кегли сняты с визуально выверенного шаблона.
    sort_nedeli: {
      name: 'Сорт недели',
      widthCm: 16.3,   // 15,5 см графика + 4 мм поля ×2
      heightCm: 9.1,   // 8,3 см графика + 4 мм поля ×2
      title: 'СОРТ НЕДЕЛИ!',
      titleFont: "'Montserrat', sans-serif",
      titleColor: '#ffffff',
      titleSize: 50,
      titleWeight: '800',
      titleItalic: true,
      titleAlign: 'center',
      titleOffsetY: 0,
      showPrice: true,
      priceFont: "'Montserrat', sans-serif",
      priceSize: 60,
      priceWeight: '800',
      priceColor: '#000000',   // чёрная на белом блоке
      priceAlign: 'center',
      priceOffsetY: 0,
      price: '',
      currency: '',            // пустая по умолчанию — пользователь введёт сам
      subtitleColor: '#ffffff',
      subtitleSize: 13,
      subtitleWeight: '700',
      subtitleAlign: 'left',
      headerBg: '#ffffff',     // белый фон шапки = поля 4 мм вокруг графики
      bgImage: 'sort_nedeli_bg.jpg',
      customBgData: null,
      headerHeight: 90,
      layout: 'full',
      borderMm: 4,             // белая рамка 4 мм вокруг графики (поля под обрез)
      layerRotate: -2.45,      // наклон цены и текста акции как у графики
      // Позиции слоёв (мм, относительно базовой flex-раскладки header-content):
      // цена сдвинута ВВЕРХ — на белый блок (верхняя треть ценника),
      // название акции — ВНИЗ, в красную зону под белым блоком.
      labelPos: {
        title: { x: -1.2, y: 22 },
        subtitle: { x: 0, y: 0 },
        price: { x: -7.3, y: -41.6 },
        priceDigits: [],
        currency: { x: 0, y: 0 }
      },
      // Safe-зона названия — красная зона под белым блоком. Доли от сторон шапки.
      titleSafe: { left: 0.010129539709908075, right: 0.04710601613004029, top: 0.45, bottom: 0.06 }
    },
    ryba: {
      name: 'Рыба',
      widthCm: 9.2,
      heightCm: 5.5,
      title: 'Судак вяленый',
      subtitle: '100гр',
      titleFont: "Arial, sans-serif",
      titleColor: '#ffffff',
      titleSize: 25,
      titleWeight: '800',
      titleItalic: false,
      titleAlign: 'center',
      titleOffsetY: 0,
      subtitleColor: '#ffffff',
      subtitleSize: 13,
      subtitleWeight: '700',
      subtitleAlign: 'left',
      showPrice: true,
      priceFont: "Arial, sans-serif",
      priceSize: 40,
      priceWeight: '800',
      priceColor: '#000000',
      priceAlign: 'center',
      priceOffsetY: 1,
      price: '300',
      currency: '₽',
      headerBg: '#000000',
      bgImage: 'ryba_bg.jpg',
      customBgData: null,
      headerHeight: 90,
      // Safe-зона названия Рыбы (выставлена вручную в визуальном редакторе границ
      // поверх ryba_bg.jpg): не наезжать на логотип «МЕСТОПИВО» сверху (top 0.29),
      // на колосья/печать по бокам (left ≈0.198, right ≈0.190) и на белые декор-
      // прямоугольники внизу (bottom 0.4). Доли от сторон шапки.
      titleSafe: { left: 0.197711156045666, right: 0.18955861343090596, top: 0.29, bottom: 0.4 },
      layout: 'full',
      priceInBottom: false,
      subtitleCorner: true,
      pricePlate: false,
      decorOutsideShow: false,
      decorOutsideText: 'НОВИНКА',
      decorOutsideBg: '#e63946',
      decorOutsideBgImg: 'none',
      decorOutsideCustomBg: null,
      decorOutsideColor: '#ffffff',
      decorOutsideFontSize: 14,
      decorOutsideHeight: 12,
      decorInsideShow: false,
      decorInsideText: 'НОВИНКА',
      decorInsideBg: '#e63946',
      decorInsideBgImg: 'none',
      decorInsideCustomBg: null,
      decorInsideColor: '#ffffff',
      decorInsideFontSize: 11,
      decorInsideHeight: 8,
      decorInsideWidth: 50,
      decorBottomShow: false,
      decorBottomText: 'НОВИНКА',
      decorBottomBg: '#e63946',
      decorBottomBgImg: 'none',
      decorBottomCustomBg: null,
      decorBottomColor: '#ffffff',
      decorBottomFontSize: 14,
      decorBottomHeight: 12,
      labelPos: { title: { x: 0, y: -1.1 }, subtitle: { x: -0.6, y: -1 }, price: { x: 0, y: 0 }, priceDigits: [ { x: -5.5, y: 0.2 }, { x: -1.1, y: 0 }, { x: 3.6, y: 0 } ], currency: { x: 5.5, y: 0.6 } }
    },
    // Снеки — копия Рыбы, масштабированная под размер 6,5×3,5 см (вместо 9,2×5,5).
    // Коэффициенты: по ширине sx=0.71 (x-смещения), по высоте sy=0.64 (кегли,
    // y-смещения, высоты декора). titleSafe — доли от шапки, без изменений.
    // Собственный фон sneki_bg.jpg (отдельный от Рыбы), цвета/шрифты/layout — как у Рыбы.
    sneki: {
      name: 'Снеки',
      widthCm: 6.5,
      heightCm: 3.5,
      title: 'Судак вяленый',
      subtitle: '100гр',
      titleFont: "Arial, sans-serif",
      titleColor: '#ffffff',
      titleSize: 28,
      titleWeight: '800',
      titleItalic: false,
      titleAlign: 'center',
      titleOffsetY: 0,
      subtitleColor: '#ffffff',
      subtitleSize: 9,
      subtitleWeight: '700',
      subtitleAlign: 'left',
      showPrice: true,
      priceFont: "Arial, sans-serif",
      priceSize: 26,
      priceWeight: '700',
      priceColor: '#000000',
      priceAlign: 'center',
      priceOffsetY: 1,
      price: '300',
      currency: '₽',
      headerBg: '#000000',
      bgImage: 'sneki_bg.jpg',
      customBgData: null,
      headerHeight: 90,
      titleSafe: { left: 0.22736126270890838, right: 0.16, top: 0.29, bottom: 0.4 },
      layout: 'full',
      priceInBottom: false,
      subtitleCorner: true,
      pricePlate: false,
      decorOutsideShow: false,
      decorOutsideText: 'НОВИНКА',
      decorOutsideBg: '#e63946',
      decorOutsideBgImg: 'none',
      decorOutsideCustomBg: null,
      decorOutsideColor: '#ffffff',
      decorOutsideFontSize: 9,
      decorOutsideHeight: 8,
      decorInsideShow: false,
      decorInsideText: 'НОВИНКА',
      decorInsideBg: '#e63946',
      decorInsideBgImg: 'none',
      decorInsideCustomBg: null,
      decorInsideColor: '#ffffff',
      decorInsideFontSize: 7,
      decorInsideHeight: 5,
      decorInsideWidth: 50,
      decorBottomShow: false,
      decorBottomText: 'НОВИНКА',
      decorBottomBg: '#e63946',
      decorBottomBgImg: 'none',
      decorBottomCustomBg: null,
      decorBottomColor: '#ffffff',
      decorBottomFontSize: 14,
      decorBottomHeight: 12,
      labelPos: { title: { x: -0.2, y: -0.7 }, subtitle: { x: -2.1, y: -0.6 }, price: { x: 0, y: 0 }, priceDigits: [ { x: -3.9, y: 0.5 }, { x: -0.8, y: 0.4 }, { x: 1.7, y: 0.4 } ], currency: { x: 3.7, y: 0.3 } }
    }
  };

  let customTemplates = JSON.parse(localStorage.getItem('wobbler_custom_templates_gas') || '[]');
  // Индекс выбранного пользовательского шаблона (для «Обновить») или null
  let activeTemplateId = null;
  // Расширенная ссылка на выбранный шаблон: { kind: 'builtin'|'custom', key: <presetKey>|<index> }.
  // Позволяет «Обновить» работать и для встроенных пресетов (создаётся пользовательская копия).
  let activeTemplateRef = null;

  // Прогрессивные строки «Разных товаров»: показываем столько строк, сколько
  // заполнено, + одну рабочую пустую снизу. При вводе в рабочую пустую строку
  // появляется следующая; при очистке — лишние пустые хвосты схлопываются.
  // Мутации делаем прямо по itemsData (это let-ссылка на templateItems[key]),
  // НЕ переприсваивая массив, чтобы не оторваться от хранилища шаблона.

  // Приводит itemsData к каноничному виду: ≤1 пустой строки в хвосте, но если
  // последний элемент заполнен — добавляем одну рабочую пустую. Идемпотентно.
  function normalizeItemsArray() {
    // Гарантируем поля subtitle/subtitleManual у существующих элементов.
    for (let i = 0; i < itemsData.length; i++) {
      if (itemsData[i] && itemsData[i].subtitle === undefined) itemsData[i].subtitle = '';
      if (itemsData[i] && itemsData[i].subtitleManual === undefined) itemsData[i].subtitleManual = false;
    }
    // Убираем лишние пустые строки в хвосте, пока не останется ровно одна.
    while (itemsData.length > 1 && isItemEmpty(itemsData[itemsData.length - 1])
                                 && isItemEmpty(itemsData[itemsData.length - 2])) {
      itemsData.pop();
    }
    // Если последний элемент заполнен — добавляем одну рабочую пустую.
    if (itemsData.length === 0 || isItemFilled(itemsData[itemsData.length - 1])) {
      itemsData.push(freshItem());
    }
  }

  // Инкрементальное обновление длины списка без полной перерисовки (чтобы не
  // сбрасывать фокус/каретку при вводе). Вызывается из input-обработчиков строки.
  function syncRowExtent(idx) {
    if (idx < 0 || idx >= itemsData.length) return;
    // 1) Схлопываем лишние пустые в хвосте (≥2 подряд пустых) при очистке строки.
    //    Строку с фокусом не удаляем — убираем только дублирующие пустые ниже.
    if (isItemEmpty(itemsData[idx])) {
      while (itemsData.length > 1 && isItemEmpty(itemsData[itemsData.length - 1])
                                   && isItemEmpty(itemsData[itemsData.length - 2])) {
        itemsData.pop();
        const rows = itemsListContainer.querySelectorAll('.item-row');
        if (rows[rows.length - 1]) rows[rows.length - 1].remove();
      }
    }
    // 2) Гарантируем ОДНУ рабочую пустую строку внизу после любого ввода.
    //    Ввели товар в любую строку (включая среднюю «дыру» после очистки) и
    //    последний элемент оказался заполненным — добавляем новую пустую для
    //    ввода следующего товара. labelPos копируем с ценника №1 (база шаблона).
    if (itemsData.length === 0 || isItemFilled(itemsData[itemsData.length - 1])) {
      const newItem = freshItem();
      newItem.labelPos = sharedLabelPosForNewItem();
      itemsData.push(newItem);
      itemsListContainer.appendChild(createItemRow(itemsData.length - 1));
    }
  }

  // Создаёт один DOM-элемент строки .item-row для индекса i (со всеми
  // обработчиками фокуса/ввода, авто-ростом textarea и кнопкой ⚙).
  function createItemRow(i) {
    const item = itemsData[i] || freshItem();
    if (itemsData[i] && itemsData[i].subtitle === undefined) itemsData[i].subtitle = '';
    if (itemsData[i] && itemsData[i].subtitleManual === undefined) itemsData[i].subtitleManual = false;
    const row = document.createElement('div');
    row.className = 'item-row';
    const safeTitle = (item.title || '').replace(/"/g, '&quot;');
    const safeSub = (item.subtitle || '').replace(/"/g, '&quot;');
    const safePrice = (item.price || '').replace(/"/g, '&quot;');
    row.innerHTML = `
      <span class="item-num">${i + 1}</span>
      <textarea class="item-title-input" rows="1" placeholder="Наименование товара №${i + 1}" data-index="${i}">${safeTitle}</textarea>
      <textarea class="item-subtitle-input" rows="1" placeholder="Вес" data-index="${i}">${safeSub}</textarea>
      <textarea class="item-price-input" rows="1" placeholder="Цена" data-index="${i}">${safePrice}</textarea>
      <button type="button" class="item-delete-btn" data-index="${i}" title="Удалить товар №${i + 1}">✕</button>
    `;

    row.querySelector('.item-title-input').addEventListener('focus', () => {
      activePreviewIndex = i;
      syncFontControlsToContext();
      syncDecorControlsToContext();
      syncBgControlsToContext();
      updatePreview();
    });

    row.querySelector('.item-title-input').addEventListener('input', (e) => {
      const idx = parseInt(e.target.getAttribute('data-index'), 10);
      itemsData[idx].title = e.target.value;
    // Авто-вес «100гр»: пока пользователь не правил вес вручную,
    // подставляем дефолт при наличии наименования (и очищаем при пустом).
    // Действует ТОЛЬКО для встроенных шаблонов «Рыба» и «Снеки» — у прочих
    // (Бутылки, Воблеры) поле веса остаётся пустым до ручного ввода.
    const isRybaFamily = activeTemplateRef && activeTemplateRef.kind === 'builtin'
      && (activeTemplateRef.key === 'ryba' || activeTemplateRef.key === 'sneki');
    if (isRybaFamily && !itemsData[idx].subtitleManual) {
      itemsData[idx].subtitle = e.target.value.trim() ? '100гр' : '';
      const si = row.querySelector('.item-subtitle-input');
      if (si) si.value = itemsData[idx].subtitle;
    }
      activePreviewIndex = idx;
      // Подгон кегля под перенос названия по словам — сразу при вводе.
      refitActiveTitle();
      // Прогрессивный рост/схлопывание строк по факту ввода.
      syncRowExtent(idx);
    });

    const subInput = row.querySelector('.item-subtitle-input');
    if (subInput) {
      subInput.addEventListener('focus', () => {
        activePreviewIndex = i;
        syncFontControlsToContext();
        syncDecorControlsToContext();
        syncBgControlsToContext();
        updatePreview();
      });
      subInput.addEventListener('input', (e) => {
        const idx = parseInt(e.target.getAttribute('data-index'), 10);
        itemsData[idx].subtitle = e.target.value;
        // Пользователь ввёл вес сам — больше не перезаписываем авто-значением.
        itemsData[idx].subtitleManual = true;
        activePreviewIndex = idx;
        syncRowExtent(idx);
        updatePreview();
      });
    }

    row.querySelector('.item-price-input').addEventListener('focus', () => {
      activePreviewIndex = i;
      syncFontControlsToContext();
      syncDecorControlsToContext();
      syncBgControlsToContext();
      updatePreview();
    });

    row.querySelector('.item-price-input').addEventListener('input', (e) => {
      const idx = parseInt(e.target.getAttribute('data-index'), 10);
      itemsData[idx].price = e.target.value;
      activePreviewIndex = idx;
      syncRowExtent(idx);
      updatePreview();
    });

    // Кнопка ✕ удаляет строку товара целиком (с перенумерацией нижних).
    // Мутируем массив на месте (splice), чтобы сохранить ссылку templateItems[key].
    const deleteBtn = row.querySelector('.item-delete-btn');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => {
        const idx = parseInt(deleteBtn.getAttribute('data-index'), 10);
        if (isNaN(idx) || idx < 0 || idx >= itemsData.length) return;
        // Не даём удалить единственную рабочую строку — иначе список опустеет.
        if (itemsData.length <= 1) return;
        itemsData.splice(idx, 1);
        // Корректируем активный индекс под новый состав списка.
        if (idx < activePreviewIndex) activePreviewIndex--;
        if (activePreviewIndex >= itemsData.length) activePreviewIndex = Math.max(0, itemsData.length - 1);
        renderItemsListInputs();   // полный re-render с перенумерацией
        syncFontControlsToContext();
        syncDecorControlsToContext();
        syncBgControlsToContext();
        updatePreview();
      });
    }

    // Авто-рост полей таблицы под содержимое (перенос строки удлиняет поле).
    row.querySelectorAll('textarea').forEach(el => {
      autoGrowTextarea(el);
      el.addEventListener('input', () => autoGrowTextarea(el));
    });

    return row;
  }

  // Render Multi-Item Rows (прогрессивно: заполненные + 1 рабочая пустая).
  function renderItemsListInputs() {
    normalizeItemsArray();
    itemsListContainer.innerHTML = '';
    for (let i = 0; i < itemsData.length; i++) {
      itemsListContainer.appendChild(createItemRow(i));
    }
  }

  // Parse Excel text paste
  applyPasteBtn.addEventListener('click', () => {
    const text = pasteExcelArea.value.trim();
    if (!text) return;

    // Вставка ЗАМЕНЯЕТ текущий список, а не дописывает: обрезаем массив до 0 и
    // заполняем заново по строкам. Мягкий потолок MAX_ITEMS защищает от случайной
    // вставки очень большой таблицы.
    itemsData.length = 0;
    const lines = text.split(/\r?\n/);
    lines.forEach((line, index) => {
      if (index >= MAX_ITEMS) return;
      let parts = line.split('\t');
      // Если столбцов 3+ — считаем что 2-й это «Вес/доп. текст», последний — цена.
      // Если 2 — наименование и цена. Если 1 — только наименование.
      if (parts.length === 1) {
        const match = line.match(/^(.*?)\s+([\d\s₽,.]+)\s*$/);
        if (match) {
          parts = [match[1], '', match[2]];
        } else {
          parts = [line, '', ''];
        }
      } else if (parts.length === 2) {
        parts = [parts[0], '', parts[1]];
      }
      // parts.length >= 3: title, subtitle, price(=последний)
      const priceStr = parts[2] ? parts[2].replace(/[^\d]/g, '') : '';
      const subVal = parts[1].trim();
      itemsData.push({
        title: parts[0].trim(),
        subtitle: subVal,
        price: priceStr,
        // Непустой вес из вставки — считаем ручным вводом (не перезаписывать).
        subtitleManual: !!subVal
      });
    });

    // normalizeItemsArray добавит рабочую пустую строку снизу и уберёт хвосты.
    renderItemsListInputs();
    updatePreview();
    autoFitFontSize();
  });

  // Очистка всей таблицы «Разные товары»: оставляем одну рабочую пустую строку.
  const clearAllItemsBtn = document.getElementById('clearAllItemsBtn');
  if (clearAllItemsBtn) {
    clearAllItemsBtn.addEventListener('click', () => {
      if (!confirm('Очистить все товары в таблице?')) return;
      // Мутируем массив на месте (не переприсваиваем), чтобы остаться ссылкой
      // на templateItems[key]. Сбрасываем смещения ценников в дефолт.
      itemsData.length = 0;
      itemsData.push({ ...freshItem(), labelPos: defaultLabelPos() });
      if (pasteExcelArea) pasteExcelArea.value = '';
      renderItemsListInputs();
      updatePreview();
    });
  }

  // Синхронизация расположения ВЕСА и ЦЕНЫ (сдвиг блоков, позиции цифр цены,
  // валюта) с ценника №1 на все остальные (#2–18). Поля наименования НЕ трогаются
  // (у каждого ценника — свой заголовок и свой кегль).
  // По ТЗ вес и цена на всех ценниках должны совпадать с №1, а двигать их можно
  // на любом ценнике — движение копируется на все. Источник синхронизации —
  // ценник №1 (как образец); обновление активного ценника само «проталкивает»
  // его позиции в №1 (см. syncSharedPosFromActive).
  function applySharedPosFromFirstToAll() {
    const src = itemsData[0] || (itemsData[0] = {});
    if (!src.labelPos) src.labelPos = defaultLabelPos();
    // Глубокий клон общих полей источника (наименование + вес + цена + цифры + валюта).
    const srcTitle = JSON.parse(JSON.stringify(src.labelPos.title));
    const srcSub = JSON.parse(JSON.stringify(src.labelPos.subtitle));
    const srcPrice = JSON.parse(JSON.stringify(src.labelPos.price));
    const srcDigits = JSON.parse(JSON.stringify(src.labelPos.priceDigits));
    const srcCurrency = JSON.parse(JSON.stringify(src.labelPos.currency));
    itemsData.forEach((it, i) => {
      if (i === 0 || !it) return;
      if (!it.labelPos) it.labelPos = defaultLabelPos();
      it.labelPos.title = JSON.parse(JSON.stringify(srcTitle));
      it.labelPos.subtitle = JSON.parse(JSON.stringify(srcSub));
      it.labelPos.price = JSON.parse(JSON.stringify(srcPrice));
      it.labelPos.priceDigits = JSON.parse(JSON.stringify(srcDigits));
      it.labelPos.currency = JSON.parse(JSON.stringify(srcCurrency));
    });
    updatePreview();
  }

  // Эталонные позиции надписей для НОВОЙ строки «Разных товаров»: глубокий клон
  // labelPos ценника №1 — именно туда applyState/applySharedPosFromFirstToAll
  // кладёт базу активного шаблона. Без этого новая строка получала бы defaultLabelPos()
  // (всё по нулям) и теряла настройки расположения шаблона. Если у [0] ещё нет
  // labelPos — возвращаем дефолт.
  function sharedLabelPosForNewItem() {
    const src = itemsData[0];
    if (src && src.labelPos) return JSON.parse(JSON.stringify(src.labelPos));
    return defaultLabelPos();
  }

  // «Протолкнуть» общие позиции (вес + цена) с АКТИВНОГО ценника в ценник №1,
  // затем разнести №1 по всем остальным. Так движение на любом ценнике
  // мгновенно применяется ко всем (включая №1).
  function syncSharedPosFromActive() {
    const isMultiMode = document.querySelector('input[name="printMode"]:checked').value === 'multi';
    if (!isMultiMode) return;
    const src = itemsData[activePreviewIndex];
    if (!src || !src.labelPos) return;
    if (activePreviewIndex !== 0) {
      const first = itemsData[0] || (itemsData[0] = {});
      if (!first.labelPos) first.labelPos = defaultLabelPos();
      first.labelPos.title = JSON.parse(JSON.stringify(src.labelPos.title));
      first.labelPos.subtitle = JSON.parse(JSON.stringify(src.labelPos.subtitle));
      first.labelPos.price = JSON.parse(JSON.stringify(src.labelPos.price));
      first.labelPos.priceDigits = JSON.parse(JSON.stringify(src.labelPos.priceDigits));
      first.labelPos.currency = JSON.parse(JSON.stringify(src.labelPos.currency));
    }
    applySharedPosFromFirstToAll();
  }

  // Кнопка «Выровнять цену по №1» убрана из блока «Разные товары».
  // Дубликат в панели превью (syncPricePosPreviewBtn) остаётся.

  // Размер шрифта наименования по количеству символов (эмпирическая шкала).
  // Короткое название → крупный кегль, длинное → уменьшаем до минимума 8pt.
  // minSize — необязательный нижний порог (например, для шаблона «Рыба» = 22pt).
  function titleSizeByLen(len, minSize) {
    let sz;
    if (len <= 12) sz = 18;
    else if (len <= 18) sz = 16;
    else if (len <= 24) sz = 14;
    else if (len <= 30) sz = 12;
    else if (len <= 40) sz = 11;
    else if (len <= 52) sz = 10;
    else sz = 8;   // длинные названия — минимальный кегль
    return Math.max(sz, minSize || 0);
  }

  // Подбор кегля наименования под размер ценника. .wobbler-title — это flex с
  // прямой текстовой нодой, в котором перенос слов и scrollHeight ведут себя
  // ненадёжно (анонимный flex-item не сжимается под min-width:auto). Поэтому
  // замеряем высоту на отдельном скрытом block-зонде с теми же текстовыми
  // стилями и шириной = ширине зоны названия; блочный контекст корректно
  // переносит текст по словам. Бинарным поиском находим максимальный целый pt,
  // при котором высота зонируемого текста ≤ бюджету (--title-zone-h).
  // Возвращает null, если замер невозможен (нет бюджета/текста).
  const TITLE_FIT_MAX = 72;   // верх слайдера titleSize
  let __titleProbe = null;
  function getTitleProbe(budgetW) {
    if (!__titleProbe) {
      __titleProbe = document.createElement('div');
      __titleProbe.setAttribute('aria-hidden', 'true');
      // Совпадает с финальным рендером (.wobbler-title): перенос по словам,
      // тот же line-height/letter-spacing, но блочный (чтобы замер был точен).
      __titleProbe.style.cssText =
        'position:absolute; left:-99999px; top:0; visibility:hidden;' +
        'display:block; height:auto; width:0; text-align:center;' +
        'line-height:1.1; letter-spacing:-0.2px; white-space:pre-line;' +
        'word-break:normal; overflow-wrap:anywhere; margin:0; padding:0;';
      document.body.appendChild(__titleProbe);
    }
    if (budgetW) __titleProbe.style.width = `${budgetW}px`;
    return __titleProbe;
  }

  // Максимальная ширина цифры (0–9) в шрифте цены эталонного элемента — чтобы
  // все цифры цены (и пробел) занимали одинаковое место. Берём максимум: широкая
  // «0»/«8» помещается без обрезки, узкие цифры и пробел равны ей по ширине.
  // Замеряем настоящие <span class="price-digit"> (10 штук, 0–9), добавленные в
  // refEl вне потока (position:absolute). Берём scrollWidth — это полная ширина
  // содержимого глифа (включая выступающие за advance части «0»/«8»), поэтому
  // пробел получит ту же ширину, что и самая широкая цифра, а сами цифры (без
  // overflow:hidden) не обрежутся.
  function maxPriceDigitWidth(refEl) {
    try {
      if (!refEl) return null;
      const probes = [];
      let max = 0;
      for (let i = 0; i <= 9; i++) {
        const span = document.createElement('span');
        span.className = 'price-digit';
        span.setAttribute('aria-hidden', 'true');
        // Вне потока, скрыт; min-width снимаем, чтобы замерить чистую ширину
        // глифа, а не запас из CSS-переменной.
        span.style.cssText =
          'position:absolute;left:-99999px;top:0;visibility:hidden;' +
          'min-width:0 !important;width:auto !important;overflow:visible !important;';
        span.textContent = String(i);
        refEl.appendChild(span);
        probes.push(span);
        const w = span.scrollWidth;
        if (w > max) max = w;
      }
      probes.forEach(p => p.remove());
      return max > 0 ? max : null; // px
    } catch (e) {
      return null;
    }
  }

  function fitTitleSize(text, family, weight) {
    if (!text || !text.trim()) return null;
    if (!previewTitle) return null;
    const budgetW = previewTitle.clientWidth;
    const budgetH = previewTitle.clientHeight;
    if (!budgetW || !budgetH) return null;

    // Нижний пол кегля. Абсолютный минимум читаемости — минимум слайдера (7pt).
    const ABS_MIN = 7;
    // Для встроенных шаблонов «Снеки» (6,5×3,5 см) и «Рыба» (9,2×5,5 см)
    // пол НЕ привязываем к допущению «максимум 2 строки»: длинные названия
    // переносятся на 3+ строк, и прежняя формула budgetH/2.93 (кегль для 2 строк)
    // не давала бинарному поиску опуститься достаточно — 3-строчный текст обрезался
    // overflow:hidden и становился невидимым. Фиксированный эстетический минимум
    // 10pt: бинарный поиск находит НАИБОЛЬШИЙ кегль в [10, 32], при котором
    // ИЗМЕРЕННАЯ высота перенесённого текста (любого числа строк) ≤ зоны (budgetH).
    // Приоритет — читаемость: всегда максимально крупный шрифт, помещающийся целиком.
    // Кастомные копии (kind === 'custom') остаются на старом фиксированном поле.
    const isBuiltinRybaFamily = activeTemplateRef
      && activeTemplateRef.kind === 'builtin'
      && (activeTemplateRef.key === 'sneki' || activeTemplateRef.key === 'ryba');
    const RYBA_FAMILY_MIN = 10;
    const floor = isBuiltinRybaFamily
      ? RYBA_FAMILY_MIN
      : (subtitleCorner ? 22 : ABS_MIN);

    const probe = getTitleProbe(budgetW);
    probe.style.fontFamily = family || '';
    probe.style.fontWeight = weight || '800';
    probe.textContent = text;

    let best = floor;
    let lo = floor, hi = TITLE_FIT_MAX;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      probe.style.fontSize = `${mid}pt`;
      // Текст помещается, если его реальная высота не превышает зону названия.
      // Слабину +1px убрали: при overflow:hidden даже 1px превышения обрезается.
      if (probe.offsetHeight <= budgetH) { best = mid; lo = mid + 1; }
      else { hi = mid - 1; }
    }
    return best;
  }

  // Переподбор кегля активного товара и запись результата туда же, откуда
  // читает activeItemTitleSize (per-item в multi, слайдер в single).
  // Слайдер не вызывает эту функцию — ручная правка держится до ввода текста/шрифта.
  function refitActiveTitle() {
    const isMultiMode = document.querySelector('input[name="printMode"]:checked').value === 'multi';
    const family = titleFont ? titleFont.value : '';
    const weight = titleWeight ? titleWeight.value : '800';
    if (isMultiMode) {
      const it = itemsData[activePreviewIndex] || (itemsData[activePreviewIndex] = {});
      const fit = fitTitleSize(it.title, family, weight);
      if (fit != null) it.titleSize = fit;
    } else {
      const fit = fitTitleSize(inputTitle ? inputTitle.value : '', family, weight);
      if (fit != null) {
        titleSize.value = String(fit);
        if (titleSizeVal) titleSizeVal.textContent = String(fit);
        syncTitleSizePreview();
      }
    }
    updatePreview();
  }

  // Размер шрифта веса/доп.текста по длине (короткий → крупнее).
  function subtitleSizeByLen(len) {
    if (len <= 6) return 13;
    if (len <= 12) return 11;
    if (len <= 20) return 9;
    return 8;
  }

  // Размер шрифта цены по числу цифр (короткая → крупнее).
  function priceSizeByLen(digitCount) {
    if (digitCount <= 2) return 48;
    if (digitCount <= 3) return 40;
    if (digitCount <= 4) return 34;
    return 28;
  }

  // "Подогнать шрифт" — подбирает размер КАЖДОЙ надписи по своей длине:
  // наименование, вес/доп.текст и цену — независимо друг от друга.
  // Наименование в режиме «Разные товары» получает СВОЙ размер (per-item) по
  // длине названия; вес и цена — глобальный размер по активному товару.
  function autoFitFontSize() {
    const isMultiMode = document.querySelector('input[name="printMode"]:checked').value === 'multi';
    // Для встроенного шаблона «Снеки» кнопка умная: подбирает ТОЛЬКО кегль
    // наименования. Толщину шрифта и цену она больше не меняет
    // (кастомные копии Снеки на это не подпадают — только встроенный).
    const isSneki = activeTemplateRef && activeTemplateRef.kind === 'builtin' && activeTemplateRef.key === 'sneki';

    if (!isSneki) {
      // Наименование — Bold (800), доп. сдвиг не нужен (зона фиксирована).
      // Для шаблона «Рыба» (subtitleCorner) наименование не мельче 22pt —
      // этот пол зашит внутри fitTitleSize().
      titleWeight.value = '800';
      titleOffsetY.value = 0;
      titleOffsetYVal.textContent = '0';
    }

    if (isMultiMode) {
      // Per-item: каждому товару — свой кегль под перенос его названия по словам.
      // fitTitleSize измеряет на превью активного ценника; для прочих берём
      // их текст с тем же шрифтом/толщиной — бюджет зоны одинаков у всех ценников.
      const family = titleFont ? titleFont.value : '';
      itemsData.forEach(it => {
        if (!it) return;
        const fit = fitTitleSize(it.title, family, '800');
        if (fit != null) it.titleSize = fit;
      });
      // Активный товар отражаем в слайдере.
      const active = itemsData[activePreviewIndex];
      if (active) {
        const sz = activeItemTitleSize(active);
        titleSize.value = String(sz);
        titleSizeVal.textContent = String(sz);
        syncTitleSizePreview();
      }
    } else {
      const fit = fitTitleSize(inputTitle.value, titleFont ? titleFont.value : '', '800');
      if (fit != null) {
        titleSize.value = String(fit);
        titleSizeVal.textContent = String(fit);
        syncTitleSizePreview();
      }
    }

    if (!isSneki) {
      // Вес/доп.текст — глобальный размер по длине активного товара (независимо).
      const activeSub = isMultiMode
        ? ((itemsData[activePreviewIndex] && itemsData[activePreviewIndex].subtitle) || '')
        : (inputSubtitle ? inputSubtitle.value : '');
      const subOpt = subtitleSizeByLen(activeSub.trim().length);
      if (subtitleSize) {
        subtitleSize.value = String(subOpt);
        if (subtitleSizeVal) subtitleSizeVal.textContent = String(subOpt);
      }

      // Цена — глобальный размер по числу цифр активного товара (независимо).
      const activePrice = isMultiMode
        ? ((itemsData[activePreviewIndex] && itemsData[activePreviewIndex].price) || '')
        : inputPrice.value;
      const priceOpt = priceSizeByLen(activePrice.replace(/\D/g, '').length);
      // Для шаблона «Рыба» (subtitleCorner) цена не крупнее 40pt.
      const priceOptCapped = subtitleCorner ? Math.min(priceOpt, 40) : priceOpt;
      priceSize.value = String(priceOptCapped);
      priceSizeVal.textContent = String(priceOptCapped);
    }

    updatePreview();
  }

  autoFitFontBtn.addEventListener('click', autoFitFontSize);

  // Calculate maximum fitting wobblers on A4 (поля печати: 5 мм сверху, по 2 мм
  // снизу/слева/справа; зазор между ценниками gapMm задаётся слайдером; при 0
  // ценники печатаются встык).
  // Формула числа ячеек в ряду: n*w + (n-1)*g ≤ pageW  →  n = floor((pageW + g)/(w + g)).
  function calcA4Grid(wMm, hMm) {
    const mTop = 5, mBottom = 2, mSide = 2; // верх 5 мм, низ/бока 2 мм
    const g = gapMm();
    const pageW = 210 - mSide * 2;       // 206
    const pageH = 297 - mTop - mBottom;  // 290
    const cols = Math.max(1, Math.floor((pageW + g) / (wMm + g)));
    const rows = Math.max(1, Math.floor((pageH + g) / (hMm + g)));
    return { cols, rows, maxCount: cols * rows };
  }

  // Высота внешнего/внутреннего декоративного блока в мм (задаётся слайдером).
  // Безопасный fallback: если слайдера нет/пусто — значение по умолчанию.
  function decorOutsideHeightMm() {
    const v = parseFloat(decorOutsideHeight && decorOutsideHeight.value);
    return isNaN(v) ? 12 : v;
  }
  function decorInsideHeightMm() {
    const v = parseFloat(decorInsideHeight && decorInsideHeight.value);
    return isNaN(v) ? 8 : v;
  }
  function decorBottomHeightMm() {
    const v = parseFloat(decorBottomHeight && decorBottomHeight.value);
    return isNaN(v) ? 12 : v;
  }
  // Зазор между ценниками на листе А4 (мм). Безопасный fallback 0 (встык).
  function gapMm() {
    const v = parseFloat(gapInput && gapInput.value);
    return isNaN(v) ? 0 : v;
  }

  // Высота карточки для раскладки А4: ценник + внешние декоративные блоки
  // (СВЕРХУ и СНИЗУ, если показаны). Они не входят в размер ценника, но
  // печатаются, поэтому ячейка листа становится выше и ценников влезает меньше.
  // В мультирежиме берём ЕДИНУЮ высоту по максимуму: если хотя бы у одного
  // выводимого ценника включён блок — все ячейки получают ценник+блок,
  // ценники без блока оставляют пустое место.
  function effectiveCardHeight(hMm) {
    if (!isMultiModeNow()) {
      // Single-режим: глобальные блоки.
      const showOutside = !!(decorOutsideShow && decorOutsideShow.checked);
      const showBottom  = !!(decorBottomShow && decorBottomShow.checked);
      let h = hMm;
      if (showOutside) h += decorOutsideHeightMm();
      if (showBottom)  h += decorBottomHeightMm();
      return h;
    }
    // Мультирежим: максимум суммарной высоты внешних блоков (сверху+снизу) по товарам.
    let extra = 0;
    itemsData.forEach(it => {
      if (!it || !(it.title && it.title.trim())) return; // незаполненные не печатаются
      let perItem = 0;
      const outSnap = decorBlockFromItem(it, 'outside');
      const botSnap = decorBlockFromItem(it, 'bottom');
      if (outSnap.show) perItem += parseFloat(outSnap.height) || 0;
      if (botSnap.show) perItem += parseFloat(botSnap.height) || 0;
      if (perItem > extra) extra = perItem;
    });
    return hMm + extra;
  }

  // Применяет тексты товара и его ручные позиции (labelPos) к клону вобблера
  // (используется в превью листа и печати, чтобы каждый ценник нёс свои позиции).
  function applyItemToClone(clone, item, titleOffsetYVal, priceOffsetYVal) {
    // Позиции надписей товара. Если у товара нет своего labelPos (старые данные /
    // edge-кейсы), берём эталон с ценника №1 (база активного шаблона), а не дефолт,
    // — иначе такой ценник отрисуется со смещениями 0,0 вместо настроек шаблона.
    const lp = (item && item.labelPos)
      ? item.labelPos
      : (itemsData[0] && itemsData[0].labelPos) ? itemsData[0].labelPos : defaultLabelPos();
    const digits = String((item && item.price) || '').split('');

    const tElem = clone.querySelector('.wobbler-title');
    const pElem = clone.querySelector('.price-val');
    const sElem = clone.querySelector('.wobbler-subtitle');
    const box = clone.querySelector('.wobbler-price-box');
    const curr = clone.querySelector('.price-curr');

    if (tElem) {
      tElem.textContent = (item && item.title) || '';
      // === Per-item шрифты/цвета на клоне ===
      // Клон унаследовал стили активного ценника от живого #wobblerPreview,
      // поэтому здесь перезаписываем ВСЕ шрифтовые поля под этот товар.
      const tf = templateFonts || {};
      tElem.style.fontFamily = fontOf(item, 'titleFont', tf.titleFont);
      tElem.style.color = fontOf(item, 'titleColor', tf.titleColor);
      tElem.style.fontSize = `${activeItemTitleSize(item)}pt`;
      tElem.style.fontWeight = fontOf(item, 'titleWeight', tf.titleWeight);
      tElem.style.fontStyle = fontOf(item, 'titleItalic', tf.titleItalic) ? 'italic' : 'normal';
      tElem.style.textShadow = fontOf(item, 'titleShadow', tf.titleShadow);
      tElem.style.textAlign = fontOf(item, 'titleAlign', tf.titleAlign);
      const tOff = parseFloat(fontOf(item, 'titleOffsetY', tf.titleOffsetY != null ? tf.titleOffsetY : titleOffsetYVal)) || 0;
      tElem.style.transform = `translate(${lp.title.x}mm, ${tOff + lp.title.y}mm) rotate(${layerRotate}deg)`;
    }
    if (sElem) {
      const tf2 = templateFonts || {};
      sElem.textContent = (item && item.subtitle != null) ? item.subtitle : '';
      sElem.style.fontFamily = fontOf(item, 'titleFont', tf2.titleFont);
      sElem.style.color = fontOf(item, 'subtitleColor', tf2.subtitleColor);
      sElem.style.fontSize = `${fontOf(item, 'subtitleSize', tf2.subtitleSize != null ? tf2.subtitleSize : 11)}pt`;
      sElem.style.fontWeight = fontOf(item, 'subtitleWeight', tf2.subtitleWeight);
      sElem.style.textAlign = fontOf(item, 'subtitleAlign', tf2.subtitleAlign);
      sElem.style.transform = `translate(${lp.subtitle.x}mm, ${lp.subtitle.y}mm)`;
    }
    // Цена: пересобираем по цифрам с позициями priceDigits.
    if (pElem) {
      while (lp.priceDigits.length < digits.length) lp.priceDigits.push({ x: 0, y: 0 });
      pElem.innerHTML = '';
      digits.forEach((d, idx) => {
        const span = document.createElement('span');
        // Пробел — полноценный символ: nbsp + класс .price-space (ширина цифры).
        const isSpace = d === ' ';
        span.className = 'price-digit' + (isSpace ? ' price-space' : '');
        span.textContent = isSpace ? '\u00A0' : d;
        const dp = lp.priceDigits[idx];
        span.style.transform = `translate(${dp.x}mm, ${dp.y}mm)`;
        pElem.appendChild(span);
      });
    }
    if (curr) {
      const tf3 = templateFonts || {};
      curr.textContent = (fontOf(item, 'currency', tf3.currency != null ? tf3.currency : '') || '').trim();
      curr.style.fontFamily = fontOf(item, 'priceFont', tf3.priceFont);
      curr.style.fontSize = `${fontOf(item, 'priceSize', tf3.priceSize != null ? tf3.priceSize : 40)}pt`;
      curr.style.fontWeight = fontOf(item, 'priceWeight', tf3.priceWeight);
      curr.style.color = fontOf(item, 'priceColor', tf3.priceColor);
      curr.style.textShadow = fontOf(item, 'priceShadow', tf3.priceShadow);
      curr.style.transform = `translate(${lp.currency.x}mm, ${lp.currency.y}mm)`;
    }
    if (pElem) {
      const tf4 = templateFonts || {};
      pElem.style.fontFamily = fontOf(item, 'priceFont', tf4.priceFont);
      pElem.style.fontSize = `${fontOf(item, 'priceSize', tf4.priceSize != null ? tf4.priceSize : 40)}pt`;
      pElem.style.fontWeight = fontOf(item, 'priceWeight', tf4.priceWeight);
      pElem.style.color = fontOf(item, 'priceColor', tf4.priceColor);
      pElem.style.textShadow = fontOf(item, 'priceShadow', tf4.priceShadow);
      // Все цифры цены одинаковой ширины — как самая широкая (свой размер на каждый item).
      {
        const __pw4 = maxPriceDigitWidth(pElem);
        if (__pw4) pElem.style.setProperty('--price-digit-w', `${__pw4}px`);
      }
    }
    if (box) {
      const tf5 = templateFonts || {};
      const priceAlign = fontOf(item, 'priceAlign', tf5.priceAlign || 'center');
      box.style.justifyContent = priceAlign === 'left' ? 'flex-start' : (priceAlign === 'right' ? 'flex-end' : 'center');
      const yOffset = (parseFloat(fontOf(item, 'priceOffsetY', tf5.priceOffsetY != null ? tf5.priceOffsetY : priceOffsetYVal)) || 0) + lp.price.y;
      box.style.transform = `translate(${lp.price.x}mm, ${yOffset}mm) rotate(${layerRotate}deg)`;
    }

    // === Per-item оформление и фон ===
    // Клон наследует живой #wobblerPreview (с настройками активного ценника).
    // Здесь перезаписываем фон/декор-блоки под конкретный товар ценника.
    const outSnap = decorBlockFromItem(item, 'outside');
    const inSnap = decorBlockFromItem(item, 'inside');
    const botSnap = decorBlockFromItem(item, 'bottom');
    const bgSnap = bgFromItem(item);

    // Фон ценника (хедер).
    const cloneHeader = clone.querySelector('.wobbler-header');
    if (cloneHeader) applyBackgroundTo(cloneHeader, bgSnap.bgImage, bgSnap.customBg, bgSnap.headerBg);
    // Белая рамка вокруг графики фона (borderMm мм) — для клонов раскладки/печати.
    if (borderMm > 0) {
      cloneHeader.style.padding = `${borderMm}mm`;
      cloneHeader.style.backgroundOrigin = 'content-box';
      cloneHeader.style.backgroundClip = 'content-box';
      clone.classList.add('has-border');
    }

    // CSS-переменные высот блоков — на самом клоне (локально, не глобально).
    const outH = parseFloat(outSnap.height) || 0;
    const inH = parseFloat(inSnap.height) || 0;
    const botH = parseFloat(botSnap.height) || 0;
    clone.style.setProperty('--outside-top-h', `${outH.toFixed(2)}mm`);
    clone.style.setProperty('--inside-top-h', `${inH.toFixed(2)}mm`);
    clone.style.setProperty('--outside-bottom-h', `${botH.toFixed(2)}mm`);
    clone.style.setProperty('--inside-top-w', `${(inSnap.width != null ? inSnap.width : 50)}%`);
    clone.classList.toggle('has-outside-top', !!outSnap.show);
    clone.classList.toggle('has-inside-top', !!inSnap.show);
    clone.classList.toggle('has-outside-bottom', !!botSnap.show);

    // Рендер декоративных блоков клона (фон/текст под конкретный товар).
    function applyCloneDecorBlock(blockEl, snap) {
      if (!blockEl) return;
      if (snap.show) {
        blockEl.style.display = 'flex';
        applyBackgroundTo(blockEl, snap.bgImg, snap.customBg, snap.bg);
        const txt = blockEl.querySelector('.block-text');
        if (txt) {
          txt.textContent = snap.text || '';
          txt.style.color = snap.color || '#ffffff';
          txt.style.fontSize = `${snap.fontSize || 12}pt`;
        }
      } else {
        blockEl.style.display = 'none';
      }
    }
    applyCloneDecorBlock(clone.querySelector('.wobbler-outside-top'), outSnap);
    applyCloneDecorBlock(clone.querySelector('.wobbler-inside-top'), inSnap);
    applyCloneDecorBlock(clone.querySelector('.wobbler-outside-bottom'), botSnap);

    // Safe-зона названия — per-item на клоне (локально переопределяет глобальные
    // --title-safe-w / --title-zone-h, унаследованные от :root). Так в раскладке
    // и печати каждый ценник считает кегль по своей safe-зоне.
    const ts = bgSnap.titleSafe;
    // headerHm/размеры для клона = как в updatePreview (currentLayout/height глобальны).
    const _w = parseFloat(wobblerWidthInput.value) || 6.5;
    const _h = parseFloat(wobblerHeightInput.value) || 4.5;
    const _hh = currentLayout === 'full' ? _h * 10 : _h * 10 * ((parseInt(headerHeightRange.value, 10) || 50) / 100);
    const _pib = rybaPriceInBottom && currentLayout === 'split';
    const _bySafeH = _hh * Math.max(0, 1 - ts.top - ts.bottom);
    const _tz = Math.min(_hh * (_pib ? 0.85 : 0.45), _bySafeH);
    clone.style.setProperty('--title-zone-h', `${_tz.toFixed(2)}mm`);
    // Та же формула, что в updatePreview: titleW_mm = headerW*(1-l-r),
    // --title-safe-w (доля от content-ширины) = titleW_mm / contentW.
    {
      const _hw = _w * 10;                         // ширина шапки, мм
      const _cw = Math.max(1, _hw - 6);            // content-ширина, мм
      const _tw = _hw * (1 - ts.left - ts.right);  // ширина названия, мм
      const _swf = Math.max(0, Math.min(1, _tw / _cw));
      clone.style.setProperty('--title-safe-w', `${(_swf * 100).toFixed(2)}%`);
    }

    // Декоративные блоки (СВЕРХУ / ВНУТРИ / СНИЗУ) отрисованы выше через
    // applyCloneDecorBlock() — единый хелпер для всех трёх блоков клона.
  }

  // ===== Мульти-печать: рендер ценника под ПРОИЗВОЛЬНЫЙ preset =====
  // В отличие от applyItemToClone (который читает глобальные templateFonts/Decor/Bg
  // активного шаблона), эти функции принимают snapshot из ЛЮБОГО preset — так клон
  // одевается под шаблон, к которому принадлежит товар, независимо от активного.

  // Строит { tf, td, tb, ts, layout, headerH, rybaPib, insideWidth, labelPos } из preset.
  // Форма tf/td/tb совпадает с templateFonts/templateDecor/templateBg (см. applyState).
  function buildPresetSnapshots(preset) {
    const tf = {
      titleFont:      preset.titleFont || "Arial, sans-serif",
      titleColor:     preset.titleColor || '#ffffff',
      titleSize:      preset.titleSize || 13,
      titleWeight:    preset.titleWeight || '800',
      titleItalic:    !!preset.titleItalic,
      titleAlign:     preset.titleAlign || 'center',
      titleOffsetY:   preset.titleOffsetY != null ? preset.titleOffsetY : 0,
      titleShadow:    preset.titleShadow || '',
      subtitleColor:  preset.subtitleColor || '#ffffff',
      subtitleSize:   preset.subtitleSize != null ? preset.subtitleSize : 11,
      subtitleWeight: preset.subtitleWeight || '700',
      subtitleAlign:  preset.subtitleAlign || 'left',
      priceFont:      preset.priceFont || "Arial, sans-serif",
      priceColor:     preset.priceColor || '#ffffff',
      priceSize:      preset.priceSize !== undefined ? preset.priceSize : 40,
      priceWeight:    preset.priceWeight || '700',
      priceAlign:     preset.priceAlign || 'center',
      priceOffsetY:   preset.priceOffsetY != null ? preset.priceOffsetY : 0,
      priceShadow:    preset.priceShadow || '',
      currency:       preset.currency != null ? preset.currency : '₽'
    };
    const td = {
      outsideShow:     !!preset.decorOutsideShow,
      outsideText:     preset.decorOutsideText != null ? preset.decorOutsideText : 'НОВИНКА',
      outsideBg:       preset.decorOutsideBg || '#e63946',
      outsideBgImg:    preset.decorOutsideBgImg || 'none',
      outsideCustomBg: preset.decorOutsideCustomBg || null,
      outsideColor:    preset.decorOutsideColor || '#ffffff',
      outsideFontSize: preset.decorOutsideFontSize != null ? preset.decorOutsideFontSize : 14,
      outsideHeight:   preset.decorOutsideHeight != null ? preset.decorOutsideHeight : 12,
      insideShow:      !!preset.decorInsideShow,
      insideText:      preset.decorInsideText != null ? preset.decorInsideText : 'НОВИНКА',
      insideBg:        preset.decorInsideBg || '#e63946',
      insideBgImg:     preset.decorInsideBgImg || 'none',
      insideCustomBg:  preset.decorInsideCustomBg || null,
      insideColor:     preset.decorInsideColor || '#ffffff',
      insideFontSize:  preset.decorInsideFontSize != null ? preset.decorInsideFontSize : 11,
      insideHeight:    preset.decorInsideHeight != null ? preset.decorInsideHeight : 8,
      bottomShow:      !!preset.decorBottomShow,
      bottomText:      preset.decorBottomText != null ? preset.decorBottomText : 'НОВИНКА',
      bottomBg:        preset.decorBottomBg || '#e63946',
      bottomBgImg:     preset.decorBottomBgImg || 'none',
      bottomCustomBg:  preset.decorBottomCustomBg || null,
      bottomColor:     preset.decorBottomColor || '#ffffff',
      bottomFontSize:  preset.decorBottomFontSize != null ? preset.decorBottomFontSize : 14,
      bottomHeight:    preset.decorBottomHeight != null ? preset.decorBottomHeight : 12
    };
    const tb = {
      headerBg:     preset.headerBg || '#18181b',
      bgImage:      preset.bgImage || 'none',
      customBgData: preset.customBgData || null
    };
    // labelPos preset (merge как в applyState).
    const base = defaultLabelPos();
    const src = preset.labelPos || null;
    const labelPos = src ? {
      title: Object.assign({}, base.title, src.title || {}),
      subtitle: Object.assign({}, base.subtitle, src.subtitle || {}),
      price: Object.assign({}, base.price, src.price || {}),
      priceDigits: Array.isArray(src.priceDigits) ? src.priceDigits.map(d => ({ x: (d && d.x) || 0, y: (d && d.y) || 0 })) : [],
      currency: Object.assign({}, base.currency, src.currency || {})
    } : base;
    return {
      tf, td, tb,
      ts: normTitleSafe(preset.titleSafe),
      layout: preset.layout === 'split' ? 'split' : 'full',
      headerH: preset.headerHeight || 100,
      rybaPib: !!preset.priceInBottom,
      insideWidth: preset.decorInsideWidth != null ? preset.decorInsideWidth : 50,
      borderMm: Math.max(0, parseFloat(preset.borderMm) || 0),
      layerRotate: parseFloat(preset.layerRotate) || 0,
      labelPos
    };
  }

  // Применяет к клону шрифты/decor/bg/positions под конкретный preset (а не активный).
  // Контракт тот же, что у applyItemToClone, но все глобальные чтения заменены на ctx.
  function applyTemplateStyleToClone(clone, item, ctx) {
    const { tf, td, tb, ts, layout, headerH, rybaPib, insideWidth, labelPos: presetLp } = ctx;
    const lp = (item && item.labelPos) ? item.labelPos : presetLp;
    const digits = String((item && item.price) || '').split('');

    const tElem = clone.querySelector('.wobbler-title');
    const pElem = clone.querySelector('.price-val');
    const sElem = clone.querySelector('.wobbler-subtitle');
    const box = clone.querySelector('.wobbler-price-box');
    const curr = clone.querySelector('.price-curr');

    if (tElem) {
      tElem.textContent = (item && item.title) || '';
      tElem.style.fontFamily = fontOf(item, 'titleFont', tf.titleFont);
      tElem.style.color = fontOf(item, 'titleColor', tf.titleColor);
      tElem.style.fontSize = `${titleSizeForCtx(item, tf.titleSize)}pt`;
      tElem.style.fontWeight = fontOf(item, 'titleWeight', tf.titleWeight);
      tElem.style.fontStyle = fontOf(item, 'titleItalic', tf.titleItalic) ? 'italic' : 'normal';
      tElem.style.textShadow = fontOf(item, 'titleShadow', tf.titleShadow);
      tElem.style.textAlign = fontOf(item, 'titleAlign', tf.titleAlign);
      const tOff = parseFloat(fontOf(item, 'titleOffsetY', tf.titleOffsetY)) || 0;
      tElem.style.transform = `translate(${lp.title.x}mm, ${tOff + lp.title.y}mm) rotate(${ctx.layerRotate || 0}deg)`;
    }
    if (sElem) {
      sElem.textContent = (item && item.subtitle != null) ? item.subtitle : '';
      sElem.style.fontFamily = fontOf(item, 'titleFont', tf.titleFont);
      sElem.style.color = fontOf(item, 'subtitleColor', tf.subtitleColor);
      sElem.style.fontSize = `${fontOf(item, 'subtitleSize', tf.subtitleSize)}pt`;
      sElem.style.fontWeight = fontOf(item, 'subtitleWeight', tf.subtitleWeight);
      sElem.style.textAlign = fontOf(item, 'subtitleAlign', tf.subtitleAlign);
      sElem.style.transform = `translate(${lp.subtitle.x}mm, ${lp.subtitle.y}mm)`;
    }
    if (pElem) {
      while (lp.priceDigits.length < digits.length) lp.priceDigits.push({ x: 0, y: 0 });
      pElem.innerHTML = '';
      digits.forEach((d, idx) => {
        const span = document.createElement('span');
        const isSpace = d === ' ';
        span.className = 'price-digit' + (isSpace ? ' price-space' : '');
        span.textContent = isSpace ? '\u00A0' : d;
        const dp = lp.priceDigits[idx];
        span.style.transform = `translate(${dp.x}mm, ${dp.y}mm)`;
        pElem.appendChild(span);
      });
    }
    if (curr) {
      curr.textContent = (fontOf(item, 'currency', tf.currency) || '').trim();
      curr.style.fontFamily = fontOf(item, 'priceFont', tf.priceFont);
      curr.style.fontSize = `${fontOf(item, 'priceSize', tf.priceSize)}pt`;
      curr.style.fontWeight = fontOf(item, 'priceWeight', tf.priceWeight);
      curr.style.color = fontOf(item, 'priceColor', tf.priceColor);
      curr.style.textShadow = fontOf(item, 'priceShadow', tf.priceShadow);
      curr.style.transform = `translate(${lp.currency.x}mm, ${lp.currency.y}mm)`;
    }
    if (pElem) {
      pElem.style.fontFamily = fontOf(item, 'priceFont', tf.priceFont);
      pElem.style.fontSize = `${fontOf(item, 'priceSize', tf.priceSize)}pt`;
      pElem.style.fontWeight = fontOf(item, 'priceWeight', tf.priceWeight);
      pElem.style.color = fontOf(item, 'priceColor', tf.priceColor);
      pElem.style.textShadow = fontOf(item, 'priceShadow', tf.priceShadow);
      const __pw = maxPriceDigitWidth(pElem);
      if (__pw) pElem.style.setProperty('--price-digit-w', `${__pw}px`);
    }
    if (box) {
      const priceAlign = fontOf(item, 'priceAlign', tf.priceAlign || 'center');
      box.style.justifyContent = priceAlign === 'left' ? 'flex-start' : (priceAlign === 'right' ? 'flex-end' : 'center');
      const yOffset = (parseFloat(fontOf(item, 'priceOffsetY', tf.priceOffsetY)) || 0) + lp.price.y;
      box.style.transform = `translate(${lp.price.x}mm, ${yOffset}mm) rotate(${ctx.layerRotate || 0}deg)`;
    }

    // Decor/bg через параметризованные резолверы (fallback = preset, не активный).
    const outSnap = decorBlockFromItemCtx(item, 'outside', td, insideWidth);
    const inSnap = decorBlockFromItemCtx(item, 'inside', td, insideWidth);
    const botSnap = decorBlockFromItemCtx(item, 'bottom', td, insideWidth);
    const bgSnap = bgFromItemCtx(item, tb, ts);

    const cloneHeader = clone.querySelector('.wobbler-header');
    if (cloneHeader) applyBackgroundTo(cloneHeader, bgSnap.bgImage, bgSnap.customBg, bgSnap.headerBg);
    // Белая рамка вокруг графики фона (borderMm мм) — для клонов печати/раскладки
    // под произвольный preset.
    if (ctx.borderMm > 0) {
      cloneHeader.style.padding = `${ctx.borderMm}mm`;
      cloneHeader.style.backgroundOrigin = 'content-box';
      cloneHeader.style.backgroundClip = 'content-box';
      clone.classList.add('has-border');
    }

    const outH = parseFloat(outSnap.height) || 0;
    const inH = parseFloat(inSnap.height) || 0;
    const botH = parseFloat(botSnap.height) || 0;
    clone.style.setProperty('--outside-top-h', `${outH.toFixed(2)}mm`);
    clone.style.setProperty('--inside-top-h', `${inH.toFixed(2)}mm`);
    clone.style.setProperty('--outside-bottom-h', `${botH.toFixed(2)}mm`);
    clone.style.setProperty('--inside-top-w', `${inSnap.width != null ? inSnap.width : 50}%`);
    clone.classList.toggle('has-outside-top', !!outSnap.show);
    clone.classList.toggle('has-inside-top', !!inSnap.show);
    clone.classList.toggle('has-outside-bottom', !!botSnap.show);

    function applyCloneDecorBlock(blockEl, snap) {
      if (!blockEl) return;
      if (snap.show) {
        blockEl.style.display = 'flex';
        applyBackgroundTo(blockEl, snap.bgImg, snap.customBg, snap.bg);
        const txt = blockEl.querySelector('.block-text');
        if (txt) {
          txt.textContent = snap.text || '';
          txt.style.color = snap.color || '#ffffff';
          txt.style.fontSize = `${snap.fontSize || 12}pt`;
        }
      } else {
        blockEl.style.display = 'none';
      }
    }
    applyCloneDecorBlock(clone.querySelector('.wobbler-outside-top'), outSnap);
    applyCloneDecorBlock(clone.querySelector('.wobbler-inside-top'), inSnap);
    applyCloneDecorBlock(clone.querySelector('.wobbler-outside-bottom'), botSnap);

    // Safe-зона названия — по геометрии preset (не активного).
    const wMm = ctx.wMm;
    const hMm = ctx.hMm;
    const _hh = layout === 'full' ? hMm : hMm * (headerH / 100);
    const _pib = rybaPib && layout === 'split';
    const _bySafeH = _hh * Math.max(0, 1 - ts.top - ts.bottom);
    const _tz = Math.min(_hh * (_pib ? 0.85 : 0.45), _bySafeH);
    clone.style.setProperty('--title-zone-h', `${_tz.toFixed(2)}mm`);
    {
      const _hw = wMm;
      const _cw = Math.max(1, _hw - 6);
      const _tw = _hw * (1 - ts.left - ts.right);
      const _swf = Math.max(0, Math.min(1, _tw / _cw));
      clone.style.setProperty('--title-safe-w', `${(_swf * 100).toFixed(2)}%`);
    }
  }

  // Строит клон ценника, одетый под preset (геометрия/layout/стили из preset,
  // per-item overrides из item). Возвращает { node, wMm, effH } для упаковки.
  function renderWobblerForTemplate(item, preset) {
    const ctx = buildPresetSnapshots(preset);
    const wMm = (preset.widthCm || 6.5) * 10;
    const hMm = (preset.heightCm || 4.5) * 10;
    ctx.wMm = wMm;
    ctx.hMm = hMm;

    const clone = wobblerPreview.cloneNode(true);
    clone.removeAttribute('id');
    clone.style.boxShadow = 'none';
    clone.classList.remove('drag-mode');

    // Геометрия инлайн на клоне (CSS vars наследуются потомками — см. style.css).
    clone.style.setProperty('--wobbler-width', `${wMm}mm`);
    clone.style.setProperty('--wobbler-height', `${hMm}mm`);
    // Layout + header height + bottom display локально на клоне.
    clone.classList.toggle('layout-full', ctx.layout === 'full');
    clone.classList.toggle('layout-split', ctx.layout === 'split');
    const cHeader = clone.querySelector('.wobbler-header');
    if (cHeader) cHeader.style.height = ctx.layout === 'full' ? '100%' : `${ctx.headerH}%`;
    const cBottom = clone.querySelector('.wobbler-bottom');
    if (cBottom) cBottom.style.display = ctx.layout === 'split' ? 'flex' : 'none';
    // price-in-bottom: переместить price-box в bottom внутри клона.
    const pib = ctx.rybaPib && ctx.layout === 'split';
    clone.classList.toggle('price-in-bottom', pib);
    if (pib) {
      const cPriceBox = clone.querySelector('.wobbler-price-box');
      const cBot = clone.querySelector('.wobbler-bottom');
      if (cPriceBox && cBot && cPriceBox.parentElement !== cBot) cBot.appendChild(cPriceBox);
    }

    // Стили шрифтов/decor/bg/positions под preset.
    applyTemplateStyleToClone(clone, item, ctx);

    // Метки для реза — скроем по умолчанию, caller решает.
    const guides = clone.querySelector('.crop-guides');
    if (guides) guides.style.display = 'none';

    // Эффективная высота: ценник + decor СВЕРХУ/СНИЗУ (per-item, через ctx).
    const outSnap = decorBlockFromItemCtx(item, 'outside', ctx.td, ctx.insideWidth);
    const botSnap = decorBlockFromItemCtx(item, 'bottom', ctx.td, ctx.insideWidth);
    let effH = hMm;
    if (outSnap.show) effH += parseFloat(outSnap.height) || 0;
    if (botSnap.show) effH += parseFloat(botSnap.height) || 0;

    return { node: clone, wMm, effH };
  }

  // Применение фона (имя встроенной картинки / custom data-URL / none) к любому
  // элементу. Обобщает логику, ранее зашитую под wobblerHeader. Возвращает
  // выбранную фоновую CSS-строку (для согласованности cover/position).
  function applyBackgroundTo(el, bgVal, customDataUrl, bgColor) {
    if (!el) return;
    if (bgColor != null) el.style.backgroundColor = bgColor;
    if (bgVal === 'dots_bg.jpg' || bgVal === 'dots_bg') {
      el.style.backgroundImage = "url('dots_bg.jpg')";
      el.style.backgroundSize = "cover";
      el.style.backgroundPosition = "center";
    } else if (bgVal === 'ryba_bg.jpg') {
      el.style.backgroundImage = "url('ryba_bg.jpg')";
      el.style.backgroundSize = "cover";
      el.style.backgroundPosition = "center";
    } else if (bgVal === 'sneki_bg.jpg') {
      el.style.backgroundImage = "url('sneki_bg.jpg')";
      el.style.backgroundSize = "cover";
      el.style.backgroundPosition = "center";
    } else if (bgVal === 'yellow_bg.jpg') {
      el.style.backgroundImage = "url('yellow_bg.jpg')";
      el.style.backgroundSize = "cover";
      el.style.backgroundPosition = "center";
    } else if (bgVal === 'sort_nedeli_bg.jpg') {
      el.style.backgroundImage = "url('sort_nedeli_bg.jpg')";
      el.style.backgroundSize = "cover";
      el.style.backgroundPosition = "center";
    } else if (bgVal === 'ryba_scales') {
      el.style.backgroundImage =
        "radial-gradient(circle at 50% 0%, rgba(125,211,252,0.55) 0%, rgba(125,211,252,0) 55%)," +
        "radial-gradient(circle at 0% 50%, rgba(56,189,248,0.45) 0%, rgba(56,189,248,0) 50%)," +
        "radial-gradient(circle at 100% 50%, rgba(14,165,233,0.45) 0%, rgba(14,165,233,0) 50%)," +
        "repeating-radial-gradient(circle at 50% 120%, rgba(255,255,255,0.18) 0 3mm, rgba(255,255,255,0) 3mm 6mm)";
      el.style.backgroundSize = "auto";
      el.style.backgroundPosition = "center";
    } else if (typeof bgVal === 'string' && bgVal.indexOf('bgother:') === 0) {
      // Дополнительный фон из папки «bg other». data:URL берётся из extraBgMap
      // (наполняется из IndexedDB при загрузке страницы или при выборе папки).
      // Если маркер неизвестен (например, файл ещё не выбран) — фон не ставим.
      const dataUrl = extraBgMap[bgVal];
      if (dataUrl) {
        el.style.backgroundImage = `url('${dataUrl}')`;
        el.style.backgroundSize = "cover";
        el.style.backgroundPosition = "center";
      } else {
        el.style.backgroundImage = 'none';
      }
    } else if (bgVal === 'custom' && customDataUrl) {
      el.style.backgroundImage = `url('${customDataUrl}')`;
      el.style.backgroundSize = "cover";
      el.style.backgroundPosition = "center";
    } else {
      el.style.backgroundImage = 'none';
    }
  }

  // Update Wobbler Preview & Sizes
  function updatePreview() {
    const widthCm = parseFloat(wobblerWidthInput.value) || 6.5;
    const heightCm = parseFloat(wobblerHeightInput.value) || 4.5;
    const widthMm = widthCm * 10;
    const heightMm = heightCm * 10;

    document.documentElement.style.setProperty('--wobbler-width', `${widthMm}mm`);
    document.documentElement.style.setProperty('--wobbler-height', `${heightMm}mm`);

    rulerHText.textContent = `${widthCm.toString().replace('.', ',')} см`;
    rulerVText.textContent = `${heightCm.toString().replace('.', ',')} см`;
    topSubtitle.textContent = `Размер: ${widthCm.toString().replace('.', ',')} см × ${heightCm.toString().replace('.', ',')} см`;

    // Индикатор размера в шапке предпросмотра (только чтение)
    const sizeReadout = document.getElementById('sizeReadout');
    if (sizeReadout) {
      sizeReadout.textContent = `${widthCm.toString().replace('.', ',')} × ${heightCm.toString().replace('.', ',')} см`;
    }

    const isMultiMode = document.querySelector('input[name="printMode"]:checked').value === 'multi';

    if (isMultiMode) {
      multiItemSection.style.display = 'block';
      singleItemSection.style.display = 'none';
    } else {
      multiItemSection.style.display = 'none';
      singleItemSection.style.display = 'block';
      activePreviewIndex = 0;
    }

    // Селектор количества дубликатов актуален только для режима «Одинаковый текст»
    const singleRepeatWrap = document.getElementById('singleRepeatWrap');
    if (singleRepeatWrap) singleRepeatWrap.style.display = isMultiMode ? 'none' : 'block';

    // Title styling — use activePreviewIndex for current item preview
    const activeItem = isMultiMode ? (itemsData[activePreviewIndex] || itemsData[0] || { title: '', price: '' }) : null;
    const lp = activeLabelPos();   // позиции текущего режима/товара (для перетаскивания)
    const activeTitleText = isMultiMode
      ? (activeItem.title || `Товар №${activePreviewIndex + 1}`)
      : (inputTitle.value.trim() || 'ЗАГОЛОВОК');
    // Шрифтовые значения — из активного контекста (per-item override ценника,
    // иначе templateFonts). Инпуты DOM синхронизированы с этим контекстом
    // отдельно (syncFontControlsToContext); здесь только читаем источник истины.
    const tf = templateFonts || {};
    const effTitleSize = activeItemTitleSize(activeItem);
    previewTitle.textContent = activeTitleText;
    previewTitle.style.fontFamily = fontOf(activeItem, 'titleFont', tf.titleFont || titleFont.value);
    previewTitle.style.color = fontOf(activeItem, 'titleColor', tf.titleColor || titleColor.value);
    previewTitle.style.fontSize = `${effTitleSize}pt`;
    previewTitle.style.fontWeight = fontOf(activeItem, 'titleWeight', tf.titleWeight || titleWeight.value);
    previewTitle.style.fontStyle = fontOf(activeItem, 'titleItalic', tf.titleItalic != null ? tf.titleItalic : !!(titleItalic && titleItalic.checked)) ? 'italic' : 'normal';
    previewTitle.style.textShadow = fontOf(activeItem, 'titleShadow', tf.titleShadow != null ? tf.titleShadow : buildShadow(titleShadow ? titleShadow.value : 0, titleShadowColor ? titleShadowColor.value : '#000000'));
    previewTitle.style.textAlign = fontOf(activeItem, 'titleAlign', tf.titleAlign || alignState.title);
    const tOffsetY = parseFloat(fontOf(activeItem, 'titleOffsetY', tf.titleOffsetY != null ? tf.titleOffsetY : titleOffsetY.value)) || 0;
    previewTitle.style.transform = `translate(${lp.title.x}mm, ${tOffsetY + lp.title.y}mm) rotate(${layerRotate}deg)`;
    // Держим слайдер и индикатор в синхроне с активным товаром.
    if (titleSize.value != effTitleSize) titleSize.value = String(effTitleSize);
    titleSizeVal.textContent = titleSize.value;
    syncTitleSizePreview();
    titleOffsetYVal.textContent = titleOffsetY.value;
    if (titleShadowVal && titleShadow) titleShadowVal.textContent = titleShadow.value;

    // Подзаголовок (вес/доп. инфо) — всегда в нижнем левом углу ценника.
    // Независимый слой: собственные размер/цвет/толщина/выравнивание
    // (шрифт наследуется от наименования).
    if (previewSubtitle) {
      const subText = isMultiMode ? (activeItem?.subtitle || '') : (inputSubtitle?.value || '');
      previewSubtitle.textContent = subText || '';
      previewSubtitle.style.display = subText ? 'block' : 'none';
      const subPt = fontOf(activeItem, 'subtitleSize', tf.subtitleSize != null ? tf.subtitleSize : (subtitleSize ? subtitleSize.value : 11));
      // Шрифт подзаголовка наследуется от шрифта наименования (исторически).
      previewSubtitle.style.fontFamily = fontOf(activeItem, 'titleFont', tf.titleFont || titleFont.value);
      previewSubtitle.style.color = fontOf(activeItem, 'subtitleColor', tf.subtitleColor || (subtitleColor ? subtitleColor.value : '#ffffff'));
      previewSubtitle.style.fontSize = `${subPt}pt`;
      previewSubtitle.style.fontWeight = fontOf(activeItem, 'subtitleWeight', tf.subtitleWeight || (subtitleWeight ? subtitleWeight.value : '700'));
      previewSubtitle.style.textAlign = fontOf(activeItem, 'subtitleAlign', tf.subtitleAlign || alignState.subtitle || 'left');
      // Ручное смещение (перетаскивание) поверх углового позиционирования
      previewSubtitle.style.transform = `translate(${lp.subtitle.x}mm, ${lp.subtitle.y}mm)`;
      if (subtitleSizeVal) subtitleSizeVal.textContent = subPt;
    }

    // Update preview item badge
    const previewItemBadge = document.getElementById('previewItemBadge');
    if (previewItemBadge) {
      if (isMultiMode) {
        previewItemBadge.style.display = 'inline-block';
        previewItemBadge.textContent = `№${activePreviewIndex + 1}`;
      } else {
        previewItemBadge.style.display = 'none';
      }
    }

    // Price Toggle & Custom Styling (Currency icon matches exact price font & weight!)
    if (showPriceToggle.checked) {
      priceFieldsBlock.classList.remove('price-off');
      previewPriceBox.style.display = 'flex';
      const activePriceText = isMultiMode ? (activeItem?.price || '') : inputPrice.value.trim();
      // Цена разбивается на отдельные <span class="price-digit"> — для перетаскивания каждой цифры.
      // Гарантируем длину массива priceDigits под текущее число цифр.
      const digits = activePriceText.split('');
      while (lp.priceDigits.length < digits.length) lp.priceDigits.push({ x: 0, y: 0 });
      previewPrice.innerHTML = '';
      digits.forEach((d, idx) => {
        const span = document.createElement('span');
        // Пробел рендерим как полноценный символ: nbsp не схлопывается
        // в inline-flex, а класс .price-space даёт ему ширину цифры.
        const isSpace = d === ' ';
        span.className = 'price-digit' + (isSpace ? ' price-space' : '');
        span.textContent = isSpace ? '\u00A0' : d;
        span.dataset.pos = idx;
        const dp = lp.priceDigits[idx];
        span.style.transform = `translate(${dp.x}mm, ${dp.y}mm)`;
        previewPrice.appendChild(span);
      });
      previewPrice.style.fontFamily = fontOf(activeItem, 'priceFont', tf.priceFont || priceFont.value);
      previewPrice.style.fontSize = `${fontOf(activeItem, 'priceSize', tf.priceSize != null ? tf.priceSize : priceSize.value)}pt`;
      previewPrice.style.fontWeight = fontOf(activeItem, 'priceWeight', tf.priceWeight || priceWeight.value);
      previewPrice.style.color = fontOf(activeItem, 'priceColor', tf.priceColor || priceColor.value);
      previewPrice.style.textShadow = fontOf(activeItem, 'priceShadow', tf.priceShadow != null ? tf.priceShadow : buildShadow(priceShadow ? priceShadow.value : 0, priceShadowColor ? priceShadowColor.value : '#000000'));
      // Все цифры цены одинаковой ширины — как самая широкая. Замеряем max по 0–9
      // и кладём в CSS-переменную, которую использует .price-digit { width }.
      {
        const __pw = maxPriceDigitWidth(previewPrice);
        if (__pw) previewPrice.style.setProperty('--price-digit-w', `${__pw}px`);
      }

      previewCurrency.textContent = (fontOf(activeItem, 'currency', tf.currency != null ? tf.currency : inputCurrency.value) || '').trim();
      previewCurrency.style.fontFamily = fontOf(activeItem, 'priceFont', tf.priceFont || priceFont.value);
      previewCurrency.style.fontSize = `${fontOf(activeItem, 'priceSize', tf.priceSize != null ? tf.priceSize : priceSize.value)}pt`;
      previewCurrency.style.fontWeight = fontOf(activeItem, 'priceWeight', tf.priceWeight || priceWeight.value);
      previewCurrency.style.color = fontOf(activeItem, 'priceColor', tf.priceColor || priceColor.value);
      previewCurrency.style.textShadow = fontOf(activeItem, 'priceShadow', tf.priceShadow != null ? tf.priceShadow : buildShadow(priceShadow ? priceShadow.value : 0, priceShadowColor ? priceShadowColor.value : '#000000'));
      previewCurrency.style.transform = `translate(${lp.currency.x}mm, ${lp.currency.y}mm)`;

      const priceAlign = fontOf(activeItem, 'priceAlign', tf.priceAlign || alignState.price || 'center');
      previewPriceBox.style.justifyContent = priceAlign === 'left' ? 'flex-start' : (priceAlign === 'right' ? 'flex-end' : 'center');
      const yOffset = (parseFloat(fontOf(activeItem, 'priceOffsetY', tf.priceOffsetY != null ? tf.priceOffsetY : priceOffsetY.value)) || 0) + lp.price.y;
      previewPriceBox.style.transform = `translate(${lp.price.x}mm, ${yOffset}mm) rotate(${layerRotate}deg)`;

      priceSizeVal.textContent = priceSize.value;
      priceOffsetYVal.textContent = priceOffsetY.value;
      if (priceShadowVal && priceShadow) priceShadowVal.textContent = priceShadow.value;
    } else {
      priceFieldsBlock.classList.add('price-off');
      previewPriceBox.style.display = 'none';
    }

    // Background Image & Overlay — per-item фон активного ценника, если задан
    // (в single-режиме хелпер возвращает глобальные значения как раньше).
    const activeBgSnap = resolveItemBg(activePreviewIndex);
    applyBackgroundTo(wobblerHeader, activeBgSnap.bgImage, activeBgSnap.customBg, activeBgSnap.headerBg);
    // Белая рамка вокруг графики (borderMm мм): графика режется по content-box,
    // а внешняя полоса padding остаётся цветом заливки шапки = поля под обрез.
    if (borderMm > 0) {
      wobblerHeader.style.padding = `${borderMm}mm`;
      wobblerHeader.style.backgroundOrigin = 'content-box';
      wobblerHeader.style.backgroundClip = 'content-box';
      wobblerPreview.classList.add('has-border');
    } else {
      wobblerHeader.style.padding = '';
      wobblerHeader.style.backgroundOrigin = '';
      wobblerHeader.style.backgroundClip = '';
      wobblerPreview.classList.remove('has-border');
    }

    // Layout Fix
    headerHeightVal.textContent = headerHeightRange.value;
    const selectedLayout = currentLayout;
    if (selectedLayout === 'full') {
      wobblerPreview.classList.remove('layout-split');
      wobblerPreview.classList.add('layout-full');
      wobblerHeader.style.height = '100%';
      if (wobblerBottom) wobblerBottom.style.display = 'none';
    } else {
      wobblerPreview.classList.remove('layout-full');
      wobblerPreview.classList.add('layout-split');
      wobblerHeader.style.height = `${headerHeightRange.value}%`;
      if (wobblerBottom) wobblerBottom.style.display = 'flex';
    }

    // === Декоративные блоки «Оформление» ===
    // Значения берём через хелперы: per-item для активного ценника, иначе глобальные.
    // outsideH — также «добавка» к высоте ячейки листа/печати (ценник + блок).
    const activeOutsideSnap = resolveDecorBlock(activePreviewIndex, 'outside');
    const activeInsideSnap = resolveDecorBlock(activePreviewIndex, 'inside');
    const activeBottomSnap = resolveDecorBlock(activePreviewIndex, 'bottom');
    const outsideH = parseFloat(activeOutsideSnap.height) || 0; // мм, над ценником
    const insideH = parseFloat(activeInsideSnap.height) || 0;   // мм, внутри ценника сверху
    const bottomH = parseFloat(activeBottomSnap.height) || 0;   // мм, под ценником
    document.documentElement.style.setProperty('--outside-top-h', `${outsideH.toFixed(2)}mm`);
    document.documentElement.style.setProperty('--inside-top-h', `${insideH.toFixed(2)}mm`);
    document.documentElement.style.setProperty('--outside-bottom-h', `${bottomH.toFixed(2)}mm`);
    // Ширина блока «внутри» (% ширины ценника) — сужает полосу, центрируя её.
    const insideW = (activeInsideSnap.width != null) ? activeInsideSnap.width : 50;
    document.documentElement.style.setProperty('--inside-top-w', `${insideW}%`);

    const showOutside = !!activeOutsideSnap.show;
    const showInside = !!activeInsideSnap.show;
    const showBottom = !!activeBottomSnap.show;
    wobblerPreview.classList.toggle('has-outside-top', showOutside);
    wobblerPreview.classList.toggle('has-inside-top', showInside);
    wobblerPreview.classList.toggle('has-outside-bottom', showBottom);

    function applyDecorBlock(el, textEl, text, bgVal, customData, color, fontColor, fontSize) {
      if (!el) return;
      el.style.display = 'flex';
      applyBackgroundTo(el, bgVal, customData, color);
      if (textEl) {
        textEl.textContent = text || '';
        textEl.style.color = fontColor || '#ffffff';
        textEl.style.fontSize = `${fontSize || 12}pt`;
      }
    }

    if (wobblerOutsideTop) {
      if (showOutside) {
        applyDecorBlock(wobblerOutsideTop, outsideTopText,
          activeOutsideSnap.text, activeOutsideSnap.bgImg, activeOutsideSnap.customBg,
          activeOutsideSnap.bg, activeOutsideSnap.color, activeOutsideSnap.fontSize);
      } else {
        wobblerOutsideTop.style.display = 'none';
      }
    }
    if (decorOutsideFontSize && decorOutsideFontSizeVal) decorOutsideFontSizeVal.textContent = decorOutsideFontSize.value;
    if (decorOutsideHeight && decorOutsideHeightVal) decorOutsideHeightVal.textContent = decorOutsideHeight.value;
    if (gapInput && gapMmVal) gapMmVal.textContent = gapInput.value;

    if (wobblerInsideTop) {
      if (showInside) {
        applyDecorBlock(wobblerInsideTop, insideTopText,
          activeInsideSnap.text, activeInsideSnap.bgImg, activeInsideSnap.customBg,
          activeInsideSnap.bg, activeInsideSnap.color, activeInsideSnap.fontSize);
      } else {
        wobblerInsideTop.style.display = 'none';
      }
    }
    if (decorInsideFontSize && decorInsideFontSizeVal) decorInsideFontSizeVal.textContent = decorInsideFontSize.value;
    if (decorInsideHeight && decorInsideHeightVal) decorInsideHeightVal.textContent = decorInsideHeight.value;
    if (decorInsideWidth && decorInsideWidthVal) decorInsideWidthVal.textContent = decorInsideWidth.value;

    // Декоративный блок СНИЗУ (под ценником) — полный аналог блока СВЕРХУ.
    if (wobblerOutsideBottom) {
      if (showBottom) {
        applyDecorBlock(wobblerOutsideBottom, outsideBottomText,
          activeBottomSnap.text, activeBottomSnap.bgImg, activeBottomSnap.customBg,
          activeBottomSnap.bg, activeBottomSnap.color, activeBottomSnap.fontSize);
      } else {
        wobblerOutsideBottom.style.display = 'none';
      }
    }
    if (decorBottomFontSize && decorBottomFontSizeVal) decorBottomFontSizeVal.textContent = decorBottomFontSize.value;
    if (decorBottomHeight && decorBottomHeightVal) decorBottomHeightVal.textContent = decorBottomHeight.value;

    // Внутренний блок позиционируется поверх (absolute) — шапку не трогаем,
    // её высоту задаёт CSS (привязка к --wobbler-height).

    // Эффективная высота карточки для раскладки листа/печати (с учётом внешних блоков
    // сверху и снизу — оба добавляют высоту и не входят в размер ценника).
    window.__cardEffH = heightMm + (showOutside ? outsideH : 0) + (showBottom ? bottomH : 0);

    // Высота шапки в мм: в full — вся высота воблера; в split — headerHeight%.
    const headerHm = selectedLayout === 'full'
      ? heightMm
      : heightMm * (parseInt(headerHeightRange.value, 10) || 50) / 100;
    const priceInBottomNow = rybaPriceInBottom && selectedLayout === 'split';
    // Если цена в шапке — оставляем ~45% под название; если цена в нижнем
    // поле — шапка почти целиком отдаётся названию (~85%).
    // Safe-зона (top+bottom) дополнительно ограничивает высоту названия снизу,
    // чтобы текст не заехал на графику фона (логотип сверху, декор снизу).
    // Берём минимум из множителя и безопасной высоты.
    const ts = resolveItemBg(activePreviewIndex).titleSafe;
    const mult = priceInBottomNow ? 0.85 : 0.45;
    const bySafeH = headerHm * Math.max(0, 1 - ts.top - ts.bottom);
    const titleZone = Math.min(headerHm * mult, bySafeH);
    document.documentElement.style.setProperty('--title-zone-h', `${titleZone.toFixed(2)}mm`);
    // Безопасная ширина названия. left/right — доли от ВСЕЙ ширины шапки
    // (.wobbler-header), как и top/bottom от её высоты: так прямоугольник
    // редактора (.safe-rect, позиционируется внутри всей шапки) совпадает с
    // реальным боксом названия 1:1, и пользователь видит истинные границы.
    // Геометрия: ширина названия в мм = headerW*(1-l-r) (совпадает с rect).
    // Но .wobbler-title живёт в .header-content (ширина = шапка − padding 6мм),
    // поэтому --title-safe-w (это % от content-ширины) =
    //   headerW*(1-l-r) / contentW * 100.
    {
      const headerW_mm = widthMm;
      const contentW_mm = Math.max(1, widthMm - 6);   // padding 3мм × 2
      const titleW_mm = headerW_mm * (1 - ts.left - ts.right);
      const safeWFrac = Math.max(0, Math.min(1, titleW_mm / contentW_mm));
      document.documentElement.style.setProperty('--title-safe-w', `${(safeWFrac * 100).toFixed(2)}%`);
    }
    // Прямоугольник редактора следует за состоянием (смена шаблона / ввод в поля).
    positionSafeRect(ts);

    // Размещение блока цены: для шаблона «Рыба» цена уходит в нижнее белое поле,
    // наименование остаётся в верхнем блоке. Перемещение по DOM автоматически
    // подхватывается в раскладке и печати (там клонируется весь wobblerPreview).
    const headerContent = wobblerHeader.querySelector('.header-content');
    if (rybaPriceInBottom && selectedLayout === 'split') {
      wobblerPreview.classList.add('price-in-bottom');
      if (previewPriceBox.parentElement !== wobblerBottom) {
        wobblerBottom.appendChild(previewPriceBox);
      }
    } else {
      wobblerPreview.classList.remove('price-in-bottom');
      if (previewPriceBox.parentElement !== headerContent) {
        headerContent.appendChild(previewPriceBox);
      }
    }

    // Подзаголовок (вес) теперь всегда в нижнем левом углу для всех шаблонов —
    // угловое позиционирование задано в базовом CSS-правиле .wobbler-subtitle,
    // отдельный класс-модификатор не нужен.

    // Светлая плашка под ценой (для чёрной цены на тёмном фоне).
    // Чекбокс — единственный источник состояния.
    wobblerPreview.classList.toggle('price-plate', !!(pricePlateToggle && pricePlateToggle.checked));

    renderSheetPreview(widthMm, heightMm);
  }

  // Handle Size Presets
  document.querySelectorAll('.preset-size-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.preset-size-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const w = btn.getAttribute('data-w');
      const h = btn.getAttribute('data-h');
      wobblerWidthInput.value = w;
      wobblerHeightInput.value = h;
      updatePreview();
    });
  });

  // Custom Image Upload File Reader (фон ценника #4).
  // Делегирует запись в активный контекст через onBgInputChange (фон независим от decor).
  customBgUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
      uploadedDataUrl = event.target.result;
      customBgOption.style.display = 'block';
      bgImageSelect.value = 'custom';
      uploadStatus.textContent = `✓ Загружено: ${file.name}`;
      onBgInputChange();
    };
    reader.readAsDataURL(file);
  });

  // Выбор папки с доп. фонами («bg other»). Файлы читаются как data:URL и
  // кэшируются в IndexedDB, после чего появляются в подменю «Дополнительно».
  // При следующих открытиях страницы фоны берутся из кэша — папку выбирать
  // снова нужно только при изменении её содержимого.
  if (extraBgDirInput) {
    extraBgDirInput.addEventListener('change', async (e) => {
      const files = Array.from(e.target.files || []);
      const imgFiles = files.filter(f => /\.(jpe?g|png|webp|gif|bmp|svg)$/i.test(f.name));
      if (imgFiles.length === 0) {
        if (extraBgStatus) extraBgStatus.textContent = 'В папке нет изображений.';
        return;
      }
      if (extraBgStatus) extraBgStatus.textContent = `Чтение ${imgFiles.length} файлов…`;
      // Читаем каждый файл как data:URL (параллельно).
      const readFile = (file) => new Promise(resolve => {
        const r = new FileReader();
        r.onload = () => resolve({ name: file.name, dataUrl: r.result });
        r.onerror = () => resolve(null);
        r.readAsDataURL(file);
      });
      const results = (await Promise.all(imgFiles.map(readFile))).filter(Boolean);
      await saveExtraBackgrounds(results);
      if (extraBgStatus) {
        extraBgStatus.textContent = results.length
          ? `✓ Загружено фонов: ${results.length}. Они появятся в подменю «Дополнительно».`
          : 'Не удалось прочитать файлы.';
      }
      e.target.value = ''; // разрешить повторный выбор той же папки
    });
  }

  // Загрузка своих фонов для декоративных блоков (обобщённый хелпер).
  // Пишет data-URL в соответствующую переменную, переключает select блока на
  // 'custom' и делегирует запись в активный контекст через onDecorInputChange.
  function setupDecorUpload(input, optionEl, statusEl, targetVar) {
    if (!input) return;
    input.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function(event) {
        const dataUrl = event.target.result;
        if (targetVar === 'outside') {
          uploadedDataUrl2 = dataUrl;
          if (decorOutsideBgImg) decorOutsideBgImg.value = 'custom';
        } else if (targetVar === 'inside') {
          uploadedDataUrl3 = dataUrl;
          if (decorInsideBgImg) decorInsideBgImg.value = 'custom';
        } else { // 'bottom'
          uploadedDataUrl4 = dataUrl;
          if (decorBottomBgImg) decorBottomBgImg.value = 'custom';
        }
        if (optionEl) optionEl.style.display = 'block';
        if (statusEl) statusEl.textContent = `✓ Загружено: ${file.name}`;
        onDecorInputChange();
      };
      reader.readAsDataURL(file);
    });
  }
  setupDecorUpload(decorOutsideCustomUpload, decorOutsideCustomOption, decorOutsideUploadStatus, 'outside');
  setupDecorUpload(decorInsideCustomUpload, decorInsideCustomOption, decorInsideUploadStatus, 'inside');
  setupDecorUpload(decorBottomCustomUpload, decorBottomCustomOption, decorBottomUploadStatus, 'bottom');

  // Alignment Buttons Click Handler
  // В multi+item-режиме выравнивание пишется в per-item override ценника,
  // иначе — в alignState + templateFonts (оформление всего шаблона).
  document.querySelectorAll('.align-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-target');
      const align = btn.getAttribute('data-align');

      document.querySelectorAll(`.align-btn[data-target="${target}"]`).forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      alignState[target] = align;
      if (isMultiModeNow() && fontApplyMode === 'item') {
        const it = itemsData[activePreviewIndex] || (itemsData[activePreviewIndex] = {});
        if (!it.fonts) it.fonts = Object.assign({}, templateFonts);
        it.fonts[target + 'Align'] = align;
        it.fontsCustomized = true;
      } else if (templateFonts) {
        templateFonts[target + 'Align'] = align;
      }
      updatePreview();
    });
  });

  // === Сегментированный переключатель «Этот ценник / Весь шаблон» ===
  // В multi-режиме определяет, куда пишутся шрифтовые инпуты: в выбранный ценник
  // (per-item override) или в templateFonts (весь шаблон). При переключении
  // инпуты перерисовываются под новый контекст.
  document.querySelectorAll('[data-font-mode]').forEach(btn => {
    btn.addEventListener('click', () => {
      fontApplyMode = btn.getAttribute('data-font-mode');
      document.querySelectorAll('[data-font-mode]').forEach(b => {
        b.classList.toggle('active', b.getAttribute('data-font-mode') === fontApplyMode);
      });
      syncFontControlsToContext();
      syncDecorControlsToContext();
      syncBgControlsToContext();
      updatePreview();
    });
  });

  // «↺ К шаблону» — снимает per-item override шрифтов у выбранного ценника,
  // после чего ценник снова наследует оформление шаблона.
  if (resetItemFontsBtn) {
    resetItemFontsBtn.addEventListener('click', () => {
      const it = itemsData[activePreviewIndex];
      if (it) {
        delete it.fontsCustomized;
        delete it.fonts;
        // Очищаем и legacy per-item кегль (старое поле itemsData[i].titleSize),
        // иначе activeItemTitleSize продолжит брать значение из него.
        delete it.titleSize;
      }
      // Возвращаемся в per-item режим и показываем значения шаблона.
      fontApplyMode = 'item';
      document.querySelectorAll('[data-font-mode]').forEach(b => {
        b.classList.toggle('active', b.getAttribute('data-font-mode') === fontApplyMode);
      });
      syncFontControlsToContext();
      syncDecorControlsToContext();
      syncBgControlsToContext();
      updatePreview();
    });
  }

  // === Переключатель «Этот ценник / Весь шаблон» для ОФОРМЛЕНИЯ (#5 декор-блоки) ===
  document.querySelectorAll('[data-decor-mode]').forEach(btn => {
    btn.addEventListener('click', () => {
      decorApplyMode = btn.getAttribute('data-decor-mode');
      document.querySelectorAll('[data-decor-mode]').forEach(b => {
        b.classList.toggle('active', b.getAttribute('data-decor-mode') === decorApplyMode);
      });
      syncDecorControlsToContext();
      updatePreview();
    });
  });

  // «↺ К шаблону» — снимает per-item override оформления (декор-блоки) ценника.
  if (resetItemDecorBtn) {
    resetItemDecorBtn.addEventListener('click', () => {
      resetItemDecor(activePreviewIndex);
      // Возвращаемся в per-item режим и показываем значения шаблона.
      decorApplyMode = 'item';
      document.querySelectorAll('[data-decor-mode]').forEach(b => {
        b.classList.toggle('active', b.getAttribute('data-decor-mode') === decorApplyMode);
      });
      syncDecorControlsToContext();
      updatePreview();
    });
  }

  // === Переключатель «Этот ценник / Весь шаблон» для ФОНА (#4) ===
  document.querySelectorAll('[data-bg-mode]').forEach(btn => {
    btn.addEventListener('click', () => {
      bgApplyMode = btn.getAttribute('data-bg-mode');
      document.querySelectorAll('[data-bg-mode]').forEach(b => {
        b.classList.toggle('active', b.getAttribute('data-bg-mode') === bgApplyMode);
      });
      syncBgControlsToContext();
      updatePreview();
    });
  });

  // «↺ К шаблону» — снимает per-item override фона ценника (декор не трогает).
  if (resetItemBgBtn) {
    resetItemBgBtn.addEventListener('click', () => {
      resetItemBg(activePreviewIndex);
      bgApplyMode = 'item';
      document.querySelectorAll('[data-bg-mode]').forEach(b => {
        b.classList.toggle('active', b.getAttribute('data-bg-mode') === bgApplyMode);
      });
      syncBgControlsToContext();
      updatePreview();
    });
  }

  function renderSheetPreview(wMm, hMm) {
    sheetGridPreview.innerHTML = '';
    const effH = effectiveCardHeight(hMm); // с учётом внешнего декор-блока
    const grid = calcA4Grid(wMm, effH);

    const isMultiMode = document.querySelector('input[name="printMode"]:checked').value === 'multi';

    // В мультирежиме показываем только заполненные ценники (есть наименование)
    let itemsToShow;
    if (isMultiMode) {
      itemsToShow = itemsData.filter(it => it && it.title && it.title.trim());
    } else {
      // одиночный режим: позиции из singleLabelPos
      itemsToShow = [{ title: inputTitle.value.trim(), price: inputPrice.value.trim(), subtitle: (inputSubtitle ? inputSubtitle.value.trim() : ''), labelPos: singleLabelPos }];
    }

    let count = itemsToShow.length;
    if (!isMultiMode && singleRepeatCount) {
      // В режиме «Одинаковый текст» дублируем выбранный ценник N раз
      if (singleRepeatCount.value === 'auto') {
        count = grid.maxCount;
      } else {
        const rep = parseInt(singleRepeatCount.value, 10);
        if (!isNaN(rep) && rep > 0) count = rep;
      }
    } else if (sheetCount.value !== 'auto') {
      count = Math.min(parseInt(sheetCount.value, 10), count);
    }
    count = Math.min(count, grid.maxCount);

    const pagesText = grid.maxCount > 0 ? Math.ceil(count / grid.maxCount) : 1;
    sheetCalcText.textContent = `${count} заполнено · влезает ${grid.maxCount}/лист (${grid.cols}×${grid.rows})${pagesText > 1 ? ` · ${pagesText} стр.` : ''}`;
    sheetGridPreview.style.gridTemplateColumns = `repeat(${grid.cols}, ${wMm}mm)`;
    sheetGridPreview.style.gridTemplateRows = `repeat(${grid.rows}, ${effH}mm)`;
    sheetGridPreview.style.gap = gapMm() + 'mm';

    for (let i = 0; i < count; i++) {
      const item = itemsToShow[i] || itemsToShow[0] || { title: '', price: '' };
      const itemWrapper = document.createElement('div');
      itemWrapper.style.position = 'relative';
      itemWrapper.style.width = `${wMm}mm`;
      itemWrapper.style.height = `${effH}mm`;

      const cloned = wobblerPreview.cloneNode(true);
      cloned.removeAttribute('id');
      cloned.classList.remove('drag-mode');

      // Применяем тексты и позиции конкретного товара к клону.
      applyItemToClone(cloned, item, titleOffsetY.value, priceOffsetY.value);

      itemWrapper.appendChild(cloned);

      if (!showCropMarks.checked) {
        const guides = itemWrapper.querySelector('.crop-guides');
        if (guides) guides.style.display = 'none';
      }

      sheetGridPreview.appendChild(itemWrapper);
    }
  }

  // Render Clean Print Area for Window.print()
  function preparePrintArea() {
    printArea.innerHTML = '';
    const wCm = parseFloat(wobblerWidthInput.value) || 6.5;
    const hCm = parseFloat(wobblerHeightInput.value) || 4.5;
    const wMm = wCm * 10;
    const hMm = hCm * 10;

    const effH = effectiveCardHeight(hMm); // с учётом внешнего декор-блока
    const grid = calcA4Grid(wMm, effH);

    const isMultiMode = document.querySelector('input[name="printMode"]:checked').value === 'multi';

    // В мультирежиме печатаем только заполненные ценники (есть наименование).
    // В режиме одного товара дублируем выбранный ценник N раз (singleRepeatCount).
    let itemsToPrint;
    if (isMultiMode) {
      itemsToPrint = itemsData.filter(it => it && it.title && it.title.trim());
    } else {
      const baseItem = { title: inputTitle.value.trim(), price: inputPrice.value.trim(), subtitle: (inputSubtitle ? inputSubtitle.value.trim() : ''), labelPos: singleLabelPos };
      let times = 1;
      if (singleRepeatCount) {
        if (singleRepeatCount.value === 'auto') {
          times = grid.maxCount;
        } else {
          const rep = parseInt(singleRepeatCount.value, 10);
          if (!isNaN(rep) && rep > 0) times = Math.min(rep, grid.maxCount);
        }
      }
      itemsToPrint = Array.from({ length: times }, () => baseItem);
    }

    const totalItems = itemsToPrint.length;
    if (totalItems === 0) return;

    const perPage = grid.maxCount;
    const totalPages = Math.ceil(totalItems / perPage);
    const showCrop = showCropMarks.checked;

    for (let pageNum = 0; pageNum < totalPages; pageNum++) {
      const page = document.createElement('div');
      page.className = 'print-page';
      page.style.gridTemplateColumns = `repeat(${grid.cols}, ${wMm}mm)`;
      page.style.gridTemplateRows = `repeat(${grid.rows}, ${effH}mm)`;
      // gap задаём через setProperty, т.к. в @media print у .print-page был !important.
      page.style.setProperty('gap', gapMm() + 'mm', 'important');

      const startIdx = pageNum * perPage;
      const endIdx = Math.min(startIdx + perPage, totalItems);

      for (let i = startIdx; i < endIdx; i++) {
        const item = itemsToPrint[i] || itemsToPrint[0] || { title: '', price: '' };
        const itemWrapper = document.createElement('div');
        itemWrapper.className = 'print-wobbler-wrapper';
        itemWrapper.style.width = `${wMm}mm`;
        itemWrapper.style.height = `${effH}mm`;

        const cleanWobbler = wobblerPreview.cloneNode(true);
        cleanWobbler.removeAttribute('id');
        cleanWobbler.style.boxShadow = 'none';
        cleanWobbler.classList.remove('drag-mode');

        // Применяем тексты и позиции конкретного товара к клону.
        applyItemToClone(cleanWobbler, item, titleOffsetY.value, priceOffsetY.value);

        // Пунктирные метки для реза: показываем только если включен чекбокс
        const guides = cleanWobbler.querySelector('.crop-guides');
        if (guides) guides.style.display = showCrop ? '' : 'none';

        itemWrapper.appendChild(cleanWobbler);

        if (showCrop) {
          const crop = document.createElement('div');
          crop.className = 'print-crop-marks';
          itemWrapper.appendChild(crop);
        }

        page.appendChild(itemWrapper);
      }

      printArea.appendChild(page);
    }
  }

  // Print Trigger
  function triggerPrint() {
    preparePrintArea();
    document.body.classList.add('is-printing');
    setTimeout(() => {
      window.print();
      setTimeout(() => {
        document.body.classList.remove('is-printing');
      }, 500);
    }, 150);
  }

  // ===== Мульти-печать: shelf-packer и сборка листов =====
  // items: [{ node, wMm, effH }] — уже одетые под свои preset клоны.
  // Жадный shelf-packing: набираем ряд пока сумма ширин+gap ≤ pageW; высота ряда =
  // max(effH в ряду); если новый ряд не влезает по высоте — новая страница.
  // Возвращает [{ rows: [[ {item}...], ...] }] — массив страниц (каждая rows).
  function packIntoPages(items, pageW, pageH, gap) {
    const pages = [];
    let curRows = [], curY = 0, curRow = [], curRowH = 0, curRowW = 0;
    const flushRow = () => {
      if (curRow.length) { curRows.push({ items: curRow, h: curRowH }); curY += curRowH + gap; }
      curRow = []; curRowH = 0; curRowW = 0;
    };
    for (const it of items) {
      // Помещается ли в текущий ряд по ширине?
      const addW = it.wMm + (curRow.length ? gap : 0);
      if (curRow.length && curRowW + addW > pageW + 0.01) flushRow();
      // Помещается ли ряд по высоте (если ряд пуст — стартуем на текущем curY)?
      const projRowH = Math.max(curRowH, it.effH);
      const projRowW2 = curRow.length ? curRowW + addW : it.wMm;
      if (curRow.length === 0) {
        // новый ряд: проверяем, влезет ли он на текущей странице
        if (curY + projRowH > pageH + 0.01 && pages.length > 0) {
          // текущая страница закончилась — но curRows может быть пустой (очень tall item)
          if (curRows.length) { pages.push({ rows: curRows }); curRows = []; }
          curY = 0;
        }
      }
      curRow.push(it);
      curRowH = projRowH;
      curRowW = curRow.length === 1 ? it.wMm : curRowW + addW;
    }
    flushRow();
    if (curRows.length) pages.push({ rows: curRows });
    return pages.length ? pages : (items.length ? [{ rows: [] }] : []);
  }

  // Собирает очередь ценников из отмеченных шаблонов, рендерит каждый под свой preset,
  // упаковывает и строит DOM в #printArea. gap — зазор между ценниками (мм).
  function prepareMultiPrintArea(selected, gap, showCrop) {
    printArea.innerHTML = '';
    // selected: [{ key, copies }] — copies='auto' = все заполненные.
    const queue = [];
    for (const sel of selected) {
      const preset = builtInPresets[sel.key];
      const arr = templateItems[sel.key] || [];
      const filled = arr.filter(it => it && it.title && it.title.trim());
      const n = (sel.copies === 'auto' || !sel.copies) ? filled.length : Math.min(parseInt(sel.copies, 10) || 0, filled.length);
      for (let i = 0; i < n; i++) {
        // copies считает количество разных товаров; если copies > filled.length, добиваем последним.
        const item = filled[i] || filled[filled.length - 1];
        if (item) queue.push({ item, preset });
      }
    }
    if (!queue.length) return { count: 0, pages: 0 };

    // Рендерим каждый ценник под свой preset.
    const rendered = queue.map(q => renderWobblerForTemplate(q.item, q.preset));

    // Рабочая зона А4 (те же поля, что в обычной печати: 5 мм верх, 2 мм низ/бока).
    const mTop = 5, mBottom = 2, mSide = 2;
    const pageW = 210 - mSide * 2;
    const pageH = 297 - mTop - mBottom;
    const pages = packIntoPages(rendered, pageW, pageH, gap);

    // Строим DOM: страница → строки (flex) → обёртки ценников с явными размерами.
    for (const page of pages) {
      const pageEl = document.createElement('div');
      pageEl.className = 'print-page multi-print-page';
      // padding соответствует полям calcA4Grid.
      pageEl.style.padding = `${mTop}mm ${mSide}mm ${mBottom}mm ${mSide}mm`;
      for (const row of page.rows) {
        const rowEl = document.createElement('div');
        rowEl.className = 'multi-print-row';
        rowEl.style.height = `${row.h}mm`;
        rowEl.style.marginBottom = `${gap}mm`;
        for (const it of row.items) {
          const wrap = document.createElement('div');
          wrap.className = 'print-wobbler-wrapper multi-print-cell';
          wrap.style.width = `${it.wMm}mm`;
          wrap.style.height = `${it.effH}mm`;
          wrap.style.marginRight = `${gap}mm`;
          const node = it.node;
          const guides = node.querySelector('.crop-guides');
          if (guides) guides.style.display = showCrop ? '' : 'none';
          wrap.appendChild(node);
          if (showCrop) {
            const crop = document.createElement('div');
            crop.className = 'print-crop-marks';
            wrap.appendChild(crop);
          }
          rowEl.appendChild(wrap);
        }
        pageEl.appendChild(rowEl);
      }
      printArea.appendChild(pageEl);
    }
    return { count: rendered.length, pages: pages.length };
  }

  // Аналог triggerPrint для мульти-печати. selected — список отмеченных шаблонов.
  function triggerMultiPrint(selected, gap, showCrop) {
    const res = prepareMultiPrintArea(selected, gap, showCrop);
    if (!res.count) { alert('Нет заполненных ценников в выбранных шаблонах.'); return; }
    document.body.classList.add('is-printing');
    setTimeout(() => {
      window.print();
      setTimeout(() => {
        document.body.classList.remove('is-printing');
        printArea.innerHTML = '';   // очищаем мульти-печать после диалога
      }, 500);
    }, 150);
    return res;
  }

  // Apply State to Form Inputs
  function applyState(state) {
    wobblerWidthInput.value = state.widthCm || 6.5;
    wobblerHeightInput.value = state.heightCm || 4.5;

    document.querySelectorAll('.preset-size-btn').forEach(b => {
      const isMatch = b.getAttribute('data-w') == state.widthCm && b.getAttribute('data-h') == state.heightCm;
      b.classList.toggle('active', isMatch);
    });

    inputTitle.value = state.title || '';
    if (inputSubtitle) inputSubtitle.value = state.subtitle || '';
    // Инициализируем templateFonts из state (источник истины для шрифтов шаблона),
    // затем синхронизируем инпуты DOM под этот снимок. alignState тоже наполняем,
    // т.к. readFontSnapshotFromInputs() его использует.
    alignState.title = state.titleAlign || 'center';
    alignState.subtitle = state.subtitleAlign || 'left';
    alignState.price = state.priceAlign || 'center';
    templateFonts = {
      titleFont: state.titleFont || "Arial, sans-serif",
      titleColor: state.titleColor || '#ffffff',
      titleSize: state.titleSize || 13,
      titleWeight: state.titleWeight || '800',
      titleItalic: !!state.titleItalic,
      titleAlign: state.titleAlign || 'center',
      titleOffsetY: state.titleOffsetY != null ? state.titleOffsetY : 0,
      titleShadow: state.titleShadow || '',
      subtitleColor: state.subtitleColor || '#ffffff',
      subtitleSize: state.subtitleSize != null ? state.subtitleSize : 11,
      subtitleWeight: state.subtitleWeight || '700',
      subtitleAlign: state.subtitleAlign || 'left',
      priceFont: state.priceFont || "Arial, sans-serif",
      priceColor: state.priceColor || '#ffffff',
      priceSize: state.priceSize !== undefined ? state.priceSize : 40,
      priceWeight: state.priceWeight || '700',
      priceAlign: state.priceAlign || 'center',
      priceOffsetY: state.priceOffsetY != null ? state.priceOffsetY : 0,
      priceShadow: state.priceShadow || '',
      currency: state.currency != null ? state.currency : '₽'
    };
    // inputCurrency/inputPrice — это текстовые поля ценника, а не шрифтовые настройки;
    // синхронизируем их напрямую из state.
    inputCurrency.value = templateFonts.currency;
    inputPrice.value = state.price || '350';
    syncTitleSizePreview();

    // Инициализируем templateBg (фон #4) и templateDecor (декор-блоки #5) из state.
    // Это независимые модели; syncBgControlsToContext/syncDecorControlsToContext
    // (в конце applyState) синхронизируют инпуты.
    templateBg = {
      headerBg:     state.headerBg || '#18181b',
      bgImage:      state.bgImage || 'none',
      customBgData: state.customBgData || null
    };
    templateDecor = {
      outsideShow:     !!state.decorOutsideShow,
      outsideText:     state.decorOutsideText != null ? state.decorOutsideText : 'НОВИНКА',
      outsideBg:       state.decorOutsideBg || '#e63946',
      outsideBgImg:    state.decorOutsideBgImg || 'none',
      outsideCustomBg: state.decorOutsideCustomBg || null,
      outsideColor:    state.decorOutsideColor || '#ffffff',
      outsideFontSize: state.decorOutsideFontSize != null ? state.decorOutsideFontSize : 14,
      outsideHeight:   state.decorOutsideHeight != null ? state.decorOutsideHeight : 12,
      insideShow:      !!state.decorInsideShow,
      insideText:      state.decorInsideText != null ? state.decorInsideText : 'НОВИНКА',
      insideBg:        state.decorInsideBg || '#e63946',
      insideBgImg:     state.decorInsideBgImg || 'none',
      insideCustomBg:  state.decorInsideCustomBg || null,
      insideColor:     state.decorInsideColor || '#ffffff',
      insideFontSize:  state.decorInsideFontSize != null ? state.decorInsideFontSize : 11,
      insideHeight:    state.decorInsideHeight != null ? state.decorInsideHeight : 8,
      bottomShow:      !!state.decorBottomShow,
      bottomText:      state.decorBottomText != null ? state.decorBottomText : 'НОВИНКА',
      bottomBg:        state.decorBottomBg || '#e63946',
      bottomBgImg:     state.decorBottomBgImg || 'none',
      bottomCustomBg:  state.decorBottomCustomBg || null,
      bottomColor:     state.decorBottomColor || '#ffffff',
      bottomFontSize:  state.decorBottomFontSize != null ? state.decorBottomFontSize : 14,
      bottomHeight:    state.decorBottomHeight != null ? state.decorBottomHeight : 12
    };
    // insideWidth — только шаблонный (не в snapshot), пишем напрямую в контрол.
    if (decorInsideWidth) decorInsideWidth.value = state.decorInsideWidth != null ? state.decorInsideWidth : 50;

    headerHeightRange.value = state.headerHeight || 100;

    // Safe-зона названия (доли 0..0.45). Источник истины — JS-переменная, т.к.
    // числовые поля L/R/T/B убраны из UI (drag-редактор границ тоже пишет сюда).
    {
      const ts = normTitleSafe(state.titleSafe);
      globalTitleSafe = { left: ts.left, right: ts.right, top: ts.top, bottom: ts.bottom };
    }

    if (gapInput) {
      const gv = state.gapMm != null ? parseFloat(state.gapMm) : 0;
      gapInput.value = isNaN(gv) ? 0 : Math.max(0, Math.min(5, gv));
      if (gapMmVal) gapMmVal.textContent = gapInput.value;
    }

    // Раскладка берётся из шаблона (раньше была radio-группа «Формат воблера»).
    currentLayout = (state.layout === 'split') ? 'split' : 'full';
    // Белая рамка вокруг графики фона (мм). Применяется в updatePreview к шапке.
    borderMm = Math.max(0, parseFloat(state.borderMm) || 0);
    // Наклон текстовых слоёв (градусы). Применяется в updatePreview/печати.
    layerRotate = parseFloat(state.layerRotate) || 0;

    // Размещение цены: в нижнем блоке (для шаблонов типа «Рыба») или в верхнем
    rybaPriceInBottom = !!state.priceInBottom;
    // Подзаголовок (вес) в нижнем левом углу
    subtitleCorner = !!state.subtitleCorner;
    // Светлая плашка под ценой
    if (pricePlateToggle) pricePlateToggle.checked = !!state.pricePlate;

    // Ручные смещения надписей (из шаблона/пресета) — применяем как базу
    // и к глобальной переменной, и к позициям активного товара/одиночного режима.
    function mergeLabelPos(src) {
      const base = defaultLabelPos();
      if (!src) return base;
      return {
        title: Object.assign(base.title, src.title || {}),
        subtitle: Object.assign(base.subtitle, src.subtitle || {}),
        price: Object.assign(base.price, src.price || {}),
        priceDigits: Array.isArray(src.priceDigits) ? src.priceDigits.map(d => ({ x: (d && d.x) || 0, y: (d && d.y) || 0 })) : [],
        currency: Object.assign(base.currency, src.currency || {})
      };
    }
    labelPos = mergeLabelPos(state.labelPos);
    singleLabelPos = mergeLabelPos(state.labelPos);
    // В мультирежиме применяем базу к активному товару
    if (document.querySelector('input[name="printMode"]:checked').value === 'multi') {
      const it = itemsData[activePreviewIndex];
      if (it) it.labelPos = mergeLabelPos(state.labelPos);
      // Вес и цена общие для всех ценников: разносим базу пресета с активного
      // ценника на все остальные (включая №1).
      const src = itemsData[activePreviewIndex];
      if (src && src.labelPos && itemsData[0]) {
        if (!itemsData[0].labelPos) itemsData[0].labelPos = defaultLabelPos();
        itemsData[0].labelPos.subtitle = JSON.parse(JSON.stringify(src.labelPos.subtitle));
        itemsData[0].labelPos.price = JSON.parse(JSON.stringify(src.labelPos.price));
        itemsData[0].labelPos.priceDigits = JSON.parse(JSON.stringify(src.labelPos.priceDigits));
        itemsData[0].labelPos.currency = JSON.parse(JSON.stringify(src.labelPos.currency));
      }
      applySharedPosFromFirstToAll();
    }

    ['title', 'subtitle', 'price'].forEach(target => {
      document.querySelectorAll(`.align-btn[data-target="${target}"]`).forEach(b => {
        b.classList.toggle('active', b.getAttribute('data-align') === (alignState[target] || 'center'));
      });
    });

    // После программной установки значений (через .value) textarea не растёт
    // автоматически — подгоняем высоту под новое содержимое.
    document.querySelectorAll('textarea').forEach(autoGrowTextarea);

    // Шрифтовые инпуты показывают состояние активного контекста (template или
    // per-item ценника). После применения state — пересинхронизируем их.
    syncFontControlsToContext();
    // Декор-блоки и фон (независимые модели) — аналогично.
    syncDecorControlsToContext();
    syncBgControlsToContext();

    updatePreview();
  }

  // Get Current State Object from Inputs
  function getCurrentState() {
    // Шрифтовые поля берём из templateFonts (источник истины шаблона), а НЕ из
    // инпутов DOM — в multi+item-режиме инпуты могут показывать per-item override
    // выбранного ценника, и нам нельзя сохранять его как оформление шаблона.
    const tf = templateFonts || readFontSnapshotFromInputs();
    const td = templateDecor || readDecorSnapshotFromInputs();
    const tb = templateBg || readBgSnapshotFromInputs();
    return {
      widthCm: parseFloat(wobblerWidthInput.value) || 6.5,
      heightCm: parseFloat(wobblerHeightInput.value) || 4.5,

      title: inputTitle.value,
      subtitle: inputSubtitle ? inputSubtitle.value : '',
      titleFont: tf.titleFont,
      titleColor: tf.titleColor,
      titleSize: tf.titleSize,
      titleWeight: tf.titleWeight,
      titleItalic: !!tf.titleItalic,
      titleAlign: tf.titleAlign,
      titleOffsetY: tf.titleOffsetY,
      titleShadow: tf.titleShadow,
      subtitleColor: tf.subtitleColor,
      subtitleSize: tf.subtitleSize,
      subtitleWeight: tf.subtitleWeight,
      subtitleAlign: tf.subtitleAlign,

      showPrice: showPriceToggle.checked,
      priceFont: tf.priceFont,
      priceSize: tf.priceSize,
      priceWeight: tf.priceWeight,
      priceColor: tf.priceColor,
      priceAlign: tf.priceAlign,
      priceOffsetY: tf.priceOffsetY,
      priceShadow: tf.priceShadow,
      price: inputPrice.value,
      currency: tf.currency,

      // Оформление и фон берём из templateDecor (источник истины шаблона), а НЕ из
      // инпутов DOM — в multi+item-режиме инпуты могут показывать per-item override
      // выбранного ценника. headerHeight и insideWidth — только шаблонные (всегда DOM).
      headerBg: tb.headerBg,
      bgImage: tb.bgImage,
      customBgData: tb.customBgData,
      headerHeight: headerHeightRange.value,
      titleSafe: normTitleSafe(globalTitleSafe),
      layout: currentLayout,
      borderMm: borderMm,
      layerRotate: layerRotate,
      priceInBottom: rybaPriceInBottom,
      subtitleCorner: subtitleCorner,
      pricePlate: pricePlateToggle ? pricePlateToggle.checked : false,
      // Декоративные блоки «Оформление»
      decorOutsideShow: td.outsideShow,
      decorOutsideText: td.outsideText,
      decorOutsideBg: td.outsideBg,
      decorOutsideBgImg: td.outsideBgImg,
      decorOutsideCustomBg: td.outsideCustomBg,
      decorOutsideColor: td.outsideColor,
      decorOutsideFontSize: td.outsideFontSize,
      decorOutsideHeight: td.outsideHeight,
      decorInsideShow: td.insideShow,
      decorInsideText: td.insideText,
      decorInsideBg: td.insideBg,
      decorInsideBgImg: td.insideBgImg,
      decorInsideCustomBg: td.insideCustomBg,
      decorInsideColor: td.insideColor,
      decorInsideFontSize: td.insideFontSize,
      decorInsideHeight: td.insideHeight,
      decorInsideWidth: decorInsideWidth ? decorInsideWidth.value : 50,
      decorBottomShow: td.bottomShow,
      decorBottomText: td.bottomText,
      decorBottomBg: td.bottomBg,
      decorBottomBgImg: td.bottomBgImg,
      decorBottomCustomBg: td.bottomCustomBg,
      decorBottomColor: td.bottomColor,
      decorBottomFontSize: td.bottomFontSize,
      decorBottomHeight: td.bottomHeight,
      // Зазор между ценниками на листе А4 (мм); 0 = встык.
      gapMm: gapInput ? (parseFloat(gapInput.value) || 0) : 0,
      labelPos: JSON.parse(JSON.stringify(activeLabelPos()))
    };
  }

  // ===== Экспорт / Импорт шаблонов =====
  // Файл экспорта — самодостаточный JSON:
  //   { app, version, exportedAt, templates: [ {name, state, _embeddedBgs} ] }
  // state — полный объект из getCurrentState() (все параметры: размер, шрифты,
  // цвета, фоны, смещения, labelPos и т.д.). _embeddedBgs хранит встроенные
  // фоны-картинки (dots_bg.jpg / ryba_bg.jpg) в base64, чтобы импортированный
  // шаблон работал даже на другом устройстве без этих файлов.

  // Встроенные фоны, которые умеем встраивать в экспорт.
  const EMBEDDABLE_BGS = ['dots_bg.jpg', 'ryba_bg.jpg', 'yellow_bg.jpg', 'sneki_bg.jpg', 'sort_nedeli_bg.jpg'];

  // Читает встроенный файл фона как data:URL (base64). null при ошибке/отсутствии.
  async function fetchBgAsDataUrl(filename) {
    try {
      const resp = await fetch(filename, { cache: 'force-cache' });
      if (!resp.ok) return null;
      const blob = await resp.blob();
      return await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    } catch (e) {
      return null;
    }
  }

  // Безопасное имя файла из названия шаблона.
  function safeFileName(name) {
    return (name || 'wobbler_template').replace(/[\\/:*?"<>|]+/g, '_').trim() || 'wobbler_template';
  }

  // Готовит запись экспорта из {name, state}: глубокая копия state + карта
  // встроенных фонов в base64 (если state.bgImage ссылается на встроенный файл).
  async function buildExportEntry(entry) {
    const state = JSON.parse(JSON.stringify(entry.state || {}));
    const embedded = {};
    if (EMBEDDABLE_BGS.indexOf(state.bgImage) !== -1) {
      const dataUrl = await fetchBgAsDataUrl(state.bgImage);
      if (dataUrl) embedded[state.bgImage] = dataUrl;
    }
    return { name: entry.name, state: state, _embeddedBgs: embedded };
  }

  // Скачивает JSON-строку под заданным именем файла.
  function triggerDownload(jsonStr, filename) {
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename.endsWith('.json') ? filename : filename + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  // Экспортирует массив {name, state} в один .json-файл.
  async function exportTemplates(entries, defaultName) {
    const out = [];
    for (const e of entries) {
      // eslint-disable-next-line no-await-in-loop
      out.push(await buildExportEntry(e));
    }
    const payload = {
      app: 'wobbler_designer',
      version: 1,
      exportedAt: new Date().toISOString(),
      templates: out
    };
    triggerDownload(JSON.stringify(payload, null, 2), defaultName || 'wobbler_templates');
  }

  // Превращает встроенный фон (dots_bg.jpg/ryba_bg.jpg) в пользовательский
  // (customBgData), если он есть в карте embedded. Шаблон становится
  // самодостаточным (через существующий механизм customBgData/applyState).
  function restoreEmbeddedBgs(state, embedded) {
    if (!embedded || !state) return state;
    const refName = state.bgImage;
    if (EMBEDDABLE_BGS.indexOf(refName) !== -1 && embedded[refName]) {
      state.customBgData = embedded[refName];
      state.bgImage = 'custom';
    }
    return state;
  }

  // Спрашивает у пользователя решение по дубликату имени импортируемого шаблона.
  // Возвращает 'overwrite' | 'add' | 'skip'.
  function askImportDecision(name) {
    const overwrite = confirm(
      'Шаблон с именем «' + name + '» уже существует.\n\n' +
      'OK — ПЕРЕЗАПИСАТЬ (заменить существующий).\n' +
      'Отмена — выбрать другое действие.'
    );
    if (overwrite) return 'overwrite';
    const addNew = confirm(
      'Что делать с «' + name + '»?\n\n' +
      'OK — ДОБАВИТЬ как новый шаблон (с суффиксом « (импорт)»).\n' +
      'Отмена — ПРОПУСТИТЬ этот шаблон.'
    );
    return addNew ? 'add' : 'skip';
  }

  // Обрабатывает один разобранный файл импорта: валидирует, для каждого шаблона
  // спрашивает решение по дубликатам, применяет (add/overwrite) и сохраняет.
  function processImport(payload) {
    if (!payload || typeof payload !== 'object') {
      alert('Файл не распознан как файл шаблонов.');
      return;
    }
    let list = null;
    // Поддерживаем оба формата: «один шаблон» и «коллекция».
    if (Array.isArray(payload.templates)) {
      list = payload.templates;
    } else if (payload.state) {
      list = [payload];
    } else {
      alert('В файле не найден список шаблонов (templates).');
      return;
    }

    const existingNames = customTemplates.map(function (t) { return t.name; });
    let added = 0, skipped = 0;

    list.forEach(function (raw) {
      if (!raw || typeof raw.name !== 'string' || !raw.state || typeof raw.state !== 'object') {
        skipped++;
        return;
      }
      const state = restoreEmbeddedBgs(JSON.parse(JSON.stringify(raw.state)), raw._embeddedBgs);
      const name = raw.name.trim();
      const dupIndex = existingNames.indexOf(name);

      let decision = 'add';
      if (dupIndex !== -1) {
        decision = askImportDecision(name);
      }

      if (decision === 'skip') {
        skipped++;
      } else if (decision === 'overwrite') {
        customTemplates[dupIndex] = { name: name, state: state };
        added++;
      } else { // add
        let newName = name;
        while (existingNames.indexOf(newName) !== -1) {
          newName = newName + ' (импорт)';
        }
        customTemplates.push({ name: newName, state: state });
        existingNames.push(newName);
        added++;
      }
    });

    localStorage.setItem('wobbler_custom_templates_gas', JSON.stringify(customTemplates));
    renderSavedTemplates();
    alert('Импорт завершён.\nДобавлено/обновлено: ' + added + '\nПропущено: ' + skipped);
  }

  // Render Saved Templates List
  function renderSavedTemplates() {
    userTemplatesContainer.innerHTML = '';
    userCount.textContent = customTemplates.length;

    if (customTemplates.length === 0) {
      emptyUserTemplates.style.display = 'block';
      userTemplatesContainer.appendChild(emptyUserTemplates);
      return;
    }

    emptyUserTemplates.style.display = 'none';

    customTemplates.forEach((item, index) => {
      const card = document.createElement('div');
      card.className = 'preset-card';
      const sizeText = item.state.widthCm ? `${item.state.widthCm}×${item.state.heightCm} см` : '6.5×4.5 см';
      card.innerHTML = `
        <div class="preset-color custom"></div>
        <div class="preset-info">
          <span class="preset-title">${item.name}</span>
          <span class="preset-desc">Размер: ${sizeText}</span>
        </div>
        <button class="btn-export-template" title="Экспорт шаблона" data-index="${index}">⬇️</button>
        <button class="btn-delete-template" title="Удалить шаблон" data-index="${index}">🗑️</button>
      `;

      card.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-delete-template')) return;
        if (e.target.classList.contains('btn-export-template')) return;
        document.querySelectorAll('.preset-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        activeTemplateId = index;   // выбранный пользовательский шаблон — цель для «Обновить»
        activeTemplateRef = { kind: 'custom', index };
        applyState(item.state);
      });

      const delBtn = card.querySelector('.btn-delete-template');
      delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm(`Удалить шаблон "${item.name}"?`)) {
          customTemplates.splice(index, 1);
          // Если удалили активный — сбрасываем выбор (и ref)
          if (activeTemplateId === index) {
            activeTemplateId = null;
            activeTemplateRef = null;
          } else if (activeTemplateId !== null && activeTemplateId > index) {
            activeTemplateId -= 1;
            if (activeTemplateRef && activeTemplateRef.kind === 'custom' && activeTemplateRef.index > index) {
              activeTemplateRef.index -= 1;
            }
          }
          localStorage.setItem('wobbler_custom_templates_gas', JSON.stringify(customTemplates));
          renderSavedTemplates();
        }
      });

      const exportBtn = card.querySelector('.btn-export-template');
      exportBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        exportTemplates([item], safeFileName(item.name));
      });

      userTemplatesContainer.appendChild(card);
    });
  }

  // Preset Handlers
  document.querySelectorAll('#builtInTemplates .preset-card').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.preset-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      activeTemplateId = null;   // встроенный пресет выбран

      const key = card.getAttribute('data-preset');
      const p = builtInPresets[key];
      if (p) {
        // Запоминаем выбранный встроенный пресет — «Обновить» создаст пользовательскую копию.
        activeTemplateRef = { kind: 'builtin', key };
        // Per-template товары: переключаем активный массив товаров этого шаблона.
        // Каждый пресет хранит свой список независимо (см. templateItems).
        if (templateItems[key]) {
          itemsData = templateItems[key];
          renderItemsListInputs();
        }
        applyState(p);
        // Авто-подгон размеров названий под геометрию нового шаблона. Двойной RAF:
        // первый кадр применяет стили applyState (размер/раскладка/шрифты), второй —
        // гарантирует, что layout пересчитан и previewTitle.clientWidth/clientHeight
        // актуальны для fitTitleSize. Если превью скрыто (бюджет 0), fitTitleSize
        // вернёт null и размер останется от templateFonts.
        requestAnimationFrame(() => requestAnimationFrame(autoFitFontSize));
      }
    });
  });

  // Tab Handlers
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

      btn.classList.add('active');
      const tabId = btn.getAttribute('data-tab');
      if (tabId === 'builtIn') {
        document.getElementById('builtInTemplates').classList.add('active');
      } else {
        document.getElementById('userTemplates').classList.add('active');
      }
    });
  });

  // Имя активного шаблона по activeTemplateRef (для подсказки/имени по умолчанию)
  function activeTemplateName() {
    if (!activeTemplateRef) return '';
    if (activeTemplateRef.kind === 'custom') {
      const t = customTemplates[activeTemplateRef.index];
      return t ? t.name : '';
    }
    if (activeTemplateRef.kind === 'builtin') {
      const p = builtInPresets[activeTemplateRef.key];
      return p ? p.name : '';
    }
    return '';
  }

  // Объект пресета активного шаблона (для сброса к виду шаблона).
  // Встроенный — builtInPresets[key], пользовательский — customTemplates[index].state.
  function currentPresetState() {
    if (!activeTemplateRef) return null;
    if (activeTemplateRef.kind === 'custom') {
      const t = customTemplates[activeTemplateRef.index];
      return t ? t.state : null;
    }
    if (activeTemplateRef.kind === 'builtin') {
      return builtInPresets[activeTemplateRef.key] || null;
    }
    return null;
  }

  // Обновить состояние кнопки/подсказки «Обновить» в модалке сохранения
  function refreshUpdateTemplateUI() {
    const hasRef = !!activeTemplateRef;
    if (updateTemplateBtn) updateTemplateBtn.disabled = !hasRef;
    if (saveModalHint) {
      const name = activeTemplateName();
      if (hasRef && name) {
        const kindLabel = activeTemplateRef.kind === 'builtin' ? 'базовый' : 'пользовательский';
        saveModalHint.style.display = 'block';
        saveModalHint.textContent = `🔄 Будет обновлён ${kindLabel} шаблон: «${name}»` +
          (activeTemplateRef.kind === 'builtin'
            ? ' (создаст персональную копию, т.к. базовые шаблоны неизменяемы)'
            : '');
      } else {
        saveModalHint.style.display = 'none';
        saveModalHint.textContent = '';
      }
    }
  }

  // Modal Handlers for Saving New Templates
  saveTemplateBtn.addEventListener('click', () => {
    newTemplateNameInput.value = '';
    refreshUpdateTemplateUI();
    saveModal.classList.add('active');
    newTemplateNameInput.focus();
  });

  cancelSaveModal.addEventListener('click', () => {
    saveModal.classList.remove('active');
  });

  confirmSaveModal.addEventListener('click', () => {
    const name = newTemplateNameInput.value.trim();
    if (!name) {
      alert('Пожалуйста, введите название шаблона');
      return;
    }

    const state = getCurrentState();
    customTemplates.push({ name, state });
    localStorage.setItem('wobbler_custom_templates_gas', JSON.stringify(customTemplates));

    // Только что созданный шаблон становится активным (можно сразу обновлять)
    activeTemplateId = customTemplates.length - 1;
    activeTemplateRef = { kind: 'custom', index: activeTemplateId };
    saveModal.classList.remove('active');
    renderSavedTemplates();
    document.querySelector('.tab-btn[data-tab="userSaved"]').click();
  });

  // ===== Модал «Перенести товары на другой шаблон» =====
  // Копирует таблицу товаров активного встроенного шаблона в выбранные
  // (глубокий клон — каждый приёмник получает независимую копию данных).
  const copyItemsBtn = document.getElementById('copyItemsBtn');
  const copyItemsModal = document.getElementById('copyItemsModal');
  const copyItemsTargets = document.getElementById('copyItemsTargets');
  const copyItemsHint = document.getElementById('copyItemsHint');

  function openCopyItemsModal() {
    const currentKey = (activeTemplateRef && activeTemplateRef.kind === 'builtin') ? activeTemplateRef.key : null;
    const filledCount = itemsData.filter(it => it && (it.title || '').trim()).length;
    if (copyItemsHint) {
      copyItemsHint.textContent = `Текущая таблица (${filledCount} заполненных тов.) скопируется в выбранные шаблоны, заменив их данные.`;
    }
    // Список всех встроенных шаблонов, кроме текущего.
    copyItemsTargets.innerHTML = TEMPLATE_KEYS
      .filter(k => k !== currentKey)
      .map(k => `<label class="copy-target"><input type="checkbox" value="${k}"> ${builtInPresets[k].name}</label>`)
      .join('');
    copyItemsModal.classList.add('active');
  }
  if (copyItemsBtn) copyItemsBtn.addEventListener('click', openCopyItemsModal);
  if (copyItemsModal) {
    copyItemsModal.addEventListener('click', e => { if (e.target === copyItemsModal) copyItemsModal.classList.remove('active'); });
  }
  const cancelCopyItems = document.getElementById('cancelCopyItems');
  if (cancelCopyItems) cancelCopyItems.addEventListener('click', () => copyItemsModal.classList.remove('active'));
  const confirmCopyItems = document.getElementById('confirmCopyItems');
  if (confirmCopyItems) confirmCopyItems.addEventListener('click', () => {
    const targets = [...copyItemsTargets.querySelectorAll('input[type=checkbox]:checked')].map(cb => cb.value);
    if (!targets.length) { alert('Выберите хотя бы один шаблон'); return; }
    // Копируем ТОЛЬКО текстовые поля (название/вес/цена). Per-item оформление
    // (шрифты/декор/фон/позиции) НЕ переносится — каждый ценник в новом шаблоне
    // наследует оформление этого шаблона (templateFonts/templateDecor/templateBg),
    // а размер названий пересчитается автоподгоном под геометрию нового шаблона.
    // labelPos — стандарт нового шаблона (через sharedLabelPosForNewItem при создании).
    const sourceCopy = itemsData.map(it => {
      if (!it) return { title: '', price: '', subtitle: '', subtitleManual: false };
      return {
        title: it.title || '',
        price: it.price || '',
        subtitle: it.subtitle || '',
        subtitleManual: !!it.subtitleManual
      };
    });
    targets.forEach(k => {
      // Каждый приёмник получает независимую копию; labelPos проставится стандартом
      // шаблона-приёмника в renderItemsListInputs/normalizeItemsArray.
      templateItems[k] = sourceCopy.map(it => JSON.parse(JSON.stringify(it)));
    });
    copyItemsModal.classList.remove('active');
    renderItemsListInputs();
    updatePreview();
  });


  // ===== Экспорт / Импорт: обработчики кнопок =====
  if (exportAllBtn) {
    exportAllBtn.addEventListener('click', () => {
      if (customTemplates.length === 0) {
        alert('Нет пользовательских шаблонов для экспорта.\nСначала создайте шаблон в разделе «Мои шаблоны».');
        return;
      }
      exportTemplates(customTemplates, 'wobbler_templates_all');
    });
  }

  if (importBtn && importFileInput) {
    importBtn.addEventListener('click', () => {
      importFileInput.value = '';   // сбрасываем, чтобы можно было выбрать тот же файл повторно
      importFileInput.click();
    });

    importFileInput.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function (ev) {
        try {
          const payload = JSON.parse(ev.target.result);
          processImport(payload);
        } catch (err) {
          alert('Не удалось прочитать файл шаблонов.\n' + (err && err.message ? err.message : ''));
        }
      };
      reader.onerror = function () {
        alert('Ошибка чтения файла.');
      };
      reader.readAsText(file);
    });
  }

  // Обновить выбранный шаблон. Для встроенного (builtin) пресета создаём
  // персональную копию, т.к. builtInPresets — константа и мутировать её нельзя.
  if (updateTemplateBtn) {
    updateTemplateBtn.addEventListener('click', () => {
      if (!activeTemplateRef) {
        alert('Сначала выберите шаблон для обновления');
        return;
      }
      const state = getCurrentState();

      if (activeTemplateRef.kind === 'custom') {
        const t = customTemplates[activeTemplateRef.index];
        if (!t) {
          alert('Шаблон не найден. Сохраните как новый.');
          return;
        }
        t.state = state;
        localStorage.setItem('wobbler_custom_templates_gas', JSON.stringify(customTemplates));
        saveModal.classList.remove('active');
        renderSavedTemplates();
        document.querySelector('.tab-btn[data-tab="userSaved"]').click();
        return;
      }

      // builtin → создаём пользовательскую копию с тем же именем (+суффикс)
      if (activeTemplateRef.kind === 'builtin') {
        const preset = builtInPresets[activeTemplateRef.key];
        const baseName = preset ? preset.name : 'Шаблон';
        const name = (newTemplateNameInput.value.trim()) || (baseName + ' (изменён)');
        customTemplates.push({ name, state });
        localStorage.setItem('wobbler_custom_templates_gas', JSON.stringify(customTemplates));
        const newIndex = customTemplates.length - 1;
        activeTemplateRef = { kind: 'custom', index: newIndex };
        activeTemplateId = newIndex;
        saveModal.classList.remove('active');
        renderSavedTemplates();
        document.querySelector('.tab-btn[data-tab="userSaved"]').click();
        alert(`Базовый шаблон нельзя перезаписать напрямую.\n\nСоздана персональная копия: «${name}».\nТеперь её можно обновлять как обычный шаблон.`);
        return;
      }
    });
  }

  // Event Listeners for Input Changes
  // ВНИМАНИЕ: шрифтовые, оформительские (decor*) и фоновые (headerBgColor, bgImageSelect)
  // инпуты сюда НЕ входят — они обрабатываются отдельными onFontInputChange /
  // onDecorInputChange / onBgInputChange (per-item/template логика трёх независимых моделей).
  const allInputs = [
    wobblerWidthInput, wobblerHeightInput,
    inputTitle, inputSubtitle,
    showPriceToggle, inputPrice, pricePlateToggle,
    headerHeightRange,
    sheetCount, singleRepeatCount, showCropMarks, gapInput
  ];

  // Единый обработчик изменения любого шрифтового инпута: снимает текущие значения
  // и пишет их в активный контекст — per-item (выбранный ценник) в multi+item-режиме,
  // иначе в templateFonts. После — updatePreview.
  function onFontInputChange() {
    const snap = readFontSnapshotFromInputs();
    if (isMultiModeNow() && fontApplyMode === 'item') {
      const it = itemsData[activePreviewIndex] || (itemsData[activePreviewIndex] = {});
      it.fonts = snap;
      it.fontsCustomized = true;
    } else {
      templateFonts = snap;
    }
    updatePreview();
  }

  // Все шрифтовые контролы → onFontInputChange.
  const fontInputs = [
    titleFont, titleColor, titleSize, titleWeight, titleItalic, titleOffsetY, titleShadow, titleShadowColor,
    subtitleColor, subtitleSize, subtitleWeight,
    priceFont, priceSize, priceWeight, priceColor, priceOffsetY, priceShadow, priceShadowColor, inputCurrency
  ];
  fontInputs.forEach(el => {
    if (!el) return;
    el.addEventListener('input', onFontInputChange);
    el.addEventListener('change', onFontInputChange);
  });

  // Единый обработчик изменения любого оформительского инпута (декор-блоки #5):
  // снимает текущие значения и пишет в активный контекст — per-item в multi+item-режиме,
  // иначе в templateDecor. После — updatePreview.
  function onDecorInputChange() {
    const snap = readDecorSnapshotFromInputs();
    if (isMultiModeNow() && decorApplyMode === 'item') {
      const it = itemsData[activePreviewIndex] || (itemsData[activePreviewIndex] = {});
      it.decor = snap;
      it.decorCustomized = true;
    } else {
      templateDecor = snap;
    }
    updatePreview();
  }
  // Контролы декор-блоков → onDecorInputChange. insideWidth — только шаблонный,
  // но тоже проходит через обработчик (пишется в templateDecor через snapshot).
  const decorInputs = [
    decorOutsideShow, decorOutsideText, decorOutsideBg, decorOutsideBgImg, decorOutsideColor, decorOutsideFontSize, decorOutsideHeight,
    decorInsideShow, decorInsideText, decorInsideBg, decorInsideBgImg, decorInsideColor, decorInsideFontSize, decorInsideHeight, decorInsideWidth,
    decorBottomShow, decorBottomText, decorBottomBg, decorBottomBgImg, decorBottomColor, decorBottomFontSize, decorBottomHeight
  ];
  decorInputs.forEach(el => {
    if (!el) return;
    el.addEventListener('input', onDecorInputChange);
    el.addEventListener('change', onDecorInputChange);
  });

  // Единый обработчик изменения инпутов ФОНА (#4): пишет в активный контекст —
  // per-item (itemsData[i].bg) в multi+item-режиме, иначе в templateBg.
  function onBgInputChange() {
    const snap = readBgSnapshotFromInputs();
    if (isMultiModeNow() && bgApplyMode === 'item') {
      const it = itemsData[activePreviewIndex] || (itemsData[activePreviewIndex] = {});
      it.bg = snap;
      it.bgCustomized = true;
    } else {
      templateBg = snap;
    }
    updatePreview();
  }
  const bgInputs = [headerBgColor, bgImageSelect];
  bgInputs.forEach(el => {
    if (!el) return;
    el.addEventListener('input', onBgInputChange);
    el.addEventListener('change', onBgInputChange);
  });

  // === Ползунок размера наименования в тулбаре предпросмотра ===
  // Дублирует #titleSize: двусторонняя синхронизация. syncTitleSizePreview()
  // вызывается во всех точках, где приложение меняет titleSize.value, чтобы
  // ползунок предпросмотра следовал за оригиналом.
  function syncTitleSizePreview() {
    if (!titleSize || !titleSizePreview) return;
    titleSizePreview.value = titleSize.value;
    if (titleSizePreviewVal) titleSizePreviewVal.textContent = titleSize.value;
  }
  if (titleSizePreview) {
    const onPreviewInput = () => {
      if (!titleSize) return;
      titleSize.value = titleSizePreview.value;
      if (titleSizeVal) titleSizeVal.textContent = titleSizePreview.value;
      if (titleSizePreviewVal) titleSizePreviewVal.textContent = titleSizePreview.value;
      // Программная установка titleSize.value не порождает событие input —
      // поэтому per-item/template запись делегируем явно.
      onFontInputChange();
    };
    titleSizePreview.addEventListener('input', onPreviewInput);
    titleSizePreview.addEventListener('change', onPreviewInput);
  }

  // Умный перенос названия по словам: при вводе наименования (single) и при
  // смене шрифта/толщины (влияют на ширину слов) — заново подгоняем кегль под
  // размер ценника. Слайдер сюда НЕ подключён — ручная правка держится до
  // следующего ввода текста/шрифта. refitActiveTitle сам зовёт updatePreview.
  if (inputTitle) inputTitle.addEventListener('input', refitActiveTitle);
  if (titleFont) titleFont.addEventListener('change', refitActiveTitle);
  if (titleWeight) titleWeight.addEventListener('change', refitActiveTitle);

  allInputs.forEach(el => {
    if (el) {
      el.addEventListener('input', updatePreview);
      el.addEventListener('change', updatePreview);
    }
  });

  // Авто-рост textarea под содержимое: при переносе строки поле удлиняется,
  // а на ценнике текст переносится (white-space: pre-line у элементов рендера).
  function autoGrowTextarea(el) {
    if (!el || el.tagName !== 'TEXTAREA') return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }
  // Все textarea приложения (наименование, вес/доп.текст, тексты декор-блоков).
  document.querySelectorAll('textarea').forEach(el => {
    autoGrowTextarea(el);
    el.addEventListener('input', () => autoGrowTextarea(el));
  });

  // Свободный ввод цены: любое событие 'input' в поле сразу обновляет предпросмотр.
  if (priceFreeInput) {
    priceFreeInput.addEventListener('input', () => updatePreview());
  }

  // === Ручное перетаскивание надписей в предпросмотре ===
  const dragModeSoloToggle = document.getElementById('dragModeSoloToggle');

  // Тумблер «Двигать надписи» включает общий режим drag-mode: положение
  // перетаскиваемой надписи разносится на все ценники листа.
  if (dragModeToggle) {
    dragModeToggle.addEventListener('click', () => {
      const on = wobblerPreview.classList.toggle('drag-mode');
      dragModeToggle.classList.toggle('active', on);
      if (on) {   // выключаем взаимоисключающие режимы
        wobblerPreview.classList.remove('safe-edit-mode');
        if (safeEditToggle) safeEditToggle.classList.remove('active');
        wobblerPreview.classList.remove('drag-mode-solo');
        if (dragModeSoloToggle) dragModeSoloToggle.classList.remove('active');
        dragBroadcast = true;   // общий режим — рассылка на все ценники
      }
    });
  }
  // Тумблер «Двигать отдельно» — двигается только выбранный ценник,
  // остальные ценники листа не меняются (рассылка отключена).
  if (dragModeSoloToggle) {
    dragModeSoloToggle.addEventListener('click', () => {
      const on = wobblerPreview.classList.toggle('drag-mode-solo');
      dragModeSoloToggle.classList.toggle('active', on);
      if (on) {
        wobblerPreview.classList.remove('safe-edit-mode');
        if (safeEditToggle) safeEditToggle.classList.remove('active');
        wobblerPreview.classList.remove('drag-mode');
        if (dragModeToggle) dragModeToggle.classList.remove('active');
        dragBroadcast = false;   // раздельный режим — без рассылки
      }
    });
  }
  // Тумблер «Границы текста» включает режим safe-edit-mode: поверх шапки
  // показывается редактируемый прямоугольник (края тянутся мышью).
  if (safeEditToggle) {
    safeEditToggle.addEventListener('click', () => {
      const on = wobblerPreview.classList.toggle('safe-edit-mode');
      safeEditToggle.classList.toggle('active', on);
      if (on) {   // выключаем оба режима перетаскивания надписей
        wobblerPreview.classList.remove('drag-mode');
        if (dragModeToggle) dragModeToggle.classList.remove('active');
        wobblerPreview.classList.remove('drag-mode-solo');
        if (dragModeSoloToggle) dragModeSoloToggle.classList.remove('active');
        // Сразу позиционируем прямоугольник по текущим долям.
        positionSafeRect(resolveItemBg(activePreviewIndex).titleSafe);
      }
    });
  }

  // Сброс смещений АКТИВНОГО ценника к виду шаблона: расположение надписей,
  // индивидуальные шрифты/цвета/декор/фон → к шаблону, границы текста → к шаблону.
  // Текст товара (наименование/вес/цена) сохраняется.
  function resetActiveToTemplate() {
    const preset = currentPresetState();
    if (!preset) { updatePreview(); return; }
    const lp = activeLabelPos();
    const src = cloneLabelPos(preset.labelPos);
    lp.title = src.title; lp.subtitle = src.subtitle; lp.price = src.price;
    lp.priceDigits = src.priceDigits; lp.currency = src.currency;
    // Снимаем per-item переопределения оформления активного ценника → шаблон.
    resetItemVisuals(activePreviewIndex);
    // Границы текста — свойство шаблона (глобальны), возвращаем к пресету.
    const ts = normTitleSafe(preset.titleSafe);
    globalTitleSafe = { left: ts.left, right: ts.right, top: ts.top, bottom: ts.bottom };
    // Сбрасываем активные режимы перетаскивания/границ.
    wobblerPreview.classList.remove('drag-mode', 'drag-mode-solo', 'safe-edit-mode');
    if (dragModeToggle) dragModeToggle.classList.remove('active');
    if (dragModeSoloToggle) dragModeSoloToggle.classList.remove('active');
    if (safeEditToggle) safeEditToggle.classList.remove('active');
    fontApplyMode = 'item';
    decorApplyMode = 'item';
    bgApplyMode = 'item';
    syncFontControlsToContext();
    syncDecorControlsToContext();
    syncBgControlsToContext();
    updatePreview();
  }

  // Сброс ВСЕГО внешнего вида к шаблону: позиции + шрифты/цвета/границы/раскладка/
  // декор/фон для всех ценников. Товары (наименование/вес/цена) сохраняются.
  function resetAllToTemplate() {
    const preset = currentPresetState();
    if (!preset) { updatePreview(); return; }
    // Сохраняем single-mode текстовые поля — applyState затирает их значениями пресета.
    const savedTitle = inputTitle.value;
    const savedSubtitle = inputSubtitle ? inputSubtitle.value : '';
    const savedPrice = inputPrice.value;
    const savedCurrency = inputCurrency.value;
    // applyState восстанавливает шрифты/цвета/раскладку/декор/фон/границы/позиции
    // из пресета; товары (itemsData[i].title/price/subtitle) он не трогает.
    applyState(preset);
    // Возвращаем сохранённые single-mode поля.
    inputTitle.value = savedTitle;
    if (inputSubtitle) inputSubtitle.value = savedSubtitle;
    inputPrice.value = savedPrice;
    inputCurrency.value = savedCurrency;
    // Снимаем per-item переопределения оформления у всех ценников → шаблон.
    itemsData.forEach((it, i) => { if (it) resetItemVisuals(i); });
    fontApplyMode = 'item';
    decorApplyMode = 'item';
    bgApplyMode = 'item';
    syncFontControlsToContext();
    syncDecorControlsToContext();
    syncBgControlsToContext();
    updatePreview();
  }

  // Сброс АКТИВНОГО ценника к виду шаблона (расположение + оформление + границы).
  if (resetLabelPosBtn) {
    resetLabelPosBtn.addEventListener('click', resetActiveToTemplate);
  }
  // Сброс ВСЕХ ценников к виду шаблона (весь внешний вид; товары сохраняются).
  const resetAllLabelPosBtn = document.getElementById('resetAllLabelPosBtn');
  if (resetAllLabelPosBtn) {
    resetAllLabelPosBtn.addEventListener('click', resetAllToTemplate);
  }
  // Дубликат кнопки «💴 Цена по №1» в панели превью.
  const syncPricePosPreviewBtn = document.getElementById('syncPricePosPreviewBtn');
  if (syncPricePosPreviewBtn) {
    syncPricePosPreviewBtn.addEventListener('click', applySharedPosFromFirstToAll);
  }

  // Перетаскивание надписей через Pointer Events с делегированием на #wobblerPreview.
  // Цели определяются по элементу-источнику: title / subtitle / price-box (целиком),
  // .price-digit (по цифре, data-pos) / .price-curr (валюта).
  (function setupLabelDrag() {
    let drag = null; // { target, startX, startY, baseX, baseY, digitIndex? }

    function mmPerPx() {
      const wMm = parseFloat(wobblerWidthInput.value) || 6.5;
      const wPx = wobblerPreview.offsetWidth || 1;
      return (wMm * 10) / wPx;
    }

    // Определяет цель перетаскивания по элементу, на котором нажали.
    function resolveTarget(target) {
      const digit = target.closest('.price-digit');
      if (digit) {
        const pos = parseInt(digit.getAttribute('data-pos'), 10);
        if (!isNaN(pos)) return { kind: 'digit', index: pos };
      }
      if (target.closest('.price-curr')) return { kind: 'currency' };
      if (target.closest('.wobbler-price-box')) return { kind: 'price' };
      if (target.closest('.wobbler-subtitle')) return { kind: 'subtitle' };
      if (target.closest('.wobbler-title')) return { kind: 'title' };
      return null;
    }

    function posRef(target) {
      const lp = activeLabelPos();
      if (target.kind === 'digit') {
        const i = target.index;
        while (lp.priceDigits.length <= i) lp.priceDigits.push({ x: 0, y: 0 });
        return lp.priceDigits[i];
      }
      if (target.kind === 'currency') return lp.currency;
      if (target.kind === 'price') return lp.price;
      if (target.kind === 'subtitle') return lp.subtitle;
      return lp.title;
    }

    wobblerPreview.addEventListener('pointerdown', (e) => {
      // Оба режима перетаскивания: общий (drag-mode) и «отдельно» (drag-mode-solo).
      if (!wobblerPreview.classList.contains('drag-mode')
          && !wobblerPreview.classList.contains('drag-mode-solo')) return;
      const target = resolveTarget(e.target);
      if (!target) return;
      e.preventDefault();
      try { wobblerPreview.setPointerCapture(e.pointerId); } catch (_) {}
      const ref = posRef(target);
      drag = { target, startX: e.clientX, startY: e.clientY, baseX: ref.x, baseY: ref.y };
    });

    wobblerPreview.addEventListener('pointermove', (e) => {
      if (!drag) return;
      const k = mmPerPx();
      const dx = (e.clientX - drag.startX) * k;
      const dy = (e.clientY - drag.startY) * k;
      const ref = posRef(drag.target);
      ref.x = Math.round((drag.baseX + dx) * 10) / 10;
      ref.y = Math.round((drag.baseY + dy) * 10) / 10;
      updatePreview();
      // В общем режиме (dragBroadcast=true) положение надписи разносится на все
      // ценники (включая №1). В режиме «Двигать отдельно» (dragBroadcast=false)
      // двигается только активный ценник, остальные не меняются.
      if (dragBroadcast &&
          (drag.target.kind === 'title' || drag.target.kind === 'subtitle'
           || drag.target.kind === 'price'
           || drag.target.kind === 'digit' || drag.target.kind === 'currency')) {
        syncSharedPosFromActive();
      }
    });

    const endDrag = (e) => {
      if (drag) {
        try { wobblerPreview.releasePointerCapture(e.pointerId); } catch (_) {}
        drag = null;
      }
    };
    wobblerPreview.addEventListener('pointerup', endDrag);
    wobblerPreview.addEventListener('pointercancel', endDrag);
  })();

  // === Редактор safe-зоны названия (перетаскивание краёв прямоугольника) ===
  // По образцу setupLabelDrag (Pointer Events + делегирование на #wobblerPreview),
  // но цель — край прямоугольника (.safe-handle[data-edge]), а результат —
  // доли titleSafe (left/right/top/bottom), пишутся в 4 поля и тут же применяется.
  // Доли считаются от размеров .wobbler-header (ширина/высота шапки целиком).
  (function setupSafeEditDrag() {
    let drag = null;   // { edge, sx, sy, base, rect }

    wobblerPreview.addEventListener('pointerdown', (e) => {
      if (!wobblerPreview.classList.contains('safe-edit-mode')) return;
      const handle = e.target.closest && e.target.closest('.safe-handle');
      if (!handle) return;
      const edge = handle.getAttribute('data-edge');     // top/bottom/left/right
      if (!edge) return;
      e.preventDefault();
      try { wobblerPreview.setPointerCapture(e.pointerId); } catch (_) {}
      drag = {
        edge,
        sx: e.clientX, sy: e.clientY,
        base: readGlobalTitleSafe(),
        rect: wobblerHeader.getBoundingClientRect()
      };
    });

    wobblerPreview.addEventListener('pointermove', (e) => {
      if (!drag) return;
      // Доля смещения от размеров шапки (px → доли 0..1).
      const dx = (e.clientX - drag.sx) / (drag.rect.width  || 1);
      const dy = (e.clientY - drag.sy) / (drag.rect.height || 1);
      const ts = { left: drag.base.left, right: drag.base.right, top: drag.base.top, bottom: drag.base.bottom };
      if      (drag.edge === 'left')   ts.left   = clampSafe(drag.base.left   + dx);
      else if (drag.edge === 'right')  ts.right  = clampSafe(drag.base.right  - dx);
      else if (drag.edge === 'top')    ts.top    = clampSafe(drag.base.top    + dy);
      else if (drag.edge === 'bottom') ts.bottom = clampSafe(drag.base.bottom - dy);
      // Не дадим краям «схлопнуть» прямоугольник: пара отступов ≤ 0.9
      // (остаётся ≥10% соответствующей стороны под название).
      if (ts.left + ts.right > 0.9) {
        if (drag.edge === 'left')        ts.left  = 0.9 - ts.right;
        else if (drag.edge === 'right')  ts.right = 0.9 - ts.left;
      }
      if (ts.top + ts.bottom > 0.9) {
        if (drag.edge === 'top')         ts.top    = 0.9 - ts.bottom;
        else if (drag.edge === 'bottom') ts.bottom = 0.9 - ts.top;
      }
      globalTitleSafe = { left: ts.left, right: ts.right, top: ts.top, bottom: ts.bottom };  // без dispatch
      positionSafeRect(ts);         // прямоугольник следует за мышью
      updatePreview();              // применяет доли к названию + CSS-переменные
      refitActiveTitle();           // пересчёт кегля под новый бокс
    });

    const end = (e) => {
      if (drag) { try { wobblerPreview.releasePointerCapture(e.pointerId); } catch (_) {} drag = null; }
    };
    wobblerPreview.addEventListener('pointerup', end);
    wobblerPreview.addEventListener('pointercancel', end);
  })();

  // Подписка на смену режима печати (single/multi). Переключатель раскладки
  // (layoutType) убран из UI — раскладка задаётся выбранным шаблоном.
  // При смене режима пересинхронизируем шрифтовые инпуты: в single сегмент
  // скрыт и режим = template; в multi возвращаем per-item режим по умолчанию.
  document.querySelectorAll('input[name="printMode"]').forEach(r => {
    r.addEventListener('change', () => {
      const isMulti = document.querySelector('input[name="printMode"]:checked').value === 'multi';
      if (!isMulti) { fontApplyMode = 'template'; decorApplyMode = 'template'; bgApplyMode = 'template'; }
      else {
        if (fontApplyMode !== 'template') fontApplyMode = 'item';
        if (decorApplyMode !== 'template') decorApplyMode = 'item';
        if (bgApplyMode !== 'template') bgApplyMode = 'item';
      }
      syncFontControlsToContext();
      syncDecorControlsToContext();
      syncBgControlsToContext();
      updatePreview();
    });
  });

  // Print Handlers
  // Верхняя кнопка: в зависимости от режима printJob зовёт одиночную или мульти-печать.
  if (printBtn) printBtn.addEventListener('click', () => {
    const jobMode = document.querySelector('input[name="printJob"]:checked');
    if (jobMode && jobMode.value === 'multi') {
      runMultiPrintFromUI();
    } else {
      triggerPrint();
    }
  });
  if (printBtnSidebar) printBtnSidebar.addEventListener('click', triggerPrint);

  // ===== Мульти-печать: UI-логика =====
  const multiPrintPanel = document.getElementById('multiPrintPanel');
  const singlePrintPanel = document.getElementById('singlePrintPanel');
  const multiPrintTemplatesEl = document.getElementById('multiPrintTemplates');
  const multiPrintGapInput = document.getElementById('multiPrintGap');
  const multiPrintGapVal = document.getElementById('multiPrintGapVal');
  const multiPrintCropChk = document.getElementById('multiPrintCrop');
  const multiPrintSummaryEl = document.getElementById('multiPrintSummary');
  const multiPrintBtn = document.getElementById('multiPrintBtn');
  const multiPrintDrawer = document.getElementById('multiPrintDrawer');
  const multiPrintDrawerBackdrop = document.getElementById('multiPrintDrawerBackdrop');
  const multiPrintDrawerClose = document.getElementById('multiPrintDrawerClose');

  // Размер каждого builtin-шаблона для подписи в панели.
  function presetSizeLabel(key) {
    const p = builtInPresets[key];
    if (!p) return '';
    return `${(p.widthCm || 0).toString().replace('.', ',')}×${(p.heightCm || 0).toString().replace('.', ',')} см`;
  }
  // Число заполненных ценников шаблона.
  function presetFilledCount(key) {
    const arr = templateItems[key] || [];
    return arr.filter(it => it && it.title && it.title.trim()).length;
  }

  // Строит список чекбоксов шаблонов с выбором числа копий.
  function renderMultiPrintTemplates() {
    if (!multiPrintTemplatesEl) return;
    multiPrintTemplatesEl.innerHTML = TEMPLATE_KEYS.map(k => {
      const p = builtInPresets[k];
      const name = p ? p.name : k;
      const filled = presetFilledCount(k);
      return `<div class="multi-print-row-item">
        <label class="checkbox-label" style="display:flex; align-items:center; gap:6px; flex:1;">
          <input type="checkbox" value="${k}" data-mpi-chk>
          <span class="mpi-name">${name}</span>
        </label>
        <span class="mpi-size">${presetSizeLabel(k)}</span>
        <span class="mpi-filled">${filled} тов.</span>
        <select data-mpi-copies>
          <option value="auto" selected>все${filled ? ` (${filled})` : ''}</option>
          <option value="1">1×</option>
          <option value="2">2×</option>
          <option value="3">3×</option>
          <option value="4">4×</option>
          <option value="6">6×</option>
          <option value="12">12×</option>
        </select>
      </div>`;
    }).join('');
    // Обновлять сводку при любом изменении.
    multiPrintTemplatesEl.querySelectorAll('input[data-mpi-chk], select[data-mpi-copies]').forEach(el => {
      el.addEventListener('change', updateMultiPrintSummary);
    });
  }

  // Считает сводку (число ценников / листов) по отмеченным шаблонам и показывает её.
  function updateMultiPrintSummary() {
    if (!multiPrintSummaryEl) return;
    const selected = collectMultiSelection();
    if (!selected.length) {
      multiPrintSummaryEl.textContent = 'Шаблоны не выбраны';
      return;
    }
    let count = 0;
    for (const sel of selected) {
      const filled = presetFilledCount(sel.key);
      const n = (sel.copies === 'auto' || !sel.copies) ? filled : Math.min(parseInt(sel.copies, 10) || 0, filled);
      count += n;
    }
    // Грубая оценка числа листов: по среднему числу на лист — не точная, но информативная.
    const gap = multiPrintGapInput ? parseFloat(multiPrintGapInput.value) || 0 : 0;
    const pages = count > 0 ? Math.max(1, Math.ceil(count / 24)) : 0;
    multiPrintSummaryEl.textContent = `${count} ценник${count === 1 ? '' : (count < 5 ? 'а' : 'ов')} · ≈ ${pages} лист${pages === 1 ? '' : 'ев'}`;
  }

  // Собирает отмеченные шаблоны: [{ key, copies }].
  function collectMultiSelection() {
    if (!multiPrintTemplatesEl) return [];
    const rows = multiPrintTemplatesEl.querySelectorAll('.multi-print-row-item');
    const out = [];
    rows.forEach(row => {
      const chk = row.querySelector('input[data-mpi-chk]');
      if (!chk || !chk.checked) return;
      const copiesSel = row.querySelector('select[data-mpi-copies]');
      out.push({ key: chk.value, copies: copiesSel ? copiesSel.value : 'auto' });
    });
    return out;
  }

  // Запуск мульти-печати из UI (кнопка или верхняя кнопка в мульти-режиме).
  function runMultiPrintFromUI() {
    const selected = collectMultiSelection();
    if (!selected.length) { alert('Отметьте хотя бы один шаблон для мульти-печати.'); return; }
    const gap = multiPrintGapInput ? parseFloat(multiPrintGapInput.value) || 0 : 0;
    const showCrop = !(multiPrintCropChk && !multiPrintCropChk.checked);
    triggerMultiPrint(selected, gap, showCrop);
  }

  // Переключение printJob.
  // Источник истины — radio name="printJob" в шапке (только там, чтобы браузер
  // держал один :checked без конфликтов). В секции #6 — зеркало (input[data-print-job]
  // без name): его клик переключает шапку-radio, а checked выставляется синхронно.
  function getPrintJobVal() {
    const checked = document.querySelector('input[name="printJob"]:checked');
    return checked ? checked.value : 'single';
  }
  function applyPrintJob(val) {
    const isMulti = val === 'multi';
    // Синхронизируем зеркало в section #6.
    document.querySelectorAll('input[data-print-job]').forEach(r => {
      r.checked = (r.getAttribute('data-print-job') === val);
    });
    if (singlePrintPanel) singlePrintPanel.style.display = isMulti ? 'none' : '';
    if (multiPrintPanel) multiPrintPanel.style.display = isMulti ? '' : 'none';
    if (isMulti) {
      openMultiPrintDrawer();
    } else {
      closeMultiPrintDrawer();
    }
  }

  // Открытие выдвижной панели мульти-печати: рендер шаблонов, дефолт-отметка
  // активного шаблона, обновление сводки.
  function openMultiPrintDrawer() {
    if (!multiPrintDrawer) return;
    renderMultiPrintTemplates();
    // Дефолт: отметить активный встроенный шаблон, чтобы «Печать» работала сразу.
    const activeKey = (activeTemplateRef && activeTemplateRef.kind === 'builtin') ? activeTemplateRef.key : null;
    if (activeKey && multiPrintTemplatesEl) {
      const chk = multiPrintTemplatesEl.querySelector('input[data-mpi-chk][value="' + activeKey + '"]');
      if (chk && !chk.checked) {
        chk.checked = true;
        // Если у активного шаблона нет заполненных товаров — снимем отметку, иначе
        // пользователь получит alert «Нет заполненных». Отмечиваем только если есть товары.
        if (presetFilledCount(activeKey) === 0) chk.checked = false;
      }
    }
    updateMultiPrintSummary();
    multiPrintDrawer.classList.add('open');
    if (multiPrintDrawerBackdrop) multiPrintDrawerBackdrop.classList.add('open');
  }

  // Закрытие панели (без переключения режима — режим остаётся, если caller не сменил).
  function closeMultiPrintDrawer() {
    if (multiPrintDrawer) multiPrintDrawer.classList.remove('open');
    if (multiPrintDrawerBackdrop) multiPrintDrawerBackdrop.classList.remove('open');
  }
  // Шапка-radio → источник истины.
  document.querySelectorAll('input[name="printJob"]').forEach(r => {
    r.addEventListener('change', () => applyPrintJob(getPrintJobVal()));
  });
  // Клик на pill «Мульти» должен ОТКРЫВАТЬ панель, даже если режим уже multi
  // (radio change не сработает при повторном клике на активный radio — поэтому
  // вешаем явный click на label, который открывает drawer при значении multi).
  document.querySelectorAll('input[name="printJob"][value="multi"]').forEach(r => {
    const label = r.closest('label');
    if (label) {
      label.addEventListener('click', () => {
        // Небольшая задержка — чтобы сначала отработал change (если режим сменился).
        setTimeout(() => {
          if (getPrintJobVal() === 'multi') openMultiPrintDrawer();
        }, 0);
      });
    }
  });
  // Зеркало в section #6 → клик переключает шапку-radio (что вызовет change → applyPrintJob).
  document.querySelectorAll('input[data-print-job]').forEach(r => {
    r.addEventListener('change', () => {
      const val = r.getAttribute('data-print-job');
      const headerRadio = document.querySelector('input[name="printJob"][value="' + val + '"]');
      if (headerRadio && !headerRadio.checked) {
        headerRadio.checked = true;
        applyPrintJob(val);
      }
    });
  });
  if (multiPrintGapInput) {
    multiPrintGapInput.addEventListener('input', () => {
      if (multiPrintGapVal) multiPrintGapVal.textContent = multiPrintGapInput.value;
      updateMultiPrintSummary();
    });
  }
  if (multiPrintBtn) multiPrintBtn.addEventListener('click', runMultiPrintFromUI);

  // Закрытие/сворачивание drawer: кнопка ✕, клик по затемнению, Esc.
  // Сворачиваем только саму панель — мульти-режим остаётся активным (pill в шапке
  // остаётся на «🖨️ Мульти»), чтобы кнопка «Печать» в шапке продолжала звать
  // мульти-печать. Выход из мульти-режима — только через pill «📄 Один».
  if (multiPrintDrawerClose) multiPrintDrawerClose.addEventListener('click', closeMultiPrintDrawer);
  if (multiPrintDrawerBackdrop) multiPrintDrawerBackdrop.addEventListener('click', closeMultiPrintDrawer);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && multiPrintDrawer && multiPrintDrawer.classList.contains('open')) {
      closeMultiPrintDrawer();
    }
  });

  // Обновлять число заполненных ценников в панели при переключении шаблона/редактировании.
  // (Перестроение панели — если она открыта.)
  function refreshMultiPrintPanelIfOpen() {
    const isMulti = document.querySelector('input[name="printJob"]:checked');
    if (isMulti && isMulti.value === 'multi' && multiPrintPanel && multiPrintPanel.style.display !== 'none') {
      renderMultiPrintTemplates();
      updateMultiPrintSummary();
    }
  }

  // --- Accordion / Collapsible Section Toggles ---
  document.querySelectorAll('.card-toggle').forEach(toggle => {
    toggle.addEventListener('click', () => {
      const body = toggle.nextElementSibling;
      if (!body || !body.classList.contains('card-body')) return;
      const isCollapsed = toggle.classList.contains('collapsed');
      if (isCollapsed) {
        // Expand
        toggle.classList.remove('collapsed');
        body.style.display = '';
      } else {
        // Collapse
        toggle.classList.add('collapsed');
        body.style.display = 'none';
      }
    });
  });

  // --- Сворачиваемые подгруппы встроенных шаблонов (Ценники / Воблеры) ---
  // Состояние раскрыто/свёрнуто запоминается в localStorage между сессиями.
  // По умолчанию (без записи) подгруппы раскрыты.
  const SUB_KEYS = { priceTags: 'wobbler_sub_pricetags', wobblers: 'wobbler_sub_wobblers' };
  document.querySelectorAll('.preset-sub-toggle').forEach(btn => {
    const group = btn.closest('.preset-subgroup');
    if (!group) return;
    const key = btn.dataset.subgroup;
    if (key && SUB_KEYS[key]) {
      group.classList.toggle('is-collapsed', localStorage.getItem(SUB_KEYS[key]) === '1');
    }
    btn.addEventListener('click', () => {
      const now = group.classList.toggle('is-collapsed');
      if (key && SUB_KEYS[key]) localStorage.setItem(SUB_KEYS[key], now ? '1' : '0');
    });
  });

  // --- Сворачиваемые подсекции внутри секций #3 (Шрифты) и #5 (Оформление) ---
  // Клик по заголовку .sub-toggle сворачивает тело .sub-body (через класс is-collapsed
  // на родителе .sub-group). Состояние сохраняется в localStorage. Клик по чекбоксу
  // или кнопке внутри заголовка НЕ сворачивает (защита через closest).
  const FIELD_SUB_KEYS = {
    'font-title':     'wobbler_sub_font_title',
    'font-subtitle':  'wobbler_sub_font_subtitle',
    'font-price':     'wobbler_sub_font_price',
    'decor-outside':  'wobbler_sub_decor_outside',
    'decor-inside':   'wobbler_sub_decor_inside',
    'decor-bottom':   'wobbler_sub_decor_bottom'
  };
  document.querySelectorAll('.sub-toggle').forEach(btn => {
    const group = btn.closest('.sub-group');
    if (!group) return;
    const key = btn.dataset.subgroup;
    if (key && FIELD_SUB_KEYS[key]) {
      group.classList.toggle('is-collapsed', localStorage.getItem(FIELD_SUB_KEYS[key]) === '1');
    }
    btn.addEventListener('click', (e) => {
      // Не сворачиваем при клике на интерактивный элемент внутри заголовка
      // (сам чекбокс, кнопка «Подогнать», select). Клик по тексту/strong заголовка
      // сворачивает. input явно проверяем — чекбокс не должен сворачивать.
      if (e.target.closest('input, button:not(.sub-toggle), select')) return;
      const now = group.classList.toggle('is-collapsed');
      if (key && FIELD_SUB_KEYS[key]) localStorage.setItem(FIELD_SUB_KEYS[key], now ? '1' : '0');
    });
  });

  // --- Сворачивание предпросмотра и раскладки А4 ---
  const togglePreviewBtn = document.getElementById('togglePreviewBtn');
  const toggleSheetBtn = document.getElementById('toggleSheetBtn');
  const singlePreviewContainer = document.querySelector('.single-preview-container');
  const sheetMiniContainer = document.getElementById('sheetMiniContainer');
  const sheetCardHeader = document.querySelector('.sheet-card-header');

  function bindCollapseToggle(btn, targetEl, storageKey) {
    if (!btn || !targetEl) return;
    // Восстанавливаем сохранённое состояние
    if (localStorage.getItem(storageKey) === '1') {
      btn.classList.add('is-collapsed');
      targetEl.classList.add('is-collapsed');
    }
    btn.addEventListener('click', () => {
      const collapsed = targetEl.classList.toggle('is-collapsed');
      btn.classList.toggle('is-collapsed', collapsed);
      localStorage.setItem(storageKey, collapsed ? '1' : '0');
    });
  }

  bindCollapseToggle(togglePreviewBtn, singlePreviewContainer, 'wobbler_preview_collapsed');
  // Раскладка сворачивает и контейнер превью, и подпись
  bindCollapseToggle(toggleSheetBtn, sheetMiniContainer, 'wobbler_sheet_collapsed');
  if (toggleSheetBtn && sheetCardHeader) {
    // Дополнительно синхронизируем скрытие подписи с контейнером
    const obs = () => {
      sheetCardHeader.classList.toggle('is-collapsed', sheetMiniContainer.classList.contains('is-collapsed'));
    };
    toggleSheetBtn.addEventListener('click', obs);
    obs();
  }

  // Initialize Device Mode
  const savedDeviceMode = localStorage.getItem('wobbler_device_mode') || 'auto';
  setDeviceMode(savedDeviceMode);
  setMobileActiveTab('preview');

   renderItemsListInputs();
   renderSavedTemplates();
   activeTemplateRef = { kind: 'builtin', key: 'alaska_dots' };
   applyState(builtInPresets.alaska_dots);

   // Подгружаем дополнительные фоны из «bg other» (из IndexedDB-кэша) и
   // наполняем подменю выбора фона. Асинхронно — не блокирует старт рендера.
   loadExtraBackgrounds();

   // TEMP TEST HOOK — remove after verification
   (function(){
     const k = new URLSearchParams(location.search).get('verify');
     if (!k) return;
     applyState(builtInPresets[k]);
     activeTemplateRef = { kind: 'builtin', key: k };
     requestAnimationFrame(() => {
       const s = getCurrentState();
       document.body.dataset.verifyJson = JSON.stringify(s);
       document.body.dataset.verifyTitleW = document.getElementById('titleWeight').value;
       document.body.dataset.verifySubSz = document.getElementById('subtitleSize').value;
       document.body.dataset.verifyPriceW = document.getElementById('priceWeight').value;
     });
   })();

  // Пересчитать ширину цифр цены, когда веб-шрифты точно загружены:
  // первый замер мог снять метрики фолбэка (например, для Lobster/Pacifico).
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => updatePreview());
  }
 });
