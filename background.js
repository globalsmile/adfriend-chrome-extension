// background.js
console.log('AdFriend background script running.');

// background.js

// This event fires when the extension is installed or updated.
chrome.runtime.onInstalled.addListener(() => {
    console.log('AdFriend extension installed and service worker activated.');
    // You can perform any one-time initialization tasks here.
  });
  
  // (Optional) Listen for a simple message event.
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Received message in background:', message);
    sendResponse({ status: 'received' });
  });
  