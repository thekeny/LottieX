# LottieX website

Лендинг LottieX на React, TypeScript, Tailwind CSS и Vite.

## Команды

```sh
npm install
npm run dev
npm run build
npm run preview
npm run lint
```

`npm run build` сначала проверяет типы (`tsc -b`), затем собирает `dist/`.

## Структура

- `src/components/` — секции лендинга и общие элементы интерфейса.
- `src/config/` — типы, ссылки, изображения и тексты.
- `src/hooks/` — счётчик звёзд GitHub и вступительная анимация.
- `src/context/` — контекст тостов.
- `src/lib/` — утилиты для классов и буфера обмена.
- `public/` — оригинальные `logo.png` и `icon.png`.

Кнопка GitHub запрашивает `api.github.com/repos/thekeny/LottieX` и показывает актуальное число звёзд рядом с подписью. Значение кэшируется в `localStorage` на 10 минут, поэтому счётчик остаётся видимым, даже если API временно недоступен или упёрся в лимит запросов.
