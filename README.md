# Hướng dẫn sử dụng (Tiếng Việt)

## Giới thiệu
Đây là ứng dụng AI hiện đại sử dụng React, TypeScript và Google Gemini AI.

## Tính năng
- Tương tác AI với Google Gemini
- Quản lý và upload file
- Tích hợp Google API
- Kết nối cơ sở dữ liệu với Supabase

## Yêu cầu
- Node.js (nên dùng bản LTS mới nhất)
- Tài khoản Google Cloud có quyền truy cập Gemini API
- Tài khoản Supabase (nếu dùng database)

## Cài đặt và chạy dự án

1. **Clone repository:**
   ```bash
   git clone [repository-url]
   cd myworkpal-bqlnbđ
   ```

2. **Cài đặt thư viện:**
   ```bash
   npm install
   # Nếu cần, cài lại iconv-lite thủ công
   npm install iconv-lite
   ```

3. **Cấu hình biến môi trường:**
   - Tạo file `.env.local` ở thư mục gốc (hoặc copy từ `.env.example` nếu có)
   - Thêm các biến môi trường như sau:
     ```env
     VITE_GEMINI_API_KEY=your_gemini_api_key_here
     VITE_SUPABASE_URL=your_supabase_url_here
     VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
     VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
     VITE_GOOGLE_API_KEY=your_google_api_key_here
     # Thêm các biến khác nếu cần
     ```
   - Nếu chỉ dùng cá nhân, bạn có thể để trực tiếp key vào file này như ví dụ bên dưới.

4. **Chạy server backend Google Drive:**
   - Mở terminal mới tại thư mục dự án
   - Chạy lệnh:
     ```bash
     node localDriveUploader.js
     ```
   - Server này phải luôn chạy để sử dụng tính năng AI tóm tắt tài liệu và thao tác file.

5. **Chạy server phát triển:**
   ```bash
   npm run dev
   ```

6. **Build bản production:**
   ```bash
   npm run build
   ```

---

# MyWorkPal AI Studio

A modern AI-powered application built with React, TypeScript, and Google's Gemini AI.

## Features

- AI-powered interactions using Google's Gemini AI
- Modern React application with TypeScript
- File upload and management capabilities
- Integration with Google APIs
- Database integration with Supabase

## Prerequisites

- Node.js (Latest LTS version recommended)
- Google Cloud account with Gemini API access
- Supabase account (for database functionality)

## Setup Instructions

1. Clone the repository:
   ```bash
   git clone [repository-url]
   cd myworkpal-bqlnbđ
   ```

2. Install dependencies (including iconv-lite for Vietnamese filename support):
   ```bash
   npm install
   # Nếu cần, cài lại iconv-lite thủ công
   npm install iconv-lite
   ```

3. Configure environment variables:
   - Create a `.env.local` file in the root directory (or copy from `.env.example` if có)
   - Add your environment variables as below:
     ```env
     VITE_GEMINI_API_KEY=your_gemini_api_key_here
     VITE_SUPABASE_URL=your_supabase_url_here
     VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
     VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
     VITE_GOOGLE_API_KEY=your_google_api_key_here
     # Thêm các biến môi trường khác nếu cần
     ```
   - Nếu chỉ dùng cá nhân, bạn có thể để trực tiếp key vào file này như ví dụ bên dưới.

4. **Start the Google Drive backend server:**
   - Open a new terminal window/tab in the project root
   - Run the following command to enable file reading/uploading from Google Drive:
     ```
     node localDriveUploader.js
     ```
   - The server must be running at all times for AI document summarization and file operations to work.

5. Run the development server:
   ```bash
   npm run dev
   ```

6. Build for production:
   ```bash
   npm run build
   ```

## Technologies Used

- React 19
- TypeScript
- Vite
- Google Gemini AI
- Supabase
- Express.js
- Google APIs
- iconv-lite (for Vietnamese filename encoding support)

## Project Structure

- `/components` - React components
- `/hooks` - Custom React hooks
- `/services` - API and service integrations
- `App.tsx` - Main application component
- `types.ts` - TypeScript type definitions
- `constants.tsx` - Application constants

## Development

The project uses Vite as the build tool and development server. Key scripts:

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## License

[Add your license information here]
VITE_GEMINI_API_KEY=AIzaSyDCOeSEj5h7f32Ln4OUSwke5Z0Pcw4N61M