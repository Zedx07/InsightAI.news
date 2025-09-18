import React, { useState, useEffect } from "react";
import MessageList from "../MessageList/MessageList";
import MessageInput from "../MessageInput/MessageInput";
import apiService from "../../services/api";
import "./ChatInterface.scss";

const ChatInterface = ({ sessionId }) => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState(sessionId);

  // Load session history when sessionId changes
  useEffect(() => {
    if (sessionId) {
      loadSessionHistory(sessionId);
      setCurrentSessionId(sessionId);
    }
  }, [sessionId]);

  const loadSessionHistory = async (sessionId) => {
    try {
      const history = await apiService.getSessionHistory(sessionId);
      const formattedMessages = history.map((msg, index) => ({
        id: index,
        type: msg.role === "user" ? "user" : "bot",
        content: msg.content,
        timestamp: new Date(msg.timestamp || Date.now()),
      }));
      setMessages(formattedMessages);
    } catch (error) {
      console.error("Error loading session history:", error);
      setMessages([]);
    }
  };

  const handleSendMessage = async (message) => {
    // If no session ID, we need to create one first
    if (!currentSessionId) {
      try {
        const newSession = await apiService.createSession();
        setCurrentSessionId(newSession.session.id);
      } catch (error) {
        console.error("Error creating session:", error);
        return;
      }
    }

    const userMessage = {
      id: Date.now(),
      type: "user",
      content: message,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await apiService.sendMessage(message, currentSessionId);

      const botMessage = {
        id: Date.now() + 1,
        type: "bot",
        content: response.message || "No response received",
        sources: response.sources || [],
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage = {
        id: Date.now() + 1,
        type: "bot",
        content:
          "Sorry, there was an error processing your request. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chat-interface">
      <div className="chat-header">
        <h2>InsightAI News</h2>
      </div>

      <MessageList messages={messages} isLoading={isLoading} />

      <MessageInput onSendMessage={handleSendMessage} disabled={isLoading} />
    </div>
  );
};

export default ChatInterface;
