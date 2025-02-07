// options/index.jsx

import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import './style.css';

const App = () => {
  // State variables for settings.
  const [theme, setTheme] = useState('light');
  const [autoRefreshInterval, setAutoRefreshInterval] = useState('0');
  const [dailyMode, setDailyMode] = useState(false);
  const [preferredCategory, setPreferredCategory] = useState('inspirational');
  const [inspirationalQuotes, setInspirationalQuotes] = useState('');
  const [humorousQuotes, setHumorousQuotes] = useState('');
  const [fitnessQuotes, setFitnessQuotes] = useState('');
  const [activityReminders, setActivityReminders] = useState('');

  // Load stored settings from chrome.storage.sync.
  useEffect(() => {
    chrome.storage.sync.get(
      ['theme', 'autoRefreshInterval', 'dailyMode', 'preferredCategory', 'quotes', 'activityReminders'],
      (result) => {
        if (result.theme) setTheme(result.theme);
        if (result.autoRefreshInterval) setAutoRefreshInterval(result.autoRefreshInterval.toString());
        if (typeof result.dailyMode === 'boolean') setDailyMode(result.dailyMode);
        if (result.preferredCategory) setPreferredCategory(result.preferredCategory);
        if (result.quotes && typeof result.quotes === 'object') {
          if (result.quotes.inspirational) setInspirationalQuotes(result.quotes.inspirational.join('\n'));
          if (result.quotes.humorous) setHumorousQuotes(result.quotes.humorous.join('\n'));
          if (result.quotes.fitness) setFitnessQuotes(result.quotes.fitness.join('\n'));
        }
        if (result.activityReminders && Array.isArray(result.activityReminders)) {
          setActivityReminders(result.activityReminders.join('\n'));
        }
      }
    );
  }, []);

  const handleSave = () => {
    // Build quotes object from textareas.
    const quotes = {
      inspirational: inspirationalQuotes.split('\n').map(line => line.trim()).filter(line => line !== ''),
      humorous: humorousQuotes.split('\n').map(line => line.trim()).filter(line => line !== ''),
      fitness: fitnessQuotes.split('\n').map(line => line.trim()).filter(line => line !== ''),
    };

    // Build reminders array.
    const remindersArray = activityReminders.split('\n').map(line => line.trim()).filter(line => line !== '');

    chrome.storage.sync.set(
      {
        theme,
        autoRefreshInterval: parseInt(autoRefreshInterval, 10) || 0,
        dailyMode,
        preferredCategory,
        quotes,
        activityReminders: remindersArray,
      },
      () => {
        alert('Settings saved successfully!');
      }
    );
  };

  return (
    <div className="app">
      <h1>AdFriend Settings</h1>

      <div className="form-group">
        <label htmlFor="theme">Theme:</label>
        <select id="theme" value={theme} onChange={(e) => setTheme(e.target.value)}>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
          <option value="colorful">Colorful</option>
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="autoRefreshInterval">Auto-Refresh Interval (seconds):</label>
        <input
          id="autoRefreshInterval"
          type="number"
          value={autoRefreshInterval}
          onChange={(e) => setAutoRefreshInterval(e.target.value)}
          placeholder="0 for no auto-refresh"
        />
      </div>

      <div className="form-group">
        <label htmlFor="dailyMode">
          <input
            id="dailyMode"
            type="checkbox"
            checked={dailyMode}
            onChange={(e) => setDailyMode(e.target.checked)}
          />
          Enable Daily Quote Mode
        </label>
      </div>

      <div className="form-group">
        <label htmlFor="preferredCategory">Preferred Quote Category:</label>
        <select
          id="preferredCategory"
          value={preferredCategory}
          onChange={(e) => setPreferredCategory(e.target.value)}
        >
          <option value="inspirational">Inspirational</option>
          <option value="humorous">Humorous</option>
          <option value="fitness">Fitness</option>
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="inspirationalQuotes">Inspirational Quotes (one per line):</label>
        <textarea
          id="inspirationalQuotes"
          value={inspirationalQuotes}
          onChange={(e) => setInspirationalQuotes(e.target.value)}
          rows="6"
          placeholder="Enter one quote per line..."
        ></textarea>
      </div>

      <div className="form-group">
        <label htmlFor="humorousQuotes">Humorous Quotes (one per line):</label>
        <textarea
          id="humorousQuotes"
          value={humorousQuotes}
          onChange={(e) => setHumorousQuotes(e.target.value)}
          rows="6"
          placeholder="Enter one humorous quote per line..."
        ></textarea>
      </div>

      <div className="form-group">
        <label htmlFor="fitnessQuotes">Fitness Quotes (one per line):</label>
        <textarea
          id="fitnessQuotes"
          value={fitnessQuotes}
          onChange={(e) => setFitnessQuotes(e.target.value)}
          rows="6"
          placeholder="Enter one fitness quote per line..."
        ></textarea>
      </div>

      <div className="form-group">
        <label htmlFor="activityReminders">Activity Reminders (one per line):</label>
        <textarea
          id="activityReminders"
          value={activityReminders}
          onChange={(e) => setActivityReminders(e.target.value)}
          rows="6"
          placeholder="Enter one reminder per line..."
        ></textarea>
      </div>

      <button onClick={handleSave}>Save Settings</button>
    </div>
  );
};

ReactDOM.render(<App />, document.getElementById('root'));
