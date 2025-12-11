#!/bin/bash
# Package Firefox extension for PlexiCopy
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
EXTENSION_DIR="${SCRIPT_DIR}"
MANIFEST_FILE="${EXTENSION_DIR}/manifest.json"

if [[ ! -f "${MANIFEST_FILE}" ]]; then
  echo "Manifest not found at ${MANIFEST_FILE}" >&2
  exit 1
fi

EXTENSION_NAME="plexicopy"
VERSION=$(grep -m1 '"version"' "${MANIFEST_FILE}" | sed -E 's/.*"version"[[:space:]]*:[[:space:]]*"([^"]+)".*/\1/')

if [[ -z "${VERSION}" ]]; then
  echo "Unable to determine version from manifest." >&2
  exit 1
fi

OUTPUT_DIR="${SCRIPT_DIR}/dist"
ZIP_FILE="${OUTPUT_DIR}/${EXTENSION_NAME}-v${VERSION}.zip"

echo "Packaging Firefox extension v${VERSION}..."

# Create output directory
mkdir -p "${OUTPUT_DIR}"

# Files to include
FILES=(
  "manifest.json"
  "content.js"
  "icons"
)

# Create zip file
echo "Creating ${ZIP_FILE}..."
(
  cd "${EXTENSION_DIR}"
  zip -r "${ZIP_FILE}" "${FILES[@]}" -x "*.DS_Store" "*.git*"
)

echo "✓ Extension packaged: ${ZIP_FILE}"
