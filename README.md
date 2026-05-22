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
2. **Build**: Run `./package.sh` to build `dist/plexicopy-v1.4.zip`.
3. **Load Locally**: In Firefox, go to `about:addons` → Gear icon → "Install Add-on From File..." and select the zip from `dist/`.

*Note: Requires `clipboard` and `storage` permissions to process text and save your UI preferences.*

---

### 📋 Release Notes

#### v1.4
- **Thinking Toggle Support**: Added an "Enable Thinking" toggle in the popup. For models that support toggleable thinking (like GPT-5), PlexiCopy automatically toggles it to your preferred state when selecting the model.

#### v1.3
- **Model Auto-Selector**: Added an option in the popup to set a favorite model. The extension automatically selects it on the landing page and restores it on chat pages when Perplexity resets it to "Best" (using a highly resource-efficient MutationObserver).
- **Multi-Language Copy Support**: Generalized the copy button detection for multi-language compatibility (German, French, Spanish, Italian, Swedish, Dutch, Turkish, Russian, Japanese, Chinese, Korean) to work seamlessly on non-English locales (Commit `b2a61ab0ba196453711fc3339fbd37553532bb8a`: `fix: generalize copy button detection for multi-language compatibility`).

#### v1.2
- Fix packaging and include missing popup.html/popup.js in the package.

#### v1.1
- Added UI citation hider toggle, Smart Markdown copy, and Plain Text copy.
