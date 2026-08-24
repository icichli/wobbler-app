#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Генератор индекса фоновых картинок из папки «bg other».

Нужен для ОНЛАЙН-версии (когда проект лежит на веб-сервере по http://).
Браузер не умеет перечислять файлы в каталоге, поэтому список фонов
берётся из bg_index.json. Локально (при открытии index.html двойным
кликом, file://) этот файл не используется — там фоны кэшируются после
одного ручного выбора папки.

Запускайте скрипт при каждом изменении содержимого папки «bg other»
(добавление / удаление / переименование файлов), а затем заливайте
обновлённый bg_index.json на сервер рядом с index.html:

    python gen_bg_index.py

Файлы берутся с сортировкой по имени; поддерживаются расширения:
jpg, jpeg, png, webp, gif.
"""

import os
import json

HERE = os.path.dirname(os.path.abspath(__file__))
BG_DIR = os.path.join(HERE, "bg other")
EXTS = (".jpg", ".jpeg", ".png", ".webp", ".gif")

files = []
if os.path.isdir(BG_DIR):
    for name in sorted(os.listdir(BG_DIR), key=lambda s: s.lower()):
        full = os.path.join(BG_DIR, name)
        if name.lower().endswith(EXTS) and os.path.isfile(full):
            files.append(name)

with open(os.path.join(HERE, "bg_index.json"), "w", encoding="utf-8") as f:
    json.dump({"dir": "bg other", "files": files}, f, ensure_ascii=False, indent=2)

print("bg_index.json: %d фонов" % len(files))
for n in files:
    print("  - " + n)
