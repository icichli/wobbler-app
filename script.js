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

  // Initial View Switch (Preview vs Controls on Mobile)
  function setMobileActiveTab(tabName) {
    document.body.classList.remove('view-preview', 'view-controls');
    document.body.classList.add(`view-${tabName}`);

    mobileTabBtns.forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-mobile-view') === tabName);
    });
  }

  // Mode button click events
  if (deviceAutoBtn) deviceAutoBtn.addEventListener('click', () => setDeviceMode('auto'));
  if (deviceMobileBtn) deviceMobileBtn.addEventListener('click', () => setDeviceMode('mobile'));
  if (deviceDesktopBtn) deviceDesktopBtn.addEventListener('click', () => setDeviceMode('desktop'));

  // Mobile view tab buttons click events
  mobileTabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const view = btn.getAttribute('data-mobile-view');
      setMobileActiveTab(view);
    });
  });

  // DOM Inputs - Size
  const wobblerWidthInput = document.getElementById('wobblerWidthInput');
  const wobblerHeightInput = document.getElementById('wobblerHeightInput');
  const rulerHText = document.getElementById('rulerHText');
  const rulerVText = document.getElementById('rulerVText');
  const topSubtitle = document.getElementById('topSubtitle');
  const sheetCalcText = document.getElementById('sheetCalcText');

  // DOM Inputs - Title
  const inputTitle = document.getElementById('inputTitle');
  const titleFont = document.getElementById('titleFont');
  const titleColor = document.getElementById('titleColor');
  const titleSize = document.getElementById('titleSize');
  const titleSizeVal = document.getElementById('titleSizeVal');
  const titleWeight = document.getElementById('titleWeight');
  const titleOffsetY = document.getElementById('titleOffsetY');
  const titleOffsetYVal = document.getElementById('titleOffsetYVal');

  // DOM Inputs - Subtitle
  const inputSubtitle = document.getElementById('inputSubtitle');
  const subtitleFont = document.getElementById('subtitleFont');
  const subtitleColor = document.getElementById('subtitleColor');
  const subtitleSize = document.getElementById('subtitleSize');
  const subtitleSizeVal = document.getElementById('subtitleSizeVal');
  const subtitleOffsetY = document.getElementById('subtitleOffsetY');
  const subtitleOffsetYVal = document.getElementById('subtitleOffsetYVal');

  // Price Toggle & Inputs
  const showPriceToggle = document.getElementById('showPriceToggle');
  const priceFieldsBlock = document.getElementById('priceFieldsBlock');
  const inputPrice = document.getElementById('inputPrice');
  const inputCurrency = document.getElementById('inputCurrency');

  // Background & Upload Inputs
  const headerBgColor = document.getElementById('headerBgColor');
  const bgImageSelect = document.getElementById('bgImageSelect');
  const customBgUpload = document.getElementById('customBgUpload');
  const uploadStatus = document.getElementById('uploadStatus');
  const customBgOption = document.getElementById('customBgOption');
  const headerHeightRange = document.getElementById('headerHeightRange');
  const headerHeightVal = document.getElementById('headerHeightVal');

  // Sheet Config & Buttons
  const sheetCount = document.getElementById('sheetCount');
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

  // Modal & Template Elements
  const saveTemplateBtn = document.getElementById('saveTemplateBtn');
  const saveModal = document.getElementById('saveModal');
  const cancelSaveModal = document.getElementById('cancelSaveModal');
  const confirmSaveModal = document.getElementById('confirmSaveModal');
  const newTemplateNameInput = document.getElementById('newTemplateNameInput');
  const userTemplatesContainer = document.getElementById('userTemplates');
  const emptyUserTemplates = document.getElementById('emptyUserTemplates');
  const userCount = document.getElementById('userCount');

  // Alignments State
  let alignState = {
    title: 'center',
    subtitle: 'center'
  };

  // Custom Uploaded Data URL
  let uploadedDataUrl = null;

  // Built-in presets
  const builtInPresets = {
    novy_vkus: {
      name: 'Новый вкус',
      widthCm: 6.5,
      heightCm: 4.5,
      title: 'НОВЫЙ ВКУС',
      titleFont: "'Montserrat', sans-serif",
      titleColor: '#ffffff',
      titleSize: 18,
      titleWeight: '900',
      titleAlign: 'center',
      titleOffsetY: 0,
      subtitle: '',
      subtitleFont: "'Montserrat', sans-serif",
      subtitleColor: '#ffffff',
      subtitleSize: 10,
      subtitleAlign: 'center',
      subtitleOffsetY: 0,
      showPrice: false,
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
      subtitle: '',
      subtitleFont: "'Montserrat', sans-serif",
      subtitleColor: '#333333',
      subtitleSize: 10,
      subtitleAlign: 'center',
      subtitleOffsetY: 0,
      showPrice: false,
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
      subtitle: '',
      subtitleFont: "'Montserrat', sans-serif",
      subtitleColor: '#ffffff',
      subtitleSize: 10,
      subtitleAlign: 'center',
      subtitleOffsetY: 0,
      showPrice: false,
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
      subtitle: '',
      subtitleFont: "'Montserrat', sans-serif",
      subtitleColor: '#ffffff',
      subtitleSize: 10,
      subtitleAlign: 'center',
      subtitleOffsetY: 0,
      showPrice: false,
      price: '159',
      currency: '₽',
      headerBg: '#7b2cbf',
      bgImage: 'none',
      customBgData: null,
      headerHeight: 50,
      layout: 'split'
    }
  };

  // LocalStorage Custom Templates Storage
  let customTemplates = JSON.parse(localStorage.getItem('wobbler_custom_templates_gas') || '[]');

  // Calculate maximum fitting wobblers on A4
  function calcA4Grid(wMm, hMm) {
    const pageW = 195;
    const pageH = 280;
    const cols = Math.max(1, Math.floor(pageW / wMm));
    const rows = Math.max(1, Math.floor(pageH / hMm));
    return { cols, rows, maxCount: cols * rows };
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

    // Title
    previewTitle.textContent = inputTitle.value.trim() || 'ЗАГОЛОВОК';
    previewTitle.style.fontFamily = titleFont.value;
    previewTitle.style.color = titleColor.value;
    previewTitle.style.fontSize = `${titleSize.value}pt`;
    previewTitle.style.fontWeight = titleWeight.value;
    previewTitle.style.textAlign = alignState.title;
    previewTitle.style.transform = `translateY(${titleOffsetY.value}mm)`;
    titleSizeVal.textContent = titleSize.value;
    titleOffsetYVal.textContent = titleOffsetY.value;

    // Subtitle
    const subText = inputSubtitle.value.trim();
    previewSubtitle.textContent = subText;
    previewSubtitle.style.display = subText ? 'block' : 'none';
    previewSubtitle.style.fontFamily = subtitleFont.value;
    previewSubtitle.style.color = subtitleColor.value;
    previewSubtitle.style.fontSize = `${subtitleSize.value}pt`;
    previewSubtitle.style.textAlign = alignState.subtitle;
    previewSubtitle.style.transform = `translateY(${subtitleOffsetY.value}mm)`;
    subtitleSizeVal.textContent = subtitleSize.value;
    subtitleOffsetYVal.textContent = subtitleOffsetY.value;

    // Price Toggle & Values
    if (showPriceToggle.checked) {
      priceFieldsBlock.style.display = 'block';
      previewPriceBox.style.display = 'flex';
      previewPrice.textContent = inputPrice.value.trim();
      previewCurrency.textContent = inputCurrency.value.trim();
    } else {
      priceFieldsBlock.style.display = 'none';
      previewPriceBox.style.display = 'none';
    }

    // Background Color & Images
    wobblerHeader.style.backgroundColor = headerBgColor.value;
    const bgVal = bgImageSelect.value;
    if (bgVal === 'custom' && uploadedDataUrl) {
      wobblerHeader.style.backgroundImage = `url('${uploadedDataUrl}')`;
    } else {
      wobblerHeader.style.backgroundImage = 'none';
    }

    // Layout Fix
    headerHeightVal.textContent = headerHeightRange.value;
    const selectedLayout = document.querySelector('input[name="layoutType"]:checked').value;
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

  // Render Mini A4 Sheet Grid Preview
  function renderSheetPreview(wMm, hMm) {
    sheetGridPreview.innerHTML = '';
    const grid = calcA4Grid(wMm, hMm);

    let count = grid.maxCount;
    if (sheetCount.value !== 'auto') {
      count = Math.min(parseInt(sheetCount.value, 10), grid.maxCount);
    }

    sheetCalcText.textContent = `${count} шт на листе (${grid.cols}×${grid.rows})`;
    sheetGridPreview.style.gridTemplateColumns = `repeat(${grid.cols}, ${wMm}mm)`;
    sheetGridPreview.style.gridTemplateRows = `repeat(${grid.rows}, ${hMm}mm)`;

    const wobblerHTML = wobblerPreview.outerHTML;

    for (let i = 0; i < count; i++) {
      const itemWrapper = document.createElement('div');
      itemWrapper.style.position = 'relative';
      itemWrapper.style.width = `${wMm}mm`;
      itemWrapper.style.height = `${hMm}mm`;
      itemWrapper.innerHTML = wobblerHTML;

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

    const grid = calcA4Grid(wMm, hMm);
    let count = grid.maxCount;
    if (sheetCount.value !== 'auto') {
      count = Math.min(parseInt(sheetCount.value, 10), grid.maxCount);
    }

    // Clone clean wobbler element without UI wrappers or box shadows
    const cleanWobbler = wobblerPreview.cloneNode(true);
    cleanWobbler.removeAttribute('id');
    cleanWobbler.style.boxShadow = 'none';

    const page = document.createElement('div');
    page.className = 'print-page';
    page.style.gridTemplateColumns = `repeat(${grid.cols}, ${wMm}mm)`;
    page.style.gridTemplateRows = `repeat(${grid.rows}, ${hMm}mm)`;

    for (let i = 0; i < count; i++) {
      const itemWrapper = document.createElement('div');
      itemWrapper.className = 'print-wobbler-wrapper';
      itemWrapper.style.width = `${wMm}mm`;
      itemWrapper.style.height = `${hMm}mm`;
      itemWrapper.appendChild(cleanWobbler.cloneNode(true));

      if (showCropMarks.checked) {
        const crop = document.createElement('div');
        crop.className = 'print-crop-marks';
        itemWrapper.appendChild(crop);
      }

      page.appendChild(itemWrapper);
    }

    printArea.appendChild(page);
  }

  // Robust Print Trigger Function
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
    titleFont.value = state.titleFont || "'Montserrat', sans-serif";
    titleColor.value = state.titleColor || '#ffffff';
    titleSize.value = state.titleSize || 18;
    titleWeight.value = state.titleWeight || '900';
    titleOffsetY.value = state.titleOffsetY || 0;
    alignState.title = state.titleAlign || 'center';

    inputSubtitle.value = state.subtitle || '';
    subtitleFont.value = state.subtitleFont || "'Montserrat', sans-serif";
    subtitleColor.value = state.subtitleColor || '#ffffff';
    subtitleSize.value = state.subtitleSize || 10;
    subtitleOffsetY.value = state.subtitleOffsetY || 0;
    alignState.subtitle = state.subtitleAlign || 'center';

    ['title', 'subtitle'].forEach(target => {
      document.querySelectorAll(`.align-btn[data-target="${target}"]`).forEach(b => {
        b.classList.toggle('active', b.getAttribute('data-align') === alignState[target]);
      });
    });

    showPriceToggle.checked = !!state.showPrice;
    inputPrice.value = state.price || '240';
    inputCurrency.value = state.currency || '₽';

    headerBgColor.value = state.headerBg || '#e63946';
    
    if (state.customBgData) {
      uploadedDataUrl = state.customBgData;
      customBgOption.style.display = 'block';
      bgImageSelect.value = 'custom';
      uploadStatus.textContent = '✓ Пользовательский фон';
    } else {
      bgImageSelect.value = state.bgImage || 'none';
      uploadStatus.textContent = '';
    }

    headerHeightRange.value = state.headerHeight || 50;

    const layoutRadio = document.querySelector(`input[name="layoutType"][value="${state.layout || 'full'}"]`);
    if (layoutRadio) layoutRadio.checked = true;

    updatePreview();
  }

  // Get Current State Object from Inputs
  function getCurrentState() {
    return {
      widthCm: parseFloat(wobblerWidthInput.value) || 6.5,
      heightCm: parseFloat(wobblerHeightInput.value) || 4.5,

      title: inputTitle.value,
      titleFont: titleFont.value,
      titleColor: titleColor.value,
      titleSize: titleSize.value,
      titleWeight: titleWeight.value,
      titleAlign: alignState.title,
      titleOffsetY: titleOffsetY.value,

      subtitle: inputSubtitle.value,
      subtitleFont: subtitleFont.value,
      subtitleColor: subtitleColor.value,
      subtitleSize: subtitleSize.value,
      subtitleAlign: alignState.subtitle,
      subtitleOffsetY: subtitleOffsetY.value,

      showPrice: showPriceToggle.checked,
      price: inputPrice.value,
      currency: inputCurrency.value,

      headerBg: headerBgColor.value,
      bgImage: bgImageSelect.value,
      customBgData: bgImageSelect.value === 'custom' ? uploadedDataUrl : null,
      headerHeight: headerHeightRange.value,
      layout: document.querySelector('input[name="layoutType"]:checked').value
    };
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
        <button class="btn-delete-template" title="Удалить шаблон" data-index="${index}">🗑️</button>
      `;

      card.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-delete-template')) return;
        document.querySelectorAll('.preset-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        applyState(item.state);
      });

      const delBtn = card.querySelector('.btn-delete-template');
      delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm(`Удалить шаблон "${item.name}"?`)) {
          customTemplates.splice(index, 1);
          localStorage.setItem('wobbler_custom_templates_gas', JSON.stringify(customTemplates));
          renderSavedTemplates();
        }
      });

      userTemplatesContainer.appendChild(card);
    });
  }

  // Preset Handlers
  document.querySelectorAll('#builtInTemplates .preset-card').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.preset-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');

      const key = card.getAttribute('data-preset');
      const p = builtInPresets[key];
      if (p) {
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

  // Modal Handlers for Saving New Templates
  saveTemplateBtn.addEventListener('click', () => {
    newTemplateNameInput.value = '';
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
    
    saveModal.classList.remove('active');
    renderSavedTemplates();
    document.querySelector('.tab-btn[data-tab="userSaved"]').click();
  });

  // Event Listeners for Input Changes
  const allInputs = [
    wobblerWidthInput, wobblerHeightInput,
    inputTitle, titleFont, titleColor, titleSize, titleWeight, titleOffsetY,
    inputSubtitle, subtitleFont, subtitleColor, subtitleSize, subtitleOffsetY,
    showPriceToggle, inputPrice, inputCurrency,
    headerBgColor, bgImageSelect, headerHeightRange,
    sheetCount, showCropMarks
  ];

  allInputs.forEach(el => {
    if (el) {
      el.addEventListener('input', updatePreview);
      el.addEventListener('change', updatePreview);
    }
  });

  document.querySelectorAll('input[name="layoutType"]').forEach(r => {
    r.addEventListener('change', updatePreview);
  });

  // Print Handlers
  if (printBtn) printBtn.addEventListener('click', triggerPrint);
  if (printBtnSidebar) printBtnSidebar.addEventListener('click', triggerPrint);

  // Initialize Device Mode (Saved Mode or Auto)
  const savedDeviceMode = localStorage.getItem('wobbler_device_mode') || 'auto';
  setDeviceMode(savedDeviceMode);
  setMobileActiveTab('preview');

  // Initialize Preview State
  renderSavedTemplates();
  applyState(builtInPresets.novy_vkus);
});
