import React, { useState } from 'react';
import { Users, FileText, Activity, Settings, Search, MoreHorizontal, Shield, UserCheck, TrendingUp, Database, Zap } from 'lucide-react';
import { User, UploadedFile } from '../types';
import { useAuth } from '../hooks/useAuth';

export default function AdminPanel() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'users' | 'files' | 'analytics' | 'settings'>('users');

  // Mock data for admin panel
  const [users] = useState<User[]>([
    {
      id: '1',
      email: 'admin@example.com',
      name: 'Admin User',
      role: 'admin',
      createdAt: '2024-01-01T00:00:00Z'
    },
    {
      id: '2',
      email: 'user@example.com',
      name: 'Regular User',
      role: 'user',
      createdAt: '2024-01-02T00:00:00Z'
    },
    {
      id: '3',
      email: 'john.doe@example.com',
      name: 'John Doe',
      role: 'user',
      createdAt: '2024-01-05T00:00:00Z'
    }
  ]);

  const [systemFiles] = useState<UploadedFile[]>([
    {
      id: '1',
      name: 'Company Handbook.pdf',
      size: 5242880,
      type: 'application/pdf',
      uploadedAt: '2024-01-10T09:00:00Z',
      status: 'ready',
      userId: '2'
    },
    {
      id: '2',
      name: 'Technical Documentation.docx',
      size: 3145728,
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      uploadedAt: '2024-01-12T14:30:00Z',
      status: 'ready',
      userId: '3'
    },
    {
      id: '3',
      name: 'API Reference.md',
      size: 1048576,
      type: 'text/markdown',
      uploadedAt: '2024-01-15T11:15:00Z',
      status: 'processing',
      userId: '2'
    }
  ]);

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="text-center bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-12 shadow-lg">
          <Shield className="w-20 h-20 text-white/60 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-white mb-4">Access Denied</h2>
          <p className="text-white/70 text-lg">You don't have permission to access the admin panel.</p>
        </div>
      </div>
    );
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const tabs = [
    { id: 'users' as const, label: 'Users', icon: Users },
    { id: 'files' as const, label: 'Files', icon: FileText },
    { id: 'analytics' as const, label: 'Analytics', icon: TrendingUp },
    { id: 'settings' as const, label: 'Settings', icon: Settings }
  ];

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Admin Control Center</h1>
              <p className="text-white/70 text-lg">Manage users, monitor system activity, and configure settings</p>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                <Users className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="text-3xl font-bold text-white">{users.length}</p>
                <p className="text-white/70">Total Users</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg">
                <Database className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="text-3xl font-bold text-white">{systemFiles.length}</p>
                <p className="text-white/70">Documents</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                <Zap className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="text-3xl font-bold text-white">847</p>
                <p className="text-white/70">AI Queries</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg">
                <UserCheck className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="text-3xl font-bold text-white">
                  {users.filter(u => u.role === 'user').length}
                </p>
                <p className="text-white/70">Active Users</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-lg overflow-hidden">
          <div className="border-b border-white/20">
            <nav className="flex space-x-8 px-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-3 py-6 px-2 border-b-2 text-sm font-semibold transition-all duration-300 ${
                      activeTab === tab.id
                        ? 'border-blue-400 text-white'
                        : 'border-transparent text-white/60 hover:text-white hover:border-white/30'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-8">
            {activeTab === 'users' && (
              <div>
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-bold text-white">User Management</h2>
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60" />
                      <input
                        type="text"
                        placeholder="Search users..."
                        className="pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-white/60 backdrop-blur-xl"
                      />
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/20">
                        <th className="text-left py-4 px-4 font-semibold text-white">User</th>
                        <th className="text-left py-4 px-4 font-semibold text-white">Role</th>
                        <th className="text-left py-4 px-4 font-semibold text-white">Joined</th>
                        <th className="text-left py-4 px-4 font-semibold text-white">Status</th>
                        <th className="text-left py-4 px-4 font-semibold text-white">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {users.map((u) => (
                        <tr key={u.id} className="hover:bg-white/5 transition-colors duration-300">
                          <td className="py-6 px-4">
                            <div className="flex items-center space-x-4">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                                <span className="text-sm font-semibold text-white">
                                  {u.name.split(' ').map(n => n[0]).join('')}
                                </span>
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-white">{u.name}</p>
                                <p className="text-xs text-white/60">{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-6 px-4">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                              u.role === 'admin' 
                                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' 
                                : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            }`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="py-6 px-4 text-sm text-white/70">
                            {new Date(u.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-6 px-4">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              Active
                            </span>
                          </td>
                          <td className="py-6 px-4">
                            <button className="text-white/60 hover:text-white transition-colors duration-300">
                              <MoreHorizontal className="w-5 h-5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'files' && (
              <div>
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-bold text-white">File Management</h2>
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60" />
                      <input
                        type="text"
                        placeholder="Search files..."
                        className="pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-white/60 backdrop-blur-xl"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {systemFiles.map((file) => (
                    <div key={file.id} className="border border-white/20 rounded-xl p-6 hover:bg-white/5 transition-all duration-300 backdrop-blur-xl">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                            <FileText className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-white">{file.name}</h3>
                            <div className="flex items-center space-x-6 mt-2">
                              <span className="text-sm text-white/60">{formatFileSize(file.size)}</span>
                              <span className="text-sm text-white/60">
                                Uploaded by User {file.userId}
                              </span>
                              <span className="text-sm text-white/60">
                                {new Date(file.uploadedAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                            file.status === 'ready' 
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : file.status === 'processing'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-red-500/20 text-red-300 border border-red-500/30'
                          }`}>
                            {file.status}
                          </span>
                          <button className="text-white/60 hover:text-white transition-colors duration-300">
                            <MoreHorizontal className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'analytics' && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-8">System Analytics</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-white/5 border border-white/20 rounded-xl p-8 backdrop-blur-xl">
                    <h3 className="text-xl font-semibold text-white mb-6">Query Activity</h3>
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <span className="text-white/70">Today</span>
                        <span className="text-lg font-semibold text-white">127 queries</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-white/70">This week</span>
                        <span className="text-lg font-semibold text-white">856 queries</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-white/70">This month</span>
                        <span className="text-lg font-semibold text-white">3,421 queries</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white/5 border border-white/20 rounded-xl p-8 backdrop-blur-xl">
                    <h3 className="text-xl font-semibold text-white mb-6">User Activity</h3>
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <span className="text-white/70">Active users today</span>
                        <span className="text-lg font-semibold text-white">12</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-white/70">New registrations</span>
                        <span className="text-lg font-semibold text-white">3</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-white/70">Files uploaded</span>
                        <span className="text-lg font-semibold text-white">18</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-8">System Settings</h2>
                <div className="space-y-8">
                  <div className="bg-white/5 border border-white/20 rounded-xl p-8 backdrop-blur-xl">
                    <h3 className="text-xl font-semibold text-white mb-6">AI Configuration</h3>
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-lg font-medium text-white">Enable RAG Processing</p>
                          <p className="text-sm text-white/60">Allow documents to be processed for AI queries</p>
                        </div>
                        <div className="relative">
                          <input type="checkbox" className="sr-only" defaultChecked />
                          <div className="w-12 h-6 bg-blue-600 rounded-full relative cursor-pointer">
                            <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 right-0.5 transition-transform shadow-lg"></div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-lg font-medium text-white">Auto-process uploads</p>
                          <p className="text-sm text-white/60">Automatically process uploaded documents</p>
                        </div>
                        <div className="relative">
                          <input type="checkbox" className="sr-only" defaultChecked />
                          <div className="w-12 h-6 bg-blue-600 rounded-full relative cursor-pointer">
                            <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 right-0.5 transition-transform shadow-lg"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white/5 border border-white/20 rounded-xl p-8 backdrop-blur-xl">
                    <h3 className="text-xl font-semibold text-white mb-6">Security Settings</h3>
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-lg font-medium text-white">Require email verification</p>
                          <p className="text-sm text-white/60">Users must verify email before accessing system</p>
                        </div>
                        <div className="relative">
                          <input type="checkbox" className="sr-only" />
                          <div className="w-12 h-6 bg-white/20 rounded-full relative cursor-pointer">
                            <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 left-0.5 transition-transform shadow-lg"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}