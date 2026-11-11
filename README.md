# harrysergeev.com

Static portfolio site of Igor (Harry) Sergeev, moved off Framer. The pages are plain HTML, built from simple content files by a small script with no dependencies.

## How editing works

1. Change a file in `content/` (text, productions, voice roles) or `assets/css/tokens.css` (colors, fonts, sizes).
2. Run `node build/build.mjs`. It rebuilds every page and stops with a clear message if something is wrong, such as a missing image or video. `node build/build.mjs --check` only checks.
3. Publish the site folder as usual.

Don't edit the generated `index.html` pages by hand. The next build overwrites them. Each one starts with a comment that says so.

### Where things live

| What | File |
|---|---|
| Name, menu, footer links, contact links, default page description | `content/site.json` |
| Bio text and photo | `content/bio.md` |
| Demo audio, voice roles (order = order on the page), audiobooks text | `content/voice.json` |
| Theater productions, one file per production | `content/theater/<slug>.md` |
| Plays, one file per play | `content/playwriting/<slug>.md` |
| Impressum, Datenschutzerklärung, Russian play text (free-form HTML) | `content/pages/<slug>.html` |
| Colors, font sizes, spacing, animation timing | `assets/css/tokens.css` |
| Page building blocks (header, lists, cards, player...) | `build/components.mjs` |
| Component and page styles | `assets/css/style.css` |
| Style guide page (every color, text style and block) | `/styleguide/` (generated, not linked, `noindex`) |

### Adding a production

Create `content/theater/my-play.md`. The file name becomes the URL (`/theater/my-play/`).

```
---
title: My Play
order: 2
video: /assets/media/my-play.mp4
summary:
  - Premiered on May 1, 2026
  - Some festival or award
---
[Watch on Vimeo](https://vimeo.com/...)

Paragraph of description. Blank lines separate paragraphs.

Cast: ...
```

- `order` sets the position in the list. `video` is optional (the background video). Add `sound: true` only if the video file has an audio track: a "Sound" button then appears so visitors can unmute it. Instead of a video, a page can have a background photo: `image: /assets/img/...` (plus `image_alt:`), shown in the same dimmed full-screen style with a slow drift. Add `hidden: true` to take a production off the site without deleting it.
- Text supports `[link text](url)`, `**bold**`, `*italic*`. A single line break inside a paragraph becomes a line break.
- Deleting a content file removes its page on the next build.

### Adding a voice role

Put the image in `assets/img/voice/` and add an entry to `roles` in `content/voice.json`:

```
{ "character": "Jon Snow", "title": "Game of Thrones", "image": "/assets/img/voice/jon-snow.jpg" }
```

## Languages

The site is in English (at the root), German (`/de/`) and Russian (`/ru/`). The list is `languages` in `content/site.json`; the first one lives at the root.

- Every text file can have a translation next to it, named with the language code: `bio.de.md`, `voice.ru.json`, `theater/bumerit.de.md`, `site.ru.json` (menu, page names, small labels).
- A translation only needs what changes. In `.md` files, front matter fields replace the English ones and the text replaces the English text. In `voice.<lang>.json`, `roles` lists only translated fields, keyed by the English character name.
- If a translation file is missing, that page shows the English text and the build lists what is untranslated.
- Site links in text (like `[contact](/contact/)`) automatically point to the same language.
- On the first visit to the home page, a full-screen picker (en / de / ru) asks for a language. The choice is remembered in the browser, and the EN / DE / RU switch in the corner changes it.
- Impressum and Datenschutzerklärung exist only in German. The play reading pages (`/open-relationship-en|de|ru/`) are linked to each other by the language switch.

## Design system

- **Tokens** (`assets/css/tokens.css`): every color, font size, line height, gutter and animation value. Phone and tablet sizes are set there too, in two media blocks at the bottom. Components use only `var(--...)` tokens for colors and type.
- **Components** (`build/components.mjs`): `layout`, `header`, `footer`, `pageTitle`, `label`, `workList` (production list with summary), `split` + `detail` (two-column layout), `bgVideo`, `player`, `workCard` / `workGrid`. Each page is assembled from these.
- **Style guide** (`/styleguide/`, built from `build/styleguide.mjs`): shows all of the above live, so design changes can be checked on one page.

## Previewing changes before they go live

Design changes are checked in a private claude.ai Artifact, "Site preview", before they are merged to `main`:
https://claude.ai/artifact/TDSeaW3f6Bqcbctk2LQd5P

1. Make the change on a branch and run `node tools/preview.mjs --key-file <font key file>` (or set `FONT_KEY`). It builds the site, decrypts the fonts, and writes a copy with relative links to `_preview/` (git-ignored), plus `_preview/files.json`.
2. Publish `_preview/index.html` to the Site preview URL with the Artifact tool, passing `files.json` as `files`. After the first publish, files you leave out are kept, so for most changes `node tools/preview.mjs --pages-only` and publishing only the HTML/CSS/JS is enough.
3. Look at it (desktop and phone), ask for tweaks, repeat. When it looks right, merge the PR and `main` deploys the live site.

The preview is private: only people it is shared with (from the page's Share menu) can open it.

## Playful layer and light mode

`assets/css/fun.css` and `assets/js/fun.js` add the interactive extras: a dot cursor that grows over links, floating video/photo previews when hovering menu items and productions (the map is built from the content files), letters that jump on the big titles, tilting voice cards, contact links that drift toward the cursor, the background-video sound button and a test light mode (round button bottom-left, or `?theme=light` / `?theme=dark` in any URL; remembered per browser). Everything respects the system "reduce motion" setting, and the cursor/previews only run with a mouse. Removing the two files turns all of it off.

## Publishing

Every push to `main` deploys the site to GitHub Pages (`.github/workflows/pages.yml`). The workflow decrypts the fonts, runs the build, and publishes everything except `.git`, `.github`, `tools/`, `build/`, `content/` and `README.md`.

### Fonts

TT Firs Neue is a paid font, and this repository is public. So the font files are not committed: only encrypted copies (`assets/fonts/*.woff2.enc`) are. The workflow decrypts them with the `FONT_KEY` Actions secret. Note that, like every web font, the fonts can still be downloaded from the live site itself; this only keeps them out of the repository.

To change a font, encrypt the new `.woff2` with the same key:

```
openssl enc -aes-256-cbc -pbkdf2 -iter 200000 -salt -in font.woff2 -out assets/fonts/font.woff2.enc -pass pass:$FONT_KEY
```

## Assets

All images, audio, fonts and videos are in `assets/` (downloaded from the old Framer site with `tools/fetch-assets.sh`). The production background videos were converted from HEVC to H.264 so they play in every browser.

`open-relationship-ru/` holds the full Russian text of the play (the READ RU link), copied from the Framer page.

## Hosting

GitHub Pages (served through Fastly, which is not throttled in Russia like Cloudflare). Without a custom domain the site lives at https://stirringdesert.github.io/hs/; the workflow adds the `/hs` prefix to links automatically, and drops it once harrysergeev.com is connected.
