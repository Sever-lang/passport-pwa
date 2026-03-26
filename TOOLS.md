# TOOLS.md - Local Notes

Skills define *how* tools work. This file is for *your* specifics — the stuff that's unique to your setup and the UPX5 environment.

## Environment (UPX5)

The assistant runs in a privileged container with:

* **OpenAI — только через прослойку UPX5.** Все варианты работы с OpenAI (чат, эмбединги, DALL·E, любые вызовы API) должны идти через нашу прокси. В конфиге уже заданы `OPENAI_API_BASE` и `OPENAI_API_KEY` — используй их; не обращайся к api.openai.com напрямую.
* **Image understanding** — для распознавания входящих изображений используй только модель из `agents.defaults.imageModel.primary`. Не хардкодь `openai/gpt-4.1-mini`, `google/gemini-*` или другие запасные vision-модели. `dall-e-3` используй только для генерации, не для анализа фото.
* **Image generation** — по умолчанию для генерации изображений используй модель из `OPENAI_IMAGE_MODEL` (в конфиге по умолчанию `gpt-image-1.5`). Если явно не оговорено иное, не переключай генерацию на другие модели.
* **Генерация по изображению / редактирование изображения** — когда пользователь прислал картинку и просит её изменить, дорисовать или сгенерировать на её основе, используй скилл **upx5-image-generation** и скрипт **edit.mjs**: эндпоинт `POST /v1/images/edits` (через прослойку). Команда: `node <skill-dir>/scripts/edit.mjs "промпт с описанием правки" --image /path/to/image.png [--mask /path/to/mask.png] --output /tmp/edited.png`. Для генерации с нуля по одному тексту — по-прежнему `generate.mjs` (generations).

### Директива: вложение-картинка + любая правка

- Сообщение с **прикреплённым изображением** и просьбой изменить, дорисовать, «сделай как на фото», стиль, фон, цвет, удалить объект — **сначала загрузи скилл upx5-image-generation (read SKILL.md), сохрани файл вложения на диск, затем только edit.mjs** с этим путём в `--image`.
- **Нельзя** удовлетворять такой запрос через generate.mjs, через чистый текстовый промпт к генерации картинок или любой инструмент без передачи **файла** исходника в edits — это даст **другую** картинку, не основанную на присланной.
- Исключение: пользователь явно просит **новую** картинку **без** опоры на вложение (и вложение случайно или только для контекста) — тогда по смыслу можно generate; если сомневаешься — edit по вложению безопаснее для «на основе этого фото».
* **Workspace** — files under the OpenClaw workspace are persisted on the host.
* **Docker** — Docker socket is mounted; you can use `docker run`, `docker exec`, `docker compose` for user-requested tasks only. Avoid untrusted images or commands that could compromise the host.
* **Browser** — Patchright/Chromium is available for automation (default browser skill: online-shopping, xvfb). Use for web tasks and sites with Cloudflare.
* **Voice** — faster-whisper for speech-to-text (model small by default; medium in config). Users can send voice messages in Telegram; they are transcribed and handled as text.
* **Voice policy** — always recognize voice via local faster-whisper.
* **Persistence policy** — when configuring infrastructure, make persistent changes on the host or in mounted directories, not only inside containers.
* **Host configs first** — if config is host-level (for example nginx in `/etc/nginx`), edit on host. Container rebuild/recreate can wipe in-container changes.
* **Search** — SearXNG for web search when you need up-to-date information. Instance: **http://upx5-searxng:8080**
* **Skills** — local-websearch (SearXNG), antidetect-browser, upx5-image-generation, upx5-limits, mcporter (MCP bridge), notion, google-calendar, shellmail, gitrama, canva, kai-tw-figma. Для любых OpenAI (чат, эмбединги, генерация изображений) — только через прослойку (см. выше). Check each skill's `SKILL.md` when using it.

### Команда /limits

- Когда пользователь пишет **/limits** или просит лимиты/остаток — ответ должен содержать **две части**:
  1. **Продление и баланс**: до отключения (дней), на балансе (₽), нужно для продления (₽), не хватает (₽). Данные брать из `GET baseUrl + statusPath` с заголовком `X-Bot-Key` (то же, что в `upx5-billing.json`: billing-status) или из файла `/home/openclaw/.openclaw/state/upx5-billing-status.json`, если он есть.
  2. **Лимиты Codex**: выполни **один раз** `node <skill-dir>/scripts/get-limits.mjs` (скилл upx5-limits). Скрипт дергает бэкенд `codex-limits` и возвращает план, % по 5ч и неделе, время сброса из БД. Добавь этот вывод в ответ отдельным блоком.
- Итого: в ответе по /limits всегда и блок про продление/баланс, и блок про лимиты Codex (вывод get-limits.mjs). После этого не вызывать лишние инструменты.

### Поиск в интернете и открытие сайтов (директива)

- **Поиск в интернете:** если пользователь просит что-то поискать в интернете (поисковик, «найди в сети», «поищи в Google/Яндексе» и т.п.) — используй **скилл local-web-search**. Загрузи его (read SKILL.md скилла local-web-search) и выполни поиск по инструкциям скилла (команда/скрипт из скилла, без встроенного web_search tool, если не настроен провайдер). Не подменяй поиск открытием одного сайта.
- **Открытие конкретных сайтов:** если нужно открыть сайт, перейти по ссылке, заполнить форму, что-то сделать на странице (магазин, форма, капча и т.д.) — используй **скилл antidetect-browser**. Загрузи его (read SKILL.md скилла antidetect-browser) и работай по нему: snapshot.mjs для снимка с ref и действий по ref, browse.mjs для открытия страниц через браузер (xvfb + Patchright). Не используй для этого инструмент browser и не проси пользователя включить Chrome Relay — только скрипты скилла antidetect-browser.

Итого: поиск в интернете → **local-web-search**; открытие и действия на сайтах → **antidetect-browser**.

## MCP Connectors

Проверяй готовность перед использованием. **Пользователь не настраивает сам** — если коннектор не настроен, настраивай сам (нужные данные запрашивай в чате). Если нужных данных нет — не используй или предложи, что пользователь может прислать (номер, файл и т.д.).

### Telegram MCP

* **Path:** `/home/openclaw/.openclaw/mcp-telegram`
* **Status:** установлен; `TELEGRAM_API_ID` и `TELEGRAM_API_HASH` в `.env` выставляются плейбуком автоматически.
* **Usage policy:** если Telegram MCP tool доступен в инструментах и отвечает, считай, что он уже настроен и его можно использовать сразу, не прося пользователя делать ручную настройку.
* **Для настройки нужен только номер телефона** — на нём должен быть уже залогинен пользовательский аккаунт Telegram. Пользователь только дает телефон, а ты сам авторизируешь, просишь у пользователя код авторизации и после вводка кода тобой, появится `TELEGRAM_SESSION_STRING`.
* **Smoke test:** `uv --directory /home/openclaw/.openclaw/mcp-telegram run main.py`
* **Use:** работа в Telegram от лица пользователя — чаты, сообщения, группы, контакты, медиа (Telethon). Отдельно от бота.

### Google Docs MCP

* **Path:** `/home/openclaw/.openclaw/mcp-google-docs`
* **Status:** установлен; настройка на тебе — пользователь не выполняет команды.
* **Чтобы включить:** нужен файл `service-account.json` (ключ сервисного аккаунта Google). Попроси пользователя прислать файл или вставить содержимое (если у него есть доступ в Google Cloud); сохрани в `/home/openclaw/.openclaw/mcp-google-docs/service-account.json` и при необходимости перезапусти/проверь. Без ключа не используй.
* **Smoke test:** `node /home/openclaw/.openclaw/mcp-google-docs/node_modules/@xalia/mcp-googledocs-server/dist/server.js`
* **Use:** чтение и запись Google Docs и Sheets, поиск и управление файлами в Google Drive.

## What Goes Here (Your Notes)

Things like:

* Camera names and locations
* SSH hosts and aliases
* Preferred voices for TTS
* Speaker/room names
* Device nicknames
* Anything environment-specific

## Examples

```markdown
### Cameras

- living-room → Main area, 180° wide angle
- front-door → Entrance, motion-triggered

### SSH

- home-server → 192.168.1.100, user: admin

### TTS

- Preferred voice: "Nova" (warm, slightly British)
- Default speaker: Kitchen HomePod
```

## Why Separate?

Skills are shared. Your setup is yours. Keeping them apart means you can update skills without losing your notes, and share skills without leaking your infrastructure.

***

Add whatever helps you do your job. This is your cheat sheet.
