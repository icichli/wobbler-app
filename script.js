document.addEventListener('DOMContentLoaded', () => {
  // Telegram WebApp Integration & Platform Detection
  const tg = window.Telegram ? window.Telegram.WebApp : null;
  let isTelegramMobile = false;

  if (tg) {
    try {
      tg.expand();
      tg.ready();
      if (['android', 'ios', 'mobile'].includes(tg.platform)) {
        isTelegramMobile = true;
      }
    } catch(e) {}
  }

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
  const TEMPLATE_KEYS = ['alaska_dots', 'ryba', 'sneki', 'novy_vkus', 'novinka', 'tomat', 'sladko'];
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
  const inputCurrency = document.getElementById('inputCurrency');
  const pricePlateToggle = document.getElementById('pricePlateToggle');

  // Цена вводится по одной цифре в 4 клетки. inputPrice — прокси-объект с .value,
  // совместимый со старым API (чтение/запись/событие 'input'), чтобы не ломать
  // остальные части (preview, печать, сохранение шаблона).
  const priceCellsContainer = document.getElementById('priceCells');
  const priceCellEls = priceCellsContainer ? Array.from(priceCellsContainer.querySelectorAll('.price-cell')) : [];
  const priceCellListeners = [];
  // Прокси: value = склеенное содержимое 4 клеток (пустые клетки пропускаются).
  const inputPrice = {
    get value() {
      return priceCellEls.map(el => el.value).join('');
    },
    set value(v) {
      const chars = String(v || '').split('');
      priceCellEls.forEach((el, i) => { el.value = chars[i] || ''; });
    },
    addEventListener(type, fn) {
      priceCellListeners.push({ type, fn });
      priceCellEls.forEach(el => el.addEventListener(type, fn));
    }
  };

  // Background & Pattern Inputs
  const headerBgColor = document.getElementById('headerBgColor');
  const bgImageSelect = document.getElementById('bgImageSelect');
  const customBgUpload = document.getElementById('customBgUpload');
  const uploadStatus = document.getElementById('uploadStatus');
  const customBgOption = document.getElementById('customBgOption');
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

  // === Модал per-item оформления/фон (кнопка ⚙) ===
  const itemSettingsModal = document.getElementById('itemSettingsModal');
  const itemSettingsTitle = document.getElementById('itemSettingsTitle');
  let currentItemSettingsIndex = 0;
  // Контролы модала (зеркало глобальных секций «Фоны» и «Оформление»).
  const isBgEnabled = document.getElementById('isBgEnabled');
  const isHeaderBgColor = document.getElementById('isHeaderBgColor');
  const isBgImage = document.getElementById('isBgImage');
  const isBgCustomOption = document.getElementById('isBgCustomOption');
  const isBgCustomUpload = document.getElementById('isBgCustomUpload');
  const isBgUploadStatus = document.getElementById('isBgUploadStatus');
  const isOutsideShow = document.getElementById('isOutsideShow');
  const isOutsideText = document.getElementById('isOutsideText');
  const isOutsideBg = document.getElementById('isOutsideBg');
  const isOutsideBgImg = document.getElementById('isOutsideBgImg');
  const isOutsideCustomOption = document.getElementById('isOutsideCustomOption');
  const isOutsideCustomUpload = document.getElementById('isOutsideCustomUpload');
  const isOutsideUploadStatus = document.getElementById('isOutsideUploadStatus');
  const isOutsideColor = document.getElementById('isOutsideColor');
  const isOutsideFontSize = document.getElementById('isOutsideFontSize');
  const isOutsideHeight = document.getElementById('isOutsideHeight');
  const isInsideShow = document.getElementById('isInsideShow');
  const isInsideText = document.getElementById('isInsideText');
  const isInsideBg = document.getElementById('isInsideBg');
  const isInsideBgImg = document.getElementById('isInsideBgImg');
  const isInsideCustomOption = document.getElementById('isInsideCustomOption');
  const isInsideCustomUpload = document.getElementById('isInsideCustomUpload');
  const isInsideUploadStatus = document.getElementById('isInsideUploadStatus');
  const isInsideColor = document.getElementById('isInsideColor');
  const isInsideFontSize = document.getElementById('isInsideFontSize');
  const isInsideHeight = document.getElementById('isInsideHeight');

  // Per-item контролы блока СНИЗУ (модал «Оформление и фон ценника»).
  const isBottomShow = document.getElementById('isBottomShow');
  const isBottomText = document.getElementById('isBottomText');
  const isBottomBg = document.getElementById('isBottomBg');
  const isBottomBgImg = document.getElementById('isBottomBgImg');
  const isBottomCustomOption = document.getElementById('isBottomCustomOption');
  const isBottomCustomUpload = document.getElementById('isBottomCustomUpload');
  const isBottomUploadStatus = document.getElementById('isBottomUploadStatus');
  const isBottomColor = document.getElementById('isBottomColor');
  const isBottomFontSize = document.getElementById('isBottomFontSize');
  const isBottomHeight = document.getElementById('isBottomHeight');

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
  // Глобальный labelPos используется только как база/совместимость (пресеты).
  let labelPos = defaultLabelPos();
  // Позиции для одиночного режима (один ценник).
  let singleLabelPos = defaultLabelPos();

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

  // Per-item размер шрифта наименования. В multi каждый ценник хранит свой кегль
  // в itemsData[i].titleSize; в single — значение глобального слайдера titleSize.
  // Гарантирует числовое значение (по умолчанию берётся текущий слайдер).
  function activeItemTitleSize(item) {
    if (item && item.titleSize != null && item.titleSize !== '') {
      const v = parseFloat(item.titleSize);
      if (!isNaN(v)) return v;
    }
    return parseFloat(titleSize.value) || 13;
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

  // Возвращает полный «снимок» оформления блока (outside/inside) для ценника i
  // как простой объект — удобно передавать в applyDecorBlock/applyItemDecorToClone.
  function resolveDecorBlock(i, kind) {
    if (kind === 'outside') {
      return {
        show:     resolveItemField(i, 'outside', 'outsideShow', !!(decorOutsideShow && decorOutsideShow.checked)),
        text:     resolveItemField(i, 'outside', 'outsideText', decorOutsideText ? decorOutsideText.value : ''),
        bg:       resolveItemField(i, 'outside', 'outsideBg',   decorOutsideBg ? decorOutsideBg.value : '#e63946'),
        bgImg:    resolveItemField(i, 'outside', 'outsideBgImg',decorOutsideBgImg ? decorOutsideBgImg.value : 'none'),
        customBg: resolveItemField(i, 'outside', 'outsideCustomBg', uploadedDataUrl2),
        color:    resolveItemField(i, 'outside', 'outsideColor',decorOutsideColor ? decorOutsideColor.value : '#ffffff'),
        fontSize: resolveItemField(i, 'outside', 'outsideFontSize', decorOutsideFontSize ? decorOutsideFontSize.value : 14),
        height:   resolveItemField(i, 'outside', 'outsideHeight', decorOutsideHeight ? decorOutsideHeight.value : 12)
      };
    }
    if (kind === 'bottom') {
      return {
        show:     resolveItemField(i, 'bottom', 'bottomShow', !!(decorBottomShow && decorBottomShow.checked)),
        text:     resolveItemField(i, 'bottom', 'bottomText', decorBottomText ? decorBottomText.value : ''),
        bg:       resolveItemField(i, 'bottom', 'bottomBg',   decorBottomBg ? decorBottomBg.value : '#e63946'),
        bgImg:    resolveItemField(i, 'bottom', 'bottomBgImg',decorBottomBgImg ? decorBottomBgImg.value : 'none'),
        customBg: resolveItemField(i, 'bottom', 'bottomCustomBg', uploadedDataUrl4),
        color:    resolveItemField(i, 'bottom', 'bottomColor',decorBottomColor ? decorBottomColor.value : '#ffffff'),
        fontSize: resolveItemField(i, 'bottom', 'bottomFontSize', decorBottomFontSize ? decorBottomFontSize.value : 14),
        height:   resolveItemField(i, 'bottom', 'bottomHeight', decorBottomHeight ? decorBottomHeight.value : 12)
      };
    }
    return {
      show:     resolveItemField(i, 'inside', 'insideShow', !!(decorInsideShow && decorInsideShow.checked)),
      text:     resolveItemField(i, 'inside', 'insideText', decorInsideText ? decorInsideText.value : ''),
      bg:       resolveItemField(i, 'inside', 'insideBg',   decorInsideBg ? decorInsideBg.value : '#e63946'),
      bgImg:    resolveItemField(i, 'inside', 'insideBgImg',decorInsideBgImg ? decorInsideBgImg.value : 'none'),
      customBg: resolveItemField(i, 'inside', 'insideCustomBg', uploadedDataUrl3),
      color:    resolveItemField(i, 'inside', 'insideColor',decorInsideColor ? decorInsideColor.value : '#ffffff'),
      fontSize: resolveItemField(i, 'inside', 'insideFontSize', decorInsideFontSize ? decorInsideFontSize.value : 11),
      height:   resolveItemField(i, 'inside', 'insideHeight', decorInsideHeight ? decorInsideHeight.value : 8),
      width:    resolveItemField(i, 'inside', 'insideWidth', decorInsideWidth ? decorInsideWidth.value : 50)
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
  function resolveItemBg(i) {
    return {
      headerBg: resolveItemField(i, 'bg', 'headerBg', headerBgColor ? headerBgColor.value : '#ffffff'),
      bgImage:  resolveItemField(i, 'bg', 'bgImage',  bgImageSelect ? bgImageSelect.value : 'none'),
      customBg: resolveItemField(i, 'bg', 'customBgData', uploadedDataUrl),
      titleSafe: normTitleSafe(resolveItemField(i, 'bg', 'titleSafe', readGlobalTitleSafe()))
    };
  }

  // Объектные варианты хелперов: работают по самому item (не по индексу), что
  // удобно для клонов листа/печати, где передаётся объект товара. В single-режиме
  // item — синтетический baseItem без per-item полей → берутся глобальные значения.
  function pick(item, kind, field, globalVal) {
    if (item && item[`${kind}Customized`] && item[field] != null) return item[field];
    return globalVal;
  }
  function decorBlockFromItem(item, kind) {
    if (kind === 'outside') {
      return {
        show:     pick(item, 'outside', 'outsideShow', !!(decorOutsideShow && decorOutsideShow.checked)),
        text:     pick(item, 'outside', 'outsideText', decorOutsideText ? decorOutsideText.value : ''),
        bg:       pick(item, 'outside', 'outsideBg',   decorOutsideBg ? decorOutsideBg.value : '#e63946'),
        bgImg:    pick(item, 'outside', 'outsideBgImg',decorOutsideBgImg ? decorOutsideBgImg.value : 'none'),
        customBg: pick(item, 'outside', 'outsideCustomBg', uploadedDataUrl2),
        color:    pick(item, 'outside', 'outsideColor',decorOutsideColor ? decorOutsideColor.value : '#ffffff'),
        fontSize: pick(item, 'outside', 'outsideFontSize', decorOutsideFontSize ? decorOutsideFontSize.value : 14),
        height:   pick(item, 'outside', 'outsideHeight', decorOutsideHeight ? decorOutsideHeight.value : 12)
      };
    }
    if (kind === 'bottom') {
      return {
        show:     pick(item, 'bottom', 'bottomShow', !!(decorBottomShow && decorBottomShow.checked)),
        text:     pick(item, 'bottom', 'bottomText', decorBottomText ? decorBottomText.value : ''),
        bg:       pick(item, 'bottom', 'bottomBg',   decorBottomBg ? decorBottomBg.value : '#e63946'),
        bgImg:    pick(item, 'bottom', 'bottomBgImg',decorBottomBgImg ? decorBottomBgImg.value : 'none'),
        customBg: pick(item, 'bottom', 'bottomCustomBg', uploadedDataUrl4),
        color:    pick(item, 'bottom', 'bottomColor',decorBottomColor ? decorBottomColor.value : '#ffffff'),
        fontSize: pick(item, 'bottom', 'bottomFontSize', decorBottomFontSize ? decorBottomFontSize.value : 14),
        height:   pick(item, 'bottom', 'bottomHeight', decorBottomHeight ? decorBottomHeight.value : 12)
      };
    }
    return {
      show:     pick(item, 'inside', 'insideShow', !!(decorInsideShow && decorInsideShow.checked)),
      text:     pick(item, 'inside', 'insideText', decorInsideText ? decorInsideText.value : ''),
      bg:       pick(item, 'inside', 'insideBg',   decorInsideBg ? decorInsideBg.value : '#e63946'),
      bgImg:    pick(item, 'inside', 'insideBgImg',decorInsideBgImg ? decorInsideBgImg.value : 'none'),
      customBg: pick(item, 'inside', 'insideCustomBg', uploadedDataUrl3),
      color:    pick(item, 'inside', 'insideColor',decorInsideColor ? decorInsideColor.value : '#ffffff'),
      fontSize: pick(item, 'inside', 'insideFontSize', decorInsideFontSize ? decorInsideFontSize.value : 11),
      height:   pick(item, 'inside', 'insideHeight', decorInsideHeight ? decorInsideHeight.value : 8),
      width:    pick(item, 'inside', 'insideWidth', decorInsideWidth ? decorInsideWidth.value : 50)
    };
  }
  function bgFromItem(item) {
    return {
      headerBg: pick(item, 'bg', 'headerBg', headerBgColor ? headerBgColor.value : '#ffffff'),
      bgImage:  pick(item, 'bg', 'bgImage',  bgImageSelect ? bgImageSelect.value : 'none'),
      customBg: pick(item, 'bg', 'customBgData', uploadedDataUrl),
      titleSafe: normTitleSafe(pick(item, 'bg', 'titleSafe', readGlobalTitleSafe()))
    };
  }

  // Сбрасывает per-item оформление ценника i (возвращает к глобальному).
  function resetItemDecor(i) {
    const it = itemsData[i];
    if (!it) return;
    delete it.outsideCustomized;
    delete it.insideCustomized;
    delete it.bottomCustomized;
    delete it.bgCustomized;
    [...PER_ITEM_FIELDS.outside, ...PER_ITEM_FIELDS.inside, ...PER_ITEM_FIELDS.bottom, ...PER_ITEM_FIELDS.bg].forEach(f => delete it[f]);
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
    // Фон ryba_bg.jpg, цвета, шрифты, layout — те же, что у Рыбы.
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
      bgImage: 'ryba_bg.jpg',
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
      labelPos: { title: { x: -0.2, y: -0.7 }, subtitle: { x: -2.1, y: -0.6 }, price: { x: 0, y: 0 }, priceDigits: [ { x: -5.3, y: 0.5 }, { x: -1, y: 0.4 }, { x: 2.3, y: 0.4 } ], currency: { x: 5, y: 0.3 } }
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
    const last = itemsData.length - 1;
    if (idx === last && isItemFilled(itemsData[idx])) {
      // Ввели данные в последнюю рабочую строку → добавляем новую пустую ниже.
      itemsData.push(freshItem());
      itemsListContainer.appendChild(createItemRow(itemsData.length - 1));
    } else if (isItemEmpty(itemsData[idx])) {
      // Очистили товар: убираем дублирующие пустые в хвосте (≥2 подряд пустых),
      // не трогая строку с фокусом. Оставляем одну рабочую пустую.
      while (itemsData.length > 1 && isItemEmpty(itemsData[itemsData.length - 1])
                                   && isItemEmpty(itemsData[itemsData.length - 2])) {
        itemsData.pop();
        const rows = itemsListContainer.querySelectorAll('.item-row');
        if (rows[rows.length - 1]) rows[rows.length - 1].remove();
      }
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
      <button type="button" class="item-settings-btn" data-index="${i}" title="Оформление и фон ценника №${i + 1}">⚙</button>
    `;

    row.querySelector('.item-title-input').addEventListener('focus', () => {
      activePreviewIndex = i;
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
      updatePreview();
    });

    row.querySelector('.item-price-input').addEventListener('input', (e) => {
      const idx = parseInt(e.target.getAttribute('data-index'), 10);
      itemsData[idx].price = e.target.value;
      activePreviewIndex = idx;
      syncRowExtent(idx);
      updatePreview();
    });

    // Кнопка ⚙ открывает модал per-item оформления (декор-блоки + фон).
    const settingsBtn = row.querySelector('.item-settings-btn');
    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => {
        activePreviewIndex = i;
        openItemSettings(i);
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

  const syncPricePosBtn = document.getElementById('syncPricePosBtn');
  if (syncPricePosBtn) {
    syncPricePosBtn.addEventListener('click', applySharedPosFromFirstToAll);
  }

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
  const TITLE_FIT_MAX = 32;   // верх слайдера titleSize
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

  // Calculate maximum fitting wobblers on A4 (поля печати по 2 мм со всех сторон,
  // зазор между ценниками gapMm задаётся слайдером; при 0 ценники печатаются встык).
  // Формула числа ячеек в ряду: n*w + (n-1)*g ≤ pageW  →  n = floor((pageW + g)/(w + g)).
  function calcA4Grid(wMm, hMm) {
    const margin = 2; // 2 мм со всех сторон — умолчание печати для всех шаблонов
    const g = gapMm();
    const pageW = 210 - margin * 2;
    const pageH = 297 - margin * 2;
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
    const lp = (item && item.labelPos) ? item.labelPos : defaultLabelPos();
    const digits = String((item && item.price) || '').split('');

    const tElem = clone.querySelector('.wobbler-title');
    const pElem = clone.querySelector('.price-val');
    const sElem = clone.querySelector('.wobbler-subtitle');
    const box = clone.querySelector('.wobbler-price-box');
    const curr = clone.querySelector('.price-curr');

    if (tElem) {
      tElem.textContent = (item && item.title) || '';
      // Per-item кегль наименования: каждый ценник несёт свой размер шрифта.
      tElem.style.fontSize = `${activeItemTitleSize(item)}pt`;
      tElem.style.transform = `translate(${lp.title.x}mm, ${(parseFloat(titleOffsetYVal) || 0) + lp.title.y}mm)`;
    }
    if (sElem) {
      sElem.textContent = (item && item.subtitle != null) ? item.subtitle : '';
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
    if (curr) curr.style.transform = `translate(${lp.currency.x}mm, ${lp.currency.y}mm)`;
    if (box) {
      const yOffset = (parseFloat(priceOffsetYVal) || 0) + lp.price.y;
      box.style.transform = `translate(${lp.price.x}mm, ${yOffset}mm)`;
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
    } else if (bgVal === 'ryba_scales') {
      el.style.backgroundImage =
        "radial-gradient(circle at 50% 0%, rgba(125,211,252,0.55) 0%, rgba(125,211,252,0) 55%)," +
        "radial-gradient(circle at 0% 50%, rgba(56,189,248,0.45) 0%, rgba(56,189,248,0) 50%)," +
        "radial-gradient(circle at 100% 50%, rgba(14,165,233,0.45) 0%, rgba(14,165,233,0) 50%)," +
        "repeating-radial-gradient(circle at 50% 120%, rgba(255,255,255,0.18) 0 3mm, rgba(255,255,255,0) 3mm 6mm)";
      el.style.backgroundSize = "auto";
      el.style.backgroundPosition = "center";
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
    // Per-item размер шрифта наименования: в multi каждый ценник хранит свой кегль.
    // Слайдер отражает размер активного товара (см. activeItemTitleSize()).
    const effTitleSize = isMultiMode ? activeItemTitleSize(activeItem) : titleSize.value;
    previewTitle.textContent = activeTitleText;
    previewTitle.style.fontFamily = titleFont.value;
    previewTitle.style.color = titleColor.value;
    previewTitle.style.fontSize = `${effTitleSize}pt`;
    previewTitle.style.fontWeight = titleWeight.value;
    previewTitle.style.fontStyle = (titleItalic && titleItalic.checked) ? 'italic' : 'normal';
    previewTitle.style.textAlign = alignState.title;
    previewTitle.style.transform = `translate(${lp.title.x}mm, ${(parseFloat(titleOffsetY.value) || 0) + lp.title.y}mm)`;
    // Держим слайдер и индикатор в синхроне с активным товаром.
    if (titleSize.value != effTitleSize) titleSize.value = String(effTitleSize);
    titleSizeVal.textContent = titleSize.value;
    syncTitleSizePreview();
    titleOffsetYVal.textContent = titleOffsetY.value;

    // Подзаголовок (вес/доп. инфо) — всегда в нижнем левом углу ценника.
    // Независимый слой: собственные размер/цвет/толщина/выравнивание
    // (шрифт наследуется от наименования).
    if (previewSubtitle) {
      const subText = isMultiMode ? (activeItem?.subtitle || '') : (inputSubtitle?.value || '');
      previewSubtitle.textContent = subText || '';
      previewSubtitle.style.display = subText ? 'block' : 'none';
      const subPt = subtitleSize ? subtitleSize.value : 11;
      previewSubtitle.style.fontFamily = titleFont.value;
      previewSubtitle.style.color = subtitleColor ? subtitleColor.value : '#ffffff';
      previewSubtitle.style.fontSize = `${subPt}pt`;
      previewSubtitle.style.fontWeight = subtitleWeight ? subtitleWeight.value : '700';
      previewSubtitle.style.textAlign = alignState.subtitle || 'left';
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
      priceFieldsBlock.style.display = 'block';
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
      previewPrice.style.fontFamily = priceFont.value;
      previewPrice.style.fontSize = `${priceSize.value}pt`;
      previewPrice.style.fontWeight = priceWeight.value;
      previewPrice.style.color = priceColor.value;

      previewCurrency.textContent = inputCurrency.value.trim();
      previewCurrency.style.fontFamily = priceFont.value;
      previewCurrency.style.fontSize = `${priceSize.value}pt`;
      previewCurrency.style.fontWeight = priceWeight.value;
      previewCurrency.style.color = priceColor.value;
      previewCurrency.style.transform = `translate(${lp.currency.x}mm, ${lp.currency.y}mm)`;

      const priceAlign = alignState.price || 'center';
      previewPriceBox.style.justifyContent = priceAlign === 'left' ? 'flex-start' : (priceAlign === 'right' ? 'flex-end' : 'center');
      const yOffset = (parseFloat(priceOffsetY.value) || 0) + lp.price.y;
      previewPriceBox.style.transform = `translate(${lp.price.x}mm, ${yOffset}mm)`;

      priceSizeVal.textContent = priceSize.value;
      priceOffsetYVal.textContent = priceOffsetY.value;
    } else {
      priceFieldsBlock.style.display = 'none';
      previewPriceBox.style.display = 'none';
    }

    // Background Image & Overlay — per-item фон активного ценника, если задан
    // (в single-режиме хелпер возвращает глобальные значения как раньше).
    const activeBgSnap = resolveItemBg(activePreviewIndex);
    applyBackgroundTo(wobblerHeader, activeBgSnap.bgImage, activeBgSnap.customBg, activeBgSnap.headerBg);

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

  // Custom Image Upload File Reader
  customBgUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
      uploadedDataUrl = event.target.result;
      customBgOption.style.display = 'block';
      bgImageSelect.value = 'custom';
      uploadStatus.textContent = `✓ Загружено: ${file.name}`;
      updatePreview();
    };
    reader.readAsDataURL(file);
  });

  // Загрузка своих фонов для декоративных блоков (обобщённый хелпер).
  function setupDecorUpload(input, optionEl, statusEl, targetVar) {
    if (!input) return;
    input.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function(event) {
        if (targetVar === 'outside') uploadedDataUrl2 = event.target.result;
        else if (targetVar === 'inside') uploadedDataUrl3 = event.target.result;
        else uploadedDataUrl4 = event.target.result;
        if (optionEl) optionEl.style.display = 'block';
        if (statusEl) statusEl.textContent = `✓ Загружено: ${file.name}`;
        // Переключаем select этого блока на custom и обновляем превью.
        if (targetVar === 'outside') { if (decorOutsideBgImg) decorOutsideBgImg.value = 'custom'; }
        else { if (decorInsideBgImg) decorInsideBgImg.value = 'custom'; }
        updatePreview();
      };
      reader.readAsDataURL(file);
    });
  }
  setupDecorUpload(decorOutsideCustomUpload, decorOutsideCustomOption, decorOutsideUploadStatus, 'outside');
  setupDecorUpload(decorInsideCustomUpload, decorInsideCustomOption, decorInsideUploadStatus, 'inside');
  setupDecorUpload(decorBottomCustomUpload, decorBottomCustomOption, decorBottomUploadStatus, 'bottom');

  // Alignment Buttons Click Handler
  document.querySelectorAll('.align-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-target');
      const align = btn.getAttribute('data-align');

      document.querySelectorAll(`.align-btn[data-target="${target}"]`).forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      alignState[target] = align;
      updatePreview();
    });
  });

  // Render Mini A4 Sheet Grid Preview (with Multi-Item support)
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
    titleFont.value = state.titleFont || "Arial, sans-serif";
    titleColor.value = state.titleColor || '#ffffff';
    titleSize.value = state.titleSize || 13;
    syncTitleSizePreview();
    titleWeight.value = state.titleWeight || '800';
    if (titleItalic) titleItalic.checked = !!state.titleItalic;
    titleOffsetY.value = state.titleOffsetY || 0;
    alignState.title = state.titleAlign || 'center';
    // Subtitle (Вес / доп. текст) — собственные параметры слоя.
    if (subtitleColor) subtitleColor.value = state.subtitleColor || '#ffffff';
    if (subtitleSize) subtitleSize.value = state.subtitleSize != null ? state.subtitleSize : 11;
    if (subtitleWeight) subtitleWeight.value = state.subtitleWeight || '700';
    alignState.subtitle = state.subtitleAlign || 'left';

    showPriceToggle.checked = !!state.showPrice;
    priceFont.value = state.priceFont || "Arial, sans-serif";
    priceSize.value = state.priceSize !== undefined ? state.priceSize : 40;
    priceWeight.value = state.priceWeight || '700';
    priceColor.value = state.priceColor || '#ffffff';
    priceOffsetY.value = state.priceOffsetY || 0;
    alignState.price = state.priceAlign || 'center';

    inputPrice.value = state.price || '350';
    inputCurrency.value = state.currency || '₽';

    headerBgColor.value = state.headerBg || '#18181b';
    
    if (state.customBgData) {
      uploadedDataUrl = state.customBgData;
      customBgOption.style.display = 'block';
      bgImageSelect.value = 'custom';
      uploadStatus.textContent = '✓ Пользовательский фон';
    } else {
      bgImageSelect.value = state.bgImage || 'dots_bg.jpg';
      uploadStatus.textContent = '';
    }

    headerHeightRange.value = state.headerHeight || 100;

    // Safe-зона названия (доли 0..0.45). Источник истины — JS-переменная, т.к.
    // числовые поля L/R/T/B убраны из UI (drag-редактор границ тоже пишет сюда).
    {
      const ts = normTitleSafe(state.titleSafe);
      globalTitleSafe = { left: ts.left, right: ts.right, top: ts.top, bottom: ts.bottom };
    }

    // Декоративные блоки «Оформление» (внешний + внутренний).
    if (decorOutsideShow) decorOutsideShow.checked = !!state.decorOutsideShow;
    if (decorOutsideText) decorOutsideText.value = state.decorOutsideText != null ? state.decorOutsideText : 'НОВИНКА';
    if (decorOutsideBg) decorOutsideBg.value = state.decorOutsideBg || '#e63946';
    if (decorOutsideColor) decorOutsideColor.value = state.decorOutsideColor || '#ffffff';
    if (decorOutsideFontSize) decorOutsideFontSize.value = state.decorOutsideFontSize != null ? state.decorOutsideFontSize : 14;
    if (decorOutsideHeight) decorOutsideHeight.value = state.decorOutsideHeight != null ? state.decorOutsideHeight : 12;
    if (gapInput) {
      const gv = state.gapMm != null ? parseFloat(state.gapMm) : 0;
      gapInput.value = isNaN(gv) ? 0 : Math.max(0, Math.min(5, gv));
      if (gapMmVal) gapMmVal.textContent = gapInput.value;
    }
    if (decorOutsideCustomOption) decorOutsideCustomOption.style.display = state.decorOutsideCustomBg ? 'block' : 'none';
    uploadedDataUrl2 = state.decorOutsideCustomBg || null;
    if (decorOutsideBgImg) decorOutsideBgImg.value = state.decorOutsideCustomBg ? 'custom' : (state.decorOutsideBgImg || 'none');
    if (decorOutsideUploadStatus) decorOutsideUploadStatus.textContent = state.decorOutsideCustomBg ? '✓ Пользовательский фон' : '';

    if (decorInsideShow) decorInsideShow.checked = !!state.decorInsideShow;
    if (decorInsideText) decorInsideText.value = state.decorInsideText != null ? state.decorInsideText : 'НОВИНКА';
    if (decorInsideBg) decorInsideBg.value = state.decorInsideBg || '#e63946';
    if (decorInsideColor) decorInsideColor.value = state.decorInsideColor || '#ffffff';
    if (decorInsideFontSize) decorInsideFontSize.value = state.decorInsideFontSize != null ? state.decorInsideFontSize : 11;
    if (decorInsideHeight) decorInsideHeight.value = state.decorInsideHeight != null ? state.decorInsideHeight : 8;
    if (decorInsideWidth) decorInsideWidth.value = state.decorInsideWidth != null ? state.decorInsideWidth : 50;
    if (decorInsideCustomOption) decorInsideCustomOption.style.display = state.decorInsideCustomBg ? 'block' : 'none';
    uploadedDataUrl3 = state.decorInsideCustomBg || null;
    if (decorInsideBgImg) decorInsideBgImg.value = state.decorInsideCustomBg ? 'custom' : (state.decorInsideBgImg || 'none');
    if (decorInsideUploadStatus) decorInsideUploadStatus.textContent = state.decorInsideCustomBg ? '✓ Пользовательский фон' : '';

    if (decorBottomShow) decorBottomShow.checked = !!state.decorBottomShow;
    if (decorBottomText) decorBottomText.value = state.decorBottomText != null ? state.decorBottomText : 'НОВИНКА';
    if (decorBottomBg) decorBottomBg.value = state.decorBottomBg || '#e63946';
    if (decorBottomColor) decorBottomColor.value = state.decorBottomColor || '#ffffff';
    if (decorBottomFontSize) decorBottomFontSize.value = state.decorBottomFontSize != null ? state.decorBottomFontSize : 14;
    if (decorBottomHeight) decorBottomHeight.value = state.decorBottomHeight != null ? state.decorBottomHeight : 12;
    if (decorBottomCustomOption) decorBottomCustomOption.style.display = state.decorBottomCustomBg ? 'block' : 'none';
    uploadedDataUrl4 = state.decorBottomCustomBg || null;
    if (decorBottomBgImg) decorBottomBgImg.value = state.decorBottomCustomBg ? 'custom' : (state.decorBottomBgImg || 'none');
    if (decorBottomUploadStatus) decorBottomUploadStatus.textContent = state.decorBottomCustomBg ? '✓ Пользовательский фон' : '';

    // Раскладка берётся из шаблона (раньше была radio-группа «Формат воблера»).
    currentLayout = (state.layout === 'split') ? 'split' : 'full';

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

    updatePreview();
  }

  // Get Current State Object from Inputs
  function getCurrentState() {
    return {
      widthCm: parseFloat(wobblerWidthInput.value) || 6.5,
      heightCm: parseFloat(wobblerHeightInput.value) || 4.5,

      title: inputTitle.value,
      subtitle: inputSubtitle ? inputSubtitle.value : '',
      titleFont: titleFont.value,
      titleColor: titleColor.value,
      titleSize: titleSize.value,
      titleWeight: titleWeight.value,
      titleItalic: titleItalic ? titleItalic.checked : false,
      titleAlign: alignState.title,
      titleOffsetY: titleOffsetY.value,
      subtitleColor: subtitleColor ? subtitleColor.value : '#ffffff',
      subtitleSize: subtitleSize ? subtitleSize.value : 11,
      subtitleWeight: subtitleWeight ? subtitleWeight.value : '700',
      subtitleAlign: alignState.subtitle || 'left',

      showPrice: showPriceToggle.checked,
      priceFont: priceFont.value,
      priceSize: priceSize.value,
      priceWeight: priceWeight.value,
      priceColor: priceColor.value,
      priceAlign: alignState.price,
      priceOffsetY: priceOffsetY.value,
      price: inputPrice.value,
      currency: inputCurrency.value,

      headerBg: headerBgColor.value,
      bgImage: bgImageSelect.value,
      customBgData: bgImageSelect.value === 'custom' ? uploadedDataUrl : null,
      headerHeight: headerHeightRange.value,
      titleSafe: normTitleSafe(globalTitleSafe),
      layout: currentLayout,
      priceInBottom: rybaPriceInBottom,
      subtitleCorner: subtitleCorner,
      pricePlate: pricePlateToggle ? pricePlateToggle.checked : false,
      // Декоративные блоки «Оформление»
      decorOutsideShow: decorOutsideShow ? decorOutsideShow.checked : false,
      decorOutsideText: decorOutsideText ? decorOutsideText.value : 'НОВИНКА',
      decorOutsideBg: decorOutsideBg ? decorOutsideBg.value : '#e63946',
      decorOutsideBgImg: decorOutsideBgImg ? decorOutsideBgImg.value : 'none',
      decorOutsideCustomBg: (decorOutsideBgImg && decorOutsideBgImg.value === 'custom') ? uploadedDataUrl2 : null,
      decorOutsideColor: decorOutsideColor ? decorOutsideColor.value : '#ffffff',
      decorOutsideFontSize: decorOutsideFontSize ? decorOutsideFontSize.value : 14,
      decorOutsideHeight: decorOutsideHeight ? decorOutsideHeight.value : 12,
      decorInsideShow: decorInsideShow ? decorInsideShow.checked : false,
      decorInsideText: decorInsideText ? decorInsideText.value : 'НОВИНКА',
      decorInsideBg: decorInsideBg ? decorInsideBg.value : '#e63946',
      decorInsideBgImg: decorInsideBgImg ? decorInsideBgImg.value : 'none',
      decorInsideCustomBg: (decorInsideBgImg && decorInsideBgImg.value === 'custom') ? uploadedDataUrl3 : null,
      decorInsideColor: decorInsideColor ? decorInsideColor.value : '#ffffff',
      decorInsideFontSize: decorInsideFontSize ? decorInsideFontSize.value : 11,
      decorInsideHeight: decorInsideHeight ? decorInsideHeight.value : 8,
      decorInsideWidth: decorInsideWidth ? decorInsideWidth.value : 50,
      decorBottomShow: decorBottomShow ? decorBottomShow.checked : false,
      decorBottomText: decorBottomText ? decorBottomText.value : 'НОВИНКА',
      decorBottomBg: decorBottomBg ? decorBottomBg.value : '#e63946',
      decorBottomBgImg: decorBottomBgImg ? decorBottomBgImg.value : 'none',
      decorBottomCustomBg: (decorBottomBgImg && decorBottomBgImg.value === 'custom') ? uploadedDataUrl4 : null,
      decorBottomColor: decorBottomColor ? decorBottomColor.value : '#ffffff',
      decorBottomFontSize: decorBottomFontSize ? decorBottomFontSize.value : 14,
      decorBottomHeight: decorBottomHeight ? decorBottomHeight.value : 12,
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
  const EMBEDDABLE_BGS = ['dots_bg.jpg', 'ryba_bg.jpg'];

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
    // Глубокий клон активного массива — каждый приёмник получает независимую копию
    // (включая per-item labelPos и оформление, если они заданы).
    const sourceCopy = itemsData.map(it => it ? JSON.parse(JSON.stringify(it)) : { title: '', price: '', subtitle: '', subtitleManual: false });
    targets.forEach(k => {
      templateItems[k] = sourceCopy.map(it => JSON.parse(JSON.stringify(it)));
    });
    copyItemsModal.classList.remove('active');
    renderItemsListInputs();
    updatePreview();
  });

  // ===== Модал per-item оформления/фон (кнопка ⚙ в строке) =====
  // Заполняет контролы модала текущими значениями ценника (per-item если задано,
  // иначе — из общих секций «Фоны»/«Оформление»), показывает модал.
  function openItemSettings(i) {
    currentItemSettingsIndex = i;
    itemSettingsTitle.textContent = `Настройки ценника №${i + 1}`;

    const it = itemsData[i] || (itemsData[i] = {});
    const bgC = !!it.bgCustomized;
    const outC = !!it.outsideCustomized;
    const inC = !!it.insideCustomized;

    // Фон
    isBgEnabled.checked = bgC;
    const bgSnap = resolveItemBg(i);
    isHeaderBgColor.value = bgSnap.headerBg || '#ffffff';
    isBgImage.value = bgSnap.bgImage || 'none';
    if (isBgCustomOption) isBgCustomOption.style.display = (bgSnap.bgImage === 'custom' && bgSnap.customBg) ? 'block' : 'none';
    if (isBgUploadStatus) isBgUploadStatus.textContent = (bgSnap.bgImage === 'custom' && bgSnap.customBg) ? '✓ Своя картинка загружена' : '';

    // Блок СВЕРХУ
    const outSnap = resolveDecorBlock(i, 'outside');
    isOutsideShow.checked = outSnap.show;
    isOutsideText.value = outSnap.text || '';
    isOutsideBg.value = outSnap.bg || '#e63946';
    isOutsideBgImg.value = outSnap.bgImg || 'none';
    if (isOutsideCustomOption) isOutsideCustomOption.style.display = (outSnap.bgImg === 'custom' && outSnap.customBg) ? 'block' : 'none';
    if (isOutsideUploadStatus) isOutsideUploadStatus.textContent = (outSnap.bgImg === 'custom' && outSnap.customBg) ? '✓ Своя картинка загружена' : '';
    isOutsideColor.value = outSnap.color || '#ffffff';
    isOutsideFontSize.value = outSnap.fontSize || 14;
    isOutsideHeight.value = outSnap.height || 12;

    // Блок ВНУТРИ
    const inSnap = resolveDecorBlock(i, 'inside');
    isInsideShow.checked = inSnap.show;
    isInsideText.value = inSnap.text || '';
    isInsideBg.value = inSnap.bg || '#e63946';
    isInsideBgImg.value = inSnap.bgImg || 'none';
    if (isInsideCustomOption) isInsideCustomOption.style.display = (inSnap.bgImg === 'custom' && inSnap.customBg) ? 'block' : 'none';
    if (isInsideUploadStatus) isInsideUploadStatus.textContent = (inSnap.bgImg === 'custom' && inSnap.customBg) ? '✓ Своя картинка загружена' : '';
    isInsideColor.value = inSnap.color || '#ffffff';
    isInsideFontSize.value = inSnap.fontSize || 11;
    isInsideHeight.value = inSnap.height || 8;

    // Блок СНИЗУ
    const botSnap = resolveDecorBlock(i, 'bottom');
    if (isBottomShow) isBottomShow.checked = botSnap.show;
    if (isBottomText) isBottomText.value = botSnap.text || '';
    if (isBottomBg) isBottomBg.value = botSnap.bg || '#e63946';
    if (isBottomBgImg) isBottomBgImg.value = botSnap.bgImg || 'none';
    if (isBottomCustomOption) isBottomCustomOption.style.display = (botSnap.bgImg === 'custom' && botSnap.customBg) ? 'block' : 'none';
    if (isBottomUploadStatus) isBottomUploadStatus.textContent = (botSnap.bgImg === 'custom' && botSnap.customBg) ? '✓ Своя картинка загружена' : '';
    if (isBottomColor) isBottomColor.value = botSnap.color || '#ffffff';
    if (isBottomFontSize) isBottomFontSize.value = botSnap.fontSize || 14;
    if (isBottomHeight) isBottomHeight.value = botSnap.height || 12;

    refreshIsGroupStates();
    itemSettingsModal.classList.add('active');
  }

  // Включает/выключает тело группы (визуально + pointer-events).
  function refreshIsGroupStates() {
    const setBody = (enabled, attr) => {
      const body = itemSettingsModal.querySelector(`.is-group-body[data-is-${attr}]`);
      if (body) body.classList.toggle('is-disabled', !enabled);
    };
    setBody(isBgEnabled.checked, 'bg');
    setBody(isOutsideShow.checked, 'outside');
    setBody(isInsideShow.checked, 'inside');
    setBody(isBottomShow ? isBottomShow.checked : false, 'bottom');
  }

  // Записывает per-item поле и помечает группу как настроенную.
  function setIsField(kind, field, value) {
    const it = itemsData[currentItemSettingsIndex] || (itemsData[currentItemSettingsIndex] = {});
    it[field] = value;
    it[`${kind}Customized`] = true;
    updatePreview();
  }

  // === Привязки контроллов модала ===
  // Группа «Фон»
  if (isBgEnabled) isBgEnabled.addEventListener('change', () => {
    const it = itemsData[currentItemSettingsIndex] || (itemsData[currentItemSettingsIndex] = {});
    if (isBgEnabled.checked) {
      // При включении фиксируем текущие значения как per-item.
      it.bgCustomized = true;
      it.headerBg = isHeaderBgColor.value;
      it.bgImage = isBgImage.value;
      if (uploadedDataUrl) it.customBgData = uploadedDataUrl;
    } else {
      // Выключение → возврат к глобальному фону.
      delete it.bgCustomized;
      PER_ITEM_FIELDS.bg.forEach(f => delete it[f]);
    }
    refreshIsGroupStates();
    updatePreview();
  });
  if (isHeaderBgColor) isHeaderBgColor.addEventListener('input', () => setIsField('bg', 'headerBg', isHeaderBgColor.value));
  if (isBgImage) isBgImage.addEventListener('change', () => setIsField('bg', 'bgImage', isBgImage.value));

  // Группа «Блок СВЕРХУ»
  if (isOutsideShow) isOutsideShow.addEventListener('change', () => {
    // Чекбокс показывает/скрывает тело и сразу пишется в per-item поле.
    const it = itemsData[currentItemSettingsIndex] || (itemsData[currentItemSettingsIndex] = {});
    it.outsideShow = isOutsideShow.checked;
    it.outsideCustomized = true;
    refreshIsGroupStates();
    updatePreview();
  });
  if (isOutsideText) isOutsideText.addEventListener('input', () => setIsField('outside', 'outsideText', isOutsideText.value));
  if (isOutsideBg) isOutsideBg.addEventListener('input', () => setIsField('outside', 'outsideBg', isOutsideBg.value));
  if (isOutsideBgImg) isOutsideBgImg.addEventListener('change', () => setIsField('outside', 'outsideBgImg', isOutsideBgImg.value));
  if (isOutsideColor) isOutsideColor.addEventListener('input', () => setIsField('outside', 'outsideColor', isOutsideColor.value));
  if (isOutsideFontSize) isOutsideFontSize.addEventListener('input', () => setIsField('outside', 'outsideFontSize', isOutsideFontSize.value));
  if (isOutsideHeight) isOutsideHeight.addEventListener('input', () => setIsField('outside', 'outsideHeight', isOutsideHeight.value));

  // Группа «Блок ВНУТРИ»
  if (isInsideShow) isInsideShow.addEventListener('change', () => {
    const it = itemsData[currentItemSettingsIndex] || (itemsData[currentItemSettingsIndex] = {});
    it.insideShow = isInsideShow.checked;
    it.insideCustomized = true;
    refreshIsGroupStates();
    updatePreview();
  });
  if (isInsideText) isInsideText.addEventListener('input', () => setIsField('inside', 'insideText', isInsideText.value));
  if (isInsideBg) isInsideBg.addEventListener('input', () => setIsField('inside', 'insideBg', isInsideBg.value));
  if (isInsideBgImg) isInsideBgImg.addEventListener('change', () => setIsField('inside', 'insideBgImg', isInsideBgImg.value));
  if (isInsideColor) isInsideColor.addEventListener('input', () => setIsField('inside', 'insideColor', isInsideColor.value));
  if (isInsideFontSize) isInsideFontSize.addEventListener('input', () => setIsField('inside', 'insideFontSize', isInsideFontSize.value));
  if (isInsideHeight) isInsideHeight.addEventListener('input', () => setIsField('inside', 'insideHeight', isInsideHeight.value));

  // Группа «Блок СНИЗУ»
  if (isBottomShow) isBottomShow.addEventListener('change', () => {
    const it = itemsData[currentItemSettingsIndex] || (itemsData[currentItemSettingsIndex] = {});
    it.bottomShow = isBottomShow.checked;
    it.bottomCustomized = true;
    refreshIsGroupStates();
    updatePreview();
  });
  if (isBottomText) isBottomText.addEventListener('input', () => setIsField('bottom', 'bottomText', isBottomText.value));
  if (isBottomBg) isBottomBg.addEventListener('input', () => setIsField('bottom', 'bottomBg', isBottomBg.value));
  if (isBottomBgImg) isBottomBgImg.addEventListener('change', () => setIsField('bottom', 'bottomBgImg', isBottomBgImg.value));
  if (isBottomColor) isBottomColor.addEventListener('input', () => setIsField('bottom', 'bottomColor', isBottomColor.value));
  if (isBottomFontSize) isBottomFontSize.addEventListener('input', () => setIsField('bottom', 'bottomFontSize', isBottomFontSize.value));
  if (isBottomHeight) isBottomHeight.addEventListener('input', () => setIsField('bottom', 'bottomHeight', isBottomHeight.value));

  // Загрузка своих картинок для per-item фона/блоков (аналог setupDecorUpload,
  // но пишет в itemsData[i] вместо глобальных uploadedDataUrl-переменных).
  function setupIsUpload(input, optionEl, statusEl, kind, imgField, dataField) {
    if (!input) return;
    input.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function(event) {
        const it = itemsData[currentItemSettingsIndex] || (itemsData[currentItemSettingsIndex] = {});
        it[dataField] = event.target.result;
        it[imgField] = 'custom';
        it[`${kind}Customized`] = true;
        if (optionEl) optionEl.style.display = 'block';
        if (statusEl) statusEl.textContent = `✓ Загружено: ${file.name}`;
        // Переключаем select группы на «custom», чтобы пользователь видел выбор.
        const selMap = { bg: isBgImage, outside: isOutsideBgImg, inside: isInsideBgImg, bottom: isBottomBgImg };
        if (selMap[kind]) selMap[kind].value = 'custom';
        updatePreview();
      };
      reader.readAsDataURL(file);
    });
  }
  setupIsUpload(isBgCustomUpload, isBgCustomOption, isBgUploadStatus, 'bg', 'bgImage', 'customBgData');
  setupIsUpload(isOutsideCustomUpload, isOutsideCustomOption, isOutsideUploadStatus, 'outside', 'outsideBgImg', 'outsideCustomBg');
  setupIsUpload(isInsideCustomUpload, isInsideCustomOption, isInsideUploadStatus, 'inside', 'insideBgImg', 'insideCustomBg');
  setupIsUpload(isBottomCustomUpload, isBottomCustomOption, isBottomUploadStatus, 'bottom', 'bottomBgImg', 'bottomCustomBg');

  // Кнопки модала
  const cancelItemSettings = document.getElementById('cancelItemSettings');
  const resetItemSettings = document.getElementById('resetItemSettings');
  if (cancelItemSettings) cancelItemSettings.addEventListener('click', () => {
    itemSettingsModal.classList.remove('active');
  });
  if (resetItemSettings) resetItemSettings.addEventListener('click', () => {
    resetItemDecor(currentItemSettingsIndex);
    updatePreview();
    // Перезаполняем модал актуальными (теперь глобальными) значениями.
    openItemSettings(currentItemSettingsIndex);
  });
  // Закрытие по клику на фон.
  if (itemSettingsModal) itemSettingsModal.addEventListener('click', (e) => {
    if (e.target === itemSettingsModal) itemSettingsModal.classList.remove('active');
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
  const allInputs = [
    wobblerWidthInput, wobblerHeightInput,
    inputTitle, inputSubtitle, titleFont, titleColor, titleSize, titleWeight, titleItalic, titleOffsetY,
    subtitleColor, subtitleSize, subtitleWeight,
    showPriceToggle, priceFont, priceSize, priceWeight, priceColor, priceOffsetY, inputPrice, inputCurrency, pricePlateToggle,
    headerBgColor, bgImageSelect, headerHeightRange,
    sheetCount, singleRepeatCount, showCropMarks, gapInput,
    // Декоративные блоки «Оформление»
    decorOutsideShow, decorOutsideText, decorOutsideBg, decorOutsideBgImg, decorOutsideColor, decorOutsideFontSize, decorOutsideHeight,
    decorInsideShow, decorInsideText, decorInsideBg, decorInsideBgImg, decorInsideColor, decorInsideFontSize, decorInsideHeight, decorInsideWidth,
    decorBottomShow, decorBottomText, decorBottomBg, decorBottomBgImg, decorBottomColor, decorBottomFontSize, decorBottomHeight
  ];

  // Per-item размер шрифта наименования в режиме «Разные товары»: изменение
  // слайдера записывает кегль в активный товар. В single — обычное поведение.
  if (titleSize) {
    const writeTitleSize = () => {
      if (document.querySelector('input[name="printMode"]:checked').value === 'multi') {
        const it = itemsData[activePreviewIndex] || (itemsData[activePreviewIndex] = {});
        it.titleSize = parseFloat(titleSize.value) || 13;
      }
    };
    titleSize.addEventListener('input', writeTitleSize);
    titleSize.addEventListener('change', writeTitleSize);
  }

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
      // per-item запись в multi-режиме (повторяет writeTitleSize).
      if (document.querySelector('input[name="printMode"]:checked').value === 'multi') {
        const it = itemsData[activePreviewIndex] || (itemsData[activePreviewIndex] = {});
        it.titleSize = parseFloat(titleSizePreview.value) || 13;
      }
      updatePreview();
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

  // 4 клетки цены: автопереход, удаление назад, вставка нескольких цифр.
  priceCellEls.forEach((el, i) => {
    el.addEventListener('input', (e) => {
      // Оставляем только цифры, берём последний введённый символ.
      const digits = e.target.value.replace(/\D/g, '');
      e.target.value = digits.slice(-1);
      if (e.target.value && i < priceCellEls.length - 1) {
        priceCellEls[i + 1].focus();
      }
    });
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !el.value && i > 0) {
        priceCellEls[i - 1].focus();
      } else if (e.key === 'ArrowRight' && i < priceCellEls.length - 1) {
        priceCellEls[i + 1].focus();
      } else if (e.key === 'ArrowLeft' && i > 0) {
        priceCellEls[i - 1].focus();
      }
    });
    el.addEventListener('paste', (e) => {
      e.preventDefault();
      const text = (e.clipboardData || window.clipboardData).getData('text');
      const digits = text.replace(/\D/g, '').split('');
      priceCellEls.forEach((cell, ci) => { cell.value = digits[ci] || ''; });
      const focusIdx = Math.min(digits.length, priceCellEls.length - 1);
      priceCellEls[focusIdx].focus();
      updatePreview();
    });
    el.addEventListener('focus', (e) => e.target.select());
  });

  // === Ручное перетаскивание надписей в предпросмотре ===
  // Тумблер «Двигать надписи» включает режим drag-mode на превью.
  // Взаимоисключающе с режимом редактора границ (safe-edit-mode).
  if (dragModeToggle) {
    dragModeToggle.addEventListener('click', () => {
      const on = wobblerPreview.classList.toggle('drag-mode');
      dragModeToggle.classList.toggle('active', on);
      if (on) {   // выключаем редактор границ, если был включён
        wobblerPreview.classList.remove('safe-edit-mode');
        if (safeEditToggle) safeEditToggle.classList.remove('active');
      }
    });
  }
  // Тумблер «Границы текста» включает режим safe-edit-mode: поверх шапки
  // показывается редактируемый прямоугольник (края тянутся мышью).
  if (safeEditToggle) {
    safeEditToggle.addEventListener('click', () => {
      const on = wobblerPreview.classList.toggle('safe-edit-mode');
      safeEditToggle.classList.toggle('active', on);
      if (on) {   // выключаем перетаскивание надписей
        wobblerPreview.classList.remove('drag-mode');
        if (dragModeToggle) dragModeToggle.classList.remove('active');
        // Сразу позиционируем прямоугольник по текущим долям.
        positionSafeRect(resolveItemBg(activePreviewIndex).titleSafe);
      }
    });
  }

  // Сброс смещений АКТИВНОГО ценника (текущий товар в мульти-режиме / одиночный).
  if (resetLabelPosBtn) {
    resetLabelPosBtn.addEventListener('click', () => {
      const lp = activeLabelPos();
      // Сброс = возврат к значениям по умолчанию (вес/доп.текст остаётся на -2мм).
      const def = defaultLabelPos();
      lp.title = def.title;
      lp.subtitle = def.subtitle;
      lp.price = def.price;
      lp.priceDigits = def.priceDigits;
      lp.currency = def.currency;
      updatePreview();
    });
  }
  // Сброс смещений ВСЕХ ценников (все товары + одиночный).
  const resetAllLabelPosBtn = document.getElementById('resetAllLabelPosBtn');
  if (resetAllLabelPosBtn) {
    resetAllLabelPosBtn.addEventListener('click', () => {
      singleLabelPos = defaultLabelPos();
      itemsData.forEach(it => { if (it) it.labelPos = defaultLabelPos(); });
      updatePreview();
    });
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
      if (!wobblerPreview.classList.contains('drag-mode')) return;
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
      // Наименование, вес и цена общие для всех ценников: движение на активном
      // мгновенно разносится на все (включая №1).
      if (drag.target.kind === 'title' || drag.target.kind === 'subtitle'
          || drag.target.kind === 'price'
          || drag.target.kind === 'digit' || drag.target.kind === 'currency') {
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
  document.querySelectorAll('input[name="printMode"]').forEach(r => {
    r.addEventListener('change', updatePreview);
  });

  // Print Handlers
  if (printBtn) printBtn.addEventListener('click', triggerPrint);
  if (printBtnSidebar) printBtnSidebar.addEventListener('click', triggerPrint);

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
 });
