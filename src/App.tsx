import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Bot,
  User,
  Loader,
  Settings,
  X,
  Eye,
  EyeOff,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import styles from "./AIChatInterface.module.css";

interface Message {
  id: string;
  content: string;
  sender: "user" | "ai";
  timestamp: Date;
  isStreaming?: boolean;
}

const AIChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: "你好！我是AI助手，有什么可以帮助您的吗？",
      sender: "ai",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [apiUrl, setApiUrl] = useState("");
  const [apiToken, setApiToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;
    if (!apiUrl.trim()) {
      alert("请先设置API URL");
      setShowSettings(true);
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = inputValue;
    setInputValue("");
    setIsLoading(true);

    // 创建一个新的AI消息用于流式更新
    const aiMessageId = (Date.now() + 1).toString();
    const aiMessage: Message = {
      id: aiMessageId,
      content: "",
      sender: "ai",
      timestamp: new Date(),
      isStreaming: true,
    };

    setMessages((prev) => [...prev, aiMessage]);

    try {
      // 取消之前的请求
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();

      const requestData = {
        messages: [
          {
            role: "user",
            content: currentInput,
          },
        ],
        model: "deepseek-chat",
        token: apiToken,
      };

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(apiToken && { Authorization: `Bearer ${apiToken}` }),
        },
        body: JSON.stringify(requestData),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("无法获取响应流");
      }

      const decoder = new TextDecoder();
      let responseText = "";

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6).trim();

            // 处理结束标记
            if (data === "[DONE]") {
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === aiMessageId ? { ...msg, isStreaming: false } : msg
                )
              );
              setIsLoading(false);
              return;
            }

            // 跳过空数据
            if (!data) continue;

            try {
              const parsed = JSON.parse(data);

              // 处理 OpenAI 格式的流数据 (choices.delta.content)
              if (
                parsed.choices &&
                parsed.choices[0] &&
                parsed.choices[0].delta &&
                parsed.choices[0].delta.content
              ) {
                responseText += parsed.choices[0].delta.content;

                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === aiMessageId
                      ? { ...msg, content: responseText }
                      : msg
                  )
                );
              }
              // 处理 DeepSeek 格式的流数据 (直接的 content 字段)
              else if (parsed.content) {
                responseText += parsed.content;

                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === aiMessageId
                      ? { ...msg, content: responseText }
                      : msg
                  )
                );
              }
              // 处理其他可能的格式
              else if (parsed.text) {
                responseText += parsed.text;

                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === aiMessageId
                      ? { ...msg, content: responseText }
                      : msg
                  )
                );
              }
            } catch (e) {
              console.log("JSON Parse error:", e, "Data:", data);
              // 如果不是JSON格式，尝试直接作为文本处理
              if (data && data !== "[DONE]" && !data.startsWith("{")) {
                responseText += data;
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === aiMessageId
                      ? { ...msg, content: responseText }
                      : msg
                  )
                );
              }
            }
          }
          // 处理事件行
          else if (line.startsWith("event: ")) {
            const eventType = line.slice(7).trim();

            if (eventType === "finish" || eventType === "done") {
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === aiMessageId ? { ...msg, isStreaming: false } : msg
                )
              );
              setIsLoading(false);
              return;
            } else if (eventType === "error") {
              // 下一行应该包含错误数据
              continue;
            }
          }
          // 处理错误事件的数据
          else if (
            line.startsWith("data: ") &&
            lines[lines.indexOf(line) - 1]?.startsWith("event: error")
          ) {
            const errorData = line.slice(6);
            try {
              const errorObj = JSON.parse(errorData);
              throw new Error(
                errorObj.error || errorObj.message || "发生未知错误"
              );
            } catch (e) {
              throw new Error("发生未知错误");
            }
          }
        }
      }

      // 如果循环结束但没有收到完成信号，标记为完成
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiMessageId ? { ...msg, isStreaming: false } : msg
        )
      );
      setIsLoading(false);
    } catch (error: any) {
      console.error("API请求失败:", error);

      if (error.name === "AbortError") {
        return;
      }

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiMessageId
            ? {
                ...msg,
                content: `抱歉，请求失败了：${error.message}`,
                isStreaming: false,
              }
            : msg
        )
      );
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleSettings = () => {
    setShowSettings(!showSettings);
  };

  return (
    <div className={styles.chatContainer}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.avatar}>
            <Bot className={styles.avatarIcon} />
          </div>
          <div className={styles.headerInfo}>
            <h1>AI助手</h1>
            <p>在线 · 随时为您服务</p>
          </div>
          <button
            className={`${styles.settingsButton} ${
              showSettings ? styles.active : ""
            }`}
            onClick={toggleSettings}
          >
            <Settings size={20} />
          </button>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className={styles.settingsPanel}>
            <div className={styles.settingsHeader}>
              <h3 className={styles.settingsTitle}>API 设置</h3>
              <button className={styles.closeButton} onClick={toggleSettings}>
                <X size={16} />
              </button>
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>API URL</label>
              <input
                className={styles.settingsInput}
                type="text"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                placeholder="https://api.example.com/chat"
              />
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>Token</label>
              <div className={styles.tokenInputWrapper}>
                <input
                  className={styles.settingsInput}
                  type={showToken ? "text" : "password"}
                  value={apiToken}
                  onChange={(e) => setApiToken(e.target.value)}
                  placeholder="请输入API Token"
                  style={{ paddingRight: "2.5rem" }}
                />
                <button
                  className={styles.tokenToggle}
                  onClick={() => setShowToken(!showToken)}
                >
                  {showToken ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Messages Container */}
      <div className={styles.messagesContainer}>
        {messages.map((message) => (
          <div
            key={message.id}
            className={`${styles.messageWrapper} ${styles[message.sender]}`}
          >
            <div
              className={`${styles.messageBubble} ${styles[message.sender]}`}
            >
              <div className={styles.messageContent}>
                {message.sender === "ai" && (
                  <Bot className={`${styles.messageIcon} ${styles.ai}`} />
                )}
                {message.sender === "user" && (
                  <User className={`${styles.messageIcon} ${styles.user}`} />
                )}
                <div className={styles.messageText}>
                  <div className={styles.markdownContent}>
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                    {message.isStreaming && (
                      <span className={styles.streamingCursor}></span>
                    )}
                  </div>
                  <p
                    className={`${styles.timestamp} ${styles[message.sender]}`}
                  >
                    {message.timestamp.toLocaleTimeString("zh-CN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {isLoading && messages[messages.length - 1]?.sender !== "ai" && (
          <div className={styles.loadingWrapper}>
            <div className={styles.loadingBubble}>
              <div className={styles.loadingContent}>
                <Bot className={styles.loadingIcon} />
                <div className={styles.loadingIndicator}>
                  <Loader className={styles.spinner} />
                  <span className={styles.loadingText}>AI正在思考中...</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className={styles.inputArea}>
        <div className={styles.inputWrapper}>
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="输入您的消息..."
            className={styles.messageInput}
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            className={styles.sendButton}
          >
            <Send className={styles.sendIcon} />
          </button>
        </div>
        <p className={styles.inputHint}>
          按 Enter 发送消息，Shift + Enter 换行
        </p>
      </div>
    </div>
  );
};

export default AIChatInterface;
