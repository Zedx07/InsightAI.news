import React, { useState } from 'react';
import ChatInterface from './components/ChatInterface/ChatInterface';
import SessionManager from './components/SessionManager/SessionManager';
import './App.css';

function App() {
  const [ currentSessionId, setCurrentSessionId ] = useState(null);
  const [ showSidebar, setShowSidebar ] = useState(false);

  const handleSessionChange = (sessionId) => {
    setCurrentSessionId(sessionId);
    setShowSidebar(false);
  };

  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };

  return (
    <div className="App">
      <div className="app-layout">
        <button className="menu-btn" onClick={toggleSidebar}>
          ☰ Menu
        </button>

        <div className={`sidebar ${showSidebar ? 'show' : ''}`}>
          <SessionManager
            onSessionChange={handleSessionChange}
            currentSessionId={currentSessionId}
          />
        </div>

        <div className="main-content">
          <ChatInterface sessionId={currentSessionId} />
        </div>

        {showSidebar && <div className="overlay" onClick={toggleSidebar}></div>}
      </div>
    </div>
  );
}

export default App;
