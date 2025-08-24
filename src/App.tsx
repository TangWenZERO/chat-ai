import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader } from "lucide-react";

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
    <div className="flex flex-col h-screen max-w-4xl mx-auto bg-gradient-to-br from-slate-50 to-slate-100 shadow-2xl">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-slate-200/50 p-4 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">AI助手</h1>
            <p className="text-sm text-slate-500">在线 · 随时为您服务</p>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.sender === "user" ? "justify-end" : "justify-start"
            } animate-fade-in`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-sm ${
                message.sender === "user"
                  ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-br-md"
                  : "bg-white text-slate-800 rounded-bl-md border border-slate-200/50"
              }`}
            >
              <div className="flex items-start space-x-2">
                {message.sender === "ai" && (
                  <Bot className="w-4 h-4 mt-1 text-blue-500 flex-shrink-0" />
                )}
                {message.sender === "user" && (
                  <User className="w-4 h-4 mt-1 text-blue-100 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <p className="text-sm leading-relaxed">{message.content}</p>
                  <p
                    className={`text-xs mt-2 ${
                      message.sender === "user"
                        ? "text-blue-100"
                        : "text-slate-500"
                    }`}
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
          <div className="flex justify-start animate-fade-in">
            <div className="max-w-xs lg:max-w-md px-4 py-3 rounded-2xl rounded-bl-md bg-white text-slate-800 border border-slate-200/50 shadow-sm">
              <div className="flex items-center space-x-2">
                <Bot className="w-4 h-4 text-blue-500" />
                <div className="flex items-center space-x-1">
                  <Loader className="w-4 h-4 animate-spin text-blue-500" />
                  <span className="text-sm text-slate-600">
                    AI正在思考中...
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white/80 backdrop-blur-md border-t border-slate-200/50 p-4">
        <div className="flex items-center space-x-3 bg-white rounded-2xl shadow-sm border border-slate-200/50 focus-within:border-blue-300 focus-within:ring-2 focus-within:ring-blue-100 transition-all duration-200">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="输入您的消息..."
            className="flex-1 px-4 py-3 bg-transparent border-none outline-none text-slate-800 placeholder-slate-400"
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            className="mr-2 p-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 disabled:from-slate-300 disabled:to-slate-400 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-slate-500 mt-2 text-center">
          按 Enter 发送消息，Shift + Enter 换行
        </p>
      </div>
    </div>
  );
};

export default AIChatInterface;
