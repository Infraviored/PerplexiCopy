document.addEventListener('DOMContentLoaded', () => {
  const hideToggle = document.getElementById('hideCitationsToggle');
  const modelInput = document.getElementById('favoriteModel');
  const thinkingToggle = document.getElementById('enableThinkingToggle');
  const enforceOnLoadToggle = document.getElementById('enforceModelOnLoadToggle');
  const getModelsBtn = document.getElementById('getModelsBtn');

  function populateModels(models, favorite) {
    modelInput.innerHTML = '';
    if (models && models.length > 0) {
      models.forEach(model => {
        const opt = document.createElement('option');
        opt.value = model;
        opt.textContent = model;
        if (model === favorite) {
          opt.selected = true;
        }
        modelInput.appendChild(opt);
      });
    } else {
      const opt = document.createElement('option');
      opt.value = '';
      opt.textContent = "Click 'Get Models' to load";
      modelInput.appendChild(opt);
    }
  }

  // Load current state
  chrome.storage.local.get(['hideCitations', 'favoriteModel', 'enableThinking', 'enforceModelOnLoad', 'availableModels'], (result) => {
    hideToggle.checked = result.hideCitations || false;
    thinkingToggle.checked = result.enableThinking !== false; // Default to true if not set
    enforceOnLoadToggle.checked = result.enforceModelOnLoad !== false; // Default to true if not set
    populateModels(result.availableModels, result.favoriteModel || '');
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

  // Handle enforce model on load change
  enforceOnLoadToggle.addEventListener('change', () => {
    const enforceModelOnLoad = enforceOnLoadToggle.checked;
    chrome.storage.local.set({ enforceModelOnLoad }, () => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, {
            action: 'updateSettings',
            settings: { enforceModelOnLoad }
          });
        }
      });
    });
  });

  // Handle Get Models click
  getModelsBtn.addEventListener('click', () => {
    getModelsBtn.disabled = true;
    getModelsBtn.textContent = 'Fetching...';
    modelInput.disabled = true;

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs[0]) {
        alert("Error: Active tab not found.");
        getModelsBtn.disabled = false;
        getModelsBtn.textContent = 'Get Models';
        modelInput.disabled = false;
        return;
      }

      chrome.tabs.sendMessage(tabs[0].id, { action: 'scrapeModels' }, (response) => {
        const lastErr = chrome.runtime.lastError;
        if (lastErr || !response || !response.success) {
          const errMsg = lastErr ? lastErr.message : (response ? response.error : 'Invalid response');
          alert("Could not scrape models: " + errMsg + "\n\nMake sure you are on a Perplexity tab and the page is loaded.");
          getModelsBtn.disabled = false;
          getModelsBtn.textContent = 'Get Models';
          modelInput.disabled = false;
          return;
        }

        // On success, reload list and favorite from local storage
        chrome.storage.local.get(['availableModels', 'favoriteModel'], (updatedResult) => {
          populateModels(updatedResult.availableModels, updatedResult.favoriteModel || '');
          getModelsBtn.disabled = false;
          getModelsBtn.textContent = 'Get Models';
          modelInput.disabled = false;
        });
      });
    });
  });
});
