import React, { useState, useRef, useEffect } from 'react';
import { Upload, FileText, Trash2, Download, Eye, CheckCircle, AlertCircle, Clock, FolderOpen, Zap, Activity, Server, RefreshCw } from 'lucide-react';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
  status: 'processing' | 'ready' | 'error';
  userId: string;
  processingDetails?: {
    textLength?: number;
    chunks?: number;
    vectorsCreated?: number;
    embeddingModel?: string;
    dimensions?: number;
    textPreview?: string;
    pineconeConfigured?: boolean;
  };
  errorMessage?: string;
}

interface ServerHealth {
  status: string;
  timestamp: string;
  server: {
    port: number;
    uptime: number;
    memory: {
      rss: number;
      heapTotal: number;
      heapUsed: number;
      external: number;
    };
    nodeVersion: string;
  };
  ollama: {
    host: string;
    model: string;
    healthy: boolean;
  };
  pdfTools: {
    pdftotext: boolean;
  };
  pinecone: {
    configured: boolean;
    apiKey: string;
    indexName: string;
  };
}

interface SupportedTypes {
  supportedTypes: string[];
  supportedExtensions: string[];
  embeddingModel: string;
  dimensions: number;
  maxFileSize: string;
  maxFiles: number;
  recommendations: {
    pdf: string;
    imageBasedPdf: string;
    maxFileSize: string;
  };
}

interface PreviewModalProps {
  content: string;
  fileName: string;
  onClose: () => void;
}

const PreviewModal: React.FC<PreviewModalProps> = ({ content, fileName, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        <div className="p-4 border-b border-white/20 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-white">Preview: {fileName}</h3>
          <button 
            onClick={onClose}
            className="text-white/60 hover:text-white"
          >
            ✕
          </button>
        </div>
        <div className="p-6 overflow-auto flex-1">
          <pre className="text-white/80 whitespace-pre-wrap font-sans text-sm">
            {content}
          </pre>
        </div>
        <div className="p-4 border-t border-white/20 flex justify-end">
          <button
            onClick={onClose}
            className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default function Dashboard() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [serverHealth, setServerHealth] = useState<ServerHealth | null>(null);
  const [supportedTypes, setSupportedTypes] = useState<SupportedTypes | null>(null);
  const [isLoadingHealth, setIsLoadingHealth] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewFile, setPreviewFile] = useState<{
    content: string;
    fileName: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check server health on component mount
  useEffect(() => {
    checkServerHealth();
    fetchSupportedTypes();
    const savedFiles = localStorage.getItem('uploadedFiles');
    if (savedFiles) {
      setFiles(JSON.parse(savedFiles));
    }
  }, []);

  // Save files to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('uploadedFiles', JSON.stringify(files));
  }, [files]);

  const checkServerHealth = async () => {
    setIsLoadingHealth(true);
    try {
      const response = await fetch('http://localhost:3001/api/health');
      if (response.ok) {
        const health = await response.json();
        setServerHealth(health);
      }
    } catch (error) {
      console.error('Failed to check server health:', error);
    } finally {
      setIsLoadingHealth(false);
    }
  };

  const fetchSupportedTypes = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/supported-types');
      if (response.ok) {
        const types = await response.json();
        setSupportedTypes(types);
      }
    } catch (error) {
      console.error('Failed to fetch supported types:', error);
    }
  };

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

  const isFileTypeSupported = (file: File): boolean => {
    if (!supportedTypes) return true;
    
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    return supportedTypes.supportedExtensions.includes(extension) || 
           supportedTypes.supportedTypes.includes(file.type);
  };

  const handleFiles = async (fileList: FileList) => {
    setIsProcessing(true);
    const fileArray = Array.from(fileList);
    
    if (fileArray.length + files.length > (supportedTypes?.maxFiles || 10)) {
      alert(`You can only upload up to ${supportedTypes?.maxFiles || 10} files at a time.`);
      setIsProcessing(false);
      return;
    }

    for (const file of fileArray) {
      if (!isFileTypeSupported(file)) {
        alert(`File type not supported: ${file.name}. Supported types: ${supportedTypes?.supportedExtensions.join(', ')}`);
        continue;
      }

      if (file.size > 50 * 1024 * 1024) {
        alert(`File too large: ${file.name}. Maximum size is ${supportedTypes?.maxFileSize || '50MB'}.`);
        continue;
      }

      const newFile: UploadedFile = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        name: file.name,
        size: file.size,
        type: file.type,
        uploadedAt: new Date().toISOString(),
        status: 'processing',
        userId: '1'
      };

      setFiles(prev => [newFile, ...prev]);

      const formData = new FormData();
      formData.append('file', file);
      
      try {
        const response = await fetch('http://localhost:3001/api/process-file', {
          method: 'POST',
          body: formData
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          console.error('Backend error:', errorData);
          
          setFiles(prev =>
            prev.map(f => f.id === newFile.id ? { 
              ...f, 
              status: 'error',
              errorMessage: errorData.details || errorData.error || 'Processing failed'
            } : f)
          );
          continue;
        }

        const result = await response.json();
        console.log('Upload successful:', result);
        
        setFiles(prev =>
          prev.map(f => f.id === newFile.id ? { 
            ...f, 
            status: 'ready',
            processingDetails: result.metadata
          } : f)
        );
        
      } catch (error) {
        console.error('API error:', error);
        
        setFiles(prev =>
          prev.map(f => f.id === newFile.id ? { 
            ...f, 
            status: 'error',
            errorMessage: error instanceof Error ? error.message : 'Network error: Unable to connect to server'
          } : f)
        );
      }
    }
    setIsProcessing(false);
  };

  const deleteFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const downloadFile = async (fileId: string) => {
    const file = files.find(f => f.id === fileId);
    if (!file || !file.processingDetails?.textPreview) {
      alert('No preview available for this file');
      return;
    }

    const element = document.createElement('a');
    const textFile = new Blob([file.processingDetails.textPreview], {type: 'text/plain'});
    element.href = URL.createObjectURL(textFile);
    element.download = `${file.name.split('.')[0]}_preview.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const showPreview = (fileId: string) => {
    const file = files.find(f => f.id === fileId);
    if (!file) return;

    if (file.status !== 'ready') {
      alert('File is not ready for preview yet');
      return;
    }

    setPreviewFile({
      content: file.processingDetails?.textPreview || 'No preview available',
      fileName: file.name
    });
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

  const getFileTypeIcon = (type: string) => {
    if (type.includes('pdf')) return '📄';
    if (type.includes('word') || type.includes('document')) return '📝';
    if (type.includes('spreadsheet') || type.includes('excel')) return '📊';
    if (type.includes('text') || type.includes('markdown')) return '📃';
    if (type.includes('html')) return '🌐';
    if (type.includes('rtf')) return '📄';
    if (type.includes('json')) return '🔧';
    if (type.includes('csv')) return '📈';
    return '📁';
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
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
            
            {/* Server Status */}
            <div className="flex items-center space-x-4">
              <button
                onClick={checkServerHealth}
                disabled={isLoadingHealth}
                className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl px-4 py-2 text-white/80 hover:text-white transition-all duration-300"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingHealth ? 'animate-spin' : ''}`} />
                <span>Refresh Status</span>
              </button>
              
              <div className={`flex items-center space-x-2 px-4 py-2 rounded-xl border ${
                serverHealth?.status === 'OK' 
                  ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' 
                  : serverHealth?.status === 'DEGRADED'
                    ? 'bg-amber-500/20 border-amber-500/30 text-amber-400'
                    : 'bg-red-500/20 border-red-500/30 text-red-400'
              }`}>
                <Server className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {serverHealth ? serverHealth.status : 'Checking...'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Server Info & Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
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

          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                <Activity className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {supportedTypes?.embeddingModel?.split('-')[0] || 'N/A'}
                </p>
                <p className="text-white/70">AI Model</p>
              </div>
            </div>
          </div>
        </div>

        {/* Server Health Details */}
        {serverHealth && (
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 mb-10 shadow-lg">
            <h3 className="text-xl font-bold text-white mb-4">Server Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${serverHealth.ollama.healthy ? 'bg-emerald-400' : 'bg-red-400'}`} />
                <div>
                  <p className="text-white font-medium">Ollama Service</p>
                  <p className="text-white/60 text-sm">{serverHealth.ollama.model}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${serverHealth.pdfTools.pdftotext ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                <div>
                  <p className="text-white font-medium">PDF Tools</p>
                  <p className="text-white/60 text-sm">{serverHealth.pdfTools.pdftotext ? 'Available' : 'Limited'}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${serverHealth.pinecone.configured ? 'bg-emerald-400' : 'bg-blue-400'}`} />
                <div>
                  <p className="text-white font-medium">Vector Database</p>
                  <p className="text-white/60 text-sm">{serverHealth.pinecone.configured ? 'Configured' : 'Not configured'}</p>
                </div>
              </div>
            </div>
          </div>
        )}

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
              accept={supportedTypes?.supportedExtensions.join(',') || '.pdf,.docx,.txt,.md,.csv,.json,.html,.rtf,.xlsx'}
              className="hidden"
            />
            
            <div className="flex flex-col items-center space-y-6">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Upload className="w-10 h-10 text-white" />
              </div>
              
              <div>
                <h3 className="text-2xl font-bold text-white mb-3">
                  {isProcessing ? 'Processing files...' : 'Drop files here or click to upload'}
                </h3>
                <p className="text-white/70 text-lg mb-2">
                  {supportedTypes ? 
                    `Supported: ${supportedTypes.supportedExtensions.join(', ')}` :
                    'Support for PDF, DOCX, TXT, Markdown, CSV, JSON, HTML, RTF files'
                  }
                </p>
                <p className="text-white/60 text-sm mb-6">
                  Maximum file size: {supportedTypes?.maxFileSize || '50MB'} | Max files: {supportedTypes?.maxFiles || 10}
                </p>
                
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessing}
                  className={`bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-300 shadow-lg ${
                    isProcessing ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isProcessing ? 'Processing...' : 'Choose Files'}
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
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg text-white text-xl">
                        {getFileTypeIcon(file.type)}
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
                        
                        {/* Processing Details */}
                        {file.processingDetails && file.status === 'ready' && (
                          <div className="mt-3 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                            <div className="flex flex-wrap items-center gap-4 text-sm text-emerald-400">
                              <span>✓ {file.processingDetails.textLength?.toLocaleString()} chars extracted</span>
                              <span>✓ {file.processingDetails.chunks} chunks created</span>
                              <span>✓ {file.processingDetails.vectorsCreated} vectors generated</span>
                              {file.processingDetails.pineconeConfigured && (
                                <span>✓ Uploaded to vector database</span>
                              )}
                            </div>
                            {file.processingDetails.textPreview && (
                              <p className="text-xs text-white/60 mt-2 truncate">
                                Preview: {file.processingDetails.textPreview}
                              </p>
                            )}
                          </div>
                        )}
                        
                        {/* Error Details */}
                        {file.status === 'error' && file.errorMessage && (
                          <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                            <p className="text-sm text-red-400">
                              ❌ {file.errorMessage}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => showPreview(file.id)}
                        disabled={file.status !== 'ready'}
                        className={`p-3 rounded-xl transition-all duration-300 ${
                          file.status === 'ready' 
                            ? 'text-white/60 hover:text-blue-400 hover:bg-blue-500/20' 
                            : 'text-white/30 cursor-not-allowed'
                        }`}
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => downloadFile(file.id)}
                        disabled={file.status !== 'ready'}
                        className={`p-3 rounded-xl transition-all duration-300 ${
                          file.status === 'ready' 
                            ? 'text-white/60 hover:text-emerald-400 hover:bg-emerald-500/20' 
                            : 'text-white/30 cursor-not-allowed'
                        }`}
                      >
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

      {/* Preview Modal */}
      {previewFile && (
        <PreviewModal 
          content={previewFile.content}
          fileName={previewFile.fileName}
          onClose={() => setPreviewFile(null)}
        />
      )}
    </div>
  );
}