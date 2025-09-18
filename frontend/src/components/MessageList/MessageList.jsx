import React from "react";
import "./MessageList.scss";

const MessageList = ({ messages, isLoading }) => {
  return (
    <div className="message-list">
      {messages.map((message) => (
        <div key={message.id} className={`message ${message.type}`}>
          <div className="message-content">{message.content}</div>
          <div className="message-time">
            {message.timestamp.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </div>
      ))}

      {isLoading && (
        <div className="message bot">
          <div className="message-content">
            <div className="typing">Typing...</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageList;
