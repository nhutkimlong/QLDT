import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { google } from 'googleapis';
import path from 'path';
import { fileURLToPath } from 'url';
import { Readable } from 'stream';
import iconv from 'iconv-lite';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { createWorker } from 'tesseract.js';
import { PDFDocument } from 'pdf-lib';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3001;

// Cấu hình CORS
app.use(cors());
app.use(express.json());

// Cấu hình multer
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Cấu hình Google Drive API
const auth = new google.auth.GoogleAuth({
  keyFile: path.join(__dirname, '../service-account-key.json'),
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
      langPath: path.join(__dirname, '../tessdata'),
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

// API endpoints
app.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }

  try {
    let moduleName = 'vanban';
    if (req.body && req.body.module) moduleName = req.body.module;

    const subFolderId = await getOrCreateSubFolder(moduleName, process.env.GOOGLE_DRIVE_FOLDER_ID);

    const fileName = iconv.decode(Buffer.from(req.file.originalname, 'latin1'), 'utf8');
    
    const fileMetadata = {
      name: fileName,
      parents: [subFolderId],
    };

    const media = {
      mimeType: req.file.mimetype,
      body: Readable.from(req.file.buffer),
    };

    // Trích xuất text nếu là PDF hoặc Word
    let extractedText = '';
    if (req.file.mimetype === 'application/pdf') {
      try {
        const pdfData = await pdfParse(req.file.buffer);
        extractedText = pdfData.text;

        if (!extractedText || extractedText.trim().length < 100) {
          extractedText = await processPdfWithOCR(req.file.buffer);
        }
      } catch (err) {
        try {
          extractedText = await processPdfWithOCR(req.file.buffer);
        } catch (ocrErr) {
          console.error('Lỗi OCR:', ocrErr);
        }
      }
    } else if (
      req.file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      req.file.mimetype === 'application/msword'
    ) {
      try {
        const result = await mammoth.extractRawText({ buffer: req.file.buffer });
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

    res.json({
      id: driveResponse.data.id,
      name: driveResponse.data.name,
      mimeType: driveResponse.data.mimeType,
      sizeBytes: driveResponse.data.size ? parseInt(driveResponse.data.size, 10) : undefined,
      webViewLink: driveResponse.data.webViewLink,
      downloadLink: driveResponse.data.webContentLink || null,
      extractedText: extractedText || undefined,
    });

  } catch (error) {
    console.error('Error uploading to Google Drive:', error);
    res.status(500).send(`Error uploading to Google Drive: ${error.message}`);
  }
});

app.post('/delete', express.json(), async (req, res) => {
  const { fileId } = req.body;
  if (!fileId) return res.status(400).send('Missing fileId');
  try {
    await drive.files.delete({ fileId });
    res.json({ success: true });
  } catch (error) {
    res.status(500).send(`Error deleting file from Google Drive: ${error.message}`);
  }
});

app.post('/read', express.json(), async (req, res) => {
  const { fileId } = req.body;
  if (!fileId) {
    return res.status(400).send('File ID is required');
  }

  try {
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

    res.json({ content });
  } catch (error) {
    console.error('Error reading file from Google Drive:', error);
    res.status(500).send(`Error reading file from Google Drive: ${error.message}`);
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
}); 