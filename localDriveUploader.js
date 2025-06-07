import express from 'express';
import multer from 'multer';
import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import cors from 'cors';
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
const port = 3001; // You can change this port if needed

// --- CONFIGURATION ---
// IMPORTANT: Create a folder in your Google Drive, get its ID (from the URL),
// and share it with your service account email: service-account@nbd-rms.iam.gserviceaccount.com (grant Editor permission)
const TARGET_GOOGLE_DRIVE_FOLDER_ID = '1WMmPS_dcfLO1us_jWywB1dg2oPsuZoUJ'; // Replace with your Google Drive folder ID
const PATH_TO_SERVICE_ACCOUNT_KEY = path.join(__dirname, 'service-account-key.json');
// --- END CONFIGURATION ---

if (TARGET_GOOGLE_DRIVE_FOLDER_ID === '10S__vSZ9ICoABjewvpmVPCTW0PBfLZtw') {
    console.error('\x1b[31m%s\x1b[0m', 'ERROR: Please configure TARGET_GOOGLE_DRIVE_FOLDER_ID in localDriveUploader.js');
    process.exit(1);
}
if (!fs.existsSync(PATH_TO_SERVICE_ACCOUNT_KEY)) {
    console.error('\x1b[31m%s\x1b[0m', `ERROR: Service account key file not found at ${PATH_TO_SERVICE_ACCOUNT_KEY}`);
    console.error('\x1b[33m%s\x1b[0m', 'Please ensure you have saved your service account JSON key as "service-account-key.json" in the project root.');
    process.exit(1);
}

app.use(cors());
app.use(express.json());

// Cấu hình multer để xử lý tên file tiếng Việt
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const auth = new google.auth.GoogleAuth({
    keyFile: PATH_TO_SERVICE_ACCOUNT_KEY,
    scopes: ['https://www.googleapis.com/auth/drive.file'], // or 'https://www.googleapis.com/auth/drive'
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
  // Nếu chưa có, tạo mới
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
    // Tạo worker Tesseract với đường dẫn đến tessdata
    worker = await createWorker({
      langPath: path.join(__dirname, 'tessdata'),
      logger: m => console.log(m)
    });
    
    // Load ngôn ngữ tiếng Việt
    await worker.loadLanguage('vie');
    await worker.initialize('vie');
    
    // Chuyển PDF thành hình ảnh
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const numPages = pdfDoc.getPageCount();
    let fullText = '';

    // Xử lý từng trang
    for (let i = 0; i < numPages; i++) {
      const page = pdfDoc.getPage(i);
      const { width, height } = page.getSize();
      
      // Render trang PDF thành PNG với độ phân giải cao
      const pngBytes = await page.renderToPng({
        width: width * 2, // Tăng độ phân giải
        height: height * 2
      });
      
      // Tối ưu hình ảnh trước khi OCR
      const optimizedImage = await sharp(pngBytes)
        .grayscale() // Chuyển sang ảnh đen trắng
        .normalize() // Cân bằng độ tương phản
        .sharpen() // Làm sắc nét
        .toBuffer();
      
      // Thực hiện OCR trên hình ảnh đã tối ưu
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

app.post('/upload-local', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }

    try {
        let moduleName = 'vanban';
        if (req.body && req.body.module) moduleName = req.body.module;
        if (req.query && req.query.module) moduleName = req.query.module;

        const subFolderId = await getOrCreateSubFolder(moduleName, TARGET_GOOGLE_DRIVE_FOLDER_ID);

        const fileName = iconv.decode(Buffer.from(req.file.originalname, 'latin1'), 'utf8');
        console.log('Original filename (fixed):', fileName);

        const fileMetadata = {
            name: fileName,
            parents: [subFolderId],
        };
        const media = {
            mimeType: req.file.mimetype,
            body: Readable.from(req.file.buffer),
        };

        // --- Trích xuất text nếu là PDF hoặc Word ---
        let extractedText = '';
        if (req.file.mimetype === 'application/pdf') {
            try {
                // Thử trích xuất text thông thường trước
                const pdfData = await pdfParse(req.file.buffer);
                extractedText = pdfData.text;

                // Nếu không có text hoặc text quá ngắn, thử dùng OCR
                if (!extractedText || extractedText.trim().length < 100) {
                    console.log('PDF có thể là file scan, đang thử OCR...');
                    extractedText = await processPdfWithOCR(req.file.buffer);
                }
            } catch (err) {
                console.error('Lỗi xử lý PDF:', err);
                // Thử OCR nếu trích xuất thông thường thất bại
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
        // --- End extract ---

        const driveResponse = await drive.files.create({
            resource: fileMetadata,
            media: media,
            fields: 'id, name, mimeType, webViewLink, size, webContentLink',
        });
        
        console.log('File uploaded to Drive:', driveResponse.data);
        const driveFileData = driveResponse.data;

        res.json({
            id: driveFileData.id,
            name: driveFileData.name,
            mimeType: driveFileData.mimeType,
            sizeBytes: driveFileData.size ? parseInt(driveFileData.size, 10) : undefined,
            webViewLink: driveFileData.webViewLink,
            downloadLink: driveFileData.webContentLink || null,
            extractedText: extractedText || undefined,
        });

    } catch (error) {
        console.error('Error uploading to Google Drive:', error.response ? error.response.data : error.message);
        res.status(500).send(`Error uploading to Google Drive: ${error.message}`);
    }
});

// Endpoint xóa file Google Drive
app.post('/delete-drive-file', express.json(), async (req, res) => {
  const { fileId } = req.body;
  if (!fileId) return res.status(400).send('Missing fileId');
  try {
    await drive.files.delete({ fileId });
    res.json({ success: true });
  } catch (error) {
    res.status(500).send(`Error deleting file from Google Drive: ${error.message}`);
  }
});

// Thêm endpoint đọc file từ Google Drive
app.post('/read-drive-file', async (req, res) => {
    const { fileId } = req.body;
    if (!fileId) {
        return res.status(400).send('File ID is required');
    }

    try {
        // Lấy thông tin file từ Drive
        const fileMetadata = await drive.files.get({
            fileId: fileId,
            fields: 'mimeType'
        });

        // Tải nội dung file
        const response = await drive.files.get({
            fileId: fileId,
            alt: 'media'
        }, {
            responseType: 'arraybuffer'
        });

        const buffer = Buffer.from(response.data);
        let content = '';

        // Xử lý nội dung dựa trên loại file
        if (fileMetadata.data.mimeType === 'application/pdf') {
            try {
                const pdfData = await pdfParse(buffer);
                content = pdfData.text;

                // Nếu không có text hoặc text quá ngắn, thử dùng OCR
                if (!content || content.trim().length < 100) {
                    console.log('PDF có thể là file scan, đang thử OCR...');
                    try {
                        content = await processPdfWithOCR(buffer);
                    } catch (ocrErr) {
                        console.error('Lỗi OCR khi đọc PDF:', ocrErr);
                        content = 'Không thể đọc nội dung file PDF (OCR thất bại)';
                    }
                }
            } catch (err) {
                console.error('Lỗi đọc PDF:', err);
                // Thử OCR nếu trích xuất thông thường thất bại
                try {
                    content = await processPdfWithOCR(buffer);
                } catch (ocrErr) {
                    console.error('Lỗi OCR khi đọc PDF:', ocrErr);
                    content = 'Không thể đọc nội dung file PDF (OCR thất bại)';
                }
            }
        } else if (
            fileMetadata.data.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
            fileMetadata.data.mimeType === 'application/msword'
        ) {
            try {
                const result = await mammoth.extractRawText({ buffer });
                content = result.value;
            } catch (err) {
                console.error('Lỗi đọc Word:', err);
                content = 'Không thể đọc nội dung file Word';
            }
        } else {
            content = 'Định dạng file không được hỗ trợ';
        }

        res.json({ content });
    } catch (error) {
        console.error('Error reading file from Drive:', error);
        res.status(500).send(`Error reading file: ${error.message}`);
    }
});

app.listen(port, () => {
    console.log(`Local Google Drive uploader server listening on http://localhost:${port}`);
    console.log(`Ensure TARGET_GOOGLE_DRIVE_FOLDER_ID is set to your target folder.`);
    console.log(`Service account key path: ${PATH_TO_SERVICE_ACCOUNT_KEY}`);
});
