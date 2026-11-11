# Design philosophy

The site's visual taste: what it is for, how it should feel, and the reasons behind past feedback. **Read this before any visual decision.** `assets/css/tokens.css` and `/styleguide/` describe *what* the design is. This file explains *why*, so a new decision fits the old ones.

It is a living document. Each time the art director (the owner's partner, who gives most of the design feedback) says what they like or dislike, or asks for a visual change, work out the reason behind it and add it to the [feedback log](#what-the-feedback-taught-us). If the reason is a guess, mark it *(guess)* until it's confirmed.

---

## What the site is for

A portfolio for one person who works as a **voice actor, theater director and playwright**. He is Russian-born and lives in Munich. The people who visit are:

- dubbing and casting studios (mostly Russian-speaking), who want to **hear the demo** and see well-known roles;
- theaters and festivals (mostly German), who want to **see productions**;
- readers and directors, who want to **read the play** in Russian, English or German;
- anyone who needs to **get in touch**.

The site should let each of them get there in one or two clicks. Everything else is atmosphere.

## The feeling

**A dark stage before the lights come up.** The black background is the theater. Content appears on it like a performer in a spotlight: big name, a few words, a dimmed video playing behind the text like a set.

- **Confident and quiet.** The name and the page titles are huge, and the rest is a lot of empty black. Type at poster size does the job other portfolios give to photos.
- **Personal, not corporate.** Lowercase menu ("bio", "voice acting"), the "Time in Munich" clock, a play about his own life. It reads like a person, not an agency.
- **Serious surface, playful underneath.** The owner finds the current site "too serious" and wants it more fun and interactive. The fun should come from **how things move and respond** (motion, hover, sound, small surprises), not from more colors, ornaments or clutter. Imagine an actor who keeps a straight face and then winks.
- **One continuous object.** Pages should feel like scenes of the same play, not separate documents. The same element looks the same everywhere, and moving between pages should feel like continuing, not jumping.

## The visual language

**Color.** Black (`#000`) and white (`#fff`). One grey (`#a3a3a3`) for secondary text and hover. Blue only for links inside running text and the one call to action on the voice page. That's all. Color comes from the photos and videos, never from the interface.

**Type.** One family, TT Firs Neue, in two weights (regular and demibold). Its odd geometric letters (the open `g`, the straight `y`) are the brand, so the type is allowed to be very big. Hierarchy comes from **size and case**, almost never from weight or color.

| Role | Look | Example |
|---|---|---|
| Display | huge, regular, lowercase menu | home page name and menu |
| Page title | big, UPPERCASE | DIRECTOR, AUTHOR, WORKS, DEMO |
| List / heading | medium, Title Case | production names, role names |
| Body | regular, comfortable size | descriptions |
| Label / action | small, UPPERCASE (labels in demibold) | DOWNLOAD, RUSSIAN, E-MAIL |
| Legal / meta | tiny, grey | Impressum, clock |

Case carries meaning: **lowercase is the person talking** (navigation), **UPPERCASE is a sign on the wall** (titles, labels, actions).

**Layout.**
- Flush left with a 24 px edge gutter. Things hug the edges and corners, and the middle is often left empty on purpose.
- On desktop, two equal columns: the list on the left, the text on the right. On phones, one column.
- The home page is a single composed screen: name at the top, menu at the bottom, legal links in the corner.
- Lines: a single 2 px white rule under the selected item. No boxes, card borders, shadows, gradients or rounded corners.
- Text sizes grow and shrink smoothly with the screen (CSS `clamp()`), never in jumps.

**Images and video.** Full-bleed, dimmed to about 50%, fading in slowly (3 s), behind the text like stage projections. Crop with intent: the bio portrait is about the face. Every new media type (the photo on the play page, sound) gets this same treatment rather than a new one.

**Motion.** Slow fades and soft ease-out (quick start, gentle landing). The name stays put or morphs between pages, so you never lose your place. Hover means white turns grey, and nothing shifts the layout. Everything respects "reduce motion".

## What the feedback taught us

Each entry: what was said → the likely reason → the rule that follows.

| # | Feedback | Why (the intention) | Rule |
|---|---|---|---|
| 1 | Rebuild the site to look exactly like the Framer version. Later: "you used a tablet or mobile breakpoint" on desktop. | The Framer design is the approved baseline, and the art director notices size differences at a glance. | Start from the existing look. Every change should be deliberate, never drift. Check desktop at a real desktop width (1440 px), not only on a phone. |
| 2 | The home page should be full screen with no scrolling. | The home page is a poster or title card: one framed composition. Scrolling breaks the frame. | The home page fits one screen at every size. Don't add content to it that would make it scroll. |
| 3 | The mobile menu had no close button. | Never trap the visitor. | Every overlay has an obvious way out. |
| 4 | The email link should copy the address instead of being a `mailto:` link. | Spam protection, and less friction: `mailto` opens a mail app many people don't use. | Prefer quiet, low-friction actions that don't throw the visitor into another app. Protect personal data. |
| 5 | Read links renamed to just "Russian / English / German", on one line, **spread evenly with gaps**, underlined; a new staged reading added "in the same style". | Calm order: short labels, equal spacing, one pattern for things of the same kind. | Use the shortest label that works. Space sibling items evenly. New content copies the style of its siblings instead of getting its own. |
| 6 | Reading pages: "nothing changes except" the play appears below and the links turn into one Download PDF button. Old download buttons removed ("obv"). | Continuity: moving deeper should feel like the same page opening up, not a new place. And no duplicates. | Change as little as possible between related states. One way to do each thing, so remove the old way when adding a new one. |
| 7 | Download PDF: at the top on phones (with a gap); on desktop fixed at the side until the last line of the first chapter, then scrolls away, and appears again at the very end. | Tools should be there exactly when needed and step aside when not. The art director thinks in precise choreography. | Utility elements appear at the right moment and then get out of the way. Follow precise placement instructions literally. |
| 8 | The mobile menu should open to **exactly** the home page view, with the name the same size, "so it looks uniform". Test the same menu on desktop. | The site is one object: the menu *is* the home page. Inconsistent sizes of the same element feel careless. | Reuse, don't redesign. The same element has the same size and position everywhere. |
| 9 | Text should scale smoothly instead of jumping to preset sizes. | Craft. The design should look intentional at any width, not only at three breakpoints. | Type uses fluid sizes. Don't add breakpoint jumps for font sizes. |
| 10 | Make Impressum and Datenschutz less noticeable, but still legal. | Required but boring things must not compete with the work. | Mandatory items get quieter (small, grey, in the corner), never removed. |
| 11 | About page on phones: photo starts off-screen, text overlaps it, focus on the face, and it shouldn't fill the whole screen. | Editorial layering like a poster or magazine. The face is the emotional anchor, but the text matters too. | Let text and image overlap. Crop to the subject. Images support the text and don't take over the screen. |
| 12 | The owner "likes things more fun and interactive, right now it's too serious". | The owner is an actor and a playful person, and the site should show that. | Add play through interaction and motion. Keep the black and white calm and the content readable. *(guess: fun should never get in the way of the demo, the play or contact)* |
| 13 | Page transitions. Sound for background videos. | A continuous, theatrical experience: scenes, not page loads. | Transitions keep the name and header in place. Sound is opt-in, never autoplay. |
| 14 | Light mode as a test, "not sure if will use". | Curious, but black is the identity. | Dark is the default and the identity. Light mode is an experiment until it's confirmed. |
| 15 | First-visit language picker: "just a minimal choice on black" (en, de, ru). | Even a utility screen is part of the stage. The first impression is black and type. | Utility screens use the same big type on black. No flags, boxes or dropdowns. |
| 16 | Photo of the two of them on the play page "in the same style as the videos". Voice roles (later) should open to show info and a short clip. | One consistent treatment for media. Details are revealed on interaction instead of shown all at once. | New media copies the dimmed full-bleed video style. Show the surface first and let curiosity open the details. |
| 17 | Outside scripts and embeds are fine "as long as there's no information on their unavailability in Russia". | Russian visitors matter, but the site shouldn't give up useful tools out of caution alone. | Before adding an outside service, check whether it's reported blocked or slowed down in Russia. Use it if it isn't. |

## Do and don't

**Do**
- Read `tokens.css` and use the tokens. Add a token before adding a new value.
- Keep the black stage, white type and the one grey.
- Let type be the hero. Big, flush left, lots of black around it.
- Reuse existing components and patterns (the home view, the list plus detail split, the dimmed full-bleed media).
- Make it feel alive through motion and response: hover, transitions, small surprises.
- Keep the home page to one screen, and keep every overlay easy to close.
- Check every visual change on a phone (390 px) and a desktop (1440 px) and compare it with the live site.
- Respect "reduce motion" and keyboard focus.

**Don't**
- Add new colors, fonts or font weights.
- Add boxes, card borders, drop shadows, gradients, rounded corners, emoji or decorative icons where a word works. (The playful layer's rounded preview and pill-shaped sound button are being tested and still need a decision, see below.)
- Center layouts. The play text is the only exception, because it's a printed page.
- Duplicate a control. When adding a new way, remove the old one.
- Autoplay sound, or open the mail app or other apps without asking.
- Use a third-party script, embed or font that is known to be blocked or slowed down in Russia (for example anything served through Cloudflare). Outside services are fine otherwise. Check for reports of blocking first (see `CLAUDE.md`).
- Make legal links prominent, or remove them.
- Change the look of an element in one place only. Change it everywhere, or not at all.

## Open questions

These need the art director's call. Update this section when they answer.

- **Desktop menu:** the same full-screen menu as on phones, or the old row of links in the header? (`menu_desktop` in `content/site.json`, tested in the navigation PR.)
- **Light mode:** keep it or drop it?
- **How much play:** is the custom dot cursor too much? Are the jumping letters and tilting cards right?
- **Rounded shapes:** the hover previews have rounded corners and the sound button is a pill, while the rest of the site is square. Square them up, or let the playful layer have softer shapes?
- **Two blues** (`--color-link` and `--color-accent`) came over from Framer. Merge them into one?
