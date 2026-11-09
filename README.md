# Outframe Studio V4

A complete static-site redesign based on the existing `Krishu04rajput/Website` repository and the supplied Floating Cliff hero prototype.

## Run locally
Open `index.html` in a modern browser, or serve this folder with a local static server (recommended for ES modules):
```bash
python -m http.server 5500
```
Then visit `http://localhost:5500`.

## V4 design
- Floating stone-cliff particle hero, with scroll-driven dispersal and pointer response.
- Editorial horizontal project gallery with snap scrolling, controls and project counter.
- Warm charcoal / stone / burnt-orange palette.
- Cinematic section reveals, responsive layout and reduced-motion support.
- Preserves the nine project destinations, live Google Drive showcase, manifesto, principles, email contact and Vercel contact endpoint.

## Notes
- The original Outframe logo is referenced from the public GitHub repository at `assets/outframe-logo.png` so it remains the same brand asset. For a fully self-contained/offline copy, place the original logo at `assets/outframe-logo.png` and change the two logo references in `index.html` to that local path.
- The hero uses Three.js from jsDelivr as an ES module. It requires an internet connection. If WebGL is unavailable, the rest of the site remains usable.
- The contact API requires `RESEND_API_KEY`, `CONTACT_TO`, and optionally `CONTACT_FROM` in Vercel environment variables.
- No dependencies or build step are required.

## Floating ecosystem update
- Animated waterfall particle streams.
- Hanging botanical points with subtle sway and drifting leaves.
- Floating Outframe emblem with a slow upward orbit.
- Lightweight effects; reduced-motion preference is respected.

## Brand color and logo polish
- Replaced the temporary floating letter with the existing official Outframe Studio logo asset.
- Added a fine orbital ring, restrained light trail, and warm highlight.
- Refined the hero palette with champagne, amber, botanical moss, and waterfall teal accents.
- Kept the original wordmark/logo asset as the single source of brand identity.

## Official logo placement
- `assets/outframe-full-lockup.png`: full emblem + OUTFRAME STUDIO wordmark, floating beside the cliff.
- `assets/outframe-mark.png`: icon-only emblem, used in the homepage particle field, favicon, and Approach section.
- Both logo assets are bundled locally; no external logo image request is needed.

## Homepage refinement
- Restored the original website favicon asset: `https://raw.githubusercontent.com/Krishu04rajput/Website/main/assets/outframe-logo.png`.
- Kept the full OUTFRAME STUDIO lockup floating beside the cliff.
- Simplified the hero by removing secondary decorative labels and reducing visual noise.
- Kept the icon-only mark subtle in the particle field and in the Approach section.
