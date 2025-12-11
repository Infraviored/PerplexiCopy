## PlexiCopy

Firefox content-script add-on that adds a “Clean Copy” button on Perplexity answers. It clicks the native Copy, sanitizes the text (removing citations/URL blocks), and writes the cleaned text back to the clipboard with a small wiggle for success feedback.

### Installation (temporary)
- Load `dist/plexicopy-v*.zip` via `about:addons` → gear → “Install Add-on From File…”.

### Development
- Edit `content.js` and `manifest.json`.
- Run `./package.sh` to build `dist/plexicopy-v<version>.zip`.

### Notes
- Data collection: none (declared in `browser_specific_settings.gecko.data_collection_permissions`).
- Requires clipboard permissions (read/write) to clean and re-copy text.
