// The /styleguide/ page: every color, text style and building block on one screen,
// rendered with the same components as the real pages.

import { escapeHtml as esc } from './lib.mjs';

const colors = [
  ['--color-bg', 'Background'],
  ['--color-fg', 'Text'],
  ['--color-muted', 'Muted text, hover'],
  ['--color-link', 'Links in text'],
  ['--color-accent', 'Call-to-action links'],
  ['--color-placeholder', 'Image placeholder'],
];

const type = [
  ['Display', 'home-name', 'font-size:var(--type-display);line-height:var(--type-display-lh);letter-spacing:var(--type-display-tracking)', '--type-display', 'Igor Sergeev'],
  ['Page title', '', '', '.page-title', 'Director'],
  ['Contact link', '', 'font-size:var(--type-contact);line-height:var(--type-contact-lh)', '--type-contact', 'Telegram'],
  ['Player time', '', 'font-size:var(--type-time);line-height:var(--type-time-lh)', '--type-time', '1:24'],
  ['Production list', '', 'font-size:var(--type-list);line-height:var(--type-list-lh)', '--type-list', 'Iran Conference'],
  ['Heading', '', 'font-size:var(--type-heading);line-height:var(--type-heading-lh)', '--type-heading', 'Leon Kennedy'],
  ['Menu', '', 'font-size:var(--type-nav);line-height:var(--type-nav-lh);letter-spacing:var(--type-nav-tracking)', '--type-nav', 'voice acting'],
  ['Body', '', '', '--type-body', 'Igor Sergeev is a playwright, director, actor and voice actor based in Munich.'],
  ['Label', '', '', '.label', 'Officail russian dubs'],
  ['Caption', '', 'font-size:var(--type-caption)', '--type-caption', 'DOWNLOAD'],
  ['Small', '', 'font-size:var(--type-small);line-height:var(--type-small-lh)', '--type-small', 'Impressum'],
];

export function styleguide(site, C) {
  const sampleItems = [
    { slug: 'a', url: '#', title: 'Sasha, Why?', summaryHtml: [] },
    { slug: 'b', url: '#', title: 'Iran Conference', summaryHtml: ['Premiered on Nov 22, 2019', 'Nomination for the Golden Mask Award 2021'] },
    { slug: 'c', url: '#', title: 'Mary Stuart', summaryHtml: [] },
  ];
  const sampleRoles = [
    { character: 'Leon Kennedy', title: 'Resident Evil 4 Remake', image: '/assets/img/voice/leon-kennedy.jpg' },
    { character: 'Jon Snow', title: 'Game of Thrones', image: '/assets/img/voice/jon-snow.jpg' },
  ];

  const section = (title, body) => `<section class="sg-section">
  <h2 class="label">${esc(title)}</h2>
${C.indent(body, 2)}
</section>`;
  const row = (name, code, demo) => `<div class="sg-row"><div>${esc(name)}<code>${esc(code)}</code></div><div>${demo}</div></div>`;

  const main = [
    `<div class="sg-intro">
  ${C.pageTitle('Style guide')}
  <p>Every color, text style and building block used on harrysergeev.com. Colors and sizes live in /assets/css/tokens.css. The blocks are in build/components.mjs. This page is not linked from the menu and is hidden from search engines.</p>
</div>`,
    section('Colors', `<div class="sg-swatches">
${colors.map(([v, n]) => `  <div class="sg-swatch"><i style="background:var(${v})"></i>${esc(n)}<code>${v}</code></div>`).join('\n')}
</div>`),
    section('Type', type.map(([name, cls, style, code, text]) => {
      const isClass = code.startsWith('.');
      const tag = isClass ? `<div class="${code.slice(1)}">${esc(text)}</div>` : `<div${style ? ` style="${style}"` : ''}>${esc(text)}</div>`;
      return row(name, code, tag);
    }).join('\n')),
    section('Links', [
      row('Text link', '.link', '<a class="link" href="#">Watch on Vimeo</a>'),
      row('Call to action', '.accent', '<span class="label">for voiceover bookings and inquiries, please <a class="accent" href="#">contact</a></span>'),
    ].join('\n')),
    section('Header and menu', `<div class="sg-demo">\n${C.header(site).replace('id="menu"', 'id="sg-menu"').replace('aria-controls="menu"', 'aria-controls="sg-menu"')}\n</div>`),
    section('Production list and text (theater, playwriting)', `<div class="sg-demo">\n${C.split(C.workList(sampleItems, 'b'), C.detail(['<p><a class="link" href="#">Watch on Vimeo</a></p>', '<p>Production: Takoy Theatre, Saint Petersburg</p>', '<p>Directed by Igor Sergeev and Vladimir Kuznetsov</p>']))}\n</div>`),
    section('Voice role cards', `<div class="sg-demo">\n${C.workGrid(sampleRoles)}\n</div>`),
    section('Audio player', `<div class="sg-demo">\n${C.player('/assets/media/demo.wav')}\n</div>`),
    section('Footer', `<div class="sg-demo">\n${C.footer(site)}\n</div>`),
  ].join('\n\n');

  return C.layout(site, {
    path: '/styleguide/', title: 'Style guide', bodyClass: 'sg', noindex: true,
    extraCss: ['/assets/css/styleguide.css'], main,
  });
}
