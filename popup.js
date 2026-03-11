document.addEventListener('DOMContentLoaded', () => {
  const hideToggle = document.getElementById('hideCitationsToggle');

  // Load current state
  chrome.storage.local.get(['hideCitations'], (result) => {
    hideToggle.checked = result.hideCitations || false;
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
});
