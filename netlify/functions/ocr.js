import { google } from 'googleapis';
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
    const { fileId } = JSON.parse(event.body);
    if (!fileId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'File ID is required' })
      };
    }

    // Lấy file từ Google Drive
    const response = await drive.files.get({
      fileId: fileId,
      alt: 'media'
    }, {
      responseType: 'arraybuffer'
    });

    const buffer = Buffer.from(response.data);
    
    // Xử lý OCR
    const text = await processPdfWithOCR(buffer);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ text })
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