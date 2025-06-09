import { google } from 'googleapis';
import multer from 'multer';
import { Readable } from 'stream';
import iconv from 'iconv-lite';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { createWorker } from 'tesseract.js';
import { PDFDocument } from 'pdf-lib';
import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cấu hình Google Drive API
const auth = new google.auth.GoogleAuth({
  keyFile: path.join(__dirname, '../../service-account-key.json'),
  scopes: ['https://www.googleapis.com/auth/drive.file'],
});

const drive = google.drive({ version: 'v3', auth });

// Hàm hỗ trợ: Tìm hoặc tạo folder con theo module
async function getOrCreateSubFolder(moduleName, parentFolderId) {
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
async function processPdfWithOCR(pdfBuffer) {
  let worker = null;
  try {
    worker = await createWorker({
      langPath: path.join(__dirname, '../../tessdata'),
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

export async function handler(event, context) {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    const path = event.path.replace('/.netlify/functions/api', '');
    
    if (path === '/upload' && event.httpMethod === 'POST') {
      const formData = JSON.parse(event.body);
      const file = formData.file;
      const module = formData.module || 'vanban';

      const subFolderId = await getOrCreateSubFolder(module, process.env.GOOGLE_DRIVE_FOLDER_ID);
      
      const fileName = iconv.decode(Buffer.from(file.name, 'latin1'), 'utf8');
      
      const fileMetadata = {
        name: fileName,
        parents: [subFolderId],
      };

      const media = {
        mimeType: file.type,
        body: Readable.from(Buffer.from(file.data)),
      };

      // Trích xuất text nếu là PDF hoặc Word
      let extractedText = '';
      if (file.type === 'application/pdf') {
        try {
          const pdfData = await pdfParse(Buffer.from(file.data));
          extractedText = pdfData.text;

          if (!extractedText || extractedText.trim().length < 100) {
            extractedText = await processPdfWithOCR(Buffer.from(file.data));
          }
        } catch (err) {
          try {
            extractedText = await processPdfWithOCR(Buffer.from(file.data));
          } catch (ocrErr) {
            console.error('Lỗi OCR:', ocrErr);
          }
        }
      } else if (
        file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        file.type === 'application/msword'
      ) {
        try {
          const result = await mammoth.extractRawText({ buffer: Buffer.from(file.data) });
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
        statusCode: 200,
        headers,
        body: JSON.stringify({
          id: driveResponse.data.id,
          name: driveResponse.data.name,
          mimeType: driveResponse.data.mimeType,
          sizeBytes: driveResponse.data.size ? parseInt(driveResponse.data.size, 10) : undefined,
          webViewLink: driveResponse.data.webViewLink,
          downloadLink: driveResponse.data.webContentLink || null,
          extractedText: extractedText || undefined,
        })
      };
    }

    if (path === '/delete' && event.httpMethod === 'POST') {
      const { fileId } = JSON.parse(event.body);
      if (!fileId) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Missing fileId' })
        };
      }

      await drive.files.delete({ fileId });
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true })
      };
    }

    if (path === '/read' && event.httpMethod === 'POST') {
      const { fileId } = JSON.parse(event.body);
      if (!fileId) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'File ID is required' })
        };
      }

      const fileMetadata = await drive.files.get({
        fileId: fileId,
        fields: 'mimeType'
      });

      const response = await drive.files.get({
        fileId: fileId,
        alt: 'media'
      }, {
        responseType: 'arraybuffer'
      });

      const buffer = Buffer.from(response.data);
      let content = '';

      if (fileMetadata.data.mimeType === 'application/pdf') {
        try {
          const pdfData = await pdfParse(buffer);
          content = pdfData.text;
        } catch (err) {
          content = await processPdfWithOCR(buffer);
        }
      } else if (
        fileMetadata.data.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        fileMetadata.data.mimeType === 'application/msword'
      ) {
        const result = await mammoth.extractRawText({ buffer });
        content = result.value;
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ content })
      };
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Not Found' })
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
} 