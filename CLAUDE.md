# Working on this site

This repository is the source of a personal portfolio website (the domain is in `CNAME`). The person talking to you is most likely the site owner, the person the site is about, or their partner, who also edits it. Neither is a developer. Answer in the language they write in (often Russian), in plain, friendly language, keep replies short, and never ask them to run commands or edit files themselves.

The technical details (where every piece of content lives, how to add a production or a voice role, the design system) are in `README.md`. Read it before your first change.

Before any visual decision (layout, type, color, motion, a new block), read `DESIGN-PHILOSOPHY.md`: it explains how the site should feel and the reasons behind past design feedback. When the person says what they like or dislike, or asks for a visual change, work out why and add it to that file's feedback log in the same pull request.

## How a change goes live

1. Start from the latest `main` (`git pull origin main`). Other people edit this site too.
2. Make the change on a new branch.
3. Run `node build/build.mjs`. It rebuilds every page and stops with a clear message if something is wrong. Fix what it reports. Commit the content change together with the rebuilt pages.
4. Open a pull request to `main` with a one-line plain-language summary of what changes on the site.
5. Tell the person what you changed, in words they understand. Don't talk about branches, commits, or pull requests: they don't know git. Say every time whether the change is **live** (on harrysergeev.com) or **in preview** (on preview.harrysergeev.com, waiting for "publish" / "опубликуй" / "выложи"). When to publish without waiting is in "Two editors" below. To publish, merge the pull request yourself.
6. After the merge, the site updates in one or two minutes (the "Deploy to GitHub Pages" action). If they say it hasn't changed, check that the action finished, then suggest a hard refresh.

Keep each pull request to one request, so a change can be undone on its own. If they ask to undo a published change ("верни как было"), revert that pull request the same way and publish the revert.

## Two editors

Two people edit this site, each with their own Claude project. Who is who and what each prefers is in `team/people.md`. Read it at the start of a session, and follow the preferences of the person you are talking to.

**Live and preview.** Live is `main`, deployed to the real site. The preview is a second, password-protected website (preview.harrysergeev.com) that the "Update preview site" action rebuilds by itself about two minutes after anything changes: it always shows the live site plus every open pull request from this repository. Nobody builds or uploads previews by hand. A draft pull request is left out of the preview, and one that clashes with another change is listed as "not shown yet" in the yellow preview tag; fix the clash on that branch (merge `main` or the other change into it). Before you start a change, update from the latest `main` so you build on the live version.

**Publishing.**
- Each person publishes only their own changes (pull requests their Claude opened). Never merge the other person's pull request.
- Fixes, small changes and content (text, a new production, a new voice role, photos) are published right away, after checking.
- Bigger visual changes or redesigns go to the preview first and wait for "publish".
- If the owner wants to publish something drastic (removing or restructuring a page, a new look), first ask whether they want to check with the art director. If yes, open an inbox issue (below) and keep the change in preview.

**Inbox for the art director.** GitHub issues with the label `inbox`, assigned to the art director (`team/people.md`). The owner never deals with bugs or technical problems. Open an issue, without asking the owner for details first, when:
- something looks or behaves wrong and you can't find or fix the cause, even if no error shows (offer this to the owner whenever they describe something odd);
- the owner chose to check a drastic change with the art director;
- the owner changes how the projects work (see below).
Write the issue in English: what the owner said (quote it), which page, what you checked, the link to the pull request if there is one. Then tell the owner in one line that it's passed on. The art director's Claude reads open `inbox` issues at the start of each session and asks what to do.

**Rules and preferences.** Shared rules live in this file, so both projects follow the same ones. A personal preference ("stop asking me about X") goes into that person's section of `team/people.md` and applies right away. A change to how things work for both (publishing, preview, inbox, this file) is proposed in an `inbox` issue, and only changed here once the other person agrees.

**Session log.** At the end of a longer session (several changes, or a decision about how things work), add a short entry to `team/log.md`: date, who, what changed on the site and why, anything left open. Not after every small change. At the start of a session, read the entries since your own last one, so you know what the other person did.

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
