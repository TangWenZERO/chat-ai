import React, { useState, useEffect, useRef } from "react";
import MarkdownIt from "markdown-it";
import { useChat } from "./hooks/chatHooks";
import "./App.css";

const md = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true,
});

const AIChatInterface: React.FC = () => {
  const {
    messages,
    inputValue,
    setInputValue,
    isLoading,
    sendMessage,
    handleKeyPress,
    clearMessages,
    setApiToken,
  } = useChat();

  const [showSettings, setShowSettings] = useState(false);
  const [tempApiToken, setTempApiToken] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        settingsRef.current &&
        !settingsRef.current.contains(event.target as Node)
      ) {
        setShowSettings(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSendMessage = async () => {
    const result = await sendMessage(inputValue);
    if (result && result.error) {
      alert(result.error);
    }
  };

  const handleSaveSettings = () => {
    // 这里应该更新 apiToken，但目前 useChat hook 中没有暴露 setApiToken 方法
    setShowSettings(false);
    setApiToken(tempApiToken);
  };

  const handleCancelSettings = () => {
    setShowSettings(false);
  };

  const renderMessageContent = (content: string) => {
    try {
      return <div dangerouslySetInnerHTML={{ __html: md.render(content) }} />;
    } catch (error) {
      console.error("Markdown rendering error:", error);
      return <div>{content}</div>;
    }
  };

  return (
    <div className="app">
      <div className="chat-container">
        <div className="chat-header">
          <h2>AI Chat</h2>
          <button
            className="settings-button"
            onClick={() => setShowSettings(!showSettings)}
          >
            ⚙️
          </button>
        </div>

        {showSettings && (
          <div className="settings-modal" ref={settingsRef}>
            <h3>设置</h3>
            <div className="settings-group">
              <label>LLM 模型:</label>
              <select value="deepseek" disabled>
                <option value="deepseek">DeepSeek</option>
              </select>
            </div>
            <div className="settings-group">
              <label>API Token:</label>
              <input
                type="password"
                value={tempApiToken}
                onChange={(e) => setTempApiToken(e.target.value)}
                placeholder="请输入 API Token"
              />
            </div>
            <div className="settings-actions">
              <button onClick={handleCancelSettings}>取消</button>
              <button onClick={handleSaveSettings}>确认</button>
            </div>
          </div>
        )}

        <div className="messages-container">
          <div className="messages">
            {messages.map((message, index) => (
              <div key={index} className={`message ${message.sender}`}>
                <div className="message-content">
                  {renderMessageContent(message.content)}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="message ai">
                <div className="message-content">正在思考中...</div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="input-container">
          <div className="input-box">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="输入消息..."
              disabled={isLoading}
            />
            <button
              onClick={handleSendMessage}
              disabled={isLoading || !inputValue.trim()}
              className="send-button"
            >
              发送
            </button>
            <button
              onClick={clearMessages}
              disabled={isLoading}
              className="clear-button"
            >
              清空
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIChatInterface;
