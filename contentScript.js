// contentScript.js

(() => {
  // Selectors for potential ad elements.
  const adSelectors = [".ad", ".ads", "[id^='ad-']", "[class*='ad-']", ".sponsored"];

  // Default quotes by category.
  const defaultQuotes = {
    inspirational: [
      "Believe in yourself!",
      "You are capable of amazing things.",
      "Every day is a new beginning.",
      "Stay positive, work hard, make it happen.",
      "Your potential is endless."
    ],
    humorous: [
      "Keep smiling, life is a joke anyway!",
      "Laughter is the best medicine.",
      "Smile, it confuses people.",
      "If you can't laugh at yourself, call me and I'll laugh at you."
    ],
    fitness: [
      "No pain, no gain!",
      "Sweat is just fat crying.",
      "Push yourself because no one else is going to do it for you.",
      "Your body can stand almost anything. It’s your mind that you have to convince."
    ]
  };

  // Default activity reminders.
  const defaultActivityReminders = [
    "Have you done your burpees today?",
    "Time for a quick stretch break!",
    "Drink water and stay hydrated!",
    "Remember to take a deep breath.",
    "Time for a mini dance break!"
  ];

  // Utility: Get current date string (YYYY-MM-DD).
  function getCurrentDateStr() {
    const now = new Date();
    return now.toISOString().split("T")[0];
  }

  // Analytics logging.
  function logAnalytics(eventType) {
    chrome.storage.local.get(["analytics"], (result) => {
      const analytics = result.analytics || { refresh: 0, dismiss: 0, share: 0 };
      analytics[eventType] = (analytics[eventType] || 0) + 1;
      chrome.storage.local.set({ analytics });
    });
  }

  // Create an interactive widget.
  function createInteractiveWidget() {
    // Create widget container.
    const widget = document.createElement("div");
    widget.className = "adfriend-widget fade-in"; // "fade-in" triggers the entry animation.

    // Create elements.
    const quotePara = document.createElement("p");
    quotePara.className = "adfriend-quote";

    const activityPara = document.createElement("p");
    activityPara.className = "adfriend-activity";

    // Button container.
    const buttonContainer = document.createElement("div");
    buttonContainer.className = "adfriend-buttons";

    const refreshButton = document.createElement("button");
    refreshButton.className = "adfriend-refresh";
    refreshButton.textContent = "Refresh Quote";

    const dismissButton = document.createElement("button");
    dismissButton.className = "adfriend-dismiss";
    dismissButton.textContent = "Dismiss";

    const shareButton = document.createElement("button");
    shareButton.className = "adfriend-share";
    shareButton.textContent = "Share";

    // Assemble buttons.
    buttonContainer.appendChild(refreshButton);
    buttonContainer.appendChild(dismissButton);
    buttonContainer.appendChild(shareButton);

    // Assemble widget.
    widget.appendChild(quotePara);
    widget.appendChild(activityPara);
    widget.appendChild(buttonContainer);

    // Auto-refresh timer variable.
    let autoRefreshTimer = null;

    // Update widget content.
    function updateWidget() {
      // Clear previous timer.
      if (autoRefreshTimer) clearInterval(autoRefreshTimer);

      chrome.storage.sync.get(
        [
          "quotes",
          "activityReminders",
          "theme",
          "autoRefreshInterval",
          "dailyMode",
          "preferredCategory"
        ],
        (result) => {
          // Apply theme.
          const theme = result.theme || "light";
          widget.classList.remove("light", "dark", "colorful");
          widget.classList.add(theme);

          // Determine auto-refresh interval (in seconds).
          const intervalSeconds = parseInt(result.autoRefreshInterval, 10) || 0;

          // Determine which quote to show.
          let quotesData = result.quotes;
          let chosenQuote = "";

          // If quotesData is an object (category‑based) and a preferred category is set.
          if (quotesData && typeof quotesData === "object" && !Array.isArray(quotesData)) {
            const preferredCategory = result.preferredCategory || "inspirational";
            const categoryQuotes =
              quotesData[preferredCategory] ||
              defaultQuotes[preferredCategory] ||
              defaultQuotes["inspirational"];
            chosenQuote = categoryQuotes[Math.floor(Math.random() * categoryQuotes.length)];
          } else if (quotesData && Array.isArray(quotesData) && quotesData.length > 0) {
            chosenQuote = quotesData[Math.floor(Math.random() * quotesData.length)];
          } else {
            // Fallback to default inspirational quotes.
            const defaultArr = defaultQuotes["inspirational"];
            chosenQuote = defaultArr[Math.floor(Math.random() * defaultArr.length)];
          }

          // Daily mode: if enabled, use the same quote for the day.
          if (result.dailyMode) {
            const todayStr = getCurrentDateStr();
            chrome.storage.local.get(["dailyQuote", "dailyQuoteDate"], (localResult) => {
              if (localResult.dailyQuote && localResult.dailyQuoteDate === todayStr) {
                chosenQuote = localResult.dailyQuote;
              } else {
                chrome.storage.local.set({ dailyQuote: chosenQuote, dailyQuoteDate: todayStr });
              }
              quotePara.textContent = chosenQuote;
            });
          } else {
            quotePara.textContent = chosenQuote;
          }

          // Activity reminder.
          let remindersData = result.activityReminders;
          let chosenReminder = "";
          if (remindersData && Array.isArray(remindersData) && remindersData.length > 0) {
            chosenReminder = remindersData[Math.floor(Math.random() * remindersData.length)];
          } else {
            chosenReminder = defaultActivityReminders[Math.floor(Math.random() * defaultActivityReminders.length)];
          }
          activityPara.textContent = "Reminder: " + chosenReminder;

          // Set auto-refresh timer if interval > 0.
          if (intervalSeconds > 0) {
            autoRefreshTimer = setInterval(() => {
              updateWidget();
              logAnalytics("refresh");
            }, intervalSeconds * 1000);
          }
        }
      );
    }

    // Bind events.
    refreshButton.addEventListener("click", () => {
      updateWidget();
      logAnalytics("refresh");
      // Trigger a refresh animation.
      widget.classList.remove("fade-in");
      void widget.offsetWidth; // force reflow
      widget.classList.add("fade-in");
    });

    dismissButton.addEventListener("click", () => {
      widget.classList.add("fade-out");
      setTimeout(() => widget.remove(), 500); // match animation duration
      logAnalytics("dismiss");
    });

    shareButton.addEventListener("click", () => {
      const tweetText = encodeURIComponent(`Check out this motivational quote: "${quotePara.textContent}"`);
      const tweetUrl = `https://twitter.com/intent/tweet?text=${tweetText}`;
      window.open(tweetUrl, "_blank");
      logAnalytics("share");
    });

    // Initial update.
    updateWidget();

    return widget;
  }

  // Replace an ad element with our widget.
  function replaceAdElement(ad) {
    if (ad.dataset.adfriendProcessed === "true") return;
    ad.dataset.adfriendProcessed = "true";
    const widget = createInteractiveWidget();
    ad.innerHTML = "";
    ad.appendChild(widget);
  }

  // Process a node (and its descendants) to replace ads.
  function processNode(node) {
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    adSelectors.forEach((selector) => {
      if (node.matches(selector)) {
        replaceAdElement(node);
      }
    });
    adSelectors.forEach((selector) => {
      node.querySelectorAll(selector).forEach(replaceAdElement);
    });
  }

  // Initial replacement of ad elements.
  function initialReplace() {
    adSelectors.forEach((selector) => {
      document.querySelectorAll(selector).forEach(replaceAdElement);
    });
  }

  // Inject CSS styles.
  const style = document.createElement("style");
  style.textContent = `
    .adfriend-widget {
      padding: 10px;
      border: 2px solid;
      text-align: center;
      font-weight: bold;
      white-space: pre-line;
      margin: 5px 0;
      transition: opacity 0.5s ease, transform 0.5s ease;
    }
    .adfriend-widget.fade-in {
      opacity: 1;
      transform: translateY(0);
    }
    .adfriend-widget.fade-out {
      opacity: 0;
      transform: translateY(-20px);
    }
    /* Theming */
    .adfriend-widget.light {
      background-color: #f0f8ff;
      color: #000;
      border-color: #007bff;
    }
    .adfriend-widget.dark {
      background-color: #333;
      color: #fff;
      border-color: #555;
    }
    .adfriend-widget.colorful {
      background: linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%);
      color: #333;
      border-color: #ff6f61;
    }
    .adfriend-quote {
      margin: 0 0 10px 0;
      font-size: 16px;
    }
    .adfriend-activity {
      margin: 0 0 10px 0;
      font-size: 14px;
    }
    .adfriend-buttons button {
      margin: 0 5px;
      padding: 5px 10px;
      background-color: #007bff;
      color: #fff;
      border: none;
      cursor: pointer;
      border-radius: 3px;
      transition: background-color 0.3s ease;
    }
    .adfriend-buttons button:hover {
      background-color: #0056b3;
    }
  `;
  document.head.appendChild(style);

  // Set up a MutationObserver for dynamically loaded content.
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach(processNode);
    });
  });
  const observerConfig = { childList: true, subtree: true };

  window.addEventListener("load", () => {
    initialReplace();
    observer.observe(document.body, observerConfig);
  });
})();
