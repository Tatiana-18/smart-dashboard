# 🦊 Smart Dashboard

**PWA-приложение для повышения личной продуктивности**

> Задачи · Заметки · Трекер активности · Геймификация · Offline-режим

---

## 📋 Содержание

1. [Описание](#описание)
2. [Архитектура](#архитектура)
3. [Быстрый старт (Docker)](#быстрый-старт-docker)
4. [Локальная разработка без Docker](#локальная-разработка-без-docker)
5. [Настройка Supabase](#настройка-supabase)
6. [Структура проекта](#структура-проекта)
7. [Тесты](#тесты)
8. [Линтинг](#линтинг)
9. [CI/CD](#cicd)
10. [Деплой на Render](#деплой-на-render)
11. [PWA и offline-режим](#pwa-и-offline-режим)
12. [Частые ошибки](#частые-ошибки)

---

## Описание

Smart Dashboard — модульное PWA-приложение (Mobile First) для отслеживания задач, заметок и прогресса активности. Поддерживает работу в offline-режиме, установку как нативное приложение и авторизацию через Supabase.

**Ключевые возможности:**

- ✅ Создание, редактирование и удаление задач с категориями
- 📝 Заметки с начислением очков
- 📊 Трекер: уровни, бейджи, стрики
- 👤 Профиль с аватаром и тёмной темой
- 🔐 Авторизация через Supabase (или localStorage-fallback)
- 📴 Полноценный offline-режим через Service Worker
- 📱 Установка как PWA (iOS / Android / Desktop)

---

## Архитектура

```
браузер
  └── nginx (порт 3000)
        ├── /           → static files (public/)
        └── /api/       → proxy → Node.js backend (порт 4000)
                                    └── Supabase Auth API
```

**Стек:**

| Слой | Технология |
|---|---|
| Frontend | Vanilla JS, CSS, HTML (PWA) |
| Backend | Node.js + Express |
| База данных / Auth | Supabase |
| Веб-сервер | nginx |
| Контейнеры | Docker + docker-compose |
| Тесты | Jest + jsdom |
| Линтинг | ESLint |
| CI/CD | GitHub Actions |

---

## Быстрый старт (Docker)

### Шаг 1 — Клонировать репозиторий

```bash
git clone https://github.com/your-username/smart-dashboard.git
cd smart-dashboard
```

### Шаг 2 — Создать `.env`

```bash
cp .env.example .env
```

Открыть `.env` и вставить ваши данные Supabase (см. [Настройка Supabase](#настройка-supabase)):

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
PORT=4000
NODE_ENV=production
```

### Шаг 3 — Запустить

```bash
docker-compose up --build
```

Приложение доступно на: **http://localhost:3000**

### Остановить

```bash
docker-compose down
```

---

## Локальная разработка без Docker

Требуется: **Node.js 20+**

```bash
# 1. Установить зависимости
npm install

# 2. Создать .env
cp .env.example .env
# — заполнить .env своими Supabase-ключами —

# 3. Запустить backend
npm start
# или с автоперезагрузкой:
npm run dev

# 4. В отдельном терминале — запустить frontend
npm run serve:frontend
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:4000
- Health check: http://localhost:4000/health

---

## Настройка Supabase

1. Зарегистрироваться на [supabase.com](https://supabase.com)
2. Создать новый проект
3. Перейти: **Project Settings → API**
4. Скопировать:
   - `Project URL` → `SUPABASE_URL`
   - `anon / public key` → `SUPABASE_ANON_KEY`
5. Вставить в `.env`

> **Примечание:** Email Confirmation в Supabase по умолчанию включён. Для тестирования без подтверждения почты отключите его в **Authentication → Providers → Email → Confirm email**.

---

## Структура проекта

```
smart-dashboard/
├── .github/
│   └── workflows/
│       ├── test.yml          # Запуск юнит-тестов при пуше
│       └── lint.yml          # Линтинг JS при пуше
│
├── docker/
│   └── Dockerfile            # nginx-контейнер для frontend
│
├── nginx/
│   └── nginx.conf            # nginx: статика + proxy /api/ → backend
│
├── server/
│   ├── server.js             # Express-сервер (порт 4000)
│   ├── db.js                 # Supabase client
│   └── authRoutes.js         # POST /register, POST /login, GET /me
│
├── public/
│   ├── index.html            # Главная страница (SPA)
│   ├── login.html            # Страница авторизации
│   ├── admin.html            # Панель администратора
│   ├── offline.html          # Fallback при отсутствии сети
│   ├── manifest.json         # PWA manifest
│   ├── src/
│   │   ├── core/
│   │   │   ├── authService.js        # Авторизация (API + localStorage fallback)
│   │   │   ├── dataService.js        # CRUD для tasks/notes (localStorage)
│   │   │   ├── router.js             # SPA-роутер
│   │   │   ├── notifications.js      # Уведомления
│   │   │   ├── mascot.js             # Маскот-лисичка 🦊
│   │   │   ├── cacheService.js       # Кэширование ресурсов
│   │   │   ├── uiContainer.js        # Тема (dark/light)
│   │   │   └── config.js             # Константы
│   │   ├── modules/
│   │   │   ├── tasks/                # Задачи (CRUD, очки, стрики)
│   │   │   ├── notes/                # Заметки (CRUD)
│   │   │   ├── tracker/              # Статистика, бейджи, уровни
│   │   │   ├── profile/              # Профиль, аватар, настройки
│   │   │   └── admin/                # Панель администратора
│   │   ├── styles/
│   │   │   ├── variables.css         # CSS-переменные (цвета, тема)
│   │   │   ├── reset.css             # CSS reset
│   │   │   └── main.css              # Основные стили
│   │   ├── serviceWorker.js          # Service Worker (кэш + offline)
│   │   └── main.js                   # Точка входа
│   └── icons/                        # PWA иконки (192x192, 512x512)
│
├── tests/
│   ├── router.test.js                # Тесты: navigate, loadModule, updateNavUI
│   ├── tasks.test.js                 # Тесты: CRUD задач, очки, стрики
│   └── notes-tracker.test.js         # Тесты: заметки, трекер, бейджи
│
├── .env.example              # Шаблон переменных окружения
├── .eslintrc.json            # Конфигурация ESLint
├── docker-compose.yml        # Два сервиса: frontend + backend
├── jest.config.js            # Конфигурация Jest
├── package.json              # Зависимости и скрипты
└── README.md                 # Этот файл
```

---

## Тесты

Тесты написаны на **Jest** с окружением **jsdom** (эмуляция браузера).

```bash
# Запустить все тесты
npm test

# Запустить в режиме наблюдения (watch)
npm run test:watch
```

**Покрытие:**

| Файл | Что тестируется |
|---|---|
| `router.test.js` | navigate(), loadModule(), updateNavUI(), restoreLastRoute() |
| `tasks.test.js` | addTask(), toggleTask(), deleteTask(), editTask(), getStreak() |
| `notes-tracker.test.js` | addNote(), editNote(), deleteNote(), getStats(), getBadges(), calculateLevel() |

**Пример вывода:**

```
PASS tests/router.test.js
PASS tests/tasks.test.js
PASS tests/notes-tracker.test.js

Test Suites: 3 passed, 3 total
Tests:       42 passed, 42 total
```

---

## Линтинг

```bash
# Проверить код на ошибки
npm run lint

# Автоматически исправить
npm run lint:fix
```

Линтер проверяет файлы в `public/src/` по правилам `.eslintrc.json`:
- `no-undef` — запрет необъявленных переменных
- `eqeqeq` — строгое сравнение `===`
- `no-var` — запрет `var`, только `const`/`let`
- `semi` — обязательные точки с запятой

---

## CI/CD

### GitHub Actions

При каждом `push` в `main` или `dev` автоматически запускаются два пайплайна:

**`.github/workflows/test.yml`** — юнит-тесты:
```
push → checkout → node 20 → npm install → npm test
```

**`.github/workflows/lint.yml`** — линтинг:
```
push → checkout → node 20 → npm install → npm run lint
```

Результаты видны во вкладке **Actions** вашего GitHub-репозитория.

---

## Деплой на Render

### Frontend (Static Site или Docker)

1. Подключить репозиторий на [render.com](https://render.com)
2. Выбрать **Web Service** → Docker
3. Указать `docker/Dockerfile` как Dockerfile
4. Порт: `3000`

### Backend (Web Service)

1. Создать отдельный **Web Service**
2. Build command: `npm install`
3. Start command: `node server/server.js`
4. Добавить переменные окружения (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `PORT`, `NODE_ENV=production`)

### Связать frontend и backend

В nginx.conf proxy уже настроен на `backend:4000`. В продакшене на Render frontend и backend — отдельные сервисы, поэтому в `authService.js` `API_URL` автоматически выбирается через:

```js
const API_URL = window.location.hostname === "localhost"
  ? "http://localhost:4000/api"
  : "/api";
```

На Render настройте nginx proxy или используйте переменную `VITE_API_URL` если перейдёте на сборщик.

---

## PWA и offline-режим

### Установка как приложение

**Chrome / Android:**
1. Открыть сайт в браузере
2. Меню → «Добавить на главный экран»

**Safari / iOS:**
1. Открыть сайт в Safari
2. Поделиться → «На экран "Домой"»

### Проверка offline-режима

1. Открыть DevTools → вкладка **Application → Service Workers**
2. Убедиться, что Service Worker зарегистрирован
3. Перейти **Network → Offline**
4. Обновить страницу — должна появиться `offline.html`

### Что кэшируется

Service Worker кэширует при установке:
- `index.html`, `offline.html`, `manifest.json`
- Все CSS-файлы стилей
- Все JS-модули (core + modules)
- Иконки PWA

Данные пользователя (tasks, notes) хранятся в **localStorage** и доступны offline автоматически.

---

## Частые ошибки

### ❌ 502 Bad Gateway

**Причина:** backend не успел запуститься до frontend.

**Решение:**
```bash
docker-compose down
docker-compose up --build
# подождать ~10 секунд пока backend поднимется
```

### ❌ CORS ошибки

**Причина:** frontend обращается напрямую к backend, минуя nginx.

**Решение:** убедитесь что в `authService.js` используется `/api`, а не `http://localhost:4000/api` в продакшене. `API_URL` уже настроен автоматически через `window.location.hostname`.

### ❌ Supabase: "User already registered"

**Причина:** попытка зарегистрировать уже существующий email.

**Решение:** использовать другой email или удалить пользователя в Supabase Dashboard → Authentication → Users.

### ❌ `npm test` падает с "setupFilesAfterFramework"

**Причина:** опечатка в старой версии `jest.config.js`.

**Решение:** уже исправлено — `setupFilesAfterEnv: []`.

### ❌ Service Worker не обновляется

**Решение:**
```
DevTools → Application → Service Workers → «Update» или «Unregister»
```

---

## 🎨 Дизайн-система

| Переменная | Значение | Применение |
|---|---|---|
| `--primary` | `#8B5CF6` | Фиолетовый акцент |
| `--secondary` | `#EC4899` | Розовый акцент |
| `--gradient` | purple → pink | Кнопки, заголовки |
| `--success` | `#10B981` | Выполненные задачи |
| `--bg` | `#F9FAFB` | Фон страницы |
| `--surface` | `#FFFFFF` | Карточки |

Тёмная тема переключается через `body.dark-theme` и настройки профиля.

---

## 📄 Лицензия

Учебный проект. MIT License.
