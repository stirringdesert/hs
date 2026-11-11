# Working on this site

This repository is the source of a personal portfolio website (the domain is in `CNAME`). The person talking to you is most likely the site owner, the person the site is about, or their partner, who also edits it. Neither is a developer. Answer in the language they write in (often Russian), in plain, friendly language, keep replies short, and never ask them to run commands or edit files themselves.

The technical details (where every piece of content lives, how to add a production or a voice role, the design system) are in `README.md`. Read it before your first change.

Before any visual decision (layout, type, color, motion, a new block), read `DESIGN-PHILOSOPHY.md`: it explains how the site should feel and the reasons behind past design feedback. When the person says what they like or dislike, or asks for a visual change, work out why and add it to that file's feedback log in the same pull request.

## How a change goes live

1. Start from the latest `main` (`git pull origin main`). Other people edit this site too.
2. Make the change on a new branch.
3. Run `node build/build.mjs`. It rebuilds every page and stops with a clear message if something is wrong. Fix what it reports. Commit the content change together with the rebuilt pages.
4. Open a pull request to `main` with a one-line plain-language summary of what changes on the site.
5. Tell the person what you changed, in words they understand. Don't talk about branches, commits, or pull requests: they don't know git. Nothing is live until they say to publish ("опубликуй", "publish", "выложи"). Then merge the pull request yourself.
6. After the merge, the site updates in one or two minutes (the "Deploy to GitHub Pages" action). If they say it hasn't changed, check that the action finished, then suggest a hard refresh.

Keep each pull request to one request, so a change can be undone on its own. If they ask to undo a published change ("верни как было"), revert that pull request the same way and publish the revert.

## Rules

- Edit the source, never the generated pages. Text and lists live in `content/`, colors and sizes in `assets/css/tokens.css`, page blocks in `build/components.mjs`, styles in `assets/css/style.css`. Every generated `index.html` says at the top that it is generated, and the next build overwrites hand edits.
- Show, don't describe: when you change the look, say which page to open to see it, and where. The `/styleguide/` page shows every color, text style and block on one page.
- Fonts: the font files are paid and must never be committed unencrypted. Only `assets/fonts/*.woff2.enc` is in the repo (plain `.woff2` is gitignored), and the deploy decrypts them with the `FONT_KEY` secret. The build works without the fonts; pages just fall back to a system font when previewed locally. Never print, guess, or ask for the key.
- This repository is public. Don't add personal details beyond what the site already shows: no private phone numbers, home addresses, passwords, keys, or notes about private matters. Don't add the owner's name or the domain to the repository description, topics, or README.
- Keep `impressum` and `datenschutzerklaerung` reachable from every page. German law requires them. Changes to their wording should be checked by the owner.
- The site must keep loading in Russia. Don't move hosting or add a CDN without asking first. Third-party scripts, fonts and embeds are fine, unless there are reports that the service is blocked or slowed down in Russia (for example anything served through Cloudflare). Check before adding one.
- Videos and images go in `assets/`. Keep videos as H.264 `.mp4` (HEVC doesn't play in every browser) and reasonably small; GitHub refuses files over 100 MB.
- Don't change `.github/workflows/`, `CNAME`, or repository settings unless the person asks for exactly that.

## When you're unsure

If a request could mean two things, make the most likely version, then say what you chose and offer the other. If something would be hard to undo (deleting a page, removing a production, changing the domain or hosting), ask first.
