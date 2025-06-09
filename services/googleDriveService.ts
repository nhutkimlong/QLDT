// Declare GAPI global variable - Kept for potential future non-upload uses, but not for upload auth
// This is loaded from <script> tags in index.html
declare const gapi: any; 

// Minimal type definitions for Google Identity Services - Kept for potential future non-upload uses
declare global {
    namespace google {
        namespace accounts {
            namespace oauth2 {
                interface TokenResponse {
                    access_token: string;
                    error?: any; 
                    [key: string]: any; 
                }

                interface TokenClientConfig {
                    client_id: string;
                    scope: string;
                    callback: (resp: TokenResponse) => void;
                }

                interface TokenClient {
                    requestAccessToken: (overrideConfig?: {prompt?: string}) => void;
                    callback?: (resp: TokenResponse) => void; 
                }
                
                function initTokenClient(config: TokenClientConfig): TokenClient;
                function revoke(token: string, callback: () => void): void;
            }
        }
    }
}


import { UUID } from '../types';
import { google } from 'googleapis';
import { Readable } from 'stream';
import iconv from 'iconv-lite';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { createWorker } from 'tesseract.js';
import { PDFDocument } from 'pdf-lib';
import sharp from 'sharp';
import path from 'path';

// --- Configuration for Local Service Account Uploader ---
const LOCAL_UPLOADER_ENDPOINT = 'http://localhost:3001/upload-local'; // Matches port in localDriveUploader.js
// --- End Configuration ---

interface DriveFileMetadata {
  id: string;
  name: string;
  mimeType: string;
  sizeBytes?: number;
  webViewLink: string;
  downloadLink?: string;
  extractedText?: string;
}

type UploadModule = 'vanban' | 'vanbandulich';

const API_URL = import.meta.env.VITE_API_URL || '/.netlify/functions/api';

// Cấu hình Google Drive API
const TARGET_GOOGLE_DRIVE_FOLDER_ID = '1WMmPS_dcfLO1us_jWywB1dg2oPsuZoUJ';

// Khởi tạo Google Drive API client
const auth = new google.auth.GoogleAuth({
  keyFile: 'service-account-key.json',
  scopes: ['https://www.googleapis.com/auth/drive.file'],
});

const drive = google.drive({ version: 'v3', auth });

// Hàm hỗ trợ: Tìm hoặc tạo folder con theo module
async function getOrCreateSubFolder(moduleName: string, parentFolderId: string) {
  const driveRes = await drive.files.list({
    q: `name='${moduleName}' and mimeType='application/vnd.google-apps.folder' and '${parentFolderId}' in parents and trashed=false`,
    fields: 'files(id, name)',
    spaces: 'drive',
  });
  
  if (driveRes.data.files && driveRes.data.files.length > 0) {
    return driveRes.data.files[0].id;
  }
  
  const folder = await drive.files.create({
    resource: {
      name: moduleName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentFolderId],
    },
    fields: 'id',
  });
  
  return folder.data.id;
}

// Hàm xử lý OCR cho PDF scan
async function processPdfWithOCR(pdfBuffer: Buffer) {
  let worker = null;
  try {
    worker = await createWorker({
      langPath: path.join(process.cwd(), 'tessdata'),
      logger: m => console.log(m)
    });
    
    await worker.loadLanguage('vie');
    await worker.initialize('vie');
    
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const numPages = pdfDoc.getPageCount();
    let fullText = '';

    for (let i = 0; i < numPages; i++) {
      const page = pdfDoc.getPage(i);
      const { width, height } = page.getSize();
      
      const pngBytes = await page.renderToPng({
        width: width * 2,
        height: height * 2
      });
      
      const optimizedImage = await sharp(pngBytes)
        .grayscale()
        .normalize()
        .sharpen()
        .toBuffer();
      
      const { data: { text } } = await worker.recognize(optimizedImage);
      fullText += text + '\n';
    }

    return fullText;
  } catch (error) {
    console.error('Lỗi OCR:', error);
    throw error;
  } finally {
    if (worker) {
      await worker.terminate();
    }
  }
}

export const googleDriveService = {
  // This flag is now effectively always true for the service's upload logic
  isLocalUploaderEnabled: () => true, 
  
  // ensureInitialized, isSignedIn, requestAccessToken, signOut, getAppFolderIdClientSide
  // are removed as they pertain to client-side OAuth flow which is no longer used for uploads.
  // If other GAPI features were to be used (e.g., file picking, not implemented),
  // a separate initialization for those might be needed. For now, KISS.

  // --- File Upload via Local Service Account (Now the ONLY method) ---
  uploadFileViaLocalService: async (file: File, _documentIdForLog?: UUID, module: UploadModule = 'vanban'): Promise<DriveFileMetadata> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('module', module);

    try {
      console.log(`Uploading ${file.name} to local service at ${LOCAL_UPLOADER_ENDPOINT} (module: ${module})`);
      const response = await fetch(LOCAL_UPLOADER_ENDPOINT, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error('Local uploader server Error:', errorBody);
        throw new Error(`Upload via local server failed: ${response.statusText} - ${errorBody}`);
      }
      const uploadedFile: DriveFileMetadata = await response.json();
      return uploadedFile;
    } catch (error) {
      console.error("Error uploading file via local service:", error);
      throw error;
    }
  },

  // --- Unified File Upload Method (Now simplified) ---
  uploadFile: async (file: File, _documentId?: string, module: UploadModule = 'vanban'): Promise<DriveFileMetadata> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('module', module);

    try {
      const response = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Upload failed: ${response.statusText} - ${errorBody}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error uploading file:", error);
      throw error;
    }
  },

  // Upload file lên Google Drive
  uploadFileToGoogleDrive: async (file: File, moduleName: string = 'vanban'): Promise<DriveFileMetadata> => {
    try {
      const subFolderId = await getOrCreateSubFolder(moduleName, TARGET_GOOGLE_DRIVE_FOLDER_ID);
      
      const fileName = iconv.decode(Buffer.from(file.name, 'latin1'), 'utf8');
      
      const fileMetadata = {
        name: fileName,
        parents: [subFolderId],
      };

      const media = {
        mimeType: file.type,
        body: Readable.from(await file.arrayBuffer()),
      };

      // Trích xuất text nếu là PDF hoặc Word
      let extractedText = '';
      if (file.type === 'application/pdf') {
        try {
          const pdfData = await pdfParse(await file.arrayBuffer());
          extractedText = pdfData.text;

          if (!extractedText || extractedText.trim().length < 100) {
            extractedText = await processPdfWithOCR(Buffer.from(await file.arrayBuffer()));
          }
        } catch (err) {
          try {
            extractedText = await processPdfWithOCR(Buffer.from(await file.arrayBuffer()));
          } catch (ocrErr) {
            console.error('Lỗi OCR:', ocrErr);
          }
        }
      } else if (
        file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        file.type === 'application/msword'
      ) {
        try {
          const result = await mammoth.extractRawText({ buffer: await file.arrayBuffer() });
          extractedText = result.value;
        } catch (err) {
          console.error('Lỗi trích xuất Word:', err);
        }
      }

      const driveResponse = await drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: 'id, name, mimeType, webViewLink, size, webContentLink',
      });

      return {
        id: driveResponse.data.id,
        name: driveResponse.data.name,
        mimeType: driveResponse.data.mimeType,
        sizeBytes: driveResponse.data.size ? parseInt(driveResponse.data.size, 10) : undefined,
        webViewLink: driveResponse.data.webViewLink,
        downloadLink: driveResponse.data.webContentLink || null,
        extractedText: extractedText || undefined,
      };
    } catch (error) {
      console.error('Error uploading to Google Drive:', error);
      throw error;
    }
  },

  // Xóa file từ Google Drive
  deleteFile: async (fileId: string) => {
    try {
      const response = await fetch(`${API_URL}/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Delete failed: ${response.statusText} - ${errorBody}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error deleting file:", error);
      throw error;
    }
  },

  // Đọc file từ Google Drive
  readFile: async (fileId: string) => {
    try {
      const response = await fetch(`${API_URL}/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Read failed: ${response.statusText} - ${errorBody}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error reading file:", error);
      throw error;
    }
  },
};
