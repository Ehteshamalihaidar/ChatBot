import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Bot,
  User,
  //Sparkles,
  Loader2,
  MoreVertical,
  Plus,
  MessageSquare,
} from "lucide-react";
import { getGeminiResponse } from "./geminiService"; // API service
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { v4 as uuidv4 } from "uuid";

export default function ChatbotUI() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! I'm your AI assistant. How can I help you today?",
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [chatId, setChatId] = useState(uuidv4());
  const [sessions, setSessions] = useState([]); // 🆕 All previous chats
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // 🧾 Load current chat messages
  useEffect(() => {
    fetch(`http://localhost:5000/api/chats/${chatId}`)
      .then((res) => res.json())
      .then((data) => {
        const formatted = data.flatMap((chat, index) => [
          { id: index * 2 + 1, sender: "user", text: chat.userMessage, timestamp: chat.timestamp },
          { id: index * 2 + 2, sender: "bot", text: chat.botReply, timestamp: chat.timestamp },
        ]);
        if (formatted.length > 0) {
          setMessages(formatted);
        } else {
          setMessages([
            {
              id: 1,
              text: "Hello! I'm your AI assistant. How can I help you today?",
              sender: "bot",
              timestamp: new Date(),
            },
          ]);
        }
      })
      .catch((err) => console.error("Error loading chat:", err));
  }, [chatId]);

  // 🧾 Load all chat sessions (for sidebar)
  useEffect(() => {
    fetch("http://localhost:5000/api/sessions")
      .then((res) => res.json())
      .then(setSessions)
      .catch((err) => console.error("Error fetching sessions:", err));
  }, [chatId]);

  // ✅ Send message
  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = {
      id: messages.length + 1,
      text: input,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    try {
      const botReply = await getGeminiResponse(input, chatId);
      const botMessage = {
        id: messages.length + 2,
        text: botReply,
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { id: messages.length + 2, text: "⚠️ Something went wrong.", sender: "bot", timestamp: new Date() },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const formatTime = (date) =>
    new Date(date).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* 🧭 Sidebar */}
      <div className="w-64 bg-black/30 backdrop-blur-xl border-r border-white/10 flex flex-col">
        <div className="p-4 border-b border-white/10 flex justify-between items-center">
          <h2 className="text-white text-lg font-semibold">Chat History</h2>
          <button
            onClick={() => {
              setChatId(uuidv4());
              setMessages([
                { id: 1, text: "New chat started!", sender: "bot", timestamp: new Date() },
              ]);
            }}
            className="p-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl text-white hover:scale-105 transition-transform text-sm"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-3 space-y-2">
          {sessions.length === 0 ? (
            <p className="text-purple-300 text-xs text-center">No chats yet</p>
          ) : (
            sessions.map((session, idx) => (
  <button
    key={idx}
    onClick={() => setChatId(session._id)}
    className={`w-full text-left px-3 py-2 rounded-lg text-sm flex flex-col transition-all ${
      session._id === chatId
        ? "bg-purple-600 text-white"
        : "bg-white/5 text-purple-200 hover:bg-white/10"
    }`}
  >
    <div className="flex items-center gap-2">
      <MessageSquare className="w-4 h-4" />
      <span className="truncate font-medium">
        {session.title || "Untitled Chat"}
      </span>
    </div>
    <span className="text-[10px] text-purple-400 mt-1">
      {new Date(session.lastUpdated).toLocaleString()}
    </span>
  </button>
))

          )}
        </div>
      </div>

      {/* 💬 Chat Area */}
      <div className="flex flex-col flex-1">
        {/* Header */}
        <div className="bg-black/30 backdrop-blur-xl border-b border-white/10 px-6 py-4">
          <div className="flex items-center justify-between max-w-5xl mx-auto">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-900"></div>
              </div>
              <div>
                <h1 className="text-white font-semibold text-lg">AI Assistant</h1>
                <p className="text-purple-300 text-xs">Online</p>
              </div>
            </div>
            <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <MoreVertical className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.sender === "user" ? "flex-row-reverse" : ""
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.sender === "bot"
                      ? "bg-gradient-to-br from-purple-500 to-pink-500"
                      : "bg-gradient-to-br from-blue-500 to-cyan-500"
                  }`}
                >
                  {message.sender === "bot" ? (
                    <Bot className="w-5 h-5 text-white" />
                  ) : (
                    <User className="w-5 h-5 text-white" />
                  )}
                </div>

                <div
                  className={`flex flex-col max-w-2xl ${
                    message.sender === "user" ? "items-end" : ""
                  }`}
                >
                  <div
                    className={`px-4 py-3 rounded-2xl overflow-x-auto ${
                      message.sender === "bot"
                        ? "bg-white/10 backdrop-blur-lg border border-white/20 text-white"
                        : "bg-gradient-to-r from-blue-600 to-cyan-600 text-white"
                    }`}
                  >
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeRaw]}
                      components={{
                        code({ inline, className, children, ...props }) {
                          const match = /language-(\w+)/.exec(className || "");
                          return !inline && match ? (
                            <SyntaxHighlighter
                              style={oneDark}
                              language={match[1]}
                              PreTag="div"
                              className="rounded-lg p-2"
                            >
                              {String(children).replace(/\n$/, "")}
                            </SyntaxHighlighter>
                          ) : (
                            <code
                              className="bg-black/40 px-1 py-0.5 rounded text-purple-300"
                              {...props}
                            >
                              {children}
                            </code>
                          );
                        },
                      }}
                    >
                      {message.text}
                    </ReactMarkdown>
                  </div>
                  <span className="text-xs text-purple-300 mt-1 px-2">
                    {formatTime(message.timestamp)}
                  </span>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div className="bg-white/10 backdrop-blur-lg border border-white/20 px-4 py-3 rounded-2xl">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="bg-black/30 backdrop-blur-xl border-t border-white/10 px-4 py-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex gap-2 items-end">
              <div className="flex-1 bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl px-4 py-3 focus-within:border-purple-500 transition-colors">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Type your message..."
                  className="w-full bg-transparent text-white placeholder-purple-300 outline-none resize-none max-h-32"
                  rows="1"
                />
              </div>
              <button
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                className="p-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl transition-all hover:scale-105 disabled:hover:scale-100"
              >
                {isTyping ? (
                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                ) : (
                  <Send className="w-5 h-5 text-white" />
                )}
              </button>
            </div>
            <p className="text-xs text-purple-300 mt-2 text-center">
              Press Enter to send • Shift + Enter for new line
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
