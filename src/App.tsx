// AIChatInterface.tsx
import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader } from "lucide-react";
import styles from "./AIChatInterface.module.css";

interface Message {
  id: string;
  content: string;
  sender: "user" | "ai";
  timestamp: Date;
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const simulateAIResponse = (userMessage: string): string => {
    const responses = [
      "这是一个很有趣的问题！让我来为您分析一下...",
      "根据您的描述，我建议您可以尝试以下几个方法...",
      "我理解您的想法。从技术角度来看，这个问题可以这样解决...",
      "感谢您的提问！基于我的知识库，我可以为您提供以下信息...",
      "这确实是一个值得深入探讨的话题。让我详细解释一下...",
    ];

    if (userMessage.includes("你好") || userMessage.includes("hello")) {
      return "你好！很高兴与您对话。请告诉我您需要什么帮助？";
    }

    if (userMessage.includes("React") || userMessage.includes("前端")) {
      return "React是一个优秀的前端框架！它的组件化思想和虚拟DOM机制让开发变得更加高效。您想了解React的哪个方面呢？";
    }

    if (userMessage.includes("AI") || userMessage.includes("人工智能")) {
      return "AI技术正在快速发展，从机器学习到深度学习，再到现在的大语言模型，每一步都在改变我们的生活方式。您对AI的哪个领域特别感兴趣？";
    }

    return responses[Math.floor(Math.random() * responses.length)];
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    // 模拟AI思考时间
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: simulateAIResponse(inputValue),
        sender: "ai",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiResponse]);
      setIsLoading(false);
    }, 1000 + Math.random() * 2000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
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
        </div>
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
                  <p>{message.content}</p>
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
        {isLoading && (
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
