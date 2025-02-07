import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import './style.css';

const App = () => {
  const [quote, setQuote] = useState('');

  // Load the saved quote from chrome.storage
  useEffect(() => {
    chrome.storage.sync.get(['quote'], (result) => {
      if (result.quote) {
        setQuote(result.quote);
      }
    });
  }, []);

  const handleChange = (e) => {
    setQuote(e.target.value);
  };

  const handleSave = () => {
    chrome.storage.sync.set({ quote: quote }, () => {
      alert('Settings saved!');
    });
  };

  return (
    <div className="app">
      <h1>AdFriend Settings</h1>
      <label>
        Custom Motivational Quote:
        <input type="text" value={quote} onChange={handleChange} />
      </label>
      <button onClick={handleSave}>Save</button>
    </div>
  );
};

ReactDOM.render(<App />, document.getElementById('root'));
