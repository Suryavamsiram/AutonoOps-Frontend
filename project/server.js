// server.js - Complete Document Processing Server
// Add this at the very top of server.js
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import fs from 'fs';
import { fileTypeFromBuffer } from 'file-type';
import { Pinecone } from '@pinecone-database/pinecone';
import dotenv from 'dotenv';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import os from 'os';

// Initialize environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const execAsync = promisify(exec);

// Ollama configuration
const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';
const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || 'mxbai-embed-large';

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:3000', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Create uploads directory
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
    files: 10 // Maximum 10 files
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'text/plain',
      'text/markdown',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'application/json',
      'text/csv',
      'text/html',
      'application/rtf'
    ];
    
    const allowedExtensions = ['.txt', '.md', '.pdf', '.docx', '.doc', '.xlsx', '.xls', '.json', '.csv', '.html', '.htm', '.rtf'];
    const fileExtension = path.extname(file.originalname).toLowerCase();
    
    console.log(`📁 Checking file: ${file.originalname}`);
    console.log(`🔍 MIME type: ${file.mimetype}`);
    console.log(`📎 Extension: ${fileExtension}`);
    
    if (allowedTypes.includes(file.mimetype) || allowedExtensions.includes(fileExtension)) {
      console.log('✅ File type accepted');
      cb(null, true);
    } else {
      console.log('❌ File type rejected');
      cb(new Error(`File type not supported: ${file.originalname}. Supported types: ${allowedExtensions.join(', ')}`));
    }
  }
});

// Utility function to check if Ollama is running
async function checkOllamaHealth() {
  try {
    console.log(`🔍 Checking Ollama at: ${OLLAMA_HOST}`);
    const response = await fetch(`${OLLAMA_HOST}/api/tags`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Ollama not responding: ${response.status}`);
    }
    
    const data = await response.json();
    const modelExists = data.models?.some(model => 
      model.name.includes(EMBEDDING_MODEL) || 
      model.name.includes(EMBEDDING_MODEL.split(':')[0])
    );
    
    if (!modelExists) {
      console.warn(`⚠️  Model ${EMBEDDING_MODEL} not found in available models:`);
      console.warn('Available models:', data.models?.map(m => m.name));
      console.warn(`💡 Run: ollama pull ${EMBEDDING_MODEL}`);
      return false;
    }
    
    console.log(`✅ Ollama is running with model: ${EMBEDDING_MODEL}`);
    return true;
  } catch (error) {
    console.error('❌ Ollama health check failed:', error.message);
    console.log('💡 Make sure Ollama is running:');
    console.log('   ollama serve');
    console.log(`   ollama pull ${EMBEDDING_MODEL}`);
    return false;
  }
}

// Function to generate embeddings
async function getEmbedding(text) {
  if (!text || text.trim().length === 0) {
    throw new Error('Text is empty or invalid');
  }

  const cleanText = text.trim().substring(0, 8000);
  
  try {
    console.log(`🤖 Generating embedding for text: "${cleanText.substring(0, 100)}..."`);
    
    const response = await fetch(`${OLLAMA_HOST}/api/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: EMBEDDING_MODEL,
        prompt: cleanText
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ollama API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    
    if (!data.embedding || !Array.isArray(data.embedding)) {
      throw new Error('Invalid embedding response from Ollama');
    }

    console.log(`✅ Generated embedding with ${data.embedding.length} dimensions`);
    return data.embedding;
  } catch (error) {
    console.error('❌ Ollama embedding error:', error);
    throw new Error(`Failed to generate embedding: ${error.message}`);
  }
}

// Function to extract text from PDF
async function extractFromPDF(buffer, filename) {
  console.log(`📄 Extracting text from PDF: ${filename}`);
  
  try {
    const tempFile = path.join(os.tmpdir(), `temp_pdf_${Date.now()}.pdf`);
    const outputFile = path.join(os.tmpdir(), `temp_text_${Date.now()}.txt`);
    
    fs.writeFileSync(tempFile, buffer);
    
    try {
      await execAsync(`pdftotext -layout "${tempFile}" "${outputFile}"`);
      
      if (fs.existsSync(outputFile)) {
        const extractedText = fs.readFileSync(outputFile, 'utf8');
        
        // Clean up temp files
        fs.unlinkSync(tempFile);
        fs.unlinkSync(outputFile);
        
        if (extractedText && extractedText.trim().length > 10) {
          const cleanText = extractedText
            .replace(/\s+/g, ' ')
            .replace(/\n+/g, '\n')
            .trim();
          
          console.log(`✅ PDF extraction successful: ${cleanText.length} characters`);
          return cleanText;
        }
      }
    } catch (cmdError) {
      console.log('📄 pdftotext failed, trying fallback...');
    }
    
    // Clean up temp files
    if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
    if (fs.existsSync(outputFile)) fs.unlinkSync(outputFile);
    
  } catch (error) {
    console.log('📄 pdftotext method failed, trying simple extraction...');
  }
  
  // Fallback method
  try {
    const pdfText = buffer.toString('binary');
    let extractedText = '';
    
    const textRegex = /BT\s*.*?ET/gs;
    const matches = pdfText.match(textRegex);
    
    if (matches) {
      for (const match of matches) {
        const readable = match
          .replace(/[^\x20-\x7E\n\r\t]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        
        if (readable.length > 3) {
          extractedText += readable + ' ';
        }
      }
    }
    
    if (!extractedText || extractedText.length < 20) {
      const readableChars = pdfText.match(/[a-zA-Z0-9\s.,!?;:'"()\-]{5,}/g);
      if (readableChars) {
        extractedText = readableChars
          .filter(text => text.trim().length > 3)
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim();
      }
    }
    
    if (extractedText && extractedText.length > 10) {
      console.log(`✅ Fallback PDF extraction: ${extractedText.length} characters`);
      return extractedText;
    }
    
  } catch (error) {
    console.error('❌ PDF fallback extraction failed:', error);
  }
  
  throw new Error('Could not extract text from PDF. This might be an image-based PDF requiring OCR.');
}

// Function to extract text from files
async function extractTextFromFile(buffer, mimeType, filename) {
  console.log(`🔍 Extracting text from: ${filename} (${mimeType})`);
  
  try {
    switch (mimeType) {
      case 'text/plain':
      case 'text/markdown':
        return buffer.toString('utf-8').trim();
      
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      case 'application/msword':
        const docResult = await mammoth.extractRawText({ buffer });
        return docResult.value.trim();
      
      case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
      case 'application/vnd.ms-excel':
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        let excelText = '';
        
        workbook.SheetNames.forEach(sheetName => {
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
          
          excelText += `Sheet: ${sheetName}\n`;
          jsonData.forEach((row, index) => {
            if (Array.isArray(row) && row.some(cell => cell !== '')) {
              excelText += `Row ${index + 1}: ${row.join(' | ')}\n`;
            }
          });
          excelText += '\n';
        });
        
        return excelText.trim();
      
      case 'application/pdf':
        return await extractFromPDF(buffer, filename);
      
      case 'application/json':
        const jsonText = buffer.toString('utf-8');
        const jsonData = JSON.parse(jsonText);
        return JSON.stringify(jsonData, null, 2);
      
      case 'text/csv':
        return buffer.toString('utf-8').trim();
      
      case 'text/html':
        const htmlText = buffer.toString('utf-8');
        return htmlText
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
          .replace(/<[^>]*>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
      
      case 'application/rtf':
        const rtfText = buffer.toString('utf-8');
        return rtfText
          .replace(/\\[a-z]+\d*\s?/g, '')
          .replace(/[{}]/g, '')
          .replace(/\s+/g, ' ')
          .trim();
      
      default:
        const text = buffer.toString('utf-8');
        if (isReadableText(text)) {
          return text.trim();
        }
        throw new Error(`Unsupported file type: ${mimeType}`);
    }
  } catch (error) {
    console.error(`❌ Text extraction failed for ${filename}:`, error);
    throw new Error(`Failed to extract text: ${error.message}`);
  }
}

// Function to check if text is readable
function isReadableText(text) {
  if (!text || text.length === 0) return false;
  const printableChars = text.match(/[\x20-\x7E\n\r\t]/g);
  return printableChars && (printableChars.length / text.length) > 0.7;
}

// Function to chunk text
function chunkText(text, maxSize = 4000) {
  if (text.length <= maxSize) return [text];
  
  const chunks = [];
  let currentChunk = '';
  
  const paragraphs = text.split(/\n\s*\n/);
  
  for (const paragraph of paragraphs) {
    if (currentChunk.length + paragraph.length > maxSize) {
      if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
        currentChunk = '';
      }
      
      if (paragraph.length > maxSize) {
        const sentences = paragraph.split(/[.!?]+\s+/);
        for (const sentence of sentences) {
          if (currentChunk.length + sentence.length > maxSize) {
            if (currentChunk.trim()) {
              chunks.push(currentChunk.trim());
              currentChunk = sentence;
            }
          } else {
            currentChunk += (currentChunk ? '. ' : '') + sentence;
          }
        }
      } else {
        currentChunk = paragraph;
      }
    } else {
      currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
    }
  }
  
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks.filter(chunk => chunk.length > 0);
}

// Guess MIME type from extension
function guessTypeFromExtension(filename) {
  if (!filename) return 'application/octet-stream';
  
  const ext = filename.split('.').pop()?.toLowerCase();
  const typeMap = {
    'pdf': 'application/pdf',
    'txt': 'text/plain',
    'md': 'text/markdown',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'doc': 'application/msword',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'xls': 'application/vnd.ms-excel',
    'csv': 'text/csv',
    'json': 'application/json',
    'html': 'text/html',
    'htm': 'text/html',
    'rtf': 'application/rtf'
  };
  
  return typeMap[ext] || 'text/plain';
}

// ROUTES

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Document Processing Server',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/api/health',
      processFile: '/api/process-file',
      supportedTypes: '/api/supported-types',
      test: '/api/test'
    }
  });
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const ollamaHealthy = await checkOllamaHealth();
    
    // Check if pdftotext is available
    let pdfToolsAvailable = false;
    try {
      await execAsync('pdftotext -v');
      pdfToolsAvailable = true;
    } catch (error) {
      pdfToolsAvailable = false;
    }
    
    res.json({
      status: ollamaHealthy ? 'OK' : 'DEGRADED',
      timestamp: new Date().toISOString(),
      server: {
        port: PORT,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        nodeVersion: process.version
      },
      ollama: {
        host: OLLAMA_HOST,
        model: EMBEDDING_MODEL,
        healthy: ollamaHealthy
      },
      pdfTools: {
        pdftotext: pdfToolsAvailable
      },
      pinecone: {
        configured: !!(process.env.PINECONE_API_KEY && process.env.PINECONE_INDEX_NAME),
        apiKey: process.env.PINECONE_API_KEY ? 'Set' : 'Missing',
        indexName: process.env.PINECONE_INDEX_NAME || 'Not configured'
      }
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      status: 'ERROR',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Supported types endpoint
app.get('/api/supported-types', (req, res) => {
  res.json({
    supportedTypes: [
      'text/plain',
      'text/markdown',
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'application/json',
      'text/csv',
      'text/html',
      'application/rtf'
    ],
    supportedExtensions: ['.txt', '.md', '.pdf', '.docx', '.doc', '.xlsx', '.xls', '.json', '.csv', '.html', '.htm', '.rtf'],
    embeddingModel: EMBEDDING_MODEL,
    dimensions: 1024,
    maxFileSize: '50MB',
    maxFiles: 10,
    recommendations: {
      pdf: 'For best PDF results, install poppler-utils (pdftotext)',
      imageBasedPdf: 'Image-based PDFs require OCR preprocessing',
      maxFileSize: '50MB per file'
    }
  });
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Server is running!', 
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development'
  });
});

// Main file processing endpoint
app.post('/api/process-file', upload.single('file'), async (req, res) => {
  console.log('\n🚀 Processing file upload...');
  console.log('Request received at:', new Date().toISOString());
  
  try {
    if (!req.file) {
      console.error('❌ No file uploaded');
      return res.status(400).json({ 
        error: 'No file uploaded',
        details: 'Please select a file to upload'
      });
    }

    const { originalname, path: tempPath, size, mimetype } = req.file;
    console.log(`📁 File: ${originalname}`);
    console.log(`📏 Size: ${(size / 1024).toFixed(2)} KB`);
    console.log(`🔍 Type: ${mimetype}`);
    console.log(`📂 Temp path: ${tempPath}`);

    // Validate file exists
    if (!fs.existsSync(tempPath)) {
      throw new Error('Uploaded file not found on server');
    }

    // Read file buffer
    const buffer = fs.readFileSync(tempPath);
    console.log(`📖 Buffer size: ${buffer.length} bytes`);
    
    // Auto-detect file type if needed
    const detected = await fileTypeFromBuffer(buffer);
    const finalMimeType = detected?.mime || mimetype || guessTypeFromExtension(originalname);
    
    console.log(`🎯 Final MIME type: ${finalMimeType}`);

    // Extract text
    console.log('🔍 Starting text extraction...');
    const extractedText = await extractTextFromFile(buffer, finalMimeType, originalname);
    
    if (!extractedText || extractedText.trim().length < 10) {
      throw new Error('No meaningful text could be extracted from the file');
    }

    console.log(`✅ Extracted ${extractedText.length} characters`);
    console.log(`📖 Preview: "${extractedText.substring(0, 200)}..."`);

    // Split into chunks
    const chunks = chunkText(extractedText, 4000);
    console.log(`🔪 Created ${chunks.length} chunks`);

    // Check if Ollama is available before processing
    const ollamaHealthy = await checkOllamaHealth();
    if (!ollamaHealthy) {
      throw new Error('Ollama service is not available. Please check if Ollama is running and the embedding model is installed.');
    }

    // Generate embeddings
    console.log('🤖 Starting embedding generation...');
    const embeddings = [];
    for (let i = 0; i < chunks.length; i++) {
      console.log(`🤖 Processing chunk ${i + 1}/${chunks.length}`);
      
      try {
        const embedding = await getEmbedding(chunks[i]);
        embeddings.push({
          embedding,
          text: chunks[i],
          chunkIndex: i
        });
      } catch (embeddingError) {
        console.error(`❌ Failed to generate embedding for chunk ${i + 1}:`, embeddingError);
        throw new Error(`Failed to generate embedding for chunk ${i + 1}: ${embeddingError.message}`);
      }
      
      // Brief pause between requests
      if (i < chunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    console.log(`🎯 Generated ${embeddings.length} embeddings`);

    // Upload to Pinecone (if configured)
    let vectorsUploaded = 0;
    if (process.env.PINECONE_API_KEY && process.env.PINECONE_INDEX_NAME) {
      try {
        console.log('☁️  Uploading to Pinecone...');
        const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
        const index = pinecone.Index(process.env.PINECONE_INDEX_NAME);

        const vectors = embeddings.map((emb, idx) => ({
          id: `${Date.now()}_${originalname.replace(/[^a-zA-Z0-9]/g, '_')}_chunk_${idx}`,
          values: emb.embedding,
          metadata: {
            filename: originalname,
            fileType: finalMimeType,
            fileSize: size,
            uploadedAt: new Date().toISOString(),
            chunkIndex: emb.chunkIndex,
            totalChunks: embeddings.length,
            textContent: emb.text,
            textPreview: emb.text.substring(0, 500),
            embeddingModel: EMBEDDING_MODEL,
            dimensions: emb.embedding.length
          }
        }));

        // Upsert in batches
        const batchSize = 100;
        for (let i = 0; i < vectors.length; i += batchSize) {
          const batch = vectors.slice(i, i + batchSize);
          await index.upsert(batch);
          console.log(`📤 Uploaded batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(vectors.length/batchSize)}`);
        }

        vectorsUploaded = vectors.length;
        console.log(`✅ Successfully uploaded ${vectorsUploaded} vectors to Pinecone!`);
      } catch (pineconeError) {
        console.error('⚠️  Pinecone upload failed:', pineconeError);
        // Continue without Pinecone - just log the error
      }
    } else {
      console.log('⚠️  Pinecone not configured - skipping vector upload');
    }

    // Clean up temp file
    try {
      fs.unlinkSync(tempPath);
      console.log('🧹 Cleaned up temp file');
    } catch (cleanupError) {
      console.warn('⚠️  Failed to clean up temp file:', cleanupError);
    }

    console.log('🎉 File processing completed!\n');

    // Send success response
    res.status(200).json({
      success: true,
      message: 'File processed successfully',
      metadata: {
        name: originalname,
        size: size,
        type: finalMimeType,
        textLength: extractedText.length,
        chunks: chunks.length,
        vectorsCreated: embeddings.length,
        vectorsUploaded: vectorsUploaded,
        embeddingModel: EMBEDDING_MODEL,
        dimensions: embeddings[0]?.embedding?.length || 0,
        textPreview: extractedText.substring(0, 300) + (extractedText.length > 300 ? '...' : ''),
        processingTime: Date.now(),
        pineconeConfigured: !!(process.env.PINECONE_API_KEY && process.env.PINECONE_INDEX_NAME)
      }
    });

  } catch (error) {
    console.error('❌ Processing error:', error);
    
    // Clean up temp file if it exists
    if (req.file?.path && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
        console.log('🧹 Cleaned up temp file after error');
      } catch (cleanupError) {
        console.warn('⚠️  Failed to clean up temp file after error:', cleanupError);
      }
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to process file',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('❌ Unhandled error:', error);
  
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'File too large',
        details: 'Maximum file size is 50MB',
        code: 'FILE_TOO_LARGE'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        error: 'Too many files',
        details: 'Maximum 10 files allowed',
        code: 'TOO_MANY_FILES'
      });
    }
  }
  
  res.status(500).json({
    error: 'Internal server error',
    details: error.message,
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.method} ${req.originalUrl} not found`,
    availableRoutes: [
      'GET /',
      'GET /api/health',
      'GET /api/supported-types',
      'GET /api/test',
      'POST /api/process-file'
    ]
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log('🌟 ===================================');
  console.log('🚀 Document Processing Server Started');
  console.log('🌟 ===================================');
  console.log(`📡 Server: http://localhost:${PORT}`);
  console.log(`📁 Upload: http://localhost:${PORT}/api/process-file`);
  console.log(`❤️  Health: http://localhost:${PORT}/api/health`);
  console.log(`🧪 Test: http://localhost:${PORT}/api/test`);
  console.log(`🤖 Model: ${EMBEDDING_MODEL}`);
  console.log(`📂 Uploads: ${uploadsDir}`);
  console.log('🌟 ===================================\n');
  
  // Initial health check
  setTimeout(async () => {
    console.log('🔍 Running initial health checks...');
    await checkOllamaHealth();
    
    // Check Pinecone configuration
    if (process.env.PINECONE_API_KEY && process.env.PINECONE_INDEX_NAME) {
      console.log('✅ Pinecone configured');
    } else {
      console.log('⚠️  Pinecone not configured (optional)');
    }
    
    console.log('🚀 Server is ready to accept requests!\n');
  }, 1000);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully...');
  server.close(() => {
    console.log('🔚 Server shut down');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT, shutting down gracefully...');
  server.close(() => {
    console.log('🔚 Server shut down');
    process.exit(0);
  });
});

export default app;