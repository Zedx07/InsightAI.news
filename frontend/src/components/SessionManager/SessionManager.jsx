import React, { useState, useEffect } from "react";
import apiService from "../../services/api";
import "./SessionManager.scss";

const SessionManager = ({ onSessionChange, currentSessionId }) => {
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const response = await apiService.getSessions();
      setSessions(response.sessions || []);
    } catch (error) {
      console.error("Error loading sessions:", error);
      // Fallback to empty sessions
      setSessions([]);
    }
  };

  const createNewSession = async () => {
    try {
      const response = await apiService.createSession();
      const newSession = response.session || {
        id: Date.now(),
        title: "New Chat",
      };
      setSessions((prev) => [newSession, ...prev]);
      onSessionChange(newSession.id);
    } catch (error) {
      console.error("Error creating session:", error);
      // Create local session as fallback
      const newSession = { id: Date.now(), title: "New Chat" };
      setSessions((prev) => [newSession, ...prev]);
      onSessionChange(newSession.id);
    }
  };

  const selectSession = (sessionId) => {
    onSessionChange(sessionId);
  };

  const deleteSession = async (sessionId) => {
    try {
      await apiService.deleteSession(sessionId);
      setSessions((prev) => prev.filter((session) => session.id !== sessionId));

      // If deleting current session, create a new one
      if (currentSessionId === sessionId) {
        createNewSession();
      }
    } catch (error) {
      console.error("Error deleting session:", error);
    }
  };

  return (
    <div className="session-manager">
      <div className="session-header">
        <h3>Chats</h3>
        <button onClick={createNewSession} className="new-chat-btn">
          + New Chat
        </button>
      </div>

      <div className="sessions-list">
        {sessions.length === 0 ? (
          <div className="no-sessions">
            <p>No chats yet. Start a new conversation!</p>
          </div>
        ) : (
          sessions.map((session) => (
            <div
              key={session.id}
              className={`session-item ${
                currentSessionId === session.id ? "active" : ""
              }`}
              onClick={() => selectSession(session.id)}
            >
              <div className="session-content">
                <h4>{session.title || "New Chat"}</h4>
                <p>{session.lastMessage || "No messages"}</p>
              </div>

              <button
                className="delete-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteSession(session.id);
                }}
                title="Delete chat"
              >
                ×
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SessionManager;
