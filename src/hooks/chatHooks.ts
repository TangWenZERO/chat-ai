import { useState, useRef, useCallback } from "react";

interface Message {
  id: string;
  content: string;
  sender: "user" | "ai";
  timestamp: Date;
  isStreaming?: boolean;
}

interface UseChatProps {
  initialApiUrl?: string;
  initialApiToken?: string;
}

export const useChat = ({
  initialApiUrl = "https://chat-wrokers.tangw4591.workers.dev/deepseek/api",
  initialApiToken = "",
}: UseChatProps = {}) => {
  const responseTextRef = useRef<Record<string, string>>({});

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
  const [apiUrl, setApiUrl] = useState(initialApiUrl);
  const [apiToken, setApiToken] = useState(initialApiToken);
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim()) return;
      // 错误检查将在 App.tsx 中处理
      if (!apiUrl.trim()) {
        return { error: "请先设置API URL" };
      }
      if (!apiToken.trim()) {
        return { error: "请先设置 deepseek 的tokens" };
      }

      const userMessage: Message = {
        id: Date.now().toString(),
        content: content,
        sender: "user",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      const currentInput = content;
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
        responseTextRef.current[aiMessageId] = "";

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
                    msg.id === aiMessageId
                      ? { ...msg, isStreaming: false }
                      : msg
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
                  responseTextRef.current[aiMessageId] +=
                    parsed.choices[0].delta.content;

                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === aiMessageId
                        ? {
                            ...msg,
                            content: responseTextRef.current[aiMessageId],
                          }
                        : msg
                    )
                  );
                }
                // 处理 DeepSeek 格式的流数据 (直接的 content 字段)
                else if (parsed.content) {
                  responseTextRef.current[aiMessageId] += parsed.content;

                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === aiMessageId
                        ? {
                            ...msg,
                            content: responseTextRef.current[aiMessageId],
                          }
                        : msg
                    )
                  );
                }
                // 处理其他可能的格式
                else if (parsed.text) {
                  responseTextRef.current[aiMessageId] += parsed.text;

                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === aiMessageId
                        ? {
                            ...msg,
                            content: responseTextRef.current[aiMessageId],
                          }
                        : msg
                    )
                  );
                }
              } catch (e) {
                console.log("JSON Parse error:", e, "Data:", data);
                // 如果不是JSON格式，尝试直接作为文本处理
                if (data && data !== "[DONE]" && !data.startsWith("{")) {
                  responseTextRef.current[aiMessageId] += data;
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === aiMessageId
                        ? {
                            ...msg,
                            content: responseTextRef.current[aiMessageId],
                          }
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
                    msg.id === aiMessageId
                      ? { ...msg, isStreaming: false }
                      : msg
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
    },
    [apiUrl, apiToken]
  );

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage(inputValue);
      }
    },
    [inputValue, sendMessage]
  );

  const clearMessages = useCallback(() => {
    setMessages([
      {
        id: "1",
        content: "你好！我是AI助手，有什么可以帮助您的吗？",
        sender: "ai",
        timestamp: new Date(),
      },
    ]);
  }, []);

  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);
    }
  }, []);

  return {
    // Messages state
    messages,
    setMessages,

    // Input state
    inputValue,
    setInputValue,

    // Loading state
    isLoading,
    setIsLoading,

    // API settings
    apiUrl,
    setApiUrl,
    apiToken,
    setApiToken,

    // Methods
    sendMessage,
    handleKeyPress,
    clearMessages,
    stopGeneration,

    // Refs
    responseTextRef,
    abortControllerRef,
  };
};
