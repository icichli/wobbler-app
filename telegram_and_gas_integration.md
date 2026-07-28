# Руководство по интеграции: Google Таблицы (Apps Script) + Telegram Mini App

Конструктор воблеров полностью совместим с **Google Apps Script (GAS)** и может быть легко запущен как **Telegram Mini App (TMA)**.

---

## 1. Интеграция с Google Таблицами (Google Apps Script)

Google Таблицы могут служить полноценной базой данных для ценников (названия товаров, категории, шаблоны, сохраненные ценники).

### Шаг 1. Создайте Google Таблицу
Создайте новую таблицу со столбцами:
`ID | Название товара | Заголовок | Подзаголовок | Цвет фона | Размер (ШхВ) | Фото фона`

### Шаг 2. Код `Code.gs` (в меню Расширения -> Apps Script)

```javascript
// Функция отдачи веб-приложения
function doGet() {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('Конструктор Воблеров')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL); // Разрешает встраивание в Telegram
}

// Загрузка товаров из Google Таблицы
function getProductsFromSheet() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const data = sheet.getDataRange().getValues();
  const headers = data.shift();
  
  return data.map(row => ({
    id: row[0],
    title: row[1],
    subtitle: row[2],
    color: row[3],
    size: row[4],
    bgImage: row[5]
  }));
}

// Сохранение нового шаблона в таблицу
function saveTemplateToSheet(templateData) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Templates') || 
                SpreadsheetApp.getActiveSpreadsheet().insertSheet('Templates');
  
  sheet.appendRow([
    new Date(),
    templateData.name,
    templateData.width,
    templateData.height,
    templateData.title,
    templateData.bgColor
  ]);
  return "OK";
}
```

---

## 2. Превращение в Telegram Mini App (TMA)

Telegram Mini App — это веб-страница, открывающаяся внутри Telegram.

### Шаг 1. Подключение скрипта Telegram WebApp в `<head>`
В `index.html` добавляется библиотека Telegram:

```html
<head>
  <!-- Telegram Web App SDK -->
  <script src="https://telegram.org/js/telegram-web-app.js"></script>
</head>
```

### Шаг 2. Инициализация Telegram SDK в `script.js`

```javascript
// Инициализация Telegram WebApp
const tg = window.Telegram ? window.Telegram.WebApp : null;

if (tg) {
  tg.expand(); // Развернуть окно на весь экран
  tg.ready();

  // Применить тему Telegram (темная/светлая)
  console.log("Пользователь Telegram:", tg.initDataUnsafe.user);
  
  // Кнопка MainButton в Telegram (например, Печать или Отправка)
  tg.MainButton.text = "🖨️ Сформировать печать на А4";
  tg.MainButton.show();
  tg.MainButton.onClick(function() {
    window.print();
  });
}
```

### Шаг 3. Регистрация бота через @BotFather
1. Напишите боту [@BotFather](https://t.me/BotFather) в Telegram.
2. Создайте бота `/newbot`.
3. Отправьте команду `/newapp` и привяжите URL опубликованного веб-приложения Google Apps Script (или ссылку на ваш хостинг).
4. Готово! Кнопка запуска конструктора появится прямо в чате Telegram.
