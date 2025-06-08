import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Loader2, Plus, MessageSquare, Sparkles } from 'lucide-react';
import { Message, ChatSession } from '../types';
import { useAuth } from '../hooks/useAuth';

export default function ChatPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize with a default session
    const defaultSession: ChatSession = {
      id: '1',
      title: 'Welcome Chat',
      messages: [
        {
          id: '1',
          content: 'Hello! I\'m your AI assistant powered by advanced RAG technology. I can help you analyze and answer questions about your uploaded documents. Upload some files in the Documents section and then ask me anything about them!',
          sender: 'ai',
          timestamp: new Date().toISOString()
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    setSessions([defaultSession]);
    setCurrentSessionId('1');
    setMessages(defaultSession.messages);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: 'user',
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: generateAIResponse(inputValue),
        sender: 'ai',
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
    }, 2000);
  };

  const generateAIResponse = (userInput: string): string => {
    const responses = [
      "I've analyzed your question against the uploaded documents. Based on the content I found, here's what I can tell you...",
      "Great question! Let me search through your RAG knowledge base for the most relevant information.",
      "I understand what you're looking for. The documents you've uploaded contain several insights about this topic.",
      "That's an excellent inquiry! I've processed your documents and found some relevant information that should help.",
      "Based on my analysis of your uploaded files, I can provide you with a comprehensive answer to your question."
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const createNewSession = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: 'New Conversation',
      messages: [{
        id: Date.now().toString(),
        content: 'Hello! How can I help you today?',
        sender: 'ai',
        timestamp: new Date().toISOString()
      }],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    setMessages(newSession.messages);
  };

  const switchSession = (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      setCurrentSessionId(sessionId);
      setMessages(session.messages);
    }
  };

  return (
    <div className="flex h-screen">
      {/* Chat Sessions Sidebar */}
      <div className="w-80 bg-white/10 backdrop-blur-xl border-r border-white/20 flex flex-col">
        <div className="p-6 border-b border-white/20">
          <button
            onClick={createNewSession}
            className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-3 rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg"
          >
            <Plus className="w-5 h-5" />
            <span className="font-medium">New Chat</span>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {sessions.map((session) => (
            <button
              key={session.id}
              onClick={() => switchSession(session.id)}
              className={`w-full text-left p-4 rounded-xl transition-all duration-300 ${
                currentSessionId === session.id
                  ? 'bg-white/20 border border-white/30 shadow-lg'
                  : 'hover:bg-white/10 border border-transparent'
              }`}
            >
              <div className="flex items-start space-x-3">
                <MessageSquare className="w-5 h-5 text-white/70 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {session.title}
                  </p>
                  <p className="text-xs text-white/60 mt-1">
                    {session.messages.length} messages
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
        {/* Chat Header */}
        <div className="bg-white/10 backdrop-blur-xl border-b border-white/20 p-6">
          <div className="flex items-center justify-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <div className="text-center">
              <h2 className="text-xl font-bold text-white">AI Assistant</h2>
              <p className="text-sm text-white/70">Powered by RAG Technology</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex space-x-4 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.sender === 'ai' && (
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                  <Bot className="w-5 h-5 text-white" />
                </div>
              )}
              
              <div className={`max-w-2xl ${
                message.sender === 'user' ? 'order-1' : 'order-2'
              }`}>
                <div className={`px-6 py-4 rounded-2xl shadow-lg ${
                  message.sender === 'user'
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white ml-auto'
                    : 'bg-white/20 backdrop-blur-xl border border-white/30 text-white'
                }`}>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                </div>
                <p className={`text-xs text-white/60 mt-2 ${
                  message.sender === 'user' ? 'text-right' : 'text-left'
                }`}>
                  {new Date(message.timestamp).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
              </div>

              {message.sender === 'user' && (
                <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                  <User className="w-5 h-5 text-white" />
                </div>
              )}
            </div>
          ))}
          
          {isTyping && (
            <div className="flex space-x-4 justify-start">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="bg-white/20 backdrop-blur-xl border border-white/30 px-6 py-4 rounded-2xl shadow-lg">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-white/70 rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-white/70 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-white/70 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="bg-white/10 backdrop-blur-xl border-t border-white/20 p-6">
          <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto">
            <div className="relative">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask me anything about your documents..."
                className="w-full px-6 py-4 pr-14 bg-white/20 backdrop-blur-xl border border-white/30 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-white placeholder-white/60 shadow-lg"
                disabled={isTyping}
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || isTyping}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl flex items-center justify-center hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {isTyping ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}