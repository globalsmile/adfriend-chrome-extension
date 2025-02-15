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


/*chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getZenQuotes') {
    fetch("https://zenquotes.io/api/quotes")
      .then(response => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then(data => {
        console.log("Fetched quotes in background:", data);
        sendResponse({ success: true, quotes: data });
      })
      .catch(err => {
        console.error("Error fetching ZenQuotes in background:", err);
        sendResponse({ success: false, error: err.message });
      });
    // Indicate that we will send a response asynchronously.
    return true;
  }
});
*/
