import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Loader2, Plus, MessageSquare, Sparkles, Mic, MicOff, Upload, X } from 'lucide-react';

// Types
interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: string;
  files?: File[];
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const [isListening, setIsListening] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [userId] = useState(() => `user-${Date.now()}`);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // n8n webhook URL - Replace with your actual webhook URL
  const WEBHOOK_URL = 'https://sameeksha.app.n8n.cloud/webhook/chat';

  useEffect(() => {
    // Initialize with a default session
    const defaultSession: ChatSession = {
      id: '1',
      title: 'Welcome Chat',
      messages: [
        {
          id: '1',
          content: 'Hello! I\'m your AI assistant powered by advanced RAG technology. I can help you analyze and answer questions about your uploaded documents, manage your calendar, send emails, and much more!',
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

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputValue(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const toggleVoiceRecognition = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in your browser');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setUploadedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: 'user',
      timestamp: new Date().toISOString(),
      files: uploadedFiles.length > 0 ? [...uploadedFiles] : undefined
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setUploadedFiles([]);
    setIsTyping(true);

    try {
      // FIXED: Prepare the request payload with both sessionId and chatId for compatibility
      const payload = {
        text: inputValue,           // For AI processing
        message: inputValue,        // Alternative field name
        chatId: currentSessionId,   // For Telegram compatibility
        sessionId: currentSessionId, // For session management
        userId: userId,
        timestamp: new Date().toISOString(),
        files: uploadedFiles.length > 0 ? uploadedFiles.map(f => ({
          name: f.name,
          type: f.type,
          size: f.size
        })) : undefined
      };

      console.log('Sending payload:', payload); // Debug log

      // Send to n8n webhook
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      // Check if response has content
      const responseText = await response.text();
      console.log('Raw response text:', responseText);
      
      let result;
      if (responseText.trim() === '') {
        console.warn('Empty response from webhook');
        result = { output: 'I received your message successfully, but got an empty response from the server.' };
      } else {
        try {
          result = JSON.parse(responseText);
          console.log('Parsed response from n8n:', result);
        } catch (parseError) {
          console.error('JSON parse error:', parseError);
          console.error('Response text that failed to parse:', responseText);
          result = { output: `${responseText}` };
        }
      }
      
      // FIXED: Extract AI response with better error handling
      let aiResponse = 'I received your message but encountered an issue processing it.';
      
      if (result) {
        // Try different possible response structures
        aiResponse = result.output || 
                    result.response || 
                    result.message || 
                    result.text ||
                    result.data?.output ||
                    result.data?.response ||
                    aiResponse;
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: aiResponse,
        sender: 'ai',
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, aiMessage]);
      
      // Update session
      const updatedSession = sessions.find(s => s.id === currentSessionId);
      if (updatedSession) {
        updatedSession.messages = [...updatedSession.messages, userMessage, aiMessage];
        updatedSession.updatedAt = new Date().toISOString();
        setSessions(prev => prev.map(s => s.id === currentSessionId ? updatedSession : s));
      }

    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please check your webhook URL and try again.`,
        sender: 'ai',
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const createNewSession = () => {
    const newSession: ChatSession = {
      id: `session-${Date.now()}`, // More descriptive ID
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
    <div className="flex h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
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
                  <p className="text-xs text-white/40 mt-1">
                    ID: {session.id}
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
              <p className="text-xs text-white/50">Session: {currentSessionId}</p>
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
                  {message.files && message.files.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {message.files.map((file, index) => (
                        <div key={index} className="bg-white/20 px-2 py-1 rounded text-xs">
                          📎 {file.name}
                        </div>
                      ))}
                    </div>
                  )}
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

        {/* File Upload Preview */}
        {uploadedFiles.length > 0 && (
          <div className="bg-white/10 backdrop-blur-xl border-t border-white/20 p-4">
            <div className="flex flex-wrap gap-2">
              {uploadedFiles.map((file, index) => (
                <div key={index} className="flex items-center space-x-2 bg-white/20 px-3 py-2 rounded-lg">
                  <span className="text-sm text-white">📎 {file.name}</span>
                  <button
                    onClick={() => removeFile(index)}
                    className="text-white/70 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Message Input */}
        <div className="bg-white/10 backdrop-blur-xl border-t border-white/20 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="relative">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(e)}
                placeholder="Ask me anything about your documents..."
                className="w-full px-6 py-4 pr-32 bg-white/20 backdrop-blur-xl border border-white/30 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-white placeholder-white/60 shadow-lg"
                disabled={isTyping}
              />
              
              {/* Controls */}
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                {/* File Upload */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-8 h-8 bg-white/20 text-white rounded-xl flex items-center justify-center hover:bg-white/30 transition-all duration-300"
                >
                  <Upload className="w-4 h-4" />
                </button>
                
                {/* Voice Recognition */}
                <button
                  type="button"
                  onClick={toggleVoiceRecognition}
                  className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-300 ${
                    isListening 
                      ? 'bg-red-500 text-white animate-pulse' 
                      : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
                
                {/* Send Button */}
                <button
                  type="button"
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isTyping}
                  className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl flex items-center justify-center hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  {isTyping ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
              
              {/* Hidden File Input */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                accept=".pdf,.doc,.docx,.txt,.csv,.xlsx,.xls"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}