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
- **Serious surface, playful underneath, and only a little.** The owner finds the site "too serious", but the first playful round (jumping letters, floating previews, tilting cards) was "too fun". The right amount is small: a few interactions that feel **useful and polished**, like a custom cursor that helps you aim, smooth transitions, a menu that's easy to reach. No gimmicks, nothing that wobbles for its own sake. Imagine an actor who keeps a straight face and only now and then lets a wink through.
- **One continuous object.** Pages should feel like scenes of the same play, not separate documents. The same element looks the same everywhere, and moving between pages should feel like continuing, not jumping.

## The visual language

**Color.** Black (`#000`) and white (`#fff`). One grey (`#a3a3a3`) for secondary text and hover. Blue only for links inside running text and the one call to action on the voice page. That's all. Color comes from the photos and videos, never from the interface.

**Type.** One family, TT Firs Neue, in two weights (regular and demibold). Its odd geometric letters (the open `g`, the straight `y`) are the brand, so the type is allowed to be very big. Hierarchy comes from **size and case**, almost never from weight or color.

### Typography system

**One rule: the site's own words are lowercase. Names and running text are written normally.** `assets/css/type.css` puts this in code and is the only place that sets case.

| Kind of text | Case | Examples |
|---|---|---|
| **The site's own words**, at any size: page titles, menus, labels, buttons, link labels (brand names too), the language switch, legal links, messages | lowercase | director, works, demo, биография, voice acting, official russian dubs, download, russian english german, en de ru, telegram, instagram, copied, impressum |
| **Names:** people, works, roles, places | as written | Igor Sergeev, Mary Stuart, Leon Kennedy, Open Relationship, Munich |
| **Running text:** descriptions, bio, credits, the play | normal sentences | A tragicomedy based on documentary materials… |

The logic:
- **Lowercase is the person talking.** The home page set the tone (a name, then a lowercase list), and the whole interface should sound like that voice: relaxed, confident, never shouting. Caps read as an advert or a warning sign.
- **Size, weight and grey make the hierarchy, not case.** With one case everywhere, nothing competes for attention through capitals alone. Section labels are small demibold; legal links are tiny grey.
- **Names are never changed.** A name of a person, work or place inside interface text keeps its capitals ("time in Munich"). Brand names used as link labels are lowercase like any other link ("telegram", "instagram"), because there they work as interface words, not names. Write such mixed text in lowercase in the content and leave it out of the lowercase rule in `type.css`, so the name survives.
- **Running text is normal prose.** Forcing lowercase on sentences makes them harder to read and looks affected.
- New text picks its kind first, then follows the rule. No exceptions for one-off elements.

**Layout.**
- Flush left with a 24 px edge gutter. Things hug the edges and corners, and the middle is often left empty on purpose.
- On desktop, two equal columns: the list on the left, the text on the right. On phones, one column.
- The home page is a single composed screen: name at the top, menu at the bottom, legal links in the corner.
- Navigation is the full-screen home view, opened by a small arrow next to the name. The time and languages live in the menu and on the home page only.
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
| 18 | Remove the jumping letters ("too fun"), the floating picture previews on hover and the tilting cards. | The playful layer turned into gimmicks that compete with the work and make the site feel less grown-up. | Fun has a ceiling. Keep interactions that help (cursor, transitions) and drop ones that are only decoration. |
| 19 | The dot cursor: "I like it", but on links it's hard to aim at small links and tell which one is hovered. Maybe big, getting small on hover. | Playful is fine as long as it never costs usability. | Every playful element must make aiming and reading easier, not harder. |
| 20 | Swap the places of the clock and the language switch. Later: have them only in the menu and on the home page, because they move around when the menu button appears. | Things that jump position between pages feel broken. Secondary info belongs in one stable place. | An element keeps the same place on every page. If it can't, it lives in fewer places. |
| 21 | Outside links: white, underlined, with a small arrow (or a copy icon for the email). | One consistent, readable signal for "this leaves the site" or "this copies", instead of colored text. | Links in text are white and underlined. A small icon says what the link does. Color isn't used for links. |
| 22 | Russian version: «Игорь Сергеев» in Cyrillic; bio title «биография». | Each language version should feel native, not translated on top of English. | Translate names and titles into the reader's script where it's natural. |
| 23 | Headings lowercase like the home page, the same for other large text (contact). Keep names capitalized. Caps can be useful for small elements. "Come up with a style system so we have consistency, logic and understanding." | The home page voice should run through the whole site, and every element should follow a clear rule instead of case-by-case choices. | First version: big lowercase, names as written, small labels in caps. Replaced by #33. |
| 24 | Light mode: the background is "too creamy" (it can be warm, just not obviously). Bio photo has no fade on desktop. Menu items invisible on the black photo. The switch belongs in the menu, as text. | Light mode should be the same design in negative, not a different mood. Every state has to be readable. Controls are words, not symbols. | Tint neutrals only slightly. Check contrast in both modes on every page. Controls are text, in the menu. |
| 25 | Background videos too transparent: raise the opacity and check text contrast on the dark Billy Milligan video. | The videos are part of the work, and should be seen, as long as text stays readable. | Media is as visible as possible while text keeps enough contrast. Check the darkest and brightest media. |
| 26 | Rethink the navigation, ideally the same on all screens. Keep the home/menu layout and bring it into the pages. The hamburger flow is bad: you click in one corner and travel to the other. It should be as easy as hovering a side of the screen and picking a page, and obvious for people who aren't tech-savvy. | Short paths for the hand and the eye. The home layout is loved, the hamburger isn't. Clever must still be obvious. | Put targets near where the user already is. Interactions must explain themselves on first sight. One navigation pattern for all screens. |
| 27 | The remaining animations look buggy: they jitter, are inconsistent, some are missing, some repeat when they shouldn't, and they feel "basic and reused". | Quality over quantity. Unpolished motion is worse than none. | Every animation is smooth and runs once when it should, and the same kind of thing always moves the same way. Test on real devices. Fewer, better, original animations. |
| 28 | Bio photo: fixed like the video backgrounds, higher on desktop (head where the paragraph starts), slightly larger so text overlaps it, with a proper fade (no chopped edge). The photo must not make the page scroll. | Background media is the set, not content. It must never change the page's layout or length, and edges must not show. | Background images are fixed and full-bleed like the videos. Only content makes a page scroll. Fades hide every edge. |
| 29 | Voice player: better player, small volume slider, download styled like the rest of the site, bigger click targets. | A key tool (the demo) should feel finished and be easy to use. | Controls have generous click areas (at least 44 px) and use the site's type styles. |
| 30 | Theater on phones: the description goes under the name and expands like an accordion, pushing the other items down. Film icon next to Iran Conference; replace the watch link with an inline player or a preview that opens a player popup as wide as the content. Sound for videos postponed. | Keep the reader in place: content should open where you tapped, and media should play on the site. | Reveal details in place, next to what was tapped. Keep video on the site instead of sending people away. |
| 31 | Play: only one play for now, so go straight to its text page. Other language links on the other side of the name. Remove the quotes from the play's title screen (they look weird on phones). Chapter numbers centered on phones like on desktop. | No pointless steps. Phone and desktop should look the same. | Skip pages that only hold one item. Keep phone and desktop as similar as possible. |
| 32 | Mobile menu: the language switch sits right against the last menu item, and the clock should be there too. "As few differences between mobile and desktop as possible, while keeping things logical and easy to read and reach." | Spacing is part of quality, and one design for all screens is easier to understand. | Give elements room to breathe. Design once for every screen and only adapt what must change. |
| 33 | Contact links: Telegram and Instagram keep their capitals. Then: "unify the letter case making most things lowercase for now, not names and descriptions". | Caps for small labels felt like a second voice. One case everywhere is calmer and more consistent, while names stay respected. | The typography system became one rule: the site's own words are lowercase, names and running text are written normally. |
| 34 | Photo of the two of them on the play page: stuck to the top like the background videos, fading out on scroll so it's gone by the time the first chapter number is as far from the top as it is from the first paragraph. | Media sets the mood at the start, then gets out of the way of reading. The art director thinks in exact, measurable choreography. | Background media can fade with scroll, tied to a clear content landmark, never a random distance. |
| 35 | Iran Conference: the preview picture and video should be the whole play, not the trailer. | Show the work itself, not marketing for it. | Link to the full work when it exists. |
| 36 | The dot cursor "looks and feels weird", "let's come up with something else". Remove the cursor effect on the contact links. | A custom cursor is a strong gesture. If it's not clearly better than the normal one, it gets in the way. | A replaced cursor must feel natural. When in doubt, keep the system cursor. No effects that pull links around. |
| 37 | Icons next to links are too small: they should feel about the size of the text. If possible, raise the underline to sit closer to the letters (visible on the Telegram link). The email underline was thinner than the others. | Small details must look deliberate and identical across siblings. | Icons are sized to the text they sit next to. Underlines have the same thickness and offset everywhere. |
| 38 | The halo (shadow) around text is too visible, especially in light mode. Light mode backgrounds should be a little more visible, with a ratio similar to dark mode. | Text effects for readability should be invisible. Both modes should be the same design, just inverted. | Readability aids are as subtle as possible. Media visibility should feel the same in both modes. |
| 39 | Animations are "still buggy" (maybe the preview). | Polish is the bar for every motion. | Test every animation on the real site and on a phone before showing it. |
| 40 | Navigation: a corner menu, the same on every screen. The word "menu" sits in the bottom-left corner of every page, and hovering or tapping it raises the home page's links, with the time and the languages. | The hamburger made you click in one corner and then travel to the other. Navigation should feel like the loved home layout and work the same everywhere. | One navigation pattern for all screens, opening where your hand already is. The menu is the home view, and the trigger is a plain word. |
| 41 | The corner menu is "terrible". Back to the full-screen menu, opened by a small arrow next to the home link. Time and languages live in the menu and on the home page. On phones the bottom-left area has two rows (switches above, time and legal below); on desktop it stays at the bottom. | The full-screen home view is the loved part; the new trigger and corner layout weren't. A small, clear trigger next to the name keeps the menu tied to the home page. | Keep what's loved and change only what's broken. The menu is always the full home view. The trigger is small and sits next to the name. |
| 42 | Light mode only on the playwriting reading page: a "switch to light/dark" text switch appears bottom-left once you scroll to where the photo has faded out, disappears after one more screen of scrolling, and the site goes back to black on any other page. The menu stays black. On phones, a soft, not fully opaque dark corner behind the switch. | Light mode is a reading tool for the long play text, not a second identity for the site. It should show up exactly when reading starts and then step aside. | Black is the site. Light is only a reading aid on the play page. Utilities appear at the moment they're useful and then leave. Backdrops behind floating controls are soft and barely noticeable. |
| 43 | Make the cursor effect a little more noticeable. | The new cursor is right but too timid to register. | Subtle, but it must be noticeable. If an effect can't be seen, it isn't worth having. |
| 44 | Link underlines: "I liked how it was broken by the letters". Return to that. | The underline that skips descenders feels typographic and crafted, like print. A solid line through the letters feels mechanical. | Underlines skip the descenders (the browser default `text-decoration-skip-ink`). Don't override it. |
| 45 | Legal links are too high: they belong at the very bottom of the viewport, but not fixed. | Fine print sits at the floor of the page, out of the way. | Footer at the bottom of the screen on short pages and after the content on long ones. Never floating. |
| 46 | Iran Conference: undo the full-play link because it asks for money. Trailer and link are fine. Pause the background video and fade it out while the popup is open. | Never send visitors into a paywall. While something plays, nothing else should move behind it. | Link only to freely viewable media. When a player opens, stop and hide the background. |
| 47 | The link in "for voiceover bookings…" should look like the other outside links. Telegram, Instagram and the "copied" message all lowercase. | One link style and one case for everything the site says. This overrides the earlier choice to keep the brand capitals (#33). | Every link looks the same. Link labels and messages are lowercase, brand names included. |
| 48 | Move the demo download link to the demo heading's line, on the right, and the volume to the right. | A tool belongs next to the thing it acts on, and the player row should stay clean. | Actions sit on their item's title line, on the right. Controls align to the edges. |
| 49 | Less space between the demo and the roles, especially on phones, but they should still feel like separate sections. | Big gaps read as the end of the page. | Separate sections with the smallest gap that still reads as a break, and keep it tighter on phones. |
| 50 | The legal pages still had the old link styles. | One link style everywhere, including pages nobody designs for. | A style change reaches every page, legal ones included (see #21). |
| 51 | Remove the normal cursor and keep only the flashlight, a bit brighter. Over links it becomes a focused ray of light, with its point in the middle and the tail going up. | The stage metaphor taken all the way: the light itself is the pointer, and focusing it says "clickable", like a follow spot picking out an actor. | A replaced cursor must still aim precisely (a small bright centre, and the ray's point is the hotspot). It gives way to the normal arrow on touch screens and over video players. |

## Do and don't

**Do**
- Read `tokens.css` and use the tokens. Add a token before adding a new value.
- Keep the black stage, white type and the one grey.
- Let type be the hero. Big, flush left, lots of black around it.
- Reuse existing components and patterns (the home view, the list plus detail split, the dimmed full-bleed media).
- Make it feel alive through motion and response, but in small doses and polished: smooth, consistent, never jittery or repeating.
- For any new text, decide whether it's the site's own words (lowercase), a name, or running text (as written), and follow `type.css`.
- Keep layouts and controls the same on phone and desktop wherever it stays easy to read and reach.
- Keep the home page to one screen, and keep every overlay easy to close.
- Check every visual change on a phone (390 px) and a desktop (1440 px) and compare it with the live site.
- Respect "reduce motion" and keyboard focus.

**Don't**
- Add new colors, fonts or font weights.
- Add boxes, card borders, drop shadows, gradients, rounded corners, emoji or decorative icons where a word works. Small functional icons next to a word are fine (an arrow on an outside link, a copy icon on the email).
- Add gimmicks: jumping letters, floating hover previews, tilting cards were all "too fun" and were removed.
- Use UPPERCASE anywhere, or lowercase a name or a sentence.
- Center layouts. The play text is the only exception, because it's a printed page.
- Duplicate a control. When adding a new way, remove the old one.
- Autoplay sound, or open the mail app or other apps without asking.
- Use a third-party script, embed or font that is known to be blocked or slowed down in Russia (for example anything served through Cloudflare). Outside services are fine otherwise. Check for reports of blocking first (see `CLAUDE.md`).
- Make legal links prominent, or remove them.
- Change the look of an element in one place only. Change it everywhere, or not at all.

## Open questions

These need the art director's call. Update this section when they answer.

- **Blue:** #21 makes links white and underlined, so the blue may only survive in the voice page's "contact" call to action. Drop it entirely?
