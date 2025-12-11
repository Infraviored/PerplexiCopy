(() => {
  const CLEAN_BUTTON_LABEL = 'Clean Copy';
  const BUTTON_CLASSNAMES = [
    'focus-visible:bg-subtle',
    'hover:bg-subtle',
    'text-quiet',
    'hover:text-foreground',
    'dark:hover:bg-subtle',
    'font-sans',
    'focus:outline-none',
    'outline-none',
    'outline-transparent',
    'transition',
    'duration-300',
    'ease-out',
    'select-none',
    'items-center',
    'relative',
    'group/button',
    'font-semimedium',
    'justify-center',
    'text-center',
    'rounded-full',
    'cursor-pointer',
    'active:scale-[0.97]',
    'active:duration-150',
    'active:ease-outExpo',
    'origin-center',
    'whitespace-nowrap',
    'inline-flex',
    'text-sm',
    'h-8',
    'aspect-square',
  ];

  const state = {
    observer: null,
  };

  const runtime =
    typeof browser !== 'undefined'
      ? browser.runtime
      : typeof chrome !== 'undefined'
        ? chrome.runtime
        : null;

  function cleanText(raw) {
    if (!raw) return '';

    // Remove citation markers like [1], [2], etc.
    let text = raw.replace(/\[\d+\]/g, '');

    // Remove URL sections at the bottom
    const lines = text.split('\n');
    const cleanedLines = [];
    let inUrlSection = false;

    for (const line of lines) {
      const stripped = line.trim();
      const isUrlLine =
        /^\[\d+\]\(https?:\/\//.test(stripped) ||
        /^\(https?:\/\//.test(stripped) ||
        /^https?:\/\//.test(stripped) ||
        (stripped.startsWith('[') && stripped.includes('](http')) ||
        (stripped.startsWith('(') && stripped.includes('http') && stripped.endsWith(')'));

      if (isUrlLine) {
        inUrlSection = true;
        continue;
      }

      if (inUrlSection && stripped === '') {
        continue;
      }

      if (inUrlSection && !isUrlLine) {
        inUrlSection = false;
        cleanedLines.push(line);
        continue;
      }

      if (!inUrlSection) {
        cleanedLines.push(line);
      }
    }

    let result = cleanedLines.join('\n').trim();

    // Clean up any remaining citation markers that might have been missed
    result = result.replace(/\s+\[\d+\]/g, '');
    result = result.replace(/\[\d+\]\s+/g, '');

    // Remove URLs in parentheses that might be inline: (https://...)
    result = result.replace(/\(https?:\/\/[^\)]+\)/g, '');

    // Remove multiple consecutive blank lines
    result = result.replace(/\n{3,}/g, '\n\n');

    return result.trim();
  }

  async function copyUsingNativeButton(copyButton) {
    if (!copyButton) return '';
    try {
      copyButton.click();
      await new Promise((resolve) => setTimeout(resolve, 60));
      if (navigator.clipboard?.readText) {
        const text = await navigator.clipboard.readText();
        if (text) return text;
      }
    } catch (err) {}
    return '';
  }

  function wiggle(button) {
    if (!button?.animate) return;
    button.animate(
      [
        { transform: 'rotate(0deg)' },
        { transform: 'rotate(-10deg)' },
        { transform: 'rotate(10deg)' },
        { transform: 'rotate(-6deg)' },
        { transform: 'rotate(6deg)' },
        { transform: 'rotate(0deg)' },
      ],
      { duration: 280, easing: 'ease-out' },
    );
  }

  function extractAnswerText(copyButton) {
    if (!copyButton) return '';

    // Try to scope to the message/card that owns this copy button
    const candidateContainers = [
      copyButton.closest('[data-testid="answer-card"]'),
      copyButton.closest('[data-message-id]'),
      copyButton.closest('article'),
      copyButton.closest('section'),
      copyButton.closest('div'),
      document.body,
    ].filter(Boolean);

    for (const container of candidateContainers) {
      const textBlocks = container.querySelectorAll('p, li, pre, code, h1, h2, h3, h4, h5, h6');
      if (textBlocks.length) {
        const joined = Array.from(textBlocks)
          .map((el) => el.innerText.trim())
          .filter(Boolean)
          .join('\n\n');
        if (joined) return joined;
      }
    }

    return copyButton.closest('div')?.innerText || '';
  }

  function createIcon() {
    const img = document.createElement('img');
    img.setAttribute('aria-hidden', 'true');
    img.alt = '';
    img.width = 16;
    img.height = 16;
    if (runtime) {
      img.src = runtime.getURL('icons/icon.svg');
    }
    return img;
  }

  function createButton() {
    const button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('aria-label', CLEAN_BUTTON_LABEL);
    button.classList.add(...BUTTON_CLASSNAMES);

    const wrapper = document.createElement('div');
    wrapper.classList.add('flex', 'items-center', 'min-w-0', 'gap-two', 'justify-center');

    const iconWrapper = document.createElement('div');
    iconWrapper.classList.add('flex', 'shrink-0', 'items-center', 'justify-center', 'size-4');
    iconWrapper.appendChild(createIcon());

    wrapper.appendChild(iconWrapper);
    button.appendChild(wrapper);
    return button;
  }

  function showTempStatus(button, label) {
    if (!button) return;
    const original = button.getAttribute('aria-label') || CLEAN_BUTTON_LABEL;
    button.setAttribute('aria-label', label);
    button.style.opacity = '0.8';
    setTimeout(() => {
      button.setAttribute('aria-label', original);
      button.style.opacity = '';
    }, 1200);
  }

  async function writeToClipboard(text) {
    if (!text) return false;
    const execCommandCopy = () => {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        textarea.style.top = '-9999px';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        const ok = document.execCommand('copy');
        document.body.removeChild(textarea);
        return ok;
      } catch (err) {
        return false;
      }
    };

    const execOk = execCommandCopy();
    if (execOk) return true;

    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      return false;
    }
  }

  async function copyCleanText(copyButton, cleanButton) {
    try {
      const raw = await copyUsingNativeButton(copyButton);
      const cleaned = cleanText(raw);
      if (!cleaned) {
        showTempStatus(cleanButton, 'Nothing to copy');
        return;
      }
      const ok = await writeToClipboard(cleaned);
      if (ok) wiggle(cleanButton);
      showTempStatus(cleanButton, ok ? 'Copied clean text' : 'Copy failed');
    } catch (err) {
      showTempStatus(cleanButton, 'Copy failed');
    }
  }

  function placeButton(nextToButton) {
    if (!nextToButton || nextToButton.dataset.cleanCopyAttached === 'true') return;

    const cleanBtn = createButton();
    cleanBtn.dataset.cleanCopyButton = 'true';

    cleanBtn.addEventListener('click', (event) => {
      event.stopPropagation();
      copyCleanText(nextToButton, cleanBtn);
    });

    nextToButton.insertAdjacentElement('afterend', cleanBtn);
    nextToButton.dataset.cleanCopyAttached = 'true';
  }

  function scanAndAttach() {
    const copyButtons = document.querySelectorAll('button[aria-label="Copy"]');
    copyButtons.forEach(placeButton);
  }

  function initObserver() {
    if (state.observer) return;
    state.observer = new MutationObserver(() => {
      scanAndAttach();
    });
    state.observer.observe(document.body, { childList: true, subtree: true });
  }

  function init() {
    scanAndAttach();
    initObserver();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

