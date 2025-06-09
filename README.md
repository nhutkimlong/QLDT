# QLDT - Hệ thống Quản lý Tài liệu Thông minh

## Giới thiệu
QLDT là một ứng dụng web hiện đại được xây dựng để quản lý và xử lý tài liệu thông minh, tích hợp các công nghệ AI tiên tiến. Ứng dụng sử dụng React, TypeScript và Google Gemini AI để cung cấp trải nghiệm người dùng tốt nhất.

## Tính năng chính
- 🤖 Tương tác AI với Google Gemini để phân tích và xử lý tài liệu
- 📁 Quản lý tài liệu thông minh với khả năng upload và xử lý nhiều định dạng
- 🔍 OCR (Optical Character Recognition) với Tesseract.js
- 📊 Tích hợp với Google Drive API để lưu trữ và quản lý file
- 💾 Cơ sở dữ liệu Supabase cho việc lưu trữ thông tin
- 📝 Hỗ trợ nhiều định dạng tài liệu (PDF, DOCX, etc.)
- 🔐 Xác thực và phân quyền người dùng

## Yêu cầu hệ thống
- Node.js (phiên bản LTS mới nhất)
- Tài khoản Google Cloud với quyền truy cập:
  - Gemini API
  - Google Drive API
- Tài khoản Supabase
- Tesseract.js data files (được tải tự động qua script)

## Cài đặt

1. **Clone repository:**
   ```bash
   git clone https://github.com/nhutkimlong/QLDT.git
   cd QLDT
   ```

2. **Cài đặt dependencies:**
   ```bash
   npm install
   ```

3. **Cấu hình môi trường:**
   Tạo file `.env.local` với các biến môi trường sau:
   ```env
   VITE_GEMINI_API_KEY=your_gemini_api_key
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_GOOGLE_CLIENT_ID=your_google_client_id
   VITE_GOOGLE_API_KEY=your_google_api_key
   ```

4. **Khởi động server backend:**
   ```bash
   node localDriveUploader.js
   ```

5. **Chạy ứng dụng:**
   ```bash
   npm run dev
   ```

## Cấu trúc dự án
```
QLDT/
├── components/          # React components
├── hooks/              # Custom React hooks
├── services/           # API services và integrations
├── scripts/            # Utility scripts
├── test/              # Test files
├── tessdata/          # Tesseract OCR data
├── App.tsx            # Main application component
├── types.ts           # TypeScript type definitions
├── constants.tsx      # Application constants
├── init_schema.sql    # Database schema
└── localDriveUploader.js # Google Drive integration server
```

## Công nghệ sử dụng
- **Frontend:**
  - React 19
  - TypeScript
  - Vite
  - React Router DOM
  - Heroicons

- **Backend & Services:**
  - Express.js
  - Google Gemini AI
  - Google Drive API
  - Supabase
  - Tesseract.js
  - PDF.js
  - Mammoth (DOCX processing)

- **Development Tools:**
  - TypeScript
  - Vite
  - Node.js

## Scripts
- `npm run dev` - Khởi động development server
- `npm run build` - Build cho production
- `npm run preview` - Xem trước bản build
- `npm run postinstall` - Tự động tải Tesseract data files

## Bảo mật
- Không lưu trữ API keys trực tiếp trong code
- Sử dụng biến môi trường cho các thông tin nhạy cảm
- Xác thực người dùng qua Supabase
- Mã hóa dữ liệu trong quá trình truyền tải

## Đóng góp
Mọi đóng góp đều được hoan nghênh! Vui lòng tạo issue hoặc pull request để đóng góp vào dự án.

## Giấy phép
[Thêm thông tin giấy phép của bạn ở đây]