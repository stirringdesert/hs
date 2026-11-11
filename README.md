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

## Design system

- **Tokens** (`assets/css/tokens.css`): every color, font size, line height, gutter and animation value. Phone and tablet sizes are set there too, in two media blocks at the bottom. Components use only `var(--...)` tokens for colors and type.
- **Components** (`build/components.mjs`): `layout`, `header`, `footer`, `pageTitle`, `label`, `workList` (production list with summary), `split` + `detail` (two-column layout), `bgVideo`, `player`, `workCard` / `workGrid`. Each page is assembled from these.
- **Style guide** (`/styleguide/`, built from `build/styleguide.mjs`): shows all of the above live, so design changes can be checked on one page.

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
