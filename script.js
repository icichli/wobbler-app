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

  let itemsData = [...initialExcelItems];

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
  const titleWeight = document.getElementById('titleWeight');
  const titleOffsetY = document.getElementById('titleOffsetY');
  const titleOffsetYVal = document.getElementById('titleOffsetYVal');

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
  const wobblerInsideTop = document.getElementById('wobblerInsideTop');
  const insideTopText = document.getElementById('insideTopText');

  let uploadedDataUrl2 = null; // фон внешнего блока (custom)
  let uploadedDataUrl3 = null; // фон внутреннего блока (custom)

  // Sheet Config & Buttons
  const sheetCount = document.getElementById('sheetCount');
  const singleRepeatCount = document.getElementById('singleRepeatCount');
  const showCropMarks = document.getElementById('showCropMarks');
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
    subtitle: 'center',
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

  // Built-in presets (Default font for Alaska is Arial)
  const builtInPresets = {
    alaska_dots: {
      name: 'Черный точечный (Alaska)',
      widthCm: 6.5,
      heightCm: 3.5,
      title: 'Alaska Фейхоа 0,45 ж/б',
      titleFont: "Arial, sans-serif",
      titleColor: '#ffffff',
      titleSize: 13,
      titleWeight: '800',
      titleAlign: 'center',
      titleOffsetY: 0,
      showPrice: true,
      priceFont: "Arial, sans-serif",
      priceSize: 40,
      priceWeight: '700',
      priceColor: '#ffffff',
      priceAlign: 'center',
      priceOffsetY: 0,
      price: '350',
      currency: '₽',
      headerBg: '#18181b',
      bgImage: 'dots_bg.jpg',
      customBgData: null,
      headerHeight: 100,
      layout: 'full'
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
      layout: 'full'
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
      layout: 'split'
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
      layout: 'split'
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
      layout: 'split'
    },
    ryba: {
      name: 'Рыба',
      widthCm: 9.2,
      heightCm: 5.5,
      title: 'Судак вяленый',
      subtitle: '100гр',
      titleFont: "Arial, sans-serif",
      titleColor: '#ffffff',
      titleSize: 18,
      titleWeight: '800',
      titleAlign: 'center',
      titleOffsetY: 0,
      showPrice: true,
      priceFont: "Arial, sans-serif",
      priceSize: 40,
      priceWeight: '800',
      priceColor: '#000000',
      priceAlign: 'center',
      priceOffsetY: 6,
      price: '300',
      currency: '₽',
      headerBg: '#000000',
      bgImage: 'ryba_bg.jpg',
      customBgData: null,
      headerHeight: 90,
      layout: 'full',
      priceInBottom: false,
      subtitleCorner: true,
      pricePlate: false,
      labelPos: { title: { x: -0.6, y: -1 }, subtitle: { x: -0.6, y: 7.6 }, price: { x: 0, y: 0 }, priceDigits: [ { x: -5.5, y: 0.2 }, { x: -1.1, y: 0 }, { x: 3.6, y: 0 } ], currency: { x: 5.5, y: 0.6 } }
    }
  };

  let customTemplates = JSON.parse(localStorage.getItem('wobbler_custom_templates_gas') || '[]');
  // Индекс выбранного пользовательского шаблона (для «Обновить») или null
  let activeTemplateId = null;
  // Расширенная ссылка на выбранный шаблон: { kind: 'builtin'|'custom', key: <presetKey>|<index> }.
  // Позволяет «Обновить» работать и для встроенных пресетов (создаётся пользовательская копия).
  let activeTemplateRef = null;

  // Render Multi-Item Rows (1 to 18)
  function renderItemsListInputs() {
    itemsListContainer.innerHTML = '';
    for (let i = 0; i < 18; i++) {
      const item = itemsData[i] || { title: '', price: '', subtitle: '' };
      // Гарантируем поле subtitle у существующих элементов
      if (itemsData[i] && itemsData[i].subtitle === undefined) itemsData[i].subtitle = '';
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
      `;

      row.querySelector('.item-title-input').addEventListener('focus', () => {
        activePreviewIndex = i;
        updatePreview();
      });

      row.querySelector('.item-title-input').addEventListener('input', (e) => {
        const idx = parseInt(e.target.getAttribute('data-index'), 10);
        itemsData[idx].title = e.target.value;
        activePreviewIndex = idx;
        updatePreview();
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
          activePreviewIndex = idx;
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
        updatePreview();
      });

      itemsListContainer.appendChild(row);

      // Авто-рост полей таблицы под содержимое (перенос строки удлиняет поле).
      row.querySelectorAll('textarea').forEach(el => {
        autoGrowTextarea(el);
        el.addEventListener('input', () => autoGrowTextarea(el));
      });
    }
  }

  // Parse Excel text paste
  applyPasteBtn.addEventListener('click', () => {
    const text = pasteExcelArea.value.trim();
    if (!text) return;

    const lines = text.split(/\r?\n/);
    lines.forEach((line, index) => {
      if (index >= 18) return;
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
      itemsData[index] = {
        title: parts[0].trim(),
        subtitle: parts[1].trim(),
        price: priceStr
      };
    });

    renderItemsListInputs();
    updatePreview();
    autoFitFontSize();
  });

  // Очистка всей таблицы «Разные товары»
  const clearAllItemsBtn = document.getElementById('clearAllItemsBtn');
  if (clearAllItemsBtn) {
    clearAllItemsBtn.addEventListener('click', () => {
      if (!confirm('Очистить все товары в таблице?')) return;
      for (let i = 0; i < itemsData.length; i++) {
        itemsData[i] = { title: '', price: '', subtitle: '', labelPos: defaultLabelPos() };
      }
      if (pasteExcelArea) pasteExcelArea.value = '';
      renderItemsListInputs();
      updatePreview();
    });
  }

  // Применить расположение ЦЕНЫ (сдвиг блока, позиции цифр, валюта) с ценника №1
  // ко всем остальным (#2–18). Поля названия/веса НЕ трогаются. Источник — всегда
  // itemsData[0], независимо от активного ценника.
  function applyPricePosFromFirstToAll() {
    const src = itemsData[0] || (itemsData[0] = {});
    if (!src.labelPos) src.labelPos = defaultLabelPos();
    // Глубокий клон ценовых полей источника (каждый target получит свою копию).
    const srcPrice = JSON.parse(JSON.stringify(src.labelPos.price));
    const srcDigits = JSON.parse(JSON.stringify(src.labelPos.priceDigits));
    const srcCurrency = JSON.parse(JSON.stringify(src.labelPos.currency));
    itemsData.forEach((it, i) => {
      if (i === 0 || !it) return;
      if (!it.labelPos) it.labelPos = defaultLabelPos();
      it.labelPos.price = JSON.parse(JSON.stringify(srcPrice));
      it.labelPos.priceDigits = JSON.parse(JSON.stringify(srcDigits));
      it.labelPos.currency = JSON.parse(JSON.stringify(srcCurrency));
    });
    updatePreview();
  }

  const syncPricePosBtn = document.getElementById('syncPricePosBtn');
  if (syncPricePosBtn) {
    syncPricePosBtn.addEventListener('click', applyPricePosFromFirstToAll);
  }

  // Размер шрифта наименования по количеству символов (эмпирическая шкала).
  // Короткое название → крупный кегль, длинное → уменьшаем до минимума 8pt.
  function titleSizeByLen(len) {
    if (len <= 12) return 18;
    if (len <= 18) return 16;
    if (len <= 24) return 14;
    if (len <= 30) return 12;
    if (len <= 40) return 11;
    if (len <= 52) return 10;
    return 8;   // длинные названия — минимальный кегль
  }

  // "Подогнать шрифт" — настраивает ТОЛЬКО наименование.
  // В режиме «Разные товары» каждый ценник получает СВОЙ размер шрифта по длине
  // своего названия (per-item). В режиме «Одинаковый текст» — по текущему
  // наименованию (общий слайдер). Вес форсируется Bold (800), вертикальный
  // сдвиг названия обнуляется (зона названия фиксирована).
  function autoFitFontSize() {
    const isMultiMode = document.querySelector('input[name="printMode"]:checked').value === 'multi';

    // Вес — всегда Bold (800); доп. сдвиг названия не нужен (зона фиксирована).
    titleWeight.value = '800';
    titleOffsetY.value = 0;
    titleOffsetYVal.textContent = '0';

    if (isMultiMode) {
      // Per-item: каждому товару — свой кегль по длине его названия.
      itemsData.forEach(it => {
        if (!it) return;
        const len = it.title ? it.title.trim().length : 0;
        it.titleSize = titleSizeByLen(len);
      });
      // Активный товар отражаем в слайдере.
      const active = itemsData[activePreviewIndex];
      if (active) {
        const sz = activeItemTitleSize(active);
        titleSize.value = String(sz);
        titleSizeVal.textContent = String(sz);
      }
    } else {
      const len = inputTitle.value.trim().length;
      const optimalSize = titleSizeByLen(len);
      titleSize.value = String(optimalSize);
      titleSizeVal.textContent = String(optimalSize);
    }

    updatePreview();
  }

  autoFitFontBtn.addEventListener('click', autoFitFontSize);

  // Calculate maximum fitting wobblers on A4 (минимальные поля ~0,9 мм, без зазоров между ценниками)
  function calcA4Grid(wMm, hMm) {
    const margin = 0.9; // 0,9 мм со всех сторон
    const pageW = 210 - margin * 2;
    const pageH = 297 - margin * 2;
    const cols = Math.max(1, Math.floor(pageW / wMm));
    const rows = Math.max(1, Math.floor(pageH / hMm));
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

  // Высота карточки для раскладки А4: ценник + внешний декоративный блок (если он
  // показан). Внешний блок не входит в размер ценника, но печатается, поэтому
  // ячейка листа становится выше и ценников влезает меньше.
  function effectiveCardHeight(hMm) {
    const showOutside = !!(decorOutsideShow && decorOutsideShow.checked);
    if (!showOutside) return hMm;
    return hMm + decorOutsideHeightMm();
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
        span.className = 'price-digit';
        span.textContent = d;
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
    previewTitle.style.textAlign = alignState.title;
    previewTitle.style.transform = `translate(${lp.title.x}mm, ${(parseFloat(titleOffsetY.value) || 0) + lp.title.y}mm)`;
    // Держим слайдер и индикатор в синхроне с активным товаром.
    if (titleSize.value != effTitleSize) titleSize.value = String(effTitleSize);
    titleSizeVal.textContent = titleSize.value;
    titleOffsetYVal.textContent = titleOffsetY.value;

    // Подзаголовок (вес/доп. инфо) — всегда в нижнем левом углу ценника.
    if (previewSubtitle) {
      const subText = isMultiMode ? (activeItem?.subtitle || '') : (inputSubtitle?.value || '');
      previewSubtitle.textContent = subText || '';
      previewSubtitle.style.display = subText ? 'block' : 'none';
      // Размер ~72% от шрифта названия (крупный угловой вариант).
      const baseSize = parseInt(titleSize.value, 10) || 13;
      const subPt = Math.max(11, Math.round(baseSize * 0.72));
      previewSubtitle.style.fontFamily = titleFont.value;
      previewSubtitle.style.color = titleColor.value;
      previewSubtitle.style.fontSize = `${subPt}pt`;
      previewSubtitle.style.fontWeight = '700';
      previewSubtitle.style.textAlign = alignState.subtitle || 'left';
      // Ручное смещение (перетаскивание) поверх углового позиционирования
      previewSubtitle.style.transform = `translate(${lp.subtitle.x}mm, ${lp.subtitle.y}mm)`;
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
        span.className = 'price-digit';
        span.textContent = d;
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

    // Background Image & Overlay (через обобщённый хелпер).
    applyBackgroundTo(wobblerHeader, bgImageSelect.value, uploadedDataUrl, headerBgColor.value);

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
    // Высоты блоков задаются слайдерами (мм). outsideH — также «добавка» к высоте
    // ячейки листа/печати (ценник + блок), учитывается при раскладке А4.
    const outsideH = decorOutsideHeightMm(); // мм, над ценником
    const insideH = decorInsideHeightMm();   // мм, внутри ценника сверху
    document.documentElement.style.setProperty('--outside-top-h', `${outsideH.toFixed(2)}mm`);
    document.documentElement.style.setProperty('--inside-top-h', `${insideH.toFixed(2)}mm`);

    const showOutside = !!(decorOutsideShow && decorOutsideShow.checked);
    const showInside = !!(decorInsideShow && decorInsideShow.checked);
    wobblerPreview.classList.toggle('has-outside-top', showOutside);
    wobblerPreview.classList.toggle('has-inside-top', showInside);

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
          decorOutsideText ? decorOutsideText.value : '',
          decorOutsideBgImg ? decorOutsideBgImg.value : 'none',
          uploadedDataUrl2,
          decorOutsideBg ? decorOutsideBg.value : '#e63946',
          decorOutsideColor ? decorOutsideColor.value : '#ffffff',
          decorOutsideFontSize ? decorOutsideFontSize.value : 14);
      } else {
        wobblerOutsideTop.style.display = 'none';
      }
    }
    if (decorOutsideFontSize && decorOutsideFontSizeVal) decorOutsideFontSizeVal.textContent = decorOutsideFontSize.value;
    if (decorOutsideHeight && decorOutsideHeightVal) decorOutsideHeightVal.textContent = decorOutsideHeight.value;

    if (wobblerInsideTop) {
      if (showInside) {
        applyDecorBlock(wobblerInsideTop, insideTopText,
          decorInsideText ? decorInsideText.value : '',
          decorInsideBgImg ? decorInsideBgImg.value : 'none',
          uploadedDataUrl3,
          decorInsideBg ? decorInsideBg.value : '#e63946',
          decorInsideColor ? decorInsideColor.value : '#ffffff',
          decorInsideFontSize ? decorInsideFontSize.value : 11);
      } else {
        wobblerInsideTop.style.display = 'none';
      }
    }
    if (decorInsideFontSize && decorInsideFontSizeVal) decorInsideFontSizeVal.textContent = decorInsideFontSize.value;
    if (decorInsideHeight && decorInsideHeightVal) decorInsideHeightVal.textContent = decorInsideHeight.value;

    // Внутренний блок позиционируется поверх (absolute) — шапку не трогаем,
    // её высоту задаёт CSS (привязка к --wobbler-height).

    // Эффективная высота карточки для раскладки листа/печати (с учётом внешнего блока).
    window.__cardEffH = heightMm + (showOutside ? outsideH : 0);

    // Фиксированная высота зоны названия (мм), чтобы цена под ним не
    // смещалась при росте шрифта/длины названия. Берём высоту шапки в мм:
    // в режиме full — вся высота воблера; в split — headerHeight% от неё.
    const headerHm = selectedLayout === 'full'
      ? heightMm
      : heightMm * (parseInt(headerHeightRange.value, 10) || 50) / 100;
    const priceInBottomNow = rybaPriceInBottom && selectedLayout === 'split';
    // Если цена в шапке — оставляем ~45% под название; если цена в нижнем
    // поле — шапка почти целиком отдаётся названию (~85%).
    const titleZone = headerHm * (priceInBottomNow ? 0.85 : 0.45);
    document.documentElement.style.setProperty('--title-zone-h', `${titleZone.toFixed(2)}mm`);

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
        else uploadedDataUrl3 = event.target.result;
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
    titleWeight.value = state.titleWeight || '800';
    titleOffsetY.value = state.titleOffsetY || 0;
    alignState.title = state.titleAlign || 'center';

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

    // Декоративные блоки «Оформление» (внешний + внутренний).
    if (decorOutsideShow) decorOutsideShow.checked = !!state.decorOutsideShow;
    if (decorOutsideText) decorOutsideText.value = state.decorOutsideText != null ? state.decorOutsideText : 'НОВИНКА';
    if (decorOutsideBg) decorOutsideBg.value = state.decorOutsideBg || '#e63946';
    if (decorOutsideColor) decorOutsideColor.value = state.decorOutsideColor || '#ffffff';
    if (decorOutsideFontSize) decorOutsideFontSize.value = state.decorOutsideFontSize != null ? state.decorOutsideFontSize : 14;
    if (decorOutsideHeight) decorOutsideHeight.value = state.decorOutsideHeight != null ? state.decorOutsideHeight : 12;
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
    if (decorInsideCustomOption) decorInsideCustomOption.style.display = state.decorInsideCustomBg ? 'block' : 'none';
    uploadedDataUrl3 = state.decorInsideCustomBg || null;
    if (decorInsideBgImg) decorInsideBgImg.value = state.decorInsideCustomBg ? 'custom' : (state.decorInsideBgImg || 'none');
    if (decorInsideUploadStatus) decorInsideUploadStatus.textContent = state.decorInsideCustomBg ? '✓ Пользовательский фон' : '';

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
      titleAlign: alignState.title,
      titleOffsetY: titleOffsetY.value,

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
    inputTitle, inputSubtitle, titleFont, titleColor, titleSize, titleWeight, titleOffsetY,
    showPriceToggle, priceFont, priceSize, priceWeight, priceColor, priceOffsetY, inputPrice, inputCurrency, pricePlateToggle,
    headerBgColor, bgImageSelect, headerHeightRange,
    sheetCount, singleRepeatCount, showCropMarks,
    // Декоративные блоки «Оформление»
    decorOutsideShow, decorOutsideText, decorOutsideBg, decorOutsideBgImg, decorOutsideColor, decorOutsideFontSize, decorOutsideHeight,
    decorInsideShow, decorInsideText, decorInsideBg, decorInsideBgImg, decorInsideColor, decorInsideFontSize, decorInsideHeight
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
  if (dragModeToggle) {
    dragModeToggle.addEventListener('click', () => {
      const on = wobblerPreview.classList.toggle('drag-mode');
      dragModeToggle.classList.toggle('active', on);
    });
  }

  // Сброс смещений АКТИВНОГО ценника (текущий товар в мульти-режиме / одиночный).
  if (resetLabelPosBtn) {
    resetLabelPosBtn.addEventListener('click', () => {
      const lp = activeLabelPos();
      lp.title = { x: 0, y: 0 };
      lp.subtitle = { x: 0, y: 0 };
      lp.price = { x: 0, y: 0 };
      lp.priceDigits = [];
      lp.currency = { x: 0, y: 0 };
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
    syncPricePosPreviewBtn.addEventListener('click', applyPricePosFromFirstToAll);
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
});
