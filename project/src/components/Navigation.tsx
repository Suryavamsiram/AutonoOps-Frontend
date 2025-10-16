import React from 'react';
import { MessageSquare, FileText, Settings, LogOut, User, Upload, BookHeart } from 'lucide-react';
import { Page } from '../types';
import { useAuth } from '../hooks/useAuth';

interface NavigationProps {
  currentPage: Page;
  onPageChange: (page: Page) => void;
}

export default function Navigation({ currentPage, onPageChange }: NavigationProps) {
  const { user, logout } = useAuth();

  if (!user) return null;

  const navItems = [
    { id: 'chat' as Page, label: 'AI Chat', icon: MessageSquare },
    { id: 'dashboard' as Page, label: 'Documents', icon: Upload },
    { id: 'journal' as Page, label: 'Daily Journal', icon: BookHeart },
    ...(user.role === 'admin' ? [{ id: 'admin' as Page, label: 'Admin', icon: Settings }] : [])
  ];

  return (
    <nav className="bg-white/10 backdrop-blur-xl border-r border-white/20 w-72 min-h-screen p-6 flex flex-col">
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <MessageSquare className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">AI Assistant</h1>
            <p className="text-sm text-white/70">Powered by RAG</p>
          </div>
        </div>
      </div>

      <div className="flex-1">
        <ul className="space-y-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.id}>
                <button
                  onClick={() => onPageChange(item.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-4 rounded-xl transition-all duration-300 ${
                    currentPage === item.id
                      ? 'bg-white/20 text-white shadow-lg backdrop-blur-sm border border-white/30'
                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="border-t border-white/20 pt-6">
        <div className="flex items-center space-x-3 px-4 py-3 mb-4 bg-white/10 rounded-xl backdrop-blur-sm">
          <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-blue-600 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user.name}</p>
            <p className="text-xs text-white/70 truncate">{user.email}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center space-x-3 px-4 py-3 text-white/70 hover:bg-red-500/20 hover:text-white rounded-xl transition-all duration-300"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-sm font-medium">Sign Out</span>
        </button>
      </div>
    </nav>
  );
}