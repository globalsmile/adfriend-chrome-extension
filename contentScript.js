// contentScript.js

(() => {
  /***************************************
   * LOCAL DATA ARRAYS (50 items each)
   ***************************************/
  // Create a local array of 50 quotes by repeating 10 base quotes 5 times.
  const baseQuotes = [
    { q: "The best way to predict the future is to create it.", a: "Peter Drucker" },
    { q: "Believe you can and you're halfway there.", a: "Theodore Roosevelt" },
    { q: "Your time is limited, don't waste it living someone else's life.", a: "Steve Jobs" },
    { q: "The only limit to our realization of tomorrow is our doubts of today.", a: "Franklin D. Roosevelt" },
    { q: "The purpose of our lives is to be happy.", a: "Dalai Lama" },
    { q: "Life is what happens when you're busy making other plans.", a: "John Lennon" },
    { q: "Get busy living or get busy dying.", a: "Stephen King" },
    { q: "You only live once, but if you do it right, once is enough.", a: "Mae West" },
    { q: "Many of life's failures are people who did not realize how close they were to success when they gave up.", a: "Thomas A. Edison" },
    { q: "If life were predictable it would cease to be life, and be without flavor.", a: "Eleanor Roosevelt" }
  ];
  const localQuotes = [];
  for (let i = 0; i < 5; i++) {
    localQuotes.push(...baseQuotes);
  }

  // Create a local array of 50 words for Word of the Day by repeating 10 base words 5 times.
  const baseWords = ["Future", "Believe", "Time", "Limit", "Purpose", "Life", "Success", "Happiness", "Dream", "Courage"];
  const localWords = [];
  for (let i = 0; i < 5; i++) {
    localWords.push(...baseWords);
  }

  // Base URL for your backend API endpoints.
  const API_BASE_URL = 'https://adfriend-chrome-extension-backend.onrender.com';

  // Selectors to detect ad elements.
  const adSelectors = [".ad", ".ads", "[id^='ad-']", "[class*='ad-']", ".sponsored"];

  /***************************************
   * GAMIFICATION & ANALYTICS UTILITY
   ***************************************/
  function addPoints(points) {
    chrome.storage.local.get({ points: 0 }, (result) => {
      const newPoints = result.points + points;
      chrome.storage.local.set({ points: newPoints }, updatePointsDisplay);
    });
  }

  function updatePointsDisplay() {
    document.querySelectorAll(".adfriend-points").forEach((span) => {
      chrome.storage.local.get({ points: 0 }, (result) => {
        span.textContent = "Points: " + result.points;
      });
    });
  }

  // Logs an analytics event by sending it to the backend API.
  function logAnalytics(eventType) {
    const data = {
      action: eventType,
      timestamp: new Date().toISOString()
    };

    fetch(`${API_BASE_URL}/analytics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to send analytics event');
        }
        console.log(`Analytics event sent: ${eventType}`);
      })
      .catch((error) => {
        console.error('Error sending analytics event:', error);
      });
  }

  /***************************************
   * DYNAMIC WIDGET WITH NOTIFICATIONS & AUTO-REFRESH
   ***************************************/
  function createDynamicWidget() {
    // Create main container and add entry animation.
    const widget = document.createElement("div");
    widget.className = "adfriend-widget fade-in";

    // Create header: widget type selector & points display.
    const header = document.createElement("div");
    header.className = "adfriend-header";

    const widgetSelect = document.createElement("select");
    widgetSelect.className = "adfriend-widget-type";
    ["Motivational Quote", "To-Do List", "Breathing Exercise", "Word of the Day"].forEach((option) => {
      const opt = document.createElement("option");
      opt.value = option;
      opt.textContent = option;
      widgetSelect.appendChild(opt);
    });

    const pointsDisplay = document.createElement("span");
    pointsDisplay.className = "adfriend-points";
    pointsDisplay.textContent = "Points: 0";

    header.appendChild(widgetSelect);
    header.appendChild(pointsDisplay);
    widget.appendChild(header);

    // Create a notification container (for in-widget notifications).
    const notificationContainer = document.createElement("div");
    notificationContainer.className = "adfriend-notification";
    widget.appendChild(notificationContainer);

    // Create content container.
    const contentContainer = document.createElement("div");
    contentContainer.className = "adfriend-content";
    widget.appendChild(contentContainer);

    // Create button container with Refresh, Dismiss, and Share.
    const buttonContainer = document.createElement("div");
    buttonContainer.className = "adfriend-buttons";

    const refreshButton = document.createElement("button");
    refreshButton.textContent = "Refresh";

    const dismissButton = document.createElement("button");
    dismissButton.textContent = "Dismiss";

    const shareButton = document.createElement("button");
    shareButton.textContent = "Share";

    buttonContainer.appendChild(refreshButton);
    buttonContainer.appendChild(dismissButton);
    buttonContainer.appendChild(shareButton);
    widget.appendChild(buttonContainer);

    /***************************************
     * NOTIFICATIONS & REMINDERS FEATURE
     ***************************************/
    function showNotification(message) {
      notificationContainer.textContent = message;
      notificationContainer.classList.add("show");
      setTimeout(() => {
        notificationContainer.classList.remove("show");
      }, 5000);
    }

    const reminderInterval = 60000; // 60 sec.
    const reminderTimer = setInterval(() => {
      showNotification("Don't forget to check today's challenge!");
    }, reminderInterval);

    // Auto-refresh: When in "Motivational Quote" mode, refresh content every 5 minutes.
    const autoRefreshInterval = 300000; // 5 minutes in ms.
    const autoRefreshTimer = setInterval(() => {
      if (widgetSelect.value === "Motivational Quote") {
        updateContent();
        logAnalytics("auto-refresh");
        showNotification("Content auto-refreshed!");
      }
    }, autoRefreshInterval);

    widget.addEventListener("remove", () => {
      clearInterval(reminderTimer);
      clearInterval(autoRefreshTimer);
    });

    /***************************************
     * CONTENT UPDATE FUNCTION
     ***************************************/
    function updateContent() {
      const type = widgetSelect.value;
      contentContainer.innerHTML = ""; // Clear previous content.

      if (type === "Motivational Quote") {
        // Choose one random quote from the localQuotes array.
        const randomIndex = Math.floor(Math.random() * localQuotes.length);
        const quoteObj = localQuotes[randomIndex];
        const quoteText = quoteObj.q;
        const quoteAuthor = quoteObj.a;
        const quoteP = document.createElement("p");
        quoteP.textContent = `"${quoteText}" - ${quoteAuthor}`;
        contentContainer.appendChild(quoteP);
      } else if (type === "To-Do List") {
        const input = document.createElement("input");
        input.placeholder = "Add a task";
        const addButton = document.createElement("button");
        addButton.textContent = "Add";
        const list = document.createElement("ul");

        addButton.addEventListener("click", () => {
          if (input.value.trim() !== "") {
            const li = document.createElement("li");
            li.textContent = input.value;
            const completeButton = document.createElement("button");
            completeButton.textContent = "Complete";
            completeButton.addEventListener("click", () => {
              li.style.textDecoration = "line-through";
              addPoints(5);
            });
            li.appendChild(completeButton);
            list.appendChild(li);
            input.value = "";
          }
        });

        contentContainer.appendChild(input);
        contentContainer.appendChild(addButton);
        contentContainer.appendChild(list);
      } else if (type === "Breathing Exercise") {
        const instruction = document.createElement("p");
        instruction.textContent = "Follow the pattern: Inhale (4 sec), Hold (4 sec), Exhale (4 sec).";
        contentContainer.appendChild(instruction);

        const startButton = document.createElement("button");
        startButton.textContent = "Start Exercise";
        startButton.addEventListener("click", () => {
          let countdown = 12;
          instruction.textContent = "Exercise started...";
          const interval = setInterval(() => {
            countdown--;
            instruction.textContent = `Keep breathing... ${countdown} sec remaining`;
            if (countdown <= 0) {
              clearInterval(interval);
              instruction.textContent = "Great job! Exercise complete.";
              addPoints(10);
            }
          }, 1000);
        });
        contentContainer.appendChild(startButton);
      } else if (type === "Word of the Day") {
        // Pick a random word from the localWords array.
        const randomIndex = Math.floor(Math.random() * localWords.length);
        const word = localWords[randomIndex];
        const wordP = document.createElement("p");
        wordP.textContent = "Word of the Day: " + word;
        contentContainer.appendChild(wordP);
      }
      updatePointsDisplay();
    }

    widgetSelect.addEventListener("change", updateContent);

    refreshButton.addEventListener("click", () => {
      updateContent();
      addPoints(1);
      logAnalytics("refresh");
      widget.classList.remove("fade-in");
      void widget.offsetWidth;
      widget.classList.add("fade-in");
      showNotification("Content refreshed!");
    });

    dismissButton.addEventListener("click", () => {
      logAnalytics("dismiss");
      widget.classList.add("fade-out");
      setTimeout(() => widget.remove(), 500);
    });

    shareButton.addEventListener("click", () => {
      const contentText = contentContainer.textContent;
      const tweetText = encodeURIComponent(`Check out this content: "${contentText}"`);
      const tweetUrl = `https://twitter.com/intent/tweet?text=${tweetText}`;
      window.open(tweetUrl, "_blank");
      addPoints(2);
      logAnalytics("share");
      showNotification("Thanks for sharing!");
    });

    // Initial content load.
    updateContent();
    updatePointsDisplay();

    return widget;
  }

  /***************************************
   * REPLACE AD ELEMENTS WITH THE WIDGET
   ***************************************/
  function replaceAdElement(ad) {
    if (ad.dataset.adfriendProcessed === "true") return;
    ad.dataset.adfriendProcessed = "true";
    const widget = createDynamicWidget();
    ad.innerHTML = "";
    ad.appendChild(widget);
  }

  function processNode(node) {
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    adSelectors.forEach((selector) => {
      if (node.matches(selector)) replaceAdElement(node);
    });
    adSelectors.forEach((selector) => {
      node.querySelectorAll(selector).forEach(replaceAdElement);
    });
  }

  function initialReplace() {
    adSelectors.forEach((selector) => {
      document.querySelectorAll(selector).forEach(replaceAdElement);
    });
  }

  /***************************************
   * CSS INJECTION
   ***************************************/
  const style = document.createElement("style");
  style.textContent = `
    .adfriend-widget {
      padding: 10px;
      border: 2px solid #007bff;
      text-align: center;
      font-weight: bold;
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
    .adfriend-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }
    .adfriend-notification {
      font-size: 13px;
      color: #fff;
      background: #28a745;
      padding: 5px;
      margin: 5px 0;
      border-radius: 3px;
      opacity: 0;
      transition: opacity 0.5s ease;
    }
    .adfriend-notification.show {
      opacity: 1;
    }
    .adfriend-content {
      margin-bottom: 10px;
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
    .adfriend-widget-type {
      font-size: 14px;
      padding: 3px;
    }
    .adfriend-points {
      font-size: 14px;
      font-weight: bold;
    }
  `;
  document.head.appendChild(style);

  /***************************************
   * OBSERVER SETUP
   ***************************************/
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
