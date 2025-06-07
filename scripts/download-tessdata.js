import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

// Tạo thư mục tessdata nếu chưa tồn tại
const tessdataDir = path.join(rootDir, 'tessdata');
if (!fs.existsSync(tessdataDir)) {
  fs.mkdirSync(tessdataDir, { recursive: true });
}

// URL của file ngôn ngữ tiếng Việt (sử dụng raw content URL)
const vieUrl = 'https://raw.githubusercontent.com/tesseract-ocr/tessdata/main/vie.traineddata';
const viePath = path.join(tessdataDir, 'vie.traineddata');

// Hàm kiểm tra tính toàn vẹn của file
async function verifyFile(filePath) {
  try {
    const stats = await fs.promises.stat(filePath);
    // Kiểm tra kích thước file (ít nhất 1MB)
    if (stats.size < 1024 * 1024) {
      return false;
    }
    return true;
  } catch (error) {
    return false;
  }
}

// Hàm tải file với retry và xử lý redirect
async function downloadFile(url, filePath, maxRetries = 3) {
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      console.log(`Đang tải file ngôn ngữ tiếng Việt (lần thử ${retries + 1}/${maxRetries})...`);
      
      return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(filePath);
        
        const request = https.get(url, (response) => {
          // Xử lý redirect
          if (response.statusCode === 301 || response.statusCode === 302) {
            const redirectUrl = response.headers.location;
            console.log(`Đang chuyển hướng đến: ${redirectUrl}`);
            file.close();
            fs.unlinkSync(filePath);
            downloadFile(redirectUrl, filePath, maxRetries)
              .then(resolve)
              .catch(reject);
            return;
          }

          if (response.statusCode === 200) {
            response.pipe(file);
            
            file.on('finish', async () => {
              file.close();
              
              // Kiểm tra tính toàn vẹn của file
              const isValid = await verifyFile(filePath);
              if (isValid) {
                console.log('Đã tải xong file ngôn ngữ tiếng Việt.');
                resolve(true);
              } else {
                console.error('File tải về không hợp lệ, thử lại...');
                fs.unlinkSync(filePath);
                reject(new Error('Invalid file'));
              }
            });
          } else {
            reject(new Error(`HTTP Error: ${response.statusCode}`));
          }
        });

        request.on('error', (err) => {
          file.close();
          fs.unlinkSync(filePath);
          reject(err);
        });

        // Thêm timeout
        request.setTimeout(30000, () => {
          request.destroy();
          file.close();
          fs.unlinkSync(filePath);
          reject(new Error('Request timeout'));
        });
      });
    } catch (error) {
      retries++;
      if (retries === maxRetries) {
        console.error('Không thể tải file sau nhiều lần thử:', error.message);
        return false;
      }
      // Đợi 2 giây trước khi thử lại
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  return false;
}

// Hàm chính
async function main() {
  try {
    // Kiểm tra xem file đã tồn tại và hợp lệ chưa
    if (fs.existsSync(viePath)) {
      const isValid = await verifyFile(viePath);
      if (isValid) {
        console.log('File ngôn ngữ tiếng Việt đã tồn tại và hợp lệ.');
        return;
      } else {
        console.log('File hiện tại không hợp lệ, đang tải lại...');
        fs.unlinkSync(viePath);
      }
    }

    // Tải file mới
    const success = await downloadFile(vieUrl, viePath);
    if (!success) {
      throw new Error('Không thể tải file ngôn ngữ sau nhiều lần thử');
    }
  } catch (error) {
    console.error('Lỗi:', error.message);
    process.exit(1);
  }
}

// Chạy script
main(); 