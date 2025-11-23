# TierMaker

Simple Vue 3 + Vite tier list builder with drag & drop, IGDB / Google Books search via an Express proxy, local persistence and PNG export.

## Features

- Custom tiers (add, rename, recolor) with native drag & drop between rows
- Local image upload (picker + drag-in) with live previews
- IGDB game search and Google Books search (others ready for extension)
- LocalStorage persistence plus one-click export powered by `html2canvas`

## Getting Started

```bash
git clone <your-repo-url>
cd tierboard
npm install
cp .env.example .env   # add IGDB & Google Books credentials
```

### Scripts

| Command           | Description                               |
| ----------------- | ----------------------------------------- |
| `npm run dev`     | Run Vite UI + proxy together              |
| `npm run dev:client` | Vite UI only                           |
| `npm run dev:server` | Proxy only (Express)                   |
| `npm run build`   | Build frontend into `dist/`               |
| `npm run preview` | Preview build with Vite                   |
| `npm start`       | Production proxy serving `/api/*` + dist  |

Development entry: http://localhost:5173

## Structure

```
tierboard/
├── proxy_server.js
├── src/
│   ├── App.vue
│   ├── main.js
│   └── assets/base.css
├── vite.config.js
├── package.json
└── README.md
```

## API Proxy

- `POST /api/igdb/games` → IGDB search with auto token handling
- `POST /api/google/books` → Google Books passthrough + normalization

Configure secrets in `.env`; the sample file is ignored by Git.

## License

MIT
