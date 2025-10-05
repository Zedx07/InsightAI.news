import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ChatInterface from './components/ChatInterface/ChatInterface';
import SessionManager from './components/SessionManager/SessionManager';
import { AuthModal, UserProfile } from './components/Auth';
import './App.css';

// Main App Component (wrapped by AuthProvider)
function AppContent() {
  const [ currentSessionId, setCurrentSessionId ] = useState(null);
  const [ showSidebar, setShowSidebar ] = useState(false);
  const [ showAuthModal, setShowAuthModal ] = useState(false);
  const [ authMode, setAuthMode ] = useState('login');

  const { isAuthenticated, isLoading } = useAuth();

  const handleSessionChange = (sessionId) => {
    setCurrentSessionId(sessionId);
    setShowSidebar(false);
  };

  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };

  const openAuthModal = (mode = 'login') => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  const closeAuthModal = () => {
    setShowAuthModal(false);
  };

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="App">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <div className="app-layout">
        {/* Header */}
        <div className="app-header">
          <button className="menu-btn" onClick={toggleSidebar}>
            ☰ Menu
          </button>

          <div className="app-title">
            <h1>InsightAI.news</h1>
          </div>

          <div className="auth-section">
            {isAuthenticated ? (
              <UserProfile />
            ) : (
              <div className="auth-buttons">
                <button
                  className="auth-btn login-btn"
                  onClick={() => openAuthModal('login')}
                >
                  Sign In
                </button>
                <button
                  className="auth-btn register-btn"
                  onClick={() => openAuthModal('register')}
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>
        </div>

        {/* App Content */}
        <div className="app-content">
          {/* Sidebar */}
          {isAuthenticated && (
            <div className={`sidebar ${showSidebar ? 'show' : ''}`}>
              <SessionManager
                onSessionChange={handleSessionChange}
                currentSessionId={currentSessionId}
              />
            </div>
          )}

          {/* Main Content */}
          <div className="main-content">
            {isAuthenticated ? (
              <ChatInterface sessionId={currentSessionId} />
            ) : (
              <div className="welcome-screen">
                <div className="welcome-content">
                  <h2>Welcome to InsightAI.news</h2>
                  <p>Your AI-powered news assistant. Sign in to get personalized insights and save your chat history.</p>
                  <div className="welcome-actions">
                    <button
                      className="welcome-btn primary"
                      onClick={() => openAuthModal('register')}
                    >
                      Get Started
                    </button>
                    <button
                      className="welcome-btn secondary"
                      onClick={() => openAuthModal('login')}
                    >
                      Sign In
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Overlays */}
        {showSidebar && <div className="overlay" onClick={toggleSidebar}></div>}

        {/* Auth Modal */}
        <AuthModal
          isOpen={showAuthModal}
          onClose={closeAuthModal}
          initialMode={authMode}
        />
      </div>
    </div>
  );
}

// Root App Component
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
