// options/index.jsx

import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import './style.css';

const App = () => {
  // States to hold the textarea content for quotes and reminders.
  const [quotesText, setQuotesText] = useState('');
  const [remindersText, setRemindersText] = useState('');

  // Load stored arrays from chrome.storage and convert them to newline-separated strings.
  useEffect(() => {
    chrome.storage.sync.get(['quotes', 'activityReminders'], (result) => {
      if (result.quotes && Array.isArray(result.quotes)) {
        setQuotesText(result.quotes.join('\n'));
      }
      if (result.activityReminders && Array.isArray(result.activityReminders)) {
        setRemindersText(result.activityReminders.join('\n'));
      }
    });
  }, []);

  const handleSave = () => {
    // Convert textarea input into arrays by splitting on newlines and filtering out empty lines.
    const quotesArray = quotesText
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s !== '');
    const remindersArray = remindersText
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s !== '');

    // Save the arrays to chrome.storage.
    chrome.storage.sync.set(
      { quotes: quotesArray, activityReminders: remindersArray },
      () => {
        alert('Settings saved!');
      }
    );
  };

  return (
    <div className="app">
      <h1>AdFriend Settings</h1>
      <div className="form-group">
        <label htmlFor="quotes">Motivational Quotes (one per line):</label>
        <textarea
          id="quotes"
          value={quotesText}
          onChange={(e) => setQuotesText(e.target.value)}
          rows="6"
          placeholder="Enter one quote per line..."
        ></textarea>
      </div>
      <div className="form-group">
        <label htmlFor="reminders">Activity Reminders (one per line):</label>
        <textarea
          id="reminders"
          value={remindersText}
          onChange={(e) => setRemindersText(e.target.value)}
          rows="6"
          placeholder="Enter one reminder per line..."
        ></textarea>
      </div>
      <button onClick={handleSave}>Save</button>
    </div>
  );
};

ReactDOM.render(<App />, document.getElementById('root'));
