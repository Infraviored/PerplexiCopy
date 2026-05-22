document.addEventListener('DOMContentLoaded', () => {
  const hideToggle = document.getElementById('hideCitationsToggle');
  const modelInput = document.getElementById('favoriteModel');
  const thinkingToggle = document.getElementById('enableThinkingToggle');

  // Load current state
  chrome.storage.local.get(['hideCitations', 'favoriteModel', 'enableThinking'], (result) => {
    hideToggle.checked = result.hideCitations || false;
    modelInput.value = result.favoriteModel || '';
    thinkingToggle.checked = result.enableThinking !== false; // Default to true if not set
  });

  // Handle hide citations toggle change
  hideToggle.addEventListener('change', () => {
    const hideCitations = hideToggle.checked;
    chrome.storage.local.set({ hideCitations }, () => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, {
            action: 'updateSettings',
            settings: { hideCitations }
          });
        }
      });
    });
  });

  // Handle favorite model change
  modelInput.addEventListener('change', () => {
    const favoriteModel = modelInput.value.trim();
    chrome.storage.local.set({ favoriteModel }, () => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, {
            action: 'updateSettings',
            settings: { favoriteModel }
          });
        }
      });
    });
  });

  // Handle enable thinking change
  thinkingToggle.addEventListener('change', () => {
    const enableThinking = thinkingToggle.checked;
    chrome.storage.local.set({ enableThinking }, () => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, {
            action: 'updateSettings',
            settings: { enableThinking }
          });
        }
      });
    });
  });
});
