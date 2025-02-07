// contentScript.js

(() => {
  // Selectors to detect ad elements
  const adSelectors = [".ad", ".ads", "[id^='ad-']", "[class*='ad-']", ".sponsored"];

  /***************************************
   * GAMIFICATION UTILITY
   ***************************************/
  // Adds points to the user's score
  function addPoints(points) {
    chrome.storage.local.get({ points: 0 }, (result) => {
      const newPoints = result.points + points;
      chrome.storage.local.set({ points: newPoints }, updatePointsDisplay);
    });
  }

  // Updates all points displays (each widget might show the points)
  function updatePointsDisplay() {
    document.querySelectorAll(".adfriend-points").forEach((span) => {
      chrome.storage.local.get({ points: 0 }, (result) => {
        span.textContent = "Points: " + result.points;
      });
    });
  }

  /***************************************
   * DYNAMIC WIDGET CREATION
   ***************************************/
  function createDynamicWidget() {
    // Create main container and add entry animation class
    const widget = document.createElement("div");
    widget.className = "adfriend-widget fade-in";

    // Create header with widget type selector and points display
    const header = document.createElement("div");
    header.className = "adfriend-header";

    // Create a select element for widget mode
    const widgetSelect = document.createElement("select");
    widgetSelect.className = "adfriend-widget-type";
    const widgetOptions = ["Motivational Quote", "To-Do List", "Breathing Exercise", "Word of the Day"];
    widgetOptions.forEach((option) => {
      const opt = document.createElement("option");
      opt.value = option;
      opt.textContent = option;
      widgetSelect.appendChild(opt);
    });

    // Create points display
    const pointsDisplay = document.createElement("span");
    pointsDisplay.className = "adfriend-points";
    pointsDisplay.textContent = "Points: 0";

    // Assemble header
    header.appendChild(widgetSelect);
    header.appendChild(pointsDisplay);
    widget.appendChild(header);

    // Create content container (will be populated based on mode)
    const contentContainer = document.createElement("div");
    contentContainer.className = "adfriend-content";
    widget.appendChild(contentContainer);

    // Create button container with Refresh, Dismiss, and Share buttons
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
     * CONTENT UPDATE FUNCTION
     ***************************************/
    // Updates contentContainer based on the selected widget type
    function updateContent() {
      const type = widgetSelect.value;
      contentContainer.innerHTML = ""; // Clear previous content

      if (type === "Motivational Quote") {
        // Fetch a random quote using the Quotable API
        fetch("https://api.quotable.io/random")
          .then((response) => response.json())
          .then((data) => {
            const quoteP = document.createElement("p");
            quoteP.textContent = data.content || "Keep pushing forward!";
            contentContainer.appendChild(quoteP);
          })
          .catch((err) => {
            const quoteP = document.createElement("p");
            quoteP.textContent = "Believe in yourself!";
            contentContainer.appendChild(quoteP);
          });
      } else if (type === "To-Do List") {
        // Build a mini to-do list interface
        const input = document.createElement("input");
        input.placeholder = "Add a task";
        const addButton = document.createElement("button");
        addButton.textContent = "Add";
        const list = document.createElement("ul");

        addButton.addEventListener("click", () => {
          if (input.value.trim() !== "") {
            const li = document.createElement("li");
            li.textContent = input.value;
            // Add a "Complete" button for each task
            const completeButton = document.createElement("button");
            completeButton.textContent = "Complete";
            completeButton.addEventListener("click", () => {
              li.style.textDecoration = "line-through";
              addPoints(5); // Award 5 points for completing a task
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
        // Show breathing exercise instructions and a start button
        const instruction = document.createElement("p");
        instruction.textContent = "Follow the pattern: Inhale (4 sec), Hold (4 sec), Exhale (4 sec).";
        contentContainer.appendChild(instruction);

        const startButton = document.createElement("button");
        startButton.textContent = "Start Exercise";
        startButton.addEventListener("click", () => {
          let countdown = 12; // Total exercise duration (in seconds)
          instruction.textContent = "Exercise started...";
          const interval = setInterval(() => {
            countdown--;
            instruction.textContent = `Keep breathing... ${countdown} sec remaining`;
            if (countdown <= 0) {
              clearInterval(interval);
              instruction.textContent = "Great job! Exercise complete.";
              addPoints(10); // Award 10 points for finishing exercise
            }
          }, 1000);
        });
        contentContainer.appendChild(startButton);
      } else if (type === "Word of the Day") {
        // Simulate a word-of-the-day by fetching a random quote and using its first word
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
          .catch((err) => {
            const wordP = document.createElement("p");
            wordP.textContent = "Word of the Day: Serendipity";
            contentContainer.appendChild(wordP);
          });
      }

      // Refresh the points display after updating content
      updatePointsDisplay();
    }

    /***************************************
     * EVENT BINDINGS
     ***************************************/
    // When the widget type changes, update content.
    widgetSelect.addEventListener("change", updateContent);

    // Refresh button re-loads current widget content and awards 1 point.
    refreshButton.addEventListener("click", () => {
      updateContent();
      addPoints(1);
      widget.classList.remove("fade-in");
      void widget.offsetWidth; // force reflow to restart animation
      widget.classList.add("fade-in");
    });

    // Dismiss button triggers fade-out animation and removes widget.
    dismissButton.addEventListener("click", () => {
      widget.classList.add("fade-out");
      setTimeout(() => widget.remove(), 500);
    });

    // Share button opens a pre-populated tweet and awards 2 points.
    shareButton.addEventListener("click", () => {
      const contentText = contentContainer.textContent;
      const tweetText = encodeURIComponent(`Check out this content: "${contentText}"`);
      const tweetUrl = `https://twitter.com/intent/tweet?text=${tweetText}`;
      window.open(tweetUrl, "_blank");
      addPoints(2);
    });

    // Initial content load
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
      if (node.matches(selector)) {
        replaceAdElement(node);
      }
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
