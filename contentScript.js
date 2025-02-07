// contentScript.js

// Inject inline CSS for the widget
const style = document.createElement('style');
style.textContent = `
  .adfriend-widget {
    padding: 10px;
    background-color: #f0f8ff;
    border: 2px solid #007bff;
    text-align: center;
    font-weight: bold;
  }
`;
document.head.appendChild(style);

// Function to search for ad-like elements and replace them
function replaceAds() {
  // Define common selectors for ad elements
  const adSelectors = [".ad", ".ads", "[id^='ad-']", "[class*='ad-']"];

  adSelectors.forEach(selector => {
    const adElements = document.querySelectorAll(selector);
    adElements.forEach(ad => {
      // Create a widget element
      const widget = document.createElement('div');
      widget.className = 'adfriend-widget';
      
      // Retrieve a custom quote from chrome.storage (if set)
      chrome.storage.sync.get(['quote'], (result) => {
        widget.textContent = result.quote || 'Stay Positive! 😊';
      });

      // Replace the ad element's content with the widget
      ad.innerHTML = '';
      ad.appendChild(widget);
    });
  });
}

// Run the replacement function once the page has loaded
window.addEventListener('load', replaceAds);
