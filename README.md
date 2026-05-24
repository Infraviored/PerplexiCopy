# 🦊 PlexiEnhancer (formerly PlexiCopy)

**Clean up and enhance your Perplexity workflow.** PlexiCopy is now officially **PlexiEnhancer**—a Firefox extension designed to give you perfectly sanitized copies of AI answers (free of citation markers, bulk URLs, and messy formatting) and aggressively enforce your favorite model.

Perplexity has a tendency to silently reset your selected model back to cheap defaults (like "Best", "Model", or "Pro") even within a single chat session to reduce server-side costs. While understandable, this degrades the output quality. PlexiEnhancer automatically and instantly locks in your preferred high-end model (e.g. Gemini 3.1 Pro, GPT-5) and thinking/reasoning state, resolving this limitation.

### ⬇️ [Get it on Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/plexicopy/)

---

### ✨ Features

- **🚀 Model Auto-Selector (Plexi Enhancer)**: Automatically detects when Perplexity resets your model to a cheap default (like "Best", "Model", or "Pro") and instantly forces the selection back to your favorite model (and thinking switch state).
- **🧼 Smart Markdown Copy**: Removes `[1]`, `[2]` markers and source URL lists from the bottom while keeping the rich Markdown (tables, code, bold, headers) intact.
- **📄 Plain Text Mode**: A dedicated "Copy without Markdown" button for raw text, with automatic bullet point normalization to a clean `-` style.
- **🛠️ UI Zen (Citation Hider)**: A toggle in the extension popup to instantly hide citation buttons and PDF links from the Perplexity interface.
- **🔒 Privacy First**: Zero data collection. All processing and settings are stored locally.

---

### 📋 Release Notes

#### v2.0 (Rebranding & Custom Selector Update)
- **Rebranding**: PlexiCopy has officially become **PlexiEnhancer**, reflecting its core role in preventing aggressive model downgrades.
- **Dynamic Model Retrieval**: Added a "Get Models" button in the popup to dynamically scrape all available, unlocked model names from Perplexity, completely eliminating hardcoded model lists.
- **Strict Model Enforcement**: Changed model label matching to strict comparison (after stripping formatting and thinking suffixes) to prevent the "Pro" default label from blocking auto-selection.
- **Enforce on Load Toggle**: Added a toggle to enable/disable overriding Perplexity's restored models when first landing on the page.
- **Performance Optimizations**: Cached observations to prevent redundant check loops on static pages, and pause selection queries while Perplexity is actively generating.

#### v1.4
- **Thinking Toggle Support**: Added an "Enable Thinking" toggle in the popup. For models that support toggleable thinking (like GPT-5), PlexiCopy automatically toggles it to your preferred state when selecting the model.

#### v1.3
- **Model Auto-Selector**: Added an option in the popup to set a favorite model. The extension automatically selects it on the landing page and restores it on chat pages when Perplexity resets it.
- **Multi-Language Copy Support**: Generalized the copy button detection for multi-language compatibility (German, French, Spanish, Italian, Swedish, Dutch, Turkish, Russian, Japanese, Chinese, Korean).

#### v1.1 - v1.2
- Added UI citation hider toggle, Smart Markdown copy, Plain Text copy, and extension packaging.


