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

  // ==========================================================================
  // --- Всплывающие уведомления (Toast Notifications) ---
  // ==========================================================================
  function showToast(message, type = 'info', duration = 3000) {
    let container = document.getElementById('toastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toastContainer';
      container.className = 'toast-container no-print';
      document.body.appendChild(container);
    }

    // Ограничение: не более 4 уведомлений одновременно
    while (container.children.length >= 4) {
      container.firstElementChild.remove();
    }

    const toast = document.createElement('div');
    toast.className = `toast-item toast-${type}`;

    let icon = 'i-info';
    if (type === 'success') icon = 'i-check';
    else if (type === 'warning') icon = 'i-alert';
    else if (type === 'error') icon = 'i-x';

    const contentDiv = document.createElement('div');
    contentDiv.className = 'toast-content';
    contentDiv.textContent = message || '';

    const iconSpan = document.createElement('span');
    iconSpan.className = 'toast-icon';
    iconSpan.innerHTML = '<svg class="ico"><use href="#' + icon + '"/></svg>';

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'toast-close';
    closeBtn.title = 'Закрыть';
    closeBtn.textContent = '×';

    toast.appendChild(iconSpan);
    toast.appendChild(contentDiv);
    toast.appendChild(closeBtn);

    function closeToast() {
      if (toast.classList.contains('toast-closing')) return;
      toast.classList.add('toast-closing');
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 260);
    }

    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      closeToast();
    });

    toast.addEventListener('click', closeToast);
    container.appendChild(toast);

    if (duration > 0) {
      setTimeout(closeToast, duration);
    }
  }

  window.showToast = showToast;
  window.toast = showToast;

  // Автоматический перехват alert для мягких неблокирующих уведомлений
  window.alert = function (msg) {
    const text = String(msg || '');
    let type = 'info';
    const lower = text.toLowerCase();
    if (lower.includes('ошибк') || lower.includes('не удалось') || lower.includes('запрещен')) {
      type = 'error';
    } else if (lower.includes('успеш') || lower.includes('сохранен') || lower.includes('завершен') || lower.includes('скопирован')) {
      type = 'success';
    } else if (lower.includes('введите') || lower.includes('выберите') || lower.includes('нет ') || lower.includes('отметьте') || lower.includes('внимание')) {
      type = 'warning';
    }
    showToast(text, type, 4000);
  };

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
  const TEMPLATE_KEYS = ['alaska_dots', 'yellow_tag', 'ryba', 'sneki', 'sneki_5', 'sneki_digit', 'novy_vkus', 'novinka', 'tomat', 'sladko', 'sort_nedeli', 'korona_a5', 'a5'];
  const templateItems = {};
  function freshItem() {
    return { title: '', price: '', subtitle: '', subtitleManual: false, titleSizeManual: false, digit: '', count: 1 };
  }
  // Пуста ли строка: все поля (наименование/вес/цена) не заполнены.
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
    return [freshItem()]; // стартовая 1 пустая строка-«добавить»
  }
  TEMPLATE_KEYS.forEach(k => { templateItems[k] = freshItems(); });
  let itemsData = templateItems.alaska_dots;   // активный массив (старт — Бутылки)

  // Index of the item currently shown in the single preview (multi mode)
  let activePreviewIndex = 0;
  let draggedRowIndex = null;

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

  // === Превью начертаний в списках шрифтов: каждая опция набрана своим шрифтом ===
  document.querySelectorAll('select.font-dropdown').forEach(sel => {
    sel.querySelectorAll('option').forEach(opt => {
      const fam = opt.getAttribute('value');
      if (fam && fam.trim() !== '') opt.style.fontFamily = fam;
    });
  });

  // === Бейджи области применения («этот ценник» / «весь шаблон») ===
  // Показывают в заголовках секций 3/4/5 и в бейдже предпросмотра, куда попадут правки.
  // Только чтение состояния; сами режимы меняются сегментами внутри секций.
  function scopeBadgeLabel(mode) {
    return mode === 'template' ? 'весь шаблон' : 'этот ценник';
  }

  function renderPreviewItemBadge() {
    const badge = document.getElementById('previewItemBadge');
    if (!badge) return;

    const activeTab = document.querySelector('.sidebar-tab-btn.active');
    const target = activeTab ? activeTab.getAttribute('data-target') : '';
    const modeMap = { section3: fontApplyMode, section4: bgApplyMode, section5: decorApplyMode };
    const activeScopeMode = modeMap[target]; // 'item' | 'template' | undefined

    const isMulti = (typeof isMultiModeNow === 'function')
      ? isMultiModeNow()
      : (document.querySelector('input[name="printMode"]:checked')?.value === 'multi');
    const itemIndex = (typeof activePreviewIndex === 'number') ? activePreviewIndex : 0;

    if (isMulti) {
      badge.style.display = 'inline-flex';
      if (activeScopeMode) {
        const label = activeScopeMode === 'template' ? 'шаблон' : 'этот ценник';
        badge.textContent = `№${itemIndex + 1} · ${label}`;
        badge.title = `Ценник №${itemIndex + 1}. Правки активного раздела: ${activeScopeMode === 'template' ? 'весь шаблон (все ценники)' : 'только этот ценник'}.`;
        badge.classList.toggle('mode-template', activeScopeMode === 'template');
        badge.classList.toggle('mode-item', activeScopeMode !== 'template');
      } else {
        badge.textContent = `№${itemIndex + 1}`;
        badge.title = `Активный ценник №${itemIndex + 1}`;
        badge.classList.remove('mode-template', 'mode-item');
      }
    } else {
      if (activeScopeMode && activeScopeMode === 'item') {
        badge.style.display = 'inline-flex';
        badge.textContent = 'этот ценник';
        badge.title = 'Правки активного раздела: только этот ценник';
        badge.classList.remove('mode-template');
        badge.classList.add('mode-item');
      } else {
        badge.style.display = 'none';
        badge.classList.remove('mode-template', 'mode-item');
      }
    }
  }

  function updateScopeBadges() {
    const pairs = [
      ['fontScopeBadge', fontApplyMode],
      ['bgScopeBadge', bgApplyMode],
      ['decorScopeBadge', decorApplyMode]
    ];
    pairs.forEach(([id, mode]) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.textContent = scopeBadgeLabel(mode);
      el.classList.toggle('mode-template', mode === 'template');
      el.classList.toggle('mode-item', mode !== 'template');
    });
    const chip = document.getElementById('canvasScopeChip');
    if (chip) chip.style.display = 'none';

    renderPreviewItemBadge();
  }
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
  const priceCrossToggle = document.getElementById('priceCrossToggle');
  const priceCrossColor = document.getElementById('priceCrossColor');
  const priceCrossWidth = document.getElementById('priceCrossWidth');
  const priceCrossWidthVal = document.getElementById('priceCrossWidthVal');
  const priceCrossSettingsRow = document.getElementById('priceCrossSettingsRow');

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
  const decorOutsideFont = document.getElementById('decorOutsideFont');
  const decorOutsideItalic = document.getElementById('decorOutsideItalic');
  const decorOutsideShadow = document.getElementById('decorOutsideShadow');
  const decorOutsideShadowColor = document.getElementById('decorOutsideShadowColor');
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
  const decorInsideFont = document.getElementById('decorInsideFont');
  const decorInsideItalic = document.getElementById('decorInsideItalic');
  const decorInsideShadow = document.getElementById('decorInsideShadow');
  const decorInsideShadowColor = document.getElementById('decorInsideShadowColor');
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
  const decorBottomFont = document.getElementById('decorBottomFont');
  const decorBottomItalic = document.getElementById('decorBottomItalic');
  const decorBottomShadow = document.getElementById('decorBottomShadow');
  const decorBottomShadowColor = document.getElementById('decorBottomShadowColor');
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
  const downloadPdfBtn = document.getElementById('downloadPdfBtn');
  const downloadPdfBtnSidebar = document.getElementById('downloadPdfBtnSidebar');
  const downloadMultiPdfBtnSidebar = document.getElementById('downloadMultiPdfBtnSidebar');
  const downloadMultiPdfBtnDrawer = document.getElementById('downloadMultiPdfBtnDrawer');

  // Print Hub & Orientation Elements
  let printOrientationMode = localStorage.getItem('wobbler_print_orientation') || 'auto';
  const printOrientationControl = document.getElementById('printOrientationControl');
  const sheetOrientationPills = document.getElementById('sheetOrientationPills');

  // Preview Elements
  const wobblerPreview = document.getElementById('wobblerPreview');
  const wobblerHeader = document.getElementById('wobblerHeader');
  const wobblerBottom = document.getElementById('wobblerBottom');
  const previewTitle = document.getElementById('previewTitle');
  const previewSubtitle = document.getElementById('previewSubtitle');
  const previewBigDigit = document.getElementById('previewBigDigit');
  const previewPriceBox = document.getElementById('previewPriceBox');
  const previewPrice = document.getElementById('previewPrice');
  const previewCurrency = document.getElementById('previewCurrency');
  const sheetGridPreview = document.getElementById('sheetGridPreview');
  const printArea = document.getElementById('printArea');
  const dragModeToggle = document.getElementById('dragModeToggle');
  const safeEditToggle = document.getElementById('safeEditToggle');
  const resetLabelPosBtn = document.getElementById('resetLabelPosBtn');

  // Modal & Template Elements
  const autosaveIndicator = document.getElementById('autosaveIndicator');
  const autosaveText = document.getElementById('autosaveText');

  function setAutosaveStatus(status) {
    if (!autosaveIndicator || !autosaveText) return;
    autosaveIndicator.classList.remove('saving', 'error', 'is-saving');
    if (status === 'saving') {
      autosaveIndicator.classList.add('saving', 'is-saving');
      autosaveText.textContent = 'Сохранение...';
    } else if (status === 'error') {
      autosaveIndicator.classList.add('error');
      autosaveText.textContent = 'Ошибка';
    } else {
      autosaveText.textContent = 'Сохранено';
    }
  }

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

  // Multi-Print Elements
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

  // Руководство пользователя (Инструкция)
  const instructionBtn = document.getElementById('instructionBtn');
  const instructionModal = document.getElementById('instructionModal');
  const closeInstructionModal = document.getElementById('closeInstructionModal');
  const instructionPrintBtn = document.getElementById('instructionPrintBtn');
  const instructionIframe = document.getElementById('instructionIframe');

  // Переключатель темы оформления (День / Ночь)
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const themeIconSun = document.getElementById('themeIconSun');
  const themeIconMoon = document.getElementById('themeIconMoon');
  const themeToggleText = document.getElementById('themeToggleText');

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
      currency: { x: 0, y: 0 },
      bigdigit: { x: 0, y: 0 }
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
      currency: { x: (src.currency && src.currency.x) || 0, y: (src.currency && src.currency.y) || 0 },
      bigdigit: { x: (src.bigdigit && src.bigdigit.x) || 0, y: (src.bigdigit && src.bigdigit.y) || 0 }
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
      if (item.fonts && item.fonts.titleSize != null && item.fonts.titleSize !== '') {
        raw = item.fonts.titleSize;
      } else if (item.titleSize != null && item.titleSize !== '') {
        raw = item.titleSize;
      }
    }
    if (raw != null && raw !== '') {
      const v = parseFloat(raw);
      if (!isNaN(v)) return v;
    }
    const fb = templateFonts && templateFonts.titleSize;
    return parseFloat(fb) || (titleSize ? parseFloat(titleSize.value) : 13) || 13;
  }

  // === Per-item оформление и фон (кнопка ⚙ в строке таблицы) ===
  // Каждый ценник может переопределить блоки СВЕРХУ/ВНУТРИ и фон. В single-режиме
  // всегда читаются глобальные контролы; в multi — per-item поле, если оно задано,
  // иначе fallback к глобальному. Хелперы ниже — единая точка чтения значений для
  // превью активного ценника (updatePreview) и для клонов листа/печати.
  // Поле считается «заданным», если выставлен флаг ...Show явно (true/false),
  // чтобы пользователь мог и включать, и выключать блок для конкретного ценника.
  const PER_ITEM_FIELDS = {
    outside: ['outsideShow', 'outsideText', 'outsideBg', 'outsideBgImg', 'outsideCustomBg', 'outsideColor', 'outsideFontSize', 'outsideHeight'],
    inside: ['insideShow', 'insideText', 'insideBg', 'insideBgImg', 'insideCustomBg', 'insideColor', 'insideFontSize', 'insideHeight'],
    bottom: ['bottomShow', 'bottomText', 'bottomBg', 'bottomBgImg', 'bottomCustomBg', 'bottomColor', 'bottomFontSize', 'bottomHeight'],
    bg: ['headerBg', 'bgImage', 'customBgData', 'titleSafe']
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
    'priceFont', 'priceColor', 'priceSize', 'priceWeight', 'priceAlign', 'priceOffsetY', 'currency', 'priceShadow',
    'priceCross', 'priceCrossColor', 'priceCrossWidth'
  ];

  // Возвращает значение шрифтового поля для ценника: per-item override, иначе fallback
  // (обычно templateFonts[field]). itItalic хранится как boolean.
  function fontOf(item, field, fallback) {
    if (item && item[field] !== undefined) {
      return item[field];
    }
    if (item && item.fontsCustomized && item.fonts && item.fonts[field] !== undefined) {
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
      titleFont: titleFont ? titleFont.value : 'Arial, sans-serif',
      titleColor: titleColor ? titleColor.value : '#ffffff',
      titleSize: titleSize ? titleSize.value : 13,
      titleWeight: titleWeight ? titleWeight.value : '800',
      titleItalic: !!(titleItalic && titleItalic.checked),
      titleAlign: alignState.title || 'center',
      titleOffsetY: titleOffsetY ? titleOffsetY.value : 0,
      titleShadow: buildShadow(titleShadow ? titleShadow.value : 0, titleShadowColor ? titleShadowColor.value : '#000000'),
      subtitleColor: subtitleColor ? subtitleColor.value : '#ffffff',
      subtitleSize: subtitleSize ? subtitleSize.value : 11,
      subtitleWeight: subtitleWeight ? subtitleWeight.value : '700',
      subtitleAlign: alignState.subtitle || 'left',
      priceFont: priceFont ? priceFont.value : 'Arial, sans-serif',
      priceColor: priceColor ? priceColor.value : '#ffffff',
      priceSize: priceSize ? priceSize.value : 40,
      priceWeight: priceWeight ? priceWeight.value : '700',
      priceAlign: alignState.price || 'center',
      priceOffsetY: priceOffsetY ? priceOffsetY.value : 0,
      priceShadow: buildShadow(priceShadow ? priceShadow.value : 0, priceShadowColor ? priceShadowColor.value : '#000000'),
      currency: inputCurrency ? inputCurrency.value : '',
      priceCross: !!(priceCrossToggle && priceCrossToggle.checked),
      priceCrossColor: priceCrossColor ? priceCrossColor.value : '#e63946',
      priceCrossWidth: priceCrossWidth ? parseFloat(priceCrossWidth.value) || 7 : 7
    };
  }

  // Записывает снимок из объекта (templateFonts или item.fonts) обратно в инпуты DOM
  // и активные align-кнопки. Без вызова updatePreview — вызывает вызывающая сторона.
  function writeFontSnapshotToInputs(snap) {
    if (!snap) return;
    const tf = templateFonts || {};
    const get = (key, fallback) => (snap[key] !== undefined && snap[key] !== null ? snap[key] : (tf[key] !== undefined && tf[key] !== null ? tf[key] : fallback));

    if (titleFont) titleFont.value = get('titleFont', 'Arial, sans-serif');
    if (titleColor) titleColor.value = get('titleColor', '#ffffff');
    if (titleSize) titleSize.value = get('titleSize', 25);
    if (titleWeight) titleWeight.value = get('titleWeight', '800');
    if (titleItalic) {
      titleItalic.checked = !!get('titleItalic', false);
      const btn = titleItalic.closest('.format-toggle-btn');
      if (btn) btn.classList.toggle('active', titleItalic.checked);
    }
    if (titleOffsetY) titleOffsetY.value = get('titleOffsetY', 0);
    {
      const tsh = parseShadow(get('titleShadow', ''));
      if (titleShadow) titleShadow.value = tsh.strength;
      if (titleShadowColor) titleShadowColor.value = tsh.color;
    }
    alignState.title = get('titleAlign', 'center');
    if (subtitleColor) subtitleColor.value = get('subtitleColor', '#ffffff');
    if (subtitleSize) subtitleSize.value = get('subtitleSize', 13);
    if (subtitleWeight) subtitleWeight.value = get('subtitleWeight', '700');
    alignState.subtitle = get('subtitleAlign', 'left');
    if (priceFont) priceFont.value = get('priceFont', 'Arial, sans-serif');
    if (priceColor) priceColor.value = get('priceColor', '#000000');
    if (priceSize) priceSize.value = get('priceSize', 40);
    if (priceWeight) priceWeight.value = get('priceWeight', '800');
    if (priceOffsetY) priceOffsetY.value = get('priceOffsetY', 0);
    {
      const psh = parseShadow(get('priceShadow', ''));
      if (priceShadow) priceShadow.value = psh.strength;
      if (priceShadowColor) priceShadowColor.value = psh.color;
    }
    if (inputCurrency) inputCurrency.value = get('currency', '');
    alignState.price = get('priceAlign', 'center');
    if (priceCrossToggle) priceCrossToggle.checked = !!get('priceCross', false);
    if (priceCrossColor) priceCrossColor.value = get('priceCrossColor', '#e63946');
    if (priceCrossWidth) {
      const pcw = get('priceCrossWidth', 7);
      priceCrossWidth.value = pcw;
      if (priceCrossWidthVal) priceCrossWidthVal.textContent = pcw;
    }
    if (priceCrossSettingsRow && priceCrossToggle) {
      priceCrossSettingsRow.style.display = priceCrossToggle.checked ? 'flex' : 'none';
    }
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
      updateScopeBadges();
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
    updateScopeBadges();
  }

  // === Per-item оформление (декор-блоки #5): snapshot-модель ===
  // Список полей блоков СВЕРХУ/ВНУТРИ/СНИЗУ. Фон ценника (#4) вынесен в отдельную
  // модель (templateBg/bgApplyMode). insideWidth и titleSafe/headerHeight —
  // только шаблонные, в набор не входят.
  const DECOR_FIELDS = [
    // СВЕРХУ
    'outsideShow', 'outsideText', 'outsideBg', 'outsideBgImg', 'outsideCustomBg', 'outsideColor', 'outsideFontSize', 'outsideHeight',
    'outsideFont', 'outsideItalic', 'outsideShadow',
    // ВНУТРИ (insideWidth тоже per-item — переопределяет шаблонную ширину блока)
    'insideShow', 'insideText', 'insideBg', 'insideBgImg', 'insideCustomBg', 'insideColor', 'insideFontSize', 'insideHeight', 'insideWidth',
    'insideFont', 'insideItalic', 'insideShadow',
    // СНИЗУ
    'bottomShow', 'bottomText', 'bottomBg', 'bottomBgImg', 'bottomCustomBg', 'bottomColor', 'bottomFontSize', 'bottomHeight',
    'bottomFont', 'bottomItalic', 'bottomShadow'
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
      outsideShow: !!(decorOutsideShow && decorOutsideShow.checked),
      outsideText: decorOutsideText ? decorOutsideText.value : '',
      outsideBg: decorOutsideBg ? decorOutsideBg.value : '#e63946',
      outsideBgImg: decorOutsideBgImg ? decorOutsideBgImg.value : 'none',
      outsideCustomBg: uploadedDataUrl2 || null,
      outsideColor: decorOutsideColor ? decorOutsideColor.value : '#ffffff',
      outsideFont: decorOutsideFont ? decorOutsideFont.value : '',
      outsideItalic: !!(decorOutsideItalic && decorOutsideItalic.checked),
      outsideShadow: buildShadow(decorOutsideShadow ? decorOutsideShadow.value : 0, decorOutsideShadowColor ? decorOutsideShadowColor.value : '#000000'),
      outsideFontSize: decorOutsideFontSize ? decorOutsideFontSize.value : 14,
      outsideHeight: decorOutsideHeight ? decorOutsideHeight.value : 12,
      insideShow: !!(decorInsideShow && decorInsideShow.checked),
      insideText: decorInsideText ? decorInsideText.value : '',
      insideBg: decorInsideBg ? decorInsideBg.value : '#e63946',
      insideBgImg: decorInsideBgImg ? decorInsideBgImg.value : 'none',
      insideCustomBg: uploadedDataUrl3 || null,
      insideColor: decorInsideColor ? decorInsideColor.value : '#ffffff',
      insideFont: decorInsideFont ? decorInsideFont.value : '',
      insideItalic: !!(decorInsideItalic && decorInsideItalic.checked),
      insideShadow: buildShadow(decorInsideShadow ? decorInsideShadow.value : 0, decorInsideShadowColor ? decorInsideShadowColor.value : '#000000'),
      insideFontSize: decorInsideFontSize ? decorInsideFontSize.value : 11,
      insideHeight: decorInsideHeight ? decorInsideHeight.value : 8,
      insideWidth: decorInsideWidth ? decorInsideWidth.value : 50,
      bottomShow: !!(decorBottomShow && decorBottomShow.checked),
      bottomText: decorBottomText ? decorBottomText.value : '',
      bottomBg: decorBottomBg ? decorBottomBg.value : '#e63946',
      bottomBgImg: decorBottomBgImg ? decorBottomBgImg.value : 'none',
      bottomCustomBg: uploadedDataUrl4 || null,
      bottomColor: decorBottomColor ? decorBottomColor.value : '#ffffff',
      bottomFont: decorBottomFont ? decorBottomFont.value : '',
      bottomItalic: !!(decorBottomItalic && decorBottomItalic.checked),
      bottomShadow: buildShadow(decorBottomShadow ? decorBottomShadow.value : 0, decorBottomShadowColor ? decorBottomShadowColor.value : '#000000'),
      bottomFontSize: decorBottomFontSize ? decorBottomFontSize.value : 14,
      bottomHeight: decorBottomHeight ? decorBottomHeight.value : 12
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
    if (decorOutsideFont) decorOutsideFont.value = snap.outsideFont || '';
    if (decorOutsideItalic) decorOutsideItalic.checked = !!snap.outsideItalic;
    {
      const sh = parseShadow(snap.outsideShadow);
      if (decorOutsideShadow) decorOutsideShadow.value = sh.strength;
      if (decorOutsideShadowColor) decorOutsideShadowColor.value = sh.color;
    }
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
    if (decorInsideFont) decorInsideFont.value = snap.insideFont || '';
    if (decorInsideItalic) decorInsideItalic.checked = !!snap.insideItalic;
    {
      const sh2 = parseShadow(snap.insideShadow);
      if (decorInsideShadow) decorInsideShadow.value = sh2.strength;
      if (decorInsideShadowColor) decorInsideShadowColor.value = sh2.color;
    }
    if (decorInsideFontSize) decorInsideFontSize.value = snap.insideFontSize != null ? snap.insideFontSize : 11;
    if (decorInsideHeight) decorInsideHeight.value = snap.insideHeight != null ? snap.insideHeight : 8;
    if (decorInsideWidth) decorInsideWidth.value = snap.insideWidth != null ? snap.insideWidth : 50;
    uploadedDataUrl3 = snap.insideCustomBg || null;
    if (decorInsideCustomOption) decorInsideCustomOption.style.display = (snap.insideBgImg === 'custom' && snap.insideCustomBg) ? 'block' : 'none';
    if (decorInsideBgImg) decorInsideBgImg.value = (snap.insideBgImg === 'custom' && snap.insideCustomBg) ? 'custom' : (snap.insideBgImg || 'none');
    if (decorInsideUploadStatus) decorInsideUploadStatus.textContent = (snap.insideBgImg === 'custom' && snap.insideCustomBg) ? '✓ Пользовательский фон' : '';
    // СНИЗУ
    if (decorBottomShow) decorBottomShow.checked = !!snap.bottomShow;
    if (decorBottomText) decorBottomText.value = snap.bottomText || '';
    if (decorBottomBg) decorBottomBg.value = snap.bottomBg || '#e63946';
    if (decorBottomColor) decorBottomColor.value = snap.bottomColor || '#ffffff';
    if (decorBottomFont) decorBottomFont.value = snap.bottomFont || '';
    if (decorBottomItalic) decorBottomItalic.checked = !!snap.bottomItalic;
    {
      const sh3 = parseShadow(snap.bottomShadow);
      if (decorBottomShadow) decorBottomShadow.value = sh3.strength;
      if (decorBottomShadowColor) decorBottomShadowColor.value = sh3.color;
    }
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
      updateScopeBadges();
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
    updateScopeBadges();
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

  const EXTRA_BG_LABELS = {
    'ryba_vygodno.png': 'Рыба Выгодно',
    'sort_nedeli_yellow.jpg': 'Сорт недели (Желтый)',
    'sort_nedeli_bg.jpg': 'Сорт недели (Красный)',
    'korona_a5_orange.jpg': 'Корона А5 (Оранжевый)',
    'korona_a5_blue.jpg': 'Корона А5 (Синий)',
    'korona_a5_red.jpg': 'Корона А5 (Красный)',
    'korona_a5_green.jpg': 'Корона А5 (Зелёный)',
    'korona_a5_bg.jpeg': 'Корона А5 (Желтый)',
    'korona_a5_bg.jpg': 'Корона А5 (Желтый)',
    'a5.jpg': 'А5 (Желтый)',
    'a5_orange.jpg': 'А5 (Оранжевый)',
    'a5_red.jpg': 'А5 (Красный)',
    'a5_blue.jpg': 'А5 (Голубой)',
    'a5_green.jpg': 'А5 (Зелёный)',
    'aktsiya_a5_orange.jpg': 'Корона А5 (Оранжевый)',
    'aktsiya_a5_blue.jpg': 'Корона А5 (Синий)',
    'aktsiya_a5_red.jpg': 'Корона А5 (Красный)',
    'aktsiya_a5_green.jpg': 'Корона А5 (Зелёный)',
    'aktsiya_a5_bg.jpeg': 'Корона А5 (Желтый)',
    'aktsiya_a5_bg.jpg': 'Корона А5 (Желтый)',
    'ba.jpg': 'Б/А',
    'zhivoe.jpg': 'Живое',
    'ostryi.png': 'Остро',
    'kalmar.png': 'Кальмары',
    'myaso.png': 'Вяленое мясо',
    'syr.png': 'Сыр',
    'ryb_solomka.png': 'Рыбная соломка',
    'orehi.png': 'Орехи',
    'grenki.png': 'Гренки',
    'moreprodukty.png': 'Морепродукты',
    'tomatnyj.png': 'Томатный',
    'vishnevyj.png': 'Вишневый',
    'medovyj.png': 'Медовый',
    'yablochnyj.png': 'Яблочный'
  };

  // Читает все сохранённые ранее фоны из IndexedDB и наполняет подменю.
  // Общий хелпер: наполняет extraBgMap и <optgroup> подменю списка пар
  // {name, ref}, где ref — это либо data:URL (локальный кэш из IndexedDB),
  // либо путь к файлу (онлайн: 'bg other/foo.png'). applyBackgroundTo()
  // использует extraBgMap[marker] как есть, поэтому оба варианта работают.
  // НЕ очищает подменю — вызывающая сторона при необходимости чистит сама.
  function populateExtraBgOptions(items) {
    const group = document.getElementById('extraBgGroup');
    extraBgOrder = items.map(e => e.name)
      .sort((a, b) => String(a).toLowerCase().localeCompare(String(b).toLowerCase()));
    extraBgOrder.forEach(name => {
      const entry = items.find(e => e.name === name);
      if (!entry || !entry.ref) return;
      const marker = 'bgother:' + name;
      extraBgMap[marker] = entry.ref;
      extraBgMap[name] = entry.ref;
      if (group) {
        const opt = document.createElement('option');
        opt.value = marker;
        opt.textContent = EXTRA_BG_LABELS[name] || name;
        group.appendChild(opt);
      }
    });
    // Если активный фон — доп. и его option появился только сейчас,
    // повторно синхронизируем контролы, чтобы селект его отобразил.
    try { syncBgControlsToContext(); } catch (e) { }
    try { if (typeof renderBgGalleryGrid === 'function') renderBgGalleryGrid(); } catch (e) { }
  }

  // Онлайн-режим (http/https): читает bg_index.json (генерируется скриптом
  // gen_bg_index.py и заливается на сервер рядом с index.html) и наполняет
  // подменю ссылками на файлы в «images». На file:// НЕ вызывается — там
  // fetch локальных файлов заблокирован, используется IndexedDB-кэш.
  // Ошибки/отсутствие файла молча пропускаются (graceful degradation).
  async function loadExtraBackgroundsOnline() {
    const group = document.getElementById('extraBgGroup');
    if (group) Array.from(group.querySelectorAll('option')).forEach(o => o.remove());
    let index;
    try {
      const resp = await fetch('bg_index.json', { cache: 'no-cache' });
      if (!resp.ok) return;
      index = await resp.json();
    } catch (e) { return; }
    if (!index || !Array.isArray(index.files) || index.files.length === 0) return;
    const dir = index.dir || 'images';
    populateExtraBgOptions(index.files.map(name => ({ name: name, ref: dir + '/' + name })));
  }

  // Вызывается при загрузке страницы. Ошибки/пустое хранилище не выбрасывает.
  async function loadExtraBackgrounds() {
    // Онлайн: фоны из «bg other» грузятся автоматически по bg_index.json.
    if (location.protocol === 'http:' || location.protocol === 'https:') {
      await loadExtraBackgroundsOnline();
      return;
    }
    // Локально (file://): из кэша IndexedDB (наполняется одним ручным выбором папки).
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
        // Дочитаем значения по ключам и наполняем подменю через общий хелпер.
        const tx2 = db.transaction(EXTRA_BG_STORE, 'readonly');
        const store2 = tx2.objectStore(EXTRA_BG_STORE);
        let loaded = 0;
        const items = [];
        names.forEach(name => {
          const getReq = store2.get(name);
          getReq.onsuccess = () => {
            if (getReq.result) items.push({ name: name, ref: getReq.result });
            loaded++;
            if (loaded === names.length) {
              db.close();
              populateExtraBgOptions(items);
            }
          };
          getReq.onerror = () => {
            loaded++;
            if (loaded === names.length) { db.close(); populateExtraBgOptions(items); }
          };
        });
      };
      allReq.onerror = () => db.close();
    } catch (e) { try { db.close(); } catch (_) { } }
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
    } catch (e) { try { db.close(); } catch (_) { } }

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
    try { syncBgControlsToContext(); } catch (e) { }
  }

  // Снимок полей фона из DOM-контролов + загруженной data-URL картинки.
  function readBgSnapshotFromInputs() {
    return {
      headerBg: headerBgColor ? headerBgColor.value : '#18181b',
      bgImage: bgImageSelect ? bgImageSelect.value : 'none',
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
    try {
      if (typeof syncBgGalleryActiveState === 'function') {
        syncBgGalleryActiveState((snap.bgImage === 'custom' && snap.customBgData) ? 'custom' : (snap.bgImage || 'none'));
      }
    } catch (e) { }
  }

  // Фильтрует список доп. фонов в селекте шапки (#extraBgGroup):
  // для шаблона «Рыба» — только «Рыба Выгодно», для «Корона А5» — цвета Короны, для «Сорт недели» — цвета Сорта, для «А5» — цвета А5, для «Бутылки» — Томатный, Медовый, Яблочный, Б/А, Живое, для «Снеки» — Остро.
  function filterExtraBgOptionsForActiveTemplate() {
    const group = document.getElementById('extraBgGroup');
    if (!group) return;
    const isRyba = (activeTemplateRef && activeTemplateRef.key === 'ryba');
    const isKoronaA5 = (activeTemplateRef && (activeTemplateRef.key === 'korona_a5' || activeTemplateRef.key === 'aktsiya_a5'));
    const isSortNedeli = (activeTemplateRef && activeTemplateRef.key === 'sort_nedeli');
    const isA5 = (activeTemplateRef && activeTemplateRef.key === 'a5');
    const isAlaska = (activeTemplateRef && activeTemplateRef.key === 'alaska_dots');
    const isSneki = (activeTemplateRef && activeTemplateRef.key === 'sneki');
    const isSneki5 = (activeTemplateRef && activeTemplateRef.key === 'sneki_5');
    const isNoExtra = (activeTemplateRef && (
      activeTemplateRef.key === 'yellow_tag' ||
      activeTemplateRef.key === 'sneki_digit' ||
      activeTemplateRef.key === 'novy_vkus' ||
      activeTemplateRef.key === 'novinka' ||
      activeTemplateRef.key === 'tomat' ||
      activeTemplateRef.key === 'sladko'
    ));
    const alaskaBgs = ['tomatnyj.png', 'vishnevyj.png', 'medovyj.png', 'yablochnyj.png', 'ba.jpg', 'zhivoe.jpg'];

    Array.from(group.querySelectorAll('option')).forEach(opt => {
      const isRybaVygodno = opt.value === 'bgother:ryba_vygodno.png' || opt.value.includes('ryba_vygodno');
      const isKorona = opt.value.includes('korona_a5') || opt.value.includes('aktsiya_a5');
      const isSort = opt.value.includes('sort_nedeli');
      const isA5Bg = opt.value.includes('a5.') || opt.value.includes('a5_') || opt.value.includes('a5:');
      const isAlaskaBg = alaskaBgs.some(b => opt.value.includes(b));
      const isOstryi = opt.value === 'bgother:ostryi.png' || opt.value.includes('ostryi');

      if (isRyba) {
        opt.style.display = isRybaVygodno ? '' : 'none';
        opt.disabled = !isRybaVygodno;
      } else if (isKoronaA5) {
        opt.style.display = isKorona ? '' : 'none';
        opt.disabled = !isKorona;
      } else if (isSortNedeli) {
        opt.style.display = isSort ? '' : 'none';
        opt.disabled = !isSort;
      } else if (isA5) {
        opt.style.display = isA5Bg ? '' : 'none';
        opt.disabled = !isA5Bg;
      } else if (isAlaska) {
        opt.style.display = isAlaskaBg ? '' : 'none';
        opt.disabled = !isAlaskaBg;
      } else if (isSneki) {
        const isSnekiBg = isOstryi || opt.value.includes('kalmar') || opt.value.includes('myaso') || opt.value.includes('syr') || opt.value.includes('ryb_solomka') || opt.value.includes('orehi') || opt.value.includes('grenki');
        opt.style.display = isSnekiBg ? '' : 'none';
        opt.disabled = !isSnekiBg;
      } else if (isSneki5) {
        const isSneki5Bg = opt.value.includes('moreprodukty');
        opt.style.display = isSneki5Bg ? '' : 'none';
        opt.disabled = !isSneki5Bg;
      } else if (isNoExtra) {
        opt.style.display = 'none';
        opt.disabled = true;
      } else {
        opt.style.display = (isRybaVygodno || isKorona || isSort || isA5Bg) ? 'none' : '';
        opt.disabled = (isRybaVygodno || isKorona || isSort || isA5Bg);
      }
    });
  }

  // Переводит контролы фона под активный контекст (item vs template).
  function syncBgControlsToContext() {
    filterExtraBgOptionsForActiveTemplate();
    const isMulti = isMultiModeNow();
    if (!isMulti) {
      bgApplyMode = 'template';
      if (bgApplyModeWrap) bgApplyModeWrap.style.display = 'none';
      writeBgSnapshotToInputs(templateBg);
      try { refreshAutoBgBtns(); } catch (e) { }
      updateScopeBadges();
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
    try { refreshAutoBgBtns(); } catch (e) { }
    updateScopeBadges();
  }

  // Возвращает полный «снимок» оформления блока (outside/inside/bottom) для ценника i.
  // Per-item override берётся из itemsData[i].decor (если decorCustomized),
  // иначе из templateDecor. Контракт: {show,text,bg,bgImg,customBg,color,font,italic,shadow,fontSize,height[,width]}.
  function resolveDecorBlock(i, kind) {
    const it = itemsData[i];
    const td = templateDecor || {};
    const isRyba = (activeTemplateRef && activeTemplateRef.key === 'ryba');
    const defaultH = isRyba ? 13 : 12;
    if (kind === 'outside') {
      return {
        show: decorOf(it, 'outsideShow', td.outsideShow != null ? td.outsideShow : false),
        text: decorOf(it, 'outsideText', td.outsideText != null ? td.outsideText : ''),
        bg: decorOf(it, 'outsideBg', td.outsideBg || '#e63946'),
        bgImg: decorOf(it, 'outsideBgImg', td.outsideBgImg || 'none'),
        customBg: decorOf(it, 'outsideCustomBg', td.outsideCustomBg != null ? td.outsideCustomBg : null),
        color: decorOf(it, 'outsideColor', td.outsideColor || '#ffffff'),
        font: decorOf(it, 'outsideFont', td.outsideFont || ''),
        italic: decorOf(it, 'outsideItalic', td.outsideItalic === true),
        shadow: decorOf(it, 'outsideShadow', td.outsideShadow || ''),
        fontSize: decorOf(it, 'outsideFontSize', td.outsideFontSize != null ? td.outsideFontSize : 14),
        height: decorOf(it, 'outsideHeight', td.outsideHeight != null ? td.outsideHeight : defaultH)
      };
    }
    if (kind === 'bottom') {
      return {
        show: decorOf(it, 'bottomShow', td.bottomShow != null ? td.bottomShow : false),
        text: decorOf(it, 'bottomText', td.bottomText != null ? td.bottomText : ''),
        bg: decorOf(it, 'bottomBg', td.bottomBg || '#e63946'),
        bgImg: decorOf(it, 'bottomBgImg', td.bottomBgImg || 'none'),
        customBg: decorOf(it, 'bottomCustomBg', td.bottomCustomBg != null ? td.bottomCustomBg : null),
        color: decorOf(it, 'bottomColor', td.bottomColor || '#ffffff'),
        font: decorOf(it, 'bottomFont', td.bottomFont || ''),
        italic: decorOf(it, 'bottomItalic', td.bottomItalic === true),
        shadow: decorOf(it, 'bottomShadow', td.bottomShadow || ''),
        fontSize: decorOf(it, 'bottomFontSize', td.bottomFontSize != null ? td.bottomFontSize : 14),
        height: decorOf(it, 'bottomHeight', td.bottomHeight != null ? td.bottomHeight : defaultH)
      };
    }
    // inside. width — per-item (из it.decor.insideWidth), иначе шаблонный (DOM decorInsideWidth).
    return {
      show: decorOf(it, 'insideShow', td.insideShow != null ? td.insideShow : false),
      text: decorOf(it, 'insideText', td.insideText != null ? td.insideText : ''),
      bg: decorOf(it, 'insideBg', td.insideBg || '#e63946'),
      bgImg: decorOf(it, 'insideBgImg', td.insideBgImg || 'none'),
      customBg: decorOf(it, 'insideCustomBg', td.insideCustomBg != null ? td.insideCustomBg : null),
      color: decorOf(it, 'insideColor', td.insideColor || '#ffffff'),
      font: decorOf(it, 'insideFont', td.insideFont || ''),
      italic: decorOf(it, 'insideItalic', td.insideItalic === true),
      shadow: decorOf(it, 'insideShadow', td.insideShadow || ''),
      fontSize: decorOf(it, 'insideFontSize', td.insideFontSize != null ? td.insideFontSize : 11),
      height: decorOf(it, 'insideHeight', td.insideHeight != null ? td.insideHeight : 8),
      width: decorOf(it, 'insideWidth', decorInsideWidth ? decorInsideWidth.value : 50)
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
    const n = v => { const x = parseFloat(v); return isNaN(x) ? 0 : Math.max(0, Math.min(0.9, x)); };
    return s ? { left: n(s.left), right: n(s.right), top: n(s.top), bottom: n(s.bottom) } : { left: 0, right: 0, top: 0, bottom: 0 };
  }
  // Ограничение доли в [0, 0.9] (для drag краёв safe-зоны).
  const clampSafe = v => Math.max(0, Math.min(0.9, v));

  // Размеры шапки ценника в миллиметрах для точной подстройки safe-зоны (мм)
  function getSafeZoneHeaderDimensionsMm() {
    const wCm = parseFloat(wobblerWidthInput ? wobblerWidthInput.value : 6.5) || 6.5;
    const hCm = parseFloat(wobblerHeightInput ? wobblerHeightInput.value : 4.5) || 4.5;
    const wMm = wCm * 10;
    const hMm = hCm * 10;
    const headerHm = (typeof currentLayout !== 'undefined' && currentLayout === 'full')
      ? hMm
      : hMm * (parseFloat(headerHeightRange ? headerHeightRange.value : 20.45) || 20.45) / 100;
    return { wMm, headerHm };
  }

  // Синхронизирует числовые инпуты плашки точной подстройки (в мм) с текущими долями titleSafe
  function syncSafeEditBarInputs(ts) {
    const safeEditBar = document.getElementById('safeEditBar');
    if (!safeEditBar || safeEditBar.style.display === 'none') return;
    const { wMm, headerHm } = getSafeZoneHeaderDimensionsMm();
    const safeTs = ts || readGlobalTitleSafe();

    const topMm = (safeTs.top * headerHm).toFixed(1);
    const bottomMm = (safeTs.bottom * headerHm).toFixed(1);
    const leftMm = (safeTs.left * wMm).toFixed(1);
    const rightMm = (safeTs.right * wMm).toFixed(1);

    const safeBarTop = document.getElementById('safeBarTop');
    const safeBarBottom = document.getElementById('safeBarBottom');
    const safeBarLeft = document.getElementById('safeBarLeft');
    const safeBarRight = document.getElementById('safeBarRight');
    const safeBarSizeDisplay = document.getElementById('safeBarSizeDisplay');

    if (safeBarTop && document.activeElement !== safeBarTop) safeBarTop.value = topMm;
    if (safeBarBottom && document.activeElement !== safeBarBottom) safeBarBottom.value = bottomMm;
    if (safeBarLeft && document.activeElement !== safeBarLeft) safeBarLeft.value = leftMm;
    if (safeBarRight && document.activeElement !== safeBarRight) safeBarRight.value = rightMm;

    if (safeBarSizeDisplay) {
      const zoneW_mm = Math.max(0, wMm * (1 - safeTs.left - safeTs.right));
      const zoneH_mm = Math.max(0, headerHm * (1 - safeTs.top - safeTs.bottom));
      const strongEl = safeBarSizeDisplay.querySelector('strong');
      if (strongEl) {
        strongEl.textContent = `${zoneW_mm.toFixed(1)} × ${zoneH_mm.toFixed(1)} мм`;
      } else {
        safeBarSizeDisplay.textContent = `Зона: ${zoneW_mm.toFixed(1)} × ${zoneH_mm.toFixed(1)} мм`;
      }
    }
  }

  // Смещение отступа safe-зоны на заданное количество мм (+/- 0.5 мм)
  function applySafeEditBarDelta(field, deltaMm) {
    const { wMm, headerHm } = getSafeZoneHeaderDimensionsMm();
    const ts = { ...readGlobalTitleSafe() };
    const totalDim = (field === 'top' || field === 'bottom') ? headerHm : wMm;
    const currentMm = (ts[field] || 0) * totalDim;
    let targetMm = Math.max(0, Math.round((currentMm + deltaMm) * 10) / 10);

    let newFrac = clampSafe(targetMm / totalDim);
    ts[field] = newFrac;

    if (field === 'top' || field === 'bottom') {
      if (ts.top + ts.bottom > 0.9) {
        if (field === 'top') ts.top = 0.9 - ts.bottom;
        else ts.bottom = 0.9 - ts.top;
      }
    } else {
      if (ts.left + ts.right > 0.9) {
        if (field === 'left') ts.left = 0.9 - ts.right;
        else ts.right = 0.9 - ts.left;
      }
    }

    globalTitleSafe = { left: ts.left, right: ts.right, top: ts.top, bottom: ts.bottom };
    positionSafeRect(ts);
    updatePreview();
    if (typeof refitActiveTitle === 'function') refitActiveTitle();
    if (typeof scheduleSessionSave === 'function') scheduleSessionSave();
  }

  // Прямая установка отступа safe-зоны по введённому значению мм
  function applySafeEditBarInputVal(field, valMm) {
    const { wMm, headerHm } = getSafeZoneHeaderDimensionsMm();
    const ts = { ...readGlobalTitleSafe() };
    const totalDim = (field === 'top' || field === 'bottom') ? headerHm : wMm;
    let targetMm = Math.max(0, parseFloat(valMm) || 0);

    let newFrac = clampSafe(targetMm / totalDim);
    ts[field] = newFrac;

    if (field === 'top' || field === 'bottom') {
      if (ts.top + ts.bottom > 0.9) {
        if (field === 'top') ts.top = 0.9 - ts.bottom;
        else ts.bottom = 0.9 - ts.top;
      }
    } else {
      if (ts.left + ts.right > 0.9) {
        if (field === 'left') ts.left = 0.9 - ts.right;
        else ts.right = 0.9 - ts.left;
      }
    }

    globalTitleSafe = { left: ts.left, right: ts.right, top: ts.top, bottom: ts.bottom };
    positionSafeRect(ts);
    updatePreview();
    if (typeof refitActiveTitle === 'function') refitActiveTitle();
    if (typeof scheduleSessionSave === 'function') scheduleSessionSave();
  }

  // Позиционирует прямоугольник редактора (.safe-rect) по текущим долям titleSafe.
  // inset — в % от .wobbler-header. Нет элемента/режима — тихо пропускает.
  function positionSafeRect(ts) {
    const rect = document.getElementById('safeRect');
    if (!rect) return;
    const safeTs = ts || readGlobalTitleSafe();
    rect.style.left = (safeTs.left * 100).toFixed(2) + '%';
    rect.style.right = (safeTs.right * 100).toFixed(2) + '%';
    rect.style.top = (safeTs.top * 100).toFixed(2) + '%';
    rect.style.bottom = (safeTs.bottom * 100).toFixed(2) + '%';
    syncSafeEditBarInputs(safeTs);
  }

  // Safe-зона названия для фона «Рыба Выгодно» полностью совпадает с геометрией шаблона «Рыба»:
  // left: 19.3%, right: 19.3%, top: 21.4%, bottom: 45.2%
  const RYBA_VYGODNO_TITLE_SAFE = {
    left: 0.193,
    right: 0.193,
    top: 0.214,
    bottom: 0.452
  };

  // Возвращает снимок фона ценника (хедер) для ценника i.
  // headerBg/bgImage/customBgData — per-item из itemsData[i].bg иначе templateBg.
  // titleSafe — для «Рыба Выгодно» подставляет спецграницы RYBA_VYGODNO_TITLE_SAFE, иначе глобальную safe-зону.
  function resolveItemBg(i) {
    const it = itemsData[i];
    const tb = templateBg || {};
    const currentBgImg = bgOf(it, 'bgImage', tb.bgImage || 'none');
    const isVygodno = currentBgImg === 'bgother:ryba_vygodno.png' || (typeof currentBgImg === 'string' && currentBgImg.includes('ryba_vygodno'));
    return {
      headerBg: bgOf(it, 'headerBg', tb.headerBg || '#ffffff'),
      bgImage: currentBgImg,
      customBg: bgOf(it, 'customBgData', tb.customBgData != null ? tb.customBgData : null),
      titleSafe: normTitleSafe(isVygodno ? RYBA_VYGODNO_TITLE_SAFE : readGlobalTitleSafe())
    };
  }

  // Объектный вариант резолвера блока: работает по самому item (для клонов листа/печати).
  // Параметризованная версия — принимает decor-snapshot td (форма как templateDecor)
  // и insideWidth-значение, чтобы работать с ЛЮБЫМ preset, а не только активным.
  function decorBlockFromItemCtx(item, kind, td, insideWidthVal) {
    td = td || {};
    const defaultH = (activeTemplateRef && activeTemplateRef.key === 'ryba') ? 13 : 12;
    if (kind === 'outside') {
      return {
        show: decorOf(item, 'outsideShow', td.outsideShow != null ? td.outsideShow : false),
        text: decorOf(item, 'outsideText', td.outsideText != null ? td.outsideText : ''),
        bg: decorOf(item, 'outsideBg', td.outsideBg || '#e63946'),
        bgImg: decorOf(item, 'outsideBgImg', td.outsideBgImg || 'none'),
        customBg: decorOf(item, 'outsideCustomBg', td.outsideCustomBg != null ? td.outsideCustomBg : null),
        color: decorOf(item, 'outsideColor', td.outsideColor || '#ffffff'),
        font: decorOf(item, 'outsideFont', td.outsideFont || ''),
        italic: decorOf(item, 'outsideItalic', td.outsideItalic === true),
        shadow: decorOf(item, 'outsideShadow', td.outsideShadow || ''),
        fontSize: decorOf(item, 'outsideFontSize', td.outsideFontSize != null ? td.outsideFontSize : 14),
        height: decorOf(item, 'outsideHeight', td.outsideHeight != null ? td.outsideHeight : defaultH)
      };
    }
    if (kind === 'bottom') {
      return {
        show: decorOf(item, 'bottomShow', td.bottomShow != null ? td.bottomShow : false),
        text: decorOf(item, 'bottomText', td.bottomText != null ? td.bottomText : ''),
        bg: decorOf(item, 'bottomBg', td.bottomBg || '#e63946'),
        bgImg: decorOf(item, 'bottomBgImg', td.bottomBgImg || 'none'),
        customBg: decorOf(item, 'bottomCustomBg', td.bottomCustomBg != null ? td.bottomCustomBg : null),
        color: decorOf(item, 'bottomColor', td.bottomColor || '#ffffff'),
        font: decorOf(item, 'bottomFont', td.bottomFont || ''),
        italic: decorOf(item, 'bottomItalic', td.bottomItalic === true),
        shadow: decorOf(item, 'bottomShadow', td.bottomShadow || ''),
        fontSize: decorOf(item, 'bottomFontSize', td.bottomFontSize != null ? td.bottomFontSize : 14),
        height: decorOf(item, 'bottomHeight', td.bottomHeight != null ? td.bottomHeight : defaultH)
      };
    }
    return {
      show: decorOf(item, 'insideShow', td.insideShow != null ? td.insideShow : false),
      text: decorOf(item, 'insideText', td.insideText != null ? td.insideText : ''),
      bg: decorOf(item, 'insideBg', td.insideBg || '#e63946'),
      bgImg: decorOf(item, 'insideBgImg', td.insideBgImg || 'none'),
      customBg: decorOf(item, 'insideCustomBg', td.insideCustomBg != null ? td.insideCustomBg : null),
      color: decorOf(item, 'insideColor', td.insideColor || '#ffffff'),
      font: decorOf(item, 'insideFont', td.insideFont || ''),
      italic: decorOf(item, 'insideItalic', td.insideItalic === true),
      shadow: decorOf(item, 'insideShadow', td.insideShadow || ''),
      fontSize: decorOf(item, 'insideFontSize', td.insideFontSize != null ? td.insideFontSize : 11),
      height: decorOf(item, 'insideHeight', td.insideHeight != null ? td.insideHeight : 8),
      width: decorOf(item, 'insideWidth', insideWidthVal != null ? insideWidthVal : 50)
    };
  }
  function decorBlockFromItem(item, kind) {
    return decorBlockFromItemCtx(item, kind, templateDecor, decorInsideWidth ? decorInsideWidth.value : 50);
  }
  function bgFromItemCtx(item, tb, titleSafe) {
    tb = tb || {};
    const currentBgImg = bgOf(item, 'bgImage', tb.bgImage || 'none');
    const isVygodno = currentBgImg === 'bgother:ryba_vygodno.png' || (typeof currentBgImg === 'string' && currentBgImg.includes('ryba_vygodno'));
    return {
      headerBg: bgOf(item, 'headerBg', tb.headerBg || '#ffffff'),
      bgImage: currentBgImg,
      customBg: bgOf(item, 'customBgData', tb.customBgData != null ? tb.customBgData : null),
      titleSafe: normTitleSafe(isVygodno ? RYBA_VYGODNO_TITLE_SAFE : (titleSafe || readGlobalTitleSafe()))
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
      autofitTitleOnly: true,
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
      priceSlotTop: 12.49,
      price: '350',
      currency: '₽',
      headerBg: '#18181b',
      bgImage: 'dots_bg.jpg',
      customBgData: null,
      headerHeight: 90,
      titleSlotTop: 3.39,
      titleZoneH: 7.43,
      titleSafe: { left: 0, right: 0, top: 0.1725957331451253, bottom: 0.613530750441911 },
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
      titleFitFloor: 5.5,
      labelPos: { title: { x: -0.4, y: 1.0 }, subtitle: { x: -4.9, y: -0.3 }, price: { x: 0.2, y: 1.7 }, priceDigits: [{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }], currency: { x: 0, y: 0 } }
    },
    // «Желтый ценник» — копия «Бутылок» (alaska_dots), но со своим файлом фона
    // yellow_bg.jpg и настроенными вручную цветами/расположением надписей
    // (импортировано из шаблона «Желтый ценник (изменён)»): текст/цена — чёрные.
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
      titleShadow: '',
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
      priceOffsetY: 0,
      priceShadow: '',
      priceCross: false,
      priceCrossColor: '#e63946',
      priceCrossWidth: 7,
      priceSlotTop: 12.92,
      price: '350',
      currency: '₽',
      digit: '',
      digitFont: "Arial, sans-serif",
      digitColor: '#ffff00',
      digitSize: 48,
      digitWeight: '800',
      headerBg: '#18181b',
      bgImage: 'yellow_bg.jpg',
      customBgData: null,
      headerHeight: 90,
      titleSlotTop: 8.14,
      titleZoneH: 7.37,
      titleSafe: { left: 0, right: 0, top: 0.3182627501706814, bottom: 0.47114838375413803 },
      layout: 'full',
      borderMm: 0,
      layerRotate: 0,
      priceInBottom: false,
      subtitleCorner: false,
      pricePlate: false,
      autofitTitleOnly: true,
      decorOutsideShow: false,
      decorOutsideText: 'НОВИНКА',
      decorOutsideBg: '#e63946',
      decorOutsideBgImg: 'none',
      decorOutsideCustomBg: null,
      decorOutsideColor: '#000000',
      decorOutsideFont: '',
      decorOutsideItalic: false,
      decorOutsideShadow: '',
      decorOutsideFontSize: 14,
      decorOutsideHeight: 12,
      decorInsideShow: false,
      decorInsideText: 'НОВИНКА',
      decorInsideBg: '#e63946',
      decorInsideBgImg: 'none',
      decorInsideCustomBg: null,
      decorInsideColor: '#000000',
      decorInsideFont: '',
      decorInsideItalic: false,
      decorInsideShadow: '',
      decorInsideFontSize: 11,
      decorInsideHeight: 8,
      decorInsideWidth: 50,
      decorBottomShow: false,
      decorBottomText: 'НОВИНКА',
      decorBottomBg: '#e63946',
      decorBottomBgImg: 'none',
      decorBottomCustomBg: null,
      decorBottomColor: '#000000',
      decorBottomFont: '',
      decorBottomItalic: false,
      decorBottomShadow: '',
      decorBottomFontSize: 14,
      decorBottomHeight: 12,
      gapMm: 0.5,
      titleFitFloor: 5.5,
      labelPos: {
        title: { x: 0, y: 0 },
        subtitle: { x: -4.9, y: -0.3 },
        price: { x: 0.2, y: 1.7 },
        priceDigits: [{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }],
        currency: { x: 0, y: 0 },
        bigdigit: { x: 0, y: 0 }
      }
    },
    novy_vkus: {
      name: 'Новый вкус',
      widthCm: 6.5,
      heightCm: 3.5,
      title: 'НОВЫЙ ВКУС',
      subtitle: '',
      titleFont: "'Montserrat', sans-serif",
      titleColor: '#ffffff',
      titleSize: 22,
      titleWeight: '900',
      titleItalic: false,
      titleAlign: 'center',
      titleOffsetY: 0,
      titleShadow: '1px 1px 0 #000000, 1px 1px 2px #000000',
      subtitleColor: '#ffffff',
      subtitleSize: 13,
      subtitleWeight: '700',
      subtitleAlign: 'left',
      showPrice: false,
      priceFont: "'Montserrat', sans-serif",
      priceSize: 48,
      priceWeight: '900',
      priceColor: '#ffffff',
      priceAlign: 'center',
      priceOffsetY: 0,
      priceShadow: '',
      price: '',
      currency: '',
      headerBg: '#e63946',
      bgImage: 'none',
      customBgData: null,
      headerHeight: 90,
      layout: 'full',
      subtitleCorner: false,
      titleSafe: { left: 0, right: 0, top: 0, bottom: 0 },
      labelPos: {
        title: { x: 0, y: 0 },
        subtitle: { x: 0, y: 0 },
        price: { x: 0, y: 0 },
        priceDigits: [{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }],
        currency: { x: 0, y: 0 }
      }
    },
    novinka: {
      name: 'Новинка',
      widthCm: 6.5,
      heightCm: 4.4,
      title: 'НОВИНКА',
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
      price: '',
      currency: '',
      subtitleColor: '#ffffff',
      subtitleSize: 11,
      subtitleWeight: '700',
      subtitleAlign: 'center',
      subtitle: '',
      headerBg: '#ff0000',
      bgImage: 'none',
      customBgData: null,
      headerHeight: 20.45,
      layout: 'split',
      titleFitFloor: 8,
      autofitTitleOnly: true,
      titleSafe: { left: 0.01, right: 0.01, top: 0, bottom: 0 },
      labelPos: {
        title: { x: 0, y: 0 },
        subtitle: { x: 0, y: 0 },
        price: { x: 0, y: 0 },
        priceDigits: [],
        currency: { x: 0, y: 0 }
      }
    },
    tomat: {
      name: 'Попробуй',
      widthCm: 6.5,
      heightCm: 4.4,
      title: 'ПОПРОБУЙ !',
      titleFont: "'Montserrat', sans-serif",
      titleColor: '#000000',
      titleSize: 17,
      titleWeight: '900',
      titleItalic: false,
      titleAlign: 'center',
      titleOffsetY: 0,
      showPrice: false,
      priceFont: "'Montserrat', sans-serif",
      priceSize: 28,
      priceWeight: '900',
      priceColor: '#000000',
      priceAlign: 'center',
      priceOffsetY: 0,
      price: '',
      currency: '',
      subtitleColor: '#000000',
      subtitleSize: 11,
      subtitleWeight: '700',
      subtitleAlign: 'center',
      subtitle: '',
      headerBg: '#ffff00',
      bgImage: 'none',
      customBgData: null,
      headerHeight: 20.45,
      layout: 'split',
      titleFitFloor: 8,
      autofitTitleOnly: true,
      titleSafe: { left: 0.01, right: 0.01, top: 0, bottom: 0 },
      labelPos: {
        title: { x: 0, y: 0 },
        subtitle: { x: 0, y: 0 },
        price: { x: 0, y: 0 },
        priceDigits: [],
        currency: { x: 0, y: 0 }
      }
    },
    sladko: {
      name: 'Сладко',
      widthCm: 6.5,
      heightCm: 4.4,
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
      price: '',
      currency: '',
      subtitleColor: '#ffffff',
      subtitleSize: 11,
      subtitleWeight: '700',
      subtitleAlign: 'center',
      subtitle: '',
      headerBg: '#7b2cbf',
      bgImage: 'none',
      customBgData: null,
      headerHeight: 20.45,
      layout: 'split',
      titleFitFloor: 8,
      autofitTitleOnly: true,
      titleSafe: { left: 0.01, right: 0.01, top: 0, bottom: 0 },
      labelPos: {
        title: { x: 0, y: 0 },
        subtitle: { x: 0, y: 0 },
        price: { x: 0, y: 0 },
        priceDigits: [],
        currency: { x: 0, y: 0 }
      }
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
      priceSlotTop: 54.94,
      price: '',
      currency: '',
      subtitleColor: '#ffffff',
      subtitleSize: 13,
      subtitleWeight: '700',
      subtitleAlign: 'left',
      headerBg: '#ffffff',     // белый фон шапки = поля 4 мм вокруг графики
      bgImage: 'sort_nedeli_bg.jpg',
      customBgData: null,
      headerHeight: 90,
      titleSlotTop: 32.5,
      titleZoneH: 50.0,
      layout: 'full',
      borderMm: 4,             // белая рамка 4 мм вокруг графики (поля под обрез)
      layerRotate: -2.45,      // наклон цены и текста акции как у графики
      // Позиции слоёв (мм, относительно базовой flex-раскладки header-content):
      // цена сдвинута ВВЕРХ — на белый блок (верхняя треть ценника),
      // наименование отцентровано на красном фоне.
      labelPos: {
        title: { x: 0, y: 0 },
        subtitle: { x: 0, y: 0 },
        price: { x: -7.3, y: -41.6 },
        priceDigits: [],
        currency: { x: 0, y: 0 }
      },
      // Safe-зона названия — красная зона под белым блоком. Доли от сторон шапки.
      titleSafe: { left: 0.025, right: 0.025, top: 0.401, bottom: 0.047 }
    },
    // «Корона А5»: графика 14,5×8,8 см + поля 3 мм под вырезание (итого 15,1×9,4 см, 3 шт./лист).
    // Только наименование, занимающее всю ширину нижнего жёлтого прямоугольника.
    korona_a5: {
      name: 'Корона А5',
      widthCm: 15.1,
      heightCm: 9.4,
      title: 'АКЦИЯ!',
      titleFont: "'Montserrat', sans-serif",
      titleColor: '#ffffff',
      titleSize: 42,
      titleWeight: '900',
      titleItalic: false,
      titleAlign: 'center',
      titleOffsetY: 0,
      titleShadow: '1px 1px 0 #000000, 2px 2px 0 #000000, 3px 3px 0 #000000, 4px 4px 0 #000000, 5px 5px 0 #000000, 5px 5px 10px #000000',
      showPrice: false,
      priceFont: "'Montserrat', sans-serif",
      priceSize: 40,
      priceWeight: '800',
      priceColor: '#000000',
      priceAlign: 'center',
      priceOffsetY: 0,
      price: '',
      currency: '',
      subtitleColor: '#000000',
      subtitleSize: 11,
      subtitleWeight: '700',
      subtitleAlign: 'center',
      subtitle: '',
      headerBg: '#ffffff',     // белые поля 3 мм вокруг графики под вырезание
      bgImage: 'korona_a5_bg.jpg',
      customBgData: null,
      headerHeight: 90,
      layout: 'full',
      borderMm: 3,             // белая рамка 3 мм вокруг графики (поля под обрез)
      layerRotate: 0,
      titleFitFloor: 14,
      autofitTitleOnly: true,
      labelPos: {
        title: { x: 0, y: 0 },
        subtitle: { x: 0, y: 0 },
        price: { x: 0, y: 0 },
        priceDigits: [],
        currency: { x: 0, y: 0 }
      },
      titleSafe: { left: 0.0276, right: 0.0276, top: 0.32, bottom: 0.044 }
    },
    // «А5»: графика 14,5×4,5 см + поля 3 мм под вырезание (итого 15,1×5,1 см, 5 шт./лист).
    a5: {
      name: 'А5',
      widthCm: 15.1,
      heightCm: 5.1,
      title: 'НАИМЕНОВАНИЕ ТОВАРА',
      titleFont: "'Montserrat', sans-serif",
      titleColor: '#000000',
      titleSize: 36,
      titleWeight: '900',
      titleItalic: false,
      titleAlign: 'center',
      titleOffsetY: 0,
      showPrice: false,
      priceFont: "'Montserrat', sans-serif",
      priceSize: 40,
      priceWeight: '800',
      priceColor: '#000000',
      priceAlign: 'center',
      priceOffsetY: 0,
      price: '',
      currency: '',
      subtitleColor: '#000000',
      subtitleSize: 11,
      subtitleWeight: '700',
      subtitleAlign: 'center',
      subtitle: '',
      headerBg: '#ffffff',
      bgImage: 'a5.jpg',
      customBgData: null,
      headerHeight: 90,
      layout: 'full',
      borderMm: 3,             // белая рамка 3 мм вокруг графики (поля под вырезание)
      layerRotate: 0,
      titleFitFloor: 12,
      autofitTitleOnly: true,
      labelPos: {
        title: { x: 0, y: 0 },
        subtitle: { x: 0, y: 0 },
        price: { x: 0, y: 0 },
        priceDigits: [],
        currency: { x: 0, y: 0 }
      },
      titleSafe: { left: 0.0276, right: 0.0276, top: 0.089, bottom: 0.089 },
      gapMm: 0
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
      priceOffsetY: 0,
      price: '300',
      currency: '₽',
      headerBg: '#000000',
      bgImage: 'ryba_bg.jpg',
      customBgData: null,
      headerHeight: 90,
      titleSlotTop: 8.3,
      titleZoneH: 18.3,
      priceSlotTop: 28.12,
      titleSafe: { left: 0.193, right: 0.193, top: 0.214, bottom: 0.452 },
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
      decorOutsideHeight: 13,
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
      decorBottomHeight: 13,
      // Авто-вес при вводе наименования (пока вес не правили вручную) и
      // минимальный кегль автоподгона названия (длинные названия переносятся
      // на 3+ строки, а не обрезаются). Настройки самого шаблона — общие
      // механизмы читают их по полям, без привязки к другим шаблонам.
      autoSubtitle: '100гр',
      titleFitFloor: 10,
      labelPos: { title: { x: 0, y: 0 }, subtitle: { x: -2, y: -2.2 }, price: { x: 0, y: 0 }, priceDigits: [{ x: -5.5, y: 0 }, { x: -1.1, y: 0 }, { x: 3.6, y: 0 }], currency: { x: 5.5, y: 0 } }
    },
    // Снеки — независимый шаблон: собственная геометрия 6,5×3,5 см, собственный
    // фон sneki_bg.jpg и собственные настройки ниже. Исторически значения
    // масштабированы с крупного воблера, но в коде нет никакой связи с другими
    // шаблонами: все особые правила заданы полями этого пресета.
    //  - autoSubtitle: авто-вес при вводе наименования (пока вес не правили вручную);
    //  - titleFitFloor: минимальный кегль автоподгона (перенос на 3+ строки);
    //  - autofitTitleOnly: кнопка «✨ Подогнать» меняет только кегль наименования.
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
      priceOffsetY: 0,
      priceSlotTop: 17.79,
      price: '300',
      currency: '₽',
      headerBg: '#000000',
      bgImage: 'sneki_bg.jpg',
      customBgData: null,
      headerHeight: 90,
      titleSlotTop: 4.1,
      titleZoneH: 11.5,
      titleSafe: { left: 0.175, right: 0.175, top: 0.218, bottom: 0.455 },
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
      autoSubtitle: '100гр',
      titleFitFloor: 10,
      autofitTitleOnly: true,
      digit: '',
      digitFont: "Arial, sans-serif",
      digitColor: '#ffff00',
      digitSize: 48,
      digitWeight: '900',
      labelPos: { title: { x: 0, y: 0 }, subtitle: { x: -2.1, y: -0.6 }, price: { x: 0, y: 0 }, priceDigits: [{ x: -3.2, y: 0 }, { x: -0.8, y: 0 }, { x: 1.7, y: 0 }], currency: { x: 3.7, y: 0 }, bigdigit: { x: 4, y: 6.8 } }
    },
    // «Снеки 5» — шаблон ценника 6,5×3,5 см с фоном sneki_5_bg.jpg (5 белых плашек под цифры цены/валюту).
    sneki_5: {
      name: 'Снеки 5',
      widthCm: 6.5,
      heightCm: 3.5,
      title: 'Судак вяленый',
      subtitle: '1000гр',
      titleFont: "Arial, sans-serif",
      titleColor: '#ffffff',
      titleSize: 28,
      titleWeight: '800',
      titleItalic: false,
      titleAlign: 'center',
      titleOffsetY: 0,
      subtitleColor: '#ffffff',
      subtitleSize: 6,
      subtitleWeight: '700',
      subtitleAlign: 'left',
      showPrice: true,
      priceFont: "Arial, sans-serif",
      priceSize: 26,
      priceWeight: '700',
      priceColor: '#000000',
      priceAlign: 'center',
      priceOffsetY: 0,
      priceSlotTop: 17.79,
      price: '300',
      currency: '₽',
      headerBg: '#000000',
      bgImage: 'sneki_5_bg.jpg',
      customBgData: null,
      headerHeight: 90,
      titleSlotTop: 4.1,
      titleZoneH: 11.5,
      titleSafe: { left: 0.175, right: 0.175, top: 0.218, bottom: 0.455 },
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
      autoSubtitle: '1000гр',
      titleFitFloor: 10,
      autofitTitleOnly: true,
      digit: '',
      digitFont: "Arial, sans-serif",
      digitColor: '#ffff00',
      digitSize: 48,
      digitWeight: '900',
      labelPos: {
        title: { x: 0, y: 0 },
        subtitle: { x: -3, y: 0.4 },
        price: { x: 0, y: 0 },
        priceDigits: [
          { x: -4.8, y: 0 },
          { x: -2.5, y: 0 },
          { x: -0.1, y: 0 },
          { x: 2.2, y: 0 }
        ],
        currency: { x: 3.7, y: 0 }
      }
    },
    // «Снеки с цифрой» — расширение «Снеков» (7,4×3,5 см): та же композиция
    // (чёрный фон, колосья, логотип, белая плашка), но справа после колоса
    // добавлена чёрная зона под БОЛЬШУЮ ЦИФРУ товара. Значение цифры — per-item
    // (своя у каждого товара в multi-режиме), стиль (шрифт/цвет/кегль/толщина) —
    // общий на шаблон. Все прочие настройки — геометрия/зоны/шрифты — как у «Снеков».
    sneki_digit: {
      name: 'Снеки с цифрой',
      widthCm: 7.4,
      heightCm: 3.5,
      title: 'Судак вяленый',
      subtitle: '100гр',
      titleFont: "Arial, sans-serif",
      titleColor: '#ffffff',
      titleSize: 28,
      titleWeight: '800',
      titleItalic: false,
      titleAlign: 'center',
      titleOffsetY: 1,
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
      priceOffsetY: 0,
      priceSlotTop: 17.79,
      price: '300',
      currency: '₽',
      headerBg: '#000000',
      bgImage: 'sneki_digit_bg.jpg',
      customBgData: null,
      headerHeight: 90,
      titleSlotTop: 2.94,
      titleZoneH: 10.85,
      titleSafe: { left: 0.22211000304261916, right: 0.19678179415958874, top: 0.21418534910449427, bottom: 0.4721325133320439 },
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
      autoSubtitle: '100гр',
      titleFitFloor: 10,
      autofitTitleOnly: true,
      // Слой «цифра»: значение per-item (digit), стиль — шаблонный
      // (цвет/кегль/толщина выверены вручную в визуальном редакторе).
      digit: '',
      digitFont: "Arial, sans-serif",
      digitColor: '#ffff00',
      digitSize: 67,
      digitWeight: '900',
      labelPos: { title: { x: -4.2, y: 0.3 }, subtitle: { x: -2.1, y: -0.6 }, price: { x: 0, y: 0 }, priceDigits: [{ x: -8.1, y: 0.4 }, { x: -5.7, y: 0.4 }, { x: -3.3, y: 0.4 }], currency: { x: -1.5, y: 0.2 }, bigdigit: { x: 2.6, y: 5.7 } }
    }
  };
  builtInPresets.aktsiya_a5 = builtInPresets.korona_a5;

  // Повреждённое хранилище не должно «убивать» всё приложение: читаем с защитой.
  let customTemplates = [];
  try {
    const parsed = JSON.parse(localStorage.getItem('wobbler_custom_templates_gas') || '[]');
    if (Array.isArray(parsed)) customTemplates = parsed;
  } catch (e) {
    console.warn('Сохранённые шаблоны повреждены и были сброшены:', e);
  }
  // Индекс выбранного пользовательского шаблона (для «Обновить») или null
  let activeTemplateId = null;
  // Расширенная ссылка на выбранный шаблон: { kind: 'builtin'|'custom', key: <presetKey>|<index> }.
  // Позволяет «Обновить» работать и для встроенных пресетов (создаётся пользовательская копия).
  let activeTemplateRef = null;

  // Сохранение шаблонов с защитой от переполнения квоты localStorage
  // (шаблоны со встроенными фонами base64 легко превышают ~5 МБ).
  function persistCustomTemplates() {
    try {
      localStorage.setItem('wobbler_custom_templates_gas', JSON.stringify(customTemplates));
      return true;
    } catch (e) {
      alert('Не удалось сохранить шаблоны в localStorage (вероятно, превышен объём хранилища — например, из-за встроенных фонов-картинок).\nИзменения шаблонов не сохранятся между сессиями.\n' + (e && e.message ? e.message : ''));
      return false;
    }
  }

  // Проверка, что ссылка на активный пользовательский шаблон ещё валидна
  // (после импорта/удаления индекс может «уехать» или стать вне диапазона).
  function revalidateActiveTemplateRef() {
    if (activeTemplateRef && activeTemplateRef.kind === 'custom') {
      if (!customTemplates[activeTemplateRef.index]) {
        activeTemplateRef = null;
        activeTemplateId = null;
      }
    }
  }

  // Возвращает объект активного шаблона (встроенного или пользовательского).
  function getActivePreset() {
    if (!activeTemplateRef) return null;
    if (activeTemplateRef.kind === 'builtin') return builtInPresets[activeTemplateRef.key] || null;
    if (activeTemplateRef.kind === 'custom') {
      const t = customTemplates[activeTemplateRef.index];
      return t ? (t.state || t) : null;
    }
    return null;
  }

  // Настройка-флаг активного ВСТРОЕННОГО/пользовательского пресета (autoSubtitle, titleFitFloor,
  // autofitTitleOnly…). Каждый шаблон описывает свои особые правила сам — в коде
  // нет проверок по имени ключа и связей между шаблонами.
  function builtinPresetFlag(name, fallback) {
    if (!activeTemplateRef) return fallback;
    const p = getActivePreset();
    return (p && p[name] !== undefined) ? p[name] : fallback;
  }

  // ===== Автосохранение сессии =====
  // Снимок всего заполненного (таблицы товаров ВСЕХ шаблонов + активный шаблон
  // с его текущим визуальным состоянием + режим заполнения) кладётся в
  // localStorage и восстанавливается при загрузке страницы. Работает одинаково
  // локально (file://, http://127.0.0.1) и на GitHub Pages — localStorage
  // привязан к домену, на каждом хостинге свой независимый экземпляр.
  const SESSION_KEY = 'wobbler_session_v1';
  let __sessionSaveTimer = null;
  let __sessionQuotaWarned = false;

  function saveSessionNow() {
    try {
      // Чей массив товаров сейчас активен (для custom-шаблона таблица остаётся
      // от последнего встроенного — сохраняем ссылку по имени ключа).
      const activeItemsKey = TEMPLATE_KEYS.find(k => templateItems[k] === itemsData) || 'alaska_dots';
      const session = {
        app: 'wobbler_designer_session',
        version: 1,
        savedAt: new Date().toISOString(),
        printMode: (document.querySelector('input[name="printMode"]:checked') || {}).value || 'multi',
        activeTemplate: activeTemplateRef ? JSON.parse(JSON.stringify(activeTemplateRef)) : null,
        activeItemsKey: activeItemsKey,
        state: getCurrentState(),
        items: {}
      };
      TEMPLATE_KEYS.forEach(k => {
        session.items[k] = JSON.parse(JSON.stringify(templateItems[k] || []));
      });
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      setAutosaveStatus('saved');
    } catch (e) {
      console.warn('Автосохранение сессии не удалось:', e);
      setAutosaveStatus('error');
      if (!__sessionQuotaWarned) {
        __sessionQuotaWarned = true;
        alert('Автосохранение сессии не работает: превышен объём localStorage (вероятно, из-за больших загруженных фонов). Данные не восстановятся после перезагрузки.');
      }
    }
  }

  // Дебаунс: любые изменения (ввод в таблице, смена шаблона, шрифты/фон/позиции)
  // завершаются вызовом updatePreview — оттуда и планируем сохранение.
  function scheduleSessionSave() {
    setAutosaveStatus('saving');
    if (__sessionSaveTimer) clearTimeout(__sessionSaveTimer);
    __sessionSaveTimer = setTimeout(() => {
      __sessionSaveTimer = null;
      saveSessionNow();
    }, 600);
  }

  function readSession() {
    try {
      const s = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
      if (!s || s.app !== 'wobbler_designer_session' || typeof s.items !== 'object' || s.items === null) return null;
      if (!s.state || typeof s.state !== 'object') return null;
      return s;
    } catch (e) {
      return null;
    }
  }

  // Восстановление сессии при загрузке. true — сессия применена (init тогда
  // пропускает дефолтное включение «Бутылок»).
  function restoreSession() {
    const s = readSession();
    if (!s) return false;

    // 1) Режим заполнения (Разные товары / Одинаковый текст).
    if (s.printMode === 'single' || s.printMode === 'multi') {
      const radio = document.querySelector('input[name="printMode"][value="' + s.printMode + '"]');
      if (radio) radio.checked = true;
    }

    // 2) Таблицы товаров всех шаблонов (с их per-item настройками).
    TEMPLATE_KEYS.forEach(k => {
      if (Array.isArray(s.items[k])) {
        templateItems[k] = s.items[k].map(it => {
          const item = (it && typeof it === 'object') ? it : freshItem();
          // Очистка испорченных значений кегля из-за старого сбоя probe (>= 90pt или <= 7pt), если не были заданы вручную
          if (!item.titleSizeManual) {
            if (item.titleSize >= 90 || item.titleSize <= 7) delete item.titleSize;
            if (item.fonts && (item.fonts.titleSize >= 90 || item.fonts.titleSize <= 7)) delete item.fonts.titleSize;
          }
          return item;
        });
      }
    });

    // 3) Активный шаблон и его таблица.
    let applied = false;
    const at = s.activeTemplate;
    if (at && at.kind === 'builtin' && builtInPresets[at.key]) {
      activeTemplateRef = { kind: 'builtin', key: at.key };
      itemsData = templateItems[at.key];
      applied = true;
    } else if (at && at.kind === 'custom' && customTemplates[at.index]) {
      activeTemplateRef = { kind: 'custom', index: at.index };
      activeTemplateId = at.index;
      // У пользовательского шаблона нет своего массива товаров — берём таблицу
      // последнего встроенного (как при обычном клике по его карточке).
      itemsData = templateItems[s.activeItemsKey] || templateItems.alaska_dots;
      applied = true;
    }
    if (!applied) {
      activeTemplateRef = { kind: 'builtin', key: 'alaska_dots' };
      itemsData = templateItems.alaska_dots;
    }
    activePreviewIndex = 0;

    // Миграция сохранённой сессии для шаблона «Желтый ценник»: перенос на новую базу без сдвига
    if (at && at.kind === 'builtin' && at.key === 'yellow_tag' && s.state) {
      s.state.titleSafe = JSON.parse(JSON.stringify(builtInPresets.yellow_tag.titleSafe));
      s.state.titleSlotTop = builtInPresets.yellow_tag.titleSlotTop;
      s.state.titleZoneH = builtInPresets.yellow_tag.titleZoneH;
      s.state.titleOffsetY = 0;
      if (s.state.labelPos && s.state.labelPos.title) {
        s.state.labelPos.title = { x: 0, y: 0 };
      }
    }
    // Миграция сохранённой сессии для шаблона «Рыба»: устранение устаревшей safe-зоны (0.29/0.4) от «Рыба Выгодно»
    if (at && at.kind === 'builtin' && at.key === 'ryba' && s.state) {
      if (s.state.titleSafe && (Math.abs(s.state.titleSafe.top - 0.29) < 0.01 || Math.abs(s.state.titleSafe.bottom - 0.4) < 0.01)) {
        s.state.titleSafe = JSON.parse(JSON.stringify(builtInPresets.ryba.titleSafe));
      }
    }
    if (Array.isArray(templateItems.yellow_tag)) {
      templateItems.yellow_tag.forEach(it => {
        if (it) {
          if (it.fonts && it.fonts.titleOffsetY != null) {
            it.fonts.titleOffsetY = 0;
          }
          if (it.labelPos && it.labelPos.title) {
            it.labelPos.title = { x: 0, y: 0 };
          }
        }
      });
    }
    // Миграция сохранённой сессии для шаблона «Корона А5»: центрирование наименования (сброс устаревшего смещения y: 12)
    if (at && at.kind === 'builtin' && (at.key === 'korona_a5' || at.key === 'aktsiya_a5') && s.state) {
      if (s.state.titleOffsetY === 1) {
        s.state.titleOffsetY = 0;
      }
      if (s.state.labelPos && s.state.labelPos.title && s.state.labelPos.title.y === 12) {
        s.state.labelPos.title = { x: 0, y: 0 };
      }
    }
    if (Array.isArray(templateItems.korona_a5)) {
      templateItems.korona_a5.forEach(it => {
        if (it) {
          if (it.fonts && it.fonts.titleOffsetY === 1) it.fonts.titleOffsetY = 0;
          if (it.labelPos && it.labelPos.title && it.labelPos.title.y === 12) it.labelPos.title = { x: 0, y: 0 };
        }
      });
    }
    // Миграция сохранённой сессии для шаблона «Сорт недели»: центрирование наименования на красном фоне и значок ₽
    if (at && at.kind === 'builtin' && at.key === 'sort_nedeli' && s.state) {
      s.state.titleSlotTop = builtInPresets.sort_nedeli.titleSlotTop;
      s.state.titleZoneH = builtInPresets.sort_nedeli.titleZoneH;
      s.state.titleSafe = JSON.parse(JSON.stringify(builtInPresets.sort_nedeli.titleSafe));
      if (s.state.labelPos && s.state.labelPos.title && (s.state.labelPos.title.y === 22 || s.state.labelPos.title.x === -1.2)) {
        s.state.labelPos.title = { x: 0, y: 0 };
      }
    }
    if (Array.isArray(templateItems.sort_nedeli)) {
      templateItems.sort_nedeli.forEach(it => {
        if (it) {
          if (it.labelPos && it.labelPos.title && (it.labelPos.title.y === 22 || it.labelPos.title.x === -1.2)) {
            it.labelPos.title = { x: 0, y: 0 };
          }
        }
      });
    }

    // Очистка испорченного глобального кегля шаблона (>= 90pt или <= 7pt) из-за старого сбоя probe
    if (s.state) {
      if (s.state.titleSize >= 90 || s.state.titleSize <= 7) {
        const bp = (at && at.kind === 'builtin' && builtInPresets[at.key]) ? builtInPresets[at.key] : null;
        s.state.titleSize = bp ? bp.titleSize : 20;
      }
      if (s.state.templateFonts && (s.state.templateFonts.titleSize >= 90 || s.state.templateFonts.titleSize <= 7)) {
        const bp = (at && at.kind === 'builtin' && builtInPresets[at.key]) ? builtInPresets[at.key] : null;
        s.state.templateFonts.titleSize = bp ? bp.titleSize : 20;
      }
    }

    // 4) Полное визуальное состояние активного шаблона (шрифты/фон/декор/размеры).
    applyState(s.state);

    // 5) Персональные позиции/переопределения каждого товара: applyState разнёс
    //    labelPos активного товара на всех — возвращаем сохранённые per-item
    //    значения и таблицу.
    const itemsKey = (at && at.kind === 'builtin') ? at.key : (s.activeItemsKey || 'alaska_dots');
    itemsData = templateItems[itemsKey] || templateItems.alaska_dots;
    renderItemsListInputs();
    updatePreview();
    if (typeof refitActiveTitle === 'function') refitActiveTitle(true);

    // 6) Подсветить карточку активного шаблона в панели слева.
    document.querySelectorAll('.preset-card').forEach(c => c.classList.remove('active'));
    if (activeTemplateRef.kind === 'builtin') {
      const card = document.querySelector('#builtInTemplates .preset-card[data-preset="' + activeTemplateRef.key + '"]');
      if (card) card.classList.add('active');
    } else {
      const card = userTemplatesContainer.children[activeTemplateRef.index];
      if (card && card.classList.contains('preset-card')) card.classList.add('active');
    }
    return true;
  }

  // Перезагрузка/закрытие вкладки/переход в фон — сохранить немедленно,
  // дебаунс может не успеть сработать.
  window.addEventListener('beforeunload', () => {
    if (__sessionSaveTimer) { clearTimeout(__sessionSaveTimer); __sessionSaveTimer = null; saveSessionNow(); }
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && __sessionSaveTimer) {
      clearTimeout(__sessionSaveTimer); __sessionSaveTimer = null; saveSessionNow();
    }
  });

  // ===== Полный сброс к исходному состоянию =====
  // Кнопка «♻️ Сброс» в секции «Шаблоны»: очищает сессию, товары, кэш доп. фонов
  // и настройки вида — приложение возвращается к состоянию первого запуска.
  // Сохранённые пользовательские шаблоны («Мои шаблоны») сохраняются.
  const resetAllBtn = document.getElementById('resetAllBtn');
  if (resetAllBtn) {
    resetAllBtn.addEventListener('click', () => {
      const ok = confirm(
        'Сбросить текущие данные к исходному состоянию?\n\n' +
        'Будет очищено:\n' +
        '• заполненные товары всех шаблонов, активный шаблон и режим;\n' +
        '• загруженные дополнительные фоны и настройки вида.\n\n' +
        'Сохранённые шаблоны («Мои шаблоны») останутся нетронутыми.\n\n' +
        'Действие необратимо. «Отмена» — ничего не менять.'
      );
      if (!ok) return;

      // 1) Хранилища: все ключи приложения в localStorage (кроме «Моих шаблонов» и настройки автооткрытия шторки) + кэш фонов в IndexedDB.
      try {
        const preserveAutoOpen = localStorage.getItem(AUTO_OPEN_DRAWER_KEY);
        Object.keys(localStorage)
          .filter(k => k.indexOf('wobbler_') === 0 && k !== 'wobbler_custom_templates_gas' && k !== AUTO_OPEN_DRAWER_KEY)
          .forEach(k => localStorage.removeItem(k));
        if (preserveAutoOpen !== null) {
          localStorage.setItem(AUTO_OPEN_DRAWER_KEY, preserveAutoOpen);
        }
      } catch (e) {
        console.warn('Не удалось очистить localStorage:', e);
      }
      if (window.indexedDB) {
        try { window.indexedDB.deleteDatabase(EXTRA_BG_DB); } catch (e) { /* приватный режим и т.п. */ }
      }

      // 2) Память: таблицы товаров, активный выбор, кэш фонов (customTemplates сохраняются!).
      TEMPLATE_KEYS.forEach(k => { templateItems[k] = freshItems(); });
      activeTemplateRef = { kind: 'builtin', key: 'alaska_dots' };
      activeTemplateId = null;
      activePreviewIndex = 0;
      itemsData = templateItems.alaska_dots;
      extraBgMap = {};
      extraBgOrder = [];
      const pmMulti = document.querySelector('input[name="printMode"][value="multi"]');
      if (pmMulti) pmMulti.checked = true;

      // 3) Пере-инициализация интерфейса под чистое состояние.
      renderSavedTemplates();
      renderItemsListInputs();
      applyState(builtInPresets.alaska_dots);
      document.querySelectorAll('.preset-card').forEach(c => c.classList.remove('active'));
      const alaskaCard = document.querySelector('#builtInTemplates .preset-card[data-preset="alaska_dots"]');
      if (alaskaCard) alaskaCard.classList.add('active');
      const extraGroup = document.getElementById('extraBgGroup');
      if (extraGroup) extraGroup.innerHTML = '';
      // Следующий updatePreview (из applyState) сохранит уже чистую сессию.
    });
  }

  // Прогрессивные строки «Разных товаров»: показываем столько строк, сколько
  // заполнено, + одну рабочую пустую снизу. При вводе в рабочую пустую строку
  // появляется следующая; при очистке — лишние пустые хвосты схлопываются.
  // Мутации делаем прямо по itemsData (это let-ссылка на templateItems[key]),
  // НЕ переприсваивая массив, чтобы не оторваться от хранилища шаблона.

  // Приводит itemsData к каноничному виду: ≤1 пустой строки в хвосте, но если
  // последний элемент заполнен — добавляем одну рабочую пустую. Идемпотентно.
  function normalizeItemsArray() {
    // Гарантируем поля subtitle/subtitleManual/digit/count у существующих элементов.
    for (let i = 0; i < itemsData.length; i++) {
      if (itemsData[i] && itemsData[i].subtitle === undefined) itemsData[i].subtitle = '';
      if (itemsData[i] && itemsData[i].subtitleManual === undefined) itemsData[i].subtitleManual = false;
      if (itemsData[i] && itemsData[i].titleSizeManual === undefined) itemsData[i].titleSizeManual = false;
      if (itemsData[i] && itemsData[i].digit === undefined) itemsData[i].digit = '';
      if (itemsData[i] && (itemsData[i].count === undefined || isNaN(itemsData[i].count) || itemsData[i].count < 1)) itemsData[i].count = 1;
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
        if (idrItemsList) {
          const idrRows = idrItemsList.querySelectorAll('.item-row');
          if (idrRows[idrRows.length - 1]) idrRows[idrRows.length - 1].remove();
        }
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
      const newIndex = itemsData.length - 1;
      itemsListContainer.appendChild(createItemRow(newIndex));
      if (idrItemsList) {
        idrItemsList.appendChild(createItemRow(newIndex));
      }
    }
    updateItemsEmptyHint();
    if (typeof updateItemsDrawerHeader === 'function') updateItemsDrawerHeader();
    if (typeof multiPrintDrawer !== 'undefined' && multiPrintDrawer && multiPrintDrawer.classList.contains('open')) {
      renderMultiPrintTemplates();
      updateMultiPrintSummary();
    }
  }

  // Подсказка-приглашение в шторке: видна, пока ни один товар не заполнен.
  function updateItemsEmptyHint() {
    const emptyHint = document.getElementById('itemsEmptyHint');
    if (emptyHint) emptyHint.style.display = itemsData.some(isItemFilled) ? 'none' : '';
  }

  // ===== Светлые фоны (Б/А, Живое, Рыба Выгодно, Сорт недели Желтый, А5): выбор → чёрный текст наименования/веса/цены =====
  const BG_BLACK_TEXT = ['bgother:ba.jpg', 'bgother:zhivoe.jpg', 'bgother:ryba_vygodno.png', 'bgother:sort_nedeli_yellow.jpg', 'sort_nedeli_yellow.jpg', 'bgother:a5.jpg', 'a5.jpg', 'bgother:a5_orange.jpg', 'a5_orange.jpg', 'bgother:a5_blue.jpg', 'a5_blue.jpg', 'bgother:a5_green.jpg', 'a5_green.jpg'];
  const BA_AUTO_COLORS = { titleColor: '#000000', subtitleColor: '#000000', priceColor: '#000000' };

  // Ставит чёрные цвета Б/А поверх существующих per-item шрифтов
  // (прочие поля — шрифт, размеры и т.д. — не трогает, кегль не замораживает).
  function applyBaAutoColors(it) {
    if (!it.fonts) it.fonts = {};
    it.fonts.titleColor = '#000000';
    it.fonts.subtitleColor = '#000000';
    it.fonts.priceColor = '#000000';
    it.fontsCustomized = true;
  }

  // Снимает 3 цветовых поля → цвета возвращаются к шаблонным (fontOf уйдёт
  // в fallback к templateFonts). Если после удаления per-item шрифтов не
  // осталось совсем — снимает и override целиком.
  function resetItemFontColors(it) {
    if (it.fonts) {
      delete it.fonts.titleColor;
      delete it.fonts.subtitleColor;
      delete it.fonts.priceColor;
      if (Object.keys(it.fonts).length === 0) {
        delete it.fonts;
        delete it.fontsCustomized;
      }
    }
  }

  // ===== Быстрые пресеты оформления для строки товара =====
  // Пресет = именованный набор полей трёх декор-блоков (сверху/внутри/снизу),
  // применяется per-item через иконку-кнопку 🎨 на строке товара.
  //
  // Формат полей (kind ∈ {outside, inside, bottom}):
  //   <kind>Show      boolean   показать/скрыть блок
  //   <kind>Text      строка    текст плашки (напр. 'НОВИНКА', 'АКЦИЯ')
  //   <kind>Bg        hex-цвет  цвет заливки блока (напр. '#e63946')
  //   <kind>BgImg     маркер    'none' | имя файла фона | 'custom'
  //   <kind>CustomBg  data:URL  картинка блока (только при BgImg='custom', иначе null)
  //   <kind>Color     hex-цвет  цвет текста блока (напр. '#ffffff')
  //   <kind>FontSize  число pt  размер шрифта (диапазон слайдера 6-60)
  //   <kind>Height    число мм  высота блока (outside/bottom 5-30, inside 3-15)
  //   insideWidth     число %   ширина блока «внутри» (20-100, только inside)
  //   <kind>Font      строка    font-family ('' = наследуется, напр. "'Russo One', sans-serif")
  //   <kind>Italic    boolean   курсив текста блока
  //   <kind>Shadow    строка    CSS text-shadow ('' = без тени; проще задавать силой+цветом
  //                             в UI, строку генерирует buildShadow)
  //
  // Задавать можно ЛЮБОЕ подмножество полей — недостающие возьмутся из
  // текущего шаблона (templateDecor) в момент применения.
  //
  // ПОПОЛНЕНИЕ: добавьте объект в массив. id — уникальная строка, label —
  // подпись в селекте строки товара.
  // ВНИМАНИЕ: каждый пресет задаёт ТОЛЬКО свойства своего целевого блока
  // (внутри ИЛИ сверху/снизу). Он не должен выключать другие блоки, чтобы
  // можно было свободно комбинировать оформление (например, «Остро» внутри + «Живое» сверху).
  const DECOR_PRESETS = [
    {
      id: 'ostryi',
      label: 'Остро',
      kind: 'inside',
      // Внутри-блок «ОСТРО!»: тёмно-красная заливка RGB(90,20,15),
      // белый текст, 13pt, высота 4мм, ширина 37%. Автоприменяется при
      // выборе фона «Остро» (см. обработчик .item-bg-btn).
      decor: {
        insideShow: true, insideText: 'ОСТРО!', insideBg: '#5A140F',
        insideBgImg: 'none', insideCustomBg: null, insideColor: '#ffffff',
        insideFontSize: 13, insideHeight: 4, insideWidth: 37
      }
    },
    {
      id: 'tomatnoe',
      label: 'Томатное',
      kind: 'inside',
      // Внутри-блок «ТОМАТНОЕ»: томатная заливка RGB(188,33,35),
      // белый текст, 14pt, высота 7мм, ширина 55%. Автоприменяется при
      // выборе фона «Томатный» (см. BG_DECOR_AUTOLINK).
      decor: {
        insideShow: true, insideText: 'ТОМАТНОЕ', insideBg: '#BC2123',
        insideBgImg: 'none', insideCustomBg: null, insideColor: '#ffffff',
        insideFontSize: 14, insideHeight: 7, insideWidth: 55
      }
    },
    {
      id: 'vishnevoe',
      label: 'Вишневое',
      kind: 'inside',
      // Внутри-блок «ВИШНЕВОЕ»: вишневая заливка RGB(136,19,55) (#881337),
      // белый текст, 14pt, высота 7мм, ширина 55%. Автоприменяется при
      // выборе фона «Вишневый» (см. BG_DECOR_AUTOLINK).
      decor: {
        insideShow: true, insideText: 'ВИШНЕВОЕ', insideBg: '#881337',
        insideBgImg: 'none', insideCustomBg: null, insideColor: '#ffffff',
        insideFontSize: 14, insideHeight: 7, insideWidth: 55
      }
    },
    {
      id: 'medovuha',
      label: 'Медовуха',
      kind: 'inside',
      // Внутри-блок «МЕДОВУХА»: медовая заливка RGB(220,151,65),
      // белый текст, 13pt, высота 7мм, ширина 55%. Автоприменяется при
      // выборе фона «Медовый» (см. BG_DECOR_AUTOLINK).
      decor: {
        insideShow: true, insideText: 'МЕДОВУХА', insideBg: '#DC9741',
        insideBgImg: 'none', insideCustomBg: null, insideColor: '#ffffff',
        insideFontSize: 13, insideHeight: 7, insideWidth: 55
      }
    },
    {
      id: 'sidr',
      label: 'Сидр',
      kind: 'inside',
      // Внутри-блок «СИДР»: оливковая заливка RGB(112,113,61),
      // белый текст, 20pt, высота 7мм, ширина 55%. Автоприменяется при
      // выборе фона «Яблочный» (см. BG_DECOR_AUTOLINK).
      decor: {
        insideShow: true, insideText: 'СИДР', insideBg: '#70713D',
        insideBgImg: 'none', insideCustomBg: null, insideColor: '#ffffff',
        insideFontSize: 20, insideHeight: 7, insideWidth: 55
      }
    },
    {
      id: 'zhivoe',
      label: 'Живое',
      dual: true,   // двухблочный: одинаковые блоки СВЕРХУ и СНИЗУ (вне размера
      // ценника); показывается один — по положению переключателя
      // decorPosToggle (глобальный «Блок: сверху/снизу»).
      // Блок «ЖИВОЕ»: жёлтая заливка RGB(255,241,12), чёрный текст, 30pt, 9мм.
      decor: {
        outsideShow: true, outsideText: 'ЖИВОЕ', outsideBg: '#FFF10C',
        outsideBgImg: 'none', outsideCustomBg: null, outsideColor: '#000000',
        outsideFontSize: 30, outsideHeight: 9,
        bottomShow: true, bottomText: 'ЖИВОЕ', bottomBg: '#FFF10C',
        bottomBgImg: 'none', bottomCustomBg: null, bottomColor: '#000000',
        bottomFontSize: 30, bottomHeight: 9
      }
    },
    {
      id: 'novinka',
      label: 'Новинка',
      dual: true,   // двухблочный, как «Живое» — положение через decorPosToggle.
      // Блок «НОВИНКА»: красная заливка RGB(255,0,0), белый текст, 30pt, 9мм.
      decor: {
        outsideShow: true, outsideText: 'НОВИНКА', outsideBg: '#FF0000',
        outsideBgImg: 'none', outsideCustomBg: null, outsideColor: '#ffffff',
        outsideFontSize: 30, outsideHeight: 9,
        bottomShow: true, bottomText: 'НОВИНКА', bottomBg: '#FF0000',
        bottomBgImg: 'none', bottomCustomBg: null, bottomColor: '#ffffff',
        bottomFontSize: 30, bottomHeight: 9
      }
    },
    {
      id: 'novaya_tsena',
      label: 'Новая цена',
      dual: true,   // двухблочный, положение через decorPosToggle (сверху/снизу).
      // Блок «Новая цена»: жёлтая заливка RGB(255,255,0) (#FFFF00), красный текст #FF0000, 34pt, 9мм.
      decor: {
        outsideShow: true, outsideText: 'Указать цену', outsideBg: '#FFFF00',
        outsideBgImg: 'none', outsideCustomBg: null, outsideColor: '#FF0000',
        outsideFontSize: 34, outsideHeight: 9,
        bottomShow: true, bottomText: 'Указать цену', bottomBg: '#FFFF00',
        bottomBgImg: 'none', bottomCustomBg: null, bottomColor: '#FF0000',
        bottomFontSize: 34, bottomHeight: 9
      }
    }
  ];

  // Автосвязка «фон → пресет оформления»: выбор фона-ключа применяет
  // одноимённый пресет оформления; выбор любого другого фона / «Как в шаблоне»
  // сбрасывает оформление к шаблонному (симметрично правилу Б/А для шрифтов).
  // Пополнение: добавьте пару «маркер фона → id пресета из DECOR_PRESETS».
  // Действует только когда включён переключатель 🔗 (bgDecorAutolinkEnabled).
  const BG_DECOR_AUTOLINK = {
    'bgother:ostryi.png': 'ostryi',
    'bgother:tomatnyj.png': 'tomatnoe',
    'bgother:vishnevyj.png': 'vishnevoe',
    'bgother:medovyj.png': 'medovuha',
    'bgother:yablochnyj.png': 'sidr',
    'bgother:zhivoe.jpg': 'zhivoe'
  };

  // ===== Глобальный переключатель автоприменения оформления (🔗) =====
  // ВКЛ: выбор фона из BG_DECOR_AUTOLINK применяет пресет, другой фон —
  // сбрасывает оформление. ВЫКЛ: выбор фона вообще не трогает оформление.
  // Состояние глобальное, сохраняется в localStorage, по умолчанию ВКЛ.
  const AUTOLINK_LS_KEY = 'wobbler_bg_decor_autolink';
  let bgDecorAutolinkEnabled = (localStorage.getItem(AUTOLINK_LS_KEY) ?? '1') === '1';

  // Подсвечивает обе кнопки-переключателя (в заголовке секции и у кнопок
  // вставки) в соответствии с текущим состоянием.
  function refreshAutolinkBtns() {
    document.querySelectorAll('.autolink-toggle').forEach(b => {
      b.classList.toggle('active', bgDecorAutolinkEnabled);
      b.title = 'Автоприменение оформления при выборе фона: ' +
        (bgDecorAutolinkEnabled ? 'ВКЛ (клик — выключить)' : 'ВЫКЛ (клик — включить)');
    });
  }

  function toggleBgDecorAutolink() {
    bgDecorAutolinkEnabled = !bgDecorAutolinkEnabled;
    try {
      localStorage.setItem(AUTOLINK_LS_KEY, bgDecorAutolinkEnabled ? '1' : '0');
    } catch (e) { }
    refreshAutolinkBtns();
  }

  // Обе кнопки-переключателя (в заголовке секции и у кнопок вставки)
  // управляют одним состоянием и подсвечиваются синхронно.
  document.querySelectorAll('.autolink-toggle').forEach(b => {
    b.addEventListener('click', toggleBgDecorAutolink);
  });
  refreshAutolinkBtns();

  // ===== Глобальное положение блока двухблочных пресетов (СВЕРХУ/СНИЗУ) =====
  // Применяется к пресетам с dual:true («Живое», «Новинка», ...): у них блоки
  // СВЕРХУ и СНИЗУ заданы одинаково; показывается ровно один — по этому
  // положению. Кнопка-переключатель — на панели превью (#decorPosToggle).
  // Состояние глобальное, сохраняется в сессию/шаблон (getCurrentState/applyState).
  let decorBlockPos = 'top';

  function refreshDecorPosBtn() {
    const top = decorBlockPos !== 'bottom';
    // Обе кнопки-переключателя (панель превью с подписью + иконка у кнопок
    // вставки) управляют одним состоянием и обновляются синхронно.
    document.querySelectorAll('.decor-pos-toggle').forEach(b => {
      b.innerHTML = (b.id === 'decorPosToggle')
        ? (top ? 'Блок: сверху' : 'Блок: снизу')
        : (top ? '<svg class="ico"><use href="#i-arrow-up"/></svg>' : '<svg class="ico"><use href="#i-arrow-down"/></svg>');
      b.title = 'Положение блока оформления для двухблочных пресетов (Живое, Новинка): ' +
        (top ? 'СВЕРХУ ценника (клик — переключить снизу)' : 'СНИЗУ ценника (клик — переключить сверху)');
    });
  }

  // Переключение: пере-применяем наборы пресетов, содержащие dual-пресеты,
  // с новым положением блока и перерисовываем превью (автосейв сам).
  function toggleDecorBlockPos() {
    decorBlockPos = (decorBlockPos === 'bottom') ? 'top' : 'bottom';
    refreshDecorPosBtn();
    itemsData.forEach((it, i) => {
      const ids = getItemDecorPresetIds(it);
      const hasDual = ids.some(id => {
        const p = DECOR_PRESETS.find(d => d.id === id);
        return p && p.dual;
      });
      if (hasDual) applyDecorPresetsByIdx(i, ids);
    });
    updatePreview();
    try { syncDecorControlsToContext(); } catch (e) { }
  }

  document.querySelectorAll('.decor-pos-toggle').forEach(b => {
    b.addEventListener('click', toggleDecorBlockPos);
  });
  refreshDecorPosBtn();

  // Выбранные пресеты оформления товара как массив id (порядок = порядок
  // выбора). Legacy-поле decorPreset (строка, до мультивыбора) конвертируется
  // на лету; при следующем применении перезапишется массивом decorPresets.
  function getItemDecorPresetIds(it) {
    if (!it) return [];
    if (Array.isArray(it.decorPresets)) {
      return it.decorPresets.filter(id => DECOR_PRESETS.some(p => p.id === id));
    }
    if (it.decorPreset && DECOR_PRESETS.some(p => p.id === it.decorPreset)) {
      return [it.decorPreset];
    }
    return [];
  }

  // Применяет НАБОР пресетов оформления к товару idx: полный снимок поверх
  // шаблона, пресеты объединяются без взаимного выключения разных блоков.
  // При конфликте одного и того же блока побеждает последний выбранный пресет.
  // Для dual-пресетов показывается один блок — по текущему decorBlockPos.
  // Пустой набор = сброс оформления к шаблонному.
  function applyDecorPresetsByIdx(idx, ids) {
    const it = itemsData[idx] || (itemsData[idx] = {});
    const valid = (Array.isArray(ids) ? ids : []).filter(id => DECOR_PRESETS.some(p => p.id === id));
    if (!valid.length) {
      resetDecorPresetByIdx(idx);
      return false;
    }
    // Начинаем с копии templateDecor, но сбрасываем show-флаги всех трёх блоков:
    // включены будут только те блоки, которые присутствуют в выбранных пресетах valid.
    const existingCustomText = it.decor && (it.decor.outsideText || it.decor.bottomText);
    const effective = Object.assign({}, templateDecor || {}, {
      outsideShow: false,
      insideShow: false,
      bottomShow: false
    });
    const isRyba = (activeTemplateRef && activeTemplateRef.key === 'ryba');
    valid.forEach(id => {
      const preset = DECOR_PRESETS.find(p => p.id === id);
      if (!preset) return;
      Object.assign(effective, preset.decor);
      if (isRyba) {
        if (preset.decor.outsideHeight !== undefined || preset.dual) effective.outsideHeight = 13;
        if (preset.decor.bottomHeight !== undefined || preset.dual) effective.bottomHeight = 13;
      }
      if (preset.dual) {
        const top = (decorBlockPos !== 'bottom');
        effective.outsideShow = top;
        effective.bottomShow = !top;
      }
      if (id === 'novaya_tsena') {
        it.priceCross = true;
        const ntVal = it.decor && it.decor.novayaTsenaVal;
        const ntCurr = (it.decor && it.decor.novayaTsenaCurr) !== undefined ? it.decor.novayaTsenaCurr : '₽';
        if (ntVal) {
          const full = ntCurr ? `${ntVal}${ntCurr}`.trim() : ntVal.trim();
          effective.outsideText = full;
          effective.bottomText = full;
        } else if (existingCustomText && existingCustomText !== 'Указать цену' && existingCustomText !== 'ЖИВОЕ' && existingCustomText !== 'НОВИНКА') {
          effective.outsideText = existingCustomText;
          effective.bottomText = existingCustomText;
        }
      }
    });
    it.decor = effective;
    it.decorCustomized = true;
    it.decorPresets = valid;      // помним набор для UI строки (галки)
    delete it.decorPreset;        // legacy-поле больше не нужно
    return true;
  }

  // Снимает per-item override оформления целиком (+ набор пресетов).
  function resetDecorPresetByIdx(idx) {
    resetItemDecor(idx);
    const it = itemsData[idx];
    if (it) {
      delete it.decorPreset;
      delete it.decorPresets;
    }
  }

  // Применяет НАБОР пресетов оформления к шаблону templateDecor
  function applyDecorPresetsToTemplate(ids) {
    const valid = (Array.isArray(ids) ? ids : []).filter(id => DECOR_PRESETS.some(p => p.id === id));
    if (!valid.length) {
      templateDecor = Object.assign({}, templateDecor || {}, {
        outsideShow: false,
        insideShow: false,
        bottomShow: false
      });
      writeDecorSnapshotToInputs(templateDecor);
      return;
    }
    const effective = Object.assign({}, templateDecor || {}, {
      outsideShow: false,
      insideShow: false,
      bottomShow: false
    });
    const isRyba = (activeTemplateRef && activeTemplateRef.key === 'ryba');
    valid.forEach(id => {
      const preset = DECOR_PRESETS.find(p => p.id === id);
      if (!preset) return;
      Object.assign(effective, preset.decor);
      if (isRyba) {
        if (preset.decor.outsideHeight !== undefined || preset.dual) effective.outsideHeight = 13;
        if (preset.decor.bottomHeight !== undefined || preset.dual) effective.bottomHeight = 13;
      }
      if (preset.dual) {
        const top = (decorBlockPos !== 'bottom');
        effective.outsideShow = top;
        effective.bottomShow = !top;
      }
    });
    templateDecor = effective;
    writeDecorSnapshotToInputs(templateDecor);
  }

  // Единая функция применения фона с автоматической связкой оформления и цвета текста
  function applyBackgroundAndAutolink(targetType, targetIndex, val) {
    const isItem = (targetType === 'item' && targetIndex >= 0);
    const it = isItem ? (itemsData[targetIndex] || (itemsData[targetIndex] = {})) : null;
    const preset = (activeTemplateRef && activeTemplateRef.kind === 'builtin') ? builtInPresets[activeTemplateRef.key] : null;
    const defaultBgImg = (preset && preset.bgImage) ? preset.bgImage : 'none';
    const defaultHeaderBg = (preset && preset.headerBg) ? preset.headerBg : ((headerBgColor && headerBgColor.value) || '#18181b');
    const defaultTitleColor = (preset && preset.titleColor) ? preset.titleColor : '#ffffff';
    const defaultSubtitleColor = (preset && preset.subtitleColor) ? preset.subtitleColor : '#ffffff';

    if (!val || val === 'none' || val === defaultBgImg) {
      // Сброс к дефолту / «Как в шаблоне» (Основной базовый фон пресета)
      if (isItem) {
        delete it.bgCustomized;
        delete it.bg;
        delete it.bgManual;
        delete it.fontsCustomized;
        delete it.fonts;
        resetItemFontColors(it);
        if (bgDecorAutolinkEnabled) resetDecorPresetByIdx(targetIndex);
      } else {
        templateBg = {
          headerBg: defaultHeaderBg,
          bgImage: defaultBgImg,
          customBgData: null
        };
        if (bgImageSelect) bgImageSelect.value = defaultBgImg;
        if (headerBgColor) headerBgColor.value = defaultHeaderBg;

        templateFonts = Object.assign({}, templateFonts, {
          titleColor: defaultTitleColor,
          subtitleColor: defaultSubtitleColor
        });
        if (titleColor) titleColor.value = defaultTitleColor;
        if (subtitleColor) subtitleColor.value = defaultSubtitleColor;

        // Сбрасываем кастомные фоны всех товаров, возвращая их к базовому фону шаблона
        if (Array.isArray(itemsData)) {
          itemsData.forEach(item => {
            if (item) {
              delete item.bgCustomized;
              delete item.bg;
              delete item.fontsCustomized;
              delete item.fonts;
            }
          });
        }

        if (bgDecorAutolinkEnabled) applyDecorPresetsToTemplate([]);
      }
      return;
    }

    // Применение фона
    if (isItem) {
      const prevHeader = bgOf(it, 'headerBg', (templateBg && templateBg.headerBg) || (headerBgColor ? headerBgColor.value : '#18181b'));
      it.bg = { headerBg: prevHeader, bgImage: val, customBgData: null };
      it.bgCustomized = true;

      // Авто-шрифт (чёрный текст для светлых фонов)
      if (BG_BLACK_TEXT.indexOf(val) !== -1) {
        applyBaAutoColors(it);
      } else {
        resetItemFontColors(it);
      }

      // Автосвязка фон ↔ оформление (BG_DECOR_AUTOLINK)
      if (bgDecorAutolinkEnabled) {
        const autoDecorId = BG_DECOR_AUTOLINK[val];
        if (autoDecorId) {
          applyDecorPresetsByIdx(targetIndex, [autoDecorId]);
        } else {
          resetDecorPresetByIdx(targetIndex);
        }
      }
    } else {
      // Применение к шаблону
      const prevHeader = (templateBg && templateBg.headerBg) || (headerBgColor ? headerBgColor.value : '#18181b');
      templateBg = { headerBg: prevHeader, bgImage: val, customBgData: null };
      if (bgImageSelect) bgImageSelect.value = val;

      if (BG_BLACK_TEXT.indexOf(val) !== -1) {
        templateFonts = Object.assign({}, templateFonts, {
          titleColor: '#000000',
          subtitleColor: '#000000'
        });
        if (titleColor) titleColor.value = '#000000';
        if (subtitleColor) subtitleColor.value = '#000000';
      } else {
        templateFonts = Object.assign({}, templateFonts, {
          titleColor: defaultTitleColor,
          subtitleColor: defaultSubtitleColor
        });
        if (titleColor) titleColor.value = defaultTitleColor;
        if (subtitleColor) subtitleColor.value = defaultSubtitleColor;
      }

      // Сбрасываем кастомные фоны товаров, чтобы весь список переключился на выбранный шаблонный фон
      if (Array.isArray(itemsData)) {
        itemsData.forEach(item => {
          if (item) {
            delete item.bgCustomized;
            delete item.bg;
          }
        });
      }

      if (bgDecorAutolinkEnabled) {
        const autoDecorId = BG_DECOR_AUTOLINK[val];
        if (autoDecorId) {
          applyDecorPresetsToTemplate([autoDecorId]);
        } else {
          applyDecorPresetsToTemplate([]);
        }
      }
    }
  }

  // ===== Автоподстановка фона по названию товара =====
  const AUTOBG_LS_KEY = 'wobbler_auto_bg_by_title';
  let autoBgByTitleEnabled = (localStorage.getItem(AUTOBG_LS_KEY) ?? '1') === '1';

  // Проверяет, применены ли индивидуальные/кастомные фоны у товаров (или у шаблона)
  function hasAppliedBackgrounds() {
    const isMulti = isMultiModeNow();
    const templateKey = (activeTemplateRef && activeTemplateRef.kind === 'builtin') ? activeTemplateRef.key : '';
    const preset = templateKey ? builtInPresets[templateKey] : null;
    const defaultBgImg = (preset && preset.bgImage) ? preset.bgImage : 'none';

    if (isMulti) {
      if (!Array.isArray(itemsData)) return false;
      return itemsData.some(it => {
        if (!it) return false;
        const bgImg = (it.bgCustomized && it.bg && it.bg.bgImage) ? it.bg.bgImage : '';
        return !!(bgImg && bgImg !== 'none' && bgImg !== defaultBgImg);
      });
    } else {
      const curBg = (templateBg && templateBg.bgImage) ? templateBg.bgImage : '';
      return !!(curBg && curBg !== 'none' && curBg !== defaultBgImg);
    }
  }

  // Убирает кастомные фоны у всех товаров (возвращает их к базовому фону шаблона)
  function clearAllItemBackgrounds() {
    const isMulti = isMultiModeNow();
    let count = 0;
    if (isMulti) {
      if (Array.isArray(itemsData)) {
        itemsData.forEach((item, idx) => {
          if (!item) return;
          if (item.bgCustomized || item.bg || item.bgManual) {
            delete item.bgManual;
            applyBackgroundAndAutolink('item', idx, 'none');
            if (item.decorPreset || (item.decorPresets && item.decorPresets.length)) {
              resetDecorPresetByIdx(idx);
            }
            count++;
          }
        });
      }
      renderItemsListInputs();
      if (typeof renderDrawerItems === 'function' && itemsDrawer && itemsDrawer.classList.contains('open')) {
        renderDrawerItems();
      }
      renderActiveTemplateColorBar();
      try { syncBgControlsToContext(); } catch (e) { }
      try { syncFontControlsToContext(); } catch (e) { }
      try { syncDecorControlsToContext(); } catch (e) { }
      updatePreview();
      scheduleSessionSave();
    } else {
      applyBackgroundAndAutolink('template', -1, 'none');
      renderActiveTemplateColorBar();
      try { syncBgControlsToContext(); } catch (e) { }
      try { syncFontControlsToContext(); } catch (e) { }
      try { syncDecorControlsToContext(); } catch (e) { }
      updatePreview();
      scheduleSessionSave();
      count = 1;
    }
    refreshAutoBgBtns();
    return count;
  }

  function refreshAutoBgBtns() {
    const isApplied = hasAppliedBackgrounds();
    document.querySelectorAll('.autobg-toggle').forEach(b => {
      if (b.classList.contains('btn-flash-success') || b.classList.contains('btn-flash-warn')) {
        return;
      }
      b.classList.toggle('active', isApplied);
      const isFull = b.classList.contains('autobg-toggle-full');
      if (isFull) {
        if (isApplied) {
          b.innerHTML = 'Авто-фон: <b>Убрать</b>';
          b.title = 'Убрать индивидуальные фоны у товаров (клик — сбросить к базовому шаблону)';
        } else {
          b.innerHTML = 'Авто-фон: <b>Применить</b>';
          b.title = 'Автоподстановка фона по названию товара (клик — применить ко всем заполненным товарам)';
        }
      } else {
        if (isApplied) {
          b.title = 'Фоны применены (клик — убрать фоны у всех товаров, Shift+клик — авто при вводе)';
        } else {
          b.title = 'Автоподстановка фона по названию товара (клик — применить ко всем, Shift+клик — авто при вводе)';
        }
      }
    });
    const liveChk = document.getElementById('autoBgLiveChk');
    if (liveChk) {
      liveChk.checked = autoBgByTitleEnabled;
    }
  }

  function handleAutoBgButtonClick(e) {
    if (e && e.shiftKey) {
      // Shift+клик переключает режим автоматической подстановки при вводе
      autoBgByTitleEnabled = !autoBgByTitleEnabled;
      try {
        localStorage.setItem(AUTOBG_LS_KEY, autoBgByTitleEnabled ? '1' : '0');
      } catch (err) { }
      refreshAutoBgBtns();
      return;
    }

    const isApplied = hasAppliedBackgrounds();

    if (isApplied) {
      // Кнопка убирает фоны
      const clearedCount = clearAllItemBackgrounds();

      // Визуальный отклик на кнопках
      document.querySelectorAll('.autobg-toggle').forEach(b => {
        b.classList.add('btn-flash-warn');
        const isFull = b.classList.contains('autobg-toggle-full');
        if (isFull) {
          b.innerHTML = 'Фоны: <b>Убраны!</b>';
        }
        setTimeout(() => {
          b.classList.remove('btn-flash-warn');
          refreshAutoBgBtns();
        }, 1200);
      });
    } else {
      // Кнопка применяет фоны
      autoBgByTitleEnabled = true;
      try {
        localStorage.setItem(AUTOBG_LS_KEY, '1');
      } catch (err) { }
      refreshAutoBgBtns();

      const appliedCount = applyAutoBgToAllItems(true);

      // Визуальный отклик на кнопках
      document.querySelectorAll('.autobg-toggle').forEach(b => {
        b.classList.add('btn-flash-success');
        const isFull = b.classList.contains('autobg-toggle-full');
        if (isFull) {
          b.innerHTML = appliedCount > 0 ? `Применено (${appliedCount})!` : 'Нет совпадений';
        }
        setTimeout(() => {
          b.classList.remove('btn-flash-success');
          refreshAutoBgBtns();
        }, 1200);
      });
    }
  }

  document.querySelectorAll('.autobg-toggle').forEach(b => {
    b.addEventListener('click', handleAutoBgButtonClick);
  });

  const autoBgLiveChkInit = document.getElementById('autoBgLiveChk');
  if (autoBgLiveChkInit) {
    autoBgLiveChkInit.addEventListener('change', () => {
      autoBgByTitleEnabled = autoBgLiveChkInit.checked;
      try {
        localStorage.setItem(AUTOBG_LS_KEY, autoBgByTitleEnabled ? '1' : '0');
      } catch (err) { }
      refreshAutoBgBtns();
    });
  }
  refreshAutoBgBtns();

  function getAutoBgForTitle(title, templateKey) {
    if (!title || typeof title !== 'string') return '';
    const t = title.toLowerCase().trim();
    if (!t) return '';

    // Шаблон «Снеки»
    if (templateKey === 'sneki') {
      // 1. Кальмар (в любом склонении: кальмар, кальмара, кольца кальмара, стружка кальмара и т.д.)
      if (t.includes('кальмар')) {
        return 'bgother:kalmar.png';
      }

      // 2. Рыбная соломка / рыба (лосось, горбуша, минтай, вобла, камбала, щука, сом, лещ, тунец и др.)
      // Проверяем рыбу до мяса, чтобы «лосось» гарантированно не путался с дичью «лось».
      if (
        t.includes('соломк') || t.includes('рыбн') ||
        t.includes('лосос') || t.includes('семг') ||
        t.includes('форел') || t.includes('кет') ||
        t.includes('горбуш') || t.includes('минтай') ||
        t.includes('вобл') || t.includes('камбал') ||
        t.includes('лещ') || t.includes('янтарн') ||
        t.includes('щук') || t.includes('тунец') ||
        t.includes('тунц') || t.includes('треск') ||
        t.includes('окун') || t.includes('судак')
      ) {
        return 'bgother:ryb_solomka.png';
      }

      // 3. Мясо / дичь (гусь, лось, олень, кабан, косуля, марал, медведь, глухарь, фазан, бобер и др.) / птица / мясные снеки
      const hasGameMoose = /(?:^|[^а-яёa-z0-9])(лось|лося|лосем|лосю|лосятин\w*|лосин\w*)(?:$|[^а-яёa-z0-9])/i.test(t);
      const hasGameGoose = /(?:^|[^а-яёa-z0-9])(гусь|гуся|гусем|гусю|гуси|гусей|гусин\w*|гусят\w*)(?:$|[^а-яёa-z0-9])/i.test(t);
      if (
        t.includes('мясо') || t.includes('мясн') ||
        t.includes('джерк') || t.includes('бастурм') ||
        t.includes('суджук') || t.includes('колбас') ||
        t.includes('кабанос') || t.includes('пивчик') ||
        t.includes('кнут') || t.includes('свинин') ||
        t.includes('говядин') || t.includes('телятин') ||
        t.includes('баранин') || t.includes('ягнят') ||
        t.includes('конин') || t.includes('куриц') ||
        t.includes('курин') || t.includes('индейк') ||
        t.includes('утк') || t.includes('утин') ||
        hasGameGoose || hasGameMoose ||
        t.includes('олен') || t.includes('кабан') ||
        t.includes('марал') || t.includes('косул') ||
        t.includes('медвеж') || t.includes('бобр') ||
        t.includes('глухар') || t.includes('фазан') ||
        t.includes('перепел') || t.includes('кролик') ||
        t.includes('крольч') || t.includes('страус') ||
        t.includes('зубр') || t.includes('дич') ||
        t.includes('сыровял') || t.includes('карпаччо') ||
        t.includes('хамон') || t.includes('билтонг')
      ) {
        return 'bgother:myaso.png';
      }

      // 4. Сыр
      if (t.includes('сыр') || t.includes('сулугуни') || t.includes('чечил') || t.includes('курт')) {
        return 'bgother:syr.png';
      }

      // 5. Острое / с перцем (в любом склонении: перец, перца, перцем, перцу, перце, перцы, перцев, перцами, перечный, перченый, перчёный, острый, чили, халапеньо и т.д.)
      if (
        t.includes('остр') ||
        t.includes('перц') || t.includes('перец') ||
        t.includes('перечн') || t.includes('перчен') ||
        t.includes('перчён') || t.includes('чили') ||
        t.includes('chili') || t.includes('халапень') ||
        t.includes('jalapen') || t.includes('табаско') ||
        t.includes('tabasco') || t.includes('васаби') ||
        t.includes('wasabi') || t.includes('spicy') ||
        t.includes('спайси') || t.includes('огонек') ||
        t.includes('огонёк')
      ) {
        return 'bgother:ostryi.png';
      }

      // 6. Орехи (фисташки, арахис, кешью, миндаль, фундук)
      if (
        t.includes('орех') || t.includes('фисташк') ||
        t.includes('арахис') || t.includes('кешью') ||
        t.includes('миндал') || t.includes('фундук')
      ) {
        return 'bgother:orehi.png';
      }

      // 7. Гренки / сухарики (только гренки и сухарики, без чесноч)
      if (t.includes('грен') || t.includes('сухар')) {
        return 'bgother:grenki.png';
      }

      return '';
    }

    // Шаблон «Снеки 5»
    if (templateKey === 'sneki_5') {
      if (
        t.includes('кревет') || t.includes('миди') ||
        t.includes('гребеш') || t.includes('морепродукт') ||
        t.includes('лангуст') || t.includes('рапан') ||
        t.includes('устриц') || t.includes('рак')
      ) {
        return 'bgother:moreprodukty.png';
      }
      return '';
    }

    // Шаблон «Бутылки» (alaska_dots)
    if (templateKey === 'alaska_dots') {
      if (t.includes('томат')) return 'bgother:tomatnyj.png';
      if (t.includes('вишн') || t.includes('крик') || t.includes('kriek') || t.includes('cherry') || t.includes('руж') || t.includes('rouge')) return 'bgother:vishnevyj.png';
      if (t.includes('мед') || t.includes('медов')) return 'bgother:medovyj.png';
      if (t.includes('яблоч') || t.includes('сидр')) return 'bgother:yablochnyj.png';
      if (t.includes('б/а') || t.includes('безалк')) return 'bgother:ba.jpg';
      if (t.includes('жив')) return 'bgother:zhivoe.jpg';
      return '';
    }

    return null;
  }

  function checkAutoBgForTitle(idx, title) {
    if (!autoBgByTitleEnabled) return;
    if (idx < 0 || idx >= itemsData.length) return;
    const item = itemsData[idx];
    if (!item || item.bgManual) return;

    const templateKey = (activeTemplateRef && activeTemplateRef.kind === 'builtin') ? activeTemplateRef.key : '';
    const autoBg = getAutoBgForTitle(title, templateKey);
    if (autoBg === null) return;

    const currentItemBg = (item.bg && item.bg.bgImage) ? item.bg.bgImage : '';
    if (currentItemBg !== autoBg) {
      applyBackgroundAndAutolink('item', idx, autoBg);
      document.querySelectorAll(`.item-bg-btn[data-index="${idx}"]`).forEach(b => {
        b.classList.toggle('active', !!autoBg);
      });
      if (activePreviewIndex === idx) {
        renderActiveTemplateColorBar();
        try { syncBgControlsToContext(); } catch (e) { }
      }
      updatePreview();
    }
  }

  function checkAutoBgForSingleMode(title) {
    if (!autoBgByTitleEnabled) return;
    const templateKey = (activeTemplateRef && activeTemplateRef.kind === 'builtin') ? activeTemplateRef.key : '';
    const autoBg = getAutoBgForTitle(title, templateKey);
    if (autoBg === null) return;

    const curBg = (templateBg && templateBg.bgImage) ? templateBg.bgImage : '';
    if (curBg !== autoBg) {
      applyBackgroundAndAutolink('template', -1, autoBg);
      renderActiveTemplateColorBar();
      try { syncBgControlsToContext(); } catch (e) { }
      updatePreview();
    }
  }

  function applyAutoBgToAllItems(force = false) {
    if (!autoBgByTitleEnabled && !force) return 0;
    const templateKey = (activeTemplateRef && activeTemplateRef.kind === 'builtin') ? activeTemplateRef.key : '';
    if (templateKey !== 'sneki' && templateKey !== 'alaska_dots') return 0;

    let appliedCount = 0;
    const isMultiMode = document.querySelector('input[name="printMode"]:checked')?.value === 'multi';
    if (isMultiMode) {
      itemsData.forEach((item, idx) => {
        if (item && item.title) {
          if (force) {
            item.bgManual = false;
          } else if (item.bgManual) {
            return;
          }
          const autoBg = getAutoBgForTitle(item.title, templateKey);
          if (autoBg !== null) {
            const currentItemBg = (item.bg && item.bg.bgImage) ? item.bg.bgImage : '';
            const targetBg = autoBg || '';
            if (currentItemBg !== targetBg) {
              applyBackgroundAndAutolink('item', idx, targetBg);
              appliedCount++;
            }
          }
        }
      });
      renderItemsListInputs();
      if (typeof renderDrawerItems === 'function' && itemsDrawer && itemsDrawer.classList.contains('open')) {
        renderDrawerItems();
      }
      renderActiveTemplateColorBar();
      try { syncBgControlsToContext(); } catch (e) { }
      try { syncFontControlsToContext(); } catch (e) { }
      try { syncDecorControlsToContext(); } catch (e) { }
      updatePreview();
      scheduleSessionSave();
    } else {
      if (inputTitle && inputTitle.value) {
        checkAutoBgForSingleMode(inputTitle.value);
        appliedCount = 1;
      }
    }
    refreshAutoBgBtns();
    return appliedCount;
  }

  // Функция отрисовки/обновления наложения красного креста на блок цены
  function applyCrossOverlay(container, isCrossed, color, width) {
    if (!container) return;
    const crossOverlay = container.querySelector('.price-cross-overlay');
    if (crossOverlay) {
      crossOverlay.style.display = isCrossed ? 'block' : 'none';
      if (isCrossed) {
        const c = color || '#e63946';
        const w = parseFloat(width) || 7;
        const l1 = crossOverlay.querySelector('.cross-line-1');
        const l2 = crossOverlay.querySelector('.cross-line-2');
        const s1 = crossOverlay.querySelector('.cross-shadow-1');
        const s2 = crossOverlay.querySelector('.cross-shadow-2');
        if (l1) { l1.setAttribute('stroke', c); l1.setAttribute('stroke-width', w); }
        if (l2) { l2.setAttribute('stroke', c); l2.setAttribute('stroke-width', w); }
        if (s1) { s1.setAttribute('stroke-width', w + 4); }
        if (s2) { s2.setAttribute('stroke-width', w + 4); }
      }
    }
    const inner = container.querySelector('.price-box-inner');
    if (inner) inner.classList.toggle('is-crossed', !!isCrossed);
    container.classList.toggle('is-crossed', !!isCrossed);
  }

  // Подсветка иконки 🎨: активна, если у товара выбран хотя бы один пресет.
  function refreshDecorBtnState(i, btn) {
    const isAct = getItemDecorPresetIds(itemsData[i]).length > 0;
    if (btn) btn.classList.toggle('active', isAct);
    document.querySelectorAll(`.item-decor-btn[data-index="${i}"]`).forEach(b => {
      b.classList.toggle('active', isAct);
    });
  }

  // Подсветка иконки ❌: активна, если цена товара перечёркнута (индивидуально или по шаблону).
  function refreshCrossBtnState(idx, btn) {
    const it = itemsData[idx];
    const tf = templateFonts || {};
    const templateCross = !!tf.priceCross || !!(priceCrossToggle && priceCrossToggle.checked);
    const isCrossed = fontOf(it, 'priceCross', templateCross);
    const isCustom = it && it.priceCross !== undefined;
    const title = isCrossed
      ? `Цена перечёркнута${isCustom ? ' (для этого товара)' : ' (по шаблону)'}. Нажмите, чтобы снять/поставить`
      : 'Перечеркнуть цену красным крестом';

    if (btn) {
      btn.classList.toggle('active', !!isCrossed);
      btn.classList.toggle('customized', isCustom);
      btn.title = title;
    }
    document.querySelectorAll(`.item-cross-btn[data-index="${idx}"]`).forEach(b => {
      b.classList.toggle('active', !!isCrossed);
      b.classList.toggle('customized', isCustom);
      b.title = title;
    });
  }

  function refreshAllCrossBtnStates() {
    document.querySelectorAll('.item-row').forEach(row => {
      const btn = row.querySelector('.item-cross-btn');
      if (btn) {
        const idx = parseInt(btn.getAttribute('data-index'), 10);
        if (!isNaN(idx)) refreshCrossBtnState(idx, btn);
      }
    });
  }

  // Проверяет, активен ли шаблон «Снеки с цифрой» (встроенный или с фоном sneki_digit_bg.jpg).
  function isSnekiDigitActive() {
    const key = (activeTemplateRef && activeTemplateRef.key) || null;
    const bgVal = (bgImageSelect && bgImageSelect.value) || '';
    const itemBg = (itemsData && itemsData[activePreviewIndex] && itemsData[activePreviewIndex].bgImage) || '';
    return key === 'sneki_digit' || bgVal === 'sneki_digit_bg.jpg' || itemBg === 'sneki_digit_bg.jpg';
  }

  const SWATCH_COLORS = {
    '': '#ffffff',
    'bgother:sort_nedeli_yellow.jpg': '#facc15',
    'bgother:korona_a5_orange.jpg': '#ea580c',
    'bgother:korona_a5_blue.jpg': '#0284c7',
    'bgother:korona_a5_red.jpg': '#dc2626',
    'bgother:korona_a5_green.jpg': '#16a34a',
    'bgother:a5_orange.jpg': '#ea580c',
    'bgother:a5_red.jpg': '#dc2626',
    'bgother:a5_blue.jpg': '#0284c7',
    'bgother:a5_green.jpg': '#16a34a',
    'bgother:tomatnyj.png': '#e11d48',
    'bgother:vishnevyj.png': '#be123c',
    'bgother:medovyj.png': '#ca8a04',
    'bgother:yablochnyj.png': '#65a30d',
    'bgother:ba.jpg': '#38bdf8',
    'bgother:zhivoe.jpg': '#eab308',
    'bgother:ryba_vygodno.png': '#facc15',
    'bgother:ostryi.png': '#e11d48',
    'bgother:kalmar.png': '#0ea5e9',
    'bgother:myaso.png': '#b91c1c',
    'bgother:syr.png': '#eab308',
    'bgother:ryb_solomka.png': '#38bdf8',
    'bgother:orehi.png': '#eab308',
    'bgother:grenki.png': '#f59e0b',
    'bgother:moreprodukty.png': '#f97316'
  };

  function updateItemsStatsBadge() {
    const filledCount = itemsData.filter(it => it && it.title && it.title.trim()).length;
    const wCm = parseFloat(wobblerWidthInput ? wobblerWidthInput.value : 6.5) || 6.5;
    const hCm = parseFloat(wobblerHeightInput ? wobblerHeightInput.value : 4.5) || 4.5;
    const effH = effectiveCardHeight(hCm * 10);
    const grid = calcA4Grid(wCm * 10, effH);
    const maxOnSheet = Math.max(1, grid.maxCount);
    let totalCards = 0;
    itemsData.forEach(it => {
      if (isItemFilled(it)) {
        totalCards += Math.max(1, parseInt(it.count, 10) || 1);
      }
    });
    const pages = Math.max(1, Math.ceil(totalCards / maxOnSheet));

    const badge = document.getElementById('itemsStatsBadge');
    if (badge) {
      const orientIcon = grid.isLandscape ? 'альбомная' : 'книжная';
      badge.textContent = `${totalCards} ценн. (${filledCount} тов.) · ${totalCards > 0 ? pages : 0} стр.`;
      const benefitHint = (grid.mode === 'auto' && grid.benefit > 0) ? ` (+${grid.benefit} шт. за счет авто-ориентации)` : '';
      badge.title = `Всего к печати: ${totalCards} ценников (${filledCount} уникальных товаров, ориентация ${orientIcon}, на лист влезает ${grid.maxCount} шт.${benefitHint}, требуется ${totalCards > 0 ? pages : 0} листов А4)`;
    }
  }

  function renderActiveTemplateColorBar() {
    const bar = document.getElementById('activeTemplateColorBar');
    if (!bar) return;
    const key = (activeTemplateRef && activeTemplateRef.key) || '';
    const opts = getItemBgOptions(key);
    if (!opts || opts.length <= 1) {
      bar.style.display = 'none';
      bar.innerHTML = '';
      return;
    }
    bar.style.display = 'flex';
    bar.innerHTML = '<span style="font-size:0.75rem; color:#94a3b8; font-weight:700; margin-right:4px;">Цвет:</span>';

    const it = (isMultiModeNow() && bgApplyMode === 'item') ? itemsData[activePreviewIndex] : null;
    const activeBgSnap = (it && it.bgCustomized && it.bg) ? it.bg : (templateBg || {});
    const currentBg = activeBgSnap.bgImage || (bgImageSelect ? bgImageSelect.value : '') || '';

    const preset = (activeTemplateRef && activeTemplateRef.kind === 'builtin') ? builtInPresets[activeTemplateRef.key] : null;
    const defaultBgImg = (preset && preset.bgImage) ? preset.bgImage : 'none';

    opts.forEach(opt => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'color-swatch-chip';
      const isDefaultOpt = !opt.value || opt.value === 'none';
      const isAct = isDefaultOpt
        ? (currentBg === '' || currentBg === 'none' || currentBg === defaultBgImg)
        : (currentBg === opt.value);
      if (isAct) chip.classList.add('active');

      const dotColor = SWATCH_COLORS[opt.value] || (isDefaultOpt ? (SWATCH_COLORS[defaultBgImg] || '#ffffff') : '#ffffff');
      const cleanLabel = opt.label.replace('Как в шаблоне', 'Основной').replace(/Корона А5|А5|\(Желтый\)|\(Красный\)|\(Бутылки\)|\(Рыба\)/g, '').trim() || opt.label;
      chip.innerHTML = `<span class="color-swatch-dot" style="background:${dotColor};"></span><span>${cleanLabel}</span>`;

      chip.addEventListener('click', (e) => {
        e.stopPropagation();
        const pickedVal = opt.value || '';
        if (isMultiModeNow() && bgApplyMode === 'item') {
          applyBackgroundAndAutolink('item', activePreviewIndex, pickedVal);
        } else {
          if (Array.isArray(itemsData)) {
            itemsData.forEach((it, idx) => {
              applyBackgroundAndAutolink('item', idx, pickedVal);
            });
          }
          if (pickedVal === '' || pickedVal === 'none') {
            applyBackgroundAndAutolink('template', -1, '');
          }
        }

        refitActiveTitle();
        updatePreview();
        renderItemsListInputs();
        if (itemsDrawer && itemsDrawer.classList.contains('open')) renderDrawerItems();
        renderActiveTemplateColorBar();
        try { syncBgControlsToContext(); } catch (err) { }
        try { syncFontControlsToContext(); } catch (err) { }
        try { syncDecorControlsToContext(); } catch (err) { }
      });
      bar.appendChild(chip);
    });
  }

  // Синхронизирует видимость всех элементов ввода и настройки цифры:
  // цифра доступна ТОЛЬКО на шаблоне «Снеки с цифрой».
  function syncDigitControlsVisibility() {
    const isSnekiDigit = isSnekiDigitActive();
    const hasPrice = !(activeTemplateRef && activeTemplateRef.showPrice === false);
    const hasSubtitle = (activeTemplateRef && (activeTemplateRef.key === 'ryba' || activeTemplateRef.key === 'sneki' || activeTemplateRef.key === 'sneki_5' || activeTemplateRef.key === 'alaska_dots'));

    // 1. Вкладка «🔢 Цифра» в Секции 3
    const digitTabBtn = document.querySelector('[data-font-tab="digit"]');
    if (digitTabBtn) digitTabBtn.style.display = isSnekiDigit ? '' : 'none';
    const digitTabPane = document.getElementById('fontTabDigit');
    if (digitTabPane && !isSnekiDigit && digitTabPane.classList.contains('active')) {
      digitTabPane.classList.remove('active');
      const titleTabPane = document.getElementById('fontTabTitle');
      if (titleTabPane) titleTabPane.classList.add('active');
      document.querySelectorAll('[data-font-tab]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.fontTab === 'title');
      });
    }

    // Вкладка «💰 Цена»
    const priceTabBtn = document.querySelector('[data-font-tab="price"]');
    if (priceTabBtn) priceTabBtn.style.display = hasPrice ? '' : 'none';
    const priceTabPane = document.getElementById('fontTabPrice');
    if (priceTabPane && !hasPrice && priceTabPane.classList.contains('active')) {
      priceTabPane.classList.remove('active');
      const titleTabPane = document.getElementById('fontTabTitle');
      if (titleTabPane) titleTabPane.classList.add('active');
      document.querySelectorAll('[data-font-tab]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.fontTab === 'title');
      });
    }

    // Вкладка «⚖️ Вес»
    const subTabBtn = document.querySelector('[data-font-tab="subtitle"]');
    if (subTabBtn) subTabBtn.style.display = hasSubtitle ? '' : 'none';
    const subTabPane = document.getElementById('fontTabSubtitle');
    if (subTabPane && !hasSubtitle && subTabPane.classList.contains('active')) {
      subTabPane.classList.remove('active');
      const titleTabPane = document.getElementById('fontTabTitle');
      if (titleTabPane) titleTabPane.classList.add('active');
      document.querySelectorAll('[data-font-tab]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.fontTab === 'title');
      });
    }

    // 2. Однопользовательское поле в режиме «Одинаковый текст»
    const singleDigitWrap = document.getElementById('singleDigitWrap');
    if (singleDigitWrap) singleDigitWrap.style.display = isSnekiDigit ? '' : 'none';

    // 3. Колонка заголовка «№» в таблице товаров (сайдбар и шторка)
    document.querySelectorAll('.items-table-header .col-digit').forEach(hdr => {
      hdr.style.display = isSnekiDigit ? '' : 'none';
    });

    // 4. Поля ввода «№» в каждой строке таблицы товаров
    document.querySelectorAll('.item-row .item-digit-input').forEach(inp => {
      inp.style.display = isSnekiDigit ? '' : 'none';
    });

    renderActiveTemplateColorBar();
    updateItemsStatsBadge();
  }

  // Опции быстрого меню фона строки товара (иконка 🖼). Порядок = порядок в меню.
  // Для шаблона «Рыба» — только «Рыба Выгодно», для «Акция А5» — 3 цвета, для остальных — стандартный набор.
  function getItemBgOptions(presetKey) {
    const key = presetKey || (activeTemplateRef && activeTemplateRef.key);
    if (key === 'ryba') {
      return [
        { value: '', label: 'Как в шаблоне (Рыба)' },
        { value: 'bgother:ryba_vygodno.png', label: 'Рыба Выгодно' }
      ];
    }
    if (key === 'sort_nedeli') {
      return [
        { value: '', label: 'Как в шаблоне (Красный)' },
        { value: 'bgother:sort_nedeli_yellow.jpg', label: 'Сорт недели (Желтый)' }
      ];
    }
    if (key === 'korona_a5' || key === 'aktsiya_a5') {
      return [
        { value: '', label: 'Как в шаблоне (Желтый)' },
        { value: 'bgother:korona_a5_orange.jpg', label: 'Корона А5 (Оранжевый)' },
        { value: 'bgother:korona_a5_blue.jpg', label: 'Корона А5 (Синий)' },
        { value: 'bgother:korona_a5_red.jpg', label: 'Корона А5 (Красный)' },
        { value: 'bgother:korona_a5_green.jpg', label: 'Корона А5 (Зелёный)' }
      ];
    }
    if (key === 'a5') {
      return [
        { value: '', label: 'Как в шаблоне (Желтый)' },
        { value: 'bgother:a5_orange.jpg', label: 'А5 (Оранжевый)' },
        { value: 'bgother:a5_red.jpg', label: 'А5 (Красный)' },
        { value: 'bgother:a5_blue.jpg', label: 'А5 (Голубой)' },
        { value: 'bgother:a5_green.jpg', label: 'А5 (Зелёный)' }
      ];
    }
    if (key === 'sneki') {
      return [
        { value: '', label: 'Как в шаблоне' },
        { value: 'bgother:ostryi.png', label: 'Остро' },
        { value: 'bgother:kalmar.png', label: 'Кальмары' },
        { value: 'bgother:myaso.png', label: 'Вяленое мясо' },
        { value: 'bgother:syr.png', label: 'Сыр' },
        { value: 'bgother:ryb_solomka.png', label: 'Рыбная соломка' },
        { value: 'bgother:orehi.png', label: 'Орехи' },
        { value: 'bgother:grenki.png', label: 'Гренки' }
      ];
    }
    if (key === 'sneki_5') {
      return [
        { value: '', label: 'Как в шаблоне (Снеки 5)' },
        { value: 'bgother:moreprodukty.png', label: 'Морепродукты' }
      ];
    }
    if (
      key === 'yellow_tag' ||
      key === 'sneki_digit' ||
      key === 'novy_vkus' ||
      key === 'novinka' ||
      key === 'tomat' ||
      key === 'sladko'
    ) {
      return [
        { value: '', label: 'Как в шаблоне' }
      ];
    }
    if (key === 'alaska_dots') {
      return [
        { value: '', label: 'Как в шаблоне (Бутылки)' },
        { value: 'bgother:tomatnyj.png', label: 'Томатный' },
        { value: 'bgother:vishnevyj.png', label: 'Вишневый' },
        { value: 'bgother:medovyj.png', label: 'Медовый' },
        { value: 'bgother:yablochnyj.png', label: 'Яблочный' },
        { value: 'bgother:ba.jpg', label: 'Б/А' },
        { value: 'bgother:zhivoe.jpg', label: 'Живое' }
      ];
    }
    return [
      { value: '', label: 'Как в шаблоне' },
      { value: 'bgother:tomatnyj.png', label: 'Томатный' },
      { value: 'bgother:vishnevyj.png', label: 'Вишневый' },
      { value: 'bgother:medovyj.png', label: 'Медовый' },
      { value: 'bgother:yablochnyj.png', label: 'Яблочный' },
      { value: 'bgother:ba.jpg', label: 'Б/А' },
      { value: 'bgother:zhivoe.jpg', label: 'Живое' }
    ];
  }
  const ITEM_BG_OPTIONS = getItemBgOptions();

  // ===== Всплывающее меню для иконок-кнопок строки товара =====
  // Один переиспользуемый popover (singleton), позиционируется у кнопки
  // (position:fixed — не зависит от скролла .items-table-wrapper).
  // Закрывается кликом по пункту, кликом вне меню или Escape.
  let __itemMenuEl = null;
  function __itemMenuOnDocMouseDown(e) {
    if (__itemMenuEl && !__itemMenuEl.contains(e.target)) closeItemQuickMenu();
  }
  function __itemMenuOnKeyDown(e) {
    if (e.key === 'Escape') closeItemQuickMenu();
  }
  function closeItemQuickMenu() {
    if (!__itemMenuEl) return;
    __itemMenuEl.remove();
    __itemMenuEl = null;
    document.removeEventListener('mousedown', __itemMenuOnDocMouseDown, true);
    document.removeEventListener('keydown', __itemMenuOnKeyDown);
  }
  // Позиционирует меню у кнопки-якоря (fixed, не зависит от скролла контейнера;
  // при нехватке места снизу — открывается вверх).
  function __positionMenu(menu, anchor) {
    const r = anchor.getBoundingClientRect();
    let left = Math.max(8, Math.min(r.left, window.innerWidth - menu.offsetWidth - 12));
    let top = r.bottom + 4;
    if (top + menu.offsetHeight > window.innerHeight - 8) {
      top = Math.max(8, r.top - menu.offsetHeight - 4);
    }
    menu.style.left = left + 'px';
    menu.style.top = top + 'px';
    menu.style.zIndex = '2500';
  }
  function __openItemMenu(menu) {
    __itemMenuEl = menu;
    document.addEventListener('mousedown', __itemMenuOnDocMouseDown, true);
    document.addEventListener('keydown', __itemMenuOnKeyDown);
  }

  // anchor: кнопка; options: [{value,label}]; current: value текущего пункта;
  // onPick(value) вызывается после закрытия меню.
  function showItemQuickMenu(anchor, options, current, onPick) {
    closeItemQuickMenu();
    const menu = document.createElement('div');
    menu.className = 'item-quick-menu';
    options.forEach(o => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = o.label;
      if (o.value === current) b.classList.add('active');
      b.addEventListener('click', (ev) => {
        ev.stopPropagation();
        closeItemQuickMenu();
        onPick(o.value);
      });
      menu.appendChild(b);
    });
    document.body.appendChild(menu);
    __positionMenu(menu, anchor);
    __openItemMenu(menu);
  }

  // Чекбокс-меню оформления (🎨): мультивыбор пресетов с live-применением.
  // Клик по пункту ставит/снимает галку (меню НЕ закрывается), «Как в шаблоне»
  // сбрасывает все галки. Закрытие — клик вне меню или Escape. Выбранный
  // набор применяется через applyDecorPresetsByIdx (merge по порядку выбора).
  function showDecorMultiMenu(anchor, idx) {
    closeItemQuickMenu();
    const menu = document.createElement('div');
    menu.className = 'item-quick-menu item-quick-menu-multi';

    const afterChange = () => {
      activePreviewIndex = idx;
      refreshAllCrossBtnStates();
      updatePreview();
      refreshDecorBtnState(idx, anchor);
      if (typeof refreshItemBadges === 'function') refreshItemBadges(idx);
      try { syncDecorControlsToContext(); } catch (e) { }
      try { syncFontControlsToContext(); } catch (e) { }
    };

    const renderItems = () => {
      menu.innerHTML = '';
      const ids = getItemDecorPresetIds(itemsData[idx]);
      const resetBtn = document.createElement('button');
      resetBtn.type = 'button';
      resetBtn.textContent = 'Как в шаблоне';
      resetBtn.classList.toggle('active', ids.length === 0);
      resetBtn.addEventListener('click', (ev) => {
        ev.stopPropagation();
        resetDecorPresetByIdx(idx);
        afterChange();
        renderItems();
      });
      menu.appendChild(resetBtn);
      DECOR_PRESETS.forEach(p => {
        const b = document.createElement('button');
        b.type = 'button';
        b.textContent = p.label;
        const checked = ids.indexOf(p.id) !== -1;
        if (checked) b.classList.add('active');   // галка — через CSS ::before
        b.addEventListener('click', (ev) => {
          ev.stopPropagation();
          let next = getItemDecorPresetIds(itemsData[idx]);
          const pos = next.indexOf(p.id);
          if (pos >= 0) {
            // Снятие текущей галки
            next.splice(pos, 1);
          } else {
            // Заменяем пресет того же типа блока (inside заменяет inside, dual заменяет dual),
            // но сохраняем пресет другого типа блока (например, inside + dual работают вместе).
            const pKind = p.kind || (p.dual ? 'dual' : 'inside');
            next = next.filter(existingId => {
              const existingPreset = DECOR_PRESETS.find(x => x.id === existingId);
              const exKind = existingPreset ? (existingPreset.kind || (existingPreset.dual ? 'dual' : 'inside')) : '';
              return exKind !== pKind;
            });
            next.push(p.id);
          }
          if (next.length) applyDecorPresetsByIdx(idx, next);
          else resetDecorPresetByIdx(idx);
          afterChange();
          renderItems();
        });
        menu.appendChild(b);

        // Поле ввода цены и значка валюты при выборе пресета «Новая цена»
        if (p.id === 'novaya_tsena' && checked) {
          const inputWrap = document.createElement('div');
          inputWrap.className = 'decor-text-input-wrap';
          inputWrap.style.cssText = 'padding: 6px 8px; background: rgba(255,255,0,0.12); border: 1px solid rgba(255,255,0,0.35); border-radius: 6px; margin: 4px 6px 8px; display: flex; flex-direction: column; gap: 6px;';

          const label = document.createElement('span');
          label.style.cssText = 'font-size: 0.75rem; color: #fef08a; font-weight: 700; display: flex; justify-content: space-between; align-items: center;';
          label.innerHTML = '<span>Новая цена и валюта:</span>';
          inputWrap.appendChild(label);

          const rowInputs = document.createElement('div');
          rowInputs.style.cssText = 'display: flex; gap: 6px; align-items: center;';

          const it = itemsData[idx];
          const rawVal = (it && it.decor && (it.decor.outsideText || it.decor.bottomText)) || 'Указать цену';

          let initVal = (it && it.decor && it.decor.novayaTsenaVal) != null ? it.decor.novayaTsenaVal : '';
          let initCurr = (it && it.decor && it.decor.novayaTsenaCurr) != null ? it.decor.novayaTsenaCurr : '₽';

          if (!initVal) {
            if (rawVal === 'Указать цену') {
              initVal = 'Указать цену';
              initCurr = '₽';
            } else if (rawVal.endsWith(' ₽')) {
              initVal = rawVal.slice(0, -2).trim();
              initCurr = '₽';
            } else {
              initVal = rawVal;
              initCurr = '₽';
            }
          }

          const txtInput = document.createElement('input');
          txtInput.type = 'text';
          txtInput.className = 'decor-text-input-field';
          txtInput.placeholder = 'напр. 250';
          txtInput.value = initVal;
          txtInput.style.cssText = 'flex: 1; min-width: 0; box-sizing: border-box; background: #0f172a; border: 1px solid #eab308; color: #ffffff; border-radius: 4px; padding: 5px 8px; font-size: 0.88rem; font-weight: 700; outline: none;';

          const currInput = document.createElement('input');
          currInput.type = 'text';
          currInput.className = 'decor-curr-input-field';
          currInput.placeholder = '₽';
          currInput.value = initCurr;
          currInput.title = 'Значок валюты';
          currInput.style.cssText = 'width: 44px; box-sizing: border-box; background: #0f172a; border: 1px solid #eab308; color: #ffffff; border-radius: 4px; padding: 5px 6px; font-size: 0.88rem; font-weight: 700; text-align: center; outline: none;';

          const syncDecorPriceText = () => {
            const val = txtInput.value.trim();
            const curr = currInput.value.trim();
            if (it && it.decor) {
              it.decor.novayaTsenaVal = txtInput.value;
              it.decor.novayaTsenaCurr = currInput.value;
              const fullText = (val && curr) ? `${val}${curr}` : (val || curr || 'Указать цену');
              it.decor.outsideText = fullText;
              it.decor.bottomText = fullText;
            }
            afterChange();
          };

          txtInput.addEventListener('click', (e) => e.stopPropagation());
          txtInput.addEventListener('input', syncDecorPriceText);
          txtInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') closeItemQuickMenu();
          });

          currInput.addEventListener('click', (e) => e.stopPropagation());
          currInput.addEventListener('input', syncDecorPriceText);
          currInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') closeItemQuickMenu();
          });

          rowInputs.appendChild(txtInput);
          rowInputs.appendChild(currInput);
          inputWrap.appendChild(rowInputs);
          menu.appendChild(inputWrap);
          setTimeout(() => {
            txtInput.focus();
            txtInput.select();
          }, 60);
        }
      });
    };

    renderItems();
    document.body.appendChild(menu);
    __positionMenu(menu, anchor);
    __openItemMenu(menu);
  }

  // Клавиатурная навигация в таблице товаров: Tab, Shift+Tab, Enter, Shift+Enter, Ctrl+D, Стрелки
  function handleTableNavKeyDown(e, inputEl, colClass, rowIndex) {
    const list = inputEl.closest('.items-list');
    if (!list) return;

    // 1. Ctrl+D (Cmd+D) — быстрое дублирование текущей строки товара ниже
    if ((e.ctrlKey || e.metaKey) && (e.key === 'd' || e.key === 'D')) {
      e.preventDefault();
      if (typeof pushHistoryState === 'function') pushHistoryState('Дублирование товара', true);
      const currentItem = itemsData[rowIndex] || freshItem();
      const clone = JSON.parse(JSON.stringify(currentItem));
      itemsData.splice(rowIndex + 1, 0, clone);
      normalizeItemsArray();
      renderItemsListInputs();
      updatePreview();
      scheduleSessionSave();
      if (typeof showToast === 'function') {
        showToast(`Товар №${rowIndex + 1} продублирован (Ctrl+D)`, 'info', 1600);
      }
      setTimeout(() => {
        const rows = list.querySelectorAll('.item-row');
        if (rows[rowIndex + 1]) {
          const targetInp = rows[rowIndex + 1].querySelector('.' + colClass) || rows[rowIndex + 1].querySelector('.item-title-input');
          if (targetInp) {
            targetInp.focus();
            if (targetInp.select) targetInp.select();
          }
        }
      }, 30);
      return;
    }

    // 2. Shift+Enter — вставить новую чистую строку непосредственно ниже текущей
    if (e.shiftKey && e.key === 'Enter' && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      if (typeof pushHistoryState === 'function') pushHistoryState('Вставка строки', true);
      const newItem = freshItem();
      newItem.labelPos = sharedLabelPosForNewItem();
      itemsData.splice(rowIndex + 1, 0, newItem);
      normalizeItemsArray();
      renderItemsListInputs();
      updatePreview();
      scheduleSessionSave();
      setTimeout(() => {
        const rows = list.querySelectorAll('.item-row');
        if (rows[rowIndex + 1]) {
          const targetInp = rows[rowIndex + 1].querySelector('.' + colClass) || rows[rowIndex + 1].querySelector('.item-title-input');
          if (targetInp) {
            targetInp.focus();
            if (targetInp.select) targetInp.select();
          }
        }
      }, 30);
      return;
    }

    // 3. Поле наименования (item-title-input):
    // - Enter: естественный перенос строки внутри названия
    // - Ctrl+Enter (Cmd+Enter): завершение ввода наименования и переход к названию следующей строки
    if (colClass === 'item-title-input') {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        const rows = list.querySelectorAll('.item-row');
        if (rowIndex + 1 < rows.length) {
          const nextInput = rows[rowIndex + 1].querySelector('.item-title-input');
          if (nextInput) {
            nextInput.focus();
            if (nextInput.select) nextInput.select();
          }
        } else {
          syncRowExtent(rowIndex);
          setTimeout(() => {
            const updatedRows = list.querySelectorAll('.item-row');
            if (updatedRows[rowIndex + 1]) {
              const nextInput = updatedRows[rowIndex + 1].querySelector('.item-title-input');
              if (nextInput) {
                nextInput.focus();
                if (nextInput.select) nextInput.select();
              }
            }
          }, 30);
        }
        return;
      }
      if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey) {
        // Обычный Enter в названии — нативный перенос слова на новую строку.
        setTimeout(() => {
          autoGrowTextarea(inputEl);
          if (typeof refitActiveTitle === 'function') refitActiveTitle();
          syncRowExtent(rowIndex);
        }, 0);
        return;
      }
    }

    // 4. Enter в остальных полях (цена, вес, тираж, номер) — переход к той же колонке на следующей строке
    if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      const rows = list.querySelectorAll('.item-row');
      if (rowIndex + 1 < rows.length) {
        const nextInput = rows[rowIndex + 1].querySelector('.' + colClass);
        if (nextInput) {
          nextInput.focus();
          if (nextInput.select) nextInput.select();
        }
      } else {
        syncRowExtent(rowIndex);
        setTimeout(() => {
          const updatedRows = list.querySelectorAll('.item-row');
          if (updatedRows[rowIndex + 1]) {
            const nextInput = updatedRows[rowIndex + 1].querySelector('.' + colClass);
            if (nextInput) {
              nextInput.focus();
              if (nextInput.select) nextInput.select();
            }
          }
        }, 30);
      }
      return;
    }

    // 5. Shift+Tab на поле наименования — переход к последней ячейке предыдущей строки
    if (e.key === 'Tab' && e.shiftKey && colClass === 'item-title-input') {
      if (rowIndex > 0) {
        const rows = list.querySelectorAll('.item-row');
        const prevRow = rows[rowIndex - 1];
        if (prevRow) {
          e.preventDefault();
          const prevTarget = isSnekiDigitActive()
            ? prevRow.querySelector('.item-digit-input')
            : (prevRow.querySelector('.item-price-input') || prevRow.querySelector('.item-subtitle-input'));
          if (prevTarget) {
            prevTarget.focus();
            if (prevTarget.select) prevTarget.select();
          }
        }
      }
      return;
    }

    // 6. Tab на поле цены (или цифры) переходит сразу к названию следующей строки (пропуская кнопки <s>₽</s>, 🖼, 🎨, 🗑)
    if (e.key === 'Tab' && !e.shiftKey && (colClass === 'item-price-input' || colClass === 'item-digit-input')) {
      if (colClass === 'item-price-input' && isSnekiDigitActive()) {
        return; // пусть нативный Tab перейдёт в поле цифры
      }
      e.preventDefault();
      const rows = list.querySelectorAll('.item-row');
      if (rowIndex + 1 < rows.length) {
        const nextTitle = rows[rowIndex + 1].querySelector('.item-title-input');
        if (nextTitle) {
          nextTitle.focus();
          if (nextTitle.select) nextTitle.select();
        }
      } else {
        syncRowExtent(rowIndex);
        setTimeout(() => {
          const updatedRows = list.querySelectorAll('.item-row');
          if (updatedRows[rowIndex + 1]) {
            const nextTitle = updatedRows[rowIndex + 1].querySelector('.item-title-input');
            if (nextTitle) {
              nextTitle.focus();
              if (nextTitle.select) nextTitle.select();
            }
          }
        }, 20);
      }
      return;
    }

    // 7. Стрелка вниз (в однострочном поле или если курсор в самом конце)
    if (e.key === 'ArrowDown') {
      const val = inputEl.value || '';
      const isSingleLine = !val.includes('\n');
      const isAtEnd = (inputEl.selectionEnd === val.length);
      if (isSingleLine || isAtEnd) {
        const rows = list.querySelectorAll('.item-row');
        if (rowIndex + 1 < rows.length) {
          e.preventDefault();
          const nextInput = rows[rowIndex + 1].querySelector('.' + colClass);
          if (nextInput) {
            nextInput.focus();
            const len = nextInput.value ? nextInput.value.length : 0;
            if (nextInput.setSelectionRange) nextInput.setSelectionRange(len, len);
          }
        }
      }
      return;
    }

    // 8. Стрелка вверх (в однострочном поле или если курсор в самом начале)
    if (e.key === 'ArrowUp') {
      const val = inputEl.value || '';
      const isSingleLine = !val.includes('\n');
      const isAtStart = (inputEl.selectionStart === 0);
      if (isSingleLine || isAtStart) {
        if (rowIndex > 0) {
          const rows = list.querySelectorAll('.item-row');
          if (rows[rowIndex - 1]) {
            e.preventDefault();
            const prevInput = rows[rowIndex - 1].querySelector('.' + colClass);
            if (prevInput) {
              prevInput.focus();
              const len = prevInput.value ? prevInput.value.length : 0;
              if (prevInput.setSelectionRange) prevInput.setSelectionRange(len, len);
            }
          }
        }
      }
      return;
    }
  }

  // Индикаторы кастомизации (Dot Badges) на кнопках строки товара:
  // Кнопка фона 🖼️ — голубая точка (#38bdf8), если bgCustomized
  // Кнопка оформления 🎨 — фиолетовая точка (#c084fc), если decorCustomized
  function refreshItemBadges(idx) {
    const it = itemsData[idx];
    if (!it) return;
    const isBgCust = !!it.bgCustomized;
    const isDecorCust = !!it.decorCustomized;
    document.querySelectorAll(`.item-bg-btn[data-index="${idx}"]`).forEach(btn => {
      btn.classList.toggle('has-dot-badge', isBgCust);
    });
    document.querySelectorAll(`.item-decor-btn[data-index="${idx}"]`).forEach(btn => {
      btn.classList.toggle('has-dot-badge', isDecorCust);
    });
  }

  function refreshAllItemBadges() {
    itemsData.forEach((_, idx) => refreshItemBadges(idx));
  }

  // Создаёт один DOM-элемент строки .item-row для индекса i (со всеми
  // обработчиками фокуса/ввода, авто-ростом textarea и кнопкой ⚙).
  function createItemRow(i) {
    const item = itemsData[i] || freshItem();
    if (itemsData[i] && itemsData[i].subtitle === undefined) itemsData[i].subtitle = '';
    if (itemsData[i] && itemsData[i].subtitleManual === undefined) itemsData[i].subtitleManual = false;
    if (itemsData[i] && itemsData[i].digit === undefined) itemsData[i].digit = '';
    if (itemsData[i] && (itemsData[i].count === undefined || isNaN(itemsData[i].count) || itemsData[i].count < 1)) itemsData[i].count = 1;
    const row = document.createElement('div');
    row.className = 'item-row';
    row.setAttribute('data-index', String(i));
    const isSel = (typeof selectedItemIndices !== 'undefined') && selectedItemIndices.has(i);
    if (isSel) row.classList.add('is-selected');
    const safeTitle = (item.title || '').replace(/"/g, '&quot;');
    const safeSub = (item.subtitle || '').replace(/"/g, '&quot;');
    const safePrice = (item.price || '').replace(/"/g, '&quot;');
    const safeDigit = (item.digit || '').replace(/"/g, '&quot;');
    const countVal = Math.max(1, parseInt(item.count, 10) || 1);
    const isMultiple = countVal > 1;
    const multipleClass = isMultiple ? 'has-multiple' : '';
    const bgBadgeClass = item.bgCustomized ? 'has-dot-badge' : '';
    const decorBadgeClass = item.decorCustomized ? 'has-dot-badge' : '';
    row.innerHTML = `
      <div class="item-move-wrap" title="Порядок товара (перетащите ⠿ для изменения)">
        <span class="item-drag-handle" draggable="true" data-index="${i}" title="Перетащите мышью для изменения порядка товаров (Drag & Drop)">⠿</span>
        <div class="item-move-btns">
          <button type="button" class="item-move-btn item-move-up" data-index="${i}" title="Переместить выше" ${i === 0 ? 'disabled' : ''}>▲</button>
          <button type="button" class="item-move-btn item-move-down" data-index="${i}" title="Переместить ниже" ${i >= itemsData.length - 1 ? 'disabled' : ''}>▼</button>
        </div>
      </div>
      <label class="item-chk-wrap" title="Выбрать строку для пакетных действий"><input type="checkbox" class="item-select-chk" data-index="${i}" ${isSel ? 'checked' : ''}></label>
      <span class="item-num">${i + 1}</span>
      <div class="item-title-wrap">
        <textarea class="item-title-input" rows="1" placeholder="Наименование товара №${i + 1}" data-index="${i}">${safeTitle}</textarea>
        <button type="button" class="item-overflow-warn-btn" data-index="${i}" title="Текст названия выходит за границы ценника! Нажмите для автоподгонки размера шрифта" style="display:none;"><svg class="ico"><use href="#i-alert"/></svg></button>
      </div>
      <textarea class="item-subtitle-input" rows="1" placeholder="Вес" data-index="${i}">${safeSub}</textarea>
      <textarea class="item-price-input" rows="1" placeholder="Цена" data-index="${i}">${safePrice}</textarea>
      <div class="item-qty-wrap" title="Тираж копий на листе А4"><input type="number" class="item-qty-input ${multipleClass}" min="1" max="99" value="${countVal}" data-multiple="${isMultiple}" data-index="${i}" title="Тираж копий на листе А4 (колесико мыши: +/-)"></div>
      <input type="text" class="item-digit-input" maxlength="3" placeholder="№" data-index="${i}" title="Большая цифра (слой «Цифра»)" value="${safeDigit}" style="${isSnekiDigitActive() ? '' : 'display:none;'}">
      <button type="button" class="item-cross-btn" data-index="${i}" title="Перечеркнуть цену (акция/скидка)"><s>₽</s></button>
      <button type="button" class="item-bg-btn ${bgBadgeClass}" data-index="${i}" title="Фон этого ценника"><svg class="ico"><use href="#i-image"/></svg></button>
      <button type="button" class="item-decor-btn ${decorBadgeClass}" data-index="${i}" title="Оформление этого ценника"><svg class="ico"><use href="#i-palette"/></svg></button>
      <button type="button" class="item-delete-btn" data-index="${i}" title="Удалить товар №${i + 1}"><svg class="ico"><use href="#i-trash"/></svg></button>
    `;

    const selChk = row.querySelector('.item-select-chk');
    if (selChk) {
      selChk.addEventListener('change', (e) => {
        const idx = parseInt(e.target.getAttribute('data-index'), 10);
        if (typeof onRowSelectChange === 'function') onRowSelectChange(idx, e.target.checked);
      });
    }

    const qtyInput = row.querySelector('.item-qty-input');
    if (qtyInput) {
      qtyInput.addEventListener('focus', () => {
        if (typeof pushHistoryState === 'function') pushHistoryState('Изменение тиража');
        try { qtyInput.select(); } catch (_) { }
      });
      qtyInput.addEventListener('keydown', (e) => handleTableNavKeyDown(e, qtyInput, 'item-qty-input', i));
      qtyInput.addEventListener('input', (e) => {
        const idx = parseInt(e.target.getAttribute('data-index'), 10);
        const raw = e.target.value;
        const val = raw === '' ? 1 : Math.max(1, Math.min(99, parseInt(raw, 10) || 1));
        itemsData[idx].count = val;
        document.querySelectorAll(`.item-qty-input[data-index="${idx}"]`).forEach(inp => {
          if (inp !== e.target && inp.value !== String(val)) inp.value = String(val);
          inp.setAttribute('data-multiple', val > 1 ? 'true' : 'false');
          if (val > 1) inp.classList.add('has-multiple');
          else inp.classList.remove('has-multiple');
        });
        updatePreview();
        scheduleSessionSave();
      });
      qtyInput.addEventListener('wheel', (e) => {
        e.preventDefault();
        const idx = parseInt(qtyInput.getAttribute('data-index'), 10);
        const cur = Math.max(1, parseInt(qtyInput.value, 10) || 1);
        const next = e.deltaY < 0 ? Math.min(99, cur + 1) : Math.max(1, cur - 1);
        qtyInput.value = String(next);
        qtyInput.dispatchEvent(new Event('input', { bubbles: true }));
      }, { passive: false });
    }

    const titleInput = row.querySelector('.item-title-input');
    titleInput.addEventListener('focus', () => {
      if (typeof captureStateBeforeInput === 'function') captureStateBeforeInput('Ввод наименования');
      activePreviewIndex = i;
      syncFontControlsToContext();
      syncDecorControlsToContext();
      syncBgControlsToContext();
      refitActiveTitle();
    });
    titleInput.addEventListener('keydown', (e) => handleTableNavKeyDown(e, titleInput, 'item-title-input', i));

    titleInput.addEventListener('input', (e) => {
      if (typeof commitStateBeforeInput === 'function') commitStateBeforeInput();
      const idx = parseInt(e.target.getAttribute('data-index'), 10);
      itemsData[idx].title = e.target.value;
      if (typeof pushHistoryState === 'function') pushHistoryState('Ввод наименования');
      const autoSub = builtinPresetFlag('autoSubtitle', '');
      if (autoSub && !itemsData[idx].subtitleManual) {
        itemsData[idx].subtitle = e.target.value.trim() ? autoSub : '';
        document.querySelectorAll(`.item-subtitle-input[data-index="${idx}"]`).forEach(si => {
          if (si.value !== itemsData[idx].subtitle) si.value = itemsData[idx].subtitle;
        });
      }
      activePreviewIndex = idx;
      checkAutoBgForTitle(idx, e.target.value);
      // Синхронизируем инпут в параллельном списке (если открыта шторка или сайдбар)
      document.querySelectorAll(`.item-title-input[data-index="${idx}"]`).forEach(inp => {
        if (inp !== e.target && inp.value !== e.target.value) {
          inp.value = e.target.value;
          autoGrowTextarea(inp);
        }
      });
      autoGrowTextarea(titleInput);
      // Подгон кегля под перенос названия по словам — сразу при вводе.
      refitActiveTitle();
      // Прогрессивный рост/схлопывание строк по факту ввода.
      syncRowExtent(idx);
      if (typeof checkAllRowsTextOverflow === 'function') checkAllRowsTextOverflow();
      updatePreview();
    });

    const subInput = row.querySelector('.item-subtitle-input');
    if (subInput) {
      subInput.addEventListener('focus', () => {
        if (typeof captureStateBeforeInput === 'function') captureStateBeforeInput('Ввод веса');
        activePreviewIndex = i;
        syncFontControlsToContext();
        syncDecorControlsToContext();
        syncBgControlsToContext();
        refitActiveTitle();
      });
      subInput.addEventListener('keydown', (e) => handleTableNavKeyDown(e, subInput, 'item-subtitle-input', i));
      subInput.addEventListener('input', (e) => {
        if (typeof commitStateBeforeInput === 'function') commitStateBeforeInput();
        const idx = parseInt(e.target.getAttribute('data-index'), 10);
        itemsData[idx].subtitle = e.target.value;
        itemsData[idx].subtitleManual = true;
        if (typeof pushHistoryState === 'function') pushHistoryState('Ввод веса');
        activePreviewIndex = idx;
        document.querySelectorAll(`.item-subtitle-input[data-index="${idx}"]`).forEach(inp => {
          if (inp !== e.target && inp.value !== e.target.value) inp.value = e.target.value;
        });
        syncRowExtent(idx);
        updatePreview();
      });
    }

    const priceInput = row.querySelector('.item-price-input');
    priceInput.addEventListener('focus', () => {
      if (typeof captureStateBeforeInput === 'function') captureStateBeforeInput('Ввод цены');
      activePreviewIndex = i;
      syncFontControlsToContext();
      syncDecorControlsToContext();
      syncBgControlsToContext();
      refitActiveTitle();
    });
    priceInput.addEventListener('keydown', (e) => handleTableNavKeyDown(e, priceInput, 'item-price-input', i));

    priceInput.addEventListener('input', (e) => {
      if (typeof commitStateBeforeInput === 'function') commitStateBeforeInput();
      const idx = parseInt(e.target.getAttribute('data-index'), 10);
      itemsData[idx].price = e.target.value;
      if (typeof pushHistoryState === 'function') pushHistoryState('Ввод цены');
      activePreviewIndex = idx;
      document.querySelectorAll(`.item-price-input[data-index="${idx}"]`).forEach(inp => {
        if (inp !== e.target && inp.value !== e.target.value) inp.value = e.target.value;
      });
      syncRowExtent(idx);
      updatePreview();
    });

    priceInput.addEventListener('blur', (e) => {
      const idx = parseInt(e.target.getAttribute('data-index'), 10);
      const cleaned = cleanPriceInput(e.target.value);
      if (cleaned !== e.target.value) {
        e.target.value = cleaned;
        itemsData[idx].price = cleaned;
        document.querySelectorAll(`.item-price-input[data-index="${idx}"]`).forEach(inp => {
          if (inp !== e.target && inp.value !== cleaned) inp.value = cleaned;
        });
        updatePreview();
        scheduleSessionSave();
      }
    });

    // Большая цифра товара (слой «Цифра»)
    const digitInput = row.querySelector('.item-digit-input');
    if (digitInput) {
      digitInput.addEventListener('focus', () => {
        if (typeof captureStateBeforeInput === 'function') captureStateBeforeInput('Ввод номера');
        activePreviewIndex = i;
        syncFontControlsToContext();
        syncDecorControlsToContext();
        syncBgControlsToContext();
        updatePreview();
      });
      digitInput.addEventListener('keydown', (e) => handleTableNavKeyDown(e, digitInput, 'item-digit-input', i));
      digitInput.addEventListener('input', (e) => {
        if (typeof commitStateBeforeInput === 'function') commitStateBeforeInput();
        const idx = parseInt(e.target.getAttribute('data-index'), 10);
        if (itemsData[idx]) itemsData[idx].digit = e.target.value;
        activePreviewIndex = idx;
        document.querySelectorAll(`.item-digit-input[data-index="${idx}"]`).forEach(inp => {
          if (inp !== e.target && inp.value !== e.target.value) inp.value = e.target.value;
        });
        const panelField = document.getElementById('digitText');
        if (panelField && panelField.value !== e.target.value) panelField.value = e.target.value;
        updatePreview();
      });
    }

    // Кнопка 🗑 удаляет строку товара целиком
    const deleteBtn = row.querySelector('.item-delete-btn');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => {
        const idx = parseInt(deleteBtn.getAttribute('data-index'), 10);
        if (isNaN(idx) || idx < 0 || idx >= itemsData.length) return;
        if (itemsData.length <= 1) {
          if (typeof pushHistoryState === 'function') pushHistoryState('Очистка товара', true);
          itemsData[0] = freshItem();
          renderItemsListInputs();
          updatePreview();
          if (typeof showToast === 'function') showToast('Строка товара очищена', 'info', 1500);
          return;
        }
        if (typeof pushHistoryState === 'function') pushHistoryState('Удаление товара', true);
        itemsData.splice(idx, 1);
        if (idx < activePreviewIndex) activePreviewIndex--;
        if (activePreviewIndex >= itemsData.length) activePreviewIndex = Math.max(0, itemsData.length - 1);
        renderItemsListInputs();
        syncFontControlsToContext();
        syncDecorControlsToContext();
        syncBgControlsToContext();
        updatePreview();
        if (typeof showToast === 'function') showToast(`Товар №${idx + 1} удален`, 'info', 1500);
      });
    }

    // Иконка-кнопка 🖼 — быстрый выбор фона конкретного ценника. Клик открывает
    // всплывающее меню (getItemBgOptions()); значение "" — «Как в шаблоне»
    // (наследуется), иначе маркер bgother:<имя файла>, data:URL для которого
    // берётся из extraBgMap внутри applyBackgroundTo.
    const bgBtn = row.querySelector('.item-bg-btn');
    if (bgBtn) {
      const currentBg = () => {
        const cur = (itemsData[i].bgCustomized && itemsData[i].bg) ? itemsData[i].bg.bgImage : '';
        const opts = getItemBgOptions();
        return (cur && opts.some(o => o.value === cur)) ? cur : '';
      };
      const refreshBgBtn = () => bgBtn.classList.toggle('active', !!currentBg());
      refreshBgBtn();
      bgBtn.addEventListener('click', () => {
        const opts = getItemBgOptions();
        showItemQuickMenu(bgBtn, opts, currentBg(), (val) => {
          const idx = parseInt(bgBtn.getAttribute('data-index'), 10);
          if (isNaN(idx) || idx < 0 || idx >= itemsData.length) return;
          if (itemsData[idx]) itemsData[idx].bgManual = !!val;
          applyBackgroundAndAutolink('item', idx, val);
          activePreviewIndex = idx;
          refitActiveTitle();
          updatePreview();
          refreshBgBtn();
          document.querySelectorAll(`.item-bg-btn[data-index="${idx}"]`).forEach(b => {
            b.classList.toggle('active', !!currentBg());
          });
          refreshDecorBtnState(idx, row.querySelector('.item-decor-btn'));
          if (typeof refreshItemBadges === 'function') refreshItemBadges(idx);
          renderActiveTemplateColorBar();
          // Держим главные контролы фона, шрифтов и оформления в синхроне.
          try { syncBgControlsToContext(); } catch (e) { }
          try { syncFontControlsToContext(); } catch (e) { }
          try { syncDecorControlsToContext(); } catch (e) { }
        });
      });
    }

    // Иконка-кнопка ❌ — быстрый переключатель красного креста на цене.
    const crossBtn = row.querySelector('.item-cross-btn');
    if (crossBtn) {
      refreshCrossBtnState(i, crossBtn);
      crossBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(crossBtn.getAttribute('data-index'), 10);
        if (isNaN(idx) || idx < 0 || idx >= itemsData.length) return;
        activePreviewIndex = idx;
        if (!itemsData[idx]) itemsData[idx] = freshItem();
        const tf = templateFonts || {};
        const templateCross = !!tf.priceCross || !!(priceCrossToggle && priceCrossToggle.checked);
        const current = fontOf(itemsData[idx], 'priceCross', templateCross);
        itemsData[idx].priceCross = !current;
        refreshCrossBtnState(idx, crossBtn);
        if (fontApplyMode === 'item' && priceCrossToggle) {
          priceCrossToggle.checked = !!itemsData[idx].priceCross;
        }
        updatePreview();
      });
    }

    // Иконка-кнопка 🎨 — быстрый выбор оформления ценника. Клик открывает
    // чекбокс-меню (мультивыбор пресетов с live-применением): можно сочетать
    // пресеты разных блоков (напр., «Остро» внутри + «Живое» сверху).
    const decorBtn = row.querySelector('.item-decor-btn');
    if (decorBtn) {
      const refreshDecorBtn = () => refreshDecorBtnState(i, decorBtn);
      refreshDecorBtn();
      decorBtn.addEventListener('click', () => {
        const idx = parseInt(decorBtn.getAttribute('data-index'), 10);
        if (isNaN(idx) || idx < 0 || idx >= itemsData.length) return;
        showDecorMultiMenu(decorBtn, idx);
      });
    }

    // Drag & Drop перемещение строк таблицы
    const dragHandle = row.querySelector('.item-drag-handle');
    if (dragHandle) {
      dragHandle.addEventListener('dragstart', (e) => {
        draggedRowIndex = i;
        e.dataTransfer.effectAllowed = 'move';
        try {
          e.dataTransfer.setData('text/plain', String(i));
          if (e.dataTransfer.setDragImage) {
            e.dataTransfer.setDragImage(row, 20, Math.min(row.offsetHeight / 2, 18));
          }
        } catch (_) { }
        setTimeout(() => {
          row.classList.add('is-dragging');
        }, 0);
      });

      dragHandle.addEventListener('dragend', () => {
        document.querySelectorAll('.item-row').forEach(r => {
          r.classList.remove('is-dragging', 'drop-target-before', 'drop-target-after');
        });
        draggedRowIndex = null;
      });
    }

    row.addEventListener('dragover', (e) => {
      if (draggedRowIndex === null) return;
      e.preventDefault();
      try { e.dataTransfer.dropEffect = 'move'; } catch (_) { }
      const rect = row.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      if (e.clientY < midY) {
        row.classList.add('drop-target-before');
        row.classList.remove('drop-target-after');
      } else {
        row.classList.add('drop-target-after');
        row.classList.remove('drop-target-before');
      }
    });

    row.addEventListener('dragleave', (e) => {
      if (!row.contains(e.relatedTarget)) {
        row.classList.remove('drop-target-before', 'drop-target-after');
      }
    });

    row.addEventListener('drop', (e) => {
      e.preventDefault();
      row.classList.remove('drop-target-before', 'drop-target-after');
      if (draggedRowIndex === null) return;
      const fromIdx = draggedRowIndex;
      draggedRowIndex = null;
      const rect = row.getBoundingClientRect();
      const insertBefore = e.clientY < (rect.top + rect.height / 2);
      const targetIdx = parseInt(row.getAttribute('data-index') || i, 10);
      reorderItemRows(fromIdx, targetIdx, insertBefore);
    });

    // Кнопки перемещения строки ▲ / ▼
    const moveUpBtn = row.querySelector('.item-move-up');
    const moveDownBtn = row.querySelector('.item-move-down');
    if (moveUpBtn) {
      moveUpBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(moveUpBtn.getAttribute('data-index'), 10);
        moveItemRow(idx, -1);
      });
    }
    if (moveDownBtn) {
      moveDownBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(moveDownBtn.getAttribute('data-index'), 10);
        moveItemRow(idx, 1);
      });
    }

    // Инлайн-кнопка автоподгонки переполненного текста
    const rowWarnBtn = row.querySelector('.item-overflow-warn-btn');
    if (rowWarnBtn) {
      rowWarnBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(rowWarnBtn.getAttribute('data-index'), 10);
        if (isNaN(idx) || !itemsData[idx]) return;
        activePreviewIndex = idx;
        delete itemsData[idx].titleSizeManual;
        refitActiveTitle(true);
        updatePreview();
        rowWarnBtn.style.display = 'none';
        if (typeof showToast === 'function') {
          showToast(`Шрифт товара №${idx + 1} подогнан под ценник`, 'success', 2000);
        }
      });
    }

    // Авто-рост полей таблицы под содержимое (перенос строки удлиняет поле).
    row.querySelectorAll('textarea').forEach(el => {
      autoGrowTextarea(el);
      el.addEventListener('input', () => autoGrowTextarea(el));
    });

    return row;
  }

  // Пересчет индексов выбранных чекбоксов при перемещении строки
  function remapSelectedIndicesAfterMove(fromIdx, destIdx) {
    if (typeof selectedItemIndices === 'undefined' || !selectedItemIndices || selectedItemIndices.size === 0) return;
    const newSet = new Set();
    selectedItemIndices.forEach(idx => {
      if (idx === fromIdx) {
        newSet.add(destIdx);
      } else if (fromIdx < destIdx && idx > fromIdx && idx <= destIdx) {
        newSet.add(idx - 1);
      } else if (fromIdx > destIdx && idx >= destIdx && idx < fromIdx) {
        newSet.add(idx + 1);
      } else {
        newSet.add(idx);
      }
    });
    selectedItemIndices.clear();
    newSet.forEach(idx => selectedItemIndices.add(idx));
    if (typeof updateBulkActionsBar === 'function') updateBulkActionsBar();
  }

  // Ручное перемещение строки вверх (-1) или вниз (+1)
  function moveItemRow(fromIdx, delta) {
    const toIdx = fromIdx + delta;
    if (toIdx < 0 || toIdx >= itemsData.length) return;
    if (typeof pushHistoryState === 'function') pushHistoryState('Перемещение товара', true);
    const temp = itemsData[fromIdx];
    itemsData[fromIdx] = itemsData[toIdx];
    itemsData[toIdx] = temp;
    if (activePreviewIndex === fromIdx) activePreviewIndex = toIdx;
    else if (activePreviewIndex === toIdx) activePreviewIndex = fromIdx;
    remapSelectedIndicesAfterMove(fromIdx, toIdx);
    renderItemsListInputs();
    updatePreview();
    scheduleSessionSave();
    if (typeof showToast === 'function') showToast(`Товар перемещен на позицию №${toIdx + 1}`, 'info', 1500);
  }

  // Drag & Drop переупорядочивание строк таблицы
  function reorderItemRows(fromIdx, targetIdx, insertBefore) {
    if (fromIdx === targetIdx) return;
    if (fromIdx < 0 || fromIdx >= itemsData.length) return;
    if (targetIdx < 0 || targetIdx >= itemsData.length) return;

    let destIdx;
    if (insertBefore) {
      destIdx = (fromIdx < targetIdx) ? (targetIdx - 1) : targetIdx;
    } else {
      destIdx = (fromIdx < targetIdx) ? targetIdx : (targetIdx + 1);
    }
    destIdx = Math.max(0, Math.min(itemsData.length - 1, destIdx));
    if (destIdx === fromIdx) return;

    if (typeof pushHistoryState === 'function') pushHistoryState('Перемещение товара (D&D)', true);
    const [movedItem] = itemsData.splice(fromIdx, 1);
    itemsData.splice(destIdx, 0, movedItem);

    if (activePreviewIndex === fromIdx) {
      activePreviewIndex = destIdx;
    } else if (fromIdx < activePreviewIndex && destIdx >= activePreviewIndex) {
      activePreviewIndex--;
    } else if (fromIdx > activePreviewIndex && destIdx <= activePreviewIndex) {
      activePreviewIndex++;
    }

    remapSelectedIndicesAfterMove(fromIdx, destIdx);
    renderItemsListInputs();
    updatePreview();
    scheduleSessionSave();
    if (typeof showToast === 'function') {
      showToast(`Товар перемещен на позицию №${destIdx + 1}`, 'info', 1500);
    }
  }

  // Сохранение исходного порядка товаров перед сортировкой для функции «Вернуть как было»
  let initialItemsOrderBeforeSort = null;

  function resetSortHistory() {
    initialItemsOrderBeforeSort = null;
    if (typeof updateSortMenuButtonsState === 'function') updateSortMenuButtonsState();
  }

  // Умная сортировка списка товаров по критерию
  function sortItems(criterion) {
    if (!itemsData || itemsData.length === 0) return;

    const mode = String(criterion || '').replace(/-/g, '_');

    // Возврат к исходному порядку до сортировки («Вернуть как было»)
    if (mode === 'restore_original' || mode === 'restore_order') {
      if (!initialItemsOrderBeforeSort) {
        if (typeof showToast === 'function') showToast('Порядок товаров ещё не менялся', 'info', 1800);
        return;
      }
      if (typeof pushHistoryState === 'function') pushHistoryState('Возврат исходного порядка', true);
      const originalItems = initialItemsOrderBeforeSort;
      initialItemsOrderBeforeSort = null;
      itemsData.length = 0;
      originalItems.forEach(it => itemsData.push(JSON.parse(JSON.stringify(it))));
      normalizeItemsArray();
      activePreviewIndex = 0;
      renderItemsListInputs();
      updatePreview();
      scheduleSessionSave();
      if (typeof updateSortMenuButtonsState === 'function') updateSortMenuButtonsState();
      if (typeof showToast === 'function') showToast('Исходный порядок товаров восстановлен', 'success', 2000);
      return;
    }

    if (itemsData.length <= 1) return;

    // Сохраняем снимок перед сортировкой (в историю приложения для Ctrl+Z и в исходный порядок для кнопки «Вернуть как было»)
    if (typeof pushHistoryState === 'function') pushHistoryState('Сортировка товаров', true);

    if (!initialItemsOrderBeforeSort) {
      initialItemsOrderBeforeSort = itemsData.map(it => JSON.parse(JSON.stringify(it)));
    }

    const filled = itemsData.filter(it => isItemFilled(it));
    const empties = itemsData.filter(it => !isItemFilled(it));

    function parseNumericPrice(val) {
      if (!val) return NaN;
      const str = String(val).replace(/\s/g, '').replace(',', '.');
      const m = str.match(/\d+(\.\d+)?/);
      return m ? parseFloat(m[0]) : NaN;
    }

    if (mode === 'name_asc') {
      filled.sort((a, b) => (a.title || '').localeCompare(b.title || '', 'ru', { numeric: true, sensitivity: 'base' }));
    } else if (mode === 'name_desc') {
      filled.sort((a, b) => (b.title || '').localeCompare(a.title || '', 'ru', { numeric: true, sensitivity: 'base' }));
    } else if (mode === 'price_asc') {
      filled.sort((a, b) => {
        const pa = parseNumericPrice(a.price);
        const pb = parseNumericPrice(b.price);
        if (isNaN(pa) && isNaN(pb)) return 0;
        if (isNaN(pa)) return 1;
        if (isNaN(pb)) return -1;
        return pa - pb;
      });
    } else if (mode === 'price_desc') {
      filled.sort((a, b) => {
        const pa = parseNumericPrice(a.price);
        const pb = parseNumericPrice(b.price);
        if (isNaN(pa) && isNaN(pb)) return 0;
        if (isNaN(pa)) return 1;
        if (isNaN(pb)) return -1;
        return pb - pa;
      });
    } else if (mode === 'filled_first') {
      // filled и empties уже разделены
    }

    itemsData.length = 0;
    filled.forEach(it => itemsData.push(it));
    empties.forEach(it => itemsData.push(it));
    normalizeItemsArray();
    activePreviewIndex = 0;
    renderItemsListInputs();
    updatePreview();
    scheduleSessionSave();
    if (typeof updateSortMenuButtonsState === 'function') updateSortMenuButtonsState();

    const criterionLabels = {
      name_asc: 'по названию (А → Я)',
      name_desc: 'по названию (Я → А)',
      price_asc: 'по возрастанию цены',
      price_desc: 'по убыванию цены',
      filled_first: 'заполненные в начале'
    };
    const sortLabel = criterionLabels[mode] || '';
    if (typeof showToast === 'function') {
      showToast(sortLabel ? `Товары отсортированы ${sortLabel}` : 'Список товаров отсортирован', 'success', 2000);
    }
  }

  // Render Multi-Item Rows (прогрессивно: заполненные + 1 рабочая пустая).
  function renderItemsListInputs() {
    normalizeItemsArray();
    itemsListContainer.innerHTML = '';
    const fragSidebar = document.createDocumentFragment();
    for (let i = 0; i < itemsData.length; i++) {
      fragSidebar.appendChild(createItemRow(i));
    }
    itemsListContainer.appendChild(fragSidebar);

    if (idrItemsList) {
      idrItemsList.innerHTML = '';
      const fragDrawer = document.createDocumentFragment();
      for (let i = 0; i < itemsData.length; i++) {
        fragDrawer.appendChild(createItemRow(i));
      }
      idrItemsList.appendChild(fragDrawer);
    }
    // Авто-подгон высоты текстовых полей после добавления в DOM (чтобы 2-я строка наименования не обрезалась)
    itemsListContainer.querySelectorAll('textarea').forEach(autoGrowTextarea);
    if (idrItemsList) idrItemsList.querySelectorAll('textarea').forEach(autoGrowTextarea);
    updateItemsEmptyHint();
    syncDigitControlsVisibility();
    if (typeof updateItemsDrawerHeader === 'function') updateItemsDrawerHeader();
    if (typeof applyGoodsFilter === 'function') applyGoodsFilter();
    if (typeof refreshAllItemBadges === 'function') refreshAllItemBadges();
    if (typeof multiPrintDrawer !== 'undefined' && multiPrintDrawer && multiPrintDrawer.classList.contains('open')) {
      renderMultiPrintTemplates();
      updateMultiPrintSummary();
    }
  }

  // ==========================================================================
  // --- Модуль разбора и вставки товаров (Касса, 1C, Excel) ---
  // ==========================================================================

  // Список кассовых категорий и правила их обработки
  const POS_CONFIG = [
    {
      prefix: 'рыба весовая',
      stripLastPriceDigit: true,
      defaultSubtitle: '100гр'
    },
    {
      prefix: 'снеки весовые',
      stripLastPriceDigit: true,
      defaultSubtitle: '100гр'
    },
    {
      prefix: 'пиво бутылочное',
      stripLastPriceDigit: false,
      defaultSubtitle: ''
    }
  ];

  // Список исключаемых префиксов в названиях товаров (для обратной совместимости)
  const POS_IGNORED_PREFIXES = POS_CONFIG.map(c => c.prefix);

  // Определение конфигурации кассовой категории по началу строки
  function detectPosConfig(raw) {
    if (!raw) return null;
    const str = String(raw).trim();
    for (const cfg of POS_CONFIG) {
      const escaped = cfg.prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
      const re = new RegExp('^' + escaped + '[:\\-–—\\s]*', 'i');
      if (re.test(str)) return cfg;
    }
    return null;
  }

  // Удаление кассовых префиксов из наименования (с сохранением объема/тары в названии)
  function stripPosTitlePrefix(rawTitle) {
    let title = (rawTitle || '').trim();
    for (const cfg of POS_CONFIG) {
      const escaped = cfg.prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
      const re = new RegExp('^' + escaped + '[:\\-–—\\s]*', 'i');
      if (re.test(title)) {
        title = title.replace(re, '').trim();
      }
    }
    return title;
  }

  // Разбор отдельной строки кассовой выгрузки или Excel
  function parsePastedProductLine(line) {
    if (!line || !line.trim()) return null;
    const raw = line.trim();

    // Разделение по табуляции (или 2+ пробелам при копировании из некоторых кассовых программ)
    let parts = raw.split('\t').map(p => p.trim());
    if (parts.length === 1 && /\s{2,}/.test(raw)) {
      parts = raw.split(/\s{2,}/).map(p => p.trim());
    }

    const posCfg = detectPosConfig(parts[0]);
    let title = '';
    let price = '';
    let subtitle = '';

    if (parts.length === 1) {
      // 1 колонка: пробуем найти цену в конце строки (например "Konix 0,45 ст 175")
      const match = raw.match(/^(.*?)\s+([\d\s₽,.]+)\s*$/);
      if (match) {
        title = stripPosTitlePrefix(match[1]);
        price = cleanPriceInput(match[2]);
      } else {
        title = stripPosTitlePrefix(raw);
        price = '';
      }
    } else if (parts.length === 2) {
      // 2 колонки: [Наименование] \t [Цена]
      title = stripPosTitlePrefix(parts[0]);
      price = cleanPriceInput(parts[1]);
    } else if (parts.length >= 4) {
      // Кассовый чек / отчет (4+ колонок: Наименование \t Цена \t Кол-во \t Сумма \t Скидка \t Итог)
      // - Цена — это 1-я цифра/колонка после наименования (parts[1])
      // - Остальные колонки кассы (кол-во, сумма, скидка) отбрасываются
      // - Объем и тара остаются в названии
      title = stripPosTitlePrefix(parts[0]);
      price = cleanPriceInput(parts[1]);
    } else if (parts.length === 3) {
      // 3 колонки: либо стандартный Excel [Название, Вес, Цена], либо касса [Название, Цена, Кол-во]
      const p1IsNum = /^[\d\s.,]+$/.test(parts[1]);
      const p2IsQty = /^\d+(\.0+)?$/.test(parts[2]) && Number(parts[2]) <= 100;

      if (posCfg || (p1IsNum && p2IsQty)) {
        title = stripPosTitlePrefix(parts[0]);
        price = cleanPriceInput(parts[1]);
      } else {
        // Стандартный Excel: [Название, Вес, Цена]
        title = stripPosTitlePrefix(parts[0]);
        subtitle = parts[1];
        price = cleanPriceInput(parts[2]);
      }
    }

    // Если товар весовой (рыба весовая, снеки весовые):
    // на кассе цена указана за 1 кг, на ценнике нужна за 100 г — убираем последний символ (делим на 10)
    if (posCfg && posCfg.stripLastPriceDigit && price) {
      const p = splitPriceAndCurrency(price);
      if (p.price.length > 1 && /\d$/.test(p.price)) {
        p.price = p.price.slice(0, -1);
        price = p.currency ? `${p.price} ${p.currency}` : p.price;
      } else if (price.length > 1 && /\d$/.test(price)) {
        price = price.slice(0, -1);
      }
      if (!subtitle && posCfg.defaultSubtitle) {
        subtitle = posCfg.defaultSubtitle;
      }
    }

    if (title) {
      // Первая буква названия заглавная (например «сыр ФРАЙЧИЗЫ» -> «Сыр ФРАЙЧИЗЫ»)
      title = title.charAt(0).toUpperCase() + title.slice(1);
    }

    if (!title && !price && !subtitle) return null;

    return {
      title: title || '',
      subtitle: subtitle || '',
      price: price || '',
      digit: '',
      count: 1,
      subtitleManual: !!subtitle
    };
  }

  // Единая функция применения вставки списка товаров
  function applyPastedProducts(text, sourceDesc = 'Вставка товаров') {
    const rawText = (text || '').trim();
    if (!rawText) return 0;

    if (typeof pushHistoryState === 'function') pushHistoryState(sourceDesc, true);

    // 1. Сохраняем эталонные координаты расположения надписей шаблона:
    // Сначала из первого товара или активного, затем из пресета, чтобы расположение шрифтов не сбивалось
    const preset = (activeTemplateRef && activeTemplateRef.kind === 'builtin') ? builtInPresets[activeTemplateRef.key] : null;
    const presetLp = (preset && preset.labelPos) || labelPos;

    function isPosEmpty(lp) {
      if (!lp) return true;
      const t = lp.title || {};
      const s = lp.subtitle || {};
      const p = lp.price || {};
      return (!t.x && !t.y && !s.x && !s.y && !p.x && !p.y);
    }

    let baseLabelPos = null;
    if (itemsData[0] && itemsData[0].labelPos && !isPosEmpty(itemsData[0].labelPos)) {
      baseLabelPos = cloneLabelPos(itemsData[0].labelPos);
    } else if (itemsData[activePreviewIndex] && itemsData[activePreviewIndex].labelPos && !isPosEmpty(itemsData[activePreviewIndex].labelPos)) {
      baseLabelPos = cloneLabelPos(itemsData[activePreviewIndex].labelPos);
    } else if (presetLp && !isPosEmpty(presetLp)) {
      baseLabelPos = cloneLabelPos(presetLp);
    } else {
      baseLabelPos = cloneLabelPos(presetLp || defaultLabelPos());
    }

    // 2. Очищаем текущий список и наполняем новыми товарами
    itemsData.length = 0;

    // Нормализация: если в буфере несколько кассовых позиций скопированы подряд одной строкой через табуляцию (без \n),
    // автоматически разделяем их на отдельные строки перед известными категориями кассы
    const prefixPattern = POS_CONFIG.map(c => c.prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+')).join('|');
    const preparedText = rawText.replace(new RegExp('[\\t\\s]+(?=(?:' + prefixPattern + ')\\b)', 'gi'), '\n');
    const lines = preparedText.split(/\r?\n/);
    let parsedCount = 0;

    lines.forEach((line) => {
      if (parsedCount >= MAX_ITEMS) return;
      const item = parsePastedProductLine(line);
      if (item) {
        // Наследуем точные координаты шаблона (чтобы расположение шрифтов не сбивалось)
        item.labelPos = cloneLabelPos(baseLabelPos);
        itemsData.push(item);
        parsedCount++;
      }
    });

    if (itemsData.length === 0) {
      itemsData.push({ ...freshItem(), labelPos: cloneLabelPos(baseLabelPos) });
    }

    activePreviewIndex = 0;

    // 3. Синхронизируем эталонные координаты первого товара на все строки
    applySharedPosFromFirstToAll();

    // 4. Подгоняем кегль каждого наименования под границы ценника по алгоритму (titleOnly=true),
    // чтобы длинные названия автоматически масштабировались под рамку ценника,
    // но глобальные параметры шаблона (цвета, начертание, смещения) оставались нетронутыми
    autoFitFontSize(true);

    // 5. Рендерим обновленный список (в сайдбаре и шторке)
    renderItemsListInputs();
    if (typeof renderDrawerItems === 'function' && itemsDrawer && itemsDrawer.classList.contains('open')) {
      renderDrawerItems();
    }
    updatePreview();
    if (typeof resetSortHistory === 'function') resetSortHistory();
    scheduleSessionSave();

    const count = itemsData.filter(isItemFilled).length;
    showToast(`Вставлено товаров: ${count}`, 'success');
    return count;
  }

  // Parse Excel / Касса text paste (кнопка в сайдбаре)
  applyPasteBtn.addEventListener('click', () => {
    const text = pasteExcelArea.value.trim();
    if (!text) return;
    applyPastedProducts(text, 'Вставка из Excel / Кассы');
  });

  // Быстрая вставка из буфера обмена (Ctrl+V) на всей странице, если фокус не в поле ввода
  window.addEventListener('paste', (e) => {
    const activeTag = (document.activeElement && document.activeElement.tagName) ? document.activeElement.tagName.toLowerCase() : '';
    const isEditable = activeTag === 'input' || activeTag === 'textarea' || (document.activeElement && document.activeElement.isContentEditable);
    if (isEditable) return;

    const clipboardText = (e.clipboardData || window.clipboardData)?.getData('text');
    if (!clipboardText || !clipboardText.trim()) return;

    const hasTabs = clipboardText.includes('\t');
    const hasNewlines = clipboardText.includes('\n');
    const hasPosPrefix = POS_CONFIG.some(c => {
      const escaped = c.prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
      return new RegExp(escaped, 'i').test(clipboardText);
    });

    if (hasTabs || hasPosPrefix || (hasNewlines && /\d/.test(clipboardText))) {
      e.preventDefault();
      applyPastedProducts(clipboardText, 'Быстрая вставка (Ctrl+V)');
    }
  });

  // Очистка всей таблицы «Разные товары»: оставляем одну рабочую пустую строку.
  const clearAllItemsBtn = document.getElementById('clearAllItemsBtn');
  if (clearAllItemsBtn) {
    clearAllItemsBtn.addEventListener('click', () => {
      if (!confirm('Очистить все товары в таблице?')) return;
      if (typeof pushHistoryState === 'function') pushHistoryState('Очистка таблицы', true);
      // Мутируем массив на месте (не переприсваиваем), чтобы остаться ссылкой
      // на templateItems[key]. Сбрасываем смещения ценников в дефолт.
      itemsData.length = 0;
      itemsData.push({ ...freshItem(), labelPos: defaultLabelPos() });
      if (pasteExcelArea) pasteExcelArea.value = '';
      if (typeof resetSortHistory === 'function') resetSortHistory();
      renderItemsListInputs();
      updatePreview();
    });
  }

  // ===== Выдвижная боковая шторка ввода товаров (Вариант 4) =====
  const itemsDrawer = document.getElementById('itemsDrawer');
  const itemsDrawerBackdrop = document.getElementById('itemsDrawerBackdrop');
  const itemsDrawerCloseBtn = document.getElementById('itemsDrawerCloseBtn');
  const itemsDrawerPinBtn = document.getElementById('itemsDrawerPinBtn');
  const DRAWER_PINNED_KEY = 'wobbler_drawer_pinned';
  const idrTemplateName = document.getElementById('idrTemplateName');
  const idrItemsCount = document.getElementById('idrItemsCount');
  const idrItemsList = document.getElementById('idrItemsList');
  const idrTogglePasteBtn = document.getElementById('idrTogglePasteBtn');
  const idrPasteBox = document.getElementById('idrPasteBox');
  const idrPasteInput = document.getElementById('idrPasteInput');
  const idrApplyPasteBtn = document.getElementById('idrApplyPasteBtn');
  const idrCancelPasteBtn = document.getElementById('idrCancelPasteBtn');
  const idrClearAllBtn = document.getElementById('idrClearAllBtn');
  const idrMultiPrintBtn = document.getElementById('idrMultiPrintBtn');
  const idrPrintBtn = document.getElementById('idrPrintBtn');
  const autoOpenDrawerChk = document.getElementById('autoOpenDrawerChk');
  const AUTO_OPEN_DRAWER_KEY = 'wobbler_auto_open_drawer';
  const floatingItemsDrawerBtn = document.getElementById('floatingItemsDrawerBtn');
  const floatingItemsBadge = document.getElementById('floatingItemsBadge');

  function openItemsDrawer() {
    if (!itemsDrawer) return;
    itemsDrawer.classList.add('open');
    document.body.classList.add('drawer-open');
    if (itemsDrawerBackdrop) itemsDrawerBackdrop.classList.add('open');
    updateItemsDrawerHeader();
    renderDrawerItems();
  }

  function closeItemsDrawer() {
    if (!itemsDrawer) return;
    itemsDrawer.classList.remove('open');
    document.body.classList.remove('drawer-open');
    if (itemsDrawerBackdrop) itemsDrawerBackdrop.classList.remove('open');
  }

  function updateItemsDrawerHeader() {
    let tName = 'Текущий шаблон';
    if (activeTemplateRef) {
      if (activeTemplateRef.kind === 'builtin') {
        const p = builtInPresets[activeTemplateRef.key];
        if (p) tName = p.name;
      } else if (activeTemplateRef.kind === 'custom') {
        const t = customTemplates[activeTemplateRef.index];
        if (t) tName = t.name;
      }
    }
    if (idrTemplateName) idrTemplateName.textContent = `Товары: ${tName}`;

    const filledCount = itemsData.filter(it => it && it.title && it.title.trim()).length;
    const countText = `${filledCount} ${filledCount === 1 ? 'товар' : (filledCount >= 2 && filledCount <= 4 ? 'товара' : 'товаров')}`;
    if (idrItemsCount) idrItemsCount.textContent = countText;
    if (floatingItemsBadge) floatingItemsBadge.textContent = filledCount;
    try { refreshAutoBgBtns(); } catch (e) { }
  }

  function renderDrawerItems() {
    if (!idrItemsList) return;
    idrItemsList.innerHTML = '';
    normalizeItemsArray();
    const frag = document.createDocumentFragment();
    for (let i = 0; i < itemsData.length; i++) {
      frag.appendChild(createItemRow(i));
    }
    idrItemsList.appendChild(frag);
    syncDigitControlsVisibility();
  }

  function initItemsDrawer() {
    if (autoOpenDrawerChk) {
      try {
        const saved = localStorage.getItem(AUTO_OPEN_DRAWER_KEY);
        if (saved !== null) {
          autoOpenDrawerChk.checked = saved === 'true';
        }
      } catch (e) { }
      autoOpenDrawerChk.addEventListener('change', () => {
        try {
          localStorage.setItem(AUTO_OPEN_DRAWER_KEY, autoOpenDrawerChk.checked ? 'true' : 'false');
        } catch (e) { }
      });
    }

    if (itemsDrawerPinBtn) {
      let isPinned = false;
      try {
        isPinned = localStorage.getItem(DRAWER_PINNED_KEY) === '1';
      } catch (e) { }

      function syncPinUi(pinned) {
        if (pinned) {
          document.body.classList.add('drawer-docked');
          itemsDrawerPinBtn.classList.add('active');
          itemsDrawerPinBtn.title = '\u041e\u0442\u043a\u0440\u0435\u043f\u0438\u0442\u044c \u043f\u0430\u043d\u0435\u043b\u044c \u0442\u043e\u0432\u0430\u0440\u043e\u0432 (\u043f\u0435\u0440\u0435\u0439\u0442\u0438 \u0432\u043e \u0432\u0441\u043f\u043b\u044b\u0432\u0430\u044e\u0449\u0438\u0439 \u0440\u0435\u0436\u0438\u043c)';
          const pinText = itemsDrawerPinBtn.querySelector('.pin-text');
          if (pinText) pinText.textContent = '\u041e\u0442\u043a\u0440\u0435\u043f\u0438\u0442\u044c';
        } else {
          document.body.classList.remove('drawer-docked');
          itemsDrawerPinBtn.classList.remove('active');
          itemsDrawerPinBtn.title = '\u0417\u0430\u043a\u0440\u0435\u043f\u0438\u0442\u044c \u043f\u0430\u043d\u0435\u043b\u044c \u0442\u043e\u0432\u0430\u0440\u043e\u0432 \u0441\u043f\u0440\u0430\u0432\u0430 (Split-View Studio)';
          const pinText = itemsDrawerPinBtn.querySelector('.pin-text');
          if (pinText) pinText.textContent = '\u0417\u0430\u043a\u0440\u0435\u043f\u0438\u0442\u044c';
        }
      }

      syncPinUi(isPinned);

      itemsDrawerPinBtn.addEventListener('click', () => {
        const currentlyDocked = document.body.classList.contains('drawer-docked');
        const nextState = !currentlyDocked;
        syncPinUi(nextState);
        try {
          localStorage.setItem(DRAWER_PINNED_KEY, nextState ? '1' : '0');
        } catch (e) { }
      });

      if (isPinned && window.innerWidth >= 1240) {
        openItemsDrawer();
      }
    }

    if (itemsDrawerCloseBtn) itemsDrawerCloseBtn.addEventListener('click', closeItemsDrawer);
    if (itemsDrawerBackdrop) itemsDrawerBackdrop.addEventListener('click', closeItemsDrawer);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && itemsDrawer && itemsDrawer.classList.contains('open')) {
        closeItemsDrawer();
      }
    });

    // Синхронизация горизонтального скролла колонок таблицы и заголовков
    const mainTableWrapper = document.querySelector('.items-table-wrapper');
    const mainTableHeader = document.querySelector('#multiItemSection .items-table-header');
    if (mainTableWrapper && mainTableHeader) {
      mainTableWrapper.addEventListener('scroll', () => {
        mainTableHeader.scrollLeft = mainTableWrapper.scrollLeft;
      }, { passive: true });
    }

    const idrTableWrapperElem = document.querySelector('.idr-table-wrapper');
    const idrTableHeaderElem = document.querySelector('.idr-table-section .items-table-header');
    if (idrTableWrapperElem && idrTableHeaderElem) {
      idrTableWrapperElem.addEventListener('scroll', () => {
        idrTableHeaderElem.scrollLeft = idrTableWrapperElem.scrollLeft;
      }, { passive: true });
    }

    if (floatingItemsDrawerBtn) {
      floatingItemsDrawerBtn.addEventListener('click', () => {
        if (itemsDrawer && itemsDrawer.classList.contains('open')) closeItemsDrawer();
        else openItemsDrawer();
      });
    }

    if (idrTogglePasteBtn && idrPasteBox) {
      idrTogglePasteBtn.addEventListener('click', () => {
        const isHidden = idrPasteBox.style.display === 'none';
        idrPasteBox.style.display = isHidden ? 'flex' : 'none';
        if (isHidden && idrPasteInput) {
          idrPasteInput.value = '';
          idrPasteInput.focus();
        }
      });
    }

    if (idrCancelPasteBtn && idrPasteBox) {
      idrCancelPasteBtn.addEventListener('click', () => {
        idrPasteBox.style.display = 'none';
      });
    }

    if (idrApplyPasteBtn && idrPasteInput) {
      idrApplyPasteBtn.addEventListener('click', () => {
        const text = idrPasteInput.value.trim();
        if (!text) return;
        applyPastedProducts(text, 'Вставка из Excel / Кассы');
        if (idrPasteBox) idrPasteBox.style.display = 'none';
      });
    }

    if (idrClearAllBtn) {
      idrClearAllBtn.addEventListener('click', () => {
        if (!confirm('Очистить все товары в таблице?')) return;
        if (typeof pushHistoryState === 'function') pushHistoryState('Очистка таблицы', true);
        itemsData.length = 0;
        itemsData.push({ ...freshItem(), labelPos: defaultLabelPos() });
        renderItemsListInputs();
        if (itemsDrawer && itemsDrawer.classList.contains('open')) renderDrawerItems();
        updateItemsDrawerHeader();
        updatePreview();
      });
    }

    if (idrMultiPrintBtn) {
      idrMultiPrintBtn.addEventListener('click', () => {
        closeItemsDrawer();
        const headerRadio = document.querySelector('input[name="printJob"][value="multi"]');
        if (headerRadio) headerRadio.checked = true;
        applyPrintJob('multi');
        openMultiPrintDrawer();
      });
    }

    if (idrPrintBtn) {
      idrPrintBtn.addEventListener('click', () => {
        closeItemsDrawer();
        handlePrintRequest(false, false);
      });
    }
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
    // Глубокий клон общих полей источника (наименование + вес + цена + цифры + валюта + большая цифра).
    const srcTitle = JSON.parse(JSON.stringify(src.labelPos.title));
    const srcSub = JSON.parse(JSON.stringify(src.labelPos.subtitle));
    const srcPrice = JSON.parse(JSON.stringify(src.labelPos.price));
    const srcDigits = JSON.parse(JSON.stringify(src.labelPos.priceDigits));
    const srcCurrency = JSON.parse(JSON.stringify(src.labelPos.currency));
    const srcBigdigit = JSON.parse(JSON.stringify(src.labelPos.bigdigit || { x: 0, y: 0 }));
    itemsData.forEach((it, i) => {
      if (i === 0 || !it) return;
      if (!it.labelPos) it.labelPos = defaultLabelPos();
      it.labelPos.title = JSON.parse(JSON.stringify(srcTitle));
      it.labelPos.subtitle = JSON.parse(JSON.stringify(srcSub));
      it.labelPos.price = JSON.parse(JSON.stringify(srcPrice));
      it.labelPos.priceDigits = JSON.parse(JSON.stringify(srcDigits));
      it.labelPos.currency = JSON.parse(JSON.stringify(srcCurrency));
      it.labelPos.bigdigit = JSON.parse(JSON.stringify(srcBigdigit));
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
      first.labelPos.bigdigit = JSON.parse(JSON.stringify(src.labelPos.bigdigit || { x: 0, y: 0 }));
    }
    applySharedPosFromFirstToAll();
  }

  // 1-строчный автоподбор шрифта для декоративных плашек (outside/inside/bottom)
  let __decorProbe = null;
  function getDecorProbe() {
    if (!__decorProbe) {
      __decorProbe = document.createElement('div');
      __decorProbe.setAttribute('aria-hidden', 'true');
      __decorProbe.style.cssText =
        'position:fixed; left:0; top:0; visibility:hidden; pointer-events:none; z-index:-9999;' +
        'opacity:0; display:inline-block; height:auto; width:auto; text-align:center;' +
        'line-height:1; letter-spacing:0.3px; white-space:nowrap;' +
        'box-sizing:border-box; margin:0; padding:0; border:none;';
      document.body.appendChild(__decorProbe);
    }
    return __decorProbe;
  }

  function fitDecorTextSize(text, widthMm, heightMm, family, weight, italic) {
    if (!text || !text.trim()) return null;
    const pxPerMm = (wobblerPreview && wobblerPreview.offsetWidth)
      ? (wobblerPreview.offsetWidth / ((parseFloat(wobblerWidthInput ? wobblerWidthInput.value : 6.5) * 10) || 65))
      : (96 / 25.4);

    // Бюджет ширины (с запасом 3мм на отступы) и высоты (с запасом 1.2мм)
    const budgetW = Math.max(10, ((widthMm || 65) - 3.0) * pxPerMm);
    const budgetH = Math.max(10, ((heightMm || 12) - 1.2) * pxPerMm);

    const probe = getDecorProbe();
    probe.style.fontFamily = family || "'Montserrat', sans-serif";
    probe.style.fontWeight = weight || '900';
    probe.style.fontStyle = italic ? 'italic' : 'normal';
    probe.textContent = text.trim();

    let lo = 8, hi = 52, best = 12;
    const maxAllowedW = Math.max(budgetW + 1.5, Math.ceil(budgetW) + 1);
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      probe.style.fontSize = `${mid}pt`;
      const rect = probe.getBoundingClientRect();
      const measuredH = (rect && rect.height > 0) ? rect.height : probe.offsetHeight;
      const measuredW = (rect && rect.width > 0) ? rect.width : probe.scrollWidth;
      if (measuredH > 0 && measuredH <= (budgetH + 0.5) && measuredW <= maxAllowedW) {
        best = mid;
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }
    return best;
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
  // === Умная типографика и правила переноса для наименований товаров ===
  // Пробелы полностью сохраняются как значащие символы (для ручной корректировки переносов пробелами)
  function formatSmartTitle(rawText) {
    if (rawText == null) return '';
    const str = String(rawText);
    if (!str) return '';

    const lines = str.split(/\r?\n/);
    return lines.map(line => {
      let s = line;

      // 1. Унификация написания тары: "ж/б", "ж\б", "ж.б.", "ст.б.", "ст/б"
      s = s.replace(/(ж|ст)[\/\.\\]+(б|бут)(?=\b|[^\wа-яёА-ЯЁ]|$)/gi, '$1/$2');

      // 2. Неразрывный пробел между числом и единицей измерения (0,5 л, 0.45л, 100 г, 1.5 кг, 500 мл, 2 шт)
      s = s.replace(/(\d+(?:[.,]\d+)?)\s{0,1}(л|мл|кг|г|гр|шт|ст|пэт|бут|cl|ml|l|g|kg)(?=\b|[^\wа-яёА-ЯЁ]|$)/gi, '$1\u00A0$2');

      // 3. Склейка объема и тары: "0,5 л ж/б" -> "0,5\u00A0л\u00A0ж/б", "0,5 ж/б" -> "0,5\u00A0ж/б", "0,5 ст" -> "0,5\u00A0ст"
      s = s.replace(/(\d+(?:[.,]\d+)?\u00A0(?:л|мл|кг|г|гр|шт)?)\s{1}(ж\/б|ст|пэт|бут)/gi, '$1\u00A0$2');

      // 4. Символы нумерации и брендовые номера (№ 7 -> №7, Балтика №7 -> Балтика\u00A0№7)
      s = s.replace(/(№|#)\s*(\d+)/g, '$1$2');
      s = s.replace(/([а-яёА-ЯЁa-zA-Z]+)\s{1}(№\d+|#\d+)/g, '$1\u00A0$2');

      // 5. Неразрывный пробел после коротких предлогов и союзов (1-2 буквы: в, и, с, на, из, по, со, от, для, без, под, к, о, об, не)
      s = s.replace(/(^|\s)(и|в|с|на|из|по|со|от|для|без|под|к|о|об|не)\s{1}([а-яёА-ЯЁ0-9])/gi, '$1$2\u00A0$3');

      return s;
    }).join('\n');
  }

  const TITLE_FIT_MAX = 100;   // верх слайдера titleSize
  let __titleProbe = null;
  function getTitleProbe(budgetW) {
    if (!__titleProbe) {
      __titleProbe = document.createElement('div');
      __titleProbe.setAttribute('aria-hidden', 'true');
      // Совпадает с финальным рендером (.wobbler-title): перенос по словам,
      // тот же line-height/letter-spacing, но блочный (чтобы замер был точен).
      // Используем position:fixed в пределах вьюпорта (а не -99999px), чтобы браузер
      // и GPU на низких разрешениях (1024x768) честно рассчитывали высоту строк без сбоев.
      __titleProbe.style.cssText =
        'position:fixed; left:0; top:0; visibility:hidden; pointer-events:none; z-index:-9999;' +
        'opacity:0; display:block; height:auto; width:0; text-align:center; box-sizing:border-box;' +
        'line-height:1.05; letter-spacing:-0.2px; white-space:break-spaces;' +
        'word-break:break-word; overflow-wrap:break-word; margin:0; padding:0; border:none;';
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
  // Разделение строки цены на числовую часть и символ валюты (если валюта введена прямо в поле цены).
  // Поддерживает суффиксы и префиксы: "150 ₽", "150.00 ₽", "150р", "150 руб", "15$", "$15", "20 €", "500 ₸", "350".
  function splitPriceAndCurrency(rawPrice) {
    if (rawPrice == null) return { price: '', currency: '' };
    let s = String(rawPrice).trim();
    if (!s) return { price: '', currency: '' };

    // 1. Валюта в конце строки (суффикс): "150 ₽", "150 руб.", "150р", "150$", "150 €", "150 ₸"
    const suffixRegex = /^(.*?)\s*([₽$€£¥₸]|(?:руб(?:л[ея]й)?|р(?:\.|\b)|грн|тг|Br))\s*$/i;
    const suffixMatch = s.match(suffixRegex);
    if (suffixMatch && suffixMatch[1].trim()) {
      let p = suffixMatch[1].trim();
      let c = suffixMatch[2].trim();
      if (/^(?:руб(?:л[ея]й)?|р(?:\.|\b))$/i.test(c)) c = '₽';
      else if (/^тг$/i.test(c)) c = '₸';
      return { price: p, currency: c };
    }

    // 2. Валюта в начале строки (префикс): "$ 15", "$15", "€ 20", "₽ 150"
    const prefixRegex = /^\s*([₽$€£¥₸]|(?:руб(?:л[ея]й)?|р(?:\.|\b)|грн|тг|Br))\s*(.*?)$/i;
    const prefixMatch = s.match(prefixRegex);
    if (prefixMatch && prefixMatch[2].trim()) {
      let c = prefixMatch[1].trim();
      let p = prefixMatch[2].trim();
      if (/^(?:руб(?:л[ея]й)?|р(?:\.|\b))$/i.test(c)) c = '₽';
      else if (/^тг$/i.test(c)) c = '₸';
      return { price: p, currency: c };
    }

    return { price: s, currency: '' };
  }

  // Очистка ввода цены от текстового мусора и незначащих нулей. Сохраняет введённый значок валюты!
  function cleanPriceInput(val) {
    if (!val) return '';
    let s = String(val).trim();
    s = s.replace(/,/g, '.');
    s = s.replace(/([0-9])o([0-9])/gi, '$10$2');
    s = s.replace(/\.00(?!\d)/, '');
    // Если введено 150р или 150руб, аккуратно преобразуем в официальный символ "150 ₽"
    s = s.replace(/\s*(?:руб(?:л[ея]й)?|р(?:\.|\b))\s*$/i, ' ₽');
    // Если знак валюты введен слитно с цифрами (напр. "150₽" или "15$"), добавляем аккуратный пробел
    s = s.replace(/(\d)\s*([₽$€£¥₸])\s*$/g, '$1 $2');
    s = s.replace(/^\s*([₽$€£¥₸])\s*(\d)/g, '$1 $2');
    s = s.replace(/\s+/g, ' ').trim();
    return s;
  }

  // Рендеринг цифр цены с поддержкой верхнего индекса копеек
  function renderPriceElement(targetEl, priceText, priceDigitsLp, enableSupCents) {
    if (!targetEl) return;
    targetEl.innerHTML = '';
    const lp = Array.isArray(priceDigitsLp) ? priceDigitsLp : [];
    const parsed = splitPriceAndCurrency(priceText);
    const str = String(parsed.price || '').trim();
    const match = enableSupCents ? str.match(/^([0-9\s]+)[.,]([0-9]{1,2})$/) : null;
    if (match) {
      const rubPart = match[1];
      const kopPart = match[2];
      const rubDigits = rubPart.split('');
      while (lp.length < rubDigits.length) lp.push({ x: 0, y: 0 });
      rubDigits.forEach((d, idx) => {
        const span = document.createElement('span');
        const isSpace = d === ' ';
        span.className = 'price-digit' + (isSpace ? ' price-space' : '');
        span.textContent = isSpace ? '\u00A0' : d;
        span.dataset.pos = idx;
        const dp = lp[idx] || { x: 0, y: 0 };
        span.style.transform = `translate(${dp.x}mm, ${dp.y}mm)`;
        targetEl.appendChild(span);
      });
      const kopSpan = document.createElement('span');
      kopSpan.className = 'price-kopecks';
      kopSpan.textContent = kopPart;
      targetEl.appendChild(kopSpan);
    } else {
      const digits = str.split('');
      while (lp.length < digits.length) lp.push({ x: 0, y: 0 });
      digits.forEach((d, idx) => {
        const span = document.createElement('span');
        const isSpace = d === ' ';
        span.className = 'price-digit' + (isSpace ? ' price-space' : '');
        span.textContent = isSpace ? '\u00A0' : d;
        span.dataset.pos = idx;
        const dp = lp[idx] || { x: 0, y: 0 };
        span.style.transform = `translate(${dp.x}mm, ${dp.y}mm)`;
        targetEl.appendChild(span);
      });
    }
  }

  function maxPriceDigitWidth(refEl) {
    try {
      if (!refEl) return null;
      const probes = [];
      let max = 0;
      const fs = refEl.style.fontSize || '';
      const ff = refEl.style.fontFamily || '';
      const fw = refEl.style.fontWeight || '';
      for (let i = 0; i <= 9; i++) {
        const span = document.createElement('span');
        span.className = 'price-digit';
        span.setAttribute('aria-hidden', 'true');
        // Вне потока, скрыт; min-width снимаем, чтобы замерить чистую ширину
        // глифа, а не запас из CSS-переменной. Явно задаём font-size/font-family/weight.
        span.style.cssText =
          'position:absolute;left:-99999px;top:0;visibility:hidden;' +
          'min-width:0 !important;width:auto !important;overflow:visible !important;' +
          (fs ? `font-size:${fs} !important;` : '') +
          (ff ? `font-family:${ff} !important;` : '') +
          (fw ? `font-weight:${fw} !important;` : '');
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

  // Проверяет, предусматривает ли шаблон слот под цену в шапке ценника.
  // Зависит от геометрии и типа шаблона, а НЕ от временного состояния переключателя showPrice,
  // что гарантирует полную независимость слоёв (0px смещения названия при выключении цены).
  function isTemplatePriceSlotAvailable(ref, layout, pib) {
    if (pib || layout === 'split') return false;
    if (!ref) return true;
    if (ref.kind === 'builtin') {
      const k = ref.key;
      if (k === 'korona_a5' || k === 'a5' || k === 'novy_vkus' || k === 'novinka' || k === 'tomat' || k === 'sladko') {
        return false;
      }
      return true;
    }
    if (ref.kind === 'custom' && typeof customTemplates !== 'undefined') {
      const ct = customTemplates[ref.index];
      if (ct && ct.state && ct.state.showPrice === false) {
        return false;
      }
      return true;
    }
    return true;
  }

  function fitTitleSize(text, family, weight, itemIdx = activePreviewIndex) {
    if (!text || !text.trim()) return null;
    const idx = (typeof itemIdx === 'number' && itemIdx >= 0) ? itemIdx : activePreviewIndex;

    const wCm = parseFloat(wobblerWidthInput ? wobblerWidthInput.value : 6.5) || 6.5;
    const hCm = parseFloat(wobblerHeightInput ? wobblerHeightInput.value : 4.5) || 4.5;
    const wMm = wCm * 10;
    const hMm = hCm * 10;
    const ts = resolveItemBg(idx).titleSafe;
    const headerHm = currentLayout === 'full' ? hMm : hMm * (parseFloat(headerHeightRange ? headerHeightRange.value : 20.45) || 20.45) / 100;
    const isSplit = currentLayout === 'split';
    const padMm = (borderMm > 0) ? borderMm : (isSplit ? 0 : 3);
    const contentHm = isSplit ? headerHm : Math.max(1, headerHm - padMm * 2);
    const activePreset = getActivePreset();
    let slotTop = 0;
    let tzMm = 0;
    if (isSplit) {
      slotTop = 0;
      tzMm = contentHm;
    } else if (activePreset && activePreset.titleSlotTop != null) {
      const basePresetTs = normTitleSafe(activePreset.titleSafe || activePreset.ts);
      const isCustomizedTs = basePresetTs && (
        Math.abs(ts.top - basePresetTs.top) > 0.005 ||
        Math.abs(ts.bottom - basePresetTs.bottom) > 0.005
      );
      if (isCustomizedTs) {
        slotTop = Math.max(0, headerHm * ts.top - padMm);
        tzMm = Math.max(2, headerHm * Math.max(0.05, 1 - ts.top - ts.bottom));
      } else {
        slotTop = parseFloat(activePreset.titleSlotTop);
        tzMm = (activePreset.titleZoneH != null)
          ? parseFloat(activePreset.titleZoneH)
          : Math.max(2, headerHm * Math.max(0.05, 1 - ts.top - ts.bottom));
      }
    } else {
      const hasPrice = isTemplatePriceSlotAvailable(activeTemplateRef, currentLayout, rybaPriceInBottom && currentLayout === 'split');
      const isTsDefault = (ts.top === 0 && ts.bottom === 0);
      if (isTsDefault) {
        tzMm = hasPrice ? (headerHm * 0.45) : contentHm;
      } else {
        tzMm = Math.max(2, headerHm * Math.max(0.05, 1 - ts.top - ts.bottom));
      }
      slotTop = Math.max(0, headerHm * ts.top - padMm);
    }
    tzMm = Math.min(tzMm, Math.max(2, contentHm - slotTop));
    const contentW_mm = Math.max(10, wMm - padMm * 2);
    const safeW_mm = wMm * (1 - ts.left - ts.right);
    const titleW_mm = Math.min(contentW_mm, safeW_mm);
    const pxPerMm = 96 / 25.4;
    const budgetW = Math.max(10, (titleW_mm - 1.5) * pxPerMm);
    const budgetH = tzMm * pxPerMm;

    if (!budgetW || !budgetH || isNaN(budgetW) || isNaN(budgetH) || budgetH <= 0 || budgetW <= 0) return null;

    // Нижний пол кегля.
    const ABS_MIN = 7;
    const curBgImg = resolveItemBg(activePreviewIndex).bgImage || '';
    const isRybaOrVygodno = (activeTemplateRef && (activeTemplateRef.key === 'ryba' || activeTemplateRef.key === 'vygodno_ryba')) ||
      curBgImg === 'ryba_bg.jpg' || curBgImg.includes('ryba_vygodno');
    const presetFloor = isRybaOrVygodno ? 10 : builtinPresetFlag('titleFitFloor', null);
    const floor = presetFloor != null
      ? presetFloor
      : (subtitleCorner ? 22 : ABS_MIN);

    const probe = getTitleProbe(budgetW);
    probe.style.fontFamily = family || 'Arial, sans-serif';
    probe.style.fontWeight = weight || '800';
    const isIt = (templateFonts && templateFonts.titleItalic) || (titleItalic && titleItalic.checked);
    probe.style.fontStyle = isIt ? 'italic' : 'normal';
    probe.textContent = formatSmartTitle(text);

    let best = floor;
    let lo = floor, hi = TITLE_FIT_MAX;
    while (lo <= hi) {
      const mid = Math.round(((lo + hi) / 2) * 2) / 2;
      probe.style.fontSize = `${mid}pt`;
      const rect = probe.getBoundingClientRect();
      const measuredH = (rect && rect.height > 0) ? rect.height : probe.offsetHeight;
      const measuredW = probe.scrollWidth;
      const clientW = probe.clientWidth || budgetW;
      const overflowsX = (measuredW - clientW) > 3.5 || measuredW > (budgetW + 6);

      // Текст помещается, если его реальная высота не превышает зону названия и не вылезает по ширине.
      // Защита от сбоя видеокарт/браузеров: measuredH должен быть строго > 0.
      if (measuredH > 0 && measuredH <= (budgetH + 1.5) && !overflowsX) {
        best = mid;
        lo = mid + 0.5;
      } else {
        hi = mid - 0.5;
      }
    }
    return best;
  }

  // Переподбор кегля активного товара и запись результата туда же, откуда
  // читает activeItemTitleSize (per-item в multi, слайдер в single).
  // force=true принудительно подгоняет, даже если размер был задан вручную (titleSizeManual).
  function refitActiveTitle(force = false) {
    const isMultiMode = document.querySelector('input[name="printMode"]:checked').value === 'multi';
    let family = titleFont ? titleFont.value : '';
    let weight = titleWeight ? titleWeight.value : '800';
    if (isMultiMode) {
      const it = itemsData[activePreviewIndex] || (itemsData[activePreviewIndex] = {});
      if (it && it.fontsCustomized && it.fonts) {
        if (it.fonts.titleFont) family = it.fonts.titleFont;
        if (it.fonts.titleWeight) weight = it.fonts.titleWeight;
      }
      if (!force && it.titleSizeManual) {
        updatePreview();
        return;
      }
      const fit = fitTitleSize(it.title, family, weight, activePreviewIndex);
      if (fit != null) {
        it.titleSize = fit;
        if (!it.fonts) it.fonts = {};
        it.fonts.titleSize = fit;
        if (titleSize) titleSize.value = String(fit);
        if (titleSizeVal) titleSizeVal.textContent = String(fit);
        syncTitleSizePreview();
      }
    } else {
      const fit = fitTitleSize(inputTitle ? inputTitle.value : '', family, weight);
      if (fit != null) {
        // Пишем в модель: слайдер/рендер синхронизирует updatePreview, а модель
        // остаётся источником истины (DOM-запись тоже «запекалась» бы при
        // следующей правке шрифтового контрола).
        templateFonts = Object.assign({}, templateFonts, { titleSize: fit });
        if (titleSize) titleSize.value = String(fit);
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
  //
  // titleOnly=true — подгоняет ТОЛЬКО кегль наименования под геометрию (вызов
  // при смене шаблона и после загрузки шрифтов). Вес/кегли веса и цены пресета
  // не трогает. Полный прогон (кнопка «✨ Подогнать») применяет эвристики
  // (вес 800, размеры по длине) ЧЕРЕЗ модель templateFonts — раньше они
  // писались только в DOM-инпуты, расходились с моделью и «запекались» в
  // шаблон при следующей правке любого шрифтового контрола.
  function autoFitFontSize(titleOnly) {
    const isMultiMode = document.querySelector('input[name="printMode"]:checked').value === 'multi';
    // Пресеты с полем autofitTitleOnly (у «Снеков», «Желтого» и др.): кнопка умная —
    // подбирает ТОЛЬКО кегль наименования, толщину шрифта, цену и вес не меняет.
    const activePreset = getActivePreset();
    const isYellow = (activeTemplateRef && activeTemplateRef.key === 'yellow_tag') ||
      (activePreset && (activePreset.key === 'yellow_tag' || activePreset.bgImage === 'yellow_bg.jpg' || (activePreset.bg && activePreset.bg.bgImage === 'yellow_bg.jpg')));
    const titleOnlyPreset = !!(activePreset && activePreset.autofitTitleOnly) ||
      !!builtinPresetFlag('autofitTitleOnly', false) ||
      isYellow ||
      (activeTemplateRef && (activeTemplateRef.key === 'alaska_dots' || activeTemplateRef.key === 'yellow_tag'));
    // titleOnly !== true: обработчик кнопки передаёт event первым аргументом —
    // считаем titleOnly-режимом только явный true.
    const applyGlobals = titleOnly !== true && !titleOnlyPreset;

    // Кегль наименования: per-item в multi (свой под перенос каждого названия),
    // шаблонный в single. Пишем в модель, а не только в слайдер.
    if (isMultiMode) {
      const family = titleFont ? titleFont.value : '';
      const weight = (templateFonts && templateFonts.titleWeight) || (titleWeight ? titleWeight.value : '800');
      itemsData.forEach((it, idx) => {
        if (!it) return;
        delete it.titleSizeManual;
        const fit = fitTitleSize(it.title, family, weight, idx);
        if (fit == null) return;
        it.titleSize = fit;
        // У ценника есть шрифтовой override — обновляем и его, иначе старое
        // значение fonts.titleSize замаскирует freshly-подогнанный кегль.
        if (it.fonts) it.fonts.titleSize = fit;
      });
    } else {
      const family = titleFont ? titleFont.value : '';
      const weight = (templateFonts && templateFonts.titleWeight) || (titleWeight ? titleWeight.value : '800');
      const fit = fitTitleSize(inputTitle ? inputTitle.value : '', family, weight);
      if (fit != null) {
        templateFonts = Object.assign({}, templateFonts, { titleSize: fit });
      }
    }

    if (applyGlobals) {
      // Вес/доп.текст — глобальный размер по длине активного товара (независимо).
      const activeSub = isMultiMode
        ? ((itemsData[activePreviewIndex] && itemsData[activePreviewIndex].subtitle) || '')
        : (inputSubtitle ? inputSubtitle.value : '');
      const subOpt = subtitleSizeByLen(activeSub.trim().length);

      // Цена — глобальный размер по числу цифр активного товара (независимо).
      const activePrice = isMultiMode
        ? ((itemsData[activePreviewIndex] && itemsData[activePreviewIndex].price) || '')
        : inputPrice.value;
      const priceOpt = priceSizeByLen(activePrice.replace(/\D/g, '').length);
      // Для шаблона «Рыба» (subtitleCorner) цена не крупнее 40pt.
      const priceOptCapped = subtitleCorner ? Math.min(priceOpt, 40) : priceOpt;

      // Наименование — Bold (800), доп. сдвиг не нужен (зона фиксирована).
      // Для шаблона «Рыба» (subtitleCorner) наименование не мельче 22pt —
      // этот пол зашит внутри fitTitleSize().
      const patch = {
        titleWeight: '800',
        titleOffsetY: 0,
        subtitleSize: subOpt,
        priceSize: priceOptCapped
      };
      // Пишем в контекст, который редактирует панель шрифтов: per-item override
      // активного ценника (иначе он замаскирует новые значения), иначе шаблон.
      const act = itemsData[activePreviewIndex];
      if (isMultiMode && fontApplyMode === 'item' && act && act.fontsCustomized && act.fonts) {
        act.fonts = Object.assign({}, act.fonts, patch);
      } else {
        templateFonts = Object.assign({}, templateFonts, patch);
      }
    }

    // Инпуты перерисовываем ИЗ модели (источник истины), а не наоборот.
    syncFontControlsToContext();
    updatePreview();
  }

  autoFitFontBtn.addEventListener('click', autoFitFontSize);

  // Пакетная подгонка кегля всех названий под безопасную зону («Fit All Titles»)
  function fitAllTitles() {
    if (typeof pushHistoryState === 'function') pushHistoryState('Подгонка размера шрифта всех товаров', true);
    const family = titleFont ? titleFont.value : 'Arial, sans-serif';
    const weight = titleWeight ? titleWeight.value : '800';
    let count = 0;
    itemsData.forEach((it, idx) => {
      if (!it || !it.title || !it.title.trim()) return;
      const fit = fitTitleSize(it.title, family, weight, idx);
      if (fit != null) {
        delete it.titleSizeManual;
        it.titleSize = fit;
        if (!it.fonts) it.fonts = {};
        it.fonts.titleSize = fit;
        it.fontsCustomized = true;
        count++;
      }
    });
    refitActiveTitle(true);
    updatePreview();
    renderItemsListInputs();
    scheduleSessionSave();
    if (typeof showToast === 'function') {
      showToast(`Оптимальный размер шрифта рассчитан для ${count} товаров`, 'success', 2400);
    }
  }

  const fitAllTitlesBtn = document.getElementById('fitAllTitlesBtn');
  if (fitAllTitlesBtn) {
    fitAllTitlesBtn.addEventListener('click', fitAllTitles);
  }

  // Calculate maximum fitting wobblers on A4 with dual-orientation intelligence.
  // Поля печати: 10 мм сверху, по 4 мм снизу/слева/справа; зазор gapMm задаётся слайдером.
  // Portrait:  рабочая зона (210 - 8) x (297 - 14) = 202 x 283 мм
  // Landscape: рабочая зона (297 - 8) x (210 - 14) = 289 x 196 мм
  function calcA4Grid(wMm, hMm, forcedMode = printOrientationMode) {
    const mTop = 10, mBottom = 4, mSide = 4;
    const g = gapMm();

    // Расчет для книжной ориентации (Portrait)
    const pageW_P = 210 - mSide * 2;      // 202 мм
    const pageH_P = 297 - mTop - mBottom; // 283 мм
    const colsP = Math.max(1, Math.floor((pageW_P + g) / (wMm + g)));
    const rowsP = Math.max(1, Math.floor((pageH_P + g) / (hMm + g)));
    const maxP = colsP * rowsP;

    // Расчет для альбомной ориентации (Landscape)
    const pageW_L = 297 - mSide * 2;      // 289 мм
    const pageH_L = 210 - mTop - mBottom; // 196 мм
    const colsL = Math.max(1, Math.floor((pageW_L + g) / (wMm + g)));
    const rowsL = Math.max(1, Math.floor((pageH_L + g) / (hMm + g)));
    const maxL = colsL * rowsL;

    let orientation = 'portrait';
    let cols = colsP;
    let rows = rowsP;
    let maxCount = maxP;

    const mode = (forcedMode === 'portrait' || forcedMode === 'landscape') ? forcedMode : 'auto';

    if (mode === 'landscape') {
      orientation = 'landscape';
      cols = colsL;
      rows = rowsL;
      maxCount = maxL;
    } else if (mode === 'portrait') {
      orientation = 'portrait';
      cols = colsP;
      rows = rowsP;
      maxCount = maxP;
    } else {
      // Режим 'auto': выбираем вариант с наибольшей вместимостью
      if (maxL > maxP) {
        orientation = 'landscape';
        cols = colsL;
        rows = rowsL;
        maxCount = maxL;
      } else {
        orientation = 'portrait';
        cols = colsP;
        rows = rowsP;
        maxCount = maxP;
      }
    }

    const isLandscape = (orientation === 'landscape');
    const benefit = Math.abs(maxL - maxP);

    return {
      cols,
      rows,
      maxCount,
      orientation,
      isLandscape,
      portraitCount: maxP,
      landscapeCount: maxL,
      benefit,
      mode
    };
  }

  // Установка и синхронизация ориентации печати
  function setPrintOrientation(mode, skipRender) {
    if (mode !== 'portrait' && mode !== 'landscape' && mode !== 'auto') {
      mode = 'auto';
    }
    printOrientationMode = mode;
    try {
      localStorage.setItem('wobbler_print_orientation', mode);
    } catch (e) { }

    const secControl = document.getElementById('printOrientationControl');
    if (secControl) {
      secControl.querySelectorAll('.seg-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-orientation') === mode);
      });
    }

    const hubPills = document.getElementById('sheetOrientationPills');
    if (hubPills) {
      hubPills.querySelectorAll('.sheet-orient-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-orientation') === mode);
      });
    }

    if (!skipRender) {
      updatePreview();
    }
  }

  // Обновление сводных метрик центра печати (Print Hub)
  function updatePrintHubMetrics(grid, totalCards, filledCount, totalPages) {
    const pagesVal = document.getElementById('phPagesVal');
    const totalVal = document.getElementById('phTotalVal');
    const uniqueVal = document.getElementById('phUniqueVal');
    const gridVal = document.getElementById('phGridVal');
    const orientVal = document.getElementById('phOrientVal');
    const orientPill = document.getElementById('phOrientPill');

    if (pagesVal) pagesVal.textContent = totalCards > 0 ? totalPages : 0;
    if (totalVal) totalVal.textContent = `${totalCards} шт.`;
    if (uniqueVal) uniqueVal.textContent = `${filledCount}`;
    if (gridVal) gridVal.textContent = `${grid.cols}×${grid.rows} (${grid.maxCount}/л)`;

    if (orientVal) {
      if (grid.mode === 'auto') {
        if (grid.isLandscape) {
          orientVal.textContent = grid.benefit > 0
            ? `Альбомная (+${grid.benefit} шт)`
            : 'Альбомная';
        } else {
          orientVal.textContent = grid.benefit > 0
            ? `Книжная (+${grid.benefit} шт)`
            : 'Книжная';
        }
      } else if (grid.mode === 'landscape') {
        orientVal.textContent = 'Альбомная';
      } else {
        orientVal.textContent = 'Книжная';
      }
    }

    if (orientPill) {
      const pStr = `Книжная: ${grid.portraitCount} шт.`;
      const lStr = `Альбомная: ${grid.landscapeCount} шт.`;
      const modeStr = grid.mode === 'auto' ? 'Автоподбор' : (grid.isLandscape ? 'Принудительно альбомная' : 'Принудительно книжная');
      orientPill.title = `${modeStr}\nСравнение вместимости листа А4:\n• ${pStr}\n• ${lStr}\n${grid.benefit > 0 ? (grid.isLandscape ? 'Альбомная вмещает на ' + grid.benefit + ' шт. больше!' : 'Книжная вмещает на ' + grid.benefit + ' шт. больше!') : 'Вместимость одинакова'}`;
    }
  }

  // Интерактивная фокусировка и мягкая подсветка строки товара в таблице
  function focusItemTableRow(idx) {
    if (typeof idx !== 'number' || idx < 0) return;
    const row = document.querySelector(`.idr-table-wrapper .item-row[data-index="${idx}"], .items-table-wrapper .item-row[data-index="${idx}"]`);
    if (row) {
      row.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      row.classList.remove('flash-highlight');
      void row.offsetWidth; // reflow для повторного запуска CSS анимации
      row.classList.add('flash-highlight');
      setTimeout(() => {
        row.classList.remove('flash-highlight');
      }, 1600);

      const titleInput = row.querySelector('.col-title input, input[name="title"], textarea');
      if (titleInput && document.activeElement !== titleInput) {
        titleInput.focus({ preventScroll: true });
      }
    }
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
      const showBottom = !!(decorBottomShow && decorBottomShow.checked);
      let h = hMm;
      if (showOutside) h += decorOutsideHeightMm();
      if (showBottom) h += decorBottomHeightMm();
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
    const lp = cloneLabelPos((item && item.labelPos)
      ? item.labelPos
      : (itemsData[0] && itemsData[0].labelPos) ? itemsData[0].labelPos : defaultLabelPos());
    const digits = String((item && item.price) || '').split('');

    const tElem = clone.querySelector('.wobbler-title');
    const pElem = clone.querySelector('.price-val');
    const sElem = clone.querySelector('.wobbler-subtitle');
    const box = clone.querySelector('.wobbler-price-box');
    const curr = clone.querySelector('.price-curr');
    if (box) {
      box.style.display = (showPriceToggle && !showPriceToggle.checked) ? 'none' : 'flex';
    }

    if (tElem) {
      tElem.textContent = formatSmartTitle((item && item.title) || '');
      // === Per-item шрифты/цвета на клоне ===
      // Клон унаследовал стили активного ценника от живого #wobblerPreview,
      // поэтому здесь перезаписываем ВСЕ шрифтовые поля под этот товар.
      const tf = templateFonts || {};
      tElem.style.fontFamily = fontOf(item, 'titleFont', tf.titleFont);
      tElem.style.color = fontOf(item, 'titleColor', tf.titleColor);
      tElem.style.fontSize = `${activeItemTitleSize(item)}pt`;
      tElem.style.fontWeight = fontOf(item, 'titleWeight', tf.titleWeight);
      const isTitleItalic = fontOf(item, 'titleItalic', tf.titleItalic);
      tElem.style.fontStyle = isTitleItalic ? 'italic' : 'normal';
      tElem.classList.toggle('is-italic', !!isTitleItalic);
      tElem.style.textShadow = fontOf(item, 'titleShadow', tf.titleShadow || '');
      const tAlign = fontOf(item, 'titleAlign', tf.titleAlign);
      tElem.style.textAlign = tAlign;
      tElem.style.justifyContent = tAlign === 'left' ? 'flex-start' : (tAlign === 'right' ? 'flex-end' : 'center');
      const tOff = parseFloat(fontOf(item, 'titleOffsetY', tf.titleOffsetY != null ? tf.titleOffsetY : titleOffsetYVal)) || 0;
      const tSkew = isTitleItalic ? ' skewX(-11deg)' : '';
      tElem.style.transform = `translate(${lp.title.x}mm, ${tOff + lp.title.y}mm) rotate(${layerRotate}deg)${tSkew}`;
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
    // Большая цифра (клоны раскладки/печати): значение per-item, стиль шаблонный.
    {
      const bd = clone.querySelector('.wobbler-bigdigit');
      if (bd) {
        const bdText = ((item && item.digit) || '').trim();
        bd.style.display = bdText ? 'flex' : 'none';
        if (bdText) {
          const dFont = document.getElementById('digitFont');
          const dColor = document.getElementById('digitColor');
          const dSize = document.getElementById('digitSize');
          const dWeight = document.getElementById('digitWeight');
          bd.style.fontFamily = dFont ? dFont.value : "Arial, sans-serif";
          bd.style.color = dColor ? dColor.value : '#ffff00';
          bd.style.fontSize = `${dSize ? (parseFloat(dSize.value) || 48) : 48}pt`;
          bd.style.fontWeight = dWeight ? dWeight.value : '800';
          const bdPos = lp.bigdigit || { x: 0, y: 0 };
          bd.style.transform = `translate(${bdPos.x}mm, ${bdPos.y}mm) rotate(${layerRotate}deg)`;
          const isSnekiDigit = (activeTemplateRef && activeTemplateRef.key === 'sneki_digit') || (item && item.bgImage === 'sneki_digit_bg.jpg') || (bgImageSelect && bgImageSelect.value === 'sneki_digit_bg.jpg');
          bd.innerHTML = isSnekiDigit ? `<span class="bigdigit-num-symbol">№</span>${bdText}` : bdText;
        } else {
          bd.innerHTML = '';
        }
      }
    }
    const parsedPrice = splitPriceAndCurrency(item && item.price);
    // Цена: пересобираем по цифрам с позициями priceDigits (и копейками верхним индексом, если включено).
    if (pElem) {
      const priceCentsSup = !!(document.getElementById('priceCentsSupToggle') && document.getElementById('priceCentsSupToggle').checked);
      renderPriceElement(pElem, String(parsedPrice.price || ''), lp.priceDigits, priceCentsSup);
    }
    if (curr) {
      const tf3 = templateFonts || {};
      const tf3Cur = (tf3.currency != null) ? tf3.currency : (inputCurrency ? inputCurrency.value : '');
      const curFallback = fontOf(item, 'currency', tf3Cur) || (inputCurrency ? inputCurrency.value : '') || '';
      const cloneCurVal = (parsedPrice.currency ? parsedPrice.currency : curFallback).trim();
      curr.textContent = cloneCurVal;
      curr.style.display = cloneCurVal ? '' : 'none';
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

    // Красный крест на цене (клон печати/раскладки)
    {
      const tfCross = templateFonts || {};
      const isCrossed = fontOf(item, 'priceCross', !!tfCross.priceCross || !!(priceCrossToggle && priceCrossToggle.checked));
      const crossColor = fontOf(item, 'priceCrossColor', tfCross.priceCrossColor || (priceCrossColor ? priceCrossColor.value : '#e63946'));
      const crossWidth = fontOf(item, 'priceCrossWidth', tfCross.priceCrossWidth != null ? tfCross.priceCrossWidth : (priceCrossWidth ? priceCrossWidth.value : 7));
      applyCrossOverlay(box || clone.querySelector('.wobbler-price-box'), isCrossed, crossColor, crossWidth);
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
      clone.style.setProperty('--border-mm', `${borderMm}mm`);
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
          txt.style.fontFamily = snap.font || '';   // '' = наследуется
          txt.style.fontStyle = snap.italic ? 'italic' : 'normal';
          txt.style.textShadow = snap.shadow || '';
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
    const _pib = (rybaPriceInBottom && currentLayout === 'split');
    const _isSplit = currentLayout === 'split';
    const _hasPriceSlot = isTemplatePriceSlotAvailable(activeTemplateRef, currentLayout, _pib);
    const _pad = (borderMm > 0) ? borderMm : (_isSplit ? 0 : 3);
    const _hw = _w * 10;                         // ширина шапки, мм
    const _cw = Math.max(1, _hw - _pad * 2);     // content-ширина, мм
    const _contentHm = _isSplit ? _hh : Math.max(1, _hh - _pad * 2);

    const activePreset = getActivePreset();
    let _slotTop = 0;
    let _tz = 0;
    if (_isSplit) {
      _slotTop = 0;
      _tz = _contentHm;
    } else if (activePreset && activePreset.titleSlotTop != null) {
      const basePresetTs = normTitleSafe(activePreset.titleSafe || activePreset.ts);
      const isCustomizedTs = basePresetTs && (
        Math.abs(ts.top - basePresetTs.top) > 0.005 ||
        Math.abs(ts.bottom - basePresetTs.bottom) > 0.005
      );
      if (isCustomizedTs) {
        _slotTop = Math.max(0, _hh * ts.top - _pad);
        _tz = Math.max(2, _hh * Math.max(0.05, 1 - ts.top - ts.bottom));
      } else {
        _slotTop = parseFloat(activePreset.titleSlotTop);
        _tz = (activePreset.titleZoneH != null)
          ? parseFloat(activePreset.titleZoneH)
          : Math.max(2, _hh * Math.max(0.05, 1 - ts.top - ts.bottom));
      }
    } else {
      const _isTsDefault = (ts.top === 0 && ts.bottom === 0);
      if (_isTsDefault) {
        _tz = _hasPriceSlot ? (_hh * 0.45) : _contentHm;
      } else {
        _tz = Math.max(2, _hh * Math.max(0.05, 1 - ts.top - ts.bottom));
      }
      _slotTop = Math.max(0, _hh * ts.top - _pad);
    }
    _tz = Math.min(_tz, Math.max(2, _contentHm - _slotTop));
    clone.style.setProperty('--title-zone-h', `${_tz.toFixed(2)}mm`);
    clone.style.setProperty('--title-slot-top', `${_slotTop.toFixed(2)}mm`);

    const _tw = _hw * (1 - ts.left - ts.right);  // ширина названия, мм
    const _swf = Math.max(0, Math.min(1, _tw / _cw));
    clone.style.setProperty('--title-safe-w', `${(_swf * 100).toFixed(2)}%`);

    let _priceTop = 0;
    if (_hasPriceSlot) {
      const activePreset = getActivePreset();
      if (activePreset && activePreset.priceSlotTop != null) {
        _priceTop = parseFloat(activePreset.priceSlotTop);
      } else {
        const _basePresetTs = normTitleSafe(activePreset && (activePreset.titleSafe || activePreset.ts));
        const _baseTz = (_basePresetTs && (_basePresetTs.top > 0 || _basePresetTs.bottom > 0))
          ? Math.min(_hh * 0.45, _hh * Math.max(0, 1 - _basePresetTs.top - _basePresetTs.bottom))
          : (_hh * 0.45);
        const _pSizePt = parseFloat(fontOf(item, 'priceSize', (templateFonts && templateFonts.priceSize) || (priceSize ? priceSize.value : 40))) || 40;
        const _basePriceH = _pSizePt * 0.3528 * 1.12;
        const _baseComb = _baseTz + 2.0 + _basePriceH;
        const _baselineSlotTop = Math.max(0, (_contentHm - _baseComb) / 2);
        _priceTop = _baselineSlotTop + _baseTz + 4.0;
      }
    }
    clone.style.setProperty('--price-slot-top', `${_priceTop.toFixed(2)}mm`);

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
      titleFont: preset.titleFont || "Arial, sans-serif",
      titleColor: preset.titleColor || '#ffffff',
      titleSize: preset.titleSize || 13,
      titleWeight: preset.titleWeight || '800',
      titleItalic: !!preset.titleItalic,
      titleAlign: preset.titleAlign || 'center',
      titleOffsetY: preset.titleOffsetY != null ? preset.titleOffsetY : 0,
      titleShadow: preset.titleShadow || '',
      subtitleColor: preset.subtitleColor || '#ffffff',
      subtitleSize: preset.subtitleSize != null ? preset.subtitleSize : 11,
      subtitleWeight: preset.subtitleWeight || '700',
      subtitleAlign: preset.subtitleAlign || 'left',
      priceFont: preset.priceFont || "Arial, sans-serif",
      priceColor: preset.priceColor || '#ffffff',
      priceSize: preset.priceSize !== undefined ? preset.priceSize : 40,
      priceWeight: preset.priceWeight || '700',
      priceAlign: preset.priceAlign || 'center',
      priceOffsetY: preset.priceOffsetY != null ? preset.priceOffsetY : 0,
      priceShadow: preset.priceShadow || '',
      currency: preset.currency != null ? preset.currency : '',
      priceCross: !!preset.priceCross,
      priceCrossColor: preset.priceCrossColor || '#e63946',
      priceCrossWidth: preset.priceCrossWidth != null ? preset.priceCrossWidth : 7
    };
    const td = {
      outsideShow: !!preset.decorOutsideShow,
      outsideText: preset.decorOutsideText != null ? preset.decorOutsideText : 'НОВИНКА',
      outsideBg: preset.decorOutsideBg || '#e63946',
      outsideBgImg: preset.decorOutsideBgImg || 'none',
      outsideCustomBg: preset.decorOutsideCustomBg || null,
      outsideColor: preset.decorOutsideColor || '#ffffff',
      outsideFont: preset.decorOutsideFont || '',
      outsideItalic: !!preset.decorOutsideItalic,
      outsideShadow: preset.decorOutsideShadow || '',
      outsideFontSize: preset.decorOutsideFontSize != null ? preset.decorOutsideFontSize : 14,
      outsideHeight: preset.decorOutsideHeight != null ? preset.decorOutsideHeight : 12,
      insideShow: !!preset.decorInsideShow,
      insideText: preset.decorInsideText != null ? preset.decorInsideText : 'НОВИНКА',
      insideBg: preset.decorInsideBg || '#e63946',
      insideBgImg: preset.decorInsideBgImg || 'none',
      insideCustomBg: preset.decorInsideCustomBg || null,
      insideColor: preset.decorInsideColor || '#ffffff',
      insideFont: preset.decorInsideFont || '',
      insideItalic: !!preset.decorInsideItalic,
      insideShadow: preset.decorInsideShadow || '',
      insideFontSize: preset.decorInsideFontSize != null ? preset.decorInsideFontSize : 11,
      insideHeight: preset.decorInsideHeight != null ? preset.decorInsideHeight : 8,
      bottomShow: !!preset.decorBottomShow,
      bottomText: preset.decorBottomText != null ? preset.decorBottomText : 'НОВИНКА',
      bottomBg: preset.decorBottomBg || '#e63946',
      bottomBgImg: preset.decorBottomBgImg || 'none',
      bottomCustomBg: preset.decorBottomCustomBg || null,
      bottomColor: preset.decorBottomColor || '#ffffff',
      bottomFont: preset.decorBottomFont || '',
      bottomItalic: !!preset.decorBottomItalic,
      bottomShadow: preset.decorBottomShadow || '',
      bottomFontSize: preset.decorBottomFontSize != null ? preset.decorBottomFontSize : 14,
      bottomHeight: preset.decorBottomHeight != null ? preset.decorBottomHeight : 12
    };
    const tb = {
      headerBg: preset.headerBg || '#18181b',
      bgImage: preset.bgImage || 'none',
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
      currency: Object.assign({}, base.currency, src.currency || {}),
      bigdigit: Object.assign({}, base.bigdigit, src.bigdigit || {})
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
      pricePlate: !!preset.pricePlate,
      subtitleCorner: !!preset.subtitleCorner,
      showPrice: preset.showPrice !== false,
      titleFitFloor: preset.titleFitFloor,
      key: preset.key || '',
      widthCm: preset.widthCm || 6.5,
      heightCm: preset.heightCm || 4.5,
      wMm: (preset.widthCm || 6.5) * 10,
      hMm: (preset.heightCm || 4.5) * 10,
      priceSlotTop: preset.priceSlotTop != null ? preset.priceSlotTop : null,
      titleSlotTop: preset.titleSlotTop != null ? preset.titleSlotTop : null,
      titleZoneH: preset.titleZoneH != null ? preset.titleZoneH : null,
      digit: {
        font: preset.digitFont || "Arial, sans-serif",
        color: preset.digitColor || '#ffff00',
        size: preset.digitSize != null ? preset.digitSize : 48,
        weight: preset.digitWeight || '800'
      },
      labelPos
    };
  }

  // Создаёт чистый базовый DOM-элемент ценника без мусора и следов других шаблонов.
  function createCleanWobblerElement() {
    const el = document.createElement('div');
    el.className = 'wobbler-element';
    el.innerHTML = `
      <div class="wobbler-outside-top"><span class="block-text"></span></div>
      <div class="wobbler-inside-top"><span class="block-text"></span></div>
      <div class="crop-guides"></div>
      <div class="wobbler-header">
        <div class="header-bg-overlay"></div>
        <div class="header-content">
          <div class="wobbler-title"></div>
          <div class="wobbler-subtitle"></div>
          <div class="wobbler-price-box">
            <div class="price-box-inner">
              <span class="price-val"></span>
              <span class="price-curr"></span>
              <div class="price-cross-overlay" aria-hidden="true" style="display:none;">
                <svg viewBox="0 0 100 100" preserveAspectRatio="none">
                  <line class="cross-shadow-1" x1="2" y1="2" x2="98" y2="98" stroke="#000000" stroke-width="11" stroke-linecap="round" opacity="0.35"/>
                  <line class="cross-shadow-2" x1="98" y1="2" x2="2" y2="98" stroke="#000000" stroke-width="11" stroke-linecap="round" opacity="0.35"/>
                  <line class="cross-line-1" x1="2" y1="2" x2="98" y2="98" stroke="#e63946" stroke-width="7" stroke-linecap="round"/>
                  <line class="cross-line-2" x1="98" y1="2" x2="2" y2="98" stroke="#e63946" stroke-width="7" stroke-linecap="round"/>
                </svg>
              </div>
            </div>
          </div>
          <div class="wobbler-bigdigit"></div>
        </div>
      </div>
      <div class="wobbler-bottom" style="display:none;"></div>
      <div class="wobbler-outside-bottom"><span class="block-text"></span></div>
    `;
    return el;
  }

  // Подбирает кегль наименования для любого произвольного preset без необходимости
  // переключать активный экран на этот шаблон.
  function fitTitleSizeForPreset(text, preset) {
    if (!text || !text.trim()) return null;
    const wMm = preset.wMm || (parseFloat(preset.widthCm) || 6.5) * 10;
    const hMm = preset.hMm || (parseFloat(preset.heightCm) || 4.5) * 10;
    const ts = normTitleSafe(preset.titleSafe || preset.ts);
    const layout = preset.layout || 'full';
    const headerH = preset.headerHeight || 100;
    const rybaPib = !!(preset.priceInBottom || preset.rybaPib);
    const headerHm = layout === 'full' ? hMm : hMm * (parseFloat(headerH) || 20.45) / 100;
    const isSplit = layout === 'split';
    const padMm = (preset.borderMm > 0) ? preset.borderMm : (isSplit ? 0 : 3);
    const contentHm = isSplit ? headerHm : Math.max(1, headerHm - padMm * 2);
    const isNaturallyNoPrice = !!(preset.key === 'korona_a5' || preset.key === 'a5' || preset.key === 'novy_vkus' || preset.key === 'novinka' || preset.key === 'tomat' || preset.key === 'sladko');
    const hasPrice = !isNaturallyNoPrice && !rybaPib && !isSplit;

    let slotTop = 0;
    let tzMm = 0;
    if (isSplit) {
      slotTop = 0;
      tzMm = contentHm;
    } else if (preset.titleSlotTop != null) {
      const basePresetTs = normTitleSafe(preset.titleSafe || preset.ts);
      const isCustomizedTs = basePresetTs && (
        Math.abs(ts.top - basePresetTs.top) > 0.005 ||
        Math.abs(ts.bottom - basePresetTs.bottom) > 0.005
      );
      if (isCustomizedTs) {
        slotTop = Math.max(0, headerHm * ts.top - padMm);
        tzMm = Math.max(2, headerHm * Math.max(0.05, 1 - ts.top - ts.bottom));
      } else {
        slotTop = parseFloat(preset.titleSlotTop);
        tzMm = (preset.titleZoneH != null)
          ? parseFloat(preset.titleZoneH)
          : Math.max(2, headerHm * Math.max(0.05, 1 - ts.top - ts.bottom));
      }
    } else {
      const isTsDefault = (ts.top === 0 && ts.bottom === 0);
      if (isTsDefault) {
        tzMm = hasPrice ? (headerHm * 0.45) : contentHm;
      } else {
        tzMm = Math.max(2, headerHm * Math.max(0.05, 1 - ts.top - ts.bottom));
      }
      slotTop = Math.max(0, headerHm * ts.top - padMm);
    }
    tzMm = Math.min(tzMm, Math.max(2, contentHm - slotTop));
    const contentW_mm = Math.max(10, wMm - padMm * 2);
    const safeW_mm = wMm * (1 - ts.left - ts.right);
    const titleW_mm = Math.min(contentW_mm, safeW_mm);
    const pxPerMm = 96 / 25.4;
    const budgetW = Math.max(10, (titleW_mm - 1.5) * pxPerMm);
    const budgetH = tzMm * pxPerMm;

    if (!budgetW || !budgetH || isNaN(budgetW) || isNaN(budgetH) || budgetH <= 0 || budgetW <= 0) return null;

    const floor = preset.titleFitFloor != null ? preset.titleFitFloor : (preset.subtitleCorner ? 22 : 7);
    const family = (preset.tf && preset.tf.titleFont) || preset.titleFont || "Arial, sans-serif";
    const weight = (preset.tf && preset.tf.titleWeight) || preset.titleWeight || '800';
    const isIt = !!((preset.tf && preset.tf.titleItalic) || preset.titleItalic);

    const probe = getTitleProbe(budgetW);
    probe.style.fontFamily = family;
    probe.style.fontWeight = weight;
    probe.style.fontStyle = isIt ? 'italic' : 'normal';
    probe.textContent = formatSmartTitle(text);

    let best = floor;
    let lo = floor, hi = TITLE_FIT_MAX;
    while (lo <= hi) {
      const mid = Math.round(((lo + hi) / 2) * 2) / 2;
      probe.style.fontSize = `${mid}pt`;
      const rect = probe.getBoundingClientRect();
      const measuredH = (rect && rect.height > 0) ? rect.height : probe.offsetHeight;
      const measuredW = probe.scrollWidth;
      const clientW = probe.clientWidth || budgetW;
      const overflowsX = (measuredW - clientW) > 3.5 || measuredW > (budgetW + 6);

      if (measuredH > 0 && measuredH <= (budgetH + 1.5) && !overflowsX) {
        best = mid;
        lo = mid + 0.5;
      } else {
        hi = mid - 0.5;
      }
    }
    return best;
  }

  // Применяет к клону шрифты/decor/bg/positions под конкретный preset (а не активный).
  // Контракт тот же, что у applyItemToClone, но все глобальные чтения заменены на ctx.
  function applyTemplateStyleToClone(clone, item, ctx) {
    const { tf, td, tb, ts, layout, headerH, rybaPib, insideWidth, labelPos: presetLp, preset } = ctx;
    const wMm = ctx.wMm || 65;
    const hMm = ctx.hMm || 45;
    const lp = cloneLabelPos((item && item.labelPos) ? item.labelPos : presetLp);
    const parsedPrice = splitPriceAndCurrency(item && item.price);
    const digits = String(parsedPrice.price || '').split('');

    const tElem = clone.querySelector('.wobbler-title');
    const pElem = clone.querySelector('.price-val');
    const sElem = clone.querySelector('.wobbler-subtitle');
    const box = clone.querySelector('.wobbler-price-box');
    const curr = clone.querySelector('.price-curr');

    clone.classList.toggle('price-plate', !!ctx.pricePlate);
    clone.classList.toggle('subtitle-corner', !!ctx.subtitleCorner);
    if (box) box.style.display = ctx.showPrice === false ? 'none' : 'flex';

    if (tElem) {
      tElem.textContent = formatSmartTitle((item && item.title) || '');
      tElem.style.fontFamily = fontOf(item, 'titleFont', tf.titleFont);
      tElem.style.color = fontOf(item, 'titleColor', tf.titleColor);
      let calcTitleSize = null;
      if (item && item.titleSize != null && item.titleSize !== '') {
        calcTitleSize = item.titleSize;
      } else if (item && item.fonts && item.fonts.titleSize != null) {
        calcTitleSize = item.fonts.titleSize;
      } else {
        calcTitleSize = fitTitleSizeForPreset(item ? item.title : '', ctx) || tf.titleSize || 13;
      }
      tElem.style.fontSize = `${calcTitleSize}pt`;
      tElem.style.fontWeight = fontOf(item, 'titleWeight', tf.titleWeight);
      const isTitleItalic = fontOf(item, 'titleItalic', tf.titleItalic);
      tElem.style.fontStyle = isTitleItalic ? 'italic' : 'normal';
      tElem.classList.toggle('is-italic', !!isTitleItalic);
      tElem.style.textShadow = fontOf(item, 'titleShadow', tf.titleShadow || '');
      const tAlign = fontOf(item, 'titleAlign', tf.titleAlign);
      tElem.style.textAlign = tAlign;
      tElem.style.justifyContent = tAlign === 'left' ? 'flex-start' : (tAlign === 'right' ? 'flex-end' : 'center');
      const tOff = parseFloat(fontOf(item, 'titleOffsetY', tf.titleOffsetY)) || 0;
      const tSkew = isTitleItalic ? ' skewX(-11deg)' : '';
      tElem.style.transform = `translate(${lp.title.x}mm, ${tOff + lp.title.y}mm) rotate(${ctx.layerRotate || 0}deg)${tSkew}`;
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
    // Большая цифра (мульти-печать): значение per-item, стиль из ctx.digit (preset).
    {
      const bd = clone.querySelector('.wobbler-bigdigit');
      if (bd) {
        const bdText = ((item && item.digit) || '').trim();
        bd.style.display = bdText ? 'flex' : 'none';
        if (bdText) {
          const ds = ctx.digit || {};
          bd.style.fontFamily = ds.font || "Arial, sans-serif";
          bd.style.color = ds.color || '#ffff00';
          bd.style.fontSize = `${ds.size != null ? ds.size : 48}pt`;
          bd.style.fontWeight = ds.weight || '800';
          const bdPos = lp.bigdigit || { x: 0, y: 0 };
          bd.style.transform = `translate(${bdPos.x}mm, ${bdPos.y}mm) rotate(${ctx.layerRotate || 0}deg)`;
          const isSnekiDigit = (ctx.key === 'sneki_digit' || ctx.tb?.bgImage === 'sneki_digit_bg.jpg');
          bd.innerHTML = isSnekiDigit ? `<span class="bigdigit-num-symbol">№</span>${bdText}` : bdText;
        } else {
          bd.innerHTML = '';
        }
      }
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
      const jobCurFallback = fontOf(item, 'currency', (tf && tf.currency != null) ? tf.currency : (preset && preset.currency != null ? preset.currency : '')) || '';
      const jobCur = (parsedPrice.currency ? parsedPrice.currency : jobCurFallback).trim();
      curr.textContent = jobCur;
      curr.style.display = jobCur ? '' : 'none';
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

    // Красный крест на цене (мульти-печать)
    {
      const isCrossed = fontOf(item, 'priceCross', !!tf.priceCross);
      const crossColor = fontOf(item, 'priceCrossColor', tf.priceCrossColor || '#e63946');
      const crossWidth = fontOf(item, 'priceCrossWidth', tf.priceCrossWidth != null ? tf.priceCrossWidth : 7);
      applyCrossOverlay(box || clone.querySelector('.wobbler-price-box'), isCrossed, crossColor, crossWidth);
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
      clone.style.setProperty('--border-mm', `${ctx.borderMm}mm`);
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

    function applyCloneDecorBlock(blockEl, snap, blockWidthMm, blockHeightMm) {
      if (!blockEl) return;
      if (snap.show) {
        blockEl.style.display = 'flex';
        applyBackgroundTo(blockEl, snap.bgImg, snap.customBg, snap.bg);
        const txt = blockEl.querySelector('.block-text');
        if (txt) {
          txt.textContent = snap.text || '';
          txt.style.color = snap.color || '#ffffff';
          txt.style.fontFamily = snap.font || '';   // '' = наследуется
          txt.style.fontStyle = snap.italic ? 'italic' : 'normal';
          txt.style.textShadow = snap.shadow || '';
          const autoSize = fitDecorTextSize(snap.text, blockWidthMm, blockHeightMm, snap.font, '900', snap.italic);
          txt.style.fontSize = `${autoSize || snap.fontSize || 14}pt`;
        }
      } else {
        blockEl.style.display = 'none';
      }
    }
    applyCloneDecorBlock(clone.querySelector('.wobbler-outside-top'), outSnap, wMm, outH);
    applyCloneDecorBlock(clone.querySelector('.wobbler-inside-top'), inSnap, wMm * (parseFloat(inSnap.width != null ? inSnap.width : 50) / 100), inH);
    applyCloneDecorBlock(clone.querySelector('.wobbler-outside-bottom'), botSnap, wMm, botH);

    // Safe-зона названия — по геометрии preset (не активного).
    const _hh = layout === 'full' ? hMm : hMm * (headerH / 100);
    const _pib = (rybaPib && layout === 'split');
    const _isSplit = layout === 'split';
    const _isNaturallyNoPrice = !!(ctx.key === 'korona_a5' || ctx.key === 'a5' || ctx.key === 'novy_vkus' || ctx.key === 'novinka' || ctx.key === 'tomat' || ctx.key === 'sladko');
    const _hasPriceSlot = !_isNaturallyNoPrice && !_pib && !_isSplit;
    const _pad = (ctx.borderMm > 0) ? ctx.borderMm : (_isSplit ? 0 : 3);
    const _hw = wMm;
    const _cw = Math.max(1, _hw - _pad * 2);
    const _contentHm = _isSplit ? _hh : Math.max(1, _hh - _pad * 2);

    let _slotTop = 0;
    let _tz = 0;
    if (_isSplit) {
      _slotTop = 0;
      _tz = _contentHm;
    } else if (ctx.titleSlotTop != null) {
      const basePresetTs = normTitleSafe(ctx.titleSafe || ctx.ts);
      const isCustomizedTs = basePresetTs && (
        Math.abs(ts.top - basePresetTs.top) > 0.005 ||
        Math.abs(ts.bottom - basePresetTs.bottom) > 0.005
      );
      if (isCustomizedTs) {
        _slotTop = Math.max(0, _hh * ts.top - _pad);
        _tz = Math.max(2, _hh * Math.max(0.05, 1 - ts.top - ts.bottom));
      } else {
        _slotTop = parseFloat(ctx.titleSlotTop);
        _tz = (ctx.titleZoneH != null)
          ? parseFloat(ctx.titleZoneH)
          : Math.max(2, _hh * Math.max(0.05, 1 - ts.top - ts.bottom));
      }
    } else {
      const _isTsDefault = (ts.top === 0 && ts.bottom === 0);
      if (_isTsDefault) {
        _tz = _hasPriceSlot ? (_hh * 0.45) : _contentHm;
      } else {
        _tz = Math.max(2, _hh * Math.max(0.05, 1 - ts.top - ts.bottom));
      }
      _slotTop = Math.max(0, _hh * ts.top - _pad);
    }
    _tz = Math.min(_tz, Math.max(2, _contentHm - _slotTop));
    clone.style.setProperty('--title-zone-h', `${_tz.toFixed(2)}mm`);
    clone.style.setProperty('--title-slot-top', `${_slotTop.toFixed(2)}mm`);

    const _tw = _hw * (1 - ts.left - ts.right);
    const _swf = Math.max(0, Math.min(1, _tw / _cw));
    clone.style.setProperty('--title-safe-w', `${(_swf * 100).toFixed(2)}%`);

    let _priceTop = 0;
    if (_hasPriceSlot) {
      if (ctx.priceSlotTop != null) {
        _priceTop = parseFloat(ctx.priceSlotTop);
      } else {
        const _basePresetTs = normTitleSafe(ctx.titleSafe || ctx.ts);
        const _baseTz = (_basePresetTs && (_basePresetTs.top > 0 || _basePresetTs.bottom > 0))
          ? Math.min(_hh * 0.45, _hh * Math.max(0, 1 - _basePresetTs.top - _basePresetTs.bottom))
          : (_hh * 0.45);
        const _pSizePt = parseFloat(fontOf(item, 'priceSize', tf.priceSize)) || 40;
        const _basePriceH = _pSizePt * 0.3528 * 1.12;
        const _baseComb = _baseTz + 2.0 + _basePriceH;
        const _baselineSlotTop = Math.max(0, (_contentHm - _baseComb) / 2);
        _priceTop = _baselineSlotTop + _baseTz + 4.0;
      }
    }
    clone.style.setProperty('--price-slot-top', `${_priceTop.toFixed(2)}mm`);
  }

  // Строит клон ценника, одетый под preset (геометрия/layout/стили из preset,
  // per-item overrides из item). Возвращает { node, wMm, effH } для упаковки.
  function renderWobblerForTemplate(item, preset) {
    const ctx = buildPresetSnapshots(preset);
    const wMm = (preset.widthCm || 6.5) * 10;
    const hMm = (preset.heightCm || 4.5) * 10;
    ctx.wMm = wMm;
    ctx.hMm = hMm;

    const clone = createCleanWobblerElement();

    // Геометрия инлайн на клоне (CSS vars наследуются потомками — см. style.css).
    clone.style.setProperty('--wobbler-width', `${wMm}mm`);
    clone.style.setProperty('--wobbler-height', `${hMm}mm`);
    // Layout + header height + bottom display локально на клоне.
    clone.classList.toggle('layout-full', ctx.layout === 'full');
    clone.classList.toggle('layout-split', ctx.layout === 'split');
    const cHeader = clone.querySelector('.wobbler-header');
    if (cHeader) cHeader.style.height = ctx.layout === 'full' ? '100%' : `${ctx.headerH}%`;
    const cBottom = clone.querySelector('.wobbler-bottom');
    if (cBottom) {
      cBottom.style.display = ctx.layout === 'split' ? 'flex' : 'none';
      if (ctx.layout === 'split') {
        cBottom.style.height = `${100 - ctx.headerH}%`;
        const splitBorderColor = (ctx.tb && ctx.tb.headerBg) || '#e63946';
        cBottom.style.borderColor = splitBorderColor;
        cBottom.style.borderWidth = '1mm';
        cBottom.style.borderStyle = 'solid';
        cBottom.style.borderTop = 'none';
        cBottom.style.boxSizing = 'border-box';
      }
    }
    // price-in-bottom: переместить price-box в bottom внутри клона.
    const pib = ctx.rybaPib && ctx.layout === 'split';
    clone.classList.toggle('price-in-bottom', pib);
    const cPriceBox = clone.querySelector('.wobbler-price-box');
    if (pib) {
      if (cPriceBox && cBottom && cPriceBox.parentElement !== cBottom) cBottom.appendChild(cPriceBox);
    } else {
      const cHeaderContent = clone.querySelector('.header-content');
      if (cPriceBox && cHeaderContent && cPriceBox.parentElement !== cHeaderContent) cHeaderContent.appendChild(cPriceBox);
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
  // Резолвер путей к фоновым изображениям с полной обратной совместимостью
  function resolveBgUrl(val) {
    if (!val || val === 'none' || val === 'custom') return '';
    if (typeof extraBgMap !== 'undefined' && extraBgMap[val]) {
      return extraBgMap[val];
    }
    const clean = String(val).replace(/^bgother:/, '');
    if (clean.startsWith('data:') || clean.startsWith('http:') || clean.startsWith('https:')) {
      return clean;
    }
    if (clean.startsWith('images/')) {
      return clean;
    }
    if (clean.startsWith('bg other/')) {
      return clean.replace(/^bg other\//, 'images/');
    }
    return 'images/' + clean;
  }

  // Применяет фон (картинка или цвет) к любому целевому элементу DOM.
  // Используется для шапки воблера, карточек превью и префлайта, задавая
  // выбранную фоновую CSS-строку (для согласованности cover/position).
  function applyBackgroundTo(el, bgVal, customDataUrl, bgColor) {
    if (!el) return;
    if (bgColor != null) el.style.backgroundColor = bgColor;
    if (!bgVal || bgVal === 'none') {
      el.style.backgroundImage = 'none';
      return;
    }
    if (bgVal === 'custom' && customDataUrl) {
      el.style.backgroundImage = `url('${customDataUrl}')`;
      el.style.backgroundSize = "cover";
      el.style.backgroundPosition = "center";
      return;
    }
    const url = resolveBgUrl(bgVal);
    if (url) {
      el.style.backgroundImage = `url('${url}')`;
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
    topSubtitle.textContent = `${widthCm.toString().replace('.', ',')} × ${heightCm.toString().replace('.', ',')} см`;

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
      ? (activeItem.title != null && activeItem.title !== '' ? activeItem.title : `Товар №${activePreviewIndex + 1}`)
      : (inputTitle.value !== '' ? inputTitle.value : 'ЗАГОЛОВОК');
    // Шрифтовые значения — из активного контекста (per-item override ценника,
    // иначе templateFonts). Инпуты DOM синхронизированы с этим контекстом
    // отдельно (syncFontControlsToContext); здесь только читаем источник истины.
    const tf = templateFonts || {};
    const effTitleSize = activeItemTitleSize(activeItem);
    if (document.activeElement !== previewTitle) {
      previewTitle.textContent = formatSmartTitle(activeTitleText);
    }
    previewTitle.style.fontFamily = fontOf(activeItem, 'titleFont', tf.titleFont || titleFont.value);
    previewTitle.style.color = fontOf(activeItem, 'titleColor', tf.titleColor || titleColor.value);
    previewTitle.style.fontSize = `${effTitleSize}pt`;
    previewTitle.style.fontWeight = fontOf(activeItem, 'titleWeight', tf.titleWeight || titleWeight.value);
    const isTitleItalic = fontOf(activeItem, 'titleItalic', tf.titleItalic != null ? tf.titleItalic : !!(titleItalic && titleItalic.checked));
    previewTitle.style.fontStyle = isTitleItalic ? 'italic' : 'normal';
    previewTitle.classList.toggle('is-italic', !!isTitleItalic);
    previewTitle.style.textShadow = fontOf(activeItem, 'titleShadow', tf.titleShadow != null ? tf.titleShadow : buildShadow(titleShadow ? titleShadow.value : 0, titleShadowColor ? titleShadowColor.value : '#000000'));
    const tAlign = fontOf(activeItem, 'titleAlign', tf.titleAlign || alignState.title);
    previewTitle.style.textAlign = tAlign;
    previewTitle.style.justifyContent = tAlign === 'left' ? 'flex-start' : (tAlign === 'right' ? 'flex-end' : 'center');
    const tOffsetY = parseFloat(fontOf(activeItem, 'titleOffsetY', tf.titleOffsetY != null ? tf.titleOffsetY : titleOffsetY.value)) || 0;
    const tSkew = isTitleItalic ? ' skewX(-11deg)' : '';
    previewTitle.style.transform = `translate(${lp.title.x}mm, ${tOffsetY + lp.title.y}mm) rotate(${layerRotate}deg)${tSkew}`;
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
      if (document.activeElement !== previewSubtitle) {
        previewSubtitle.textContent = subText || '';
      }
      previewSubtitle.style.display = subText || document.activeElement === previewSubtitle ? 'block' : 'none';
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

    // Большая цифра справа: показывается ТОЛЬКО на шаблоне «Снеки с цифрой»
    if (previewBigDigit) {
      const isSnekiDigit = isSnekiDigitActive();
      const bdText = isMultiMode ? (activeItem?.digit || '') : ((document.getElementById('digitText') || {}).value || '');
      const hasDigit = isSnekiDigit && (!!bdText.trim() || document.activeElement === previewBigDigit);
      previewBigDigit.style.display = hasDigit ? 'flex' : 'none';
      if (hasDigit) {
        const dFont = document.getElementById('digitFont');
        const dColor = document.getElementById('digitColor');
        const dSize = document.getElementById('digitSize');
        const dWeight = document.getElementById('digitWeight');
        previewBigDigit.style.fontFamily = dFont ? dFont.value : "Arial, sans-serif";
        previewBigDigit.style.color = dColor ? dColor.value : '#ffff00';
        previewBigDigit.style.fontSize = `${dSize ? (parseFloat(dSize.value) || 48) : 48}pt`;
        previewBigDigit.style.fontWeight = dWeight ? dWeight.value : '800';
        const bdPos = lp.bigdigit || { x: 0, y: 0 };
        previewBigDigit.style.transform = `translate(${bdPos.x}mm, ${bdPos.y}mm) rotate(${layerRotate}deg)`;
        if (document.activeElement !== previewBigDigit) {
          previewBigDigit.innerHTML = isSnekiDigit ? `<span class="bigdigit-num-symbol">№</span>${bdText.trim()}` : bdText.trim();
        }
      } else {
        if (document.activeElement !== previewBigDigit) previewBigDigit.innerHTML = '';
      }
    }
    syncDigitControlsVisibility();

    // Update preview item badge
    renderPreviewItemBadge();
    if (typeof updatePreviewItemNav === 'function') updatePreviewItemNav();

    // Price Toggle & Custom Styling (Currency icon matches exact price font & weight!)
    if (showPriceToggle.checked) {
      priceFieldsBlock.classList.remove('price-off');
      previewPriceBox.style.display = 'flex';
      const rawPriceText = isMultiMode ? (activeItem?.price || '') : inputPrice.value.trim();
      const parsedPrice = splitPriceAndCurrency(rawPriceText);
      const activePriceText = parsedPrice.price;
      const priceCentsSup = !!(document.getElementById('priceCentsSupToggle') && document.getElementById('priceCentsSupToggle').checked);
      if (document.activeElement !== previewPrice) {
        renderPriceElement(previewPrice, activePriceText, lp.priceDigits, priceCentsSup);
      }
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

      const tfCur = (tf.currency != null) ? tf.currency : (inputCurrency ? inputCurrency.value : '');
      const curFallback = fontOf(activeItem, 'currency', tfCur) || (inputCurrency ? inputCurrency.value : '') || '';
      const curVal = (parsedPrice.currency ? parsedPrice.currency : curFallback).trim();
      previewCurrency.textContent = curVal;
      previewCurrency.style.display = curVal ? '' : 'none';
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

      // Красный крест на цене
      const isCrossed = fontOf(activeItem, 'priceCross', !!tf.priceCross || !!(priceCrossToggle && priceCrossToggle.checked));
      const crossColor = fontOf(activeItem, 'priceCrossColor', tf.priceCrossColor || (priceCrossColor ? priceCrossColor.value : '#e63946'));
      const crossWidth = fontOf(activeItem, 'priceCrossWidth', tf.priceCrossWidth != null ? tf.priceCrossWidth : (priceCrossWidth ? priceCrossWidth.value : 7));
      applyCrossOverlay(previewPriceBox, isCrossed, crossColor, crossWidth);
      if (priceCrossWidthVal && priceCrossWidth) priceCrossWidthVal.textContent = priceCrossWidth.value;
      if (priceCrossSettingsRow && priceCrossToggle) priceCrossSettingsRow.style.display = priceCrossToggle.checked ? 'flex' : 'none';

      priceSizeVal.textContent = priceSize.value;
      priceOffsetYVal.textContent = priceOffsetY.value;
      if (priceShadowVal && priceShadow) priceShadowVal.textContent = priceShadow.value;
    } else {
      priceFieldsBlock.classList.add('price-off');
      previewPriceBox.style.display = 'none';
      if (previewPrice && document.activeElement !== previewPrice) previewPrice.innerHTML = '';
      if (previewCurrency) previewCurrency.textContent = '';
      if (priceCrossSettingsRow) priceCrossSettingsRow.style.display = 'none';
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
      wobblerPreview.style.setProperty('--border-mm', `${borderMm}mm`);
    } else {
      wobblerHeader.style.padding = '';
      wobblerHeader.style.backgroundOrigin = '';
      wobblerHeader.style.backgroundClip = '';
      wobblerPreview.classList.remove('has-border');
      wobblerPreview.style.removeProperty('--border-mm');
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
      const hPercent = parseFloat(headerHeightRange.value) || 20.45;
      wobblerHeader.style.height = `${hPercent}%`;
      if (wobblerBottom) {
        wobblerBottom.style.display = 'flex';
        wobblerBottom.style.height = `${100 - hPercent}%`;
        const splitBorderColor = activeBgSnap.headerBg || '#e63946';
        wobblerBottom.style.borderColor = splitBorderColor;
        wobblerBottom.style.borderWidth = '1mm';
        wobblerBottom.style.borderStyle = 'solid';
        wobblerBottom.style.borderTop = 'none';
        wobblerBottom.style.boxSizing = 'border-box';
      }
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

    const cardWMm = (parseFloat(wobblerWidthInput ? wobblerWidthInput.value : 6.5) * 10) || 65;
    function applyDecorBlock(el, textEl, text, bgVal, customData, color, fontColor, fontSize, font, italic, shadow, blockWidthMm, blockHeightMm) {
      if (!el) return;
      el.style.display = 'flex';
      applyBackgroundTo(el, bgVal, customData, color);
      if (textEl) {
        textEl.textContent = text || '';
        textEl.style.color = fontColor || '#ffffff';
        textEl.style.fontFamily = font || '';   // '' = наследуется (как до появления настройки)
        textEl.style.fontStyle = italic ? 'italic' : 'normal';
        textEl.style.textShadow = shadow || '';
        const autoSize = fitDecorTextSize(text, blockWidthMm || cardWMm, blockHeightMm || 12, font, '900', italic);
        textEl.style.fontSize = `${autoSize || fontSize || 14}pt`;
      }
    }

    if (wobblerOutsideTop) {
      if (showOutside) {
        applyDecorBlock(wobblerOutsideTop, outsideTopText,
          activeOutsideSnap.text, activeOutsideSnap.bgImg, activeOutsideSnap.customBg,
          activeOutsideSnap.bg, activeOutsideSnap.color, activeOutsideSnap.fontSize,
          activeOutsideSnap.font, activeOutsideSnap.italic, activeOutsideSnap.shadow,
          cardWMm, outsideH);
      } else {
        wobblerOutsideTop.style.display = 'none';
      }
    }
    if (decorOutsideFontSize && decorOutsideFontSizeVal) decorOutsideFontSizeVal.textContent = decorOutsideFontSize.value;
    if (decorOutsideHeight && decorOutsideHeightVal) decorOutsideHeightVal.textContent = decorOutsideHeight.value;
    if (gapInput && gapMmVal) gapMmVal.textContent = gapInput.value;

    if (wobblerInsideTop) {
      if (showInside) {
        const insideWidthMm = cardWMm * (insideW / 100);
        applyDecorBlock(wobblerInsideTop, insideTopText,
          activeInsideSnap.text, activeInsideSnap.bgImg, activeInsideSnap.customBg,
          activeInsideSnap.bg, activeInsideSnap.color, activeInsideSnap.fontSize,
          activeInsideSnap.font, activeInsideSnap.italic, activeInsideSnap.shadow,
          insideWidthMm, insideH);
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
          activeBottomSnap.bg, activeBottomSnap.color, activeBottomSnap.fontSize,
          activeBottomSnap.font, activeBottomSnap.italic, activeBottomSnap.shadow,
          cardWMm, bottomH);
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
      : heightMm * (parseFloat(headerHeightRange.value) || 20.45) / 100;
    const priceInBottomNow = rybaPriceInBottom && selectedLayout === 'split';
    const isSplitLayout = selectedLayout === 'split';
    const hasPriceSlot = isTemplatePriceSlotAvailable(activeTemplateRef, selectedLayout, priceInBottomNow);
    const ts = resolveItemBg(activePreviewIndex).titleSafe;
    const padMm = (borderMm > 0) ? borderMm : (isSplitLayout ? 0 : 3);
    const contentW_mm = Math.max(1, widthMm - padMm * 2);
    const contentHm = isSplitLayout ? headerHm : Math.max(1, headerHm - padMm * 2);

    // 1. Позиция и высота слоя наименования (строго независимы от цены)
    const activePreset = getActivePreset();
    let slotTop = 0;
    let titleZone = 0;
    if (isSplitLayout) {
      slotTop = 0;
      titleZone = contentHm;
    } else if (activePreset && activePreset.titleSlotTop != null) {
      const basePresetTs = normTitleSafe(activePreset.titleSafe || activePreset.ts);
      const isCustomizedTs = basePresetTs && (
        Math.abs(ts.top - basePresetTs.top) > 0.005 ||
        Math.abs(ts.bottom - basePresetTs.bottom) > 0.005
      );
      if (isCustomizedTs) {
        slotTop = Math.max(0, headerHm * ts.top - padMm);
        titleZone = Math.max(2, headerHm * Math.max(0.05, 1 - ts.top - ts.bottom));
      } else {
        slotTop = parseFloat(activePreset.titleSlotTop);
        titleZone = (activePreset.titleZoneH != null)
          ? parseFloat(activePreset.titleZoneH)
          : Math.max(2, headerHm * Math.max(0.05, 1 - ts.top - ts.bottom));
      }
    } else {
      const isTsDefault = (ts.top === 0 && ts.bottom === 0);
      if (isTsDefault) {
        titleZone = hasPriceSlot ? (headerHm * 0.45) : contentHm;
      } else {
        titleZone = Math.max(2, headerHm * Math.max(0.05, 1 - ts.top - ts.bottom));
      }
      slotTop = Math.max(0, headerHm * ts.top - padMm);
    }
    titleZone = Math.min(titleZone, Math.max(2, contentHm - slotTop));
    document.documentElement.style.setProperty('--title-zone-h', `${titleZone.toFixed(2)}mm`);
    document.documentElement.style.setProperty('--title-slot-top', `${slotTop.toFixed(2)}mm`);

    // 2. Безопасная ширина названия
    const titleW_mm = widthMm * (1 - ts.left - ts.right);
    const safeWFrac = Math.max(0, Math.min(1, titleW_mm / contentW_mm));
    document.documentElement.style.setProperty('--title-safe-w', `${(safeWFrac * 100).toFixed(2)}%`);

    // 3. Позиция слоя цены: полностью изолирована от safe-зоны наименования (0.00мм сдвига при drag)
    let priceTop = 0;
    if (hasPriceSlot) {
      const activePreset = getActivePreset();
      if (activePreset && activePreset.priceSlotTop != null) {
        priceTop = parseFloat(activePreset.priceSlotTop);
      } else {
        const basePresetTs = normTitleSafe(activePreset && (activePreset.titleSafe || activePreset.ts));
        const baseTz = (basePresetTs && (basePresetTs.top > 0 || basePresetTs.bottom > 0))
          ? Math.min(headerHm * 0.45, headerHm * Math.max(0, 1 - basePresetTs.top - basePresetTs.bottom))
          : (headerHm * 0.45);
        const pSizePt = parseFloat(fontOf(activeItem, 'priceSize', tf.priceSize != null ? tf.priceSize : priceSize.value)) || 40;
        const basePriceH = pSizePt * 0.3528 * 1.12;
        const baseComb = baseTz + 2.0 + basePriceH;
        const baselineSlotTop = Math.max(0, (contentHm - baseComb) / 2);
        priceTop = baselineSlotTop + baseTz + 4.0;
      }
    } else {
      priceTop = 0;
    }
    document.documentElement.style.setProperty('--price-slot-top', `${priceTop.toFixed(2)}mm`);
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

    // Синхронизируем индикаторы активности декор-блоков на суб-табах #5
    if (typeof syncDecorTabDots === 'function') syncDecorTabDots();

    // Проверяем переполнение текста названия для показа бейджа ⚠️
    if (typeof checkTextOverflow === 'function') checkTextOverflow();

    // Синхронизируем бейджи кастомизации на вкладках сайдбара
    if (typeof updateSidebarCustomBadges === 'function') updateSidebarCustomBadges();

    // Обновляем живой статус предпечатного аудита в шапке
    if (typeof updatePreflightPill === 'function') updatePreflightPill();

    // Обновляем диагностическую Debug-плашку
    if (typeof updateDebugToolbar === 'function') updateDebugToolbar();

    // Любое значимое изменение завершается этим рендером — планируем
    // автосохранение сессии (дебаунс внутри).
    scheduleSessionSave();
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
  // --- Drag & Drop и загрузка пользовательского фона (фон ценника #4) ---
  function handleCustomBgFile(file) {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = function (event) {
      uploadedDataUrl = event.target.result;
      if (customBgOption) customBgOption.style.display = 'block';
      if (bgImageSelect) bgImageSelect.value = 'custom';
      if (uploadStatus) uploadStatus.textContent = `✓ Загружено: ${file.name}`;
      onBgInputChange();
      if (typeof syncBgGalleryActiveState === 'function') syncBgGalleryActiveState('custom');
      if (typeof renderBgGalleryGrid === 'function') renderBgGalleryGrid();
      if (typeof showToast === 'function') {
        showToast(`Фон «${file.name}» успешно установлен!`, 'success', 2500);
      }
    };
    reader.readAsDataURL(file);
  }

  customBgUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) handleCustomBgFile(file);
  });

  function initWobblerDragAndDrop() {
    const previewEl = document.getElementById('wobblerPreview');
    const containerEl = document.querySelector('.single-preview-container');
    const dropTarget = containerEl || previewEl;
    if (!dropTarget) return;

    ['dragenter', 'dragover'].forEach(eventName => {
      dropTarget.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (previewEl) previewEl.classList.add('drop-zone-active');
      }, false);
    });

    ['dragleave', 'dragend'].forEach(eventName => {
      dropTarget.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (previewEl) previewEl.classList.remove('drop-zone-active');
      }, false);
    });

    dropTarget.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (previewEl) previewEl.classList.remove('drop-zone-active');
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        handleCustomBgFile(file);
      }
    }, false);
  }

  // ===== 4.1. Визуальная галерея текстур и фонов (Этап 4) =====
  let currentBgGalleryCategory = 'all';

  const BG_GALLERY_CATALOG = [
    // --- Рыба & Море ---
    { id: 'ryba_bg.jpg', label: 'Рыба (черный)', cat: ['all', 'fish'], thumb: 'images/ryba_bg.jpg' },
    { id: 'bgother:ryba_vygodno.png', label: 'Рыба Выгодно', cat: ['all', 'fish'], file: 'images/ryba_vygodno.png' },
    { id: 'bgother:moreprodukty.png', label: 'Морепродукты', cat: ['all', 'fish'], file: 'images/moreprodukty.png' },

    // --- Снеки & Закуски ---
    { id: 'sneki_bg.jpg', label: 'Снеки', cat: ['all', 'snacks'], thumb: 'images/sneki_bg.jpg' },
    { id: 'sneki_5_bg.jpg', label: 'Снеки 5', cat: ['all', 'snacks'], thumb: 'images/sneki_5_bg.jpg' },
    { id: 'sneki_digit_bg.jpg', label: 'Снеки №', cat: ['all', 'snacks'], thumb: 'images/sneki_digit_bg.jpg' },
    { id: 'bgother:ostryi.png', label: 'Остро', cat: ['all', 'snacks'], file: 'images/ostryi.png' },
    { id: 'bgother:kalmar.png', label: 'Кальмары', cat: ['all', 'snacks'], file: 'images/kalmar.png' },
    { id: 'bgother:myaso.png', label: 'Вяленое мясо', cat: ['all', 'snacks'], file: 'images/myaso.png' },
    { id: 'bgother:syr.png', label: 'Сыр', cat: ['all', 'snacks'], file: 'images/syr.png' },
    { id: 'bgother:orehi.png', label: 'Орехи', cat: ['all', 'snacks'], file: 'images/orehi.png' },
    { id: 'bgother:grenki.png', label: 'Гренки', cat: ['all', 'snacks'], file: 'images/grenki.png' },
    { id: 'bgother:ryb_solomka.png', label: 'Рыбная соломка', cat: ['all', 'snacks'], file: 'images/ryb_solomka.png' },

    // --- Напитки ---
    { id: 'bgother:tomatnyj.png', label: 'Томатный', cat: ['all', 'drinks'], file: 'images/tomatnyj.png' },
    { id: 'bgother:vishnevyj.png', label: 'Вишневый', cat: ['all', 'drinks'], file: 'images/vishnevyj.png' },
    { id: 'bgother:medovyj.png', label: 'Медовый', cat: ['all', 'drinks'], file: 'images/medovyj.png' },
    { id: 'bgother:yablochnyj.png', label: 'Яблочный', cat: ['all', 'drinks'], file: 'images/yablochnyj.png' },
    { id: 'bgother:ba.jpg', label: 'Б/А', cat: ['all', 'drinks'], file: 'images/ba.jpg' },
    { id: 'bgother:zhivoe.jpg', label: 'Живое', cat: ['all', 'drinks'], file: 'images/zhivoe.jpg' },

    // --- Акции, ценники и плакаты ---
    { id: 'dots_bg.jpg', label: 'Точки (Alaska)', cat: ['all', 'promo'], thumb: 'images/dots_bg.jpg' },
    { id: 'yellow_bg.jpg', label: 'Желтый ценник', cat: ['all', 'promo'], thumb: 'images/yellow_bg.jpg' },
    { id: 'sort_nedeli_bg.jpg', label: 'Сорт недели (Кр)', cat: ['all', 'promo'], thumb: 'images/sort_nedeli_bg.jpg' },
    { id: 'sort_nedeli_yellow.jpg', label: 'Сорт недели (Жел)', cat: ['all', 'promo'], thumb: 'images/sort_nedeli_yellow.jpg' },
    { id: 'korona_a5_bg.jpg', label: 'Корона (Желтая)', cat: ['all', 'promo'], thumb: 'images/korona_a5_bg.jpg' },
    { id: 'korona_a5_orange.jpg', label: 'Корона (Оранж)', cat: ['all', 'promo'], thumb: 'images/korona_a5_orange.jpg' },
    { id: 'korona_a5_blue.jpg', label: 'Корона (Синяя)', cat: ['all', 'promo'], thumb: 'images/korona_a5_blue.jpg' },
    { id: 'korona_a5_red.jpg', label: 'Корона (Красная)', cat: ['all', 'promo'], thumb: 'images/korona_a5_red.jpg' },
    { id: 'korona_a5_green.jpg', label: 'Корона (Зеленая)', cat: ['all', 'promo'], thumb: 'images/korona_a5_green.jpg' },
    { id: 'a5.jpg', label: 'А5 (Желтый)', cat: ['all', 'promo'], thumb: 'images/a5.jpg' },
    { id: 'a5_orange.jpg', label: 'А5 (Оранжевый)', cat: ['all', 'promo'], thumb: 'images/a5_orange.jpg' },
    { id: 'a5_red.jpg', label: 'А5 (Красный)', cat: ['all', 'promo'], thumb: 'images/a5_red.jpg' },
    { id: 'a5_blue.jpg', label: 'А5 (Синий)', cat: ['all', 'promo'], thumb: 'images/a5_blue.jpg' },
    { id: 'a5_green.jpg', label: 'А5 (Зеленый)', cat: ['all', 'promo'], thumb: 'images/a5_green.jpg' },

    // --- Заливка и свои фото ---
    { id: 'none', label: 'Заливка цветом', cat: ['all', 'color'], thumbType: 'color' },
    { id: 'custom', label: '📁 Свое фото…', cat: ['all', 'color'], thumbType: 'custom' }
  ];

  function getActiveBgValue() {
    if (bgImageSelect) return bgImageSelect.value;
    return 'none';
  }

  function syncBgGalleryActiveState(val) {
    const targetVal = val !== undefined ? val : getActiveBgValue();
    const grid = document.getElementById('bgGalleryGrid');
    if (!grid) return;
    grid.querySelectorAll('.bg-card').forEach(card => {
      const match = (card.dataset.bg === targetVal) ||
        (targetVal === 'custom' && card.dataset.bg === 'custom') ||
        ((!targetVal || targetVal === 'none') && card.dataset.bg === 'none');
      card.classList.toggle('active', match);
    });
  }

  function renderBgGalleryGrid() {
    const grid = document.getElementById('bgGalleryGrid');
    if (!grid) return;
    grid.innerHTML = '';
    const activeVal = getActiveBgValue();

    const filtered = BG_GALLERY_CATALOG.filter(item => {
      if (currentBgGalleryCategory === 'all') return true;
      return item.cat && item.cat.includes(currentBgGalleryCategory);
    });

    filtered.forEach(item => {
      const card = document.createElement('div');
      card.className = 'bg-card';
      card.dataset.bg = item.id;
      card.title = item.label;

      if (item.thumbType === 'color') {
        const c = headerBgColor ? headerBgColor.value : '#18181b';
        card.style.background = c;
      } else if (item.thumbType === 'custom') {
        if (uploadedDataUrl) {
          card.style.backgroundImage = 'url("' + uploadedDataUrl + '")';
        } else {
          card.style.background = 'linear-gradient(135deg, #1e293b, #334155)';
          const icon = document.createElement('div');
          icon.style.cssText = 'display:flex;align-items:center;justify-content:center;height:65%;font-size:1.2rem;';
          icon.textContent = '📁';
          card.appendChild(icon);
        }
      } else {
        const url = (typeof extraBgMap !== 'undefined' && extraBgMap[item.id]) ? extraBgMap[item.id] : resolveBgUrl(item.file || item.thumb);
        card.style.backgroundImage = 'url("' + url + '")';
      }

      const labelEl = document.createElement('div');
      labelEl.className = 'bg-card-label';
      labelEl.textContent = item.label;
      card.appendChild(labelEl);

      const isActive = (item.id === activeVal) ||
        (activeVal === 'custom' && item.id === 'custom') ||
        ((!activeVal || activeVal === 'none') && item.id === 'none');
      if (isActive) card.classList.add('active');

      card.addEventListener('click', () => {
        if (item.id === 'custom') {
          if (customBgUpload) customBgUpload.click();
          return;
        }
        if (bgImageSelect) {
          let opt = bgImageSelect.querySelector(`option[value="${item.id}"]`);
          if (!opt) {
            opt = document.createElement('option');
            opt.value = item.id;
            opt.textContent = item.label;
            const extraGroup = document.getElementById('extraBgGroup');
            if (extraGroup) extraGroup.appendChild(opt);
            else bgImageSelect.appendChild(opt);
          }
          bgImageSelect.value = item.id;
          bgImageSelect.dispatchEvent(new Event('input', { bubbles: true }));
          bgImageSelect.dispatchEvent(new Event('change', { bubbles: true }));
        }
        syncBgGalleryActiveState(item.id);
        if (typeof showToast === 'function') {
          showToast(`Фон «${item.label}» выбран`, 'info', 1400);
        }
      });

      grid.appendChild(card);
    });
  }

  function initBgGallery() {
    const filters = document.getElementById('bgGalleryFilters');
    if (filters) {
      filters.querySelectorAll('.bg-filter-chip').forEach(chip => {
        chip.addEventListener('click', () => {
          filters.querySelectorAll('.bg-filter-chip').forEach(c => c.classList.remove('active'));
          chip.classList.add('active');
          currentBgGalleryCategory = chip.getAttribute('data-category') || 'all';
          renderBgGalleryGrid();
        });
      });
    }

    const toggleBtn = document.getElementById('toggleBgGalleryViewBtn');
    const gallerySection = document.getElementById('bgGallerySection');
    if (toggleBtn && gallerySection) {
      toggleBtn.addEventListener('click', () => {
        const isCollapsed = gallerySection.classList.toggle('is-collapsed');
        toggleBtn.textContent = isCollapsed ? 'Развернуть ▼' : 'Свернуть ▲';
      });
    }

    if (headerBgColor) {
      headerBgColor.addEventListener('input', () => {
        const colorCard = document.querySelector('.bg-card[data-bg="none"]');
        if (colorCard) colorCard.style.background = headerBgColor.value;
      });
    }

    renderBgGalleryGrid();
  }

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
      reader.onload = function (event) {
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
        // Очищаем legacy per-item кегль и флаг ручного размера.
        delete it.titleSize;
        delete it.titleSizeManual;
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
      showToast('Шрифты этого ценника сброшены к базовому шаблону', 'info');
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
      showToast('Оформление этого ценника сброшено к базовому шаблону', 'info');
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
      showToast('Фон этого ценника сброшен к базовому шаблону', 'info');
    });
  }

  let currentSheetPreviewPage = 0;

  function renderMultiSheetPreview() {
    sheetGridPreview.innerHTML = '';
    sheetGridPreview.classList.add('is-multi-mode');

    const gap = multiPrintGapInput ? parseFloat(multiPrintGapInput.value) || 0 : 0;
    const showCrop = !(multiPrintCropChk && !multiPrintCropChk.checked);

    const sheetHint = document.querySelector('.sheet-card-header p');
    if (sheetHint) {
      sheetHint.innerHTML = '<b>Раскладка мульти-печати:</b> здесь показаны все выбранные шаблоны так, как они будут напечатаны на листе А4. Кликните по любому ценнику, чтобы перейти к его редактированию.';
    }

    const selected = (typeof collectMultiSelection === 'function') ? collectMultiSelection() : [];
    if (!selected.length) {
      sheetCalcText.textContent = 'Мульти-печать: шаблоны не выбраны';
      const emptyMsg = document.createElement('div');
      emptyMsg.className = 'sheet-empty-hint';
      emptyMsg.innerHTML = '<span style="font-size:2.4rem; margin-bottom:8px;">🖨️</span><b>Мульти-печать включена</b><p>Отметьте нужные шаблоны в панели сверху, чтобы увидеть общий лист раскладки.</p>';
      sheetGridPreview.appendChild(emptyMsg);
      const sheetPageNav = document.getElementById('sheetPageNav');
      if (sheetPageNav) sheetPageNav.style.display = 'none';
      return;
    }

    const queue = [];
    for (const sel of selected) {
      let preset = null;
      if (activeTemplateRef && activeTemplateRef.kind === 'builtin' && activeTemplateRef.key === sel.key) {
        preset = getCurrentState();
      } else {
        preset = builtInPresets[sel.key] || null;
      }
      if (!preset) continue;

      const items = (typeof getItemsForTemplate === 'function') ? getItemsForTemplate(sel.key) : [];
      if (!items.length) continue;

      const multiplier = (sel.copies === 'auto' || !sel.copies) ? 1 : (parseInt(sel.copies, 10) || 1);
      for (let c = 0; c < multiplier; c++) {
        for (let i = 0; i < items.length; i++) {
          const it = items[i];
          const qty = Math.max(1, parseInt(it.count, 10) || 1);
          for (let q = 0; q < qty; q++) {
            queue.push({ item: it, preset, templateKey: sel.key, itemIndex: i, copyIndex: q });
          }
        }
      }
    }

    if (!queue.length) {
      sheetCalcText.textContent = 'Мульти-печать: нет заполненных товаров';
      const emptyMsg = document.createElement('div');
      emptyMsg.className = 'sheet-empty-hint';
      emptyMsg.innerHTML = '<span style="font-size:2.4rem; margin-bottom:8px;">📝</span><b>Нет товаров для мульти-печати</b><p>В отмеченных шаблонах нет заполненных строк с наименованием.</p>';
      sheetGridPreview.appendChild(emptyMsg);
      const sheetPageNav = document.getElementById('sheetPageNav');
      if (sheetPageNav) sheetPageNav.style.display = 'none';
      return;
    }

    // Рендерим каждый ценник под свой preset
    const rendered = queue.map(q => {
      const res = renderWobblerForTemplate(q.item, q.preset);
      res._queueData = q;
      return res;
    });

    // Рабочая зона А4 (поля: 10 мм верх, 4 мм низ/бока).
    const mTop = 10, mBottom = 4, mSide = 4;
    const pageW = 210 - mSide * 2;
    const pageH = 297 - mTop - mBottom - 0.5;
    const pages = packIntoPages(rendered, pageW, pageH, gap);

    const totalPages = Math.max(1, pages.length);
    if (currentSheetPreviewPage >= totalPages) currentSheetPreviewPage = totalPages - 1;
    if (currentSheetPreviewPage < 0) currentSheetPreviewPage = 0;

    const sheetPageNav = document.getElementById('sheetPageNav');
    const sheetPageIndicator = document.getElementById('sheetPageIndicator');
    const prevSheetPageBtn = document.getElementById('prevSheetPageBtn');
    const nextSheetPageBtn = document.getElementById('nextSheetPageBtn');

    if (sheetPageNav && sheetPageIndicator) {
      if (totalPages > 1) {
        sheetPageNav.style.display = 'inline-flex';
        sheetPageIndicator.textContent = `Стр. ${currentSheetPreviewPage + 1} из ${totalPages}`;
        if (prevSheetPageBtn) prevSheetPageBtn.disabled = (currentSheetPreviewPage === 0);
        if (nextSheetPageBtn) nextSheetPageBtn.disabled = (currentSheetPreviewPage >= totalPages - 1);
      } else {
        sheetPageNav.style.display = 'none';
      }
    }

    sheetCalcText.textContent = `Мульти: ${rendered.length} ценников (${selected.length} шабл.)${totalPages > 1 ? ` · ${totalPages} стр.` : ''}`;

    sheetGridPreview.style.boxSizing = 'border-box';
    sheetGridPreview.style.padding = `${mTop}mm ${mSide}mm ${mBottom}mm ${mSide}mm`;
    sheetGridPreview.style.display = 'block';
    sheetGridPreview.style.gridTemplateColumns = 'none';
    sheetGridPreview.style.gridTemplateRows = 'none';
    sheetGridPreview.style.gap = '0px';

    const curPage = pages[currentSheetPreviewPage];
    if (curPage && curPage.rows) {
      let itemSeq = 0;
      for (let p = 0; p < currentSheetPreviewPage; p++) {
        for (const r of (pages[p]?.rows || [])) itemSeq += r.items.length;
      }

      for (const row of curPage.rows) {
        const rowEl = document.createElement('div');
        rowEl.className = 'multi-print-row';
        rowEl.style.display = 'flex';
        rowEl.style.flexWrap = 'nowrap';
        rowEl.style.alignItems = 'flex-start';
        rowEl.style.height = `${row.h}mm`;
        rowEl.style.marginBottom = `${gap}mm`;

        for (const it of row.items) {
          itemSeq++;
          const wrap = document.createElement('div');
          wrap.className = 'sheet-mini-item multi-print-cell';
          wrap.style.position = 'relative';
          wrap.style.width = `${it.wMm}mm`;
          wrap.style.height = `${it.effH}mm`;
          wrap.style.marginRight = `${gap}mm`;
          wrap.style.flexShrink = '0';

          const node = it.node;
          node.removeAttribute('id');
          node.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'));
          node.classList.remove('drag-mode');

          const guides = node.querySelector('.crop-guides');
          if (guides) guides.style.display = showCrop ? '' : 'none';

          wrap.appendChild(node);

          if (showCrop) {
            const crop = document.createElement('div');
            crop.className = 'print-crop-marks';
            crop.style.pointerEvents = 'none';
            wrap.appendChild(crop);
          }

          const qData = it._queueData || {};
          const tKey = qData.templateKey || '';
          const itemObj = qData.item || {};
          const tName = (builtInPresets[tKey]?.name || builtInPresets[tKey]?.title) || tKey;
          const isCurrentActive = activeTemplateRef && activeTemplateRef.kind === 'builtin' && activeTemplateRef.key === tKey && activePreviewIndex === qData.itemIndex;

          if (isCurrentActive) {
            wrap.classList.add('active-sheet-item');
          }

          const badge = document.createElement('span');
          badge.className = 'sheet-mini-index' + (isCurrentActive ? ' active' : '');
          badge.textContent = `#${itemSeq}`;
          wrap.appendChild(badge);

          wrap.title = `№${itemSeq} [${tName}]: ${itemObj.title || 'Без названия'}${itemObj.price ? ' — ' + itemObj.price + ' ₽' : ''}\nНажмите, чтобы открыть этот шаблон и товар`;

          wrap.addEventListener('click', (e) => {
            e.stopPropagation();
            if (tKey && builtInPresets[tKey]) {
              const card = document.querySelector('#builtInTemplates .preset-card[data-preset="' + tKey + '"]');
              if (card) {
                card.click();
              }
              if (typeof setActiveItemIndex === 'function' && typeof qData.itemIndex === 'number') {
                setActiveItemIndex(qData.itemIndex, true);
              }
              if (typeof showToast === 'function') {
                showToast(`Выбран: «${tName}» | Товар №${qData.itemIndex + 1}: «${itemObj.title || 'Без названия'}»`, 'info', 2200);
              }
              const previewTarget = document.querySelector('.preview-card') || wobblerPreview;
              if (previewTarget) {
                previewTarget.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
            }
          });

          rowEl.appendChild(wrap);
        }
        sheetGridPreview.appendChild(rowEl);
      }
    }
  }

  function renderSheetPreview(wMm, hMm) {
    sheetGridPreview.innerHTML = '';

    const isMultiPrintJob = (typeof getPrintJobVal === 'function' && getPrintJobVal() === 'multi');
    if (isMultiPrintJob) {
      renderMultiSheetPreview();
      return;
    }

    sheetGridPreview.classList.remove('is-multi-mode');

    const sheetHint = document.querySelector('.sheet-card-header p');
    if (sheetHint) {
      sheetHint.innerHTML = '<b>Интерактивная карта:</b> кликните по любому ценнику на листе, чтобы выбрать его и открыть в редакторе выше. Печатаются только заполненные позиции (с наименованием).';
    }

    const effH = effectiveCardHeight(hMm); // с учётом внешнего декор-блока
    const grid = calcA4Grid(wMm, effH);

    const isMultiMode = document.querySelector('input[name="printMode"]:checked').value === 'multi';

    // В мультирежиме показываем только заполненные ценники с учётом тиража (it.count)
    let itemsToShow;
    let filledUniqueCount = 0;
    if (isMultiMode) {
      itemsToShow = [];
      itemsData.forEach((it, idx) => {
        if (it && it.title && it.title.trim()) {
          filledUniqueCount++;
          const qty = Math.max(1, parseInt(it.count, 10) || 1);
          for (let q = 0; q < qty; q++) {
            itemsToShow.push({ it, origIndex: idx, copyIndex: q });
          }
        }
      });
    } else {
      // одиночный режим: позиции из singleLabelPos
      const hasTitle = !!(inputTitle && inputTitle.value.trim());
      if (hasTitle) filledUniqueCount = 1;
      itemsToShow = [{
        it: { title: inputTitle.value.trim(), price: inputPrice.value.trim(), subtitle: (inputSubtitle ? inputSubtitle.value.trim() : ''), labelPos: singleLabelPos },
        origIndex: 0
      }];
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
      itemsToShow = Array.from({ length: count }, () => itemsToShow[0]);
    } else if (sheetCount.value !== 'auto') {
      count = Math.min(parseInt(sheetCount.value, 10), count);
      itemsToShow = itemsToShow.slice(0, count);
    }

    const maxOnSheet = Math.max(1, grid.maxCount);
    const totalPages = Math.max(1, Math.ceil(itemsToShow.length / maxOnSheet));
    if (currentSheetPreviewPage >= totalPages) currentSheetPreviewPage = totalPages - 1;
    if (currentSheetPreviewPage < 0) currentSheetPreviewPage = 0;

    const sheetPageNav = document.getElementById('sheetPageNav');
    const sheetPageIndicator = document.getElementById('sheetPageIndicator');
    const prevSheetPageBtn = document.getElementById('prevSheetPageBtn');
    const nextSheetPageBtn = document.getElementById('nextSheetPageBtn');

    if (sheetPageNav && sheetPageIndicator) {
      if (totalPages > 1) {
        sheetPageNav.style.display = 'inline-flex';
        sheetPageIndicator.textContent = `Стр. ${currentSheetPreviewPage + 1} из ${totalPages}`;
        if (prevSheetPageBtn) prevSheetPageBtn.disabled = (currentSheetPreviewPage === 0);
        if (nextSheetPageBtn) nextSheetPageBtn.disabled = (currentSheetPreviewPage >= totalPages - 1);
      } else {
        sheetPageNav.style.display = 'none';
      }
    }

    // Обновляем сводные метрики Print Hub и класс альбомной ориентации
    updatePrintHubMetrics(grid, itemsToShow.length, filledUniqueCount, totalPages);
    sheetGridPreview.classList.toggle('is-landscape', grid.isLandscape);

    const orientTag = grid.isLandscape ? 'Альбомная' : 'Книжная';
    const autoExtra = (grid.mode === 'auto' && grid.benefit > 0) ? ` (+${grid.benefit} на листе)` : '';
    sheetCalcText.textContent = `${itemsToShow.length} заполнено · ${orientTag}${autoExtra} · влезает ${grid.maxCount}/лист (${grid.cols}×${grid.rows})${totalPages > 1 ? ` · ${totalPages} стр.` : ''}`;
    sheetGridPreview.style.boxSizing = 'border-box';
    sheetGridPreview.style.padding = '10mm 4mm 4mm 4mm';
    sheetGridPreview.style.display = 'grid';
    sheetGridPreview.style.gridTemplateColumns = `repeat(${grid.cols}, ${wMm}mm)`;
    sheetGridPreview.style.gridTemplateRows = `repeat(${grid.rows}, ${effH}mm)`;
    sheetGridPreview.style.gap = gapMm() + 'mm';

    const startIdx = currentSheetPreviewPage * grid.maxCount;
    const pageItems = itemsToShow.slice(startIdx, startIdx + grid.maxCount);

    if (pageItems.length === 0) {
      sheetGridPreview.style.position = 'relative';
      for (let g = 0; g < grid.maxCount; g++) {
        const ghost = document.createElement('div');
        ghost.className = 'sheet-mini-ghost';
        ghost.style.width = `${wMm}mm`;
        ghost.style.height = `${effH}mm`;
        ghost.innerHTML = `
          <span class="ghost-slot-num">№${g + 1}</span>
          <span class="ghost-slot-size">${wMm}×${effH.toFixed(0)} мм</span>
        `;
        ghost.title = `Слот №${g + 1} (свободен)\nНажмите, чтобы открыть таблицу товаров`;
        ghost.addEventListener('click', () => {
          if (typeof openItemsDrawer === 'function') openItemsDrawer();
        });
        sheetGridPreview.appendChild(ghost);
      }
      const banner = document.createElement('div');
      banner.className = 'sheet-blueprint-banner';
      banner.innerHTML = `
        <div class="sbb-icon"><svg class="ico"><use href="#i-grid"/></svg></div>
        <div class="sbb-text">
          <h4>Лист А4 готов к раскладке</h4>
          <p>Формат: ${wMm / 10} × ${(effH / 10).toFixed(1)} см • Сетка: <b>${grid.cols} × ${grid.rows} = ${grid.maxCount} шт./лист</b></p>
        </div>
        <button type="button" class="btn btn-primary btn-sm sbb-btn" id="sheetFillItemsBtn">
          <svg class="ico"><use href="#i-clipboard"/></svg> Открыть список товаров
        </button>
      `;
      const fillBtn = banner.querySelector('#sheetFillItemsBtn');
      if (fillBtn) {
        fillBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (typeof openItemsDrawer === 'function') openItemsDrawer();
        });
      }
      sheetGridPreview.appendChild(banner);
    } else {
      for (let i = 0; i < pageItems.length; i++) {
        const entry = pageItems[i];
        const item = (entry && entry.it) ? entry.it : (entry || { title: '', price: '' });
        const origIndex = (entry && typeof entry.origIndex === 'number') ? entry.origIndex : (isMultiMode ? itemsData.indexOf(item) : 0);

        const itemWrapper = document.createElement('div');
        itemWrapper.className = 'sheet-mini-item';
        itemWrapper.style.position = 'relative';
        itemWrapper.style.width = `${wMm}mm`;
        itemWrapper.style.height = `${effH}mm`;

        const cloned = wobblerPreview.cloneNode(true);
        cloned.removeAttribute('id');
        cloned.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'));
        cloned.classList.remove('drag-mode');

        // Применяем тексты и позиции конкретного товара к клону.
        applyItemToClone(cloned, item, titleOffsetY.value, priceOffsetY.value);

        itemWrapper.appendChild(cloned);

        if (isMultiMode) {
          if (origIndex !== -1) {
            const isActive = (origIndex === activePreviewIndex);
            if (isActive) {
              itemWrapper.classList.add('active-sheet-item');
            }
            const badge = document.createElement('span');
            badge.className = 'sheet-mini-index' + (isActive ? ' active' : '');
            badge.textContent = `#${origIndex + 1}`;
            itemWrapper.appendChild(badge);

            const copyStr = (entry && entry.copyIndex !== undefined) ? ` (копия ${entry.copyIndex + 1})` : '';
            itemWrapper.title = `№${origIndex + 1}${copyStr}: ${item.title || 'Без названия'}${item.price ? ' — ' + item.price + ' ₽' : ''}\nНажмите, чтобы открыть в редакторе и подсветить в таблице`;
            itemWrapper.addEventListener('click', (e) => {
              e.stopPropagation();
              if (typeof setActiveItemIndex === 'function') {
                setActiveItemIndex(origIndex, true);
              }
              if (typeof focusItemTableRow === 'function') {
                focusItemTableRow(origIndex);
              }
              if (typeof showToast === 'function') {
                showToast(`Выбран товар №${origIndex + 1}: «${item.title || 'Без названия'}»`, 'info', 1800);
              }
              const workspacePanelEl = document.querySelector('.workspace-panel');
              const isSheetMode = workspacePanelEl && workspacePanelEl.classList.contains('view-sheet-mode');
              if (!isSheetMode) {
                const previewTarget = document.querySelector('.preview-card') || wobblerPreview;
                if (previewTarget) {
                  previewTarget.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
              }
            });
          }
        } else {
          const badge = document.createElement('span');
          badge.className = 'sheet-mini-index';
          badge.textContent = `#${i + 1}`;
          itemWrapper.appendChild(badge);

          itemWrapper.title = `Ценник на листе (${item.title || 'Текущий'})\nНажмите для перехода к редактору`;
          itemWrapper.addEventListener('click', () => {
            const workspacePanelEl = document.querySelector('.workspace-panel');
            const isSheetMode = workspacePanelEl && workspacePanelEl.classList.contains('view-sheet-mode');
            if (!isSheetMode) {
              const previewTarget = document.querySelector('.preview-card') || wobblerPreview;
              if (previewTarget) {
                previewTarget.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
            }
          });
        }

        if (showCropMarks.checked) {
          if (cloned.classList.contains('has-border')) {
            const outerGuide = document.createElement('div');
            outerGuide.className = 'print-crop-marks';
            outerGuide.style.pointerEvents = 'none';
            itemWrapper.appendChild(outerGuide);
          }
        } else {
          const guides = itemWrapper.querySelector('.crop-guides');
          if (guides) guides.style.display = 'none';
        }

        sheetGridPreview.appendChild(itemWrapper);
      }

      // Дополняем оставшиеся ячейки на листе контурами сетки
      for (let g = pageItems.length; g < grid.maxCount; g++) {
        const ghost = document.createElement('div');
        ghost.className = 'sheet-mini-ghost';
        ghost.style.width = `${wMm}mm`;
        ghost.style.height = `${effH}mm`;
        ghost.innerHTML = `
          <span class="ghost-slot-num">№${startIdx + g + 1}</span>
          <span class="ghost-slot-size">${wMm}×${effH.toFixed(0)} мм</span>
        `;
        ghost.title = `Слот №${startIdx + g + 1} (свободен)\nНажмите, чтобы добавить товар`;
        ghost.addEventListener('click', () => {
          if (typeof openItemsDrawer === 'function') openItemsDrawer();
        });
        sheetGridPreview.appendChild(ghost);
      }
    }
    updateItemsStatsBadge();
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

    // Управляем динамической ориентацией печати в CSS и на body
    document.body.classList.toggle('print-landscape', grid.isLandscape);
    let dynPrintStyle = document.getElementById('dynamicPrintPageOrientation');
    if (!dynPrintStyle) {
      dynPrintStyle = document.createElement('style');
      dynPrintStyle.id = 'dynamicPrintPageOrientation';
      document.head.appendChild(dynPrintStyle);
    }
    dynPrintStyle.textContent = `@page { size: A4 ${grid.isLandscape ? 'landscape' : 'portrait'}; margin: 0; }`;

    const isMultiMode = document.querySelector('input[name="printMode"]:checked').value === 'multi';

    // В мультирежиме печатаем только заполненные ценники (есть наименование).
    // В режиме одного товара дублируем выбранный ценник N раз (singleRepeatCount).
    let itemsToPrint;
    if (isMultiMode) {
      itemsToPrint = [];
      itemsData.forEach(it => {
        if (it && it.title && it.title.trim()) {
          const qty = Math.max(1, parseInt(it.count, 10) || 1);
          for (let q = 0; q < qty; q++) {
            itemsToPrint.push(it);
          }
        }
      });
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
      page.style.setProperty('padding', '10mm 4mm 4mm 4mm', 'important');
      if (grid.isLandscape) {
        page.style.setProperty('width', '297mm', 'important');
        page.style.setProperty('height', '210mm', 'important');
        page.style.setProperty('max-height', '210mm', 'important');
      } else {
        page.style.setProperty('width', '210mm', 'important');
        page.style.setProperty('height', '297mm', 'important');
        page.style.setProperty('max-height', '297mm', 'important');
      }
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
        // Дубликаты внутренних id ломают getElementById — см. renderWobblerForTemplate.
        cleanWobbler.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'));
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
    try {
      const isMultiMode = document.querySelector('input[name="printMode"]:checked').value === 'multi';
      if (isMultiMode) {
        const filled = itemsData.filter(it => it && it.title && it.title.trim());
        if (!filled.length) {
          alert('Нет заполненных ценников для печати. Введите наименование товара.');
          return;
        }
      } else {
        if (!inputTitle.value.trim()) {
          alert('Введите наименование товара для печати.');
          return;
        }
      }
      preparePrintArea();
      document.body.classList.add('is-printing');
      const cleanup = () => {
        document.body.classList.remove('is-printing');
      };
      window.addEventListener('afterprint', cleanup, { once: true });
      const launchPrint = () => {
        try {
          window.print();
        } catch (e) {
          console.error('window.print error:', e);
        }
        setTimeout(cleanup, 1200);
      };
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => setTimeout(launchPrint, 250)).catch(() => setTimeout(launchPrint, 250));
      } else {
        setTimeout(launchPrint, 250);
      }
    } catch (err) {
      console.error('triggerPrint error:', err);
      alert('Ошибка при подготовке к печати: ' + (err.message || err));
      document.body.classList.remove('is-printing');
    }
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
      if (!curRow.length) return;
      curRows.push({ items: curRow, h: curRowH });
      curY += curRowH + gap;
      curRow = [];
      curRowH = 0;
      curRowW = 0;
    };

    for (const it of items) {
      const addW = it.wMm + (curRow.length ? gap : 0);
      const projH = Math.max(curRowH, it.effH);

      // Если в текущий ряд не помещается по ширине — завершаем текущий ряд
      if (curRow.length > 0 && curRowW + addW > pageW + 0.001) {
        flushRow();
      }

      // Если ряд пуст — проверяем, помещается ли этот новый ряд на текущую страницу
      if (curRow.length === 0) {
        if (curRows.length > 0 && curY + it.effH > pageH + 0.001) {
          pages.push({ rows: curRows });
          curRows = [];
          curY = 0;
        }
      } else {
        // Если ряд уже начат, но новый элемент увеличивает высоту ряда так, что он не влезет на страницу
        if (curRows.length > 0 && curY + projH > pageH + 0.001) {
          flushRow();
          pages.push({ rows: curRows });
          curRows = [];
          curY = 0;
        }
      }

      curRow.push(it);
      curRowH = Math.max(curRowH, it.effH);
      curRowW = (curRow.length === 1) ? it.wMm : (curRowW + addW);
    }

    flushRow();
    if (curRows.length > 0) {
      pages.push({ rows: curRows });
    }

    return pages.length ? pages : (items.length ? [{ rows: [] }] : []);
  }

  // Получает список товаров для шаблона: если в templateItems[key] есть заполненные строки (с непустым наименованием),
  // возвращает их. Для активного шаблона в режиме «Один товар» (single) берёт товар из поля ввода (если введено наименование).
  // Если товары не заполнены — возвращает пустой массив [], не подставляя фиктивный дефолт из пресета.
  function getItemsForTemplate(key) {
    const isMultiMode = document.querySelector('input[name="printMode"]:checked')?.value === 'multi';
    const isActive = activeTemplateRef && activeTemplateRef.kind === 'builtin' && activeTemplateRef.key === key;

    if (isActive && !isMultiMode) {
      const title = (inputTitle ? inputTitle.value : '').trim();
      if (title) {
        const price = (inputPrice ? inputPrice.value : '').trim();
        const subtitle = (inputSubtitle ? inputSubtitle.value : '').trim();
        const inputBigDigit = document.getElementById('inputBigDigit');
        const digit = (inputBigDigit ? inputBigDigit.value : '').trim();
        let repCount = 1;
        if (singleRepeatCount) {
          if (singleRepeatCount.value === 'auto') {
            const p = getCurrentState();
            const effH = effectiveCardHeight((p.heightCm || 3.5) * 10);
            const grid = calcA4Grid((p.widthCm || 6.5) * 10, effH);
            repCount = grid.maxCount;
          } else {
            const rep = parseInt(singleRepeatCount.value, 10);
            if (!isNaN(rep) && rep > 0) repCount = rep;
          }
        }
        return [{ title, price, subtitle, digit, labelPos: singleLabelPos, count: repCount }];
      }
      return [];
    }

    const arr = templateItems[key] || [];
    return arr.filter(it => it && it.title && it.title.trim());
  }

  // Собирает очередь ценников из отмеченных шаблонов, рендерит каждый под свой preset,
  // упаковывает и строит DOM в #printArea. gap — зазор между ценниками (мм).
  function prepareMultiPrintArea(selected, gap, showCrop) {
    printArea.innerHTML = '';
    // selected: [{ key, copies }] — copies='auto' = все заполненные.
    const queue = [];
    for (const sel of selected) {
      let preset = null;
      if (activeTemplateRef && activeTemplateRef.kind === 'builtin' && activeTemplateRef.key === sel.key) {
        preset = getCurrentState();
      } else {
        preset = builtInPresets[sel.key] || null;
      }
      if (!preset) continue;

      const items = getItemsForTemplate(sel.key);
      if (!items.length) continue;

      const multiplier = (sel.copies === 'auto' || !sel.copies) ? 1 : (parseInt(sel.copies, 10) || 1);
      for (let c = 0; c < multiplier; c++) {
        for (let i = 0; i < items.length; i++) {
          const it = items[i];
          const qty = Math.max(1, parseInt(it.count, 10) || 1);
          for (let q = 0; q < qty; q++) {
            queue.push({ item: it, preset });
          }
        }
      }
    }
    if (!queue.length) return { count: 0, pages: 0 };

    // Рендерим каждый ценник под свой preset.
    const rendered = queue.map(q => renderWobblerForTemplate(q.item, q.preset));

    // Рабочая зона А4 (поля: 10 мм верх, 4 мм низ/бока). Запас 0.5 мм для исключения случайного разрыва страниц браузером.
    const mTop = 10, mBottom = 4, mSide = 4;
    const pageW = 210 - mSide * 2;
    const pageH = 297 - mTop - mBottom - 0.5;
    const pages = packIntoPages(rendered, pageW, pageH, gap);

    // Строим DOM: страница → строки (flex) → обёртки ценников с явными размерами.
    for (let pageIdx = 0; pageIdx < pages.length; pageIdx++) {
      const page = pages[pageIdx];
      const isLast = (pageIdx === pages.length - 1);
      const pageEl = document.createElement('div');
      pageEl.className = 'print-page multi-print-page';
      pageEl.style.setProperty('padding', `${mTop}mm ${mSide}mm ${mBottom}mm ${mSide}mm`, 'important');
      pageEl.style.setProperty('box-sizing', 'border-box', 'important');
      pageEl.style.setProperty('width', '210mm', 'important');
      pageEl.style.setProperty('height', '297mm', 'important');
      pageEl.style.setProperty('max-height', '297mm', 'important');
      pageEl.style.setProperty('overflow', 'hidden', 'important');
      pageEl.style.setProperty('page-break-after', isLast ? 'auto' : 'always', 'important');
      pageEl.style.setProperty('break-after', isLast ? 'auto' : 'page', 'important');
      pageEl.style.setProperty('page-break-inside', 'avoid', 'important');
      pageEl.style.setProperty('break-inside', 'avoid', 'important');
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
    try {
      const res = prepareMultiPrintArea(selected, gap, showCrop);
      if (!res || !res.count) {
        alert('Нет заполненных ценников в выбранных шаблонах.');
        return { count: 0, pages: 0 };
      }
      document.body.classList.add('is-printing');
      const cleanup = () => {
        document.body.classList.remove('is-printing');
      };
      window.addEventListener('afterprint', cleanup, { once: true });
      const launchPrint = () => {
        try {
          window.print();
        } catch (e) {
          console.error('window.print error:', e);
        }
        setTimeout(cleanup, 1200);
      };
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => setTimeout(launchPrint, 250)).catch(() => setTimeout(launchPrint, 250));
      } else {
        setTimeout(launchPrint, 250);
      }
      return res;
    } catch (err) {
      console.error('triggerMultiPrint error:', err);
      alert('Ошибка при подготовке к мульти-печати: ' + (err.message || err));
      document.body.classList.remove('is-printing');
    }
  }

  // Кэш base64 DataURL для безопасного экспорта без CORS/Taint ошибок
  const _bgDataUrlCache = new Map();

  async function urlToDataUrl(url) {
    if (!url || typeof url !== 'string' || url.startsWith('data:')) return url;
    const cleanUrl = url.trim();
    if (_bgDataUrlCache.has(cleanUrl)) return _bgDataUrlCache.get(cleanUrl);

    // 1. Первичный метод: fetch -> blob -> FileReader (надежно работает на сервере и localhost)
    try {
      const res = await fetch(cleanUrl);
      if (res && res.ok) {
        const blob = await res.blob();
        const dataUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = () => resolve(null);
          reader.readAsDataURL(blob);
        });
        if (dataUrl && typeof dataUrl === 'string' && dataUrl.startsWith('data:')) {
          _bgDataUrlCache.set(cleanUrl, dataUrl);
          return dataUrl;
        }
      }
    } catch (e) {
      // Игнорируем и пробуем второй способ
    }

    // 2. Вторичный метод: Image + Canvas (без crossOrigin)
    try {
      const dataUrl = await new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth || img.width;
            canvas.height = img.naturalHeight || img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            const res = canvas.toDataURL('image/jpeg', 0.95);
            resolve(res);
          } catch (e) {
            reject(e);
          }
        };
        img.onerror = (e) => reject(e);
        img.src = cleanUrl;
      });
      if (dataUrl && typeof dataUrl === 'string' && dataUrl.startsWith('data:')) {
        _bgDataUrlCache.set(cleanUrl, dataUrl);
        return dataUrl;
      }
    } catch (err) {
      // Fallback
    }

    return cleanUrl;
  }

  async function inlineAllBackgroundImages(container) {
    const elements = [container, ...container.querySelectorAll('*')];
    const promises = [];

    const processEl = async (el) => {
      const bg = el.style.backgroundImage || window.getComputedStyle(el).backgroundImage;
      if (!bg || bg === 'none' || !bg.includes('url(')) return;

      const match = bg.match(/url\(["']?([^"']+)["']?\)/);
      if (!match || !match[1] || match[1].startsWith('data:')) return;

      const url = match[1];
      const dataUrl = await urlToDataUrl(url);
      if (dataUrl && typeof dataUrl === 'string' && dataUrl.startsWith('data:')) {
        el.style.backgroundImage = `url("${dataUrl}")`;
      }
    };

    elements.forEach(el => promises.push(processEl(el)));
    await Promise.all(promises);
  }

  // Прямое скачивание готового PDF (A4) со всеми фонами и графикой без диалога браузера
  async function downloadPrintAreaPdf(isMulti = false) {
    if (typeof html2pdf === 'undefined') {
      alert('Библиотека генерации PDF загружается, пожалуйста, повторите через пару секунд.');
      return;
    }

    if (isMulti) {
      const selected = collectMultiSelection();
      if (!selected.length) {
        alert('Отметьте хотя бы один шаблон для PDF.');
        return;
      }
      const gap = multiPrintGapInput ? parseFloat(multiPrintGapInput.value) || 0 : 0;
      const showCrop = !(multiPrintCropChk && !multiPrintCropChk.checked);
      const res = prepareMultiPrintArea(selected, gap, showCrop);
      if (!res || !res.count) {
        alert('Нет заполненных ценников в выбранных шаблонах.');
        return;
      }
    } else {
      const isMultiMode = document.querySelector('input[name="printMode"]:checked')?.value === 'multi';
      if (isMultiMode) {
        const filled = itemsData.filter(it => it && it.title && it.title.trim());
        if (!filled.length) {
          alert('Нет заполненных ценников для PDF. Введите наименование товара.');
          return;
        }
      } else {
        if (!inputTitle.value.trim()) {
          alert('Введите наименование товара для PDF.');
          return;
        }
      }
      preparePrintArea();
    }

    const pages = printArea.querySelectorAll('.print-page');
    if (!pages.length) {
      alert('Нет страниц для сохранения.');
      return;
    }

    const allPdfBtns = [downloadPdfBtn, downloadPdfBtnSidebar, downloadMultiPdfBtnSidebar, downloadMultiPdfBtnDrawer].filter(Boolean);
    const origMap = new Map();
    allPdfBtns.forEach(b => {
      origMap.set(b, b.innerHTML);
      b.disabled = true;
      b.innerHTML = '<span class="icon">⏳</span> <span class="btn-text">Создание PDF...</span>';
    });

    const wCm = parseFloat(wobblerWidthInput ? wobblerWidthInput.value : 6.5) || 6.5;
    const hCm = parseFloat(wobblerHeightInput ? wobblerHeightInput.value : 4.5) || 4.5;
    const effH = effectiveCardHeight(hCm * 10);
    const grid = calcA4Grid(wCm * 10, effH);
    const isLandscape = !isMulti && grid.isLandscape;
    const wrapperW = isLandscape ? '297mm' : '210mm';

    // Создаем чистый видимый контейнер для захвата html2pdf БЕЗ класса print-only
    const exportWrapper = document.createElement('div');
    exportWrapper.id = 'pdfExportWrapper';
    exportWrapper.className = 'pdf-export-flow';
    exportWrapper.style.cssText = `display: block; position: absolute; left: 0; top: 0; width: ${wrapperW}; background: #ffffff; z-index: 999999; margin: 0; padding: 0; box-sizing: border-box; overflow: visible;`;

    pages.forEach(p => {
      const pageClone = p.cloneNode(true);
      exportWrapper.appendChild(pageClone);
    });

    // Преобразуем все фоновые картинки в безопасные Base64 DataURL
    await inlineAllBackgroundImages(exportWrapper);

    document.body.appendChild(exportWrapper);

    const dateStr = new Date().toISOString().slice(0, 10);
    const activePreset = (activeTemplateRef && activeTemplateRef.kind === 'builtin') ? builtInPresets[activeTemplateRef.key] : null;
    const tName = isMulti ? 'Мульти_Ценники' : ((activePreset && activePreset.name) || 'Ценники');
    const filename = `${tName}_А4_${dateStr}.pdf`;

    const opt = {
      margin: 0,
      filename: filename,
      image: { type: 'jpeg', quality: 0.95 },
      html2canvas: {
        scale: 2.5,
        useCORS: true,
        allowTaint: false,
        logging: false,
        backgroundColor: '#ffffff'
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: isLandscape ? 'landscape' : 'portrait' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    try {
      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
      }
      await new Promise(r => setTimeout(r, 250));
      await html2pdf().set(opt).from(exportWrapper).save();
    } catch (err) {
      console.error('html2pdf error:', err);
      if (err && err.message && err.message.includes('Tainted')) {
        alert('Политика безопасности браузера для локальных файлов (file://) защищает фоновые картинки от прямого сохранения скриптом.\n\nЗапускаем системную печать: выберите в меню «Сохранить как PDF» — все фоны и ценники будут сохранены с максимальным качеством!');
        if (isMulti) runMultiPrintFromUI();
        else triggerPrint();
      } else {
        alert('Ошибка при сохранении PDF: ' + (err.message || err));
      }
    } finally {
      if (exportWrapper.parentNode) {
        exportWrapper.parentNode.removeChild(exportWrapper);
      }
      allPdfBtns.forEach(b => {
        b.disabled = false;
        b.innerHTML = origMap.get(b) || '<svg class="ico"><use href="#i-download"/></svg> Скачать PDF';
      });
    }
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
    if (inputSubtitle) {
      inputSubtitle.value = state.subtitle || '';
      delete inputSubtitle.dataset.manual;
    }
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
      currency: (state.currency !== undefined && state.currency !== null) ? String(state.currency) : '',
      priceCross: !!state.priceCross,
      priceCrossColor: state.priceCrossColor || '#e63946',
      priceCrossWidth: state.priceCrossWidth != null ? state.priceCrossWidth : 7
    };
    // inputCurrency/inputPrice — это текстовые поля ценника, а не шрифтовые настройки;
    // синхронизируем их напрямую из state.
    if (inputCurrency) inputCurrency.value = templateFonts.currency || '';
    inputPrice.value = state.price || '350';
    // Слой «большая цифра» (напр. «Снеки с цифрой»): стили — шаблонные,
    // значение per-item/single — заполняется отдельно (таблица / вкладка «Цифра»).
    {
      const dText = document.getElementById('digitText');
      const dFont = document.getElementById('digitFont');
      const dColor = document.getElementById('digitColor');
      const dSize = document.getElementById('digitSize');
      const dWeight = document.getElementById('digitWeight');
      // Single-режим: значение берём из state.digit (дефолт пресета).
      if (dText) dText.value = state.digit != null ? String(state.digit) : '';
      if (dFont) dFont.value = state.digitFont || "Arial, sans-serif";
      if (dColor) dColor.value = state.digitColor || '#ffff00';
      if (dSize) dSize.value = state.digitSize != null ? state.digitSize : 48;
      if (dWeight) dWeight.value = state.digitWeight || '800';
      const dSizeVal = document.getElementById('digitSizeVal');
      if (dSizeVal) dSizeVal.textContent = (state.digitSize != null ? state.digitSize : 48);
    }
    syncTitleSizePreview();

    // Инициализируем templateBg (фон #4) и templateDecor (декор-блоки #5) из state.
    // Это независимые модели; syncBgControlsToContext/syncDecorControlsToContext
    // (в конце applyState) синхронизируют инпуты.
    templateBg = {
      headerBg: state.headerBg || '#18181b',
      bgImage: state.bgImage || 'none',
      customBgData: state.customBgData || null
    };
    templateDecor = {
      outsideShow: !!state.decorOutsideShow,
      outsideText: state.decorOutsideText != null ? state.decorOutsideText : 'НОВИНКА',
      outsideBg: state.decorOutsideBg || '#e63946',
      outsideBgImg: state.decorOutsideBgImg || 'none',
      outsideCustomBg: state.decorOutsideCustomBg || null,
      outsideColor: state.decorOutsideColor || '#ffffff',
      outsideFont: state.decorOutsideFont || '',
      outsideItalic: !!state.decorOutsideItalic,
      outsideShadow: state.decorOutsideShadow || '',
      outsideFontSize: state.decorOutsideFontSize != null ? state.decorOutsideFontSize : 14,
      outsideHeight: state.decorOutsideHeight != null ? state.decorOutsideHeight : 12,
      insideShow: !!state.decorInsideShow,
      insideText: state.decorInsideText != null ? state.decorInsideText : 'НОВИНКА',
      insideBg: state.decorInsideBg || '#e63946',
      insideBgImg: state.decorInsideBgImg || 'none',
      insideCustomBg: state.decorInsideCustomBg || null,
      insideColor: state.decorInsideColor || '#ffffff',
      insideFont: state.decorInsideFont || '',
      insideItalic: !!state.decorInsideItalic,
      insideShadow: state.decorInsideShadow || '',
      insideFontSize: state.decorInsideFontSize != null ? state.decorInsideFontSize : 11,
      insideHeight: state.decorInsideHeight != null ? state.decorInsideHeight : 8,
      bottomShow: !!state.decorBottomShow,
      bottomText: state.decorBottomText != null ? state.decorBottomText : 'НОВИНКА',
      bottomBg: state.decorBottomBg || '#e63946',
      bottomBgImg: state.decorBottomBgImg || 'none',
      bottomCustomBg: state.decorBottomCustomBg || null,
      bottomColor: state.decorBottomColor || '#ffffff',
      bottomFont: state.decorBottomFont || '',
      bottomItalic: !!state.decorBottomItalic,
      bottomShadow: state.decorBottomShadow || '',
      bottomFontSize: state.decorBottomFontSize != null ? state.decorBottomFontSize : 14,
      bottomHeight: state.decorBottomHeight != null ? state.decorBottomHeight : 12
    };
    // insideWidth — только шаблонный (не в snapshot), пишем напрямую в контрол.
    if (decorInsideWidth) decorInsideWidth.value = state.decorInsideWidth != null ? state.decorInsideWidth : 50;
    // Глобальное положение блока двухблочных пресетов (СВЕРХУ/СНИЗУ).
    decorBlockPos = state.decorBlockPos === 'bottom' ? 'bottom' : 'top';
    refreshDecorPosBtn();

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

    if (activeTemplateRef && activeTemplateRef.kind === 'builtin' && builtInPresets[activeTemplateRef.key]) {
      const bp = builtInPresets[activeTemplateRef.key];
      if (bp.priceSlotTop != null) activeTemplateRef.priceSlotTop = parseFloat(bp.priceSlotTop);
      if (bp.titleSlotTop != null) activeTemplateRef.titleSlotTop = parseFloat(bp.titleSlotTop);
      if (bp.titleZoneH != null) activeTemplateRef.titleZoneH = parseFloat(bp.titleZoneH);
    } else {
      if (state.priceSlotTop != null && activeTemplateRef) {
        activeTemplateRef.priceSlotTop = parseFloat(state.priceSlotTop);
      }
      if (state.titleSlotTop != null && activeTemplateRef) {
        activeTemplateRef.titleSlotTop = parseFloat(state.titleSlotTop);
      }
      if (state.titleZoneH != null && activeTemplateRef) {
        activeTemplateRef.titleZoneH = parseFloat(state.titleZoneH);
      }
    }

    if (state.autofitTitleOnly !== undefined && activeTemplateRef) {
      activeTemplateRef.autofitTitleOnly = !!state.autofitTitleOnly;
    }

    // Размещение цены: в нижнем блоке (для шаблонов типа «Рыба») или в верхнем
    rybaPriceInBottom = !!state.priceInBottom;
    // Подзаголовок (вес) в нижнем левом углу
    subtitleCorner = !!state.subtitleCorner;
    // Отображение цены
    if (showPriceToggle) showPriceToggle.checked = state.showPrice !== false;
    // Светлая плашка под ценой
    if (pricePlateToggle) pricePlateToggle.checked = !!state.pricePlate;
    // Красный крест на цене
    if (priceCrossToggle) priceCrossToggle.checked = !!state.priceCross;
    if (priceCrossColor) priceCrossColor.value = state.priceCrossColor || '#e63946';
    if (priceCrossWidth) {
      priceCrossWidth.value = state.priceCrossWidth != null ? state.priceCrossWidth : 7;
      if (priceCrossWidthVal) priceCrossWidthVal.textContent = priceCrossWidth.value;
    }
    if (priceCrossSettingsRow && priceCrossToggle) {
      priceCrossSettingsRow.style.display = priceCrossToggle.checked ? 'flex' : 'none';
    }
    refreshAllCrossBtnStates();

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
        currency: Object.assign(base.currency, src.currency || {}),
        bigdigit: Object.assign(base.bigdigit, src.bigdigit || {})
      };
    }
    labelPos = mergeLabelPos(state.labelPos);
    singleLabelPos = mergeLabelPos(state.labelPos);
    // В мультирежиме применяем базу позиций пресета к ценнику №1 и разносим на
    // все остальные. Раньше база писалась в «активный» товар: при устаревшем
    // activePreviewIndex (после переключения шаблона) её было некуда писать, и
    // все надписи получали нулевые смещения вместо настроек пресета.
    if (document.querySelector('input[name="printMode"]:checked').value === 'multi') {
      if (!itemsData[0]) itemsData[0] = freshItem();
      itemsData[0].labelPos = mergeLabelPos(state.labelPos);
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
    syncDigitControlsVisibility();

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
      priceCross: priceCrossToggle ? priceCrossToggle.checked : false,
      priceCrossColor: priceCrossColor ? priceCrossColor.value : '#e63946',
      priceCrossWidth: priceCrossWidth ? parseFloat(priceCrossWidth.value) || 7 : 7,
      price: inputPrice.value,
      currency: tf.currency,

      // Слой «большая цифра» — стили шаблонные (DOM), значение single-режима — поле.
      digit: (() => { const el = document.getElementById('digitText'); return el ? el.value : ''; })(),
      digitFont: (() => { const el = document.getElementById('digitFont'); return el ? el.value : "Arial, sans-serif"; })(),
      digitColor: (() => { const el = document.getElementById('digitColor'); return el ? el.value : '#ffff00'; })(),
      digitSize: (() => { const el = document.getElementById('digitSize'); return el ? parseFloat(el.value) || 48 : 48; })(),
      digitWeight: (() => { const el = document.getElementById('digitWeight'); return el ? el.value : '800'; })(),

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
      decorOutsideFont: td.outsideFont,
      decorOutsideItalic: td.outsideItalic,
      decorOutsideShadow: td.outsideShadow,
      decorOutsideFontSize: td.outsideFontSize,
      decorOutsideHeight: td.outsideHeight,
      decorInsideShow: td.insideShow,
      decorInsideText: td.insideText,
      decorInsideBg: td.insideBg,
      decorInsideBgImg: td.insideBgImg,
      decorInsideCustomBg: td.insideCustomBg,
      decorInsideColor: td.insideColor,
      decorInsideFont: td.insideFont,
      decorInsideItalic: td.insideItalic,
      decorInsideShadow: td.insideShadow,
      decorInsideFontSize: td.insideFontSize,
      decorInsideHeight: td.insideHeight,
      decorInsideWidth: decorInsideWidth ? decorInsideWidth.value : 50,
      decorBlockPos: decorBlockPos,
      decorBottomShow: td.bottomShow,
      decorBottomText: td.bottomText,
      decorBottomBg: td.bottomBg,
      decorBottomBgImg: td.bottomBgImg,
      decorBottomCustomBg: td.bottomCustomBg,
      decorBottomColor: td.bottomColor,
      decorBottomFont: td.bottomFont,
      decorBottomItalic: td.bottomItalic,
      decorBottomShadow: td.bottomShadow,
      decorBottomFontSize: td.bottomFontSize,
      decorBottomHeight: td.bottomHeight,
      // Зазор между ценниками на листе А4 (мм); 0 = встык.
      gapMm: gapInput ? (parseFloat(gapInput.value) || 0) : 0,
      priceSlotTop: (() => {
        const p = getActivePreset();
        if (p && p.priceSlotTop != null) return parseFloat(p.priceSlotTop);
        const cur = parseFloat(document.documentElement.style.getPropertyValue('--price-slot-top'));
        return isNaN(cur) ? null : cur;
      })(),
      titleSlotTop: (() => {
        const p = getActivePreset();
        if (p && p.titleSlotTop != null) return parseFloat(p.titleSlotTop);
        const cur = parseFloat(document.documentElement.style.getPropertyValue('--title-slot-top'));
        return isNaN(cur) ? null : cur;
      })(),
      titleZoneH: (() => {
        const p = getActivePreset();
        if (p && p.titleZoneH != null) return parseFloat(p.titleZoneH);
        const cur = parseFloat(document.documentElement.style.getPropertyValue('--title-zone-h'));
        return isNaN(cur) ? null : cur;
      })(),
      autofitTitleOnly: (() => {
        const p = getActivePreset();
        return p ? !!p.autofitTitleOnly : false;
      })(),
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
  const EMBEDDABLE_BGS = ['dots_bg.jpg', 'ryba_bg.jpg', 'yellow_bg.jpg', 'sneki_bg.jpg', 'sneki_5_bg.jpg', 'sneki_digit_bg.jpg', 'sort_nedeli_bg.jpg', 'sort_nedeli_yellow.jpg', 'korona_a5_bg.jpg', 'korona_a5_orange.jpg', 'korona_a5_blue.jpg', 'korona_a5_green.jpg', 'korona_a5_red.jpg', 'a5.jpg', 'a5_orange.jpg', 'a5_red.jpg', 'a5_blue.jpg', 'a5_green.jpg', 'aktsiya_a5_bg.jpg', 'kalmar.png', 'myaso.png', 'syr.png', 'ryb_solomka.png', 'ostryi.png', 'orehi.png', 'grenki.png', 'moreprodukty.png', 'tomatnyj.png', 'vishnevyj.png', 'medovyj.png', 'yablochnyj.png', 'ba.jpg', 'zhivoe.jpg'];

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

    persistCustomTemplates();
    // Индексы пользовательских шаблонов могли измениться — проверяем ссылку.
    revalidateActiveTemplateRef();
    renderSavedTemplates();
    scheduleSessionSave();   // активный шаблон мог смениться — фиксируем в сессии
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
        <button class="btn-export-template" title="Экспорт шаблона" data-index="${index}"><svg class="ico"><use href="#i-download"/></svg></button>
        <button class="btn-delete-template" title="Удалить шаблон" data-index="${index}"><svg class="ico"><use href="#i-trash"/></svg></button>
      `;

      card.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-delete-template')) return;
        if (e.target.classList.contains('btn-export-template')) return;
        document.querySelectorAll('.preset-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        activeTemplateId = index;   // выбранный пользовательский шаблон — цель для «Обновить»
        activeTemplateRef = { kind: 'custom', index };
        // Смена шаблона всегда возвращает превью к ценнику №1: активный индекс
        // мог остаться на строке прошлого шаблона и не существовать в новом.
        activePreviewIndex = 0;
        applyState(item.state);
        autoFitFontSize(true);
        if (autoOpenDrawerChk && autoOpenDrawerChk.checked) {
          openItemsDrawer();
        }
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
          persistCustomTemplates();
          revalidateActiveTemplateRef();
          renderSavedTemplates();
          scheduleSessionSave();   // активный шаблон мог смениться — фиксируем в сессии
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
        // Смена шаблона всегда возвращает превью к ценнику №1: активный индекс
        // мог остаться на строке прошлого шаблона и не существовать в новом.
        activePreviewIndex = 0;
        // Per-template товары: переключаем активный массив товаров этого шаблона.
        // Каждый пресет хранит свой список независимо (см. templateItems).
        if (templateItems[key]) {
          itemsData = templateItems[key];
          itemsData.forEach(item => {
            if (item) {
              delete item.bgCustomized;
              delete item.bg;
              delete item.fontsCustomized;
              delete item.fonts;
              delete item.titleSize;
              if (key === 'yellow_tag' || key === 'korona_a5' || key === 'aktsiya_a5' || key === 'sort_nedeli') {
                if (item.labelPos && item.labelPos.title && (key === 'yellow_tag' || item.labelPos.title.y === 12 || item.labelPos.title.y === 22 || item.labelPos.title.x === -1.2)) {
                  item.labelPos.title = { x: 0, y: 0 };
                }
              }
            }
          });
          renderItemsListInputs();
        }
        applyState(p);
        if (key === 'yellow_tag' || key === 'korona_a5' || key === 'aktsiya_a5') {
          if (titleOffsetY && (key === 'yellow_tag' || titleOffsetY.value === '1')) titleOffsetY.value = '0';
          if (titleOffsetYVal && (key === 'yellow_tag' || titleOffsetYVal.textContent === '1')) titleOffsetYVal.textContent = '0';
          if (templateFonts && (key === 'yellow_tag' || templateFonts.titleOffsetY === 1)) templateFonts.titleOffsetY = 0;
        }
        if (key === 'sneki') {
          applyAutoBgToAllItems();
        }
        // Авто-подгон кегля названий под геометрию нового шаблона:
        // выполняется синхронно, т.к. CSS-анимации отключены и размеры применены сразу.
        autoFitFontSize(true);
        if (autoOpenDrawerChk && autoOpenDrawerChk.checked) {
          openItemsDrawer();
        }
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
        saveModalHint.textContent = `Будет обновлён ${kindLabel} шаблон: «${name}»` +
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
    persistCustomTemplates();

    // Только что созданный шаблон становится активным (можно сразу обновлять)
    activeTemplateId = customTemplates.length - 1;
    activeTemplateRef = { kind: 'custom', index: activeTemplateId };
    saveModal.classList.remove('active');
    renderSavedTemplates();
    document.querySelector('.tab-btn[data-tab="userSaved"]').click();
    showToast(`Шаблон «${name}» сохранён`, 'success');
  });

  // ===== Модал «Руководство пользователя / Инструкция» =====
  function openInstructionModal() {
    if (!instructionModal) return;
    instructionModal.classList.add('active');
  }

  function hideInstructionModal() {
    if (!instructionModal) return;
    instructionModal.classList.remove('active');
  }

  if (instructionBtn) {
    instructionBtn.addEventListener('click', openInstructionModal);
  }
  if (closeInstructionModal) {
    closeInstructionModal.addEventListener('click', hideInstructionModal);
  }
  if (instructionModal) {
    instructionModal.addEventListener('click', (e) => {
      if (e.target === instructionModal) {
        hideInstructionModal();
      }
    });
  }

  if (instructionPrintBtn) {
    instructionPrintBtn.addEventListener('click', () => {
      try {
        if (instructionIframe && instructionIframe.contentWindow) {
          instructionIframe.contentWindow.focus();
          instructionIframe.contentWindow.print();
          return;
        }
      } catch (err) {
        console.warn('Direct iframe print restricted, opening in new window fallback:', err);
      }
      const printWin = window.open('instruction.html', '_blank');
      if (printWin) {
        printWin.addEventListener('load', () => {
          setTimeout(() => {
            try {
              printWin.print();
            } catch (e) {
              console.warn(e);
            }
          }, 300);
        });
      }
    });
  }

  // Hotkeys: F1 opens user guide, Escape closes it
  window.addEventListener('keydown', (e) => {
    if (e.key === 'F1') {
      e.preventDefault();
      openInstructionModal();
    } else if (e.key === 'Escape' && instructionModal && instructionModal.classList.contains('active')) {
      hideInstructionModal();
    }
  });

  // ===== Переключение светлой / тёмной темы оформления (Studio Light) =====
  function updateThemeUI(isLight) {
    if (isLight) {
      document.documentElement.classList.add('theme-light');
      document.body.classList.add('theme-light');
      if (themeIconSun) themeIconSun.style.display = 'none';
      if (themeIconMoon) themeIconMoon.style.display = 'inline-flex';
      if (themeToggleText) themeToggleText.textContent = 'Тёмная';
      if (themeToggleBtn) themeToggleBtn.title = 'Переключить на тёмную тему (Ночь)';
    } else {
      document.documentElement.classList.remove('theme-light');
      document.body.classList.remove('theme-light');
      if (themeIconSun) themeIconSun.style.display = 'inline-flex';
      if (themeIconMoon) themeIconMoon.style.display = 'none';
      if (themeToggleText) themeToggleText.textContent = 'Светлая';
      if (themeToggleBtn) themeToggleBtn.title = 'Переключить на светлую тему (День)';
    }
  }

  function toggleTheme() {
    const isLight = document.body.classList.contains('theme-light');
    const nextLight = !isLight;
    updateThemeUI(nextLight);
    try {
      localStorage.setItem('wobbler_ui_theme', nextLight ? 'light' : 'dark');
    } catch (err) { }
    showToast(nextLight ? 'Светлая тема Studio включена' : 'Тёмная тема Studio включена', 'info', 2200);
  }

  const initialSavedTheme = (() => {
    try { return localStorage.getItem('wobbler_ui_theme'); } catch (err) { return null; }
  })();
  updateThemeUI(initialSavedTheme === 'light');

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', toggleTheme);
  }

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
        persistCustomTemplates();
        saveModal.classList.remove('active');
        renderSavedTemplates();
        document.querySelector('.tab-btn[data-tab="userSaved"]').click();
        showToast(`Шаблон «${t.name}» обновлён`, 'success');
        return;
      }

      // builtin → создаём пользовательскую копию с тем же именем (+суффикс)
      if (activeTemplateRef.kind === 'builtin') {
        const preset = builtInPresets[activeTemplateRef.key];
        const baseName = preset ? preset.name : 'Шаблон';
        const name = (newTemplateNameInput.value.trim()) || (baseName + ' (изменён)');
        customTemplates.push({ name, state });
        persistCustomTemplates();
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
    showPriceToggle, inputPrice, pricePlateToggle, priceCrossToggle,
    headerHeightRange,
    sheetCount, singleRepeatCount, showCropMarks, gapInput
  ];

  // Единый обработчик изменения любого шрифтового инпута: снимает текущие значения
  // и пишет их в активный контекст — per-item (выбранный ценник) в multi+item-режиме,
  // иначе в templateFonts. После — updatePreview.
  // e — необязательный event (может не передаваться).
  function onFontInputChange(e) {
    const snap = readFontSnapshotFromInputs();
    // Проверяем — пользователь двигал именно ползунок(и) размера наименования?
    const isTitleSizeEvent = e && (e.target === titleSize || e.target === titleSizePreview);
    if (isMultiModeNow() && fontApplyMode === 'item') {
      const it = itemsData[activePreviewIndex] || (itemsData[activePreviewIndex] = {});
      it.fonts = snap;
      it.fontsCustomized = true;
      it.titleSize = snap.titleSize;
      // Ручное изменение кегля — блокируем автоподгон для этого ценника.
      if (isTitleSizeEvent) it.titleSizeManual = true;
    } else {
      templateFonts = snap;
      if (isMultiModeNow()) {
        const it = itemsData[activePreviewIndex];
        if (it) {
          it.titleSize = snap.titleSize;
          if (it.fonts) it.fonts.titleSize = snap.titleSize;
          if (isTitleSizeEvent) it.titleSizeManual = true;
        }
      }
    }
    if (titleItalic) {
      const btn = titleItalic.closest('.format-toggle-btn');
      if (btn) btn.classList.toggle('active', titleItalic.checked);
    }
    refreshAllCrossBtnStates();
    updatePreview();
  }

  // Все шрифтовые контролы → onFontInputChange.
  const fontInputs = [
    titleFont, titleColor, titleSize, titleWeight, titleItalic, titleOffsetY, titleShadow, titleShadowColor,
    subtitleColor, subtitleSize, subtitleWeight,
    priceFont, priceSize, priceWeight, priceColor, priceOffsetY, priceShadow, priceShadowColor, inputCurrency,
    priceCrossToggle, priceCrossColor, priceCrossWidth
  ];
  fontInputs.forEach(el => {
    if (!el) return;
    el.addEventListener('input', onFontInputChange);
    el.addEventListener('change', onFontInputChange);
  });

  // === Слой «большая цифра» (напр. «Снеки с цифрой») ===
  // Значение — per-item (в multi пишется в активный товар, как название/цена);
  // шрифт/цвет/кегль/толщина — шаблонные стили, читаются рендером прямо из DOM.
  const digitTextInput = document.getElementById('digitText');
  const digitStyleInputs = [
    document.getElementById('digitFont'),
    document.getElementById('digitColor'),
    document.getElementById('digitSize'),
    document.getElementById('digitWeight')
  ];
  if (digitTextInput) {
    digitTextInput.addEventListener('input', () => {
      const v = digitTextInput.value;
      if (isMultiModeNow()) {
        const it = itemsData[activePreviewIndex] || (itemsData[activePreviewIndex] = freshItem());
        it.digit = v;
        // Синхронизируем поле «Цифра» активной строки таблицы (если есть).
        const rowInput = document.querySelector(`.item-digit-input[data-index="${activePreviewIndex}"]`);
        if (rowInput && rowInput.value !== v) rowInput.value = v;
        syncRowExtent(activePreviewIndex);
      }
      updatePreview();
    });
  }
  digitStyleInputs.forEach(el => {
    if (!el) return;
    el.addEventListener('input', onDigitStyleChange);
    el.addEventListener('change', onDigitStyleChange);
  });
  function onDigitStyleChange() {
    const val = document.getElementById('digitSizeVal');
    const sizeEl = document.getElementById('digitSize');
    if (val && sizeEl) val.textContent = sizeEl.value;
    updatePreview();
  }

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
    decorOutsideShow, decorOutsideText, decorOutsideBg, decorOutsideBgImg, decorOutsideColor,
    decorOutsideFont, decorOutsideItalic, decorOutsideShadow, decorOutsideShadowColor, decorOutsideFontSize, decorOutsideHeight,
    decorInsideShow, decorInsideText, decorInsideBg, decorInsideBgImg, decorInsideColor,
    decorInsideFont, decorInsideItalic, decorInsideShadow, decorInsideShadowColor, decorInsideFontSize, decorInsideHeight, decorInsideWidth,
    decorBottomShow, decorBottomText, decorBottomBg, decorBottomBgImg, decorBottomColor,
    decorBottomFont, decorBottomItalic, decorBottomShadow, decorBottomShadowColor, decorBottomFontSize, decorBottomHeight
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
    const val = snap.bgImage;
    if (isMultiModeNow() && bgApplyMode === 'item') {
      applyBackgroundAndAutolink('item', activePreviewIndex, (val === 'none' || !val) ? '' : val);
    } else {
      applyBackgroundAndAutolink('template', -1, (val === 'none' || !val) ? '' : val);
    }
    refitActiveTitle();
    updatePreview();
    renderItemsListInputs();
    if (itemsDrawer && itemsDrawer.classList.contains('open')) renderDrawerItems();
    renderActiveTemplateColorBar();
    try { syncBgControlsToContext(); } catch (e) { }
    try { syncFontControlsToContext(); } catch (e) { }
    try { syncDecorControlsToContext(); } catch (e) { }
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
      // Передаём синтетический event с target = titleSizePreview, чтобы
      // onFontInputChange знал: это ручная правка ползунка размера.
      onFontInputChange({ target: titleSizePreview });
    };
    titleSizePreview.addEventListener('input', onPreviewInput);
    titleSizePreview.addEventListener('change', onPreviewInput);
  }

  // Кнопка «Подогнать» рядом с ползунком в тулбаре предпросмотра.
  // Сбрасывает ручную блокировку и выполняет принудительный автоподгон.
  const previewAutoFitBtn = document.getElementById('previewAutoFitBtn');
  if (previewAutoFitBtn) {
    previewAutoFitBtn.addEventListener('click', () => {
      const isMultiMode = (typeof isMultiModeNow === 'function') ? isMultiModeNow() : false;
      if (isMultiMode) {
        const it = itemsData[activePreviewIndex];
        if (it) delete it.titleSizeManual;
      }
      refitActiveTitle(true);
      if (typeof showToast === 'function') {
        showToast('Размер шрифта подогнан под ценник', 'success', 1800);
      }
    });
  }

  // Умный перенос названия по словам: при вводе наименования (single) и при
  // смене шрифта/толщины (влияют на ширину слов) — заново подгоняем кегль под
  // размер ценника. Слайдер сюда НЕ подключён — ручная правка держится до
  // следующего ввода текста/шрифта. refitActiveTitle сам зовёт updatePreview.
  if (inputTitle) {
    inputTitle.addEventListener('input', () => {
      const autoSub = builtinPresetFlag('autoSubtitle', '');
      if (autoSub && inputSubtitle && !inputSubtitle.dataset.manual) {
        inputSubtitle.value = inputTitle.value.trim() ? autoSub : '';
        autoGrowTextarea(inputSubtitle);
      }
      const isMultiMode = document.querySelector('input[name="printMode"]:checked')?.value === 'multi';
      if (!isMultiMode) {
        checkAutoBgForSingleMode(inputTitle.value);
      }
      refitActiveTitle();
      updatePreview();
    });
  }
  if (inputSubtitle) {
    inputSubtitle.addEventListener('input', () => {
      inputSubtitle.dataset.manual = 'true';
    });
  }
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
  // Для наименований товаров высота ограничена, чтобы при длинном тексте поле аккуратно скролилось.
  function autoGrowTextarea(el) {
    if (!el || el.tagName !== 'TEXTAREA') return;
    if (el.id === 'pasteExcelArea' || el.id === 'idrPasteInput' || el.classList.contains('no-autogrow')) return;
    if (el.classList.contains('item-title-input')) {
      el.style.height = 'auto';
      el.style.height = `${Math.min(el.scrollHeight, 54)}px`;
      return;
    }
    if (el.id === 'inputTitle') {
      el.style.height = 'auto';
      el.style.height = `${Math.min(el.scrollHeight, 72)}px`;
      return;
    }
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }
  // Все textarea приложения (наименование, вес/доп.текст, тексты декор-блоков), кроме полей быстрой вставки.
  document.querySelectorAll('textarea').forEach(el => {
    if (el.id === 'pasteExcelArea' || el.id === 'idrPasteInput' || el.classList.contains('no-autogrow')) return;
    autoGrowTextarea(el);
    el.addEventListener('input', () => autoGrowTextarea(el));
  });

  // Свободный ввод цены: любое событие 'input' в поле сразу обновляет предпросмотр, на 'blur' выполняется гигиеническая очистка.
  if (priceFreeInput) {
    priceFreeInput.addEventListener('input', () => {
      if (isMultiModeNow()) {
        const it = itemsData[activePreviewIndex] || (itemsData[activePreviewIndex] = freshItem());
        it.price = priceFreeInput.value;
        const rowInp = document.querySelector(`.item-price-input[data-index="${activePreviewIndex}"]`);
        if (rowInp && rowInp.value !== priceFreeInput.value) rowInp.value = priceFreeInput.value;
      }
      updatePreview();
    });
    priceFreeInput.addEventListener('blur', (e) => {
      const cleaned = cleanPriceInput(e.target.value);
      if (cleaned !== e.target.value) {
        e.target.value = cleaned;
        if (isMultiModeNow()) {
          const it = itemsData[activePreviewIndex];
          if (it) it.price = cleaned;
          const rowInp = document.querySelector(`.item-price-input[data-index="${activePreviewIndex}"]`);
          if (rowInp) rowInp.value = cleaned;
        }
        updatePreview();
        scheduleSessionSave();
      }
    });
  }

  if (inputCurrency) {
    const onCurrencyChange = () => {
      const cur = inputCurrency.value;
      if (!templateFonts) templateFonts = {};
      templateFonts.currency = cur;
      if (isMultiModeNow()) {
        const it = itemsData[activePreviewIndex];
        if (it) {
          if (!it.fonts) it.fonts = {};
          it.fonts.currency = cur;
          it.currency = cur;
        }
      }
      updatePreview();
      scheduleSessionSave();
    };
    inputCurrency.addEventListener('input', onCurrencyChange);
    inputCurrency.addEventListener('change', onCurrencyChange);
  }

  // === Выпадающее меню ручной правки макета в панели предпросмотра ===
  const previewToolsWrap = document.getElementById('previewToolsDropdownWrap');
  const previewToolsBtn = document.getElementById('previewToolsDropdownBtn');
  const previewToolsMenu = document.getElementById('previewToolsMenu');
  const activeToolsBadge = document.getElementById('activeToolsBadge');

  function closePreviewToolsMenu() {
    if (previewToolsMenu) previewToolsMenu.style.display = 'none';
    if (previewToolsWrap) previewToolsWrap.classList.remove('open');
  }

  function togglePreviewToolsMenu(e) {
    if (e) e.stopPropagation();
    if (!previewToolsMenu) return;
    const isClosed = (previewToolsMenu.style.display === 'none' || !previewToolsMenu.style.display);
    if (isClosed) {
      previewToolsMenu.style.display = 'flex';
      if (previewToolsWrap) previewToolsWrap.classList.add('open');
    } else {
      closePreviewToolsMenu();
    }
  }

  if (previewToolsBtn) {
    previewToolsBtn.addEventListener('click', togglePreviewToolsMenu);
  }

  document.addEventListener('click', (e) => {
    if (previewToolsWrap && !previewToolsWrap.contains(e.target)) {
      closePreviewToolsMenu();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closePreviewToolsMenu();
  });

  function refreshPreviewToolsActiveState() {
    if (!previewToolsBtn) return;
    const isDragAll = wobblerPreview && wobblerPreview.classList.contains('drag-mode');
    const isDragSolo = wobblerPreview && wobblerPreview.classList.contains('drag-mode-solo');
    const isSafe = wobblerPreview && wobblerPreview.classList.contains('safe-edit-mode');

    if (dragModeToggle) dragModeToggle.classList.toggle('active', !!isDragAll);
    if (dragModeSoloToggle) dragModeSoloToggle.classList.toggle('active', !!isDragSolo);
    if (safeEditToggle) safeEditToggle.classList.toggle('active', !!isSafe);

    const safeEditBarEl = document.getElementById('safeEditBar');
    if (safeEditBarEl) {
      safeEditBarEl.style.display = isSafe ? 'inline-flex' : 'none';
      if (isSafe) {
        syncSafeEditBarInputs(resolveItemBg(activePreviewIndex).titleSafe);
      }
    }

    if (isDragAll || isDragSolo || isSafe) {
      previewToolsBtn.classList.add('active');
      if (activeToolsBadge) {
        activeToolsBadge.style.display = 'inline-flex';
        activeToolsBadge.textContent = isDragAll ? 'Все' : (isDragSolo ? 'Соло' : 'Границы');
      }
    } else {
      previewToolsBtn.classList.remove('active');
      if (activeToolsBadge) activeToolsBadge.style.display = 'none';
    }
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
      refreshPreviewToolsActiveState();
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
      refreshPreviewToolsActiveState();
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
      refreshPreviewToolsActiveState();
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
    refreshPreviewToolsActiveState();
    closePreviewToolsMenu();
    fontApplyMode = 'item';
    decorApplyMode = 'item';
    bgApplyMode = 'item';
    syncFontControlsToContext();
    syncDecorControlsToContext();
    syncBgControlsToContext();
    updatePreview();
    showToast('Активный ценник сброшен к шаблону', 'info');
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
    wobblerPreview.classList.remove('drag-mode', 'drag-mode-solo', 'safe-edit-mode');
    refreshPreviewToolsActiveState();
    closePreviewToolsMenu();
    fontApplyMode = 'item';
    decorApplyMode = 'item';
    bgApplyMode = 'item';
    syncFontControlsToContext();
    syncDecorControlsToContext();
    syncBgControlsToContext();
    updatePreview();
    showToast('Все ценники сброшены к виду шаблона', 'info');
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



  // Перетаскивание надписей через Pointer Events с делегированием на #wobblerPreview.
  // Цели определяются по элементу-источнику: title / subtitle / price-box (целиком),
  // .price-digit (по цифре, data-pos) / .price-curr (валюта).
  (function setupLabelDrag() {
    let drag = null; // { target, startX, startY, baseX, baseY, digitIndex? }
    const guideH = document.getElementById('canvasGuideH');
    const guideV = document.getElementById('canvasGuideV');

    function mmPerPx() {
      const wMm = parseFloat(wobblerWidthInput.value) || 6.5;
      const wPx = wobblerPreview.offsetWidth || 1;
      return (wMm * 10) / wPx;
    }

    // Определяет цель перетаскивания по элементу, на котором нажали.
    function resolveTarget(target) {
      if (target.closest('.wobbler-bigdigit')) return { kind: 'bigdigit' };
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
      if (target.kind === 'bigdigit') return lp.bigdigit;
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
      try { wobblerPreview.setPointerCapture(e.pointerId); } catch (_) { }
      const ref = posRef(target);
      drag = { target, startX: e.clientX, startY: e.clientY, baseX: ref.x, baseY: ref.y };
    });

    wobblerPreview.addEventListener('pointermove', (e) => {
      if (!drag) return;
      const k = mmPerPx();
      const dx = (e.clientX - drag.startX) * k;
      const dy = (e.clientY - drag.startY) * k;
      const ref = posRef(drag.target);
      let targetX = Math.round((drag.baseX + dx) * 10) / 10;
      let targetY = Math.round((drag.baseY + dy) * 10) / 10;

      // Магнитная привязка к центру ценника (0 мм) с визуализацией направляющих
      if (Math.abs(targetX) < 0.8) {
        targetX = 0;
        if (guideV) guideV.style.display = 'block';
      } else {
        if (guideV) guideV.style.display = 'none';
      }

      if (Math.abs(targetY) < 0.8) {
        targetY = 0;
        if (guideH) guideH.style.display = 'block';
      } else {
        if (guideH) guideH.style.display = 'none';
      }

      ref.x = targetX;
      ref.y = targetY;
      updatePreview();
      // В общем режиме (dragBroadcast=true) положение надписи разносится на все
      // ценники (включая №1). В режиме «Двигать отдельно» (dragBroadcast=false)
      // двигается только активный ценник, остальные не меняются.
      if (dragBroadcast &&
        (drag.target.kind === 'title' || drag.target.kind === 'subtitle'
          || drag.target.kind === 'price' || drag.target.kind === 'bigdigit'
          || drag.target.kind === 'digit' || drag.target.kind === 'currency')) {
        syncSharedPosFromActive();
      }
    });

    const endDrag = (e) => {
      if (drag) {
        try { wobblerPreview.releasePointerCapture(e.pointerId); } catch (_) { }
        drag = null;
        if (guideH) guideH.style.display = 'none';
        if (guideV) guideV.style.display = 'none';
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
    let drag = null;   // { mode, edge, sx, sy, base, rect }

    wobblerPreview.addEventListener('pointerdown', (e) => {
      if (!wobblerPreview.classList.contains('safe-edit-mode')) return;
      const handle = e.target.closest && e.target.closest('.safe-handle');
      const safeRectEl = e.target.closest && e.target.closest('.safe-rect');
      if (!handle && !safeRectEl) return;

      const edge = handle ? handle.getAttribute('data-edge') : null;
      const mode = handle ? 'edge' : 'move';

      e.preventDefault();
      try { wobblerPreview.setPointerCapture(e.pointerId); } catch (_) { }
      if (safeRectEl) safeRectEl.classList.add('is-dragging');
      drag = {
        mode,
        edge,
        sx: e.clientX,
        sy: e.clientY,
        base: readGlobalTitleSafe(),
        rect: wobblerHeader.getBoundingClientRect()
      };
    });

    wobblerPreview.addEventListener('pointermove', (e) => {
      if (!drag) return;
      // Доля смещения от размеров шапки (px → доли 0..1).
      const dx = (e.clientX - drag.sx) / (drag.rect.width || 1);
      const dy = (e.clientY - drag.sy) / (drag.rect.height || 1);
      const ts = { left: drag.base.left, right: drag.base.right, top: drag.base.top, bottom: drag.base.bottom };

      if (drag.mode === 'move') {
        const spanW = Math.max(0.05, 1 - drag.base.left - drag.base.right);
        const spanH = Math.max(0.05, 1 - drag.base.top - drag.base.bottom);
        const maxL = Math.max(0, 1 - spanW);
        const maxT = Math.max(0, 1 - spanH);

        let newL = drag.base.left + dx;
        newL = Math.max(0, Math.min(maxL, newL));
        ts.left = newL;
        ts.right = Math.max(0, 1 - spanW - newL);

        let newT = drag.base.top + dy;
        newT = Math.max(0, Math.min(maxT, newT));
        ts.top = newT;
        ts.bottom = Math.max(0, 1 - spanH - newT);
      } else {
        if (drag.edge === 'left') ts.left = clampSafe(drag.base.left + dx);
        else if (drag.edge === 'right') ts.right = clampSafe(drag.base.right - dx);
        else if (drag.edge === 'top') ts.top = clampSafe(drag.base.top + dy);
        else if (drag.edge === 'bottom') ts.bottom = clampSafe(drag.base.bottom - dy);
        // Не дадим краям «схлопнуть» прямоугольник: пара отступов ≤ 0.9
        // (остаётся ≥10% соответствующей стороны под название).
        if (ts.left + ts.right > 0.9) {
          if (drag.edge === 'left') ts.left = 0.9 - ts.right;
          else if (drag.edge === 'right') ts.right = 0.9 - ts.left;
        }
        if (ts.top + ts.bottom > 0.9) {
          if (drag.edge === 'top') ts.top = 0.9 - ts.bottom;
          else if (drag.edge === 'bottom') ts.bottom = 0.9 - ts.top;
        }
      }
      globalTitleSafe = { left: ts.left, right: ts.right, top: ts.top, bottom: ts.bottom };  // без dispatch
      positionSafeRect(ts);         // прямоугольник следует за мышью + syncSafeEditBarInputs
      updatePreview();              // применяет доли к названию + CSS-переменные
      if (typeof refitActiveTitle === 'function') refitActiveTitle(); // пересчёт кегля под новый бокс
    });

    const end = (e) => {
      if (drag) {
        try { wobblerPreview.releasePointerCapture(e.pointerId); } catch (_) { }
        const safeRectEl = document.getElementById('safeRect');
        if (safeRectEl) safeRectEl.classList.remove('is-dragging');
        drag = null;
        if (typeof scheduleSessionSave === 'function') scheduleSessionSave();
      }
    };
    wobblerPreview.addEventListener('pointerup', end);
    wobblerPreview.addEventListener('pointercancel', end);

    // Инициализация тулбарной плашки точной подстройки границ (кнопки +/-, инпуты mm, стрелки клавиатуры)
    const safeEditBarEl = document.getElementById('safeEditBar');
    if (safeEditBarEl) {
      safeEditBarEl.addEventListener('click', (e) => {
        const stepBtn = e.target.closest && e.target.closest('[data-safe-step]');
        if (stepBtn) {
          const field = stepBtn.getAttribute('data-safe-step');
          const delta = parseFloat(stepBtn.getAttribute('data-safe-delta')) || 0;
          if (field && delta) {
            e.preventDefault();
            applySafeEditBarDelta(field, delta);
          }
        }
      });

      const barFields = [
        { id: 'safeBarTop', field: 'top' },
        { id: 'safeBarBottom', field: 'bottom' },
        { id: 'safeBarLeft', field: 'left' },
        { id: 'safeBarRight', field: 'right' }
      ];
      barFields.forEach(({ id, field }) => {
        const inputEl = document.getElementById(id);
        if (!inputEl) return;
        inputEl.addEventListener('change', () => {
          applySafeEditBarInputVal(field, inputEl.value);
        });
        inputEl.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            applySafeEditBarInputVal(field, inputEl.value);
            inputEl.blur();
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            applySafeEditBarDelta(field, e.shiftKey ? 1.0 : 0.5);
          } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            applySafeEditBarDelta(field, e.shiftKey ? -1.0 : -0.5);
          }
        });
      });

      const closeBtn = document.getElementById('closeSafeEditBarBtn');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => {
          if (wobblerPreview) wobblerPreview.classList.remove('safe-edit-mode');
          refreshPreviewToolsActiveState();
        });
      }
    }
  })();

  // ===== WYSIWYG Прямой инлайн-ввод в окне предпросмотра =====
  function initWobblerInlineEditing() {
    const isDragActive = () => {
      return wobblerPreview && (
        wobblerPreview.classList.contains('drag-mode') ||
        wobblerPreview.classList.contains('drag-mode-solo') ||
        wobblerPreview.classList.contains('safe-edit-mode')
      );
    };

    function makeEditable(el, field, onUpdate, onFocusNext) {
      if (!el) return;
      el.setAttribute('contenteditable', 'plaintext-only');
      el.setAttribute('spellcheck', 'false');

      // При клике: если активен режим смещения — не активируем фокус ввода
      el.addEventListener('pointerdown', (e) => {
        if (isDragActive()) {
          el.blur();
        }
      });

      // Перехват вставки для вставки только чистого неформатированного текста
      el.addEventListener('paste', (e) => {
        e.preventDefault();
        const text = (e.clipboardData || window.clipboardData).getData('text/plain');
        if (document.queryCommandSupported && document.queryCommandSupported('insertText')) {
          document.execCommand('insertText', false, text);
        } else {
          const selection = window.getSelection();
          if (selection && selection.rangeCount) {
            selection.deleteFromDocument();
            selection.getRangeAt(0).insertNode(document.createTextNode(text));
          }
        }
        el.dispatchEvent(new Event('input', { bubbles: true }));
      });

      // Навигация Enter, Tab, Escape
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          if (onFocusNext) onFocusNext();
          else el.blur();
        } else if (e.key === 'Tab') {
          e.preventDefault();
          if (onFocusNext) onFocusNext();
          else el.blur();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          el.blur();
        }
      });

      // Ввод текста в реальном времени
      el.addEventListener('input', () => {
        const rawText = el.innerText || el.textContent || '';
        if (typeof pushHistoryState === 'function') pushHistoryState(`Правка: ${field}`);
        onUpdate(rawText);
      });

      // Завершение редактирования
      el.addEventListener('blur', () => {
        updatePreview();
        scheduleSessionSave();
        if (typeof pushHistoryState === 'function') pushHistoryState(`Правка: ${field}`, true);
      });
    }

    // 1. Наименование товара (previewTitle)
    makeEditable(previewTitle, 'title', (rawText) => {
      const val = rawText.replace(/[\r\n]+/g, ' ');
      const isMultiMode = document.querySelector('input[name="printMode"]:checked').value === 'multi';
      if (inputTitle) inputTitle.value = val;
      const autoSub = builtinPresetFlag('autoSubtitle', '');

      if (isMultiMode) {
        if (!itemsData[activePreviewIndex]) itemsData[activePreviewIndex] = freshItem();
        itemsData[activePreviewIndex].title = val;
        checkAutoBgForTitle(activePreviewIndex, val);

        // Синхронизируем инпуты наименования в блоке «Товары» (в сайдбаре и в шторке)
        document.querySelectorAll(`.item-title-input[data-index="${activePreviewIndex}"]`).forEach(inp => {
          if (inp !== document.activeElement && inp.value !== val) {
            inp.value = val;
            autoGrowTextarea(inp);
          }
        });

        // Авто-вес: если для шаблона настроен скрипт авто-подстановки веса и вес не редактировался вручную
        if (autoSub && !itemsData[activePreviewIndex].subtitleManual) {
          itemsData[activePreviewIndex].subtitle = val.trim() ? autoSub : '';
          document.querySelectorAll(`.item-subtitle-input[data-index="${activePreviewIndex}"]`).forEach(si => {
            if (si.value !== itemsData[activePreviewIndex].subtitle) {
              si.value = itemsData[activePreviewIndex].subtitle;
              autoGrowTextarea(si);
            }
          });
          if (previewSubtitle && document.activeElement !== previewSubtitle) {
            previewSubtitle.textContent = itemsData[activePreviewIndex].subtitle;
            previewSubtitle.style.display = itemsData[activePreviewIndex].subtitle ? 'block' : 'none';
          }
        }

        // Автоподбор шрифта на лету
        const family = titleFont ? titleFont.value : '';
        const weight = titleWeight ? titleWeight.value : '800';
        const fit = fitTitleSize(val, family, weight);
        if (fit != null) {
          itemsData[activePreviewIndex].titleSize = fit;
          if (itemsData[activePreviewIndex].fonts) itemsData[activePreviewIndex].fonts.titleSize = fit;
          previewTitle.style.fontSize = `${fit}pt`;
          if (titleSize) titleSize.value = String(fit);
          if (titleSizeVal) titleSizeVal.textContent = String(fit);
          syncTitleSizePreview();
        }

        // Синхронизация прогрессивного списка строк
        syncRowExtent(activePreviewIndex);
      } else {
        // Режим «Один товар»
        if (autoSub && inputSubtitle && !inputSubtitle.dataset.manual) {
          inputSubtitle.value = val.trim() ? autoSub : '';
          autoGrowTextarea(inputSubtitle);
          if (previewSubtitle && document.activeElement !== previewSubtitle) {
            previewSubtitle.textContent = inputSubtitle.value;
            previewSubtitle.style.display = inputSubtitle.value ? 'block' : 'none';
          }
        }

        const family = titleFont ? titleFont.value : '';
        const weight = titleWeight ? titleWeight.value : '800';
        const fit = fitTitleSize(val, family, weight);
        if (fit != null) {
          templateFonts = Object.assign({}, templateFonts, { titleSize: fit });
          previewTitle.style.fontSize = `${fit}pt`;
          if (titleSize) titleSize.value = String(fit);
          if (titleSizeVal) titleSizeVal.textContent = String(fit);
          syncTitleSizePreview();
        }
        checkAutoBgForSingleMode(val);
      }

      // Обновляем мини-раскладку А4
      const wCm = parseFloat(wobblerWidthInput.value) || 6.5;
      const hCm = parseFloat(wobblerHeightInput.value) || 4.5;
      renderSheetPreview(wCm * 10, hCm * 10);
      updateItemsStatsBadge();
      if (typeof updateItemsDrawerHeader === 'function') updateItemsDrawerHeader();
    }, () => {
      if (previewPriceBox && previewPriceBox.style.display !== 'none' && previewPrice) {
        previewPrice.focus();
      } else if (previewSubtitle && previewSubtitle.style.display !== 'none') {
        previewSubtitle.focus();
      } else {
        previewTitle.blur();
      }
    });

    // 2. Цена (previewPrice)
    if (previewPrice) {
      // При клике на блок цены — фокус на цену
      if (previewPriceBox) {
        previewPriceBox.addEventListener('click', (e) => {
          if (!isDragActive() && document.activeElement !== previewPrice) {
            previewPrice.focus();
          }
        });
      }

      previewPrice.addEventListener('focus', () => {
        const isMultiMode = document.querySelector('input[name="printMode"]:checked').value === 'multi';
        const activePriceText = isMultiMode ? (itemsData[activePreviewIndex]?.price || '') : inputPrice.value.trim();
        previewPrice.textContent = activePriceText;
        try {
          const range = document.createRange();
          range.selectNodeContents(previewPrice);
          const sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
        } catch (_) { }
      });

      makeEditable(previewPrice, 'price', (rawText) => {
        const val = rawText.replace(/[\r\n]+/g, '').trim();
        const isMultiMode = document.querySelector('input[name="printMode"]:checked').value === 'multi';
        if (inputPrice) inputPrice.value = val;
        if (isMultiMode) {
          if (!itemsData[activePreviewIndex]) itemsData[activePreviewIndex] = freshItem();
          itemsData[activePreviewIndex].price = val;
          const rowInputs = document.querySelectorAll(`.item-price-input[data-index="${activePreviewIndex}"]`);
          rowInputs.forEach(inp => {
            if (inp !== document.activeElement && inp.value !== val) {
              inp.value = val;
              autoGrowTextarea(inp);
            }
          });
          syncRowExtent(activePreviewIndex);
          updateItemsStatsBadge();
          if (typeof updateItemsDrawerHeader === 'function') updateItemsDrawerHeader();
        }
        const wCm = parseFloat(wobblerWidthInput.value) || 6.5;
        const hCm = parseFloat(wobblerHeightInput.value) || 4.5;
        renderSheetPreview(wCm * 10, hCm * 10);
      }, () => {
        if (previewSubtitle && previewSubtitle.style.display !== 'none') {
          previewSubtitle.focus();
        } else {
          previewPrice.blur();
        }
      });
    }

    // 3. Подзаголовок / Вес (previewSubtitle)
    if (previewSubtitle) {
      makeEditable(previewSubtitle, 'subtitle', (rawText) => {
        const val = rawText.replace(/[\r\n]+/g, '').trim();
        const isMultiMode = document.querySelector('input[name="printMode"]:checked').value === 'multi';
        if (inputSubtitle) {
          inputSubtitle.value = val;
          inputSubtitle.dataset.manual = 'true';
          autoGrowTextarea(inputSubtitle);
        }
        if (isMultiMode) {
          if (!itemsData[activePreviewIndex]) itemsData[activePreviewIndex] = freshItem();
          itemsData[activePreviewIndex].subtitle = val;
          itemsData[activePreviewIndex].subtitleManual = true;
          const rowInputs = document.querySelectorAll(`.item-subtitle-input[data-index="${activePreviewIndex}"]`);
          rowInputs.forEach(inp => {
            if (inp !== document.activeElement && inp.value !== val) {
              inp.value = val;
              autoGrowTextarea(inp);
            }
          });
          syncRowExtent(activePreviewIndex);
          updateItemsStatsBadge();
          if (typeof updateItemsDrawerHeader === 'function') updateItemsDrawerHeader();
        }
        const wCm = parseFloat(wobblerWidthInput.value) || 6.5;
        const hCm = parseFloat(wobblerHeightInput.value) || 4.5;
        renderSheetPreview(wCm * 10, hCm * 10);
      }, () => {
        previewSubtitle.blur();
      });
    }

    // 4. Большая цифра (previewBigDigit)
    if (previewBigDigit) {
      makeEditable(previewBigDigit, 'digit', (rawText) => {
        const val = rawText.replace(/[№\r\n]+/g, '').trim();
        const isMultiMode = document.querySelector('input[name="printMode"]:checked').value === 'multi';
        const dText = document.getElementById('digitText');
        if (dText) dText.value = val;
        if (isMultiMode) {
          if (!itemsData[activePreviewIndex]) itemsData[activePreviewIndex] = freshItem();
          itemsData[activePreviewIndex].digit = val;
          const rowInputs = document.querySelectorAll(`.item-digit-input[data-index="${activePreviewIndex}"]`);
          rowInputs.forEach(inp => { if (inp !== document.activeElement && inp.value !== val) inp.value = val; });
          syncRowExtent(activePreviewIndex);
          if (typeof updateItemsDrawerHeader === 'function') updateItemsDrawerHeader();
        }
      }, () => {
        previewBigDigit.blur();
      });
    }
  }

  // ===== 1. Плавающий контекстный микро-тулбар холста (Canvas Quick-Bar) =====
  function setupCanvasQuickBar() {
    const quickBar = document.getElementById('canvasQuickBar');
    if (!quickBar) return;

    const targetLabel = document.getElementById('cqbTargetLabel');
    const closeBtn = document.getElementById('cqbCloseBtn');
    const fontMinus = document.getElementById('cqbFontMinus');
    const fontSizeVal = document.getElementById('cqbFontSizeVal');
    const fontPlus = document.getElementById('cqbFontPlus');
    const boldBtn = document.getElementById('cqbBold');
    const italicBtn = document.getElementById('cqbItalic');
    const colorInput = document.getElementById('cqbColorInput');
    const colorSwatch = document.getElementById('cqbColorSwatch');

    let currentTargetKind = null; // 'title' | 'price' | 'subtitle' | 'bigdigit'
    let currentTargetEl = null;

    quickBar.addEventListener('pointerdown', (e) => e.stopPropagation());
    quickBar.addEventListener('mousedown', (e) => e.stopPropagation());

    function hideQuickBar() {
      quickBar.style.display = 'none';
      currentTargetKind = null;
      currentTargetEl = null;
    }

    if (closeBtn) closeBtn.addEventListener('click', hideQuickBar);

    function positionQuickBar(el) {
      if (!el) return;
      const stageWrapper = document.querySelector('.preview-stage-wrapper');
      if (!stageWrapper) return;

      quickBar.style.display = 'flex';
      quickBar.style.visibility = 'hidden';

      const wrapRect = stageWrapper.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      const qbW = quickBar.offsetWidth || 230;
      const qbH = quickBar.offsetHeight || 60;

      let left = (elRect.left + elRect.width / 2) - wrapRect.left - (qbW / 2);
      left = Math.max(8, Math.min(wrapRect.width - qbW - 8, left));

      let top = elRect.top - wrapRect.top - qbH - 8;
      if (top < 10) {
        top = elRect.bottom - wrapRect.top + 8;
      }
      top = Math.max(8, Math.min(wrapRect.height - qbH - 8, top));

      quickBar.style.left = `${Math.round(left)}px`;
      quickBar.style.top = `${Math.round(top)}px`;
      quickBar.style.visibility = 'visible';
    }

    function getCurrentQuickBarFontSize() {
      if (currentTargetKind === 'title') {
        if (previewTitle && previewTitle.style.fontSize) {
          const s = parseFloat(previewTitle.style.fontSize);
          if (!isNaN(s) && s > 0) return s;
        }
        const isMulti = (typeof isMultiModeNow === 'function') ? isMultiModeNow() : false;
        const act = isMulti ? (itemsData[activePreviewIndex] || null) : null;
        return (typeof activeItemTitleSize === 'function') ? activeItemTitleSize(act) : (parseFloat(titleSize ? titleSize.value : 13) || 13);
      } else if (currentTargetKind === 'price') {
        return parseFloat(priceSize ? priceSize.value : 32) || 32;
      } else if (currentTargetKind === 'subtitle') {
        return parseFloat(subtitleSize ? subtitleSize.value : 10) || 10;
      } else if (currentTargetKind === 'bigdigit') {
        const dSize = document.getElementById('digitSize');
        return parseFloat(dSize ? dSize.value : 40) || 40;
      }
      return 13;
    }

    function applyQuickBarFontSize(newSize) {
      if (!currentTargetKind) return;
      const num = parseFloat(newSize);
      if (isNaN(num)) return;

      if (currentTargetKind === 'title') {
        const val = Math.max(6, Math.min(120, Math.round(num)));
        if (titleSize) titleSize.value = String(val);
        if (titleSizeVal) titleSizeVal.textContent = String(val);
        syncTitleSizePreview();

        if (templateFonts) templateFonts.titleSize = val;
        const isMulti = (typeof isMultiModeNow === 'function') ? isMultiModeNow() : false;
        if (isMulti && itemsData && itemsData[activePreviewIndex]) {
          const act = itemsData[activePreviewIndex];
          act.titleSize = val;
          if (!act.fonts) act.fonts = {};
          act.fonts.titleSize = val;
          act.fontsCustomized = true;
          // Ручное изменение через QuickBar — блокируем автоподгон.
          act.titleSizeManual = true;
        }
        if (previewTitle) previewTitle.style.fontSize = `${val}pt`;
        onFontInputChange();
      } else if (currentTargetKind === 'price') {
        const val = Math.max(8, Math.min(150, Math.round(num)));
        if (priceSize) priceSize.value = String(val);
        onFontInputChange();
      } else if (currentTargetKind === 'subtitle') {
        const val = Math.max(6, Math.min(80, Math.round(num)));
        if (subtitleSize) subtitleSize.value = String(val);
        onFontInputChange();
      } else if (currentTargetKind === 'bigdigit') {
        const dSize = document.getElementById('digitSize');
        if (dSize) {
          const val = Math.max(10, Math.min(150, Math.round(num)));
          dSize.value = String(val);
          dSize.dispatchEvent(new Event('input'));
          updatePreview();
        }
      }

      syncQuickBarValues();
      if (currentTargetEl) positionQuickBar(currentTargetEl);
    }

    function syncQuickBarValues() {
      if (!currentTargetKind) return;

      const curSize = getCurrentQuickBarFontSize();
      let curWeight = '800';
      let curItalic = false;
      let curColor = '#ffffff';

      if (currentTargetKind === 'title') {
        if (targetLabel) targetLabel.textContent = 'Название';
        curWeight = titleWeight ? titleWeight.value : '800';
        curItalic = titleItalic ? !!titleItalic.checked : false;
        curColor = titleColor ? titleColor.value : '#ffffff';
      } else if (currentTargetKind === 'price') {
        if (targetLabel) targetLabel.textContent = 'Цена';
        curWeight = priceWeight ? priceWeight.value : '800';
        curItalic = false;
        curColor = priceColor ? priceColor.value : '#000000';
      } else if (currentTargetKind === 'subtitle') {
        if (targetLabel) targetLabel.textContent = 'Вес / Описание';
        curWeight = subtitleWeight ? subtitleWeight.value : '700';
        curItalic = false;
        curColor = subtitleColor ? subtitleColor.value : '#ffffff';
      } else if (currentTargetKind === 'bigdigit') {
        if (targetLabel) targetLabel.textContent = 'Цифра';
        const dWeight = document.getElementById('digitWeight');
        const dColor = document.getElementById('digitColor');
        curWeight = dWeight ? dWeight.value : '900';
        curItalic = false;
        curColor = dColor ? dColor.value : '#ffffff';
      }

      if (fontSizeVal) {
        if ('value' in fontSizeVal) fontSizeVal.value = Math.round(curSize);
        fontSizeVal.textContent = Math.round(curSize);
      }
      if (boldBtn) {
        const isBold = curWeight === 'bold' || parseInt(curWeight, 10) >= 700;
        boldBtn.classList.toggle('active', isBold);
      }
      if (italicBtn) {
        italicBtn.classList.toggle('active', !!curItalic);
        italicBtn.style.opacity = (currentTargetKind === 'title') ? '1' : '0.4';
        italicBtn.style.pointerEvents = (currentTargetKind === 'title') ? 'auto' : 'none';
      }
      if (colorInput) colorInput.value = curColor;
      if (colorSwatch) colorSwatch.style.backgroundColor = curColor;
    }

    function openQuickBar(kind, el) {
      if (wobblerPreview && (
        wobblerPreview.classList.contains('drag-mode') ||
        wobblerPreview.classList.contains('drag-mode-solo') ||
        wobblerPreview.classList.contains('safe-edit-mode')
      )) {
        return;
      }
      currentTargetKind = kind;
      currentTargetEl = el;
      syncQuickBarValues();
      positionQuickBar(el);
    }

    // Слушатели клика на элементах предпросмотра
    if (previewTitle) {
      previewTitle.addEventListener('click', (e) => {
        openQuickBar('title', previewTitle);
      });
      previewTitle.addEventListener('focus', () => openQuickBar('title', previewTitle));
    }

    if (previewPriceBox) {
      previewPriceBox.addEventListener('click', () => openQuickBar('price', previewPriceBox));
    }
    if (previewPrice) {
      previewPrice.addEventListener('focus', () => openQuickBar('price', previewPriceBox || previewPrice));
    }

    if (previewSubtitle) {
      previewSubtitle.addEventListener('click', () => openQuickBar('subtitle', previewSubtitle));
      previewSubtitle.addEventListener('focus', () => openQuickBar('subtitle', previewSubtitle));
    }

    if (previewBigDigit) {
      previewBigDigit.addEventListener('click', () => openQuickBar('bigdigit', previewBigDigit));
      previewBigDigit.addEventListener('focus', () => openQuickBar('bigdigit', previewBigDigit));
    }

    // Кнопка уменьшения кегля (-1pt)
    if (fontMinus) {
      fontMinus.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!currentTargetKind) return;
        if (typeof pushHistoryState === 'function') pushHistoryState('Размер шрифта');
        const cur = getCurrentQuickBarFontSize();
        applyQuickBarFontSize(cur - 1);
      });
    }

    // Кнопка увеличения кегля (+1pt)
    if (fontPlus) {
      fontPlus.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!currentTargetKind) return;
        if (typeof pushHistoryState === 'function') pushHistoryState('Размер шрифта');
        const cur = getCurrentQuickBarFontSize();
        applyQuickBarFontSize(cur + 1);
      });
    }

    // Поле текущего кегля (прямой ввод числа)
    if (fontSizeVal) {
      fontSizeVal.addEventListener('change', () => {
        if (typeof pushHistoryState === 'function') pushHistoryState('Размер шрифта');
        applyQuickBarFontSize(fontSizeVal.value);
      });
      fontSizeVal.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          fontSizeVal.blur();
        }
      });
    }

    // Кнопка переключения жирности (Bold)
    if (boldBtn) {
      boldBtn.addEventListener('click', () => {
        if (!currentTargetKind) return;
        if (typeof pushHistoryState === 'function') pushHistoryState('Жирность QuickBar');
        if (currentTargetKind === 'title' && titleWeight) {
          const isB = titleWeight.value === 'bold' || parseInt(titleWeight.value, 10) >= 700;
          titleWeight.value = isB ? '400' : '800';
          onFontInputChange();
        } else if (currentTargetKind === 'price' && priceWeight) {
          const isB = priceWeight.value === 'bold' || parseInt(priceWeight.value, 10) >= 700;
          priceWeight.value = isB ? '400' : '800';
          onFontInputChange();
        } else if (currentTargetKind === 'subtitle' && subtitleWeight) {
          const isB = subtitleWeight.value === 'bold' || parseInt(subtitleWeight.value, 10) >= 700;
          subtitleWeight.value = isB ? '400' : '700';
          onFontInputChange();
        } else if (currentTargetKind === 'bigdigit') {
          const dWeight = document.getElementById('digitWeight');
          if (dWeight) {
            const isB = parseInt(dWeight.value, 10) >= 700;
            dWeight.value = isB ? '400' : '900';
            dWeight.dispatchEvent(new Event('input'));
            updatePreview();
          }
        }
        syncQuickBarValues();
      });
    }

    // Кнопка переключения курсива (Italic)
    if (italicBtn) {
      italicBtn.addEventListener('click', () => {
        if (currentTargetKind !== 'title') return;
        if (typeof pushHistoryState === 'function') pushHistoryState('Курсив QuickBar');
        if (titleItalic) {
          titleItalic.checked = !titleItalic.checked;
          onFontInputChange();
        }
        syncQuickBarValues();
      });
    }

    // Выбор цвета текста
    if (colorInput) {
      colorInput.addEventListener('input', (e) => {
        const val = e.target.value;
        if (colorSwatch) colorSwatch.style.backgroundColor = val;
        if (currentTargetKind === 'title' && titleColor) {
          titleColor.value = val;
          onFontInputChange();
        } else if (currentTargetKind === 'price' && priceColor) {
          priceColor.value = val;
          onFontInputChange();
        } else if (currentTargetKind === 'subtitle' && subtitleColor) {
          subtitleColor.value = val;
          onFontInputChange();
        } else if (currentTargetKind === 'bigdigit') {
          const dColor = document.getElementById('digitColor');
          if (dColor) {
            dColor.value = val;
            dColor.dispatchEvent(new Event('input'));
            updatePreview();
          }
        }
      });
    }

    // Закрытие при клике мимо холста и тулбара
    document.addEventListener('pointerdown', (e) => {
      if (quickBar.style.display === 'none') return;
      if (quickBar.contains(e.target)) return;
      if (wobblerPreview && wobblerPreview.contains(e.target)) return;
      hideQuickBar();
    });

    // Escape закрывает тулбар
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && quickBar.style.display !== 'none') {
        hideQuickBar();
      }
    });

    // При изменении размеров окна обновляем позицию
    window.addEventListener('resize', () => {
      if (quickBar.style.display !== 'none' && currentTargetEl) {
        positionQuickBar(currentTargetEl);
      }
    });

    // Экспортируем функцию закрытия для вызова при смене шаблона или режима
    window.__hideCanvasQuickBar = hideQuickBar;
  }
  setupCanvasQuickBar();

  // ===== Навигация между ценниками в окне предпросмотра =====
  function setActiveItemIndex(idx, animate = false) {
    if (!itemsData.length) return;
    const clamped = Math.max(0, Math.min(idx, itemsData.length - 1));
    activePreviewIndex = clamped;

    // Синхронизируем страницу раскладки А4 (если активный товар на другой странице)
    const isMultiMode = document.querySelector('input[name="printMode"]:checked')?.value === 'multi';
    if (isMultiMode && typeof calcA4Grid === 'function' && typeof effectiveCardHeight === 'function') {
      const wMm = (parseFloat(wobblerWidthInput.value) || 6.5) * 10;
      const hMm = (parseFloat(wobblerHeightInput.value) || 4.5) * 10;
      const effH = effectiveCardHeight(hMm);
      const grid = calcA4Grid(wMm, effH);
      const filledBefore = itemsData.slice(0, clamped).filter(it => it && it.title && it.title.trim()).length;
      const targetPage = Math.floor(filledBefore / Math.max(1, grid.maxCount));
      if (currentSheetPreviewPage !== targetPage) {
        currentSheetPreviewPage = targetPage;
      }
    }

    if (animate && wobblerPreview) {
      wobblerPreview.classList.remove('item-switched');
      void wobblerPreview.offsetWidth; // trigger reflow
      wobblerPreview.classList.add('item-switched');
    }

    syncFontControlsToContext();
    syncDecorControlsToContext();
    syncBgControlsToContext();
    updatePreview();

    // Подсветка строки в таблицах шторки и сайдбара
    document.querySelectorAll('.item-row').forEach((r) => {
      const rowIdx = parseInt(r.getAttribute('data-index') || r.dataset.index, 10);
      r.classList.toggle('active-preview-row', rowIdx === activePreviewIndex);
    });

    updatePreviewItemNav();
  }

  function updatePreviewItemNav() {
    const navEl = document.getElementById('previewItemNav');
    const sidePrevBtn = document.getElementById('previewSidePrevBtn');
    const sideNextBtn = document.getElementById('previewSideNextBtn');
    const floatIndicator = document.getElementById('previewFloatingIndicator');
    const floatText = document.getElementById('previewFloatingIndicatorText');

    const isMultiMode = document.querySelector('input[name="printMode"]:checked')?.value === 'multi';
    const showNav = isMultiMode && itemsData.length > 1;

    if (navEl) navEl.style.display = showNav ? 'inline-flex' : 'none';
    if (sidePrevBtn) sidePrevBtn.style.display = showNav ? 'flex' : 'none';
    if (sideNextBtn) sideNextBtn.style.display = showNav ? 'flex' : 'none';
    if (floatIndicator) floatIndicator.style.display = showNav ? 'block' : 'none';

    if (!showNav) return;

    const prevBtn = document.getElementById('prevItemBtn');
    const nextBtn = document.getElementById('nextItemBtn');
    const navText = document.getElementById('previewItemNavText');

    const isFirst = (activePreviewIndex <= 0);
    const isLast = (activePreviewIndex >= itemsData.length - 1);
    const labelStr = `Товар ${activePreviewIndex + 1} из ${itemsData.length}`;

    if (prevBtn) prevBtn.disabled = isFirst;
    if (nextBtn) nextBtn.disabled = isLast;
    if (navText) navText.textContent = labelStr;

    if (sidePrevBtn) sidePrevBtn.disabled = isFirst;
    if (sideNextBtn) sideNextBtn.disabled = isLast;
    if (floatText) floatText.textContent = labelStr;
  }

  function initPreviewItemNavigator() {
    const prevBtn = document.getElementById('prevItemBtn');
    const nextBtn = document.getElementById('nextItemBtn');
    const sidePrevBtn = document.getElementById('previewSidePrevBtn');
    const sideNextBtn = document.getElementById('previewSideNextBtn');
    const selectBtn = document.getElementById('itemNavSelectBtn');
    const menuEl = document.getElementById('itemNavDropdownMenu');

    if (prevBtn) {
      prevBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (activePreviewIndex > 0) setActiveItemIndex(activePreviewIndex - 1, true);
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (activePreviewIndex < itemsData.length - 1) setActiveItemIndex(activePreviewIndex + 1, true);
      });
    }

    if (sidePrevBtn) {
      sidePrevBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (activePreviewIndex > 0) setActiveItemIndex(activePreviewIndex - 1, true);
      });
    }

    if (sideNextBtn) {
      sideNextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (activePreviewIndex < itemsData.length - 1) setActiveItemIndex(activePreviewIndex + 1, true);
      });
    }

    function closeMenu() {
      if (menuEl) menuEl.style.display = 'none';
    }

    function toggleMenu(e) {
      e.stopPropagation();
      if (!menuEl) return;
      if (menuEl.style.display === 'flex' || menuEl.style.display === 'block') {
        closeMenu();
        return;
      }
      // Наполняем выпадающий список позиций
      menuEl.innerHTML = '';
      itemsData.forEach((it, idx) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'item-nav-dropdown-item' + (idx === activePreviewIndex ? ' active' : '');
        const titleStr = (it.title || '').trim() || `(Товар №${idx + 1})`;
        const priceStr = (it.price || '').trim() ? `${it.price} ₽` : '';
        btn.innerHTML = `
          <span class="item-num">#${idx + 1}</span>
          <span class="item-name" title="${titleStr}">${titleStr}</span>
          <span class="item-price">${priceStr}</span>
        `;
        btn.addEventListener('click', (ev) => {
          ev.stopPropagation();
          setActiveItemIndex(idx, true);
          closeMenu();
        });
        menuEl.appendChild(btn);
      });
      menuEl.style.display = 'flex';
    }

    if (selectBtn) selectBtn.addEventListener('click', toggleMenu);
    document.addEventListener('click', (e) => {
      if (menuEl && !menuEl.contains(e.target) && e.target !== selectBtn) {
        closeMenu();
      }
    });

    // Горячие клавиши (Alt+Left/Right или Ctrl+Left/Right)
    document.addEventListener('keydown', (e) => {
      const tag = (document.activeElement && document.activeElement.tagName) || '';
      const isEditable = document.activeElement && (
        tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement.isContentEditable
      );
      if (isEditable) return;

      const isMultiMode = document.querySelector('input[name="printMode"]:checked')?.value === 'multi';
      if (!isMultiMode || itemsData.length <= 1) return;

      if ((e.altKey || e.ctrlKey) && e.key === 'ArrowLeft') {
        e.preventDefault();
        if (activePreviewIndex > 0) setActiveItemIndex(activePreviewIndex - 1, true);
      } else if ((e.altKey || e.ctrlKey) && e.key === 'ArrowRight') {
        e.preventDefault();
        if (activePreviewIndex < itemsData.length - 1) setActiveItemIndex(activePreviewIndex + 1, true);
      }
    });

    // Свайпы на мобильных устройствах
    const stage = document.querySelector('.preview-stage') || wobblerPreview;
    if (stage) {
      let touchStartX = 0;
      let touchStartY = 0;
      let touchStartTime = 0;

      stage.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
          touchStartX = e.touches[0].clientX;
          touchStartY = e.touches[0].clientY;
          touchStartTime = Date.now();
        }
      }, { passive: true });

      stage.addEventListener('touchend', (e) => {
        if (e.changedTouches.length === 1) {
          const isDragActive = wobblerPreview && (
            wobblerPreview.classList.contains('drag-mode') ||
            wobblerPreview.classList.contains('drag-mode-solo') ||
            wobblerPreview.classList.contains('safe-edit-mode')
          );
          if (isDragActive) return;

          const dx = e.changedTouches[0].clientX - touchStartX;
          const dy = e.changedTouches[0].clientY - touchStartY;
          const dt = Date.now() - touchStartTime;

          // Горизонтальный свайп достаточной амплитуды
          if (dt < 400 && Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.5) {
            const isMultiMode = document.querySelector('input[name="printMode"]:checked')?.value === 'multi';
            if (!isMultiMode || itemsData.length <= 1) return;

            if (dx < 0 && activePreviewIndex < itemsData.length - 1) {
              setActiveItemIndex(activePreviewIndex + 1, true);
            } else if (dx > 0 && activePreviewIndex > 0) {
              setActiveItemIndex(activePreviewIndex - 1, true);
            }
          }
        }
      }, { passive: true });
    }
  }

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
      if (typeof multiPrintDrawer !== 'undefined' && multiPrintDrawer && multiPrintDrawer.classList.contains('open')) {
        renderMultiPrintTemplates();
        updateMultiPrintSummary();
      }
    });
  });

  // Print Handlers with Pre-Flight Audit Check
  function handlePrintRequest(isPdf = false, isMulti = false) {
    const audit = runPreflightAudit();
    if (audit.hasErrors || audit.hasWarnings) {
      showPreflightModal(() => {
        if (isPdf) downloadPrintAreaPdf(isMulti);
        else if (isMulti) runMultiPrintFromUI();
        else triggerPrint();
      });
    } else {
      if (isPdf) downloadPrintAreaPdf(isMulti);
      else if (isMulti) runMultiPrintFromUI();
      else triggerPrint();
    }
  }

  if (printBtn) printBtn.addEventListener('click', () => {
    handlePrintRequest(false, getPrintJobVal() === 'multi');
  });
  if (printBtnSidebar) printBtnSidebar.addEventListener('click', () => {
    handlePrintRequest(false, getPrintJobVal() === 'multi');
  });
  if (downloadPdfBtn) downloadPdfBtn.addEventListener('click', () => {
    handlePrintRequest(true, getPrintJobVal() === 'multi');
  });
  if (downloadPdfBtnSidebar) downloadPdfBtnSidebar.addEventListener('click', () => {
    handlePrintRequest(true, false);
  });



  const priceCentsSupToggle = document.getElementById('priceCentsSupToggle');
  if (priceCentsSupToggle) {
    priceCentsSupToggle.addEventListener('change', () => {
      updatePreview();
      scheduleSessionSave();
    });
  }

  // Bulk background button
  const bulkSetBgBtn = document.getElementById('bulkSetBgBtn');
  if (bulkSetBgBtn) {
    bulkSetBgBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const opts = getItemBgOptions();
      const preset = (activeTemplateRef && activeTemplateRef.kind === 'builtin') ? builtInPresets[activeTemplateRef.key] : null;
      const defaultBgImg = (preset && preset.bgImage) ? preset.bgImage : 'none';
      const it0 = itemsData[activePreviewIndex] || itemsData[0];
      const curImg = (it0 && it0.bgCustomized && it0.bg) ? it0.bg.bgImage : ((templateBg && templateBg.bgImage) || '');
      const currentBg = (curImg === defaultBgImg || curImg === 'none' || !curImg) ? '' : curImg;

      showItemQuickMenu(bulkSetBgBtn, opts, currentBg, (pickedVal) => {
        if (Array.isArray(itemsData)) {
          itemsData.forEach((it, idx) => {
            applyBackgroundAndAutolink('item', idx, pickedVal);
          });
        }
        if (pickedVal === '' || pickedVal === 'none') {
          applyBackgroundAndAutolink('template', -1, '');
        }
        refitActiveTitle();
        updatePreview();
        renderItemsListInputs();
        if (itemsDrawer && itemsDrawer.classList.contains('open')) renderDrawerItems();
        renderActiveTemplateColorBar();
        try { syncBgControlsToContext(); } catch (err) { }
        try { syncFontControlsToContext(); } catch (err) { }
        try { syncDecorControlsToContext(); } catch (err) { }
      });
    });
  }

  // Sheet page switcher
  const _prevSheetPageBtn = document.getElementById('prevSheetPageBtn');
  if (_prevSheetPageBtn) {
    _prevSheetPageBtn.addEventListener('click', () => {
      if (currentSheetPreviewPage > 0) {
        currentSheetPreviewPage--;
        updatePreview();
      }
    });
  }
  const _nextSheetPageBtn = document.getElementById('nextSheetPageBtn');
  if (_nextSheetPageBtn) {
    _nextSheetPageBtn.addEventListener('click', () => {
      currentSheetPreviewPage++;
      updatePreview();
    });
  }

  // ===== Мульти-печать: UI-логика =====
  // Размер каждого builtin-шаблона для подписи в панели.
  function presetSizeLabel(key) {
    const p = builtInPresets[key];
    if (!p) return '';
    return `${(p.widthCm || 0).toString().replace('.', ',')}×${(p.heightCm || 0).toString().replace('.', ',')} см`;
  }
  // Число заполненных ценников шаблона (с учётом тиража копий).
  function presetFilledCount(key) {
    const items = getItemsForTemplate(key);
    let total = 0;
    items.forEach(it => { total += Math.max(1, parseInt(it.count, 10) || 1); });
    return total;
  }

  // Строит список чекбоксов шаблонов с выбором числа копий (с сохранением текущего выбора).
  function renderMultiPrintTemplates() {
    if (!multiPrintTemplatesEl) return;
    const prevSelection = {};
    multiPrintTemplatesEl.querySelectorAll('.multi-print-row-item').forEach(row => {
      const chk = row.querySelector('input[data-mpi-chk]');
      const copiesSel = row.querySelector('select[data-mpi-copies]');
      if (chk) {
        prevSelection[chk.value] = {
          checked: chk.checked,
          copies: copiesSel ? copiesSel.value : 'auto'
        };
      }
    });

    const activeKey = (activeTemplateRef && activeTemplateRef.kind === 'builtin') ? activeTemplateRef.key : 'alaska_dots';
    const hasAnyPrev = Object.keys(prevSelection).length > 0;

    multiPrintTemplatesEl.innerHTML = TEMPLATE_KEYS.map(k => {
      const p = builtInPresets[k];
      const name = p ? p.name : k;
      const filled = presetFilledCount(k);
      const wasChecked = hasAnyPrev
        ? (prevSelection[k] ? prevSelection[k].checked : false)
        : (filled > 0 || k === activeKey);
      const savedCopies = prevSelection[k] ? prevSelection[k].copies : 'auto';
      const isEmpty = filled === 0;

      return `<div class="multi-print-row-item ${isEmpty ? 'is-empty' : ''}">
        <label class="checkbox-label" style="display:flex; align-items:center; gap:6px; flex:1; cursor:pointer;">
          <input type="checkbox" value="${k}" data-mpi-chk ${wasChecked ? 'checked' : ''}>
          <span class="mpi-name">${name}</span>
        </label>
        <span class="mpi-size">${presetSizeLabel(k)}</span>
        <span class="mpi-filled ${isEmpty ? 'is-empty' : ''}">${filled} шт.</span>
        <select data-mpi-copies style="${isEmpty ? 'opacity:0.6;' : ''}">
          <option value="auto" ${savedCopies === 'auto' ? 'selected' : ''}>все (${filled})</option>
          <option value="1" ${savedCopies === '1' ? 'selected' : ''}>1×</option>
          <option value="2" ${savedCopies === '2' ? 'selected' : ''}>2×</option>
          <option value="3" ${savedCopies === '3' ? 'selected' : ''}>3×</option>
          <option value="4" ${savedCopies === '4' ? 'selected' : ''}>4×</option>
          <option value="6" ${savedCopies === '6' ? 'selected' : ''}>6×</option>
          <option value="12" ${savedCopies === '12' ? 'selected' : ''}>12×</option>
        </select>
      </div>`;
    }).join('');

    // Обновлять сводку и раскладку при любом изменении.
    multiPrintTemplatesEl.querySelectorAll('input[data-mpi-chk], select[data-mpi-copies]').forEach(el => {
      el.addEventListener('change', () => {
        updateMultiPrintSummary();
        if (getPrintJobVal() === 'multi') updatePreview();
      });
    });
  }

  // Считает сводку (число ценников / листов) по отмеченным шаблонам и показывает её.
  function updateMultiPrintSummary() {
    if (!multiPrintSummaryEl) return;
    const selected = collectMultiSelection();
    if (!selected.length) {
      multiPrintSummaryEl.textContent = 'Шаблоны не выбраны';
      if (getPrintJobVal() === 'multi') updatePreview();
      return;
    }
    let count = 0;
    for (const sel of selected) {
      const items = getItemsForTemplate(sel.key);
      if (!items.length) continue;
      const copiesNum = (sel.copies === 'auto' || !sel.copies) ? 1 : (parseInt(sel.copies, 10) || 1);
      let templateTotal = 0;
      items.forEach(it => { templateTotal += Math.max(1, parseInt(it.count, 10) || 1); });
      count += templateTotal * copiesNum;
    }
    if (count === 0) {
      multiPrintSummaryEl.textContent = 'Нет заполненных товаров в выбранных шаблонах';
      if (getPrintJobVal() === 'multi') updatePreview();
      if (typeof updatePreflightPill === 'function') updatePreflightPill();
      return;
    }
    // Грубая оценка числа листов
    const pages = Math.max(1, Math.ceil(count / 24));
    multiPrintSummaryEl.textContent = `${count} ценник${count === 1 ? '' : (count < 5 ? 'а' : 'ов')} · ≈ ${pages} лист${pages === 1 ? '' : 'ев'}`;
    if (getPrintJobVal() === 'multi') updatePreview();
    if (typeof updatePreflightPill === 'function') updatePreflightPill();
  }

  // Собирает отмеченные шаблоны: [{ key, copies }].
  function collectMultiSelection() {
    if (!multiPrintTemplatesEl || !multiPrintTemplatesEl.children.length) {
      renderMultiPrintTemplates();
    }
    const rows = multiPrintTemplatesEl ? multiPrintTemplatesEl.querySelectorAll('.multi-print-row-item') : [];
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
    updatePreview();
  }

  // Открытие выдвижной панели мульти-печати: рендер шаблонов, дефолт-отметка
  // активного шаблона, обновление сводки.
  function openMultiPrintDrawer() {
    if (!multiPrintDrawer) return;
    renderMultiPrintTemplates();
    // Дефолт: отметить активный встроенный шаблон, если ничего не выбрано
    const anyChecked = multiPrintTemplatesEl && multiPrintTemplatesEl.querySelector('input[data-mpi-chk]:checked');
    if (!anyChecked && multiPrintTemplatesEl) {
      const activeKey = (activeTemplateRef && activeTemplateRef.kind === 'builtin') ? activeTemplateRef.key : 'alaska_dots';
      const chk = multiPrintTemplatesEl.querySelector('input[data-mpi-chk][value="' + activeKey + '"]');
      if (chk) chk.checked = true;
      else {
        const firstChk = multiPrintTemplatesEl.querySelector('input[data-mpi-chk]');
        if (firstChk) firstChk.checked = true;
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
      if (getPrintJobVal() === 'multi') updatePreview();
    });
  }
  if (multiPrintCropChk) {
    multiPrintCropChk.addEventListener('change', () => {
      if (getPrintJobVal() === 'multi') updatePreview();
    });
  }
  if (multiPrintBtn) multiPrintBtn.addEventListener('click', runMultiPrintFromUI);
  if (downloadMultiPdfBtnDrawer) downloadMultiPdfBtnDrawer.addEventListener('click', () => downloadPrintAreaPdf(true));
  const multiPrintBtnSidebar = document.getElementById('multiPrintBtnSidebar');
  const openMultiPrintDrawerBtn = document.getElementById('openMultiPrintDrawerBtn');
  if (multiPrintBtnSidebar) multiPrintBtnSidebar.addEventListener('click', runMultiPrintFromUI);
  if (downloadMultiPdfBtnSidebar) downloadMultiPdfBtnSidebar.addEventListener('click', () => downloadPrintAreaPdf(true));
  if (openMultiPrintDrawerBtn) openMultiPrintDrawerBtn.addEventListener('click', openMultiPrintDrawer);

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

  // --- Sidebar Category Tabs & View Mode Switcher (Табы / Все блоки) ---
  const controlsSidebarEl = document.getElementById('controlsSidebar');
  const sidebarTabBtns = document.querySelectorAll('.sidebar-tab-btn');
  const sidebarViewModeBtn = document.getElementById('sidebarViewModeBtn');
  const sidebarViewModeIcon = document.getElementById('sidebarViewModeIcon');
  const sidebarViewModeText = document.getElementById('sidebarViewModeText');

  function setSidebarTab(targetSectionId) {
    if (!targetSectionId) return;
    sidebarTabBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.target === targetSectionId);
    });

    const isTabsMode = controlsSidebarEl && controlsSidebarEl.classList.contains('sidebar-mode-tabs');
    document.querySelectorAll('.controls-sidebar .control-card').forEach(card => {
      const isTarget = card.id === targetSectionId;
      card.classList.toggle('active-tab-section', isTarget);
      if (isTabsMode && isTarget) {
        const toggle = card.querySelector('.card-toggle');
        const body = card.querySelector('.card-body');
        if (toggle) toggle.classList.remove('collapsed');
        if (body) body.style.display = '';
      }
    });

    if (!isTabsMode) {
      const targetCard = document.getElementById(targetSectionId);
      if (targetCard) {
        const toggle = targetCard.querySelector('.card-toggle');
        const body = targetCard.querySelector('.card-body');
        if (toggle) toggle.classList.remove('collapsed');
        if (body) body.style.display = '';
        targetCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }

    updateScopeBadges();
    localStorage.setItem('wobbler_active_sidebar_tab', targetSectionId);
  }

  sidebarTabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.target;
      if (target) setSidebarTab(target);
    });
  });

  function setSidebarViewMode(mode) {
    if (!controlsSidebarEl) return;
    const isTabs = mode === 'tabs';
    controlsSidebarEl.classList.toggle('sidebar-mode-tabs', isTabs);
    controlsSidebarEl.classList.toggle('sidebar-mode-all', !isTabs);
    if (sidebarViewModeIcon) sidebarViewModeIcon.textContent = isTabs ? '📑' : '📜';
    if (sidebarViewModeText) sidebarViewModeText.textContent = isTabs ? 'Табы' : 'Все блоки';
    localStorage.setItem('wobbler_sidebar_view_mode', mode);

    const savedTab = localStorage.getItem('wobbler_active_sidebar_tab') || 'section1';
    setSidebarTab(savedTab);
  }

  if (sidebarViewModeBtn) {
    sidebarViewModeBtn.addEventListener('click', () => {
      const currentIsTabs = controlsSidebarEl && controlsSidebarEl.classList.contains('sidebar-mode-tabs');
      setSidebarViewMode(currentIsTabs ? 'all' : 'tabs');
    });
  }

  // Restore saved view mode or default to tabs
  const savedSidebarMode = localStorage.getItem('wobbler_sidebar_view_mode') || 'tabs';
  setSidebarViewMode(savedSidebarMode);

  // --- Sub-Tabs for Section 3 (Шрифты: Название / Вес / Цена / Цифра) ---
  const fontSubTabBtns = document.querySelectorAll('[data-font-tab]');
  function setFontSubTab(tabName) {
    if (!tabName) return;
    if (tabName === 'digit' && !isSnekiDigitActive()) {
      tabName = 'title';
    }
    fontSubTabBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.fontTab === tabName);
    });
    const paneMap = {
      title: 'fontTabTitle',
      subtitle: 'fontTabSubtitle',
      price: 'fontTabPrice',
      digit: 'fontTabDigit'
    };
    Object.keys(paneMap).forEach(key => {
      const pane = document.getElementById(paneMap[key]);
      if (pane) pane.classList.toggle('active', key === tabName);
    });
    localStorage.setItem('wobbler_active_font_subtab', tabName);
  }
  fontSubTabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const t = btn.dataset.fontTab;
      if (t) setFontSubTab(t);
    });
  });
  const savedFontSubTab = localStorage.getItem('wobbler_active_font_subtab') || 'title';
  setFontSubTab(savedFontSubTab);

  // --- Sub-Tabs for Section 5 (Оформление: Сверху / Внутри / Снизу) ---
  const decorSubTabBtns = document.querySelectorAll('[data-decor-tab]');
  function setDecorSubTab(tabName) {
    if (!tabName) return;
    decorSubTabBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.decorTab === tabName);
    });
    const paneMap = {
      outside: 'decorTabOutside',
      inside: 'decorTabInside',
      bottom: 'decorTabBottom'
    };
    Object.keys(paneMap).forEach(key => {
      const pane = document.getElementById(paneMap[key]);
      if (pane) pane.classList.toggle('active', key === tabName);
    });
    localStorage.setItem('wobbler_active_decor_subtab', tabName);
  }
  decorSubTabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const t = btn.dataset.decorTab;
      if (t) setDecorSubTab(t);
    });
  });
  const savedDecorSubTab = localStorage.getItem('wobbler_active_decor_subtab') || 'outside';
  setDecorSubTab(savedDecorSubTab);

  // Sync Decor Tab Active Dots (green dots when decor blocks are enabled)
  function syncDecorTabDots() {
    const outChk = document.getElementById('decorOutsideShow');
    const inChk = document.getElementById('decorInsideShow');
    const botChk = document.getElementById('decorBottomShow');
    const outDot = document.getElementById('decorOutsideDot');
    const inDot = document.getElementById('decorInsideDot');
    const botDot = document.getElementById('decorBottomDot');
    if (outDot && outChk) outDot.classList.toggle('active-dot', outChk.checked);
    if (inDot && inChk) inDot.classList.toggle('active-dot', inChk.checked);
    if (botDot && botChk) botDot.classList.toggle('active-dot', botChk.checked);
  }
  ['decorOutsideShow', 'decorInsideShow', 'decorBottomShow'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('change', syncDecorTabDots);
  });
  syncDecorTabDots();

  // --- Collapsible Excel Quick-Paste Drawer ---
  const toggleExcelPasteBtn = document.getElementById('toggleExcelPasteBtn');
  const excelPasteDrawer = document.getElementById('excelPasteDrawer');
  if (toggleExcelPasteBtn && excelPasteDrawer) {
    toggleExcelPasteBtn.addEventListener('click', () => {
      const isCollapsed = excelPasteDrawer.classList.toggle('is-collapsed');
      toggleExcelPasteBtn.classList.toggle('is-open', !isCollapsed);
    });
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
  const FIELD_SUB_KEYS = {
    'font-title': 'wobbler_sub_font_title',
    'font-subtitle': 'wobbler_sub_font_subtitle',
    'font-price': 'wobbler_sub_font_price',
    'decor-outside': 'wobbler_sub_decor_outside',
    'decor-inside': 'wobbler_sub_decor_inside',
    'decor-bottom': 'wobbler_sub_decor_bottom'
  };
  document.querySelectorAll('.sub-toggle').forEach(btn => {
    const group = btn.closest('.sub-group');
    if (!group) return;
    const key = btn.dataset.subgroup;
    if (key && FIELD_SUB_KEYS[key]) {
      group.classList.toggle('is-collapsed', localStorage.getItem(FIELD_SUB_KEYS[key]) === '1');
    }
    btn.addEventListener('click', (e) => {
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

  // --- Переключатель режима монтажного стола: «Ценник крупно» / «Лист А4» ---
  const viewModeTagBtn = document.getElementById('viewModeTagBtn');
  const viewModeSheetBtn = document.getElementById('viewModeSheetBtn');
  const workspacePanelEl = document.getElementById('workspacePanel');

  function setWorkspaceViewMode(mode) {
    if (!workspacePanelEl) return;
    if (mode === 'sheet') {
      workspacePanelEl.classList.add('view-sheet-mode');
      viewModeSheetBtn?.classList.add('active');
      viewModeTagBtn?.classList.remove('active');
      if (sheetMiniContainer && sheetMiniContainer.classList.contains('is-collapsed')) {
        toggleSheetBtn?.click();
      }
      sheetMiniContainer?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } else {
      workspacePanelEl.classList.remove('view-sheet-mode');
      viewModeTagBtn?.classList.add('active');
      viewModeSheetBtn?.classList.remove('active');
      if (singlePreviewContainer && singlePreviewContainer.classList.contains('is-collapsed')) {
        togglePreviewBtn?.click();
      }
      singlePreviewContainer?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  viewModeTagBtn?.addEventListener('click', () => setWorkspaceViewMode('tag'));
  viewModeSheetBtn?.addEventListener('click', () => setWorkspaceViewMode('sheet'));

  // Initialize Device Mode
  const savedDeviceMode = localStorage.getItem('wobbler_device_mode') || 'auto';
  setDeviceMode(savedDeviceMode);
  setMobileActiveTab('preview');

  // ==========================================================================
  // --- USABILITY SUITE 2026: Undo/Redo, Live Search, Tab Badges, Overflow ---
  // ==========================================================================

  // --- 1. Undo / Redo История изменений (Ctrl+Z / Ctrl+Y) ---
  const MAX_HISTORY_STEPS = 25;
  const historyUndoStack = [];
  const historyRedoStack = [];
  let isHistoryNavigating = false;
  let historyDebounceTimer = null;

  const undoBtn = document.getElementById('undoBtn');
  const redoBtn = document.getElementById('redoBtn');

  function getHistorySnapshot(description = '') {
    const key = (typeof activeItemsKey !== 'undefined' && activeItemsKey) ? activeItemsKey : (typeof activeTemplateRef !== 'undefined' && activeTemplateRef?.key ? activeTemplateRef.key : 'alaska_dots');
    return {
      description,
      timestamp: Date.now(),
      templateKey: key,
      activePreviewIndex: typeof activePreviewIndex === 'number' ? activePreviewIndex : 0,
      items: JSON.parse(JSON.stringify(itemsData || [])),
      state: typeof getCurrentState === 'function' ? JSON.parse(JSON.stringify(getCurrentState())) : null
    };
  }

  let preInputFocusSnapshot = null;

  function captureStateBeforeInput(desc = 'Ввод текста') {
    if (!preInputFocusSnapshot) {
      preInputFocusSnapshot = getHistorySnapshot(desc);
    }
  }

  function commitStateBeforeInput() {
    if (preInputFocusSnapshot) {
      if (historyUndoStack.length > 0) {
        const last = historyUndoStack[historyUndoStack.length - 1];
        if (JSON.stringify(last.items) === JSON.stringify(preInputFocusSnapshot.items) &&
          JSON.stringify(last.state) === JSON.stringify(preInputFocusSnapshot.state)) {
          preInputFocusSnapshot = null;
          return;
        }
      }
      historyUndoStack.push(preInputFocusSnapshot);
      if (historyUndoStack.length > MAX_HISTORY_STEPS) {
        historyUndoStack.shift();
      }
      historyRedoStack.length = 0;
      updateHistoryButtons();
      preInputFocusSnapshot = null;
    }
  }

  function pushHistoryState(description = '', immediate = false) {
    if (isHistoryNavigating) return;

    function doPush() {
      const snap = getHistorySnapshot(description);
      if (historyUndoStack.length > 0) {
        const last = historyUndoStack[historyUndoStack.length - 1];
        if (JSON.stringify(last.items) === JSON.stringify(snap.items) &&
          JSON.stringify(last.state) === JSON.stringify(snap.state)) {
          return;
        }
      }
      historyUndoStack.push(snap);
      if (historyUndoStack.length > MAX_HISTORY_STEPS) {
        historyUndoStack.shift();
      }
      historyRedoStack.length = 0;
      updateHistoryButtons();
    }

    if (immediate) {
      if (historyDebounceTimer) clearTimeout(historyDebounceTimer);
      doPush();
    } else {
      if (historyDebounceTimer) clearTimeout(historyDebounceTimer);
      historyDebounceTimer = setTimeout(doPush, 400);
    }
  }

  function updateHistoryButtons() {
    if (undoBtn) {
      undoBtn.disabled = historyUndoStack.length === 0;
      if (historyUndoStack.length > 0) {
        const last = historyUndoStack[historyUndoStack.length - 1];
        undoBtn.title = `Отменить: ${last.description || 'действие'} (Ctrl+Z)`;
      } else {
        undoBtn.title = 'Отменить (Ctrl+Z)';
      }
    }
    if (redoBtn) {
      redoBtn.disabled = historyRedoStack.length === 0;
      if (historyRedoStack.length > 0) {
        const next = historyRedoStack[historyRedoStack.length - 1];
        redoBtn.title = `Повторить: ${next.description || 'действие'} (Ctrl+Y)`;
      } else {
        redoBtn.title = 'Повторить (Ctrl+Y)';
      }
    }
  }

  function undoAction() {
    if (historyUndoStack.length === 0) {
      if (typeof showToast === 'function') showToast('Нет действий для отмены (Ctrl+Z)', 'info', 1500);
      return;
    }
    isHistoryNavigating = true;

    const currentSnap = getHistorySnapshot('Перед отменой');
    historyRedoStack.push(currentSnap);

    const prevSnap = historyUndoStack.pop();
    applyHistorySnapshot(prevSnap);
    updateHistoryButtons();
    isHistoryNavigating = false;
    showToast(`Отменено: ${prevSnap.description || 'действие'}`, 'info', 1800);
  }

  function redoAction() {
    if (historyRedoStack.length === 0) {
      if (typeof showToast === 'function') showToast('Нет действий для повтора (Ctrl+Y)', 'info', 1500);
      return;
    }
    isHistoryNavigating = true;

    const currentSnap = getHistorySnapshot('Перед повтором');
    historyUndoStack.push(currentSnap);

    const nextSnap = historyRedoStack.pop();
    applyHistorySnapshot(nextSnap);
    updateHistoryButtons();
    isHistoryNavigating = false;
    showToast(`Повторено: ${nextSnap.description || 'действие'}`, 'info', 1800);
  }

  function applyHistorySnapshot(snap) {
    if (!snap) return;
    if (snap.items && Array.isArray(snap.items)) {
      itemsData.length = 0;
      snap.items.forEach(it => itemsData.push(JSON.parse(JSON.stringify(it))));
    }
    if (typeof snap.activePreviewIndex === 'number' && snap.activePreviewIndex >= 0) {
      activePreviewIndex = Math.min(snap.activePreviewIndex, Math.max(0, itemsData.length - 1));
    }
    if (snap.state && typeof applyState === 'function') {
      applyState(snap.state);
    }
    renderItemsListInputs();
    updatePreview();
    scheduleSessionSave();
    if (typeof updateSortMenuButtonsState === 'function') updateSortMenuButtonsState();
  }

  if (undoBtn) undoBtn.addEventListener('click', undoAction);
  if (redoBtn) redoBtn.addEventListener('click', redoAction);

  // Глобальные горячие клавиши (Productivity Shortcuts)
  window.addEventListener('keydown', (e) => {
    // Ctrl+P / Cmd+P (Интерцепт браузерной печати -> Предпечатный аудит и печать ценников)
    if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'p' || e.code === 'KeyP')) {
      e.preventDefault();
      handlePrintRequest(false, typeof getPrintJobVal === 'function' && getPrintJobVal() === 'multi');
      return;
    }

    const isCtrlOrMeta = e.ctrlKey || e.metaKey;
    const keyLower = (e.key || '').toLowerCase();
    const isKeyZ = keyLower === 'z' || keyLower === 'я' || e.code === 'KeyZ';
    const isKeyY = keyLower === 'y' || keyLower === 'н' || e.code === 'KeyY';

    // Ctrl+Z / Cmd+Z (Undo)
    if (isCtrlOrMeta && isKeyZ && !e.shiftKey) {
      e.preventDefault();
      if (document.activeElement && ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
        document.activeElement.blur();
      }
      undoAction();
      return;
    }

    // Ctrl+Y / Cmd+Y или Ctrl+Shift+Z (Redo)
    if (isCtrlOrMeta && (isKeyY || (isKeyZ && e.shiftKey))) {
      e.preventDefault();
      if (document.activeElement && ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
        document.activeElement.blur();
      }
      redoAction();
      return;
    }

    // Ctrl+F (Быстрый переход в поиск по товарам)
    if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'f' || e.code === 'KeyF')) {
      const drawerEl = document.getElementById('itemsDrawer');
      const drawerOpen = drawerEl && drawerEl.classList.contains('open');
      if (drawerOpen) {
        const idrSearch = document.getElementById('idrSearchInput');
        if (idrSearch) {
          e.preventDefault();
          idrSearch.focus();
          idrSearch.select();
        }
      } else {
        const sideBox = document.getElementById('sidebarSearchBox');
        const sideInput = document.getElementById('sidebarSearchInput');
        if (sideBox && sideInput) {
          e.preventDefault();
          sideBox.style.display = 'flex';
          sideInput.focus();
          sideInput.select();
        }
      }
      return;
    }

    // ? (Открыть / закрыть шпаргалку горячих клавиш)
    if (e.key === '?' || (e.shiftKey && (e.key === '/' || e.code === 'Slash'))) {
      const activeEl = document.activeElement;
      const isInput = activeEl && ['INPUT', 'TEXTAREA', 'SELECT'].includes(activeEl.tagName);
      if (!isInput) {
        e.preventDefault();
        if (typeof toggleShortcutsModal === 'function') toggleShortcutsModal();
      }
      return;
    }

    // Escape (Закрыть открытые модалки, шпаргалку, сбросить выбор)
    if (e.key === 'Escape') {
      if (typeof shortcutsModal !== 'undefined' && shortcutsModal && shortcutsModal.style.display !== 'none') {
        shortcutsModal.style.display = 'none';
        return;
      }
      if (typeof preflightModal !== 'undefined' && preflightModal && preflightModal.style.display !== 'none') {
        preflightModal.style.display = 'none';
        return;
      }
      if (typeof sidebarSortMenu !== 'undefined' && sidebarSortMenu && sidebarSortMenu.style.display !== 'none') {
        sidebarSortMenu.style.display = 'none';
      }
      if (typeof idrSortMenu !== 'undefined' && idrSortMenu && idrSortMenu.style.display !== 'none') {
        idrSortMenu.style.display = 'none';
      }
      if (typeof selectedItemIndices !== 'undefined' && selectedItemIndices && selectedItemIndices.size > 0) {
        if (typeof toggleSelectAll === 'function') toggleSelectAll(false);
      }
    }
  });

  // --- 2. Живой поиск и фильтрация товаров в таблице ---
  let goodsSearchQuery = '';

  function applyGoodsFilter() {
    const q = (goodsSearchQuery || '').trim().toLowerCase();
    const isFiltered = q.length > 0;

    let matchedCount = 0;
    const totalCount = itemsData.filter(isItemFilled).length;

    // Сайдбар
    const sidebarRows = itemsListContainer ? itemsListContainer.querySelectorAll('.item-row') : [];
    sidebarRows.forEach(row => {
      const idx = parseInt(row.querySelector('.item-title-input')?.getAttribute('data-index') || '-1', 10);
      if (idx < 0 || !itemsData[idx]) return;
      const it = itemsData[idx];
      const match = !isFiltered || (
        (it.title || '').toLowerCase().includes(q) ||
        (it.subtitle || '').toLowerCase().includes(q) ||
        (it.price || '').toLowerCase().includes(q)
      );
      row.style.display = match ? '' : 'none';
      row.classList.toggle('search-matched', isFiltered && match);
      if (match && isItemFilled(it)) matchedCount++;
    });

    // Шторка
    const drawerRows = idrItemsList ? idrItemsList.querySelectorAll('.item-row') : [];
    drawerRows.forEach(row => {
      const idx = parseInt(row.querySelector('.item-title-input')?.getAttribute('data-index') || '-1', 10);
      if (idx < 0 || !itemsData[idx]) return;
      const it = itemsData[idx];
      const match = !isFiltered || (
        (it.title || '').toLowerCase().includes(q) ||
        (it.subtitle || '').toLowerCase().includes(q) ||
        (it.price || '').toLowerCase().includes(q)
      );
      row.style.display = match ? '' : 'none';
      row.classList.toggle('search-matched', isFiltered && match);
    });

    // Бейджи и кнопки очистки
    const idrCount = document.getElementById('idrSearchCount');
    const idrClear = document.getElementById('idrSearchClearBtn');
    const sideCount = document.getElementById('sidebarSearchCount');
    const sideClear = document.getElementById('sidebarSearchClearBtn');

    if (idrCount) {
      idrCount.style.display = isFiltered ? '' : 'none';
      idrCount.textContent = `${matchedCount} из ${totalCount}`;
    }
    if (idrClear) idrClear.style.display = isFiltered ? '' : 'none';

    if (sideCount) {
      sideCount.style.display = isFiltered ? '' : 'none';
      sideCount.textContent = `${matchedCount} из ${totalCount}`;
    }
    if (sideClear) sideClear.style.display = isFiltered ? '' : 'none';

    // «Ничего не найдено» — приглашение сбросить поиск, а не пустая тишина
    const showNoResults = isFiltered && matchedCount === 0;
    [itemsListContainer, idrItemsList].forEach(container => {
      if (!container) return;
      let el = container.querySelector('.items-no-results');
      if (showNoResults) {
        if (!el) {
          el = document.createElement('div');
          el.className = 'items-no-results';
          const msg = document.createElement('span');
          msg.className = 'items-no-results-msg';
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'btn btn-secondary btn-xs items-no-results-reset';
          btn.textContent = 'Сбросить поиск';
          btn.addEventListener('click', () => setGoodsSearch(''));
          el.append(msg, btn);
          container.appendChild(el);
        }
        el.querySelector('.items-no-results-msg').textContent = `Ничего не найдено по «${q}»`;
      } else if (el) {
        el.remove();
      }
    });
  }

  function setGoodsSearch(query) {
    goodsSearchQuery = query;
    const idrInp = document.getElementById('idrSearchInput');
    const sideInp = document.getElementById('sidebarSearchInput');
    if (idrInp && idrInp.value !== query) idrInp.value = query;
    if (sideInp && sideInp.value !== query) sideInp.value = query;
    applyGoodsFilter();
  }

  const idrSearchInput = document.getElementById('idrSearchInput');
  const idrSearchClearBtn = document.getElementById('idrSearchClearBtn');
  const sidebarSearchToggleBtn = document.getElementById('sidebarSearchToggleBtn');
  const sidebarSearchBox = document.getElementById('sidebarSearchBox');
  const sidebarSearchInput = document.getElementById('sidebarSearchInput');
  const sidebarSearchClearBtn = document.getElementById('sidebarSearchClearBtn');

  if (idrSearchInput) {
    idrSearchInput.addEventListener('input', (e) => setGoodsSearch(e.target.value));
    idrSearchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        setGoodsSearch('');
        idrSearchInput.blur();
      }
    });
  }
  if (idrSearchClearBtn) {
    idrSearchClearBtn.addEventListener('click', () => {
      setGoodsSearch('');
      if (idrSearchInput) idrSearchInput.focus();
    });
  }

  if (sidebarSearchToggleBtn) {
    sidebarSearchToggleBtn.addEventListener('click', () => {
      if (!sidebarSearchBox) return;
      const isHidden = sidebarSearchBox.style.display === 'none';
      sidebarSearchBox.style.display = isHidden ? 'flex' : 'none';
      if (isHidden && sidebarSearchInput) {
        sidebarSearchInput.focus();
      }
    });
  }
  if (sidebarSearchInput) {
    sidebarSearchInput.addEventListener('input', (e) => setGoodsSearch(e.target.value));
    sidebarSearchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        setGoodsSearch('');
        if (sidebarSearchBox) sidebarSearchBox.style.display = 'none';
      }
    });
  }
  if (sidebarSearchClearBtn) {
    sidebarSearchClearBtn.addEventListener('click', () => {
      setGoodsSearch('');
      if (sidebarSearchInput) sidebarSearchInput.focus();
    });
  }

  // --- 2.1. Умная сортировка товаров (Dropdowns) ---
  const sidebarSortBtn = document.getElementById('sidebarSortBtn');
  const sidebarSortMenu = document.getElementById('sidebarSortMenu');
  const idrSortBtn = document.getElementById('idrSortBtn');
  const idrSortMenu = document.getElementById('idrSortMenu');

  function updateSortMenuButtonsState() {
    const hasRestore = initialItemsOrderBeforeSort !== null;
    [sidebarSortMenu, idrSortMenu].forEach(menu => {
      if (!menu) return;
      menu.querySelectorAll('[data-sort="restore-original"]').forEach(btn => {
        btn.style.opacity = hasRestore ? '1' : '0.55';
        btn.title = hasRestore ? 'Вернуть исходный порядок товаров (как было до сортировки)' : 'Порядок товаров ещё не менялся';
      });
    });
  }

  function setupSortDropdown(btn, menu) {
    if (!btn || !menu) return;
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isVisible = menu.style.display === 'flex' || menu.style.display === 'block';
      if (sidebarSortMenu) sidebarSortMenu.style.display = 'none';
      if (idrSortMenu) idrSortMenu.style.display = 'none';
      if (!isVisible) {
        updateSortMenuButtonsState();
        menu.style.display = 'flex';
      } else {
        menu.style.display = 'none';
      }
    });

    menu.querySelectorAll('.sort-menu-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        const criterion = item.getAttribute('data-sort');
        menu.style.display = 'none';
        sortItems(criterion);
      });
    });
  }

  setupSortDropdown(sidebarSortBtn, sidebarSortMenu);
  setupSortDropdown(idrSortBtn, idrSortMenu);
  updateSortMenuButtonsState();

  document.addEventListener('click', (e) => {
    if (sidebarSortMenu && sidebarSortMenu.style.display !== 'none' && !sidebarSortMenu.contains(e.target) && !sidebarSortBtn?.contains(e.target)) {
      sidebarSortMenu.style.display = 'none';
    }
    if (idrSortMenu && idrSortMenu.style.display !== 'none' && !idrSortMenu.contains(e.target) && !idrSortBtn?.contains(e.target)) {
      idrSortMenu.style.display = 'none';
    }
  });

  // --- 3. Умный индикатор переполнения текста (Text Overflow Warning) ---
  const textOverflowBadge = document.getElementById('textOverflowBadge');
  const overflowAutoFitBtn = document.getElementById('overflowAutoFitBtn');

  function checkTextOverflow() {
    if (!textOverflowBadge || !previewTitle) return;

    if (document.body.classList.contains('is-printing')) {
      textOverflowBadge.style.display = 'none';
      return;
    }

    const titleText = (previewTitle.textContent || '').trim();
    if (!titleText) {
      textOverflowBadge.style.display = 'none';
      return;
    }

    let isOverflowing = false;

    // Текущий установленный кегль названия
    const currentSize = parseFloat(previewTitle.style.fontSize) || parseFloat(titleSize ? titleSize.value : 13) || 13;
    const family = (titleFont ? titleFont.value : '') || previewTitle.style.fontFamily || '';
    const weight = (titleWeight ? titleWeight.value : '800') || previewTitle.style.fontWeight || '800';

    // 1. Проверяем через probe: влезает ли текст при ТЕКУЩЕМ кегле в допустимую геометрию
    try {
      const wCm = parseFloat(wobblerWidthInput ? wobblerWidthInput.value : 6.5) || 6.5;
      const hCm = parseFloat(wobblerHeightInput ? wobblerHeightInput.value : 4.5) || 4.5;
      const wMm = wCm * 10;
      const hMm = hCm * 10;
      const bg = resolveItemBg(activePreviewIndex);
      const ts = (bg && bg.titleSafe) ? bg.titleSafe : { left: 0, right: 0, top: 0, bottom: 0 };
      const headerHm = currentLayout === 'full' ? hMm : hMm * (parseFloat(headerHeightRange ? headerHeightRange.value : 20.45) || 20.45) / 100;
      const bySafeH = headerHm * Math.max(0, 1 - ts.top - ts.bottom);
      const hasPrice = isTemplatePriceSlotAvailable(activeTemplateRef, currentLayout, rybaPriceInBottom && currentLayout === 'split');
      const mult = hasPrice ? 0.45 : 1.0;
      const tzMm = Math.min(headerHm * mult, bySafeH);
      const padMm = (borderMm > 0) ? borderMm : 3;
      const contentW_mm = Math.max(10, wMm - padMm * 2);
      const safeW_mm = wMm * (1 - ts.left - ts.right);
      const titleW_mm = Math.min(contentW_mm, safeW_mm);
      const pxPerMm = 96 / 25.4;
      const budgetW = Math.max(10, (titleW_mm - 1.5) * pxPerMm);
      const budgetH = tzMm * pxPerMm;

      const probe = getTitleProbe(budgetW);
      probe.style.fontFamily = family;
      probe.style.fontWeight = weight;
      probe.style.fontSize = `${currentSize}pt`;
      const isIt = (templateFonts && templateFonts.titleItalic) || (titleItalic && titleItalic.checked);
      probe.style.fontStyle = isIt ? 'italic' : 'normal';
      probe.textContent = formatSmartTitle(titleText);

      const rect = probe.getBoundingClientRect();
      const measuredH = (rect && rect.height > 0) ? rect.height : probe.offsetHeight;
      const measuredW = probe.scrollWidth;
      const clientW = probe.clientWidth || budgetW;
      const overflowsX = (measuredW - clientW) > 3.5 || measuredW > (budgetW + 6);

      // Если текст при текущем размере не умещается по высоте или ширине
      if ((measuredH > 0 && measuredH > budgetH + 1.5) || overflowsX) {
        isOverflowing = true;
      }
    } catch (err) {
      console.warn('checkTextOverflow probe error:', err);
    }

    // 2. Сравнение с fitTitleSize: если идеальный кегль меньше текущего
    if (!isOverflowing) {
      try {
        const maxFit = fitTitleSize(titleText, family, weight);
        if (maxFit != null && maxFit < currentSize - 0.5) {
          isOverflowing = true;
        }
      } catch (_) { }
    }

    // 3. Проверка наложения на блок цены (если цена отображается)
    if (!isOverflowing) {
      try {
        const priceBox = document.getElementById('previewPriceBox');
        if (priceBox && priceBox.style.display !== 'none' && priceBox.offsetParent !== null && previewTitle.offsetParent !== null) {
          const titleRect = previewTitle.getBoundingClientRect();
          const priceRect = priceBox.getBoundingClientRect();
          const overlapX = Math.max(0, Math.min(titleRect.right, priceRect.right) - Math.max(titleRect.left, priceRect.left));
          const overlapY = Math.max(0, Math.min(titleRect.bottom, priceRect.bottom) - Math.max(titleRect.top, priceRect.top));
          if (overlapX > 4 && overlapY > 4) {
            isOverflowing = true;
          }
        }
      } catch (_) { }
    }

    textOverflowBadge.style.display = isOverflowing ? 'inline-flex' : 'none';
    if (typeof checkAllRowsTextOverflow === 'function') checkAllRowsTextOverflow();
  }

  // Инлайн-проверка переполнения для всех строк таблицы товаров
  function checkAllRowsTextOverflow() {
    const rows = document.querySelectorAll('.item-row');
    if (!rows.length) return;
    const family = (titleFont ? titleFont.value : '') || 'Arial, sans-serif';
    const weight = (titleWeight ? titleWeight.value : '800') || '800';

    rows.forEach(row => {
      const titleInput = row.querySelector('.item-title-input');
      const warnBtn = row.querySelector('.item-overflow-warn-btn');
      if (!titleInput || !warnBtn) return;
      const idx = parseInt(titleInput.getAttribute('data-index'), 10);
      if (isNaN(idx) || !itemsData[idx]) return;

      const titleText = (itemsData[idx].title || '').trim();
      if (!titleText) {
        warnBtn.style.display = 'none';
        return;
      }

      const currentSize = itemsData[idx].titleSize || parseFloat(titleSize ? titleSize.value : 13) || 13;
      try {
        const maxFit = fitTitleSize(titleText, family, weight);
        if (maxFit != null && maxFit < currentSize - 0.75) {
          warnBtn.style.display = 'inline-flex';
          warnBtn.title = `Текст названия не помещается в ценник (текущий: ${currentSize}pt, влезает: ${maxFit.toFixed(0)}pt).\nНажмите, чтобы подогнать размер!`;
        } else {
          warnBtn.style.display = 'none';
        }
      } catch (_) {
        warnBtn.style.display = 'none';
      }
    });
  }

  if (overflowAutoFitBtn) {
    overflowAutoFitBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const it = itemsData[activePreviewIndex];
      if (it) delete it.titleSizeManual;
      refitActiveTitle(true);
      autoFitFontSize();
      checkTextOverflow();
      showToast('Размер шрифта автоматически подогнан под границы ценника!', 'success', 2200);
    });
  }

  // --- 4. Индикаторы кастомизации на вкладках сайдбара (Customized Badges) ---
  function updateSidebarCustomBadges() {
    const tabBadgeFonts = document.getElementById('tabBadgeFonts');
    const tabBadgeBg = document.getElementById('tabBadgeBg');
    const tabBadgeDecor = document.getElementById('tabBadgeDecor');

    if (!isMultiModeNow() || !itemsData || !itemsData[activePreviewIndex]) {
      if (tabBadgeFonts) tabBadgeFonts.style.display = 'none';
      if (tabBadgeBg) tabBadgeBg.style.display = 'none';
      if (tabBadgeDecor) tabBadgeDecor.style.display = 'none';
      return;
    }

    const it = itemsData[activePreviewIndex];
    if (tabBadgeFonts) {
      tabBadgeFonts.style.display = it.fontsCustomized ? 'block' : 'none';
    }
    if (tabBadgeBg) {
      tabBadgeBg.style.display = it.bgCustomized ? 'block' : 'none';
    }
    if (tabBadgeDecor) {
      tabBadgeDecor.style.display = it.decorCustomized ? 'block' : 'none';
    }
  }

  // --- 5. Предпечатный аудит (Pre-Flight Safety Check) ---
  const preflightModal = document.getElementById('preflightModal');
  const preflightSummaryBanner = document.getElementById('preflightSummaryBanner');
  const preflightList = document.getElementById('preflightList');
  const preflightFixBtn = document.getElementById('preflightFixBtn');
  const preflightForcePrintBtn = document.getElementById('preflightForcePrintBtn');
  const preflightCloseBtn = document.getElementById('preflightCloseBtn');
  let preflightProceedCallback = null;

  // === Расчёт цветового контраста WCAG 2.1 ===
  function parseColorToRgb(colorStr, fallback = [255, 255, 255]) {
    if (!colorStr) return fallback;
    const s = colorStr.trim();
    if (s.startsWith('#')) {
      let hex = s.slice(1);
      if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
      if (hex.length === 6) {
        return [
          parseInt(hex.slice(0, 2), 16) || 0,
          parseInt(hex.slice(2, 4), 16) || 0,
          parseInt(hex.slice(4, 6), 16) || 0
        ];
      }
    }
    const m = s.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
    if (m) {
      return [parseInt(m[1], 10), parseInt(m[2], 10), parseInt(m[3], 10)];
    }
    return fallback;
  }

  function getLuminance(r, g, b) {
    const a = [r, g, b].map(v => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
  }

  function calculateWcagContrast(fg, bg) {
    const [r1, g1, b1] = parseColorToRgb(fg, [255, 255, 255]);
    const [r2, g2, b2] = parseColorToRgb(bg, [30, 41, 59]);
    const l1 = getLuminance(r1, g1, b1);
    const l2 = getLuminance(r2, g2, b2);
    const brightest = Math.max(l1, l2);
    const darkest = Math.min(l1, l2);
    return (brightest + 0.05) / (darkest + 0.05);
  }

  function runPreflightAudit() {
    const isMultiJob = (typeof getPrintJobVal === 'function' && getPrintJobVal() === 'multi');
    const issues = [];

    if (isMultiJob) {
      // Режим мульти-печати: аудит всех выбранных шаблонов
      const selected = (typeof collectMultiSelection === 'function') ? collectMultiSelection() : [];
      if (!selected.length) {
        issues.push({
          type: 'err',
          msg: 'В режиме мульти-печати не выбран ни один шаблон для печати.',
          actionType: 'info'
        });
        return {
          hasErrors: true,
          hasWarnings: false,
          issues,
          totalCards: 0,
          totalSheets: 0,
          sheetCapacity: 24,
          filledItemsCount: 0,
          isMultiJob: true,
          copiesDetail: '0 шаблонов'
        };
      }

      let totalCards = 0;
      let totalFilled = 0;
      const geomQueue = [];

      for (const sel of selected) {
        const tplKey = sel.key;
        let preset = null;
        if (activeTemplateRef && activeTemplateRef.kind === 'builtin' && activeTemplateRef.key === tplKey) {
          preset = getCurrentState();
        } else {
          preset = (builtInPresets && builtInPresets[tplKey]) ? builtInPresets[tplKey] : null;
        }
        if (!preset) continue;

        const tplName = preset.name || (builtInPresets && builtInPresets[tplKey] && builtInPresets[tplKey].name) || tplKey;
        const items = (typeof getItemsForTemplate === 'function') ? getItemsForTemplate(tplKey) : [];
        const copiesNum = (sel.copies === 'auto' || !sel.copies) ? 1 : (parseInt(sel.copies, 10) || 1);

        if (sel.copies !== 'auto' && sel.copies !== undefined && parseInt(sel.copies, 10) <= 0) {
          issues.push({
            type: 'warn',
            msg: `Шаблон «${tplName}»: указан неверный тираж (${sel.copies}), будет напечатана 1 копия.`,
            actionType: 'jumpTemplate',
            templateKey: tplKey
          });
        }

        if (!items.length) {
          issues.push({
            type: 'warn',
            msg: `Шаблон «${tplName}»: нет заполненных товаров для печати.`,
            actionType: 'jumpTemplate',
            templateKey: tplKey
          });
          continue;
        }

        totalFilled += items.length;

        // Геометрические границы ценника шаблона для зонда переполнения и точной раскладки листов
        const wMm = (preset.widthCm || 6.5) * 10;
        const hMm = (preset.heightCm || 3.5) * 10;
        const effH = (typeof effectiveCardHeight === 'function') ? effectiveCardHeight(hMm, preset) : hMm;
        const borderVal = preset.borderMm || 0;
        const layoutVal = preset.layout || 'full';
        const ts = preset.titleSafe || { left: 0, right: 0, top: 0, bottom: 0 };
        const headerHm = layoutVal === 'full' ? hMm : hMm * (parseFloat(preset.headerHeight || 20.45) || 20.45) / 100;
        const bySafeH = headerHm * Math.max(0, 1 - ts.top - ts.bottom);
        const mult = ((preset.priceInBottom && layoutVal === 'split') || (!preset.showPrice) || layoutVal === 'split') ? 1.0 : 0.45;
        const tzMm = Math.min(headerHm * mult, bySafeH);
        const padMm = (borderVal > 0) ? borderVal : 3;
        const contentW_mm = Math.max(10, wMm - padMm * 2);
        const safeW_mm = wMm * (1 - ts.left - ts.right);
        const titleW_mm = Math.min(contentW_mm, safeW_mm);
        const pxPerMm = 96 / 25.4;
        const budgetW = Math.max(10, (titleW_mm - 1.5) * pxPerMm);
        const budgetH = tzMm * pxPerMm;

        // Учитываем тираж каждого товара и множитель шаблона для точной геометрии листов
        for (let c = 0; c < copiesNum; c++) {
          for (let i = 0; i < items.length; i++) {
            const it = items[i];
            const qty = Math.max(1, parseInt(it.count, 10) || 1);
            for (let q = 0; q < qty; q++) {
              geomQueue.push({ wMm, effH });
            }
          }
        }

        items.forEach((it, idx) => {
          const itemCopies = Math.max(1, parseInt(it.count, 10) || 1);
          const effectiveQty = itemCopies * copiesNum;
          const qtySuffix = effectiveQty > 1 ? ` (тираж: ${effectiveQty} шт.)` : '';
          totalCards += effectiveQty;

          if (it.count !== undefined && parseInt(it.count, 10) <= 0) {
            issues.push({
              type: 'warn',
              msg: `[${tplName}] Товар №${idx + 1} «${it.title}»: указан тираж 0, будет напечатана 1 копия.`,
              actionType: 'focus',
              templateKey: tplKey,
              itemIndex: idx
            });
          }

          // 1. Проверка цен с учётом тиража (шаблоны без цены исключены из проверки)
          const isPriceExempt = (
            tplKey === 'korona_a5' || tplKey === 'aktsiya_a5' || tplKey === 'a5' ||
            tplKey === 'novy_vkus' || tplKey === 'novinka' || tplKey === 'tomat' || tplKey === 'sladko' ||
            (preset && preset.showPrice === false)
          );
          if (!isPriceExempt) {
            const priceParsed = splitPriceAndCurrency(it.price);
            const priceVal = priceParsed.price.trim();
            if (!priceVal) {
              issues.push({
                type: 'err',
                msg: `[${tplName}] Товар №${idx + 1} «${it.title}»: не указана цена!${qtySuffix}`,
                actionType: 'focusPrice',
                templateKey: tplKey,
                itemIndex: idx
              });
            } else if (priceVal === '0' || priceVal === '0.00' || priceVal === '0,00') {
              issues.push({
                type: 'warn',
                msg: `[${tplName}] Товар №${idx + 1} «${it.title}»: цена указана как 0 ₽${qtySuffix}`,
                actionType: 'focusPrice',
                templateKey: tplKey,
                itemIndex: idx
              });
            }
          }

          // 2. Проверка переполнения текста через probe
          try {
            const family = fontOf(it, 'titleFont', preset.titleFont || 'Arial, sans-serif');
            const weight = fontOf(it, 'titleWeight', preset.titleWeight || '800');
            const currentSize = fontOf(it, 'titleSize', preset.titleSize || 13);
            const isIt = !!fontOf(it, 'titleItalic', preset.titleItalic || false);
            const probe = getTitleProbe(budgetW);
            probe.style.fontFamily = family;
            probe.style.fontWeight = weight;
            probe.style.fontStyle = isIt ? 'italic' : 'normal';
            probe.style.fontSize = `${currentSize}pt`;
            probe.textContent = formatSmartTitle(it.title || '');

            const rect = probe.getBoundingClientRect();
            const measuredH = (rect && rect.height > 0) ? rect.height : probe.offsetHeight;
            const measuredW = probe.scrollWidth;
            const clientW = probe.clientWidth || budgetW;
            const overflowsX = (measuredW - clientW) > 3.5 || measuredW > (budgetW + 6);

            if ((measuredH > 0 && measuredH > budgetH + 1.5) || overflowsX) {
              issues.push({
                type: 'warn',
                msg: `[${tplName}] Товар №${idx + 1} «${it.title}»: текст названия выходит за границы ценника${qtySuffix}`,
                actionType: 'refit',
                templateKey: tplKey,
                itemIndex: idx
              });
            }
          } catch (_) { }

          // 3. Проверка цветового контраста
          try {
            const cardBgColor = bgOf(it, 'headerBg', preset.headerBg || '#1e293b');
            const titleCol = fontOf(it, 'titleColor', preset.titleColor || '#ffffff');
            const titleSh = fontOf(it, 'titleShadow', preset.titleShadow || '');

            if (!titleSh || titleSh === 'none' || titleSh === '0px 0px 0 #000000') {
              const cr = calculateWcagContrast(titleCol, cardBgColor);
              if (cr < 2.8) {
                issues.push({
                  type: 'warn',
                  msg: `[${tplName}] Товар №${idx + 1} «${it.title}»: низкая контрастность названия (${cr.toFixed(1)}:1). Рекомендуется включить тень.${qtySuffix}`,
                  actionType: 'contrast',
                  templateKey: tplKey,
                  itemIndex: idx,
                  contrastRatio: cr.toFixed(1)
                });
              }
            }
          } catch (_) { }
        });
      }

      if (totalFilled === 0) {
        issues.push({
          type: 'err',
          msg: 'В выбранных шаблонах нет ни одного заполненного товара с наименованием.',
          actionType: 'info'
        });
      }

      // Физический точный расчёт листов А4 через раскладку packIntoPages
      let totalSheets = 1;
      if (geomQueue.length > 0 && typeof packIntoPages === 'function') {
        const mTop = 10, mBottom = 4, mSide = 4;
        const pageW = 210 - mSide * 2;
        const pageH = 297 - mTop - mBottom - 0.5;
        const gap = (typeof gapMm === 'function') ? gapMm() : 0;
        const packedPages = packIntoPages(geomQueue, pageW, pageH, gap);
        totalSheets = Math.max(1, packedPages.length);
      } else {
        totalSheets = Math.max(1, Math.ceil(totalCards / 24));
      }

      const hasErrors = issues.some(i => i.type === 'err');
      const hasWarnings = issues.some(i => i.type === 'warn');

      return {
        hasErrors,
        hasWarnings,
        issues,
        totalCards,
        totalSheets,
        sheetCapacity: 24,
        filledItemsCount: totalFilled,
        isMultiJob: true,
        copiesDetail: `${totalFilled} поз. из ${selected.length} шабл., тираж ${totalCards} шт.`
      };
    }

    // Одиночный режим печати (активный шаблон)
    const isMultiMode = document.querySelector('input[name="printMode"]:checked')?.value === 'multi';
    const activeKey = (activeTemplateRef && activeTemplateRef.kind === 'builtin') ? activeTemplateRef.key : '';
    const wCm = parseFloat(wobblerWidthInput.value) || 6.5;
    const hCm = parseFloat(wobblerHeightInput.value) || 4.5;
    const wMm = wCm * 10;
    const hMm = hCm * 10;
    const effH = effectiveCardHeight(hMm);
    const grid = calcA4Grid(wMm, effH);
    const sheetCapacity = grid.maxCount;

    const filledItems = [];
    if (isMultiMode) {
      itemsData.forEach((it, idx) => {
        if (it && it.title && it.title.trim()) {
          filledItems.push({ it, idx });
        }
      });
    } else {
      const titleVal = (inputTitle ? inputTitle.value : '').trim();
      if (titleVal) {
        let repCount = 1;
        if (singleRepeatCount) {
          if (singleRepeatCount.value === 'auto') {
            repCount = sheetCapacity;
          } else {
            const rep = parseInt(singleRepeatCount.value, 10);
            if (!isNaN(rep) && rep > 0) repCount = Math.min(rep, sheetCapacity);
          }
        }
        filledItems.push({
          it: {
            title: titleVal,
            price: (inputPrice ? inputPrice.value : '').trim(),
            subtitle: (inputSubtitle ? inputSubtitle.value : '').trim(),
            count: repCount
          },
          idx: 0
        });
      }
    }

    if (filledItems.length === 0) {
      issues.push({
        type: 'err',
        msg: 'Список товаров пуст. Введите хотя бы один товар перед печатью.',
        actionType: 'focus',
        itemIndex: 0
      });
      return { hasErrors: true, hasWarnings: false, isEmpty: true, issues, totalCards: 0, totalSheets: 0, sheetCapacity, filledItemsCount: 0, isMultiJob: false, copiesDetail: '0 ценников' };
    }

    // 1. Проверка цен и тиража (шаблоны без цены исключены из проверки)
    const activePreset = (typeof getActivePreset === 'function') ? getActivePreset() : null;
    const isSinglePriceExempt = (
      activeKey === 'korona_a5' || activeKey === 'aktsiya_a5' || activeKey === 'a5' ||
      activeKey === 'novy_vkus' || activeKey === 'novinka' || activeKey === 'tomat' || activeKey === 'sladko' ||
      (activePreset && activePreset.showPrice === false) ||
      (showPriceToggle && !showPriceToggle.checked)
    );
    filledItems.forEach(({ it, idx }) => {
      const qty = Math.max(1, parseInt(it.count, 10) || 1);
      const qtySuffix = qty > 1 ? ` (тираж: ${qty} шт.)` : '';

      if (isMultiMode && it.count !== undefined && parseInt(it.count, 10) <= 0) {
        issues.push({
          type: 'warn',
          msg: `Товар №${idx + 1} «${it.title}»: указан тираж 0, будет напечатан 1 экземпляр.`,
          actionType: 'focus',
          templateKey: activeKey,
          itemIndex: idx
        });
      }

      if (!isSinglePriceExempt) {
        const priceParsed = splitPriceAndCurrency(it.price);
        const priceVal = priceParsed.price.trim();
        if (!priceVal) {
          issues.push({
            type: 'err',
            msg: `Товар №${idx + 1} «${it.title}»: не указана цена!${qtySuffix}`,
            actionType: 'focusPrice',
            templateKey: activeKey,
            itemIndex: idx
          });
        } else if (priceVal === '0' || priceVal === '0.00' || priceVal === '0,00') {
          issues.push({
            type: 'warn',
            msg: `Товар №${idx + 1} «${it.title}»: цена указана как 0 ₽${qtySuffix}`,
            actionType: 'focusPrice',
            templateKey: activeKey,
            itemIndex: idx
          });
        }
      }
    });

    // 2. Проверка переполнения текста (через DOM-зонд)
    filledItems.forEach(({ it, idx }) => {
      const qty = Math.max(1, parseInt(it.count, 10) || 1);
      const qtySuffix = qty > 1 ? ` (тираж: ${qty} шт.)` : '';
      const titleText = (it.title || '').trim();
      const family = (titleFont ? titleFont.value : '') || 'Arial, sans-serif';
      const weight = (titleWeight ? titleWeight.value : '800') || '800';
      const currentSize = it.titleSize || parseFloat(titleSize ? titleSize.value : 13) || 13;

      try {
        const bg = resolveItemBg(idx);
        const ts = (bg && bg.titleSafe) ? bg.titleSafe : { left: 0, right: 0, top: 0, bottom: 0 };
        const headerHm = currentLayout === 'full' ? hMm : hMm * (parseFloat(headerHeightRange ? headerHeightRange.value : 20.45) || 20.45) / 100;
        const bySafeH = headerHm * Math.max(0, 1 - ts.top - ts.bottom);
        const hasPrice = isTemplatePriceSlotAvailable(activeTemplateRef, currentLayout, rybaPriceInBottom && currentLayout === 'split');
        const mult = hasPrice ? 0.45 : 1.0;
        const tzMm = Math.min(headerHm * mult, bySafeH);
        const padMm = (borderMm > 0) ? borderMm : 3;
        const contentW_mm = Math.max(10, wMm - padMm * 2);
        const safeW_mm = wMm * (1 - ts.left - ts.right);
        const titleW_mm = Math.min(contentW_mm, safeW_mm);
        const pxPerMm = 96 / 25.4;
        const budgetW = Math.max(10, (titleW_mm - 1.5) * pxPerMm);
        const budgetH = tzMm * pxPerMm;

        const isIt = (templateFonts && templateFonts.titleItalic) || (titleItalic && titleItalic.checked);
        const probe = getTitleProbe(budgetW);
        probe.style.fontFamily = family;
        probe.style.fontWeight = weight;
        probe.style.fontStyle = isIt ? 'italic' : 'normal';
        probe.style.fontSize = `${currentSize}pt`;
        probe.textContent = formatSmartTitle(titleText);

        const rect = probe.getBoundingClientRect();
        const measuredH = (rect && rect.height > 0) ? rect.height : probe.offsetHeight;
        const measuredW = probe.scrollWidth;
        const clientW = probe.clientWidth || budgetW;
        const overflowsX = (measuredW - clientW) > 3.5 || measuredW > (budgetW + 6);

        if ((measuredH > 0 && measuredH > budgetH + 1.5) || overflowsX) {
          issues.push({
            type: 'warn',
            msg: `Товар №${idx + 1} «${titleText}»: текст названия выходит за границы ценника${qtySuffix}`,
            actionType: 'refit',
            templateKey: activeKey,
            itemIndex: idx
          });
        }
      } catch (_) { }
    });

    // 3. Проверка цветового контраста текста по WCAG 2.1
    filledItems.forEach(({ it, idx }) => {
      const qty = Math.max(1, parseInt(it.count, 10) || 1);
      const qtySuffix = qty > 1 ? ` (тираж: ${qty} шт.)` : '';

      try {
        const bg = resolveItemBg(idx);
        const cardBgColor = (bg && bg.headerBg) ? bg.headerBg : (headerBgColor ? headerBgColor.value : '#1e293b');
        const tf = templateFonts || {};
        const titleCol = fontOf(it, 'titleColor', tf.titleColor || '#ffffff');
        const titleSh = fontOf(it, 'titleShadow', tf.titleShadow || '');

        // Если у текста нет тени, проверяем контрастность с фоном
        if (!titleSh || titleSh === 'none' || titleSh === '0px 0px 0 #000000') {
          const cr = calculateWcagContrast(titleCol, cardBgColor);
          if (cr < 2.8) {
            issues.push({
              type: 'warn',
              msg: `Товар №${idx + 1} «${it.title}»: низкая контрастность названия (${cr.toFixed(1)}:1, WCAG советует ≥ 3:1). Рекомендуется включить тень.${qtySuffix}`,
              actionType: 'contrast',
              templateKey: activeKey,
              itemIndex: idx,
              contrastRatio: cr.toFixed(1)
            });
          }
        }
      } catch (_) { }
    });

    // 4. Расчёт тиража и эффективности раскладки листа
    let totalCards = 0;
    if (isMultiMode) {
      filledItems.forEach(({ it }) => {
        totalCards += Math.max(1, parseInt(it.count, 10) || 1);
      });
    } else {
      totalCards = filledItems[0]?.it?.count || 1;
    }

    const totalSheets = Math.max(1, Math.ceil(totalCards / sheetCapacity));
    const remainder = totalCards % sheetCapacity;
    if (remainder !== 0 && totalSheets > 0) {
      const emptySpots = sheetCapacity - remainder;
      issues.push({
        type: 'info',
        msg: `На последнем листе остаётся ${emptySpots} ${emptySpots === 1 ? 'свободное место' : 'свободных мест'} (${remainder} из ${sheetCapacity} занято). Всего к печати: ${totalCards} шт. на ${totalSheets} лист(ах) А4.`,
        actionType: 'info'
      });
    }

    const hasErrors = issues.some(i => i.type === 'err');
    const hasWarnings = issues.some(i => i.type === 'warn');

    return {
      hasErrors,
      hasWarnings,
      issues,
      totalCards,
      totalSheets,
      sheetCapacity,
      filledItemsCount: filledItems.length,
      isMultiJob: false,
      copiesDetail: isMultiMode
        ? `${filledItems.length} тов., к печати ${totalCards} ценн.`
        : `1 товар × ${totalCards} копий`
    };
  }

  function showPreflightModal(onProceed) {
    if (!preflightModal) return;
    preflightProceedCallback = onProceed;
    const audit = runPreflightAudit();

    const errCount = audit.issues.filter(i => i.type === 'err').length;
    const warnCount = audit.issues.filter(i => i.type === 'warn').length;

    if (preflightSummaryBanner) {
      preflightSummaryBanner.className = 'preflight-summary-banner ' + (audit.hasErrors ? 'err' : (audit.hasWarnings ? 'warn' : 'ok'));
      if (audit.hasErrors) {
        preflightSummaryBanner.innerHTML = `<b>Обнаружены ошибки:</b> найдено ${errCount} критических замечаний перед печатью тиража (${audit.totalCards} шт. на ${audit.totalSheets} л. А4). Исправьте их перед печатью.`;
      } else if (audit.hasWarnings) {
        preflightSummaryBanner.innerHTML = `<b>Есть замечания:</b> тираж (${audit.totalCards} шт. на ${audit.totalSheets} л. А4) готов к печати, но найдено ${warnCount} замечаний.`;
      } else {
        preflightSummaryBanner.innerHTML = `<b>Всё отлично!</b> Тираж проверен: ${audit.totalCards} шт. на ${audit.totalSheets} лист(ах) А4 готовы к печати.`;
      }
    }

    if (preflightList) {
      preflightList.innerHTML = '';
      if (!audit.issues.length) {
        preflightList.innerHTML = `
          <div class="preflight-item preflight-item-run-info">
            <div class="preflight-item-text">
              <span class="preflight-badge ok">Тираж</span>
              <span>Тираж проверен: к печати <b>${audit.totalCards} шт.</b> ценников на <b>${audit.totalSheets}</b> ${audit.totalSheets === 1 ? 'листе' : 'листах'} А4${audit.copiesDetail ? ` (${audit.copiesDetail})` : ''}.</span>
            </div>
          </div>
          <div class="preflight-item">
            <div class="preflight-item-text">
              <span class="preflight-badge ok">ОК</span>
              <span>Цены и наименования всех товаров заполнены корректно.</span>
            </div>
          </div>
          <div class="preflight-item">
            <div class="preflight-item-text">
              <span class="preflight-badge ok">ОК</span>
              <span>Тексты укладываются в безопасную зону ценника.</span>
            </div>
          </div>
          <div class="preflight-item">
            <div class="preflight-item-text">
              <span class="preflight-badge ok">ОК</span>
              <span>Лист А4 заполнен оптимально (вместимость: ${audit.sheetCapacity} шт.).</span>
            </div>
          </div>
        `;
      } else {
        // Всегда первым блоком выводим подтверждённый тираж
        const runItem = document.createElement('div');
        runItem.className = 'preflight-item preflight-item-run-info';
        runItem.innerHTML = `
          <div class="preflight-item-text">
            <span class="preflight-badge ok">Тираж</span>
            <span>К печати: <b>${audit.totalCards} шт.</b> ценников на <b>${audit.totalSheets}</b> ${audit.totalSheets === 1 ? 'листе' : 'листах'} А4${audit.copiesDetail ? ` (${audit.copiesDetail})` : ''}.</span>
          </div>
        `;
        preflightList.appendChild(runItem);

        audit.issues.forEach(issue => {
          const itemEl = document.createElement('div');
          itemEl.className = 'preflight-item';
          const badgeClass = issue.type === 'err' ? 'err' : (issue.type === 'warn' ? 'warn' : (issue.type === 'info' ? 'info' : 'ok'));
          const badgeText = issue.type === 'err' ? 'Ошибка' : (issue.type === 'warn' ? 'Внимание' : 'Инфо');
          const contrastTag = issue.contrastRatio ? `<span class="preflight-contrast-badge">${issue.contrastRatio}:1</span>` : '';
          const actionBtnText = issue.actionType === 'contrast' ? 'Добавить тень' : (issue.actionType === 'jumpTemplate' ? 'Перейти' : 'Исправить');
          const tplKeyAttr = issue.templateKey ? ` data-template="${issue.templateKey}"` : '';

          itemEl.innerHTML = `
            <div class="preflight-item-text">
              <span class="preflight-badge ${badgeClass}">${badgeText}</span>
              <span>${issue.msg}</span>
              ${contrastTag}
            </div>
            ${(typeof issue.itemIndex === 'number' || issue.actionType === 'jumpTemplate') ? `
              <div class="preflight-item-action">
                <button type="button" class="btn btn-secondary btn-xs preflight-item-jump-btn" data-index="${issue.itemIndex ?? 0}" data-action="${issue.actionType || 'focus'}"${tplKeyAttr}>${actionBtnText}</button>
              </div>
            ` : ''}
          `;
          preflightList.appendChild(itemEl);
        });

        preflightList.querySelectorAll('.preflight-item-jump-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            const idx = parseInt(btn.getAttribute('data-index'), 10);
            const act = btn.getAttribute('data-action');
            const tplKey = btn.getAttribute('data-template');
            closePreflightModal();

            const proceedWithItem = () => {
              if (!isNaN(idx)) {
                activePreviewIndex = idx;
                updatePreview();
                const rowInput = document.querySelector(`.item-title-input[data-index="${idx}"]`);
                if (act === 'focusPrice') {
                  const priceInp = document.querySelector(`.item-price-input[data-index="${idx}"]`);
                  if (priceInp) priceInp.focus();
                  else if (rowInput) rowInput.focus();
                } else if (act === 'refit') {
                  refitActiveTitle();
                  if (rowInput) rowInput.focus();
                } else if (act === 'contrast') {
                  if (typeof pushHistoryState === 'function') pushHistoryState('Контрастная тень');
                  if (itemsData && itemsData[idx]) {
                    if (!itemsData[idx].fonts) itemsData[idx].fonts = {};
                    itemsData[idx].fonts.titleShadow = '1px 1px 3px rgba(0,0,0,0.9), -1px -1px 3px rgba(0,0,0,0.9)';
                    itemsData[idx].fontsCustomized = true;
                  }
                  updatePreview();
                  if (typeof showToast === 'function') showToast('Добавлена контрастная тень названию товара', 'success', 2200);
                } else {
                  if (rowInput) rowInput.focus();
                }
              }
            };

            if (tplKey && (!activeTemplateRef || activeTemplateRef.key !== tplKey)) {
              const card = document.querySelector('#builtInTemplates .preset-card[data-preset="' + tplKey + '"]');
              if (card) {
                card.click();
                if (act === 'jumpTemplate') return;
                setTimeout(proceedWithItem, 100);
                return;
              }
            }
            if (act === 'jumpTemplate') return;
            proceedWithItem();
          });
        });
      }
    }

    preflightModal.style.display = 'flex';
  }

  function closePreflightModal() {
    if (preflightModal) preflightModal.style.display = 'none';
  }

  if (preflightCloseBtn) preflightCloseBtn.addEventListener('click', closePreflightModal);
  if (preflightFixBtn) {
    preflightFixBtn.addEventListener('click', () => {
      closePreflightModal();
      const firstProb = document.querySelector('.preflight-item-jump-btn');
      if (firstProb) firstProb.click();
    });
  }
  if (preflightForcePrintBtn) {
    preflightForcePrintBtn.addEventListener('click', () => {
      closePreflightModal();
      if (typeof preflightProceedCallback === 'function') {
        preflightProceedCallback();
      }
    });
  }
  if (preflightModal) {
    preflightModal.addEventListener('click', (e) => {
      if (e.target === preflightModal) closePreflightModal();
    });
  }

  // --- 5.0. Живой предпечатный статус в шапке (Preflight Status Pill) ---
  function updatePreflightPill() {
    const pill = document.getElementById('preflightPill');
    const pillText = document.getElementById('preflightPillText');
    if (!pill || !pillText) return;
    try {
      const audit = runPreflightAudit();
      const errCount = audit.issues.filter(i => i.type === 'err').length;
      const warnCount = audit.issues.filter(i => i.type === 'warn').length;

      pill.classList.remove('status-ready', 'status-warning', 'status-error', 'status-empty');
      if (audit.isEmpty) {
        pill.classList.add('status-empty');
        pillText.textContent = `○ 0 товаров`;
        pill.title = `Список товаров пуст. Нажмите, чтобы открыть таблицу товаров для печати.`;
      } else if (audit.hasErrors) {
        pill.classList.add('status-error');
        pillText.textContent = `${errCount} ошиб.`;
        pill.title = `Предпечатный аудит (тираж: ${audit.totalCards} шт. на ${audit.totalSheets} л. А4): обнаружено ${errCount} ошибок! Нажмите, чтобы открыть.`;
      } else if (audit.hasWarnings) {
        pill.classList.add('status-warning');
        pillText.textContent = `${warnCount} зам.`;
        pill.title = `Предпечатный аудит (тираж: ${audit.totalCards} шт. на ${audit.totalSheets} л. А4): ${warnCount} замечаний. Нажмите, чтобы открыть.`;
      } else {
        pill.classList.add('status-ready');
        pillText.textContent = `${audit.totalCards} шт. (${audit.totalSheets} л.)`;
        pill.title = `Готово к печати: тираж ${audit.totalCards} шт. на ${audit.totalSheets} лист(ах) А4. Нажмите для предпечатного аудита.`;
      }
    } catch (_) { }
  }

  const preflightPillBtn = document.getElementById('preflightPill');
  if (preflightPillBtn) {
    preflightPillBtn.addEventListener('click', () => {
      const audit = runPreflightAudit();
      if (audit && audit.isEmpty) {
        if (typeof openItemsDrawer === 'function') {
          openItemsDrawer();
          return;
        }
      }
      showPreflightModal(() => {
        const jobMode = getPrintJobVal();
        if (jobMode === 'multi') runMultiPrintFromUI();
        else triggerPrint();
      });
    });
  }

  // --- 5.1. Шпаргалка горячих клавиш (Shortcuts Modal) ---
  const shortcutsBtn = document.getElementById('shortcutsBtn');
  const shortcutsModal = document.getElementById('shortcutsModal');
  const shortcutsCloseBtn = document.getElementById('shortcutsCloseBtn');
  const shortcutsCloseIconBtn = document.getElementById('shortcutsCloseIconBtn');

  function openShortcutsModal() {
    if (shortcutsModal) shortcutsModal.style.display = 'flex';
  }

  function closeShortcutsModal() {
    if (shortcutsModal) shortcutsModal.style.display = 'none';
  }

  function toggleShortcutsModal() {
    if (!shortcutsModal) return;
    if (shortcutsModal.style.display === 'none' || !shortcutsModal.style.display) {
      openShortcutsModal();
    } else {
      closeShortcutsModal();
    }
  }

  if (shortcutsBtn) shortcutsBtn.addEventListener('click', toggleShortcutsModal);
  if (shortcutsCloseBtn) shortcutsCloseBtn.addEventListener('click', closeShortcutsModal);
  if (shortcutsCloseIconBtn) shortcutsCloseIconBtn.addEventListener('click', closeShortcutsModal);
  if (shortcutsModal) {
    shortcutsModal.addEventListener('click', (e) => {
      if (e.target === shortcutsModal) closeShortcutsModal();
    });
  }

  // --- 6. Пакетные действия с товарами (Bulk Actions / Multi-Select) ---
  const selectedItemIndices = new Set();
  const selectAllItemsChk = document.getElementById('selectAllItemsChk');
  const idrSelectAllChk = document.getElementById('idrSelectAllChk');
  const bulkActionsBar = document.getElementById('bulkActionsBar');
  const bulkSelectedCount = document.getElementById('bulkSelectedCount');
  const bulkBarSetBgBtn = document.getElementById('bulkBarSetBgBtn');
  const bulkBarSetPriceBtn = document.getElementById('bulkBarSetPriceBtn');
  const bulkBarSetSubBtn = document.getElementById('bulkBarSetSubBtn');
  const bulkBarSetQtyBtn = document.getElementById('bulkBarSetQtyBtn');
  const bulkBarDeleteBtn = document.getElementById('bulkBarDeleteBtn');
  const bulkBarCancelBtn = document.getElementById('bulkBarCancelBtn');

  function updateBulkActionsBar() {
    if (!bulkActionsBar) return;
    const sz = selectedItemIndices.size;
    if (sz > 0) {
      bulkActionsBar.style.display = 'flex';
      if (bulkSelectedCount) bulkSelectedCount.textContent = String(sz);
    } else {
      bulkActionsBar.style.display = 'none';
    }
    const filledCount = itemsData.filter(isItemFilled).length;
    const allChecked = filledCount > 0 && sz >= filledCount;
    if (selectAllItemsChk) selectAllItemsChk.checked = allChecked;
    if (idrSelectAllChk) idrSelectAllChk.checked = allChecked;
  }

  function onRowSelectChange(idx, checked) {
    if (checked) {
      selectedItemIndices.add(idx);
    } else {
      selectedItemIndices.delete(idx);
    }
    document.querySelectorAll(`.item-select-chk[data-index="${idx}"]`).forEach(c => {
      c.checked = checked;
      const r = c.closest('.item-row');
      if (r) r.classList.toggle('is-selected', checked);
    });
    updateBulkActionsBar();
  }

  function toggleSelectAll(checked) {
    selectedItemIndices.clear();
    if (checked) {
      itemsData.forEach((it, idx) => {
        if (isItemFilled(it)) {
          selectedItemIndices.add(idx);
        }
      });
    }
    document.querySelectorAll('.item-select-chk').forEach(chk => {
      const idx = parseInt(chk.getAttribute('data-index'), 10);
      chk.checked = selectedItemIndices.has(idx);
      const row = chk.closest('.item-row');
      if (row) row.classList.toggle('is-selected', chk.checked);
    });
    if (selectAllItemsChk) selectAllItemsChk.checked = checked;
    if (idrSelectAllChk) idrSelectAllChk.checked = checked;
    updateBulkActionsBar();
  }

  if (selectAllItemsChk) selectAllItemsChk.addEventListener('change', (e) => toggleSelectAll(e.target.checked));
  if (idrSelectAllChk) idrSelectAllChk.addEventListener('change', (e) => toggleSelectAll(e.target.checked));

  if (bulkBarCancelBtn) {
    bulkBarCancelBtn.addEventListener('click', () => toggleSelectAll(false));
  }

  if (bulkBarDeleteBtn) {
    bulkBarDeleteBtn.addEventListener('click', () => {
      if (selectedItemIndices.size === 0) return;
      if (!confirm(`Удалить выбранные позиции (${selectedItemIndices.size} шт.)?`)) return;
      if (typeof pushHistoryState === 'function') pushHistoryState('Пакетное удаление товаров', true);
      const toDel = new Set(selectedItemIndices);
      const next = itemsData.filter((_, idx) => !toDel.has(idx));
      itemsData.length = 0;
      next.forEach(it => itemsData.push(it));
      selectedItemIndices.clear();
      normalizeItemsArray();
      if (activePreviewIndex >= itemsData.length) activePreviewIndex = Math.max(0, itemsData.length - 1);
      renderItemsListInputs();
      updatePreview();
      updateBulkActionsBar();
      scheduleSessionSave();
      showToast(`Удалено позиций: ${toDel.size}`, 'info', 2200);
    });
  }

  if (bulkBarSetPriceBtn) {
    bulkBarSetPriceBtn.addEventListener('click', () => {
      if (selectedItemIndices.size === 0) return;
      const val = prompt('Введите единую цену для выбранных товаров (напр. 190):');
      if (val == null) return;
      const clean = cleanPriceInput(val);
      if (typeof pushHistoryState === 'function') pushHistoryState('Пакетная установка цены', true);
      selectedItemIndices.forEach(idx => {
        if (itemsData[idx]) itemsData[idx].price = clean;
      });
      renderItemsListInputs();
      updatePreview();
      scheduleSessionSave();
      showToast(`Цена «${clean} ₽» применена к ${selectedItemIndices.size} товарам`, 'success', 2200);
    });
  }

  if (bulkBarSetSubBtn) {
    bulkBarSetSubBtn.addEventListener('click', () => {
      if (selectedItemIndices.size === 0) return;
      const val = prompt('Введите единый вес/фасовку для выбранных товаров (напр. 100 г):');
      if (val == null) return;
      if (typeof pushHistoryState === 'function') pushHistoryState('Пакетная установка веса', true);
      selectedItemIndices.forEach(idx => {
        if (itemsData[idx]) {
          itemsData[idx].subtitle = val.trim();
          itemsData[idx].subtitleManual = true;
        }
      });
      renderItemsListInputs();
      updatePreview();
      scheduleSessionSave();
      showToast(`Вес «${val.trim()}» применен к ${selectedItemIndices.size} товарам`, 'success', 2200);
    });
  }

  if (bulkBarSetQtyBtn) {
    bulkBarSetQtyBtn.addEventListener('click', () => {
      if (selectedItemIndices.size === 0) return;
      const val = prompt('Введите тираж копий для каждого выбранного товара (1–99):', '2');
      if (val == null) return;
      const qty = Math.max(1, Math.min(99, parseInt(val, 10) || 1));
      if (typeof pushHistoryState === 'function') pushHistoryState('Пакетная установка тиража', true);
      selectedItemIndices.forEach(idx => {
        if (itemsData[idx]) itemsData[idx].count = qty;
      });
      renderItemsListInputs();
      updatePreview();
      scheduleSessionSave();
      showToast(`Тираж ${qty} шт. установлен для ${selectedItemIndices.size} товаров`, 'success', 2200);
    });
  }

  if (bulkBarSetBgBtn) {
    bulkBarSetBgBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (selectedItemIndices.size === 0) return;
      const opts = getItemBgOptions();
      const preset = (activeTemplateRef && activeTemplateRef.kind === 'builtin') ? builtInPresets[activeTemplateRef.key] : null;
      const defaultBgImg = (preset && preset.bgImage) ? preset.bgImage : 'none';
      const it0 = itemsData[activePreviewIndex] || itemsData[0];
      const curImg = (it0 && it0.bgCustomized && it0.bg) ? it0.bg.bgImage : ((templateBg && templateBg.bgImage) || '');
      const currentBg = (curImg === defaultBgImg || curImg === 'none' || !curImg) ? '' : curImg;

      showItemQuickMenu(bulkBarSetBgBtn, opts, currentBg, (pickedVal) => {
        if (typeof pushHistoryState === 'function') pushHistoryState('Пакетная смена фона', true);
        selectedItemIndices.forEach(idx => {
          applyBackgroundAndAutolink('item', idx, pickedVal);
        });
        refitActiveTitle();
        updatePreview();
        renderItemsListInputs();
        scheduleSessionSave();
        showToast(`Фон применен к ${selectedItemIndices.size} товарам`, 'success', 2200);
      });
    });
  }

  function initPrintOrientation() {
    const printOrientControl = document.getElementById('printOrientationControl');
    if (printOrientControl) {
      printOrientControl.querySelectorAll('.seg-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const mode = btn.getAttribute('data-orientation');
          if (mode) setPrintOrientation(mode);
        });
      });
    }

    const sheetOrientPills = document.getElementById('sheetOrientationPills');
    if (sheetOrientPills) {
      sheetOrientPills.querySelectorAll('.sheet-orient-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const mode = btn.getAttribute('data-orientation');
          if (mode) setPrintOrientation(mode);
        });
      });
    }

    setPrintOrientation(printOrientationMode, true);
  }

  initItemsDrawer();
  initBgGallery();
  initWobblerDragAndDrop();
  renderItemsListInputs();
  renderSavedTemplates();
  renderMultiPrintTemplates();
  initWobblerInlineEditing();
  initPreviewItemNavigator();
  initPrintOrientation();
  // Автосохранённая сессия (таблицы, активный шаблон, режим) — или чистый старт.
  if (!restoreSession()) {
    activeTemplateRef = { kind: 'builtin', key: 'alaska_dots' };
    applyState(builtInPresets.alaska_dots);
  }
  setAutosaveStatus('saved');

  // Подгружаем дополнительные фоны из «bg other» (из IndexedDB-кэша) и
  // наполняем подменю выбора фона. Асинхронно — не блокирует старт рендера.
  loadExtraBackgrounds();

  // Делегирование кликов по быстрым свотчам палитры (.quick-color-swatches / .color-swatch-btn)
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.color-swatch-btn');
    if (!btn) return;
    const color = btn.dataset.color;
    if (!color) return;
    const parent = btn.closest('.quick-color-swatches');
    const targetId = btn.dataset.target || (parent ? parent.dataset.target : null);
    if (!targetId) return;
    const targetInput = document.getElementById(targetId);
    if (!targetInput) return;
    targetInput.value = color;
    targetInput.dispatchEvent(new Event('input', { bubbles: true }));
    targetInput.dispatchEvent(new Event('change', { bubbles: true }));
  });

  // TEMP TEST HOOK — remove after verification
  (function () {
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

  // Пересчитать ширину цифр цены и кегли названий, когда веб-шрифты точно
  // загружены: первый замер мог снять метрики фолбэка (например, для
  // Lobster/Pacifico/Duo Dunkel) — и «залипнуть» в per-item titleSize.
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      updatePreview();
      refitActiveTitle();
    });
  }

  // Контентный пакет шрифтов подключается асинхронно (media="print" → all):
  // после применения его CSS повторно прогоняем готовность шрифтов и замер метрик.
  window.addEventListener('wobbler-fonts-css-ready', () => {
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        updatePreview();
        refitActiveTitle();
      });
    }
  });

  // ===== Панель отладки геометрии и автоподгона (Debug-HUD) =====
  function updateDebugToolbar() {
    const tb = document.getElementById('debugToolbar');
    if (!tb) return;

    try {
      const screenEl = document.getElementById('dbgScreen');
      const winEl = document.getElementById('dbgWin');
      const dprEl = document.getElementById('dbgDpr');
      const fontsEl = document.getElementById('dbgFonts');
      const fontNameEl = document.getElementById('dbgFontName');
      const tmplEl = document.getElementById('dbgTemplate');
      const itemEl = document.getElementById('dbgItem');
      const titleTextEl = document.getElementById('dbgTitleText');
      const budgetEl = document.getElementById('dbgBudget');
      const curSizeEl = document.getElementById('dbgCurSize');
      const fitSizeEl = document.getElementById('dbgFitSize');
      const probeEl = document.getElementById('dbgProbe');
      const manualEl = document.getElementById('dbgManual');

      // 1. Экран и окно браузера
      if (screenEl) screenEl.textContent = `${window.screen.width}×${window.screen.height}`;
      if (winEl) winEl.textContent = `${window.innerWidth}×${window.innerHeight}`;
      const dprVal = window.devicePixelRatio || 1;
      if (dprEl) dprEl.textContent = `${dprVal.toFixed(2)} (${Math.round(dprVal * 100)}%)`;

      // 2. Статус шрифтов
      const fStatus = (document.fonts && document.fonts.status) ? document.fonts.status : 'нет API';
      if (fontsEl) {
        fontsEl.textContent = fStatus;
        fontsEl.style.color = fStatus === 'loaded' ? '#34d399' : '#fbbf24';
      }

      const isMultiMode = document.querySelector('input[name="printMode"]:checked')?.value === 'multi';
      const it = (itemsData && itemsData[activePreviewIndex]) ? itemsData[activePreviewIndex] : null;
      const fam = (it && it.fontsCustomized && it.fonts && it.fonts.titleFont) || (templateFonts && templateFonts.titleFont) || (titleFont ? titleFont.value : 'Arial');
      const wgt = (it && it.fontsCustomized && it.fonts && it.fonts.titleWeight) || (templateFonts && templateFonts.titleWeight) || (titleWeight ? titleWeight.value : '800');
      if (fontNameEl) fontNameEl.textContent = `${fam} (${wgt})`;

      // 3. Шаблон и товар
      const tmplKey = activeTemplateRef ? (activeTemplateRef.key || activeTemplateRef.name) : 'default';
      if (tmplEl) tmplEl.textContent = tmplKey;

      const totalItems = itemsData ? itemsData.length : 1;
      const curIdx = isMultiMode ? activePreviewIndex : 0;
      if (itemEl) itemEl.textContent = `#${curIdx + 1}/${totalItems}`;

      const rawTitle = isMultiMode
        ? (it ? (it.title || '') : '')
        : (inputTitle ? inputTitle.value : '');
      if (titleTextEl) {
        const trimmed = (rawTitle || '').trim();
        titleTextEl.textContent = trimmed ? `«${trimmed.length > 25 ? trimmed.slice(0, 25) + '…' : trimmed}» (${trimmed.length} симв.)` : '—';
      }

      // 4. Геометрия зоны названия (budget)
      const wCm = parseFloat(wobblerWidthInput ? wobblerWidthInput.value : 6.5) || 6.5;
      const hCm = parseFloat(wobblerHeightInput ? wobblerHeightInput.value : 4.5) || 4.5;
      const wMm = wCm * 10;
      const hMm = hCm * 10;
      const ts = resolveItemBg(curIdx).titleSafe;
      const headerHm = currentLayout === 'full' ? hMm : hMm * (parseFloat(headerHeightRange ? headerHeightRange.value : 20.45) || 20.45) / 100;
      const isSplit = currentLayout === 'split';
      const padMm = (borderMm > 0) ? borderMm : (isSplit ? 0 : 3);
      const contentHm = isSplit ? headerHm : Math.max(1, headerHm - padMm * 2);
      const activePreset = getActivePreset();
      let slotTop = 0;
      let tzMm = 0;
      if (isSplit) {
        tzMm = contentHm;
      } else if (activePreset && activePreset.titleSlotTop != null) {
        tzMm = (activePreset.titleZoneH != null) ? parseFloat(activePreset.titleZoneH) : Math.max(2, headerHm * Math.max(0.05, 1 - ts.top - ts.bottom));
      } else {
        const hasPrice = isTemplatePriceSlotAvailable(activeTemplateRef, currentLayout, rybaPriceInBottom && currentLayout === 'split');
        tzMm = (ts.top === 0 && ts.bottom === 0) ? (hasPrice ? headerHm * 0.45 : contentHm) : Math.max(2, headerHm * Math.max(0.05, 1 - ts.top - ts.bottom));
      }
      const pxPerMm = 96 / 25.4;
      const titleW_mm = Math.min(Math.max(10, wMm - padMm * 2), wMm * (1 - ts.left - ts.right));
      const budgetW = Math.max(10, (titleW_mm - 1.5) * pxPerMm);
      const budgetH = tzMm * pxPerMm;

      if (budgetEl) budgetEl.textContent = `W:${budgetW.toFixed(1)}px × H:${budgetH.toFixed(1)}px (${tzMm.toFixed(1)}мм)`;

      // 5. Кегль в макете
      const curSizePt = previewTitle && previewTitle.style.fontSize ? parseFloat(previewTitle.style.fontSize) : (parseFloat(titleSize ? titleSize.value : 13) || 13);
      if (curSizeEl) curSizeEl.textContent = `${curSizePt}pt`;

      // 6. Расчет fitTitleSize
      let fitPt = null;
      try {
        fitPt = fitTitleSize(rawTitle, fam, wgt, curIdx);
      } catch (e) {
        fitPt = null;
      }
      if (fitSizeEl) {
        fitSizeEl.textContent = fitPt != null ? `${fitPt}pt` : 'null';
        fitSizeEl.style.color = (fitPt != null && Math.abs(curSizePt - fitPt) > 1) ? '#fbbf24' : '#38bdf8';
      }

      // 7. Проба текста (Probe)
      if (typeof fitPt === 'number' && fitPt > 0 && typeof getTitleProbe === 'function') {
        try {
          const probe = getTitleProbe(budgetW);
          probe.style.fontFamily = fam || 'Arial, sans-serif';
          probe.style.fontWeight = wgt || '800';
          probe.style.fontSize = `${fitPt}pt`;
          probe.textContent = formatSmartTitle(rawTitle);
          const rect = probe.getBoundingClientRect();
          const pH = (rect && rect.height > 0) ? rect.height : probe.offsetHeight;
          const pW = probe.scrollWidth;
          if (probeEl) probeEl.textContent = `H:${Math.round(pH)}px, W:${Math.round(pW)}px`;
        } catch (_) {
          if (probeEl) probeEl.textContent = 'ошибка';
        }
      } else {
        if (probeEl) probeEl.textContent = '—';
      }

      // 8. Флаг ручного размера
      const isManual = isMultiMode ? !!(it && it.titleSizeManual) : false;
      if (manualEl) {
        manualEl.textContent = isManual ? 'ДА (зафиксирован)' : 'НЕТ (авто)';
        manualEl.style.color = isManual ? '#fbbf24' : '#34d399';
      }
    } catch (err) {
      console.warn('Debug toolbar update exception:', err);
    }
  }

  // Обработчики кнопок панели отладки
  const dbgRefitBtn = document.getElementById('dbgRefitBtn');
  if (dbgRefitBtn) {
    dbgRefitBtn.addEventListener('click', () => {
      const isMulti = document.querySelector('input[name="printMode"]:checked')?.value === 'multi';
      if (isMulti && itemsData && itemsData[activePreviewIndex]) {
        delete itemsData[activePreviewIndex].titleSizeManual;
      }
      refitActiveTitle(true);
      updatePreview();
      if (typeof showToast === 'function') showToast('⚡ Кегль принудительно пересчитан!', 'success', 2000);
    });
  }

  const dbgCopyBtn = document.getElementById('dbgCopyBtn');
  if (dbgCopyBtn) {
    dbgCopyBtn.addEventListener('click', () => {
      try {
        const it = (itemsData && itemsData[activePreviewIndex]) ? itemsData[activePreviewIndex] : null;
        const titleStr = previewTitle ? (previewTitle.textContent || '') : '';
        const info = [
          '=== WOBBLER DESIGNER DEBUG INFO ===',
          'Сборка: v1.9.6-DEBUG [09.09 16:15]',
          `Экран: ${window.screen.width}×${window.screen.height} (доступно: ${window.screen.availWidth}×${window.screen.availHeight})`,
          `Окно браузера: ${window.innerWidth}×${window.innerHeight}, DPR/Масштаб: ${window.devicePixelRatio || 1}`,
          `Статус document.fonts: ${document.fonts ? document.fonts.status : 'нет API'}`,
          `Шаблон: ${activeTemplateRef ? activeTemplateRef.key : 'default'} (макет: ${currentLayout || 'default'})`,
          `Товар: #${activePreviewIndex + 1}/${itemsData ? itemsData.length : 1}`,
          `Название: "${titleStr}" (${titleStr.length} симв.)`,
          `Шрифт названия: ${previewTitle ? previewTitle.style.fontFamily : ''}, вес: ${previewTitle ? previewTitle.style.fontWeight : ''}`,
          `Текущий кегль в DOM (.style.fontSize): ${previewTitle ? previewTitle.style.fontSize : 'нет'}`,
          `Расчет fitTitleSize: ${fitTitleSize(titleStr, previewTitle ? previewTitle.style.fontFamily : '', previewTitle ? previewTitle.style.fontWeight : '', activePreviewIndex)}pt`,
          `Зона budget: ${document.getElementById('dbgBudget')?.textContent || '—'}`,
          `Замер Probe: ${document.getElementById('dbgProbe')?.textContent || '—'}`,
          `Флаг manual size: ${it && it.titleSizeManual ? 'ДА' : 'нет'}`,
          `User Agent: ${navigator.userAgent}`
        ].join('\n');
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(info).then(() => {
            if (typeof showToast === 'function') showToast('📋 Отчет скопирован в буфер обмена!', 'success', 2500);
          }).catch(() => {
            prompt('Скопируйте отладочную информацию (Ctrl+C):', info);
          });
        } else {
          prompt('Скопируйте отладочную информацию (Ctrl+C):', info);
        }
      } catch (err) {
        alert('Ошибка сбора данных: ' + err.message);
      }
    });
  }

  const dbgResetBtn = document.getElementById('dbgResetBtn');
  if (dbgResetBtn) {
    dbgResetBtn.addEventListener('click', () => {
      if (confirm('Сбросить сохраненные товары и настройки шаблона в кэше браузера (localStorage) и перезагрузить страницу?')) {
        try {
          localStorage.removeItem('wobbler_session_v1');
          localStorage.removeItem('wobbler_custom_templates_gas');
        } catch (_) {}
        location.reload(true);
      }
    });
  }

  const dbgToggleBtn = document.getElementById('dbgToggleBtn');
  const debugToolbarEl = document.getElementById('debugToolbar');
  if (dbgToggleBtn && debugToolbarEl) {
    if (localStorage.getItem('wobbler_dbg_collapsed') === '1') {
      debugToolbarEl.classList.add('is-collapsed');
      dbgToggleBtn.textContent = '▼ Развернуть';
    }
    dbgToggleBtn.addEventListener('click', () => {
      const isCol = debugToolbarEl.classList.toggle('is-collapsed');
      dbgToggleBtn.textContent = isCol ? '▼ Развернуть' : '▲ Свернуть';
      try {
        localStorage.setItem('wobbler_dbg_collapsed', isCol ? '1' : '0');
      } catch (_) {}
    });
  }

  window.addEventListener('resize', () => {
    if (typeof updateDebugToolbar === 'function') updateDebugToolbar();
  });

  // Первичная инициализация панели отладки
  updateDebugToolbar();
});
