# LottieX website

The LottieX landing page uses React, TypeScript, Tailwind CSS and Vite. Use the language dropdown in the navigation bar to switch between Russian and English. The site saves your choice in the browser.

## Commands

```sh
npm install
npm run dev
npm run build
npm run preview
npm run lint
```

`npm run build` checks types with `tsc -b` and then builds the site into `dist/`.

## Structure

- `src/components/` contains the landing page sections and shared UI components.
- `src/config/` contains types, links, images and translated copy.
- `src/hooks/` contains the GitHub star counter, entrance animation and scroll effects.
- `src/lib/` contains utilities for CSS classes and clipboard access.
- `public/` contains the original `logo.png` and `icon.png`, along with the site's other media.

The GitHub button fetches the current star count from `api.github.com/repos/thekeny/LottieX` and displays it next to its label. The site caches the count in `localStorage` for 10 minutes so it can display a saved count if the API is unavailable or rate-limited.
