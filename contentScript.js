// contentScript.js

(() => {
  // Selectors for elements that might be ads.
  const adSelectors = [
    ".ad",
    ".ads",
    "[id^='ad-']",
    "[class*='ad-']",
    ".sponsored"
  ];

  /**
   * Creates an interactive widget to replace an ad element.
   * This widget fetches additional data from storage and provides interactive buttons.
   *
   * @returns {Element} The widget element.
   */
  function createInteractiveWidget() {
    // Default arrays for quotes and activity reminders.
    const defaultQuotes = [
      "Believe in yourself!",
      "You are capable of amazing things.",
      "Every day is a new beginning.",
      "Stay positive, work hard, make it happen.",
      "Your potential is endless."
    ];

    const defaultActivityReminders = [
      "Have you done your burpees today?",
      "Time for a quick stretch break!",
      "Drink water and stay hydrated!",
      "Remember to take a deep breath.",
      "Time for a mini dance break!"
    ];

    // Create the widget container.
    const widget = document.createElement("div");
    widget.className = "adfriend-widget";

    // Create a paragraph for the quote.
    const quotePara = document.createElement("p");
    quotePara.className = "adfriend-quote";

    // Create a paragraph for the activity reminder.
    const activityPara = document.createElement("p");
    activityPara.className = "adfriend-activity";

    // Create a container for the buttons.
    const buttonContainer = document.createElement("div");
    buttonContainer.className = "adfriend-buttons";

    // Create the "Refresh Quote" button.
    const refreshButton = document.createElement("button");
    refreshButton.className = "adfriend-refresh";
    refreshButton.textContent = "Refresh Quote";

    // Create the "Dismiss" button.
    const dismissButton = document.createElement("button");
    dismissButton.className = "adfriend-dismiss";
    dismissButton.textContent = "Dismiss";

    // Append buttons to the container.
    buttonContainer.appendChild(refreshButton);
    buttonContainer.appendChild(dismissButton);

    // Assemble the widget.
    widget.appendChild(quotePara);
    widget.appendChild(activityPara);
    widget.appendChild(buttonContainer);

    /**
     * Updates the widget content by fetching the quote(s) and activity reminders from chrome.storage.
     */
    function updateWidget() {
      chrome.storage.sync.get(["quotes", "activityReminders"], (result) => {
        let chosenQuote;
        // If an array of custom quotes exists, pick one randomly.
        if (result.quotes && Array.isArray(result.quotes) && result.quotes.length > 0) {
          chosenQuote = result.quotes[Math.floor(Math.random() * result.quotes.length)];
        } else {
          // Otherwise, use one of the default quotes.
          chosenQuote = defaultQuotes[Math.floor(Math.random() * defaultQuotes.length)];
        }
        quotePara.textContent = chosenQuote;

        let chosenReminder;
        // If an array of custom reminders exists, pick one randomly.
        if (result.activityReminders && Array.isArray(result.activityReminders) && result.activityReminders.length > 0) {
          chosenReminder = result.activityReminders[Math.floor(Math.random() * result.activityReminders.length)];
        } else {
          // Otherwise, use one of the default activity reminders.
          chosenReminder = defaultActivityReminders[Math.floor(Math.random() * defaultActivityReminders.length)];
        }
        activityPara.textContent = "Reminder: " + chosenReminder;
      });
    }

    // Initial update.
    updateWidget();

    // When "Refresh Quote" is clicked, update the widget with a new quote.
    refreshButton.addEventListener("click", updateWidget);

    // When "Dismiss" is clicked, remove the widget from view.
    dismissButton.addEventListener("click", () => {
      widget.remove();
    });

    return widget;
  }

  /**
   * Replaces an ad element with the interactive widget.
   * Uses a data attribute to ensure each element is processed only once.
   *
   * @param {Element} ad - The DOM element detected as an ad.
   */
  function replaceAdElement(ad) {
    // Avoid processing the same element multiple times.
    if (ad.dataset.adfriendProcessed === "true") return;
    ad.dataset.adfriendProcessed = "true";

    // Create and append the interactive widget.
    const widget = createInteractiveWidget();
    ad.innerHTML = "";
    ad.appendChild(widget);
  }

  /**
   * Processes a node and its descendants to find and replace ad elements.
   *
   * @param {Node} node - The DOM node to process.
   */
  function processNode(node) {
    if (node.nodeType !== Node.ELEMENT_NODE) return;

    // Check if the node itself matches any ad selectors.
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
   * Performs an initial pass over the document to replace any existing ad elements.
   */
  function initialReplace() {
    adSelectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(replaceAdElement);
    });
  }

  // Inject inline CSS styles for the widget and its interactive elements.
  const style = document.createElement("style");
  style.textContent = `
    .adfriend-widget {
      padding: 10px;
      background-color: #f0f8ff;
      border: 2px solid #007bff;
      text-align: center;
      font-weight: bold;
      white-space: pre-line;
      margin: 5px 0;
    }
    .adfriend-buttons {
      margin-top: 10px;
    }
    .adfriend-buttons button {
      margin: 0 5px;
      padding: 5px 10px;
      background-color: #007bff;
      color: #fff;
      border: none;
      cursor: pointer;
    }
    .adfriend-buttons button:hover {
      background-color: #0056b3;
    }
  `;
  document.head.appendChild(style);

  // Set up a MutationObserver to handle dynamically added ad elements.
  const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(processNode);
    });
  });
  const observerConfig = { childList: true, subtree: true };

  // When the page loads, perform the initial replacement and start observing for changes.
  window.addEventListener("load", () => {
    initialReplace();
    observer.observe(document.body, observerConfig);
  });
})();
