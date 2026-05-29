# NoAdsGPT — Ad-Free ChatGPT Extension

A minimal, privacy-focused browser extension that removes sponsored ads and promotional content from ChatGPT's interface.

![Chrome Web Store Rating](https://img.shields.io/badge/Rating-4.9%2F5-brightgreen)
![License](https://img.shields.io/badge/License-MIT-blue)
![Manifest](https://img.shields.io/badge/Manifest-V3-orange)

## What It Does

NoAdsGPT removes the "Sponsored" tinted-box ad cards that appear below ChatGPT responses for Free and Go tier users. It also blocks ad tracking requests to OpenAI's bazaar endpoint.

## How ChatGPT Ads Work

Since February 2026, OpenAI shows sponsored content to Free and Go plan users in the US (expanding globally). Ads appear as:

- **Tinted box cards** below responses, labeled "Sponsored"
- Contains advertiser name, favicon, headline, description, and images
- Assets served from `bzrcdn.openai.com`
- Tracking via `/bazaar/event` endpoint

NoAdsGPT blocks all of these.

## Features

- **CSS + DOM Blocking** — Hides ad containers via CSS selectors and DOM observation
- **Ad Tracking Blocked** — Intercepts bazaar tracking requests
- **Lightning Fast** — CSS loads at `document_start`, before ads render
- **Privacy First** — No data collection, no analytics, no external requests
- **One-Click Install** — No configuration needed
- **Minimal Permissions** — Only `activeTab` + `storage` + host permissions
- **Auto-Updates** — MutationObserver catches dynamically loaded ads

## Install

| Browser | Link |
|---------|------|
| Chrome | [Chrome Web Store](https://chromewebstore.google.com/) |
| Firefox | [Firefox Add-ons](https://addons.mozilla.org/) |

## How It Works

1. **`blocker.css`** — Injected at `document_start`, hides known ad selectors before they render
2. **`content.js`** — Observes DOM for dynamically added ad elements and hides them
3. **Tracking block** — Intercepts `fetch()` and `XHR` calls to `/bazaar/event`

### Targeted Selectors

- `[data-testid*="sponsored"]` — Sponsored content attributes
- `[class*="sponsored"]` — Sponsored class patterns
- `img[src*="bzrcdn.openai.com"]` — Ad asset images
- `a[href*="utm_medium=cpc"]` — Ad click-through links
- Elements containing "Sponsored" text with CPC links nearby

## File Structure

```
noadsgpt/
├── manifest.json      # Extension manifest (V3)
├── content.js         # DOM observer + ad blocking logic
├── blocker.css        # CSS rules to hide ad elements
├── popup.html         # Extension popup UI
├── popup.js           # Popup logic (toggle, stats)
├── popup.css          # Popup styles
├── icons/             # Extension icons
├── LICENSE            # MIT License
└── README.md          # This file
```

## Verify It Yourself

1. **Inspect manifest.json** — Only `activeTab` + `storage` permissions
2. **Monitor Network Tab** — No outbound requests from the extension
3. **Review Source Code** — Small enough to audit in minutes
4. **No Remote Code** — No `eval()`, no external `fetch()`, no dynamic script loading

## Privacy

- No data collection
- No analytics
- No chat logging
- No external requests
- No account needed
- Everything runs locally

## Note for Asia Region Users

ChatGPT ads are currently rolling out in the US first, with expansion to Canada, Australia, and New Zealand. If you're in Asia, you may not see ads yet — but this extension is ready for when they arrive in your region.

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/improvement`)
3. Commit your changes (`git commit -m 'Add improvement'`)
4. Push to the branch (`git push origin feature/improvement`)
5. Open a Pull Request

**Especially welcome:**
- New ad selectors as ChatGPT's ad format evolves
- Firefox compatibility fixes
- Localization

## License

MIT License — see [LICENSE](LICENSE) for details.

## Links

- [Website](https://noadsgpt.online)
- [Blog](https://noadsgpt.online/blog)
- [Privacy Policy](https://noadsgpt.online/privacy)

---

**NoAdsGPT is an independent third-party browser extension. Not affiliated with OpenAI or ChatGPT.**
