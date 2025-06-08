import React, { useState, useRef } from 'react';
import { Upload, FileText, Trash2, Download, Eye, CheckCircle, AlertCircle, Clock, FolderOpen, Zap } from 'lucide-react';
import { UploadedFile } from '../types';
import { useAuth } from '../hooks/useAuth';

export default function Dashboard() {
  const { user } = useAuth();
  const [files, setFiles] = useState<UploadedFile[]>([
    {
      id: '1',
      name: 'Product Documentation.pdf',
      size: 2457600,
      type: 'application/pdf',
      uploadedAt: '2024-01-15T10:30:00Z',
      status: 'ready',
      userId: user?.id || '1'
    },
    {
      id: '2',
      name: 'User Manual.docx',
      size: 1048576,
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      uploadedAt: '2024-01-14T14:20:00Z',
      status: 'processing',
      userId: user?.id || '1'
    }
  ]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = (fileList: FileList) => {
    Array.from(fileList).forEach(file => {
      const newFile: UploadedFile = {
        id: Date.now().toString(),
        name: file.name,
        size: file.size,
        type: file.type,
        uploadedAt: new Date().toISOString(),
        status: 'processing',
        userId: user?.id || '1'
      };
      
      setFiles(prev => [newFile, ...prev]);
      
      // Simulate processing
      setTimeout(() => {
        setFiles(prev => prev.map(f => 
          f.id === newFile.id ? { ...f, status: 'ready' as const } : f
        ));
      }, 3000);
    });
  };

  const deleteFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusIcon = (status: UploadedFile['status']) => {
    switch (status) {
      case 'ready':
        return <CheckCircle className="w-5 h-5 text-emerald-400" />;
      case 'processing':
        return <Clock className="w-5 h-5 text-amber-400 animate-spin" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-400" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: UploadedFile['status']) => {
    switch (status) {
      case 'ready':
        return 'Ready for AI';
      case 'processing':
        return 'Processing...';
      case 'error':
        return 'Error';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <FolderOpen className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Document Library</h1>
              <p className="text-white/70 text-lg">
                Upload and manage your documents for AI-powered insights
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                <FileText className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="text-3xl font-bold text-white">{files.length}</p>
                <p className="text-white/70">Total Documents</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg">
                <Zap className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="text-3xl font-bold text-white">
                  {files.filter(f => f.status === 'ready').length}
                </p>
                <p className="text-white/70">Ready for AI</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                <Clock className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="text-3xl font-bold text-white">
                  {files.filter(f => f.status === 'processing').length}
                </p>
                <p className="text-white/70">Processing</p>
              </div>
            </div>
          </div>
        </div>

        {/* Upload Area */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 mb-10 shadow-lg">
          <div
            className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 ${
              dragActive 
                ? 'border-blue-400 bg-blue-500/20' 
                : 'border-white/30 hover:border-white/50'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleChange}
              accept=".pdf,.docx,.txt,.md"
              className="hidden"
            />
            
            <div className="flex flex-col items-center space-y-6">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Upload className="w-10 h-10 text-white" />
              </div>
              
              <div>
                <h3 className="text-2xl font-bold text-white mb-3">
                  Drop files here or click to upload
                </h3>
                <p className="text-white/70 text-lg mb-6">
                  Support for PDF, DOCX, TXT, and Markdown files up to 10MB
                </p>
                
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-300 shadow-lg"
                >
                  Choose Files
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Files List */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-lg overflow-hidden">
          <div className="p-8 border-b border-white/20">
            <h2 className="text-2xl font-bold text-white">Uploaded Documents</h2>
          </div>
          
          <div className="divide-y divide-white/10">
            {files.length === 0 ? (
              <div className="p-12 text-center">
                <FileText className="w-16 h-16 text-white/40 mx-auto mb-4" />
                <p className="text-white/60 text-lg">No documents uploaded yet</p>
              </div>
            ) : (
              files.map((file) => (
                <div key={file.id} className="p-6 hover:bg-white/5 transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1 min-w-0">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                        <FileText className="w-6 h-6 text-white" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-white truncate">
                          {file.name}
                        </h3>
                        <div className="flex items-center space-x-6 mt-2">
                          <span className="text-sm text-white/60">
                            {formatFileSize(file.size)}
                          </span>
                          <span className="text-sm text-white/60">
                            {new Date(file.uploadedAt).toLocaleDateString()}
                          </span>
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(file.status)}
                            <span className="text-sm text-white/60">
                              {getStatusText(file.status)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button className="p-3 text-white/60 hover:text-blue-400 hover:bg-blue-500/20 rounded-xl transition-all duration-300">
                        <Eye className="w-5 h-5" />
                      </button>
                      <button className="p-3 text-white/60 hover:text-emerald-400 hover:bg-emerald-500/20 rounded-xl transition-all duration-300">
                        <Download className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => deleteFile(file.id)}
                        className="p-3 text-white/60 hover:text-red-400 hover:bg-red-500/20 rounded-xl transition-all duration-300"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}