# 🦊 PlexiCopy

**Clean up your Perplexity workflow.** PlexiCopy is a Firefox extension designed to give you perfectly sanitized copies of AI answers—free of citation markers, bulk URLs, and messy formatting.

### ⬇️ [Get it on Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/plexicopy/)

---

### ✨ Features

- **🧼 Smart Markdown Copy**: Removes `[1]`, `[2]` markers and those long source URL lists from bottom while keeping the rich Markdown (tables, bold, headers) perfectly intact.
- **📄 Plain Text Mode**: A dedicated "Copy without Markdown" button for when you need raw text. It also normalizes all bullet points to a clean, consistent `-` style.
- **🛠️ UI Zen (Citation Hider)**: A toggle in the extension popup to instantly hide distracting citation buttons and PDF links from the Perplexity interface while you work.
- **🔒 Privacy First**: Zero data collection. All processing happens locally in your browser.

---

### 🛠️ Development

If you want to build or modify PlexiCopy yourself:

1. **Modify**: Edit `content.js`, `manifest.json`, or the popup files.
2. **Build**: Run `./package.sh` to build `dist/plexicopy-v1.2.zip`.
3. **Load Locally**: In Firefox, go to `about:addons` → Gear icon → "Install Add-on From File..." and select the zip from `dist/`.

*Note: Requires `clipboard` and `storage` permissions to process text and save your UI preferences.*
