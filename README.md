# Reader — Presentation App

A screen-share-friendly reading tool for teaching. Paste paragraphs, highlight, annotate words, and present with pro-grade tools.

## Run locally

```bash
npm install
npm run dev
```

## Deploy (GitHub Pages)

1. Build: `npm run build` (outputs to `docs/`)
2. Commit and push `docs/` to `main`
3. Repo **Settings → Pages → Build from branch `main` → folder `/docs`**

Live at: **https://planomy.github.io/reader/**

## Features

### Core
- Multi-passage slides (tabs, rename, add/remove)
- Paste / edit text per passage
- 5-color highlights with semantic labels
- Double-click word → definition / prompt popup
- Vocabulary panel (auto-collected)
- Save to localStorage + named **lesson library**
- Copy text + vocabulary
- Image containers (upload, paste, caption)
- Black / purple / white theme (+ midnight, chalk)

### Present tools
- **Reveal mode** — blur sentences, click to reveal
- **Focus line** — dim all but one sentence
- **Spotlight** — cursor-following dim overlay
- **Laser pointer** — red dot for screen share
- **Pen tool** — draw on the stage (purple ink)
- **Magnifier** — zoom lens under cursor
- **Compare texts** — side-by-side original vs compare
- **Line numbers** — toggle (multi-line text)
- **Answer key mode** — highlights hidden until you reveal
- **Sticky question notes** — draggable prompts
- **Split view** — text left, media right (drag divider)
- **Freeze frame** — lock the screen while you prep
- **Clean view** — hide toolbox
- **Export PNG / PDF**
- Activity timer

## Tips

- Double-click a passage tab to rename it
- Turn on **Answer key mode** before highlighting answers, then toggle **Show answers** live
- Use **Compare** for before/after edits, translations, or two versions
- Save named lessons in the toolbox for reuse across classes
