// contentScript.js

(() => {
  // Selectors to detect ad elements.
  const adSelectors = [".ad", ".ads", "[id^='ad-']", "[class*='ad-']", ".sponsored"];

  /***************************************
   * GAMIFICATION UTILITY (existing code)
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

  /***************************************
   * DYNAMIC WIDGET WITH NOTIFICATIONS
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
    // Function to show an in-widget notification.
    function showNotification(message) {
      notificationContainer.textContent = message;
      notificationContainer.classList.add("show");
      // Automatically hide the notification after 5 seconds.
      setTimeout(() => {
        notificationContainer.classList.remove("show");
      }, 5000);
    }

    // Schedule a periodic reminder notification (e.g., every 60 seconds).
    const notificationInterval = 60000; // 60,000 ms = 60 sec.
    const notificationTimer = setInterval(() => {
      // You can change the message based on context or randomize it.
      showNotification("Don't forget to check today's challenge!");
    }, notificationInterval);

    // Ensure the notification timer is cleared if the widget is dismissed.
    widget.addEventListener("remove", () => {
      clearInterval(notificationTimer);
    });

    /***************************************
     * CONTENT UPDATE FUNCTION (existing modes)
     ***************************************/
    function updateContent() {
      const type = widgetSelect.value;
      contentContainer.innerHTML = ""; // Clear previous content.

      if (type === "Motivational Quote") {
        fetch("https://api.quotable.io/random")
          .then((response) => response.json())
          .then((data) => {
            const quoteP = document.createElement("p");
            quoteP.textContent = data.content || "Keep pushing forward!";
            contentContainer.appendChild(quoteP);
          })
          .catch(() => {
            const quoteP = document.createElement("p");
            quoteP.textContent = "Believe in yourself!";
            contentContainer.appendChild(quoteP);
          });
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
              addPoints(5); // Award points.
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
        fetch("https://api.quotable.io/random")
          .then((response) => response.json())
          .then((data) => {
            const word = data.content.split(" ")[0] || "Serendipity";
            const wordP = document.createElement("p");
            wordP.textContent = "Word of the Day: " + word;
            const defP = document.createElement("p");
            defP.textContent = "Definition: (Definition not available.)";
            contentContainer.appendChild(wordP);
            contentContainer.appendChild(defP);
          })
          .catch(() => {
            const wordP = document.createElement("p");
            wordP.textContent = "Word of the Day: Serendipity";
            contentContainer.appendChild(wordP);
          });
      }

      // Refresh points display after updating.
      updatePointsDisplay();
    }

    /***************************************
     * EVENT BINDINGS
     ***************************************/
    widgetSelect.addEventListener("change", updateContent);

    refreshButton.addEventListener("click", () => {
      updateContent();
      addPoints(1);
      widget.classList.remove("fade-in");
      void widget.offsetWidth; // force reflow for animation
      widget.classList.add("fade-in");
      showNotification("Content refreshed!");
    });

    dismissButton.addEventListener("click", () => {
      widget.classList.add("fade-out");
      setTimeout(() => widget.remove(), 500);
    });

    shareButton.addEventListener("click", () => {
      const contentText = contentContainer.textContent;
      const tweetText = encodeURIComponent(`Check out this content: "${contentText}"`);
      const tweetUrl = `https://twitter.com/intent/tweet?text=${tweetText}`;
      window.open(tweetUrl, "_blank");
      addPoints(2);
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
