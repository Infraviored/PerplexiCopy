(() => {
  const CLEAN_BUTTON_LABEL = 'Copy without Citations';
  const STRIP_MD_BUTTON_LABEL = 'Copy without citations and Markdown';
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
    hideCitations: false,
    styleElement: null,
    favoriteModel: '',
    lastSelectionTime: 0,
    chatObserver: null,
    observedContainer: null,
    enableThinking: true,
    isSelectingModel: false,
  };

  const CITATION_HIDE_STYLE = `
    .citation-nbsp,
    span.inline-flex[aria-label*=".pdf"],
    span[data-pplx-citation],
    span.citation,
    span:has(> [data-pplx-citation]) {
      display: none !important;
    }
  `;

  const runtime =
    typeof browser !== 'undefined'
      ? browser.runtime
      : typeof chrome !== 'undefined'
        ? chrome.runtime
        : null;

  function stripMarkdown(md) {
    if (!md) return '';
    return md
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1') // images -> alt text
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // links -> text
      .replace(/(```[\s\S]*?```|~~~[\s\S]*?~~~)/g, '') // fenced code blocks
      .replace(/`([^`]+)`/g, '$1') // inline code
      .replace(/^#{1,6}\s+/gm, '') // headings
      .replace(/^\s*\*\s+/gm, '- ') // normalize * bullets to -
      .replace(/^\s*\+\s+/gm, '- ') // normalize + bullets to -
      .replace(/^\s*\d+\.\s+/gm, '') // ol numbers
      .replace(/^\s*>\s?/gm, '') // blockquotes
      .replace(/\*\*([^*]+)\*\*/g, '$1') // bold
      .replace(/__([^_]+)__/g, '$1') // bold
      .replace(/\*([^*]+)\*/g, '$1') // italics
      .replace(/_([^_]+)_/g, '$1') // italics
      .replace(/~~([^~]+)~~/g, '$1') // strikethrough
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

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

    // Remove inline citations like [ppl-ai-file-upload.s3.amazonaws](https://...)
    result = result.replace(/\s?\[[^\]]+\]\(https?:\/\/[^\)]+\)/g, '');

    // Remove URLs in parentheses that might be inline: (https://...)
    result = result.replace(/\s?\(https?:\/\/[^\)]+\)/g, '');

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
    } catch (err) { }
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

  function createIcon(iconPath) {
    const img = document.createElement('img');
    img.setAttribute('aria-hidden', 'true');
    img.alt = '';
    img.width = 16;
    img.height = 16;
    if (runtime) {
      img.src = runtime.getURL(iconPath || 'icons/icon.svg');
    }
    return img;
  }

  function createButton(label, iconPath) {
    const button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('aria-label', label);
    button.title = label; // Tooltip on hover
    button.classList.add(...BUTTON_CLASSNAMES);

    const wrapper = document.createElement('div');
    wrapper.classList.add('flex', 'items-center', 'min-w-0', 'gap-two', 'justify-center');

    const iconWrapper = document.createElement('div');
    iconWrapper.classList.add('flex', 'shrink-0', 'items-center', 'justify-center', 'size-4');
    iconWrapper.appendChild(createIcon(iconPath));

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

  async function copyCleanText(copyButton, cleanButton, shouldStripMarkdown = false) {
    try {
      const raw = await copyUsingNativeButton(copyButton);
      let cleaned = cleanText(raw);

      if (shouldStripMarkdown) {
        cleaned = stripMarkdown(cleaned);
      }

      if (!cleaned) {
        showTempStatus(cleanButton, 'Nothing to copy');
        return;
      }
      const ok = await writeToClipboard(cleaned);
      if (ok) wiggle(cleanButton);
      const successLabel = shouldStripMarkdown ? 'Copied without MD' : 'Copied without Citations';
      showTempStatus(cleanButton, ok ? successLabel : 'Copy failed');
    } catch (err) {
      showTempStatus(cleanButton, 'Copy failed');
    }
  }

  function placeButton(nextToButton) {
    if (!nextToButton || nextToButton.dataset.cleanCopyAttached === 'true') return;

    // First button: Standard Clean Copy
    const cleanBtn = createButton(CLEAN_BUTTON_LABEL, 'icons/copy-nocite.svg');
    cleanBtn.dataset.cleanCopyButton = 'true';
    cleanBtn.dataset.cleanCopyAttached = 'true';
    cleanBtn.addEventListener('click', (event) => {
      event.stopPropagation();
      copyCleanText(nextToButton, cleanBtn, false);
    });

    // Second button: Strip Markdown
    const stripBtn = createButton(STRIP_MD_BUTTON_LABEL, 'icons/copy-nomd.svg');
    stripBtn.dataset.stripMdButton = 'true';
    stripBtn.dataset.cleanCopyAttached = 'true';
    stripBtn.addEventListener('click', (event) => {
      event.stopPropagation();
      copyCleanText(nextToButton, stripBtn, true);
    });

    // We add them after the native copy button
    // To keep them together, we could wrap them or just insert them sequentially
    nextToButton.insertAdjacentElement('afterend', stripBtn);
    nextToButton.insertAdjacentElement('afterend', cleanBtn);

    nextToButton.dataset.cleanCopyAttached = 'true';
  }

  function isCopyButton(button) {
    if (button.dataset.cleanCopyButton === 'true' || button.dataset.stripMdButton === 'true') {
      return false;
    }
    const label = (button.getAttribute('aria-label') || button.getAttribute('title') || '').toLowerCase().trim();
    if (!label) return false;

    const hasCopy = label.includes('copy') || 
                    label.includes('kopier') || 
                    label.includes('copi') || 
                    label.includes('복사') || 
                    label.includes('复制') || 
                    label.includes('複製') || 
                    label.includes('コピー') || 
                    label.includes('копир') || 
                    label.includes('kopy');

    if (!hasCopy) return false;

    const hasExclude = label.includes('link') || 
                       label.includes('url') || 
                       label.includes('share') || 
                       label.includes('teilen') || 
                       label.includes('partager') || 
                       label.includes('compartir') || 
                       label.includes('condividi') || 
                       label.includes('dela') || 
                       label.includes('delen') || 
                       label.includes('paylaş');

    return !hasExclude;
  }

  const isMatch = (text, target) => {
    if (!text || !target) return false;
    const cleanText = text.toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanTarget = target.toLowerCase().replace(/[^a-z0-9]/g, '');
    return cleanText.includes(cleanTarget) || cleanTarget.includes(cleanText);
  };

  function debounce(fn, delay) {
    let timeoutId;
    return function (...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  const isDefaultModel = (text) => {
    if (!text) return true;
    const clean = text.toLowerCase().trim();
    return clean === 'best' || clean === 'best selects the best available model' || clean === '';
  };

  const findTriggerButton = () => {
    const chatContainer = document.querySelector('[data-ask-input-container="true"]');
    if (chatContainer) {
      const btn = chatContainer.querySelector('.inline-flex.-mr-sm button[aria-haspopup="menu"]');
      if (btn) return btn;
    }
    return Array.from(document.querySelectorAll('button[aria-haspopup="menu"]'))
      .find(btn => btn.querySelector('.text-box-trim-both') && btn.textContent);
  };

  async function checkAndApplyFavoriteModel() {
    if (state.isSelectingModel) return;
    if (!state.favoriteModel) return;

    const now = Date.now();
    if (now - state.lastSelectionTime < 5000) {
      return;
    }

    const trigger = findTriggerButton();
    if (!trigger) return;

    // Do not attempt to open the menu if the trigger button is disabled (e.g., during active search/generation)
    if (trigger.disabled || 
        trigger.getAttribute('aria-disabled') === 'true' || 
        trigger.hasAttribute('disabled')) {
      return;
    }

    const currentModelText = trigger.textContent.trim();
    if (isMatch(currentModelText, state.favoriteModel)) {
      return;
    }

    if (!isDefaultModel(currentModelText)) {
      return;
    }

    state.isSelectingModel = true;
    state.lastSelectionTime = now;

    try {
      trigger.focus();
      trigger.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
      trigger.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
      trigger.click();

      const menuItems = await new Promise((resolve, reject) => {
        const existingItems = document.querySelectorAll('[role="menuitemradio"], [role="menuitem"]');
        if (existingItems.length > 0) {
          resolve(Array.from(existingItems));
          return;
        }

        const menuObserver = new MutationObserver(() => {
          const items = document.querySelectorAll('[role="menuitemradio"], [role="menuitem"]');
          if (items.length > 0) {
            menuObserver.disconnect();
            resolve(Array.from(items));
          }
        });

        menuObserver.observe(document.body, { childList: true, subtree: true });

        setTimeout(() => {
          menuObserver.disconnect();
          reject(new Error("Timeout waiting for menu items"));
        }, 1500);
      });

      const selectableItems = menuItems.filter(item => {
        const hasLock = item.querySelector('svg use[*|href*="lock"]') !== null || 
                        item.querySelector('svg use[*|href*="pplx-icon-lock"]') !== null;
        return !hasLock;
      });

      const matchedItem = selectableItems.find(item => {
        const lines = item.textContent.split('\n');
        const primaryName = lines[0].trim();
        return isMatch(primaryName, state.favoriteModel) || isMatch(item.textContent, state.favoriteModel);
      });

      if (matchedItem) {
        // 1. Click on the model
        const events = ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click'];
        events.forEach(type => {
          let evt;
          if (type.startsWith('pointer')) {
            evt = new PointerEvent(type, { bubbles: true, cancelable: true });
          } else if (type.startsWith('mouse')) {
            evt = new MouseEvent(type, { bubbles: true, cancelable: true });
          } else {
            evt = new Event(type, { bubbles: true, cancelable: true });
          }
          matchedItem.dispatchEvent(evt);
        });

        // 2. WAIT 1 second
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Re-open the menu if it was closed by selecting the model
        let activeMenu = document.querySelector('[role="menu"]');
        if (!activeMenu) {
          const freshTrigger = findTriggerButton();
          if (freshTrigger) {
            freshTrigger.focus();
            freshTrigger.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
            freshTrigger.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
            freshTrigger.click();
            // Wait for menu to render
            await new Promise((resolve) => setTimeout(resolve, 500));
            activeMenu = document.querySelector('[role="menu"]');
          }
        }

        if (activeMenu) {
          // Find the active/matched model in the open menu to toggle its slider
          const currentMenuItems = document.querySelectorAll('[role="menuitemradio"], [role="menuitem"]');
          const activeModelItem = Array.from(currentMenuItems).find(item => {
            const lines = item.textContent.split('\n');
            const primaryName = lines[0].trim();
            return isMatch(primaryName, state.favoriteModel) || isMatch(item.textContent, state.favoriteModel);
          });

          if (activeModelItem) {
            const container = activeModelItem.parentElement;
            if (container) {
              const thinkingItem = container.querySelector('[role="menuitemcheckbox"]');
              if (thinkingItem) {
                const isDisabled = thinkingItem.getAttribute('aria-disabled') === 'true' || 
                                   thinkingItem.hasAttribute('data-disabled') || 
                                   thinkingItem.querySelector('button[disabled]') !== null;
                
                if (!isDisabled) {
                  const isCurrentChecked = thinkingItem.getAttribute('aria-checked') === 'true';
                  if (isCurrentChecked !== state.enableThinking) {
                    const toggleTarget = thinkingItem.querySelector('button[role="switch"]') || 
                                         thinkingItem.querySelector('button') || 
                                         thinkingItem;
                    
                    const toggleEvents = ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click'];
                    toggleEvents.forEach(type => {
                      let evt;
                      if (type.startsWith('pointer')) {
                        evt = new PointerEvent(type, { bubbles: true, cancelable: true });
                      } else if (type.startsWith('mouse')) {
                        evt = new MouseEvent(type, { bubbles: true, cancelable: true });
                      } else {
                        evt = new Event(type, { bubbles: true, cancelable: true });
                      }
                      toggleTarget.dispatchEvent(evt);
                    });

                    // 4. Wait 1 second after using the slider
                    await new Promise((resolve) => setTimeout(resolve, 1000));
                  }
                }
              }
            }
          }
        }

        // 5. Close the dropdown
        const finalMenu = document.querySelector('[role="menu"]');
        if (finalMenu) {
          const escEvent = new KeyboardEvent('keydown', {
            key: 'Escape',
            code: 'Escape',
            keyCode: 27,
            which: 27,
            bubbles: true,
            cancelable: true
          });
          finalMenu.dispatchEvent(escEvent);
        }

        const inputEl = document.getElementById('ask-input');
        if (inputEl) {
          inputEl.focus();
        }

        state.lastSelectionTime = Date.now();
      } else {
        trigger.click();
        state.lastSelectionTime = Date.now();
      }
    } catch (err) {
      const freshTrigger = findTriggerButton();
      if (freshTrigger && !freshTrigger.disabled && freshTrigger.getAttribute('aria-disabled') !== 'true') {
        state.lastSelectionTime = 0;
      } else {
        state.lastSelectionTime = Date.now();
      }
    } finally {
      state.isSelectingModel = false;
    }
  }

  const debouncedCheckAndApplyFavoriteModel = debounce(checkAndApplyFavoriteModel, 250);

  function initChatObserver() {
    const container = document.querySelector('[data-ask-input-container="true"]');
    if (!container) {
      if (state.chatObserver) {
        state.chatObserver.disconnect();
        state.chatObserver = null;
        state.observedContainer = null;
      }
      return;
    }

    if (state.observedContainer === container) {
      return;
    }

    if (state.chatObserver) {
      state.chatObserver.disconnect();
    }

    state.observedContainer = container;
    state.chatObserver = new MutationObserver(() => {
      debouncedCheckAndApplyFavoriteModel();
    });

    state.chatObserver.observe(container, { childList: true, subtree: true, characterData: true });
  }

  function scanAndAttach() {
    const buttons = document.querySelectorAll('button:not([data-clean-copy-attached="true"])');
    buttons.forEach((button) => {
      if (isCopyButton(button)) {
        placeButton(button);
      }
    });
    initChatObserver();
    debouncedCheckAndApplyFavoriteModel();
  }

  const debouncedScanAndAttach = debounce(scanAndAttach, 250);

  function initObserver() {
    if (state.observer) return;
    state.observer = new MutationObserver(() => {
      debouncedScanAndAttach();
    });
    state.observer.observe(document.body, { childList: true, subtree: true });
  }

  function updateHidingStyle() {
    if (state.hideCitations) {
      if (!state.styleElement) {
        state.styleElement = document.createElement('style');
        state.styleElement.id = 'plexicopy-hide-citations';
        document.head.appendChild(state.styleElement);
      }
      state.styleElement.textContent = CITATION_HIDE_STYLE;
    } else if (state.styleElement) {
      state.styleElement.textContent = '';
    }
  }

  function initSettings() {
    chrome.storage.local.get(['hideCitations', 'favoriteModel', 'enableThinking'], (result) => {
      state.hideCitations = result.hideCitations || false;
      state.favoriteModel = result.favoriteModel || '';
      state.enableThinking = result.enableThinking !== false;
      updateHidingStyle();
      debouncedCheckAndApplyFavoriteModel();
    });

    chrome.runtime.onMessage.addListener((message) => {
      if (message.action === 'updateSettings') {
        if ('hideCitations' in message.settings) {
          state.hideCitations = message.settings.hideCitations;
          updateHidingStyle();
        }
        if ('favoriteModel' in message.settings) {
          state.favoriteModel = message.settings.favoriteModel;
          state.lastSelectionTime = 0;
          debouncedCheckAndApplyFavoriteModel();
        }
        if ('enableThinking' in message.settings) {
          state.enableThinking = message.settings.enableThinking;
          state.lastSelectionTime = 0;
          debouncedCheckAndApplyFavoriteModel();
        }
      }
    });
  }

  function init() {
    initSettings();
    scanAndAttach();
    initObserver();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

