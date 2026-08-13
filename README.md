# PhaseParadise — landing page

A single-page site. Plain HTML, CSS and JavaScript — no framework, no build step.
Open `index.html` in a browser, or serve the folder with any static server.

```
index.html      structure and copy
styles.css      the whole visual system
script.js       scroll behaviour (nav, reveals, parallax, the cycle ring)
images/
  mock/         app screenshots, iPhone 16 Pro @3x (1206 × 2622)
  logo/         wordmark, stacked wordmark, icon
  badges/       store badges (SVG)
  og/           link-preview image (1200 × 630)
```

## The six sections

`#hero` · `#benefits` · `#phases` · `#insights` · `#partner-page` · `#cta`

The page runs light; `#phases` and `#cta` go dark on purpose, so the phase
colours glow the way they do inside the app. The nav bar detects those two
sections and swaps to the dark wordmark as it passes over them.

## The one animated moment

`#phases` is the signature: a squircle ring — the same shape as the app icon and
the day counter on the today screen — that draws itself in, one phase colour at a
time, as you scroll. A marker rides the edge, the day counts 1 → 29, and the
matching line lights up. Everything else on the page is a quiet fade.

The cycle is defined in `script.js`:

```js
var PHASES = [
  { start: 0,  days: 5,  color: "#E85150" }, // menstruation
  { start: 5,  days: 8,  color: "#64BC97" }, // follicular
  { start: 13, days: 3,  color: "#FEBC52" }, // ovulation
  { start: 16, days: 13, color: "#A28DEA" }  // luteal
];
var CYCLE_DAYS = 29;
```

`RUNWAY` (also in `script.js`) is how many extra viewports of scrolling the ring
takes to complete — raise it for a slower reveal, lower it for a quicker one.

Under `prefers-reduced-motion: reduce` the runway is dropped, the ring is drawn
whole, and all four phase lines show at once.

## Swapping things out

**Screenshots.** Every phone is the same markup:

```html
<div class="device">
  <div class="device__frame">
    <div class="device__screen">
      <img src="images/mock/home_1.png" alt="…" width="1206" height="2622">
    </div>
  </div>
</div>
```

Drop a new file into `images/mock/` and change the `src`. Anything with the
402 : 874 aspect ratio of an iPhone 16 Pro fits without cropping. Each `<img>` in
`index.html` is marked with a `<!-- SWAP: … -->` comment saying what it shows.
Phone size is set per section with `--dw` (the frame's radii scale off it).

**The partner page.** There is no screenshot of this screen yet, so it is built
in HTML/CSS inside the frame (search `PLACEHOLDER · Partner page` in
`index.html`). It scales off `--dw` in `em`, so it stays sharp at any size. When
a real screenshot exists, replace the whole `.ui` block with a plain `<img>` and
delete the `.ui__*` rules from `styles.css`.

**Store links.** Four `href="#"` placeholders, each above a
`<!-- TODO: replace href … -->` comment: one in the nav, one in the hero, two in
the closing section.

**Store badges.** `images/badges/app-store.svg` and `google-play.svg` are drawn
to Apple's and Google's proportions. Replace them with the official downloads
from Apple's Marketing Resources and Google's Play Badge generator when you
publish — same filenames, same 180 × 60 box, nothing else changes.

**Link preview.** `images/og/og-image.png` is referenced by the `og:image` and
`twitter:image` tags. Regenerate it however you like at 1200 × 630.

## Colours

All tokens are at the top of `styles.css`. Two rules govern their use:

- **Green** (`--phase-follicular`) is the accent. On light backgrounds it is used
  through `--accent`, which points at `--phase-follicular-dark` — the lighter
  tint does not carry enough contrast on `#F8F9FA`.
- **Orange** (`--brand-accent`) belongs to the call to action only: the badge
  hover glow, focus rings, text selection, and the wordmark itself. It is
  deliberately used nowhere else.

## Notes

- Fonts come from Google Fonts: Archivo (variable, with the width axis — display
  type sits at `font-stretch: 125%` for the brand's wide, squared look) and
  IBM Plex Mono for labels.
- Verified with no horizontal overflow from 320 px to 1920 px.
- Works without JavaScript: all content is visible, and the hero still animates.
