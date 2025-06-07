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
   - Create a `.env.local` file in the root directory
   - Add your Gemini API key:
     ```
     GEMINI_API_KEY=your_api_key_here
     ```
   - Add your Supabase credentials if needed

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
