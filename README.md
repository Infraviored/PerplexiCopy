## PlexiCopy

Firefox content-script add-on that enhances your Perplexity workflow by providing clean, citation-free copies of answers.

### Features
- **Hide Citations in UI**: A toggle in the extension popup to instantly hide distracting citation buttons and PDF links from the Perplexity interface.
- **Copy without Citations (Clean Markdown)**: Removes [1],[2] markers and source URL blocks while preserving the rich Markdown formatting you actually want.
- **Copy without Citations and Markdown (Plain Text)**: A dedicated button for when you need raw text. Strips all formatting and normalizes bullets to a clean `-` style.

### Installation (temporary)
- Load `dist/plexicopy-v*.zip` via `about:addons` → gear → “Install Add-on From File…”.

### Development
- Edit `content.js`, `manifest.json`, and UI files (`popup.html`/`popup.js`).
- Run `./package.sh` to build `dist/plexicopy-v<version>.zip`.

### Notes
- Data collection: none (declared in `browser_specific_settings.gecko.data_collection_permissions`).
- Requires `clipboard` and `storage` permissions for text processing and settings persistence.
