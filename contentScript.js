// contentScript.js

(() => {
  // Define selectors that might indicate an ad element.
  const adSelectors = [
    ".ad",
    ".ads",
    "[id^='ad-']",
    "[class*='ad-']",
    ".sponsored"
  ];

  /**
   * Replaces an ad element with a positive widget.
   * Uses a data attribute to ensure each element is processed only once.
   *
   * @param {Element} ad - The DOM element detected as an ad.
   */
  function replaceAdElement(ad) {
    // Avoid reprocessing the same element.
    if (ad.dataset.adfriendProcessed === "true") {
      return;
    }
    ad.dataset.adfriendProcessed = "true";

    // Create a widget container.
    const widget = document.createElement("div");
    widget.className = "adfriend-widget";

    // Retrieve user settings (quote and activity reminder) from chrome.storage.
    chrome.storage.sync.get(['quote', 'activityReminder'], (result) => {
      let content = "";
      // Use the custom quote if available; otherwise, fallback to a default message.
      content += result.quote ? result.quote : "Stay Positive! 😊";
      // Append the activity reminder if set.
      if (result.activityReminder) {
        content += "\nReminder: " + result.activityReminder;
      }
      widget.textContent = content;
    });

    // Replace the content of the ad element with the widget.
    ad.innerHTML = "";
    ad.appendChild(widget);
  }

  /**
   * Processes a node to detect if it (or its descendants) matches any ad selectors.
   *
   * @param {Node} node - The DOM node to process.
   */
  function processNode(node) {
    // Only process element nodes.
    if (node.nodeType !== Node.ELEMENT_NODE) return;

    // Check if the node itself is an ad.
    adSelectors.forEach(selector => {
      if (node.matches(selector)) {
        replaceAdElement(node);
      }
    });

    // Also check its child elements.
    adSelectors.forEach(selector => {
      node.querySelectorAll(selector).forEach(replaceAdElement);
    });
  }

  /**
   * Performs an initial pass on the document to replace any ad elements already present.
   */
  function initialReplace() {
    adSelectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(replaceAdElement);
    });
  }

  // Inject inline CSS styles for the widget.
  const style = document.createElement("style");
  style.textContent = `
    .adfriend-widget {
      padding: 10px;
      background-color: #f0f8ff;
      border: 2px solid #007bff;
      text-align: center;
      font-weight: bold;
      white-space: pre-line;
    }
  `;
  document.head.appendChild(style);

  // Set up a MutationObserver to detect dynamically added nodes.
  const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(processNode);
    });
  });

  // Observer configuration: watch for added nodes in the entire subtree.
  const observerConfig = { childList: true, subtree: true };

  // When the window loads, run the initial ad replacement and start observing.
  window.addEventListener("load", () => {
    initialReplace();
    observer.observe(document.body, observerConfig);
  });
})();
